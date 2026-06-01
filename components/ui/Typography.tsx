import { Text, TextProps } from 'react-native';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

const variantClasses: Record<Variant, string> = {
  display:  'text-4xl font-bold text-gray-900',
  title:    'text-2xl font-bold text-gray-900',
  subtitle: 'text-lg font-semibold text-gray-700',
  body:     'text-base text-gray-700',
  caption:  'text-sm text-gray-400',
  label:    'text-xs font-semibold uppercase tracking-wide text-gray-500',
};

interface TypographyProps extends TextProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Typography({
  variant = 'body',
  children,
  className,
  ...rest
}: TypographyProps) {
  return (
    <Text className={`${variantClasses[variant]}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Text>
  );
}
