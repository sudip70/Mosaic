import {
  View, Text, ScrollView, Switch, Pressable, StyleSheet, Share,
} from 'react-native';
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { colors, fonts, shadows, radius, spacing } from '@/lib/theme';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSettings } from '@/store/useSettings';
import { getStorageInfo, clearCache, formatBytes, StorageInfo } from '@/lib/storageInfo';

// ─── Sub-components ──────────────────────────────────────────────────────────

function GroupLabel({ label }: { label: string }) {
  return <Text style={s.groupLabel}>{label}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

interface RowProps {
  icon: string;
  iconBg: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}

function Row({ icon, iconBg, label, sub, right, onPress, danger, last }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        // Row layout lives on a child View — a Pressable carrying
        // flexDirection:'row' gets dropped on the New Architecture, which
        // collapses the row to a column and stacks the right control below.
        <View style={[s.row, !last && s.rowBorder, pressed && onPress && s.rowPressed]}>
          <View style={s.rowLeft}>
            <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
              <Text style={s.rowIconText}>{icon}</Text>
            </View>
            <View style={s.rowCopy}>
              <Text style={[s.rowLabel, danger && s.rowLabelDanger]}>{label}</Text>
              {sub && <Text style={s.rowSub}>{sub}</Text>}
            </View>
          </View>
          {right && <View style={s.rowRight}>{right}</View>}
        </View>
      )}
    </Pressable>
  );
}

function ValChip({ label }: { label: string }) {
  return (
    <View style={s.valChip}>
      <Text style={s.valChipText}>{label}</Text>
    </View>
  );
}

function Chevron() {
  return <Text style={s.chevron}>›</Text>;
}

function PhaseBadge({ phase, label }: { phase: 1 | 2; label: string }) {
  return (
    <View style={s.phaseBadgeRow}>
      <View style={[s.phaseBadge, phase === 1 ? s.phaseBadgeP1 : s.phaseBadgeP2]}>
        <View style={[s.phaseDot, phase === 1 ? s.phaseDotP1 : s.phaseDotP2]} />
        <Text style={[s.phaseBadgeText, phase === 1 ? s.phaseBadgeTextP1 : s.phaseBadgeTextP2]}>
          Phase {phase}
        </Text>
      </View>
      <Text style={s.phaseSubLabel}>{label}</Text>
    </View>
  );
}

function Phase2Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.phase2Wrap}>
      <View style={s.phase2Header}>
        <Text style={s.phase2HeaderText}>{title}</Text>
        <Text style={s.lockIcon}>🔒</Text>
      </View>
      <View style={[s.card, s.phase2Card]}>
        {children}
      </View>
    </View>
  );
}

function DisabledRow({ icon, iconBg, label, sub, last }: Omit<RowProps, 'onPress'>) {
  return (
    <View style={[s.row, !last && s.rowBorder, s.rowDisabled]}>
      <View style={s.rowLeft}>
        <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
          <Text style={s.rowIconText}>{icon}</Text>
        </View>
        <View style={s.rowCopy}>
          <Text style={s.rowLabel}>{label}</Text>
          {sub && <Text style={s.rowSub}>{sub}</Text>}
        </View>
      </View>
      <View style={s.rowRight}><Chevron /></View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { trackScreen } = useAnalytics();
  const {
    morningReminder, reminderTime, theme, gridDensity,
    setMorningReminder, cycleTheme, cycleGridDensity,
  } = useSettings();

  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const loadStorage = useCallback(() => { getStorageInfo().then(setStorage); }, []);

  useFocusEffect(
    useCallback(() => {
      trackScreen('settings');
      loadStorage();
    }, [loadStorage])
  );

  async function shareApp() {
    await Share.share({
      message: 'Check out Mosaic — a daily colour photo journal. One colour, one day, a year of your life.',
    });
  }

  async function rateApp() {
    if (await StoreReview.hasAction()) await StoreReview.requestReview();
  }

  const [showClearCache, setShowClearCache] = useState(false);

  async function confirmClearCache() {
    setShowClearCache(false);
    await clearCache();
    loadStorage();
  }

  const photosUsed = storage ? formatBytes(storage.photosBytes) : '…';
  const cacheUsed = storage ? formatBytes(storage.cacheBytes) : '…';
  const freeSpace = storage ? formatBytes(storage.freeBytes) : '…';
  const usedFraction = storage && storage.freeBytes > 0
    ? Math.min(storage.photosBytes / (storage.photosBytes + storage.freeBytes), 1)
    : 0;

  return (
    <AppScreen>
      <ScreenHeader wordmark="Settings" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase 1 badge */}
        <PhaseBadge phase={1} label="Available now" />

        {/* Notifications */}
        <View style={s.group}>
          <GroupLabel label="Notifications" />
          <SettingsCard>
            <Row
              icon="🔔" iconBg="#FFF8EC"
              label="Morning reminder"
              sub="One gentle nudge to find today's colour"
              right={
                <Switch
                  value={morningReminder}
                  onValueChange={setMorningReminder}
                  trackColor={{ false: colors.surface2, true: colors.accent }}
                  thumbColor={colors.surface0}
                />
              }
            />
            <Row
              icon="⏰" iconBg="#EDF4FF"
              label="Reminder time"
              sub={morningReminder ? 'When should we nudge you?' : 'Enable reminder first'}
              right={morningReminder ? <><ValChip label={reminderTime} /><Chevron /></> : null}
              onPress={morningReminder ? () => {} : undefined}
              last
            />
          </SettingsCard>
        </View>

        {/* Appearance */}
        <View style={s.group}>
          <GroupLabel label="Appearance" />
          <SettingsCard>
            <Row
              icon="🌤" iconBg="#F5F0E8"
              label="Theme"
              sub="Match your device or set manually"
              right={<><ValChip label={theme} /><Chevron /></>}
              onPress={cycleTheme}
            />
            <Row
              icon="▦" iconBg="#F0F4FF"
              label="Grid density"
              sub="How many tiles fit on screen"
              right={<><ValChip label={gridDensity} /><Chevron /></>}
              onPress={cycleGridDensity}
              last
            />
          </SettingsCard>
        </View>

        {/* Storage */}
        <View style={s.group}>
          <GroupLabel label="Storage" />
          <SettingsCard>
            {/* Photos on device — progress bar lives under the label, full width */}
            <View style={[s.storageRow, s.rowBorder]}>
              <View style={[s.rowIcon, { backgroundColor: '#F5F0E8' }]}>
                <Text style={s.rowIconText}>📦</Text>
              </View>
              <View style={s.storageCopy}>
                <Text style={s.rowLabel}>Photos on device</Text>
                <View style={s.storageTrack}>
                  <View style={[s.storageFill, { width: `${Math.max(usedFraction * 100, 2)}%` }]} />
                </View>
                <Text style={s.storageLabel}>{photosUsed} used · {freeSpace} free</Text>
              </View>
            </View>
            <Row
              icon="🗑" iconBg="#FFF0EC"
              label="Clear cache"
              sub="Frees up space, photos stay safe"
              right={<><ValChip label={cacheUsed} /><Chevron /></>}
              onPress={() => setShowClearCache(true)}
              last
            />
          </SettingsCard>
        </View>

        {/* About */}
        <View style={s.group}>
          <GroupLabel label="About" />
          <SettingsCard>
            <Row icon="✦" iconBg="#F5F0E8" label="What is Mosaic?" sub="The story behind the app" right={<Chevron />} onPress={() => router.push('/onboarding')} />
            <Row icon="🔒" iconBg="#EDF4FF" label="Privacy Policy" sub="How your data is handled" right={<Chevron />} onPress={() => router.push('/privacy')} />
            <Row icon="⭐" iconBg="#FFF8EC" label="Rate Mosaic" sub="Enjoying it? Let us know" right={<Chevron />} onPress={rateApp} />
            <Row icon="🌱" iconBg="#EDF7ED" label="Share with a friend" sub="Help someone find their colour" right={<Chevron />} onPress={shareApp} />
            <Row icon="ℹ" iconBg="#F5F0E8" label="Version" sub="Up to date" right={<ValChip label="1.0.0" />} last />
          </SettingsCard>
        </View>

        {/* Phase 2 label */}
        <PhaseBadge phase={2} label="Unlocked with account" />

        {/* Phase 2 — Profile */}
        <Phase2Section title="Profile">
          <DisabledRow icon="👤" iconBg="#F5F0E8" label="Name & avatar" sub="Your identity in Mosaic" />
          <DisabledRow icon="@" iconBg="#EDF4FF" label="Username" sub="How friends find you" last />
        </Phase2Section>

        {/* Phase 2 — Privacy */}
        <Phase2Section title="Privacy">
          <DisabledRow icon="🔐" iconBg="#F5F0E8" label="Who sees your grid" sub="Private by default" />
          <DisabledRow icon="👥" iconBg="#EDF4FF" label="Friend requests" sub="Who can add you" last />
        </Phase2Section>

        {/* Phase 2 — Account */}
        <Phase2Section title="Account">
          <DisabledRow icon="📧" iconBg="#F5F0E8" label="Email address" sub="your@email.com" />
          <DisabledRow icon="🚪" iconBg="#FFF5F5" label="Sign out" last={false} sub={undefined} />
          <View style={[s.row, s.rowDisabled]}>
            <View style={s.rowLeft}>
              <View style={[s.rowIcon, { backgroundColor: '#FFEBEE' }]}>
                <Text style={s.rowIconText}>⚠️</Text>
              </View>
              <View style={s.rowCopy}>
                <Text style={[s.rowLabel, s.rowLabelDanger]}>Delete account</Text>
                <Text style={s.rowSub}>Permanently removes all your data</Text>
              </View>
            </View>
          </View>
        </Phase2Section>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerLogo}>Mosaic</Text>
          <Text style={s.footerVer}>Version 1.0.0 · Made with care</Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showClearCache}
        icon="🗑"
        iconBg="#FFF0EC"
        title="Clear cache?"
        body="Frees up space. Your photos stay safe."
        confirmLabel="Clear"
        onConfirm={confirmClearCache}
        onCancel={() => setShowClearCache(false)}
      />
    </AppScreen>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.x4,
    gap: spacing.xxl,
  },

  group: { gap: spacing.md },
  groupLabel: {
    fontFamily: fonts.sansSb, fontSize: 11, letterSpacing: 1.3,
    textTransform: 'uppercase', color: colors.ink30, paddingHorizontal: 4,
  },

  card: {
    backgroundColor: colors.surface0, borderRadius: radius.r20,
    borderWidth: 1, borderColor: colors.ink15, overflow: 'hidden',
    ...shadows.elev1,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.ink15 },
  rowPressed: { backgroundColor: colors.surface1 },
  rowDisabled: { opacity: 0.38 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 },
  rowIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconText: { fontSize: 17 },
  rowCopy: { flex: 1 },
  rowLabel: { fontFamily: fonts.sansMd, fontSize: 14, color: colors.ink100, letterSpacing: -0.1 },
  rowLabelDanger: { color: '#C62828' },
  rowSub: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, color: colors.ink30, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  valChip: {
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.ink15,
    borderRadius: radius.full, paddingHorizontal: 11, paddingVertical: 4,
  },
  valChipText: { fontFamily: fonts.sansMd, fontSize: 12, color: colors.ink60 },
  chevron: { fontFamily: fonts.sans, fontSize: 17, color: colors.ink30 },

  storageRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  storageCopy: { flex: 1, gap: 8 },
  storageTrack: { height: 5, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' },
  storageFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  storageLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink30 },

  phaseBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phaseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, paddingHorizontal: 11, paddingVertical: 5,
    borderWidth: 1,
  },
  phaseBadgeP1: { backgroundColor: '#EDF7ED', borderColor: 'rgba(46,125,50,0.2)' },
  phaseBadgeP2: { backgroundColor: colors.surface2, borderColor: colors.ink15 },
  phaseDot: { width: 5, height: 5, borderRadius: 3 },
  phaseDotP1: { backgroundColor: '#2E7D32' },
  phaseDotP2: { backgroundColor: colors.ink30 },
  phaseBadgeText: { fontFamily: fonts.sansSb, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
  phaseBadgeTextP1: { color: '#2E7D32' },
  phaseBadgeTextP2: { color: colors.ink30 },
  phaseSubLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink30 },

  phase2Wrap: { borderRadius: radius.r20, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.ink15, opacity: 0.75 },
  phase2Header: {
    backgroundColor: colors.surface1, paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  phase2HeaderText: {
    fontFamily: fonts.sansSb, fontSize: 11, letterSpacing: 0.8,
    textTransform: 'uppercase', color: colors.ink30,
  },
  lockIcon: { fontSize: 12 },
  phase2Card: { borderRadius: 0, borderWidth: 0, shadowOpacity: 0 },

  footer: { alignItems: 'center', gap: 4, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  footerLogo: { fontFamily: fonts.serifR, fontSize: 18, color: colors.ink30, letterSpacing: -0.2 },
  footerVer: { fontFamily: fonts.sansMd, fontSize: 10, color: colors.ink15, letterSpacing: 0.6 },
});
