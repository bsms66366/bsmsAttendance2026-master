import { useThemeColor } from '@/components/Themed';
import * as React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyComponent = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const primaryColor = useThemeColor({}, 'primary');
  const accentColor = useThemeColor({}, 'accent');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <Image
          source={require('../assets/images/BSMS_logo_WO.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: cardColor }]}>
          <View style={styles.titleRow}>
            <Image
              source={require('../assets/images/bsmsHelixYelo.png')}
              style={styles.icon}
            />
            <Text style={[styles.sectionTitle, { color: headingColor }]}>Placement Information</Text>
          </View>
          <Text style={[styles.paragraph, { color: textColor }]}>
            Welcome to the clinical practice component of Phase 1 teaching. The aim of your placements in both community and secondary care is to facilitate the development of your communication and examination skills in a protected environment. You will be able to observe your clinical teachers seeing patients and, as you become more proficient, you will be allowed to practise some clinical skills under close supervision.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: cardColor }]}>
          <View style={styles.titleRow}>
            <Image
              source={require('../assets/images/bsmsHelixYelo.png')}
              style={styles.icon}
            />
            <Text style={[styles.sectionTitle, { color: headingColor }]}>Attendance</Text>
          </View>
          <Text style={[styles.paragraph, { color: textColor }]}>
            At BSMS 100% Attendance is expected, and some aspects of modules require an 80% attendance rate as part of the assessment component. This App should be used to record your attendance at clinical sessions and placements, and will be checked at the end of the year for your attendance profile.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: cardColor }]}>
          <View style={styles.titleRow}>
            <Image
              source={require('../assets/images/bsmsHelixYelo.png')}
              style={styles.icon}
            />
            <Text style={[styles.sectionTitle, { color: headingColor }]}>Dress Code</Text>
          </View>
          <Text style={[styles.paragraph, { color: textColor }]}>
            You should always dress smartly when in a clinical environment and when meeting patients. Please note that this includes examinations which occur in, or simulate, the clinical environment such as the OCSEs.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: cardColor }]}>
          <View style={styles.titleRow}>
            <Image
              source={require('../assets/images/bsmsHelixYelo.png')}
              style={styles.icon}
            />
            <Text style={[styles.sectionTitle, { color: headingColor }]}>BSMSDocuments</Text>
          </View>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://placements.bsms.ac.uk/pdfDocuments/BSMS_Dress_Code.pdf')}
          >
            <Text style={[styles.link, { color: '#ffffff'}]}>📄 View Dress code Document (PDF)</Text>
          </TouchableOpacity>
           <TouchableOpacity
            onPress={() => Linking.openURL('https://placements.bsms.ac.uk/pdfDocuments/Placements_Attendance_Sources_References.pdf')}
          >
            <Text style={[styles.link, { color: '#ffffff' }]}>📄 Sources / References (PDF)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLogo: {
    height: 44,
    width: 280,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  section: {
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c7ced6',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    fontSize: 15,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});


export default MyComponent;