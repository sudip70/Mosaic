import { Pressable, Image, View } from 'react-native';

interface PhotoTileProps {
  url: string;
  onPress?: () => void;
  size?: number;
}

export function PhotoTile({ url, onPress, size = 120 }: PhotoTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size }}
      accessibilityRole="imagebutton"
      accessibilityLabel="Photo"
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size }}
          className="rounded-xl"
          resizeMode="cover"
        />
      ) : (
        <View
          style={{ width: size, height: size }}
          className="rounded-xl bg-gray-100"
        />
      )}
    </Pressable>
  );
}
