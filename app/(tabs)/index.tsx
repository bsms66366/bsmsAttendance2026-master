import { useThemeColor } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClinicalSkillsLogo from '../../assets/images/ClinicalSkillsLogo3c-02.svg';
import { AuthContext } from '../../context/AuthProvider';

export default function InformationScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <Image
          source={require('../../assets/images/BSMS_logo_WO.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: headingColor }]}>
           PLACEMENT CLINICAL SKILLS RECORD
        </Text>

        <ClinicalSkillsLogo
          width="80%"
          height={340}
        />

        {user?.token ? (
          <View style={[styles.statusContainer, { backgroundColor: cardColor, borderColor: accentColor }]}> 
            <Text style={[styles.statusText, { color: accentColor }]}>✓ Signed in as</Text>
            <Text style={[styles.userNameText, { color: textColor }]}>{user?.name || user?.email || 'User'}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/(Auth)/LoginScreen')}
            style={[styles.signInButton, { backgroundColor: accentColor }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.signInButtonText, { color: buttonTextColor }]}>Sign in</Text>
          </TouchableOpacity>
        )}

        {/* <View style={styles.footer}>
          <Image
            style={styles.footerLogo}
            resizeMode="contain"
            source={require('../../assets/images/BSMS_logo_WO.png')}
          />
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
  },
  headerLogo: {
    height: 44,
    width: 280,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    // paddingTop: 5,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 18,
    justifyContent: 'center',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 1,
    lineHeight: 34,
    // marginTop: 12,
    marginBottom: 16,
  },
  heroImage: {
    width: '80%',
    maxWidth: 340,
    height: 340,
    marginTop: -10,
    marginBottom: 12,
  },
  signInButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
    marginTop: 6,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  qrIconButton: {
    marginTop: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
  },
  footerLogo: {
    width: 240,
    height: 52,
  },
});
