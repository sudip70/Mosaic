import { useState } from 'react';
import { View, ScrollView, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ArtworkCard } from '@/components/ui/ArtworkCard';
import { MosaicGrid } from '@/components/ui/MosaicGrid';
import { ARTWORKS, TIER_TARGETS, tierLabel, createChallenge } from '@/lib/artworks';
import { useChallengeStore } from '@/store/useChallengeStore';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { radius, spacing, layout, type Palette } from '@/lib/theme';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MosaicTileIcon } from '@/components/ui/MosaicTileIcon';
import { ChevronLeft, Plus, ListOrdered, Shuffle, ICON_STROKE } from '@/lib/icons';
import type { TileOrder } from '@/types';

const PREVIEW_W = Dimensions.get('window').width - layout.screenPadH * 2;
const CARD_W = 150; // horizontal carousel card width

export default function ChallengeSetupScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const start = useChallengeStore((st) => st.start);

  // Preselect the first painting so the screen lands on a full, lived-in state
  // (preview + detail + order) rather than an empty picker.
  const [artworkId, setArtworkId] = useState<string | null>(ARTWORKS[0]?.id ?? null);
  const [tier, setTier] = useState<number>(1000);
  const [order, setOrder] = useState<TileOrder>('sequential');
  const [comingSoonVisible, setComingSoonVisible] = useState(false);

  const artwork = ARTWORKS.find((a) => a.id === artworkId) ?? null;
  const tierData = artwork ? artwork.tiers[tier] : null;

  function begin() {
    if (!artwork) return;
    start(createChallenge(artwork, tier, order));
    router.back();
  }

  function comingSoon() {
    setComingSoonVisible(true);
  }

  return (
    <AppScreen>
      <ScreenHeader
        title="New mosaic"
        left={{ icon: ChevronLeft, accessibilityLabel: 'Back', onPress: () => router.back() }}
        right={{ icon: Plus, accessibilityLabel: 'Create a custom mosaic', onPress: comingSoon }}
      />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* 1 — Pick an artwork */}
        <AppText variant="overline" style={s.step}>Choose a painting</AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pickerRow}
          style={s.pickerScroll}
        >
          {ARTWORKS.map((a) => (
            <ArtworkCard key={a.id} artwork={a} width={CARD_W} selected={a.id === artworkId} onPress={() => setArtworkId(a.id)} />
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
                <AppText variant="title">{tierData.tiles} tiles · {tierLabel(tierData.tiles)}</AppText>
                <AppText variant="caption">One tile per photo · fill at your own pace</AppText>
              </View>
            </Card>

            <View style={s.tierRow}>
              {TIER_TARGETS.map((t) => {
                const active = t === tier;
                return (
                  <Pressable
                    key={t}
                    style={[s.tierChip, active && { backgroundColor: colors.ink100, borderColor: colors.ink100 }]}
                    onPress={() => setTier(t)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <AppText variant="bodyMd" color={active ? colors.onAccent : colors.ink100}>{t}</AppText>
                    <AppText variant="sub" color={active ? 'rgba(255,255,255,0.7)' : colors.ink30}>tiles</AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* 3 — Tile order */}
            <AppText variant="overline" style={s.step}>How it builds</AppText>
            <View style={s.orderRow}>
              <OrderOption
                label="In order"
                hint="Top to bottom"
                icon={ListOrdered}
                active={order === 'sequential'}
                onPress={() => setOrder('sequential')}
                s={s}
                colors={colors}
              />
              <OrderOption
                label="Shuffled"
                hint="Emerges slowly"
                icon={Shuffle}
                active={order === 'random'}
                onPress={() => setOrder('random')}
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
          sublabel={artwork ? `${artwork.title} · ${tierData?.tiles} tiles` : 'Pick a painting first'}
          icon={MosaicTileIcon}
          onPress={begin}
          disabled={!artwork}
        />
      </View>

      <ConfirmDialog
        visible={comingSoonVisible}
        icon="🎨"
        title="Custom mosaic"
        body="Bringing your own painting or photo to build a mosaic from is coming soon."
        confirmLabel="Got it"
        onConfirm={() => setComingSoonVisible(false)}
      />
    </AppScreen>
  );
}

function OrderOption({
  label, hint, icon: Icon, active, onPress, s, colors,
}: {
  label: string; hint: string; icon: typeof ListOrdered; active: boolean; onPress: () => void;
  s: ReturnType<typeof makeStyles>; colors: Palette;
}) {
  return (
    <Pressable
      style={[s.orderOpt, active && { borderColor: colors.ink100, backgroundColor: colors.accentSoft }]}
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

  previewWrap: { alignItems: 'center' },
  previewMeta: { marginTop: spacing.md, gap: 2 },

  tierRow: { flexDirection: 'row', gap: spacing.xs },
  tierChip: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: 2,
    borderRadius: radius.r12, borderWidth: 1, borderColor: c.ink15, backgroundColor: c.surface0,
  },

  orderRow: { flexDirection: 'row', gap: spacing.sm },
  orderOpt: {
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
