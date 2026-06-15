import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useCarbon } from '@/hooks/useCarbon';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatCarbonKg, getCarbonLevel } from '@/utils/carbon';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

const GRID_ZONES: Array<{ zone: string; label: string }> = [
  { zone: 'US-CA', label: 'California, US' },
  { zone: 'US-NY', label: 'New York, US' },
  { zone: 'US-TEX', label: 'Texas, US' },
  { zone: 'GB', label: 'Great Britain' },
  { zone: 'DE', label: 'Germany' },
  { zone: 'FR', label: 'France' },
  { zone: 'AU-NSW', label: 'New South Wales, AU' },
  { zone: 'IN-NO', label: 'North India' },
];

export default function SettingsScreen() {
  const { profile, logout, saveProfile } = useAuth();
  const { currentMonthBreakdown, activities } = useCarbon();

  const { isDesktop } = useBreakpoint();
  const [notifications, setNotifications] = useState(profile?.notifications_enabled ?? true);
  const [weeklyReport, setWeeklyReport] = useState(profile?.weekly_report_enabled ?? true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [selectedZone, setSelectedZone] = useState('US-CA');

  const carbonLevel = getCarbonLevel(currentMonthBreakdown.total);
  const levelVariant = carbonLevel === 'low' ? 'success' : carbonLevel === 'medium' ? 'warning' : 'error';

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
            router.replace('/(auth)/login');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  }

  async function toggleNotifications(value: boolean) {
    setNotifications(value);
    await saveProfile({ notifications_enabled: value }).catch(() => setNotifications(!value));
  }

  async function toggleWeeklyReport(value: boolean) {
    setWeeklyReport(value);
    await saveProfile({ weekly_report_enabled: value }).catch(() => setWeeklyReport(!value));
  }

  async function handleExportData() {
    if (activities.length === 0) {
      Alert.alert('No Data', 'Log some activities first before exporting.');
      return;
    }

    const header = 'Date,Category,Subcategory,Description,Carbon (kg CO₂e)\n';
    const rows = activities
      .map(a =>
        [
          a.activity_date,
          a.category,
          a.subcategory,
          `"${(a.description ?? '').replace(/"/g, '""')}"`,
          a.carbon_kg.toFixed(3),
        ].join(',')
      )
      .join('\n');

    const csv = header + rows;
    const summary = `EcoPulse Carbon Data Export\nTotal activities: ${activities.length}\nThis month: ${formatCarbonKg(currentMonthBreakdown.total)} CO₂e\n\n${csv}`;

    try {
      await Share.share({ message: summary, title: 'EcoPulse Carbon Data' });
    } catch {
      Alert.alert('Export Failed', 'Unable to share data. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
        <Text variant="title">Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <Card variant="elevated">
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text variant="title">{profile?.display_name ?? 'User'}</Text>
              <Text variant="caption" color="muted">{profile?.email ?? ''}</Text>
              <View style={styles.profileMeta}>
                <Badge label={carbonLevel.toUpperCase()} variant={levelVariant} />
                {(profile?.current_streak ?? 0) > 0 && (
                  <View style={styles.streak}>
                    <MaterialCommunityIcons name="fire" size={14} color={Colors.warning} />
                    <Text variant="caption" style={{ color: Colors.warning, fontWeight: '700' }}>
                      {profile?.current_streak} day streak
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Carbon overview */}
        <View style={styles.section}>
          <Text variant="label" color="muted">This Month</Text>
          <Card>
            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.emerald[400] }]}>
                  {formatCarbonKg(currentMonthBreakdown.total)}
                </Text>
                <Text variant="caption" color="muted">Total CO₂e</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.emerald[400] }]}>
                  {activities.length}
                </Text>
                <Text variant="caption" color="muted">Activities</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.emerald[400] }]}>
                  {profile?.monthly_carbon_goal ?? 200} kg
                </Text>
                <Text variant="caption" color="muted">Goal</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text variant="label" color="muted">Notifications</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="bell-outline" size={20} color={Colors.emerald[500]} />
                <View>
                  <Text variant="body">Push Notifications</Text>
                  <Text variant="caption" color="muted">Reminders and updates</Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
                trackColor={{ false: Colors.background.elevated, true: `${Colors.emerald[500]}60` }}
                thumbColor={notifications ? Colors.emerald[500] : Colors.text.dim}
              />
            </View>

            <Divider />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="chart-line" size={20} color={Colors.emerald[500]} />
                <View>
                  <Text variant="body">Weekly AI Report</Text>
                  <Text variant="caption" color="muted">Gemini sustainability summary</Text>
                </View>
              </View>
              <Switch
                value={weeklyReport}
                onValueChange={toggleWeeklyReport}
                trackColor={{ false: Colors.background.elevated, true: `${Colors.emerald[500]}60` }}
                thumbColor={weeklyReport ? Colors.emerald[500] : Colors.text.dim}
              />
            </View>
          </Card>
        </View>

        {/* Grid zone */}
        <View style={styles.section}>
          <Text variant="label" color="muted">Live Grid Zone</Text>
          <Card>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowZonePicker(v => !v)}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="transmission-tower" size={20} color={Colors.emerald[500]} />
                <View>
                  <Text variant="body">Electricity Grid</Text>
                  <Text variant="caption" color="muted">Used for live carbon intensity</Text>
                </View>
              </View>
              <View style={styles.zoneRight}>
                <Text variant="caption" color="secondary">{selectedZone}</Text>
                <MaterialCommunityIcons
                  name={showZonePicker ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.text.dim}
                />
              </View>
            </TouchableOpacity>

            {showZonePicker && (
              <View style={styles.zonePicker}>
                {GRID_ZONES.map(z => (
                  <TouchableOpacity
                    key={z.zone}
                    style={styles.zoneOption}
                    onPress={() => { setSelectedZone(z.zone); setShowZonePicker(false); }}
                  >
                    <Text variant="body">{z.label}</Text>
                    <Text variant="caption" color="muted">{z.zone}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text variant="label" color="muted">Account</Text>
          <Card>
            <TouchableOpacity style={styles.settingRow} onPress={handleExportData}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="export" size={20} color={Colors.emerald[500]} />
                <View>
                  <Text variant="body">Export Data</Text>
                  <Text variant="caption" color="muted">Share CSV of all activities</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.text.dim} />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Alert.alert('Privacy', 'EcoPulse stores your data securely in Supabase with row-level security. Your data is never sold or shared with third parties.')}
            >
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="shield-account-outline" size={20} color={Colors.emerald[500]} />
                <Text variant="body">Privacy Policy</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.text.dim} />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity style={styles.settingRow} onPress={handleLogout} disabled={isLoggingOut}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
                <Text variant="body" color="error">
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        <Text variant="caption" color="dim" style={styles.version}>
          EcoPulse v1.0.0 · AI powered by Gemini · Built for a greener planet
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
  },
  scrollContent: { padding: Spacing['2xl'], gap: Spacing.xl, paddingBottom: Spacing['4xl'] },
  scrollContentDesktop: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.emerald[500]}25`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${Colors.emerald[500]}50`,
  },
  avatarText: { fontSize: FontSize['2xl'], color: Colors.emerald[400], fontWeight: '700' },
  profileInfo: { gap: 4, flex: 1 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  section: { gap: Spacing.sm },
  statsGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statCell: { alignItems: 'center', gap: 4, flex: 1 },
  statValue: { fontSize: FontSize.lg, fontWeight: '800' },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.divider },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  zoneRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  zonePicker: { borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.sm, paddingTop: Spacing.sm, gap: Spacing.xs },
  zoneOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md },
  version: { textAlign: 'center', marginTop: Spacing.sm },
});
