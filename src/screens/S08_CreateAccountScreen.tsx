import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';

export const S08_CreateAccountScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, user, setUser, goBack } = useApp();
  const [fullName, setFullName] = useState(user.fullName || 'Rahul Sharma');
  const [email, setEmail] = useState(user.email || 'rahul.sharma@example.com');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const handleContinue = () => {
    const newErrors: { name?: string; email?: string } = {};
    if (!fullName.trim()) newErrors.name = 'Please enter your full name';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Please enter a valid email address';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUser({
      ...user,
      fullName: fullName.trim(),
      email: email.trim(),
    });
    setActiveScreen('C09_ReferralCode');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Enter your personal details to complete setup</Text>

          {/* Full Name Input */}
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputContainer, errors.name ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.secondaryText}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          {/* Continue Button */}
          <GradientButton
            title="Continue"
            onPress={handleContinue}
            style={styles.button}
          />
        </View>

        <View />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 52,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  button: {
    marginTop: SPACING.xl,
  },
});
