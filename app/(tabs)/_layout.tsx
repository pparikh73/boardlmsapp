import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// #F39325 = orange from the Board "b" logo lower stripe gradient (official brand asset)
const ACTIVE = '#F39325';
const INACTIVE = '#5c6584';
const TAB_BG = '#161b2a';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 12,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Academy',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="my-learning" options={{ href: null }} />
    </Tabs>
  );
}
