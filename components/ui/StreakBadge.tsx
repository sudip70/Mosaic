import { View, Text } from 'react-native';

interface StreakBadgeProps {
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  return (
    <View className="flex-row items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full">
      <Text className="text-base">🔥</Text>
      <Text className="text-sm font-semibold text-orange-600">
        {count} day{count !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}
