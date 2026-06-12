import { useState } from 'react';
import { View, ScrollView, Pressable, Dimensions, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { MosaicGrid } from '@/components/ui/MosaicGrid';
import { useChallenge } from '@/hooks/useChallenge';
import { useChallengeStore } from '@/store/useChallengeStore';
import { getArtwork, tierLabel } from '@/lib/artworks';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing, layout, radius, type Palette } from '@/lib/theme';
import { ChevronLeft, Eye, EyeOff, Pin, ICON_STROKE } from '@/lib/icons';

const CONTENT_W = Dimensions.get('window').width - layout.screenPadH * 2;

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const active = useChallengeStore((s) => s.active);
  const history = useChallengeStore((s) => s.history);
  const setAside = useChallengeStore((s) => s.setAside);
  const resume = useChallengeStore((s) => s.resume);
  const restart = useChallengeStore((s) => s.restart);
  const remove = useChallengeStore((s) => s.remove);
  const pinnedId = useChallengeStore((s) => s.pinnedId);
  const pin = useChallengeStore((s) => s.pin);
  const unpin = useChallengeStore((s) => s.unpin);
  const { currentTileIndex } = useChallenge();
  const { track } = useAnalytics();
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);

  const [showOriginal, setShowOriginal] = useState(false);
  const [showSetAside, setShowSetAside] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const challenge = active?.id === id ? active : history.find((c) => c.id === id);
  const artwork = challenge ? getArtwork(challenge.artworkId) : undefined;
  // Tier colours may be absent for runs created before the current artwork data
  // (e.g. an old tile count). Progress + original views don't need them, so we
  // only require the challenge and artwork to render.
  const tier = challenge && artwork ? artwork.tiers[challenge.tier] : undefined;

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
  const isPinned = pinnedId === challengeId;
  const filledCount = Object.keys(challenge.filled).length;
  const statusText =
    isComplete ? 'Completed'
    : isActive ? 'In progress'
    : 'Set aside';

  function confirmSetAside() { setShowSetAside(true); }
  function confirmRestart() { setShowRestart(true); }
  function confirmDelete() { setShowDelete(true); }
  function togglePin() {
    if (!challenge) return;
    if (isPinned) {
      unpin();
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

        <View style={s.statsRow}>
          <Card style={s.stat} padded={false}>
            <AppText variant="serifLg">{filledCount}</AppText>
            <AppText variant="overline" style={s.statLabel}>Filled</AppText>
          </Card>
          <Card style={s.stat} padded={false}>
            <AppText variant="serifLg">{challenge.totalTiles}</AppText>
            <AppText variant="overline" style={s.statLabel}>Tiles</AppText>
          </Card>
          <Card style={s.stat} padded={false}>
            <AppText variant="serifLg" style={s.statStatus}>{statusText}</AppText>
            <AppText variant="overline" style={s.statLabel}>{tierLabel(challenge.totalTiles)}</AppText>
          </Card>
        </View>

        <AppText variant="caption" style={s.hint}>
          {isActive
            ? 'Tap the eye to peek at the painting you’re rebuilding. Each photo you take fills the next tile with the colour you find.'
            : canResume
            ? 'This run is set aside. Resume to carry on from the tile you were on, or start over to rebuild it from scratch.'
            : 'Every filled tile is the dominant colour of a photo you took that day.'}
        </AppText>

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
        onConfirm={() => { setShowRestart(false); restart(challengeId); router.back(); }}
        onCancel={() => setShowRestart(false)}
      />
      <ConfirmDialog
        visible={showDelete}
        title="Delete this mosaic?"
        body="The mosaic and all its filled tiles are removed for good. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { setShowDelete(false); remove(challengeId); router.back(); }}
        onCancel={() => setShowDelete(false)}
      />
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

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statLabel: { marginTop: 2 },
  statStatus: { fontSize: 16, lineHeight: 20 },

  hint: { lineHeight: 18, color: c.ink30 },

  actions: { gap: spacing.xs, marginTop: spacing.sm },
  resumeBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: radius.full,
  },
  linkBtn: { alignSelf: 'center', paddingVertical: spacing.sm, marginTop: spacing.sm },
});
