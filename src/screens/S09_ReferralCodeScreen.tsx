import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { useApp } from '../context/AppContext';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';

export const S09_ReferralCodeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { setActiveScreen, user, setUser, goBack, authVerificationId, tempRegistration } = useApp();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Live Sponsor Validation State
  const [validatingSponsor, setValidatingSponsor] = useState(false);
  const [sponsorValid, setSponsorValid] = useState<boolean | null>(null);
  const [sponsorName, setSponsorName] = useState<string>('');
  const [sponsorStatusText, setSponsorStatusText] = useState<string>('');

  React.useEffect(() => {
    const trimmed = code.trim();
    if (trimmed.length >= 3) {
      setValidatingSponsor(true);
      const timer = setTimeout(() => {
        AuthService.validateSponsor(trimmed).then((res) => {
          setValidatingSponsor(false);
          setSponsorValid(res.valid);
          if (res.valid) {
            setSponsorName(res.sponsorName);
            setSponsorStatusText(res.isCompanyRoot ? 'WOMUP Company Root' : `Valid Sponsor: ${res.sponsorName}`);
            setErrorMessage('');
          } else {
            setSponsorName('');
            setSponsorStatusText(res.message || 'Invalid Sponsor ID');
          }
        });
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setValidatingSponsor(false);
      setSponsorValid(null);
      setSponsorName('');
      setSponsorStatusText('');
    }
  }, [code]);

  const performRegistration = async (sponsorCodeToUse?: string) => {
    setLoading(true);
    setErrorMessage('');
    if (authVerificationId) {
      const res = await AuthService.register(
        authVerificationId,
        tempRegistration.fullName || user.fullName || 'Customer',
        tempRegistration.phone || user.phoneNumber || undefined,
        sponsorCodeToUse,
        tempRegistration.preferredCityId || user.preferredCityId,
        tempRegistration.preferredCityName || user.preferredCityName,
        tempRegistration.pincode || user.registrationPincode,
        tempRegistration.city || tempRegistration.preferredCityName || user.preferredCityName,
        tempRegistration.fullNameAsPerAadhaar || user.fullNameAsPerAadhaar,
        sponsorCodeToUse,
      );
      if (res.success) {
        if (res.user) {
          const updatedUser = {
            ...user,
            fullName: res.user.name || user.fullName,
            fullNameAsPerAadhaar: res.user.fullNameAsPerAadhaar || user.fullNameAsPerAadhaar || user.fullName,
            email: res.user.email || user.email,
            phoneNumber: res.user.phone || user.phoneNumber,
            preferredCityId: res.user.preferredCityId || tempRegistration.preferredCityId || user.preferredCityId,
            preferredCityName: res.user.preferredCityName || tempRegistration.preferredCityName || user.preferredCityName,
            registrationCity: res.user.city || tempRegistration.city || user.preferredCityName,
            registrationPincode: res.user.pincode || tempRegistration.pincode,
            referralCode: res.user.referralCode || res.user.sponsorCode || sponsorCodeToUse,
            sponsorCode: res.user.sponsorCode || sponsorCodeToUse || 'WORMUP001',
            isCompanySponsored: res.user.isCompanySponsored ?? (!sponsorCodeToUse),
            shoppingCoins: res.user.shoppingCoins ?? 2000,
            pendingIncome: res.user.pendingIncome ?? 0,
            availableIncome: res.user.availableIncome ?? 0,
            appDownloadIncome: res.user.appDownloadIncome ?? 0,
            verificationStatus: res.user.verificationStatus || 'NON_VERIFIED',
            aadhaarVerified: res.user.aadhaarVerified || false,
          };
          setUser(updatedUser);
          StorageService.saveItem(StorageService.KEYS.USER, updatedUser);
        }
        StorageService.saveItem(StorageService.KEYS.ACTIVE_SCREEN, 'Blinkit_Home');
        setLoading(false);
        setActiveScreen('C10_LocationPermission');
      } else {
        setLoading(false);
        setErrorMessage(res.message || 'Could not complete registration. Please try again.');
      }
    } else {
      setLoading(false);
      setActiveScreen('C10_LocationPermission');
    }
  };

  const handleApply = async () => {
    const trimmed = code.trim();
    if (trimmed) {
      if (sponsorValid === false) {
        setErrorMessage('Please enter a valid Sponsor ID or leave blank for default.');
        return;
      }
      performRegistration(trimmed);
    } else {
      performRegistration();
    }
  };

  const handleSkip = () => {
    performRegistration();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <TouchableOpacity
        onPress={goBack}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Gift / Reward Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="gift-outline" size={40} color={COLORS.hotPink} />
        </View>

        <Text style={styles.title}>Sponsor / Referral ID</Text>
        <Text style={styles.subtitle}>
          Enter your Sponsor ID if you were invited, or leave blank to join directly under Womup.
        </Text>

        {/* ₹2,000 Shopping Coins Welcome Callout */}
        <View style={styles.rewardBanner}>
          <Text style={styles.rewardText}>🪙 ₹2,000 Shopping Coins Welcome Bonus will be credited!</Text>
        </View>

        <View
          style={[
            styles.inputContainer,
            sponsorValid === true ? styles.inputSuccess : null,
            sponsorValid === false ? styles.inputError : null,
          ]}
        >
          <Ionicons name="people-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Sponsor ID (e.g. WORMUP001)"
            placeholderTextColor={COLORS.secondaryText}
            autoCapitalize="characters"
            value={code}
            onChangeText={(text) => {
              setCode(text);
              if (errorMessage) setErrorMessage('');
            }}
          />
          {validatingSponsor && (
            <Text style={styles.checkingText}>Checking...</Text>
          )}
          {sponsorValid === true && !validatingSponsor && (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          )}
          {sponsorValid === false && !validatingSponsor && (
            <Ionicons name="close-circle" size={20} color={COLORS.error} />
          )}
        </View>

        {/* Live validation feedback */}
        {sponsorStatusText ? (
          <View style={styles.statusFeedbackRow}>
            <Ionicons
              name={sponsorValid ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={15}
              color={sponsorValid ? COLORS.success : COLORS.error}
            />
            <Text style={[styles.statusFeedbackText, sponsorValid ? styles.textSuccess : styles.textError]}>
              {sponsorStatusText}
            </Text>
          </View>
        ) : null}

        {/* Default Sponsor Note */}
        <View style={styles.defaultSponsorNote}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.navy} />
          <Text style={styles.defaultSponsorNoteText}>
            💡 If left blank, you will automatically join under <Text style={{ fontWeight: '700' }}>WOMUP Company</Text> (Default Root Sponsor: WOMUP001).
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={COLORS.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <GradientButton
          title={loading ? 'Creating Account...' : code.trim() ? 'Continue with Sponsor' : 'Join with Company Sponsor'}
          onPress={handleApply}
          style={styles.button}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          disabled={loading}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>{loading ? 'Please wait...' : 'Skip (Join Womup Directly)'}</Text>
        </TouchableOpacity>
      </View>

      <View />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xxl,
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
    width: '100%',
    marginBottom: SPACING.md,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  rewardBanner: {
    backgroundColor: '#EAF8F1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  rewardText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    width: '100%',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  inputSuccess: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  checkingText: {
    fontSize: 12,
    color: COLORS.hotPink,
    fontWeight: '600',
    marginRight: 6,
  },
  statusFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginTop: -8,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  statusFeedbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSuccess: {
    color: '#15803D',
  },
  textError: {
    color: COLORS.error,
  },
  defaultSponsorNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.card,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.lg,
    width: '100%',
    gap: 8,
  },
  defaultSponsorNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
});
