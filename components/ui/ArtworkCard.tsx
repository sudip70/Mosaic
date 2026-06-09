import { Pressable, View, Image, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { radius, shadows, spacing, type Palette } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ArtworkMeta } from '@/lib/artworks';

interface ArtworkCardProps {
  artwork: ArtworkMeta;
  /** Card width in px — the image is rendered as a square of this size. */
  width: number;
  selected?: boolean;
  onPress: () => void;
}

export function ArtworkCard({ artwork, width, selected, onPress }: ArtworkCardProps) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <Pressable
      style={[s.card, { width }, selected && { borderColor: colors.ink100, borderWidth: 2 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${artwork.title} by ${artwork.artist}`}
    >
      <Image source={artwork.image} style={{ width: width - 2, height: width - 2, backgroundColor: colors.surface2 }} resizeMode="cover" />
      <View style={s.meta}>
        <AppText variant="bodyMd" numberOfLines={1}>{artwork.title}</AppText>
        <AppText variant="caption" numberOfLines={1}>{artwork.artist}</AppText>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  card: {
    borderRadius: radius.r16,
    borderWidth: 1,
    borderColor: c.ink15,
    backgroundColor: c.surface0,
    overflow: 'hidden',
    ...shadows.elev1,
  },
  meta: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 1 },
});
