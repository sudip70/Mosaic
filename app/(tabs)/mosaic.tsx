import { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Modal, Dimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MosaicGrid } from '@/components/ui/MosaicGrid';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useChallenge } from '@/hooks/useChallenge';
import { useChallengeStore } from '@/store/useChallengeStore';
import { getArtwork, tierLabel, progressPhase, progressPct } from '@/lib/artworks';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { radius, spacing, layout, shadows, type Palette } from '@/lib/theme';
import { MosaicTileIcon } from '@/components/ui/MosaicTileIcon';
import { MosaicLogoIcon } from '@/components/ui/MosaicLogoIcon';
import { Camera as CameraIcon, ChevronRight, Check, Plus, Ellipsis, Play, Pin, RotateCcw, Trash2, ICON_STROKE, type LucideIcon } from '@/lib/icons';
import type { Challenge } from '@/types';

const SCREEN_W = Dimensions.get('window').width;
const CONTENT_W = SCREEN_W - layout.screenPadH * 2;

export default function MosaicScreen() {
  const { challenge, artwork, tier, compass, filledCount, isComplete } = useChallenge();
  const history = useChallengeStore((s) => s.history);
  const resume = useChallengeStore((s) => s.resume);
  const restart = useChallengeStore((s) => s.restart);
  const remove = useChallengeStore((s) => s.remove);
  const pin = useChallengeStore((s) => s.pin);
  const unpin = useChallengeStore((s) => s.unpin);
  const pinnedIds = useChallengeStore((s) => s.pinnedIds);
  const lastStroke = useChallengeStore((s) => s.lastStroke);
  const { trackScreen, track } = useAnalytics();
  const s = useThemedStyles(makeStyles);
  const { colors } = useTheme();

  const isPinned = !!challenge && pinnedIds.includes(challenge.id);
  // The early win: once the painting actually reads as itself (~40%, the
  // "Coming into focus" phase), surface that it's worth showing off — so the
  // reward arrives long before the last tile, not only at 100%.
  const showoffReady = !!challenge && !isComplete && challenge.totalTiles > 0
    && filledCount / challenge.totalTiles >= 0.4;
  function togglePin() {
    if (!challenge) return;
    if (isPinned) {
      unpin(challenge.id);
    } else {
      pin(challenge.id);
      track('mosaic_pinned', { status: challenge.status, tiles: challenge.totalTiles });
    }
  }

  // Per-tile options menu anchored to the 3-dot button's screen position.
  type MenuAnchor = { challenge: Challenge; x: number; y: number; w: number; h: number };
  const [menuFor, setMenuFor] = useState<MenuAnchor | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'restart' | 'delete'; challenge: Challenge } | null>(null);

  useEffect(() => { trackScreen('mosaic'); }, []);

  // Completion is handled atomically in the store the moment the final tile is
  // filled (fillStroke), so it no longer depends on this screen being mounted.

  const open = (id: string) =>
    router.push({ pathname: '/challenge/[id]', params: { id } });

  return (
    <AppScreen>
      <ScreenHeader
        wordmark="Mosaic"
        right={
          challenge
            ? { icon: Plus, accessibilityLabel: 'Start a new mosaic', onPress: () => router.push('/challenge/setup') }
            : undefined
        }
      />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {challenge && artwork ? (
          <Pressable onPress={() => open(challenge.id)} accessibilityRole="button" accessibilityLabel="Open mosaic">
            <Card padded={false} elevation={2} style={s.activeCard}>
              <View style={s.gridWrap}>
                <MosaicGrid
                  width={CONTENT_W - spacing.sm * 2}
                  cols={challenge.cols}
                  rows={challenge.rows}
                  targetColors={tier?.colors ?? []}
                  filled={challenge.filled}
                  highlight={lastStroke?.challengeId === challenge.id ? lastStroke.indices : undefined}
                  mode="progress"
                />
              </View>
              {/* One-tap pin: feature this ongoing mosaic on the profile. Its own
                  Pressable wins the touch, so tapping the pin never opens the card.
                  Dark scrim circle so it reads over any tile; accent fill once pinned. */}
              <Pressable
                onPress={togglePin}
                style={[s.pinCorner, isPinned ? s.pinCornerOn : s.pinCornerOff]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityState={{ selected: isPinned }}
                accessibilityLabel={isPinned ? 'Unpin from your profile' : 'Pin to your profile'}
              >
                <Pin size={15} color={isPinned ? colors.onAccent : '#fff'} strokeWidth={ICON_STROKE} />
              </Pressable>
              <View style={s.metaRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="title" numberOfLines={1}>{challenge.artworkTitle}</AppText>
                  <AppText variant="caption">
                    {tierLabel(challenge.totalTiles)} · {progressPhase(filledCount, challenge.totalTiles)}
                  </AppText>
                  {showoffReady && (
                    <View style={s.showoffPill}>
                      <AppText variant="sub" color={colors.accent}>Ready to show off</AppText>
                    </View>
                  )}
                </View>
                <ChevronRight size={20} color={colors.ink30} strokeWidth={ICON_STROKE} />
              </View>
              {/* The painting itself is the real progress meter; this slim bar
                  echoes momentum without ever quoting a scary "x of 3000". A small
                  floor keeps early progress visible even on huge mosaics. */}
              <View style={s.progressTrack}>
                <View
                  style={[
                    s.progressFill,
                    { width: `${progressPct(filledCount, challenge.totalTiles)}%` },
                  ]}
                />
              </View>
            </Card>
          </Pressable>
        ) : (
          <Card padded elevation={2} style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: colors.accentSoft }]}>
              <MosaicTileIcon size={26} color={colors.ink60} />
            </View>
            <AppText variant="display" style={s.emptyTitle}>Build a painting{'\n'}from your days</AppText>
            <AppText variant="body" style={s.emptyBody}>
              Pick a painting. Each photo you take paints a stroke — its colour finds
              the tiles where it belongs. Go at your own pace; finish and the painting
              is yours, rebuilt from what you saw.
            </AppText>
          </Card>
        )}

        {/* Capture prompt while a run is live. The compass names the colour the
            painting needs most; on compass runs it's a nudge (any colour still
            lands where it belongs), on hunt runs it's the assignment. */}
        {challenge && !isComplete && (
          <Card padded>
            <View style={s.promptRow}>
              {compass ? (
                <View style={[s.swatch, { backgroundColor: compass.hex }]} />
              ) : (
                <View style={[s.swatch, s.strokeIcon]}>
                  <CameraIcon size={20} color={colors.ink60} strokeWidth={ICON_STROKE} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AppText variant="overline">
                  {compass
                    ? challenge.mode === 'hunt' ? 'Find this colour' : 'The painting needs'
                    : 'Today’s stroke'}
                </AppText>
                <AppText variant="title">{compass ? compass.name : 'Any colour counts'}</AppText>
              </View>
              <Pressable
                style={[s.captureBtn, { backgroundColor: colors.ink100 }]}
                onPress={() => router.push({ pathname: '/camera', params: { mode: 'mosaic', challengeId: challenge.id } })}
                accessibilityRole="button"
                accessibilityLabel="Capture a stroke"
              >
                <AppText variant="bodyMd" color={colors.onAccent}>Capture</AppText>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Set-aside + finished mosaics */}
        {history.length > 0 && (
          <>
            <AppText variant="overline" style={s.sectionLabel}>Your mosaics</AppText>
            <View style={s.historyGrid}>
              {history.map((c) => (
                <HistoryTile
                  key={c.id}
                  challenge={c}
                  onPress={() => open(c.id)}
                  onMenu={(x, y, w, h) => setMenuFor({ challenge: c, x, y, w, h })}
                  s={s}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {!challenge && (
        <View style={s.footer}>
          <PrimaryButton
            label="Start a mosaic"
            sublabel="Choose a painting and its detail"
            icon={MosaicLogoIcon}
            onPress={() => router.push('/challenge/setup')}
          />
        </View>
      )}

      {/* Per-mosaic options menu — floats below the 3-dot button, over the mosaic */}
      <Modal visible={!!menuFor} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuFor(null)}>
          {menuFor && (
            <Pressable
              style={[s.menuCard, {
                top:   menuFor.y + menuFor.h + 6,
                // right-align with the button's right edge so it sits over the tile
                right: SCREEN_W - (menuFor.x + menuFor.w) + 4,
              }]}
              onPress={() => {}}
            >
              {/* Resume only applies to set-aside runs; a completed one can
                  only be replayed via Start over. */}
              {menuFor.challenge.status !== 'completed' && (
                <MenuRow
                  icon={Play}
                  label="Resume"
                  onPress={() => { const c = menuFor.challenge; setMenuFor(null); resume(c.id); }}
                  s={s}
                  colors={colors}
                />
              )}
              <MenuRow
                icon={RotateCcw}
                label="Start over"
                onPress={() => { const c = menuFor.challenge; setMenuFor(null); setConfirm({ kind: 'restart', challenge: c }); }}
                s={s}
                colors={colors}
              />
              <MenuRow
                icon={Trash2}
                label="Delete"
                danger
                onPress={() => { const c = menuFor.challenge; setMenuFor(null); setConfirm({ kind: 'delete', challenge: c }); }}
                s={s}
                colors={colors}
              />
            </Pressable>
          )}
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={confirm?.kind === 'restart'}
        title="Start this mosaic over?"
        body="Every filled tile is cleared and the run begins again from scratch. This can’t be undone."
        confirmLabel="Start over"
        tone="danger"
        onConfirm={() => { if (confirm) restart(confirm.challenge.id); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm?.kind === 'delete'}
        title="Delete this mosaic?"
        body="The mosaic and all its filled tiles are removed for good. This can’t be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { if (confirm) remove(confirm.challenge.id); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </AppScreen>
  );
}

function MenuRow({
  icon: Icon, label, danger, onPress, s, colors,
}: {
  icon: LucideIcon; label: string; danger?: boolean; onPress: () => void;
  s: ReturnType<typeof makeStyles>; colors: Palette;
}) {
  const tint = danger ? '#E0584F' : colors.ink100;
  return (
    <Pressable
      style={({ pressed }) => pressed ? s.menuRowPressed : undefined}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={s.menuRow}>
        <Icon size={16} color={tint} strokeWidth={ICON_STROKE} />
        <AppText variant="label" color={tint} numberOfLines={1}>{label}</AppText>
      </View>
    </Pressable>
  );
}

function HistoryTile({ challenge, onPress, onMenu, s }: {
  challenge: Challenge; onPress: () => void;
  onMenu: (x: number, y: number, w: number, h: number) => void;
  s: ReturnType<typeof makeStyles>;
}) {
  const { colors } = useTheme();
  const btnRef = useRef<View>(null);
  const artwork = getArtwork(challenge.artworkId);
  const tier = artwork?.tiers[challenge.tier];
  const tileW = (CONTENT_W - spacing.sm) / 2;

  function openMenu() {
    btnRef.current?.measureInWindow((x, y, w, h) => onMenu(x, y, w, h));
  }

  return (
    <Pressable style={s.historyCell} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${challenge.artworkTitle} mosaic`}>
      {/* Progress mode draws filled tiles from `challenge.filled` and the grid
          shape from cols/rows — both stored on the challenge — so it renders even
          for runs whose tier predates the current artwork data. */}
      <MosaicGrid
        width={tileW}
        cols={challenge.cols}
        rows={challenge.rows}
        targetColors={tier?.colors ?? []}
        filled={challenge.filled}
        mode="progress"
      />
      <Pressable
        ref={btnRef}
        style={s.tileMenuBtn}
        onPress={openMenu}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Options for ${challenge.artworkTitle}`}
      >
        <Ellipsis size={16} color="#fff" strokeWidth={ICON_STROKE} />
      </Pressable>
      <View style={s.historyMeta}>
        {challenge.status === 'completed' && <Check size={12} color={colors.ink60} strokeWidth={ICON_STROKE} />}
        <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>{challenge.artworkTitle}</AppText>
      </View>
      {challenge.status !== 'completed' && (
        <AppText variant="sub" color={colors.ink30}>
          Set aside · {progressPhase(Object.keys(challenge.filled).length, challenge.totalTiles)}
        </AppText>
      )}
    </Pressable>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadH, paddingBottom: spacing.lg, gap: layout.cardGap },

  activeCard: { padding: spacing.sm },
  gridWrap: { alignItems: 'center' },
  pinCorner: {
    position: 'absolute', top: spacing.sm + 6, right: spacing.sm + 6,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  pinCornerOff: { backgroundColor: 'rgba(0,0,0,0.5)' },
  pinCornerOn: { backgroundColor: c.accent },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  progressTrack: {
    height: 4, borderRadius: radius.full, backgroundColor: c.ink15,
    marginTop: spacing.sm, marginBottom: spacing.xs, marginHorizontal: spacing.xs, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: c.accent },
  showoffPill: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: c.accentSoft, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },

  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { textAlign: 'center' },
  emptyBody: { textAlign: 'center', lineHeight: 21, color: c.ink60 },

  promptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  swatch: { width: 44, height: 44, borderRadius: radius.r12, borderWidth: 1, borderColor: c.ink15 },
  strokeIcon: { alignItems: 'center', justifyContent: 'center', backgroundColor: c.accentSoft, borderWidth: 0 },
  captureBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },

  sectionLabel: { marginTop: spacing.sm },
  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  historyCell: { width: (CONTENT_W - spacing.sm) / 2, gap: spacing.xs },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tileMenuBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  footer: {
    paddingHorizontal: layout.screenPadH, paddingTop: spacing.sm, paddingBottom: spacing.md,
    backgroundColor: c.canvas,
  },

  // Options menu — compact popup anchored to the 3-dot button, floats over the tile.
  menuCard: {
    position: 'absolute',
    minWidth: 130,
    backgroundColor: c.surface0, borderRadius: radius.r12,
    borderWidth: 1, borderColor: c.ink15,
    paddingVertical: spacing.xs,
    overflow: 'hidden', ...shadows.elev3,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 8, paddingHorizontal: spacing.md,
  },
  menuRowPressed: { backgroundColor: c.accent08 },
});
