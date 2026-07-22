/** Bottom tabs: Home · Vendors · Guests · Budget · Timeline. */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors, layout } from '@theme';
import {
  HomeScreen,
  VendorsScreen,
  GuestsScreen,
  BudgetScreen,
  TimelineScreen,
} from '@screens';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// TODO: replace emoji with the design's SVG icons once react-native-svg is added.
const TAB_ICON: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Vendors: '🛍️',
  Guests: '👥',
  Budget: '💰',
  Timeline: '📅',
};

function TabBarIcon({
  routeName,
  focused,
}: {
  routeName: keyof MainTabParamList;
  focused: boolean;
}): React.JSX.Element {
  return (
    <Text style={[styles.icon, focused ? styles.iconActive : styles.iconInactive]}>
      {TAB_ICON[routeName]}
    </Text>
  );
}

export function MainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        // eslint-disable-next-line react/no-unstable-nested-components -- render prop returning the stable TabBarIcon component
        tabBarIcon: ({ focused }) => (
          <TabBarIcon routeName={route.name} focused={focused} />
        ),
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
    height: layout.tabBarHeight,
    paddingTop: 6,
  },
  tabLabel: { fontSize: 11 },
  icon: { fontSize: 20 },
  iconActive: { opacity: 1 },
  iconInactive: { opacity: 0.5 },
});
