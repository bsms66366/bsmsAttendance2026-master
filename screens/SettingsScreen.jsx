import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
//import Forgot from './Auth/Forgot';
//import ResetPassword from '../screens/Auth/ResetPassword';

// custom components
/* import MainContainer from '../components/Containers/MainContainer';
import KeyboardAvoidingContainer from '../components/Containers/KeyboardAvoidingContainer';
import RegularText from '../components/Texts/RegularText';
import StyledTextInput from '../components/Inputs/StyledTextInput';
import MsgBox from '../components/Texts/MsgBox';
import RegularButton from '../components/Buttons/RegularButton';
import IconHeader from '../components/Icons/IconHeader';
import StyledCodeInput from '../components/Inputs/StyledCodeInput';
import ResendTimer from '../components/Timers/ResendTimer';
import MessageModal from '../components/Modals/MessageModal'; */

import { useThemeColor } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { AuthContext } from "../context/AuthProvider";
import { useTheme } from "../context/ThemeProvider";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          Alert.alert("Logged Out", "You have been successfully logged out.");
        },
      },
    ]);
  };
  const { themeMode, setThemeMode, gradientEnabled, setGradientEnabled } =
    useTheme();

  const backgroundColor = useThemeColor({}, "background");
  const headingColor = useThemeColor({}, "heading");
  const accentColor = useThemeColor({}, "accent");
  const buttonTextColor = useThemeColor({}, "buttonText");
  const dangerColor = useThemeColor({}, "danger");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const placementButtonBorderColor = useThemeColor(
    { light: borderColor, dark: "#1B0273" },
    "border",
  );

  //const [resetpassword, setResetPassword] = useState('');

  const Content = (
    <View style={[styles.container, { backgroundColor }]}>
      {/* <Text
        style={{
          color: headingColor,
          fontSize: 20,
          marginTop: 10,
          marginBottom: 15,
          textAlign: "center",
          alignItems: "center",
        }}
      >
        SETTINGS
      </Text> */}
      {/* <Image
style={styles.logo}
source={require('../assets/images/ClinicalSkillsLogo4-01.png')}
/>      */}

      {/* <Text>Settings Screen</Text>
      <Button title="Logout" onPress={logout} />*/}

      <TouchableOpacity onPress={() => router.push("/Information")}>
        <View
          style={[
            styles.placementButton,
            {
              backgroundColor: accentColor,
              borderColor: placementButtonBorderColor,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[styles.placementButtonText, { color: buttonTextColor }]}
          >
            Information
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/ProfileScreen")}>
        <View
          style={[
            styles.placementButton,
            {
              backgroundColor: accentColor,
              borderColor: placementButtonBorderColor,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[styles.placementButtonText, { color: buttonTextColor }]}
          >
            Profile
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Progress")}>
        <View
          style={[
            styles.placementButton,
            {
              backgroundColor: accentColor,
              borderColor: placementButtonBorderColor,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[styles.placementButtonText, { color: buttonTextColor }]}
          >
            Progress
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Video")}>
        <View
          style={[
            styles.placementButton,
            {
              backgroundColor: accentColor,
              borderColor: placementButtonBorderColor,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[styles.placementButtonText, { color: buttonTextColor }]}
          >
            CS Videos
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(Auth)/ForgotScreen")}>
        <View
          style={[
            styles.placementButton,
            {
              backgroundColor: accentColor,
              borderColor: placementButtonBorderColor,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[styles.placementButtonText, { color: buttonTextColor }]}
          >
            Reset Password
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/FeedbackForm")}>
        <View
          style={[
            styles.placementButton,
            {
              backgroundColor: accentColor,
              borderColor: placementButtonBorderColor,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[styles.placementButtonText, { color: buttonTextColor }]}
          >
            Send Feedback
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.themeSection}>
        <Text style={[styles.themeLabel, { color: headingColor }]}>
          Appearance
        </Text>
        <View style={[styles.themeToggleRow, { backgroundColor: cardColor }]}>
          {["light", "dark", "system"].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.themeOption,
                themeMode === mode && [
                  styles.themeOptionActive,
                  { backgroundColor: accentColor },
                ],
              ]}
              onPress={() => setThemeMode(mode)}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  { color: textColor },
                  themeMode === mode && [
                    styles.themeOptionTextActive,
                    { color: buttonTextColor },
                  ],
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.gradientRow,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <Text style={[styles.gradientLabel, { color: textColor }]}>
            Gradient background
          </Text>
          <TouchableOpacity
            onPress={() => setGradientEnabled(!gradientEnabled)}
            style={[
              styles.gradientToggle,
              {
                backgroundColor: gradientEnabled ? accentColor : "transparent",
                borderColor: accentColor,
              },
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.gradientToggleText,
                { color: gradientEnabled ? buttonTextColor : textColor },
              ]}
            >
              {gradientEnabled ? "On" : "Off"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.logoutButton, { backgroundColor: dangerColor }]}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/*  <Button title="Forgotten/reset password" onPress={Forgot} />  */}
    </View>
  );

  return gradientEnabled ? (
    <LinearGradient
      colors={Colors.brandGradient.stops}
      style={styles.gradientContainer}
    >
      {Content}
    </LinearGradient>
  ) : (
    Content
  );
}
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 170,
  },
  inputBox: {
    backgroundColor: "white",
    borderRadius: 5,
    padding: 8,
  },
  loginButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 5,
  },
  loginButtonText: {},
  registerText: {
    fontSize: 12,
  },
  registerTextLink: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
  textAlignCenter: {
    textAlign: "center",
  },
  mt4: {
    marginTop: 16,
  },

  mt5: {
    marginTop: 22,
  },
  logoutButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginTop: 40,
    width: 250,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  themeSection: {
    marginTop: 30,
    alignItems: "center",
    width: 250,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  themeToggleRow: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
  },
  gradientRow: {
    marginTop: 12,
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gradientLabel: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  gradientToggle: {
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  gradientToggleText: {
    fontSize: 13,
    fontWeight: "700",
  },
  themeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  themeOptionActive: {},
  themeOptionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  themeOptionTextActive: {},
  placementButton: {
    width: 250,
    height: 55,
    marginTop: 20,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  placementButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
