import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { BRAND } from '../../constants/skilljar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND.white,
        tabBarInactiveTintColor: BRAND.mid1,
        tabBarStyle: {
          backgroundColor: BRAND.dark1,   // #252c43 — Board dark neutral
          borderTopColor: BRAND.dark2,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: BRAND.primary,  // #253e7d — Board Blue
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: BRAND.white,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerTitle: 'Board Academy',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Board Academy',
          tabBarLabel: 'Academy',
          tabBarIcon: ({ color, size }) => <AcademyIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Board Community',
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, size }) => <CommunityIcon color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
          headerShown: false,
        }}
      />
      {/* Hidden — redirects to home */}
      <Tabs.Screen
        name="my-learning"
        options={{ href: null }}
      />
    </Tabs>
  );
}

function AcademyIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ fontSize: size - 2, color }}>🎓</Text>;
}

function CommunityIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ fontSize: size - 2, color }}>👥</Text>;
}

function SettingsIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ fontSize: size - 2, color }}>⚙️</Text>;
}
