import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useThemeColor } from '@/components/Themed';
import { AuthContext } from '../../context/AuthProvider';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, login, error, isLoading } = useContext(AuthContext);

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    Alert.alert(
      'Educational Use Only',
      'This app is for educational purposes only and must not be used to make clinical decisions without supervision.',
      [{ text: 'I Understand', style: 'default' }]
    );
  }, []);

  useEffect(() => {
    if (user?.token) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleLogin = async () => {
    await login(email, password);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView>
        <View style={{ marginTop: 130, width: 260 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: headingColor, fontSize: 20 }}>BSMS PLACEMENTS</Text>
            <Image style={styles.logo} source={require('../../assets/images/ClinicalSkillsLogo3c-02.png')} />
          </View>
          <View style={{ marginTop: 10 }}>
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
            <TextInput
              style={[styles.inputBox, styles.mt4]}
              onChangeText={setPassword}
              value={password}
              placeholder="Password"
              placeholderTextColor="gray"
              autoCapitalize="none"
              secureTextEntry={true}
            />
          </View>
          <TouchableOpacity onPress={handleLogin} style={[styles.loginButton, styles.mt5, { backgroundColor: accentColor }]}>
            {isLoading && (
              <ActivityIndicator style={{ marginRight: 18 }} size="small" color="white" />
            )}
            <Text style={[styles.loginButtonText, { color: buttonTextColor }]}>Login</Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 12,
            }}>
            <Text style={[styles.registerText, { color: textColor }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(Auth)/ForgotScreen')}>
              <Text style={[styles.registerTextLink, { color: accentColor }]}> Forgot?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 210,
    height: 300,
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

  registerText: {
    fontSize: 12,
  },
  registerTextLink: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  mt4: {
    marginTop: 16,
  },
  mt5: {
    marginTop: 22,
  },
});
