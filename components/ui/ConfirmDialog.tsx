import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { fonts, radius, spacing, shadows, type Palette } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ConfirmDialogProps {
  visible: boolean;
  icon: string;
  iconBg?: string;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' = red confirm button; 'default' = dark ink button. */
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Themed confirmation dialog matching the app's design language — replaces the
 * native Alert for destructive/important confirmations.
 */
export function ConfirmDialog({
  visible, icon, iconBg, title, body,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'default',
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  const { colors, isDark } = useTheme();
  const s = useThemedStyles(makeStyles);
  const confirmBg = tone === 'danger' ? '#C62828' : isDark ? colors.surface2 : '#1A1714';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={onCancel}>
        <Pressable style={s.dialog} onPress={() => {}}>
          <View style={[s.iconWrap, { backgroundColor: iconBg ?? colors.surface1 }]}>
            <AppText style={s.iconText}>{icon}</AppText>
          </View>
          <AppText style={s.title}>{title}</AppText>
          <AppText style={s.body}>{body}</AppText>

          <View style={s.actions}>
            <Pressable style={s.btnWrap} onPress={onCancel}>
              {({ pressed }) => (
                <View style={[s.btn, s.cancel, pressed && s.pressed]}>
                  <AppText style={s.cancelText}>{cancelLabel}</AppText>
                </View>
              )}
            </Pressable>
            <Pressable style={s.btnWrap} onPress={onConfirm}>
              {({ pressed }) => (
                <View style={[s.btn, { backgroundColor: confirmBg }, pressed && s.pressed]}>
                  <AppText style={s.confirmText}>{confirmLabel}</AppText>
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  dialog: {
    width: '100%', maxWidth: 340,
    backgroundColor: c.surface0, borderRadius: radius.r24,
    padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: c.ink15, ...shadows.elev3,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  iconText: { fontSize: 24, lineHeight: 24, textAlign: 'center' },
  title: { fontFamily: fonts.serifR, fontSize: 22, color: c.ink100, letterSpacing: -0.4, textAlign: 'center' },
  body: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: c.ink60, textAlign: 'center' },

  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, alignSelf: 'stretch' },
  btnWrap: { flex: 1 },
  btn: { paddingVertical: 13, borderRadius: radius.r16, alignItems: 'center' },
  pressed: { opacity: 0.85 },
  cancel: { backgroundColor: c.surface1, borderWidth: 1, borderColor: c.ink15 },
  cancelText: { fontFamily: fonts.sansSb, fontSize: 15, color: c.ink100 },
  confirmText: { fontFamily: fonts.sansSb, fontSize: 15, color: '#fff' },
});
