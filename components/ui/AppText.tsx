import { Text, TextProps, StyleSheet } from 'react-native';
import { type } from '@/lib/theme';

type Variant = keyof typeof type;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  children: React.ReactNode;
}

/**
 * The single text primitive for the whole app. Pulls its style from the
 * typography scale in theme.ts so every label/heading is consistent.
 * Override colour per-instance with the `color` prop (e.g. on coloured swatches).
 */
export function AppText({ variant = 'body', color, style, children, ...rest }: AppTextProps) {
  return (
    <Text style={[type[variant], color ? { color } : null, style]} {...rest}>
      {children}
    </Text>
  );
}

// Re-export for screens that want raw style objects
export const textStyles = StyleSheet.create(type as any);
