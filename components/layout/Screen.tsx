import { SafeAreaView, ScrollView, View, ViewProps } from 'react-native';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
}

export function Screen({ children, scroll = false, className, ...rest }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${className ?? ''}`} {...rest}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
