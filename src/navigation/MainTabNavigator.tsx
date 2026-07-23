/** Bottom tabs: Home · Vendors · Guests · Budget · Timeline. */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@components';
import { colors, weight } from '@theme';
import { HomeScreen, VendorsScreen, GuestsScreen, BudgetScreen, TimelineScreen } from '@screens';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_META: Record<keyof MainTabParamList, { label: string; urdu: string; icon: IconName }> = {
  Home: { label: 'Home', urdu: 'Ghar', icon: 'home' },
  Vendors: { label: 'Vendors', urdu: 'Vendors', icon: 'vendors' },
  Guests: { label: 'Guests', urdu: 'Mehmaan', icon: 'guests' },
  Budget: { label: 'Budget', urdu: 'Bajat', icon: 'budget' },
  Timeline: { label: 'Timeline', urdu: 'Timeline', icon: 'timeline' },
};

function TabBarIcon({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} size={22} color={color} strokeWidth={1.9} />;
}

function TabBarLabel({ name, color }: { name: keyof MainTabParamList; color: string }) {
  return (
    <View style={styles.labelWrap}>
      <Text style={[styles.labelEn, { color }]}>{TAB_META[name].label}</Text>
      <Text style={styles.labelUr}>{TAB_META[name].urdu}</Text>
    </View>
  );
}

export function MainTabNavigator(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          { height: 58 + insets.bottom, paddingBottom: insets.bottom + 6 },
        ],
        // eslint-disable-next-line react/no-unstable-nested-components -- render prop -> stable TabBarIcon
        tabBarIcon: ({ color }) => <TabBarIcon name={TAB_META[route.name].icon} color={color} />,
        // eslint-disable-next-line react/no-unstable-nested-components -- render prop -> stable TabBarLabel
        tabBarLabel: ({ color }) => <TabBarLabel name={route.name} color={color} />,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vendors" component={VendorsScreen} />
      <Tab.Screen name="Guests" component={GuestsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
  },
  labelWrap: {
    alignItems: 'center',
  },
  labelEn: {
    fontSize: 10.5,
    ...weight('bold'),
  },
  labelUr: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 1,
    ...weight('regular'),
  },
});
