import { Pressable, Text, ActivityIndicator } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const styles: Record<Variant, string> = {
  primary:   'bg-blue-500',
  secondary: 'bg-gray-100',
  ghost:     'bg-transparent',
  danger:    'bg-red-500',
};

const textStyles: Record<Variant, string> = {
  primary:   'text-white',
  secondary: 'text-gray-800',
  ghost:     'text-blue-500',
  danger:    'text-white',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth,
}: ButtonProps) {
  const isInert = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInert, busy: loading }}
      className={`rounded-xl px-5 py-3 items-center ${styles[variant]} ${fullWidth ? 'w-full' : ''} ${isInert ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? '#1f2937' : 'white'}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text className={`font-semibold text-base ${textStyles[variant]}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
