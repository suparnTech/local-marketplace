// app/(tabs)/_layout.tsx - Kinetic Navigation Portal
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const TAB_COUNT = 5;
const TAB_ITEM_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;
const INDICATOR_SIZE = 48;

// Icon mapping for each tab
const getIconName = (routeName: string, isFocused: boolean): any => {
  const iconMap: Record<string, { focused: string; unfocused: string }> = {
    index: { focused: 'home', unfocused: 'home-outline' },
    categories: { focused: 'grid', unfocused: 'grid-outline' },
    cart: { focused: 'cart', unfocused: 'cart-outline' },
    orders: { focused: 'receipt', unfocused: 'receipt-outline' },
    profile: { focused: 'person', unfocused: 'person-outline' },
  };
  return isFocused ? iconMap[routeName]?.focused : iconMap[routeName]?.unfocused || 'help';
};

function KineticTabBar({ state, descriptors, navigation }: any) {
  // Explicitly define visible tabs
  const VISIBLE_TAB_NAMES = ['index', 'categories', 'cart', 'orders', 'profile'];

  const visibleRoutes = state.routes.filter((route: any) =>
    VISIBLE_TAB_NAMES.includes(route.name)
  );

  const visibleCount = visibleRoutes.length;
  const visibleTabWidth = TAB_BAR_WIDTH / visibleCount;

  // Find the index of current route in visible routes
  const currentRoute = state.routes[state.index];
  const visibleIndex = visibleRoutes.findIndex((r: any) => r.key === currentRoute.key);

  const translateX = useSharedValue(visibleIndex >= 0 ? visibleIndex * visibleTabWidth : 0);

  React.useEffect(() => {
    const newVisibleIndex = visibleRoutes.findIndex((r: any) => r.key === state.routes[state.index].key);
    if (newVisibleIndex >= 0) {
      translateX.value = withSpring(newVisibleIndex * visibleTabWidth, {
        damping: 15,
        stiffness: 120,
        mass: 0.8
      });
    }
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => {
    const currentVisibleIndex = visibleRoutes.findIndex((r: any) => r.key === state.routes[state.index].key);
    const targetX = currentVisibleIndex >= 0 ? currentVisibleIndex * visibleTabWidth : 0;
    const distance = Math.abs(translateX.value - targetX);
    const squishX = interpolate(distance, [0, visibleTabWidth * 0.5], [1, 1.2], Extrapolate.CLAMP);
    const squishY = interpolate(distance, [0, visibleTabWidth * 0.5], [1, 0.9], Extrapolate.CLAMP);

    return {
      transform: [
        { translateX: translateX.value + (visibleTabWidth - INDICATOR_SIZE) / 2 },
        { scaleX: squishX },
        { scaleY: squishY }
      ],
    };
  });

  return (
    <View style={styles.tabBarWrapper}>
      <BlurView intensity={80} tint="dark" style={styles.tabBarContainer}>
        {/* Premium Selection Indicator */}
        <Animated.View style={[styles.indicator, indicatorStyle]}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.25)', 'rgba(5, 150, 105, 0.15)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.indicatorBorder} />
        </Animated.View>

        {/* Tab Items */}
        <View style={[StyleSheet.absoluteFill, styles.itemsContainer]}>
          {visibleRoutes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const actualIndex = state.routes.indexOf(route);
            const isFocused = state.index === actualIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <TabIcon
                  name={getIconName(route.name, isFocused)}
                  isFocused={isFocused}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function TabIcon({ name, isFocused }: { name: any; isFocused: boolean }) {
  const scale = useSharedValue(isFocused ? 1.2 : 1);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.3 : 1);
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isFocused ? 1 : 0.5,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={22} color={isFocused ? "#fff" : colors.textMuted} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <KineticTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} isFocused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} isFocused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'cart' : 'cart-outline'} isFocused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'receipt' : 'receipt-outline'} isFocused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} isFocused={focused} />,
        }}
      />
      <Tabs.Screen name="stores" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: spacing.xl,
    right: spacing.xl,
    height: 72,
    zIndex: 1000,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  tabBarContainer: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    backgroundColor: 'rgba(10,15,10,0.5)',
  },
  itemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 12,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  indicatorBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  tabLabel: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
