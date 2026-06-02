import { Text, TextProps } from 'react-native';
import { type, typeColorKey } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';

type Variant = keyof typeof type;

interface AppTextProps extends TextProps {
  variant?: Variant;
  /** Override the variant's default colour (e.g. on coloured surfaces). */
  color?: string;
  children: React.ReactNode;
}

/**
 * The single text primitive for the app. Size/font come from the typography
 * scale; colour resolves against the active theme (or the `color` override).
 */
export function AppText({ variant = 'body', color, style, children, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const resolved = color ?? colors[typeColorKey[variant]];
  return (
    <Text style={[type[variant], { color: resolved }, style]} {...rest}>
      {children}
    </Text>
  );
}
