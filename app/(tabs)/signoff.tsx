import { useThemeColor } from '@/components/Themed';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignoffTab() {
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const textColor = useThemeColor({}, 'text');

  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');

  const startScan = useCallback(() => {
    router.push({
      pathname: '/(Auth)/ScanQRScreen6',
      params: { returnTo: '/LocationSignOff', scanMode: 'code128' },
    } as any);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const id = setTimeout(() => startScan(), 0);
      return () => clearTimeout(id);
    }, [startScan])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.title, { color: headingColor }]}>Sign-off</Text>
        <Text style={[styles.subtitle, { color: textColor }]}>Tap below if the scanner doesn’t open automatically.</Text>

        <TouchableOpacity style={[styles.button, { backgroundColor: accentColor }]} onPress={startScan} activeOpacity={0.85}>
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>Start scan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
  },
  button: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
