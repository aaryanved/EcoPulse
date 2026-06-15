import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { usePathname, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

const NAV_ITEMS = [
  { path: '/dashboard', href: '/(tabs)/dashboard', icon: 'view-dashboard-outline', activeIcon: 'view-dashboard', label: 'Dashboard' },
  { path: '/log', href: '/(tabs)/log', icon: 'plus-circle-outline', activeIcon: 'plus-circle', label: 'Log Activity' },
  { path: '/coach', href: '/(tabs)/coach', icon: 'robot-outline', activeIcon: 'robot', label: 'AI Coach' },
  { path: '/challenges', href: '/(tabs)/challenges', icon: 'trophy-outline', activeIcon: 'trophy', label: 'Challenges' },
  { path: '/leaderboard', href: '/(tabs)/leaderboard', icon: 'podium-outline', activeIcon: 'podium', label: 'Leaderboard' },
] as const;

const BOTTOM_ITEMS = [
  { path: '/simulator', href: '/simulator', icon: 'chart-timeline-variant-shimmer', activeIcon: 'chart-timeline-variant', label: 'Simulator' },
  { path: '/goals', href: '/goals', icon: 'bullseye-arrow', activeIcon: 'bullseye-arrow', label: 'Goals' },
  { path: '/settings', href: '/settings', icon: 'cog-outline', activeIcon: 'cog', label: 'Settings' },
] as const;

interface NavItemProps {
  path: string;
  href: string;
  icon: string;
  activeIcon: string;
  label: string;
  active: boolean;
}

function NavItem({ path, href, icon, activeIcon, label, active }: NavItemProps) {
  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.navItem,
        active && styles.navItemActive,
        !active && hovered && styles.navItemHovered,
      ]}
      onPress={() => router.push(href as any)}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      {active && <View style={styles.activeBar} />}
      <MaterialCommunityIcons
        name={(active ? activeIcon : icon) as any}
        size={20}
        color={active ? Colors.emerald[400] : Colors.text.dim}
      />
      <Text
        style={[styles.navLabel, active && styles.navLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoIconWrap}>
          <MaterialCommunityIcons name="leaf" size={18} color={Colors.emerald[400]} />
        </View>
        <Text style={styles.logoText}>EcoPulse</Text>
      </View>

      <View style={styles.divider} />

      {/* Primary nav */}
      <View style={styles.navGroup}>
        <Text style={styles.navGroupLabel}>MAIN</Text>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.path} {...item} active={isActive(item.path)} />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.divider} />

      {/* Secondary nav */}
      <View style={styles.navGroup}>
        {BOTTOM_ITEMS.map(item => (
          <NavItem key={item.path} {...item} active={isActive(item.path)} />
        ))}
      </View>

      <View style={styles.divider} />

      {/* Profile footer */}
      <Pressable
        style={({ hovered }: any) => [styles.profileSection, hovered && styles.profileHovered]}
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarChar}>
            {profile?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>
            {profile?.display_name ?? 'User'}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {profile?.email ?? ''}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.text.dim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: Colors.background.secondary,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
    paddingBottom: Spacing.base,
    flexDirection: 'column',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  logoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.emerald[500]}20`,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.base,
  },
  navGroup: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  navGroupLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text.dim,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: `${Colors.emerald[500]}12`,
  },
  navItemHovered: {
    backgroundColor: Colors.background.elevated,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: Colors.emerald[500],
    borderRadius: BorderRadius.full,
  },
  navLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text.dim,
    flex: 1,
  },
  navLabelActive: {
    color: Colors.emerald[400],
    fontWeight: '600',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  profileHovered: {
    backgroundColor: Colors.background.elevated,
  },
  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.emerald[500]}20`,
    borderWidth: 1,
    borderColor: `${Colors.emerald[500]}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.emerald[400],
  },
  profileInfo: {
    flex: 1,
    gap: 1,
  },
  profileName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  profileEmail: {
    fontSize: FontSize.xs,
    color: Colors.text.dim,
  },
});
