import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

export default function SettingsScreen() {
  const { profile, logout, saveProfile } = useAuth();
  const [notifications, setNotifications] = useState(profile?.notifications_enabled ?? true);
  const [weeklyReport, setWeeklyReport] = useState(profile?.weekly_report_enabled ?? true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
        <Text variant="title">Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <Card variant="elevated">
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text variant="title">{profile?.display_name ?? 'User'}</Text>
              <Text variant="caption" color="muted">
                {profile?.email ?? ''}
              </Text>
            </View>
          </View>
        </Card>

        {/* Carbon Goal */}
        <View style={styles.section}>
          <Text variant="label" color="muted">
            Carbon Goal
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="target" size={20} color={Colors.emerald[500]} />
                <Text variant="body">Monthly Target</Text>
              </View>
              <Text variant="body" color="secondary">
                {profile?.monthly_carbon_goal ?? 200} kg CO₂
              </Text>
            </View>
          </Card>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text variant="label" color="muted">
            Notifications
          </Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="bell-outline" size={20} color={Colors.emerald[500]} />
                <View>
                  <Text variant="body">Push Notifications</Text>
                  <Text variant="caption" color="muted">
                    Reminders and updates
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
                trackColor={{
                  false: Colors.background.elevated,
                  true: `${Colors.emerald[500]}60`,
                }}
                thumbColor={notifications ? Colors.emerald[500] : Colors.text.dim}
              />
            </View>

            <Divider />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="chart-line" size={20} color={Colors.emerald[500]} />
                <View>
                  <Text variant="body">Weekly Report</Text>
                  <Text variant="caption" color="muted">
                    AI sustainability summary
                  </Text>
                </View>
              </View>
              <Switch
                value={weeklyReport}
                onValueChange={toggleWeeklyReport}
                trackColor={{
                  false: Colors.background.elevated,
                  true: `${Colors.emerald[500]}60`,
                }}
                thumbColor={weeklyReport ? Colors.emerald[500] : Colors.text.dim}
              />
            </View>
          </Card>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text variant="label" color="muted">
            Account
          </Text>
          <Card>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="export" size={20} color={Colors.emerald[500]} />
                <Text variant="body">Export Data</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.text.dim} />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity style={styles.settingRow}>
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
          EcoPulse v1.0.0 · Built for a greener future 🌿
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing['2xl'],
    gap: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.emerald[500]}30`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${Colors.emerald[500]}50`,
  },
  avatarText: {
    fontSize: FontSize['2xl'],
    color: Colors.emerald[400],
    fontWeight: '700',
  },
  profileInfo: {
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  version: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
