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
  const { setActiveScreen, user, setUser, goBack, setTempRegistration } = useApp();
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const handleContinue = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};
    if (!fullName.trim()) newErrors.name = 'Please enter your full name';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Please enter a valid email address';
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUser({
      ...user,
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: cleanPhone,
    });
    setTempRegistration({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: cleanPhone,
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
          <Text style={styles.subtitle}>Enter your details to complete your Worm Up profile</Text>

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

          {/* Verified Email Input */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <View style={[styles.inputContainer, styles.readOnlyContainer, errors.email ? styles.inputError : null]}>
            <Ionicons name="mail-outline" size={18} color={COLORS.success} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
              value={email}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          {/* Mobile Number Input */}
          <Text style={styles.label}>Mobile Number</Text>
          <View style={[styles.inputContainer, errors.phone ? styles.inputError : null]}>
            <View style={styles.countryPrefix}>
              <Text style={styles.prefixText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '');
                setPhone(cleaned);
                if (errors.phone) setErrors({ ...errors, phone: undefined });
              }}
            />
          </View>
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

          <Text style={styles.noticeText}>
            🔒 Each email and mobile number can only be registered once.
          </Text>

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
  readOnlyContainer: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  readOnlyInput: {
    color: COLORS.textMuted,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  verifiedText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '700',
  },
  countryPrefix: {
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noticeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  button: {
    marginTop: SPACING.lg,
  },
});
