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
  // Spring toward 1 when focused, 0 when not — drives the lift.
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
  // The active tab is marked by colour alone — no pill or fill behind it — so
  // the icon and label carry the whole signal. Weight shifts with it, since
  // colour on its own is a weak cue for anyone who can't distinguish it.
  const color = focused ? colors.primary : colors.textMuted;
  // Lift only — no scaling, so the SVG icon stays crisp instead of blurring.
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={meta.label}
      accessibilityState={{ selected: focused }}>
      <Animated.View style={[styles.itemInner, { transform: [{ translateY }] }]}>
        <Icon name={meta.icon} size={23} color={color} strokeWidth={focused ? 2.4 : 2} />
        <Text style={[styles.labelEn, focused ? styles.labelActive : styles.labelIdle, { color }]}>
          {meta.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    // The white sheet is the outer view, so it runs edge to edge and down
    // through the gesture area. Previously the white card sat inset inside a
    // cream wrapper, which framed it in a band of background colour.
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
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      // Must stay a render prop: react-navigation *calls* `tabBar(props)`
      // instead of rendering it, so passing the component directly
      // (`tabBar={FloatingTabBar}`) runs its hooks outside a component render
      // and crashes with "Invalid hook call" as soon as the tabs mount.
      // eslint-disable-next-line react/no-unstable-nested-components
      tabBar={props => <FloatingTabBar {...props} />}>
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
    backgroundColor: colors.surface,
    paddingTop: 8,
    // Rounded at the top only: the sheet meets the bottom of the screen, so
    // rounding there would just expose cream in the two corners again.
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    // Shadow cast upward, onto the content the sheet sits over.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingBottom: 8,
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
  labelEn: {
    fontSize: 11,
    marginTop: 4,
  },
  labelActive: {
    ...weight('bold'),
  },
  labelIdle: {
    ...weight('medium'),
  },
});
