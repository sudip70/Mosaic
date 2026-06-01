import { View, Text } from 'react-native';

interface ColorSwatchProps {
  hex: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizes = { sm: 40, md: 80, lg: 140 };

export function ColorSwatch({
  hex,
  name,
  size = 'md',
  showLabel = true,
}: ColorSwatchProps) {
  const dim = sizes[size];
  return (
    <View className="items-center gap-2">
      <View
        style={{ backgroundColor: hex, width: dim, height: dim }}
        className="rounded-2xl shadow-sm"
      />
      {showLabel && (
        <Text className="text-sm text-gray-500 font-medium">{name}</Text>
      )}
    </View>
  );
}
