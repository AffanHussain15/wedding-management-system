/** Bottom tabs: Home · Vendors · Guests · Budget · Timeline. */

import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@components';
import { colors, weight } from '@theme';
import { HomeScreen, VendorsScreen, GuestsScreen, BudgetScreen, TimelineScreen } from '@screens';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Soft maroon tint that fades in behind the active tab.
const ACTIVE_PILL = 'rgba(109,15,43,0.08)';

const TAB_META: Record<keyof MainTabParamList, { label: string; icon: IconName }> = {
  Home: { label: 'Home', icon: 'home' },
  Vendors: { label: 'Vendors', icon: 'vendors' },
  Guests: { label: 'Guests', icon: 'guests' },
  Budget: { label: 'Budget', icon: 'budget' },
  Timeline: { label: 'Timeline', icon: 'timeline' },
};

function TabButton({
  name,
  focused,
  onPress,
  onLongPress,
}: {
  name: keyof MainTabParamList;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  // Spring toward 1 when focused, 0 when not — drives the pop + pill fade.
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 140,
    }).start();
  }, [focused, anim]);

  const meta = TAB_META[name];
  const color = focused ? colors.primary : colors.textMuted;
  // Lift only — no scaling, so the SVG icon stays crisp instead of blurring.
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <Pressable style={styles.item} onPress={onPress} onLongPress={onLongPress} hitSlop={4}>
      <Animated.View style={[styles.pill, { opacity: anim }]} />
      <Animated.View style={[styles.itemInner, { transform: [{ translateY }] }]}>
        <Icon name={meta.icon} size={23} color={color} strokeWidth={2} />
        <Text style={[styles.labelEn, { color }]}>{meta.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <TabButton
              key={route.key}
              name={route.name as keyof MainTabParamList}
              focused={focused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export function MainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={FloatingTabBar}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Vendors" component={VendorsScreen} />
      <Tab.Screen name="Guests" component={GuestsScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    // Floating shadow so the bar reads as detached from the screen edge.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  itemInner: {
    alignItems: 'center',
  },
  pill: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    bottom: 2,
    borderRadius: 16,
    backgroundColor: ACTIVE_PILL,
  },
  labelEn: {
    fontSize: 11,
    marginTop: 4,
    ...weight('bold'),
  },
});
