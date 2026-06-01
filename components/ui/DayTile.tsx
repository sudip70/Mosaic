import { Pressable, View } from 'react-native';

interface DayTileProps {
  hex: string;
  hasPhotos: boolean;
  isToday: boolean;
  onPress: () => void;
  size?: number;
}

export function DayTile({
  hex,
  hasPhotos,
  isToday,
  onPress,
  size = 40,
}: DayTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size }}
      className="rounded-md overflow-hidden"
    >
      <View
        style={{ backgroundColor: hasPhotos ? hex : hex + '33' }}
        className={`flex-1 ${isToday ? 'border-2 border-white' : ''}`}
      />
    </Pressable>
  );
}
