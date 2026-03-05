import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { BRAND } from '../../constants/skilljar';

// Simple inline SVG-like tab icons using Text (no icon library needed)
// Replace with react-native-vector-icons or @expo/vector-icons if desired
function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return null; // icons are via tabBarIcon label — see below
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND.primary,
        tabBarInactiveTintColor: isDark ? '#484f58' : '#999999',
        tabBarStyle: {
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          borderTopColor: isDark ? '#30363d' : '#e0e0e0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: BRAND.primary,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#ffffff',
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
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            // Using a unicode symbol as a minimal icon — swap for a proper icon library later
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-learning"
        options={{
          title: 'My Learning',
          tabBarLabel: 'My Learning',
          tabBarIcon: ({ color, size }) => <BookIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

// Minimal icon components using Text — replace with a proper icon library for production
import { Text } from 'react-native';

function HomeIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ fontSize: size - 2, color }}>⌂</Text>;
}

function BookIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ fontSize: size - 2, color }}>📖</Text>;
}

function ProfileIcon({ color, size }: { color: string; size: number }) {
  return <Text style={{ fontSize: size - 2, color }}>👤</Text>;
}
