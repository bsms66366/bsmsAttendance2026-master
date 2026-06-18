import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { AuthContext } from '../../context/AuthProvider';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, isLoading } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <ScrollView>
      <View style={{ marginTop: 130, width: 260 }}>
        <View style={{ alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 20 }}>BSMS PLACEMENTS</Text>
          <Image
            style={styles.logo}
            source={require('../../assets/images/ClinicalSkillsLogo4-01.png')}
          ></Image>
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
        <TouchableOpacity
          onPress={() => login(email, password)}
          style={[styles.loginButton, styles.mt5]}
        >
          {isLoading && (
            <ActivityIndicator
              style={{ marginRight: 18 }}
              size="small"
              color="white"
            />
          )}
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 12,
          }}
        >
           <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register Screen')}
          >
            <Text style={styles.registerTextLink}> Register</Text>
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
    backgroundColor: '#005e7e',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 250,
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
    backgroundColor: '#fad607',
    padding: 12,
    borderRadius: 5,
  },
  loginButtonText: {
    color: '#005e7e',
  },
  registerText: {
    fontSize: 12,
  },
  registerTextLink: {
    fontSize: 12,
    color: 'white',
    textDecorationLine: 'underline',
  },
  mt4: {
    marginTop: 16,
  },
  mt5: {
    marginTop: 22,
  },
});
