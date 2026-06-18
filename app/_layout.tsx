import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthProvider } from '../context/AuthProvider';
import { ThemeProvider, useTheme } from '../context/ThemeProvider';
import { initTokenStorage } from '../helpers/tokenStorage';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    initTokenStorage().catch(console.error);
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { gradientEnabled } = useTheme();
  const router = useRouter();

  const navThemeBase = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = gradientEnabled
    ? {
        ...navThemeBase,
        colors: {
          ...navThemeBase.colors,
          background: 'transparent',
        },
      }
    : navThemeBase;

  const headerBg = gradientEnabled
    ? 'transparent'
    : Colors[colorScheme ?? 'light'].background;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationThemeProvider value={navTheme}>
          {gradientEnabled ? (
            <LinearGradient colors={Colors.brandGradient.stops} style={{ flex: 1 }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'transparentModal', headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Settings', headerLeft: () => null, headerBackVisible: false, headerRight: () => (
                  <TouchableOpacity onPress={() => router.dismiss()} style={{ marginRight: 15, padding: 5 }}>
                    <FontAwesome name="times" size={22} color={Colors[colorScheme ?? 'light'].text} />
                  </TouchableOpacity>
                ) }} />
                <Stack.Screen name="Information" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Information', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
                <Stack.Screen name="ProfileScreen" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Profile', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
                <Stack.Screen name="Progress" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Progress', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
                <Stack.Screen name="Video" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'CS Videos', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
                <Stack.Screen name="(Auth)/LoginScreen" options={{ headerShown: false }} />
                <Stack.Screen name="(Auth)/ScanQRScreen6" options={{ headerShown: false }} />
                <Stack.Screen name="(Auth)/ForgotScreen" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Reset Password', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
                <Stack.Screen name="LocationSignOff" options={{ headerShown: false }} />
                <Stack.Screen name="SessionAttendance" options={{ headerShown: false }} />
                <Stack.Screen name="UserStats" options={{ headerShown: false }} />
              </Stack>
            </LinearGradient>
          ) : (
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'transparentModal', headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Settings', headerLeft: () => null, headerBackVisible: false, headerRight: () => (
                <TouchableOpacity onPress={() => router.dismiss()} style={{ marginRight: 15, padding: 5 }}>
                  <FontAwesome name="times" size={22} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
              ) }} />
              <Stack.Screen name="Information" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Information', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
              <Stack.Screen name="ProfileScreen" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Profile', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
              <Stack.Screen name="Progress" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Progress', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
              <Stack.Screen name="Video" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'CS Videos', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
              <Stack.Screen name="(Auth)/LoginScreen" options={{ headerShown: false }} />
              <Stack.Screen name="(Auth)/ScanQRScreen6" options={{ headerShown: false }} />
              <Stack.Screen name="(Auth)/ForgotScreen" options={{ headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background }, headerTintColor: Colors[colorScheme ?? 'light'].text, headerTitle: 'Reset Password', contentStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background } }} />
              <Stack.Screen name="LocationSignOff" options={{ headerShown: false }} />
              <Stack.Screen name="SessionAttendance" options={{ headerShown: false }} />
              <Stack.Screen name="UserStats" options={{ headerShown: false }} />
            </Stack>
          )}
        </NavigationThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
