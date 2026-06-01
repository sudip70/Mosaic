import { View } from 'react-native';
import { Typography } from './Typography';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-8">
      <Typography variant="subtitle">{title}</Typography>
      {subtitle && (
        <Typography variant="caption" className="text-center">
          {subtitle}
        </Typography>
      )}
    </View>
  );
}
