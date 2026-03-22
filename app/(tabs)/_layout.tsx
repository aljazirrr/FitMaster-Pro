import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/theme';
import { useTranslation } from 'react-i18next';

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    home: focused ? '🏠' : '🏠',
    track: focused ? '💪' : '💪',
    plans: focused ? '📋' : '📋',
    nutrition: focused ? '🥗' : '🥗',
    glucose: focused ? '🩸' : '🩸',
    community: focused ? '👥' : '👥',
    profile: focused ? '👤' : '👤',
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { opacity: focused ? 1 : 0.5 }]}>{icons[name] || '⚪'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
});

export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: t('tabs.track'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="track" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: t('tabs.plans'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="plans" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t('tabs.nutrition'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="nutrition" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="glucose"
        options={{
          title: t('tabs.glucose'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="glucose" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.community'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="community" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
