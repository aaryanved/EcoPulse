import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { View, StyleSheet } from 'react-native';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface TabIconProps {
  name: string;
  color: string;
  focused: boolean;
}

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <MaterialCommunityIcons name={name as any} size={24} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { isDesktop } = useBreakpoint();

  return (
    <View style={styles.root}>
      {isDesktop && <DesktopSidebar />}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: isDesktop ? styles.tabBarHidden : styles.tabBar,
            tabBarActiveTintColor: Colors.emerald[400],
            tabBarInactiveTintColor: Colors.text.dim,
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarBackground: () => <View style={styles.tabBarBackground} />,
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="home" color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="log"
            options={{
              title: 'Log',
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="plus-circle" color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="coach"
            options={{
              title: 'AI Coach',
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="robot" color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="challenges"
            options={{
              title: 'Challenges',
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="trophy" color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: 'Rank',
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name="podium" color={color} focused={focused} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabBarHidden: {
    display: 'none',
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  tabBarLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  tabIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  tabIconActive: {
    backgroundColor: `${Colors.emerald[500]}15`,
  },
});
