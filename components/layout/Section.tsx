import { View, ViewProps } from 'react-native';

interface SectionProps extends ViewProps {
  children: React.ReactNode;
}

export function Section({ children, className, ...rest }: SectionProps) {
  return (
    <View className={`px-5 py-4 ${className ?? ''}`} {...rest}>
      {children}
    </View>
  );
}
