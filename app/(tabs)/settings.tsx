import {
  View, Text, ScrollView, Switch, Pressable, StyleSheet, Share,
} from 'react-native';
import { useEffect, useState } from 'react';
import { colors, fonts, shadows, radius } from '@/lib/theme';
import { useAnalytics } from '@/hooks/useAnalytics';

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
      style={({ pressed }) => [s.row, !last && s.rowBorder, pressed && onPress && s.rowPressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={label}
    >
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
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [theme, setTheme] = useState<'System' | 'Light' | 'Dark'>('System');
  const [gridDensity, setGridDensity] = useState<'Comfortable' | 'Compact'>('Comfortable');

  useEffect(() => { trackScreen('settings'); }, []);

  function cycleTheme() {
    setTheme(t => t === 'System' ? 'Light' : t === 'Light' ? 'Dark' : 'System');
  }

  function cycleGrid() {
    setGridDensity(d => d === 'Comfortable' ? 'Compact' : 'Comfortable');
  }

  async function shareApp() {
    await Share.share({
      message: 'Check out Mosaic — a daily colour photo journal. One colour, one day, a year of your life.',
    });
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Settings</Text>
      </View>

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
                  value={notifEnabled}
                  onValueChange={setNotifEnabled}
                  trackColor={{ false: colors.surface2, true: colors.accent }}
                  thumbColor={colors.surface0}
                />
              }
            />
            <Row
              icon="⏰" iconBg="#EDF4FF"
              label="Reminder time"
              sub={notifEnabled ? 'When should we nudge you?' : 'Enable reminder first'}
              right={notifEnabled ? <><ValChip label="8:30 AM" /><Chevron /></> : null}
              onPress={notifEnabled ? () => {} : undefined}
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
              onPress={cycleGrid}
              last
            />
          </SettingsCard>
        </View>

        {/* Storage */}
        <View style={s.group}>
          <GroupLabel label="Storage" />
          <SettingsCard>
            <Row
              icon="📦" iconBg="#F5F0E8"
              label="Photos on device"
              sub={undefined}
              right={
                <View style={s.storageBar}>
                  <View style={s.storageTrack}>
                    <View style={s.storageFill} />
                  </View>
                  <Text style={s.storageLabel}>142 MB of 420 MB used</Text>
                </View>
              }
            />
            <Row
              icon="🗑" iconBg="#FFF0EC"
              label="Clear cache"
              sub="Frees up space, photos stay safe in the cloud"
              right={<><ValChip label="28 MB" /><Chevron /></>}
              onPress={() => {}}
              last
            />
          </SettingsCard>
        </View>

        {/* About */}
        <View style={s.group}>
          <GroupLabel label="About" />
          <SettingsCard>
            <Row icon="✦" iconBg="#F5F0E8" label="What is Mosaic?" sub="The story behind the app" right={<Chevron />} onPress={() => {}} />
            <Row icon="⭐" iconBg="#FFF8EC" label="Rate Mosaic" sub="Enjoying it? Let us know" right={<Chevron />} onPress={() => {}} />
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
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface0 },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 6 },
  title: { fontFamily: fonts.serifR, fontSize: 26, color: colors.ink100, letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },

  group: { gap: 8 },
  groupLabel: {
    fontFamily: fonts.sansSb, fontSize: 10, letterSpacing: 1.2,
    textTransform: 'uppercase', color: colors.ink30, paddingHorizontal: 4,
  },

  card: {
    backgroundColor: colors.surface0, borderRadius: radius.r20,
    borderWidth: 1, borderColor: colors.ink15, overflow: 'hidden',
    ...shadows.elev1,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.ink15 },
  rowPressed: { backgroundColor: colors.surface1 },
  rowDisabled: { opacity: 0.38 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconText: { fontSize: 15 },
  rowCopy: { flex: 1 },
  rowLabel: { fontFamily: fonts.sansMd, fontSize: 13, color: colors.ink100, letterSpacing: -0.1 },
  rowLabelDanger: { color: '#C62828' },
  rowSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink30, marginTop: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  valChip: {
    backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.ink15,
    borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3,
  },
  valChipText: { fontFamily: fonts.sansMd, fontSize: 11, color: colors.ink60 },
  chevron: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink30 },

  storageBar: { flex: 1 },
  storageTrack: { height: 4, backgroundColor: colors.surface2, borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  storageFill: { height: '100%', width: '34%', backgroundColor: colors.accent, borderRadius: 2 },
  storageLabel: { fontFamily: fonts.sans, fontSize: 10, color: colors.ink30 },

  phaseBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phaseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1,
  },
  phaseBadgeP1: { backgroundColor: '#EDF7ED', borderColor: 'rgba(46,125,50,0.2)' },
  phaseBadgeP2: { backgroundColor: colors.surface2, borderColor: colors.ink15 },
  phaseDot: { width: 5, height: 5, borderRadius: 3 },
  phaseDotP1: { backgroundColor: '#2E7D32' },
  phaseDotP2: { backgroundColor: colors.ink30 },
  phaseBadgeText: { fontFamily: fonts.sansSb, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  phaseBadgeTextP1: { color: '#2E7D32' },
  phaseBadgeTextP2: { color: colors.ink30 },
  phaseSubLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink30 },

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

  footer: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  footerLogo: { fontFamily: fonts.serifR, fontSize: 16, color: colors.ink30, letterSpacing: -0.2 },
  footerVer: { fontFamily: fonts.sansMd, fontSize: 10, color: colors.ink15, letterSpacing: 0.6 },
});
