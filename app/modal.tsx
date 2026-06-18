import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import { View } from '@/components/Themed';
import SettingsScreen from '../screens/SettingsScreen';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <SettingsScreen />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
