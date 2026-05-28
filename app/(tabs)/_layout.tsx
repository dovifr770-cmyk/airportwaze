// ─── AirportWaze Tab Layout — Light Navigation ────────────────────────────────
// Clean white tab bar with orange circle center tab and active indicator.

import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore }  from '../../src/stores/authStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ── Regular tab icon ──────────────────────────────────────────────────────────

function TabIcon({
  focused, icon, iconActive, color, size,
}: {
  focused:    boolean;
  icon:       IoniconsName;
  iconActive: IoniconsName;
  color:      string;
  size:       number;
}) {
  return (
    <View style={ti.wrap}>
      {focused && <View style={ti.bar} />}
      <View style={[ti.box, focused && ti.boxActive]}>
        <Ionicons name={focused ? iconActive : icon} size={size - 2} color={color} />
      </View>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap:      { alignItems: 'center' },
  bar: {
    position:   'absolute',
    top:        -11,
    width:      26,
    height:     3,
    borderRadius: 2,
    backgroundColor: '#FF6B00',
  },
  box:       { width: 42, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  boxActive: { backgroundColor: 'rgba(255,107,0,0.12)' },
});

// ── Center Navigate icon — orange pill (fits within tab bar) ─────────────────

function NavIcon({ focused }: { focused: boolean }) {
  return (
    <View style={ni.circle}>
      <Ionicons
        name={focused ? 'navigate' : 'navigate-outline'}
        size={22}
        color="#fff"
      />
    </View>
  );
}

const ni = StyleSheet.create({
  circle: {
    width:          52,
    height:         52,
    borderRadius:   26,
    backgroundColor: '#FF6B00',
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#FF6B00',
    shadowOffset:   { width: 0, height: 3 },
    shadowOpacity:  0.5,
    shadowRadius:   10,
    elevation:      10,
  },
});

// ── Layout ─────────────────────────────────────────────────────────────────────

const tabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopWidth:  1,
  borderTopColor:  'rgba(15,23,42,0.08)',
  height:          72,
  paddingBottom:   12,
  paddingTop:      8,
  shadowColor:    '#000',
  shadowOffset:   { width: 0, height: -2 },
  shadowOpacity:  0.06,
  shadowRadius:   12,
  elevation:      12,
  ...(Platform.OS === 'web'
    ? {
        backdropFilter:  'blur(20px)',
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderTop:       '1px solid rgba(15,23,42,0.08)',
        boxShadow:       '0 -2px 16px rgba(0,0,0,0.06)',
      }
    : {}),
};

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading       = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown:             false,
          tabBarStyle,
          tabBarActiveTintColor:   '#FF6B00',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle:        { fontSize: 10, fontWeight: '700', marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon focused={focused} icon="home-outline" iconActive="home" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="maps/index"
          options={{
            title: 'Map',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon focused={focused} icon="map-outline" iconActive="map" color={color} size={size} />
            ),
          }}
        />

        {/* Center — orange circle icon (navigate is a nested Stack navigator) */}
        <Tabs.Screen
          name="navigate"
          options={{
            title: 'Navigate',
            tabBarItemStyle: { paddingTop: 0 },
            tabBarIcon: ({ focused }) => <NavIcon focused={focused} />,
          }}
        />

        <Tabs.Screen
          name="parking/index"
          options={{
            title: 'Parking',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon focused={focused} icon="car-outline" iconActive="car" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon focused={focused} icon="person-outline" iconActive="person" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
