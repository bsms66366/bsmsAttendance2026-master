import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColor } from "@/components/Themed";
import Colors from "@/constants/Colors";
import axiosConfig from "@/helpers/axiosConfig";
import { AuthContext } from "../context/AuthProvider";
import { useTheme } from "../context/ThemeProvider";

export default function FeedbackForm() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { gradientEnabled } = useTheme();

  const backgroundColor = useThemeColor({}, "background");
  const headingColor = useThemeColor({}, "heading");
  const accentColor = useThemeColor({}, "accent");
  const buttonTextColor = useThemeColor({}, "buttonText");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const primaryColor = useThemeColor({}, "primary");

  const [feedbackType, setFeedbackType] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "general", label: "General Feedback" },
    { value: "complaint", label: "Complaint" },
    { value: "praise", label: "Praise" },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter your feedback message");
      return;
    }

    setIsSubmitting(true);

    try {
      const deviceInfo = `${Platform.OS} ${Platform.Version}`;
      const appVersion = Constants.expoConfig?.version || "1.0.0";

      const feedbackData = {
        bsms_id: user?.bsms_id || "",
        student_name: user?.name || "",
        email: user?.email || "",
        feedback_type: feedbackType,
        subject: subject.trim() || null,
        message: message.trim(),
        rating: rating,
        app_version: appVersion,
        device_info: deviceInfo,
      };

      await axiosConfig.post("/app-feedback", feedbackData);

      Alert.alert(
        "Success",
        "Thank you for your feedback! We appreciate your input.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );

      setSubject("");
      setMessage("");
      setRating(null);
    } catch (error: any) {
      console.error("Feedback submission error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to submit feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const Content = (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.subheading, { color: textColor }]}>
          We value your input! Help us improve the app.
        </Text>

      <View style={styles.section}>
        <Text style={[styles.label, { color: textColor }]}>Feedback Type</Text>
        <View style={styles.typeContainer}>
          {feedbackTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                { backgroundColor: cardColor, borderColor },
                feedbackType === type.value && {
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                },
              ]}
              onPress={() => setFeedbackType(type.value)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: textColor },
                  feedbackType === type.value && { color: buttonTextColor },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: textColor }]}>
          Subject (Optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: cardColor, color: textColor, borderColor },
          ]}
          placeholder="Brief summary of your feedback"
          placeholderTextColor={textColor + "80"}
          value={subject}
          onChangeText={setSubject}
          maxLength={255}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: textColor }]}>
          Message <Text style={{ color: "#ff4444" }}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.textArea,
            { backgroundColor: cardColor, color: textColor, borderColor },
          ]}
          placeholder="Tell us more about your feedback..."
          placeholderTextColor={textColor + "80"}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: textColor }]}>
          Rating (Optional)
        </Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Text
                style={[
                  styles.star,
                  { color: rating && star <= rating ? "#FFD700" : borderColor },
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: accentColor },
          isSubmitting && { opacity: 0.6 },
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={[styles.submitButtonText, { color: buttonTextColor }]}>
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cancelButton, { borderColor }]}
        onPress={() => router.back()}
        disabled={isSubmitting}
      >
        <Text style={[styles.cancelButtonText, { color: textColor }]}>
          Cancel
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.8,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
