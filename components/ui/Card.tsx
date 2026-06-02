import { View, ViewProps, StyleSheet } from 'react-native';
import { radius, shadows, layout, type Palette } from '@/lib/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface CardProps extends ViewProps {
  /** Elevation level — maps to the shadow scale. Default 1. */
  elevation?: 1 | 2 | 3;
  /** Apply the standard 16px internal padding. Default true. */
  padded?: boolean;
  children: React.ReactNode;
}

/**
 * The surface card primitive — warm off-white fill, hairline border, soft
 * shadow. Used everywhere a block of content sits on the canvas.
 */
export function Card({ elevation = 1, padded = true, style, children, ...rest }: CardProps) {
  const s = useThemedStyles(makeStyles);
  const shadow = elevation === 3 ? shadows.elev3 : elevation === 2 ? shadows.elev2 : shadows.elev1;
  return (
    <View style={[s.card, shadow, padded && s.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  card: {
    backgroundColor: c.surface0,
    borderRadius: radius.r20,
    borderWidth: 1,
    borderColor: c.ink15,
  },
  padded: { padding: layout.cardPad },
});
