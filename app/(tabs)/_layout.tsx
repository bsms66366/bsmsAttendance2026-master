import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeProvider';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { gradientEnabled } = useTheme();

  return (
    <Tabs
      initialRouteName="examination"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          backgroundColor: gradientEnabled ? 'transparent' : Colors[colorScheme ?? 'light'].background,
        },
        headerStyle: {
          backgroundColor: gradientEnabled ? 'transparent' : Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        headerRight: () => (
          <Pressable onPress={() => router.push('/modal')}>
            {({ pressed }) => (
              <FontAwesome
                name="cog"
                size={24}
                color={Colors[colorScheme ?? 'light'].text}
                style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        ),
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="examination"
        options={{
          title: 'Examinations',
          tabBarIcon: ({ color }) => <TabBarIcon name="stethoscope" color={color} />,
        }}
      />
      <Tabs.Screen
        name="signoff"
        options={{
          title: 'Signoff',
          tabBarIcon: ({ color }) => <TabBarIcon name="qrcode" color={color} />,
        }}
      />
      <Tabs.Screen
        name="session-attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar-check-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />

      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="video" options={{ href: null }} />
      <Tabs.Screen name="skills" options={{ href: null }} />
    </Tabs>
  );
}
