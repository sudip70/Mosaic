import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { radius, fonts } from '@/lib/theme';

interface ToastProps {
  message: string | null;
  /** Distance from the bottom of the screen, in px. */
  bottomOffset: number;
}

// A transient, centred status pill (e.g. "3 photos deleted"). Renders nothing
// when there's no message. Shared by the multi-select flows on Today/Grid/Day.
export function Toast({ message, bottomOffset }: ToastProps) {
  if (!message) return null;
  return (
    <View style={[s.toast, { bottom: bottomOffset }]} pointerEvents="none">
      <AppText style={s.toastText}>{message}</AppText>
    </View>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute', alignSelf: 'center',
    backgroundColor: 'rgba(22,20,19,0.92)', borderRadius: radius.full,
    paddingHorizontal: 18, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  toastText: { fontFamily: fonts.sansMd, fontSize: 13, color: '#fff' },
});
