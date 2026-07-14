import { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ArtworkCard } from '@/components/ui/ArtworkCard';
import { MosaicGrid } from '@/components/ui/MosaicGrid';
import { ARTWORKS, TIER_TARGETS, PHOTOS_PER_MOSAIC, tierLabel, tierBlurb, formatTileCount, createChallenge } from '@/lib/artworks';
import { createCustomArtwork, deleteCustomArtworkImage } from '@/lib/customArtwork';
import { reportError } from '@/lib/reportError';
import { useArtworkStore } from '@/store/useArtworkStore';
import { useChallengeStore } from '@/store/useChallengeStore';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { radius, spacing, layout, type Palette } from '@/lib/theme';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MosaicLogoIcon } from '@/components/ui/MosaicLogoIcon';
import { ChevronLeft, Plus, Compass, Crosshair, ICON_STROKE, type LucideIcon } from '@/lib/icons';
import type { ChallengeMode } from '@/types';

const PREVIEW_W = Dimensions.get('window').width - layout.screenPadH * 2;
const CARD_W = 150; // horizontal carousel card width
const TIER_CHIP_W = (PREVIEW_W - spacing.sm * 2) / 3; // three columns, two gaps between

export default function ChallengeSetupScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const start = useChallengeStore((st) => st.start);

  // Preselect the first painting so the screen lands on a full, lived-in state
  // (preview + detail + order) rather than an empty picker.
  const custom = useArtworkStore((st) => st.custom);
  const addCustom = useArtworkStore((st) => st.add);
  const removeCustom = useArtworkStore((st) => st.remove);

  const [artworkId, setArtworkId] = useState<string | null>(ARTWORKS[0]?.id ?? null);
  const [tier, setTier] = useState<number>(1000);
  const [captureMode, setCaptureMode] = useState<ChallengeMode>('compass');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Your own photos lead the shelf; the classics follow.
  const allArtworks = [...custom, ...ARTWORKS];
  const artwork = allArtworks.find((a) => a.id === artworkId) ?? null;
  const tierData = artwork ? artwork.tiers[tier] : null;

  function begin() {
    if (!artwork) return;
    // Placement is colour-matched at fill time; the sequential order only seeds
    // the fallback sequence used when tier colour data is missing.
    start(createChallenge(artwork, tier, 'sequential', captureMode));
    router.back();
  }

  // Photo → custom artwork: pick from the library, derive every tier's tile
  // colours on-device, and select it so the preview shows the result at once.
  async function pickCustom() {
    if (creating) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled) return;
    setCreating(true);
    try {
      const created = await createCustomArtwork(res.assets[0].uri, `My photo ${custom.length + 1}`);
      addCustom(created);
      setArtworkId(created.id);
    } catch (e) {
      reportError(e, { scope: 'createCustomArtwork' });
      setCreateError('Couldn’t build a mosaic from that photo. Try another one.');
    } finally {
      setCreating(false);
    }
  }

  function confirmDeleteCustom() {
    if (!deleteTarget) return;
    removeCustom(deleteTarget);
    void deleteCustomArtworkImage(deleteTarget);
    if (artworkId === deleteTarget) setArtworkId(ARTWORKS[0]?.id ?? null);
    setDeleteTarget(null);
  }

  return (
    <AppScreen>
      <ScreenHeader
        title="New mosaic"
        left={{ icon: ChevronLeft, accessibilityLabel: 'Back', onPress: () => router.back() }}
        right={{ icon: Plus, accessibilityLabel: 'Create a mosaic from your own photo', onPress: pickCustom }}
      />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* 1 — Pick an artwork (your own photos first, then the classics) */}
        <AppText variant="overline" style={s.step}>Choose a painting</AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pickerRow}
          style={s.pickerScroll}
        >
          {creating && (
            <View style={[s.creatingCard, { width: CARD_W }]}>
              <ActivityIndicator color={colors.ink60} />
              <AppText variant="caption">Reading colours…</AppText>
            </View>
          )}
          {allArtworks.map((a) => (
            <ArtworkCard
              key={a.id}
              artwork={a}
              width={CARD_W}
              selected={a.id === artworkId}
              onPress={() => setArtworkId(a.id)}
              onLongPress={a.id.startsWith('custom-') ? () => setDeleteTarget(a.id) : undefined}
            />
          ))}
        </ScrollView>

        {artwork && tierData && (
          <>
            {/* 2 — Detail level with live preview */}
            <AppText variant="overline" style={s.step}>Choose your detail</AppText>
            <Card padded elevation={2}>
              <View style={s.previewWrap}>
                <MosaicGrid
                  width={PREVIEW_W - layout.cardPad * 2}
                  cols={tierData.cols}
                  rows={tierData.rows}
                  targetColors={tierData.colors}
                  mode="preview"
                />
              </View>
              <View style={s.previewMeta}>
                <AppText variant="title">{tierLabel(tierData.tiles)}</AppText>
                <AppText variant="caption">{tierBlurb(tierData.tiles)}</AppText>
              </View>
            </Card>

            <View style={s.tierGrid}>
              {TIER_TARGETS.map((t) => {
                const active = t === tier;
                return (
                  <Pressable
                    key={t}
                    style={[s.tierChip, active && { backgroundColor: colors.ink100, borderColor: colors.ink100 }]}
                    onPress={() => setTier(t)}
                    accessibilityRole="button"
                    accessibilityLabel={`${tierLabel(t)}, about ${formatTileCount(t)} tiles`}
                    accessibilityState={{ selected: active }}
                  >
                    <AppText variant="bodyMd" color={active ? colors.onAccent : colors.ink100} numberOfLines={1}>
                      {tierLabel(t)}
                    </AppText>
                    <AppText
                      variant="sub"
                      color={active ? colors.onAccent : colors.ink30}
                      style={active ? s.tierChipSubActive : undefined}
                      numberOfLines={1}
                    >
                      ~{formatTileCount(t)} tiles
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Detail is purely visual — pace is the same on every rung. */}
            <AppText variant="caption" style={s.paceNote}>
              Every detail level finishes in about {PHOTOS_PER_MOSAIC} photos — finer
              tiles just paint with smaller strokes. Each photo lands where its colour
              belongs in the painting.
            </AppText>

            {/* 3 — Capture mode */}
            <AppText variant="overline" style={s.step}>How you capture</AppText>
            <View style={s.modeRow}>
              <ModeOption
                label="Compass"
                hint="Every colour counts"
                icon={Compass}
                active={captureMode === 'compass'}
                onPress={() => setCaptureMode('compass')}
                s={s}
                colors={colors}
              />
              <ModeOption
                label="Hunt"
                hint="Only matches fill"
                icon={Crosshair}
                active={captureMode === 'hunt'}
                onPress={() => setCaptureMode('hunt')}
                s={s}
                colors={colors}
              />
            </View>
          </>
        )}
      </ScrollView>

      <View style={[s.footer, { bottom: insets.bottom + spacing.lg }]} pointerEvents="box-none">
        <PrimaryButton
          label="Begin this mosaic"
          sublabel={artwork && tierData ? `${artwork.title} · ${tierLabel(tierData.tiles)}` : 'Pick a painting first'}
          icon={MosaicLogoIcon}
          onPress={begin}
          disabled={!artwork}
        />
      </View>

      <ConfirmDialog
        visible={!!createError}
        icon="🎨"
        title="Custom mosaic"
        body={createError ?? ''}
        confirmLabel="Got it"
        onConfirm={() => setCreateError(null)}
      />
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete this custom mosaic?"
        body="The photo's mosaic is removed from your shelf. Runs already built from it keep their filled tiles."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDeleteCustom}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppScreen>
  );
}

function ModeOption({
  label, hint, icon: Icon, active, onPress, s, colors,
}: {
  label: string; hint: string; icon: LucideIcon; active: boolean; onPress: () => void;
  s: ReturnType<typeof makeStyles>; colors: Palette;
}) {
  return (
    <Pressable
      style={[s.modeOpt, active && { borderColor: colors.ink100, backgroundColor: colors.accentSoft }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Icon size={20} color={active ? colors.ink100 : colors.ink30} strokeWidth={ICON_STROKE} />
      <View>
        <AppText variant="bodyMd">{label}</AppText>
        <AppText variant="caption">{hint}</AppText>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  scroll: { flex: 1 },
  // Bottom room so the last controls can scroll clear of the floating island.
  content: { paddingHorizontal: layout.screenPadH, paddingBottom: 120, gap: spacing.md },
  step: { marginTop: spacing.sm },

  pickerScroll: { marginHorizontal: -layout.screenPadH },
  pickerRow: { gap: spacing.sm, paddingHorizontal: layout.screenPadH },
  // Placeholder card shown while a custom photo's colours are being read.
  creatingCard: {
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderRadius: radius.r16, borderWidth: 1, borderColor: c.ink15,
    borderStyle: 'dashed', backgroundColor: c.surface0,
  },

  previewWrap: { alignItems: 'center' },
  previewMeta: { marginTop: spacing.md, gap: 2 },

  tierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  // Dim the count on the selected chip — using onAccent (not hardcoded white) so
  // it stays legible whatever colour ink100 resolves to in the active theme.
  tierChipSubActive: { opacity: 0.7 },
  tierChip: {
    width: TIER_CHIP_W, alignItems: 'center', gap: 2,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
    borderRadius: radius.r12, borderWidth: 1, borderColor: c.ink15, backgroundColor: c.surface0,
  },

  paceNote: { lineHeight: 18 },

  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeOpt: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.r16, borderWidth: 1, borderColor: c.ink15, backgroundColor: c.surface0,
  },

  // Floating "island" CTA — pinned above the content, which scrolls behind it.
  // No background bar; the button's own pill + shadow carry the surface.
  footer: {
    position: 'absolute', left: 0, right: 0,
    paddingHorizontal: layout.screenPadH,
  },
});
