import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { AppText } from './AppText';
import { fonts, radius, spacing, shadows, type Palette } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ConfirmDialogProps {
  visible: boolean;
  icon?: string;
  iconBg?: string;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' = red confirm button; 'default' = dark ink button. */
  tone?: 'danger' | 'default';
  /** Optional info text shown in an Alert when the ℹ button is tapped. */
  info?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Themed confirmation dialog matching the app's design language — replaces the
 * native Alert for destructive/important confirmations.
 */
export function ConfirmDialog({
  visible, icon, iconBg, title, body, info,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'default',
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  const { colors, isDark } = useTheme();
  const s = useThemedStyles(makeStyles);
  const confirmBg = tone === 'danger' ? '#C62828' : isDark ? colors.surface2 : '#1A1714';
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={showInfo ? () => setShowInfo(false) : onCancel}
    >
      <Pressable style={s.backdrop} onPress={showInfo ? () => setShowInfo(false) : onCancel}>

        {showInfo ? (
          // Info card — swaps in place of the confirm dialog
          <Pressable style={s.infoCard} onPress={() => {}}>
            <AppText style={s.infoCardText}>{info}</AppText>
            <Pressable
              style={[s.infoCardBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowInfo(false)}
            >
              <AppText style={s.infoCardBtnText}>Got it</AppText>
            </Pressable>
          </Pressable>
        ) : (
          // Main confirm dialog
          <Pressable style={s.dialog} onPress={() => {}}>
            {icon ? (
              <View style={[s.iconWrap, { backgroundColor: iconBg ?? colors.surface1 }]}>
                <AppText style={s.iconText}>{icon}</AppText>
              </View>
            ) : null}
            <AppText style={s.title}>{title}</AppText>
            <View style={s.bodyRow}>
              <AppText style={s.body}>{body}</AppText>
              {info && (
                <Pressable
                  onPress={() => setShowInfo(true)}
                  hitSlop={8}
                  accessibilityLabel="More information"
                  accessibilityRole="button"
                >
                  <AppText style={[s.infoBtn, { color: colors.ink30 }]}>ⓘ</AppText>
                </Pressable>
              )}
            </View>
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
        )}

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
    paddingHorizontal: spacing.xxl, paddingTop: spacing.x3, paddingBottom: spacing.xl,
    alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: c.ink15, ...shadows.elev3,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  iconText: { fontSize: 24, lineHeight: 24, textAlign: 'center' },
  title: {
    fontFamily: fonts.serifR, fontSize: 22, lineHeight: 34, color: c.ink100,
    letterSpacing: -0.4, textAlign: 'center', paddingVertical: 4,
  },
  bodyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  body: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: c.ink60, textAlign: 'center', flexShrink: 1 },
  infoBtn: { fontSize: 15, lineHeight: 20 },

  infoCard: {
    width: '100%', maxWidth: 300,
    backgroundColor: c.surface0, borderRadius: radius.r24,
    borderWidth: 1, borderColor: c.ink15,
    padding: spacing.xl, gap: spacing.lg,
    alignItems: 'center', ...shadows.elev3,
  },
  infoCardText: {
    fontFamily: fonts.sans, fontSize: 14, lineHeight: 22,
    color: c.ink60, textAlign: 'center',
  },
  infoCardBtn: {
    alignSelf: 'stretch', borderRadius: radius.r12,
    paddingVertical: 12, alignItems: 'center',
  },
  infoCardBtnText: { fontFamily: fonts.sansSb, fontSize: 14, color: c.onAccent },

  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, alignSelf: 'stretch' },
  btnWrap: { flex: 1 },
  btn: { paddingVertical: 13, borderRadius: radius.r16, alignItems: 'center' },
  pressed: { opacity: 0.85 },
  cancel: { backgroundColor: c.surface1, borderWidth: 1, borderColor: c.ink15 },
  cancelText: { fontFamily: fonts.sansSb, fontSize: 15, color: c.ink100 },
  confirmText: { fontFamily: fonts.sansSb, fontSize: 15, color: '#fff' },
});
