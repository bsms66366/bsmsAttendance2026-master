import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useThemeColor } from '@/components/Themed';
import { AuthContext } from '../../context/AuthProvider';

export default function ForgotScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const { error, isLoading } = useContext(AuthContext);

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={{ marginTop: 130, width: 260 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: headingColor, fontSize: 20 }}>BSMS ATTENDANCE</Text>
        </View>
        <View style={{ marginTop: 40 }}>
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          <TextInput
            style={[styles.inputBox, styles.mt4]}
            onChangeText={setEmail}
            value={email}
            placeholder="Email"
            placeholderTextColor="gray"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity onPress={() => router.back()} style={[styles.loginButton, styles.mt5, { backgroundColor: accentColor }]}>
          {isLoading && (
            <ActivityIndicator style={{ marginRight: 18 }} size="small" color="white" />
          )}
          <Text style={[styles.loginButtonText, { color: buttonTextColor }]}>forgot/reset password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  inputBox: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 5,
  },
  loginButtonText: {},
  mt4: {
    marginTop: 16,
  },
  mt5: {
    marginTop: 22,
  },
});
