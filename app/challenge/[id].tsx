import { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Dimensions, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { AppScreen } from '@/components/ui/AppScreen';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { MosaicGrid } from '@/components/ui/MosaicGrid';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useChallenge } from '@/hooks/useChallenge';
import { useChallengeStore } from '@/store/useChallengeStore';
import { MOSAIC_DIR } from '@/hooks/useUpload';
import { getArtwork, tierLabel, progressPhase, progressPct, formatTileCount } from '@/lib/artworks';
import { reportError } from '@/lib/reportError';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUpgradeNudge } from '@/hooks/useUpgradeNudge';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing, layout, radius, type Palette } from '@/lib/theme';
import { Camera, ChevronLeft, Download, Eye, EyeOff, Pin, Share2, ICON_STROKE } from '@/lib/icons';

// Off-screen render width for the exported image — high enough to read crisply
// when shared, independent of the on-screen grid size.
const EXPORT_W = 1080;

// Best-effort removal of a run's saved tile images — used when a run is restarted
// (its tiles are cleared) or deleted, so the files don't linger on the device.
async function clearTileImages(challengeId: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(`${MOSAIC_DIR}${challengeId}/`, { idempotent: true });
  } catch (e) {
    reportError(e, { scope: 'clearTileImages', challengeId });
  }
}

const CONTENT_W = Dimensions.get('window').width - layout.screenPadH * 2;

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const active = useChallengeStore((s) => s.active);
  const history = useChallengeStore((s) => s.history);
  const setAside = useChallengeStore((s) => s.setAside);
  const resume = useChallengeStore((s) => s.resume);
  const restart = useChallengeStore((s) => s.restart);
  const remove = useChallengeStore((s) => s.remove);
  const pinnedIds = useChallengeStore((s) => s.pinnedIds);
  const pin = useChallengeStore((s) => s.pin);
  const unpin = useChallengeStore((s) => s.unpin);
  const { currentTileIndex, todayColor: tileColor } = useChallenge();
  const { track } = useAnalytics();
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const [showOriginal, setShowOriginal] = useState(false);
  const [showSetAside, setShowSetAside] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Export: capture an off-screen, full-res render of the painting to an image.
  const shotRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const challenge = active?.id === id ? active : history.find((c) => c.id === id);
  const artwork = challenge ? getArtwork(challenge.artworkId) : undefined;
  // Tier colours may be absent for runs created before the current artwork data
  // (e.g. an old tile count). Progress + original views don't need them, so we
  // only require the challenge and artwork to render.
  const tier = challenge && artwork ? artwork.tiers[challenge.tier] : undefined;

  // Nudge toward an account right after a mosaic is finished — completedAt is
  // freshly stamped when the last tile lands (see useChallengeStore.fillNextTile),
  // so a recent timestamp means we got here straight from that capture, not from
  // browsing an old painting.
  const { promptUpgrade, nudge } = useUpgradeNudge();
  useEffect(() => {
    if (
      challenge?.status === 'completed' &&
      challenge.completedAt &&
      Date.now() - new Date(challenge.completedAt).getTime() < 15000
    ) {
      promptUpgrade({
        title: 'Mosaic complete',
        body: 'A finished piece deserves a permanent home. Add an email to keep your mosaics safe across devices.',
      });
    }
  }, [challenge?.status, challenge?.completedAt, promptUpgrade]);

  if (!challenge || !artwork) {
    return (
      <AppScreen>
        <ScreenHeader title="Mosaic" left={{ icon: ChevronLeft, accessibilityLabel: 'Back', onPress: () => router.back() }} />
        <View style={s.missing}>
          <AppText variant="body">This mosaic is no longer available.</AppText>
        </View>
      </AppScreen>
    );
  }

  const challengeId = challenge.id;
  const isActive = challenge.status === 'active';
  const isComplete = challenge.status === 'completed';
  const canResume = challenge.status === 'paused' || challenge.status === 'abandoned';
  const isPinned = pinnedIds.includes(challengeId);
  const filledCount = Object.keys(challenge.filled).length;
  const statusText =
    isComplete ? 'Completed'
    : isActive ? 'In progress'
    : 'Set aside';

  function confirmSetAside() { setShowSetAside(true); }
  function confirmRestart() { setShowRestart(true); }
  function confirmDelete() { setShowDelete(true); }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // Capture the off-screen high-res grid once, then either save it to the photo
  // library or open the share sheet. Reuses the same modules as the photo flows.
  async function exportImage(action: 'save' | 'share') {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await captureRef(shotRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (action === 'save') {
        const { granted } = await MediaLibrary.requestPermissionsAsync();
        if (!granted) { showToast('Photo library permission denied'); return; }
        await MediaLibrary.saveToLibraryAsync(uri);
        showToast('Saved to your photos');
      } else {
        if (!(await Sharing.isAvailableAsync())) { showToast('Sharing is not available on this device'); return; }
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your mosaic' });
      }
    } catch (e) {
      reportError(e, { scope: 'mosaicExport', challengeId, action });
      showToast(action === 'save' ? 'Could not save image' : 'Could not share image');
    } finally {
      setBusy(false);
    }
  }
  function togglePin() {
    if (!challenge) return;
    if (isPinned) {
      unpin(challengeId);
    } else {
      pin(challengeId);
      track('mosaic_pinned', { status: challenge.status, tiles: challenge.totalTiles });
    }
  }

  return (
    <AppScreen>
      <ScreenHeader title="Mosaic" left={{ icon: ChevronLeft, accessibilityLabel: 'Back', onPress: () => router.back() }} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.gridWrap}>
          <MosaicGrid
            width={CONTENT_W}
            cols={challenge.cols}
            rows={challenge.rows}
            targetColors={tier?.colors ?? []}
            filled={challenge.filled}
            currentTileIndex={isActive ? currentTileIndex : null}
            originalImage={artwork.image}
            mode={showOriginal ? 'original' : 'progress'}
          />
          <View style={s.gridBtns}>
            {/* Both buttons use the Mosaic tab's pin treatment: a dark scrim circle
                with a white icon, so they read over any tile. The pin swaps to an
                accent fill once pinned. */}
            <Pressable
              style={[s.gridBtn, isPinned ? s.gridBtnOn : s.gridBtnScrim]}
              onPress={togglePin}
              accessibilityRole="button"
              accessibilityState={{ selected: isPinned }}
              accessibilityLabel={isPinned ? 'Unpin this mosaic from your profile' : 'Pin this mosaic to your profile'}
            >
              <Pin size={16} color={isPinned ? colors.onAccent : '#fff'} strokeWidth={ICON_STROKE} />
            </Pressable>
            <Pressable
              style={[s.gridBtn, s.gridBtnScrim]}
              onPress={() => setShowOriginal((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={showOriginal ? 'Hide the original' : 'Peek at the original'}
            >
              {showOriginal
                ? <EyeOff size={16} color="#fff" strokeWidth={ICON_STROKE} />
                : <Eye size={16} color="#fff" strokeWidth={ICON_STROKE} />}
            </Pressable>
          </View>
        </View>

        <View style={s.titleBlock}>
          <AppText variant="display">{challenge.artworkTitle}</AppText>
          <AppText variant="caption">{challenge.artworkArtist} · {artwork.year}</AppText>
        </View>

        {/* Phase + bar lead; the real total stays discoverable but demoted to a
            faint caption so the scale informs without intimidating. */}
        <View style={s.progressBlock}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progressPct(filledCount, challenge.totalTiles)}%` }]} />
          </View>
          <AppText variant="sub" color={colors.ink30}>
            of ~{formatTileCount(challenge.totalTiles)} tiles
          </AppText>
        </View>

        <View style={s.statsRow}>
          <Card style={s.stat} padded={false}>
            <AppText variant="serifLg">{filledCount}</AppText>
            <AppText variant="overline" style={s.statLabel}>Tiles placed</AppText>
          </Card>
          <Card style={s.stat} padded={false}>
            <AppText variant="serifLg" style={s.statStatus} numberOfLines={2}>{progressPhase(filledCount, challenge.totalTiles)}</AppText>
            <AppText variant="overline" style={s.statLabel}>Progress</AppText>
          </Card>
          <Card style={s.stat} padded={false}>
            <AppText variant="serifLg" style={s.statStatus} numberOfLines={2}>{statusText}</AppText>
            <AppText variant="overline" style={s.statLabel}>{tierLabel(challenge.totalTiles)}</AppText>
          </Card>
        </View>

        <AppText variant="caption" style={s.hint}>
          {isActive
            ? 'Tap the eye to peek at the painting you’re rebuilding. Capture the next tile’s colour to fill it. One photo, one tile.'
            : canResume
            ? 'This run is set aside. Resume to carry on from the tile you were on, or start over to rebuild it from scratch.'
            : 'Every filled tile is the dominant colour of a photo you captured for it.'}
        </AppText>

        {isActive && (
          <PrimaryButton
            label={tileColor ? `Find ${tileColor.name}` : 'Capture next tile'}
            sublabel="Fill the next tile with a colour you find"
            icon={Camera}
            iconColor={tileColor?.hex}
            onPress={() =>
              router.push({ pathname: '/camera', params: { mode: 'mosaic', challengeId } })
            }
          />
        )}

        {/* Export the painting as an image — available at any progress. */}
        <View style={s.exportRow}>
          <Pressable
            style={[s.exportBtn, s.exportBtnOutline]}
            onPress={() => exportImage('save')}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Save mosaic image to your photos"
          >
            <Download size={16} color={colors.ink100} strokeWidth={ICON_STROKE} />
            <AppText variant="bodyMd" color={colors.ink100}>Save image</AppText>
          </Pressable>
          <Pressable
            style={[s.exportBtn, { backgroundColor: colors.ink100 }]}
            onPress={() => exportImage('share')}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Share mosaic image"
          >
            <Share2 size={16} color={colors.onAccent} strokeWidth={ICON_STROKE} />
            <AppText variant="bodyMd" color={colors.onAccent}>Share</AppText>
          </Pressable>
        </View>

        {isActive && (
          <Pressable onPress={confirmSetAside} style={s.linkBtn} hitSlop={8} accessibilityRole="button">
            <AppText variant="bodyMd" color={colors.ink30}>Set this mosaic aside</AppText>
          </Pressable>
        )}

        {canResume && (
          <View style={s.actions}>
            <Pressable
              style={[s.resumeBtn, { backgroundColor: colors.ink100 }]}
              onPress={() => { resume(challengeId); router.back(); }}
              accessibilityRole="button"
              accessibilityLabel="Resume this mosaic"
            >
              <AppText variant="label" color={colors.onAccent}>Resume where you left off</AppText>
            </Pressable>
            <Pressable onPress={confirmRestart} style={s.linkBtn} hitSlop={8} accessibilityRole="button">
              <AppText variant="bodyMd" color={colors.ink30}>Start over</AppText>
            </Pressable>
          </View>
        )}

        {isComplete && (
          <Pressable onPress={confirmRestart} style={s.linkBtn} hitSlop={8} accessibilityRole="button">
            <AppText variant="bodyMd" color={colors.ink30}>Start over</AppText>
          </Pressable>
        )}

        <Pressable onPress={confirmDelete} style={s.linkBtn} hitSlop={8} accessibilityRole="button">
          <AppText variant="bodyMd" color="#E0584F">Delete this mosaic</AppText>
        </Pressable>
      </ScrollView>

      {/* Off-screen, full-resolution render captured for image export. Positioned
          far off-screen (not hidden) so it lays out and captures reliably;
          collapsable={false} keeps it in the native tree on Android. */}
      <View ref={shotRef} collapsable={false} style={s.exportStage} pointerEvents="none">
        <MosaicGrid
          width={EXPORT_W}
          cols={challenge.cols}
          rows={challenge.rows}
          targetColors={tier?.colors ?? []}
          filled={challenge.filled}
          mode="progress"
          rounded={false}
        />
      </View>

      <Toast message={toast} bottomOffset={spacing.x3} />

      <ConfirmDialog
        visible={showSetAside}
        title="Set this mosaic aside?"
        body="Your filled tiles stay saved and you can pick it up again any time."
        confirmLabel="Set aside"
        cancelLabel="Keep going"
        onConfirm={() => { setShowSetAside(false); setAside(); router.back(); }}
        onCancel={() => setShowSetAside(false)}
      />
      <ConfirmDialog
        visible={showRestart}
        title="Start this mosaic over?"
        body="Every filled tile is cleared and the run begins again from scratch. This can't be undone."
        confirmLabel="Start over"
        tone="danger"
        onConfirm={() => { setShowRestart(false); void clearTileImages(challengeId); restart(challengeId); router.back(); }}
        onCancel={() => setShowRestart(false)}
      />
      <ConfirmDialog
        visible={showDelete}
        title="Delete this mosaic?"
        body="The mosaic and all its filled tiles are removed for good. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { setShowDelete(false); void clearTileImages(challengeId); remove(challengeId); router.back(); }}
        onCancel={() => setShowDelete(false)}
      />

      {nudge}
    </AppScreen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadH, paddingBottom: spacing.x3, gap: layout.cardGap },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.x3 },

  gridWrap: { marginTop: spacing.sm },
  gridBtns: {
    position: 'absolute', top: spacing.sm + 8, right: 8,
    flexDirection: 'row', gap: spacing.sm,
  },
  gridBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  gridBtnScrim: { backgroundColor: 'rgba(0,0,0,0.5)' },
  gridBtnOn: { backgroundColor: c.accent },

  titleBlock: { gap: 2 },

  progressBlock: { gap: spacing.xs },
  progressTrack: {
    height: 5, borderRadius: radius.full, backgroundColor: c.ink15, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: c.accent },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statLabel: { marginTop: 2 },
  statStatus: { fontSize: 16, lineHeight: 20 },

  hint: { lineHeight: 18, color: c.ink30 },

  // Export the painting as an image
  exportRow: { flexDirection: 'row', gap: spacing.sm },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.full,
  },
  exportBtnOutline: { borderWidth: 1, borderColor: c.ink15 },
  // Laid out but far off-screen so react-native-view-shot can capture it at full
  // resolution without it ever being visible.
  exportStage: { position: 'absolute', left: -10000, top: 0, width: EXPORT_W },

  actions: { gap: spacing.xs, marginTop: spacing.sm },
  resumeBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: radius.full,
  },
  linkBtn: { alignSelf: 'center', paddingVertical: spacing.sm, marginTop: spacing.sm },
});
