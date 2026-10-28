import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { GradientButton } from '../components/common/GradientButton';
import { FileUploadField } from '../components/common/FileUploadField';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { LocationService } from '../services/locationService';
import * as Clipboard from 'expo-clipboard';

interface CityItem {
  id: string;
  name: string;
  code: string;
  state?: string;
}

export const S08_CreateAccountScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const {
    setActiveScreen,
    user,
    setUser,
    goBack,
    setTempRegistration,
    authVerificationId,
    tempRegistration,
  } = useApp();
  const [firstName, setFirstName] = useState(user.firstName || (user.fullName ? user.fullName.split(' ')[0] : ''));
  const [surname, setSurname] = useState(user.surname || (user.fullName ? user.fullName.split(' ').slice(1).join(' ') : ''));
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [pincode, setPincode] = useState(user.registrationPincode || '');

  // Password fields for Account Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success Modal & Credentials Display State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredSponsorId, setRegisteredSponsorId] = useState('');
  const [registeredPassword, setRegisteredPassword] = useState('');
  const [showRegisteredPassword, setShowRegisteredPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'sponsor' | 'password' | null>(null);

  // Optional Aadhaar KYC Fields (Must remain optional and never block registration)
  const [aadhaarNumber, setAadhaarNumber] = useState(user.aadhaarNumber || '');
  const [aadhaarFrontUrl, setAadhaarFrontUrl] = useState(
    user.customer_image_aadhar_front || (user as any).aadharFrontImage || ''
  );
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState(
    user.customer_image_aadhar_back || (user as any).aadharBackImage || ''
  );
  const [showAadhaarSection, setShowAadhaarSection] = useState(false);

  // Sponsor ID State (Optional with live validation)
  const [sponsorCode, setSponsorCode] = useState(user.sponsorCode || tempRegistration?.sponsorCode || '');
  const [sponsorChecking, setSponsorChecking] = useState(false);
  const [sponsorValid, setSponsorValid] = useState<boolean | null>(null);
  const [sponsorName, setSponsorName] = useState<string>('');
  const [sponsorStatusText, setSponsorStatusText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Timing State
  const [timingAllowed, setTimingAllowed] = useState(true);
  const [timingMessage, setTimingMessage] = useState('');

  // Pincode Serviceability State
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeServiceable, setPincodeServiceable] = useState<boolean | null>(null);
  const [pincodeStatusText, setPincodeStatusText] = useState('Detecting your location...');

  // Service City State
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(user.preferredCityId || null);
  const [selectedCityName, setSelectedCityName] = useState<string>(user.preferredCityName || 'Ahmedabad');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    firstName?: string;
    surname?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    sponsor?: string;
    city?: string;
    pincode?: string;
    timing?: string;
  }>({});

  const detectCurrentLocation = async () => {
    setPincodeChecking(true);
    setPincodeStatusText('Auto-detecting real location GPS...');
    try {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        const detectedPin = loc.pincode ? String(loc.pincode).trim() : '';
        const detectedCity = loc.city || 'Ahmedabad';

        if (detectedPin && /^\d{6}$/.test(detectedPin)) {
          setPincode(detectedPin);
        }
        if (detectedCity) {
          setSelectedCityName(detectedCity);
        }

        // Live check serviceability for current coordinates & pin
        const area = await LocationService.resolveArea(loc.latitude, loc.longitude, true);
        if (area && area.success && area.serviceable) {
          if (area.cityId) setSelectedCityId(area.cityId);
          if (!detectedPin && (area.pincode || area.pincodes?.[0])) {
            setPincode(area.pincode || area.pincodes![0]);
          }
          setPincodeServiceable(true);
          setPincodeStatusText(`✓ Eligible Zone: ${area.areaName || ''} (${detectedCity})`);
        } else if (detectedPin && /^\d{6}$/.test(detectedPin)) {
          const pinRes = await AuthService.checkPincode(detectedPin);
          setPincodeServiceable(pinRes.serviceable);
          setPincodeStatusText(
            pinRes.message || (pinRes.serviceable ? '✓ Serviceable Pincode' : 'Open for registration! Deliveries in active hubs.')
          );
          if (pinRes.serviceable && pinRes.city) {
            setSelectedCityName(pinRes.city);
          }
        } else {
          setPincodeServiceable(false);
          setPincodeStatusText('Open for registration! Deliveries & team earnings in eligible zones.');
        }
      } else {
        setPincodeStatusText('Please enter your 6-digit delivery pincode');
      }
    } catch (err) {
      console.warn('GPS location auto-detect failed:', err);
      setPincodeStatusText('Please enter your 6-digit delivery pincode');
    } finally {
      setPincodeChecking(false);
    }
  };

  useEffect(() => {
    // Check registration hours (10:00 PM to 6:00 AM IST)
    AuthService.checkRegistrationTiming().then((res) => {
      setTimingAllowed(res.allowed);
      if (!res.allowed) {
        setTimingMessage(res.message);
      }
    });

    // Auto-detect real live GPS location
    detectCurrentLocation();

    // Fetch active cities configured by Admin
    AuthService.getCities().then((fetchedCities) => {
      if (fetchedCities && fetchedCities.length > 0) {
        setCities(fetchedCities);
        const existing = fetchedCities.find(
          (c) => c.name.toLowerCase() === selectedCityName.toLowerCase() || c.id === selectedCityId
        );
        if (existing) {
          setSelectedCityId(existing.id);
          setSelectedCityName(existing.name);
        } else {
          setSelectedCityId(fetchedCities[0].id);
          setSelectedCityName(fetchedCities[0].name);
        }
      }
    });
  }, []);

  // Debounced Pincode Serviceability Check
  useEffect(() => {
    const trimmed = pincode.trim();
    if (trimmed.length === 6) {
      setPincodeChecking(true);
      const timer = setTimeout(() => {
        AuthService.checkPincode(trimmed).then((res) => {
          setPincodeChecking(false);
          setPincodeServiceable(res.serviceable);
          setPincodeStatusText(res.message);
          if (res.serviceable && res.city) {
            setSelectedCityName(res.city);
          }
        });
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setPincodeChecking(false);
      setPincodeServiceable(null);
      setPincodeStatusText('');
    }
  }, [pincode]);

  // Debounced Live Sponsor Validation (500ms)
  useEffect(() => {
    const trimmed = sponsorCode.trim().toUpperCase();
    if (trimmed.length >= 4) {
      setSponsorChecking(true);
      const timer = setTimeout(() => {
        AuthService.validateSponsor(trimmed).then((res: any) => {
          setSponsorChecking(false);
          const isValid = res.valid ?? res.isValid;
          setSponsorValid(isValid);
          if (isValid) {
            setSponsorName(res.sponsorName || 'WOMUP Sponsor');
            setSponsorStatusText(res.isCompanyRoot ? 'WOMUP Company Root' : `Sponsor: ${res.sponsorName}`);
            if (errors.sponsor) setErrors((prev) => ({ ...prev, sponsor: undefined }));
          } else {
            setSponsorName('');
            setSponsorStatusText(res.message || 'Invalid Sponsor ID. Please check and try again.');
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSponsorChecking(false);
      setSponsorValid(null);
      setSponsorName('');
      setSponsorStatusText('');
    }
  }, [sponsorCode]);

  const handleContinue = async () => {
    if (isSubmitting) return;

    const newErrors: {
      name?: string;
      firstName?: string;
      surname?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
      sponsor?: string;
      city?: string;
      pincode?: string;
      timing?: string;
    } = {};

    if (!timingAllowed) {
      newErrors.timing = timingMessage || 'New registrations are closed between 10:00 PM and 6:00 AM IST.';
    }

    if (!firstName.trim()) newErrors.firstName = 'Please enter your first name as per Aadhar card';
    if (!surname.trim()) newErrors.surname = 'Please enter your last name as per Aadhar card';
    const computedName = `${firstName.trim()} ${surname.trim()}`.trim();

    if (!email.trim() || !email.includes('@')) newErrors.email = 'Please enter a valid email address';

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    // Password validation
    if (!password || password.trim().length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Sponsor validation check
    const cleanSponsor = sponsorCode.trim().toUpperCase();
    if (cleanSponsor) {
      if (sponsorValid === false) {
        newErrors.sponsor = sponsorStatusText || 'Invalid Sponsor ID. Please check and try again, or leave blank.';
      }
    }

    const cleanPin = pincode.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      newErrors.pincode = 'Please enter a valid 6-digit Pincode';
    }

    if (!selectedCityName || !selectedCityId) {
      newErrors.city = 'Please select your service city';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalSponsor = cleanSponsor || 'WOM001';
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '').trim();

    setUser({
      ...user,
      firstName: firstName.trim(),
      surname: surname.trim(),
      fullName: computedName,
      fullNameAsPerAadhaar: computedName,
      email: email.trim(),
      phoneNumber: cleanPhone,
      registrationPincode: cleanPin,
      registrationCity: selectedCityName,
      preferredCityId: selectedCityId || undefined,
      preferredCityName: selectedCityName,
      sponsorCode: finalSponsor,
      isCompanySponsored: !cleanSponsor,
      shoppingCoins: user.shoppingCoins || 2000,
      verificationStatus: cleanAadhaar ? 'PENDING' : (user.verificationStatus || 'NON_VERIFIED'),
      customerKycStatus: cleanAadhaar ? 1 : (user.customerKycStatus || 0),
      aadhaarNumber: cleanAadhaar || user.aadhaarNumber,
      aadharNumber: cleanAadhaar || (user as any).aadharNumber,
      customer_image_aadhar_front: aadhaarFrontUrl || user.customer_image_aadhar_front,
      customer_image_aadhar_back: aadhaarBackUrl || user.customer_image_aadhar_back,
      aadharFrontImage: aadhaarFrontUrl || (user as any).aadharFrontImage,
      aadharBackImage: aadhaarBackUrl || (user as any).aadharBackImage,
    });

    setTempRegistration({
      firstName: firstName.trim(),
      surname: surname.trim(),
      fullName: computedName,
      fullNameAsPerAadhaar: computedName,
      email: email.trim(),
      phone: cleanPhone,
      pincode: cleanPin,
      city: selectedCityName,
      preferredCityId: selectedCityId || undefined,
      preferredCityName: selectedCityName,
      sponsorCode: finalSponsor,
    });

    // If authVerificationId is present, execute backend registration immediately
    if (authVerificationId) {
      setIsSubmitting(true);
      try {
        const res = await AuthService.register(
          authVerificationId,
          fullName.trim(),
          cleanPhone,
          finalSponsor,
          selectedCityId || undefined,
          selectedCityName,
          cleanPin,
          selectedCityName,
          fullName.trim(),
          finalSponsor,
          cleanAadhaar || undefined,
          aadhaarFrontUrl || undefined,
          aadhaarBackUrl || undefined,
          password.trim(),
        );
        setIsSubmitting(false);
        if (res.success && res.user) {
          const assignedSponsor = res.user.referralCode || res.user.sponsorCode || 'WOM001';
          const updatedUser = {
            ...user,
            fullName: res.user.name || fullName.trim(),
            fullNameAsPerAadhaar: res.user.fullNameAsPerAadhaar || fullName.trim(),
            email: res.user.email || email.trim(),
            phoneNumber: res.user.phone || cleanPhone,
            preferredCityId: res.user.preferredCityId || selectedCityId || undefined,
            preferredCityName: res.user.preferredCityName || selectedCityName,
            registrationCity: res.user.city || selectedCityName,
            registrationPincode: res.user.pincode || cleanPin,
            referralCode: assignedSponsor,
            sponsorCode: res.user.sponsorCode || finalSponsor || 'WOM001',
            isCompanySponsored: res.user.isCompanySponsored ?? (!finalSponsor),
            shoppingCoins: res.user.shoppingCoins ?? 2000,
            pendingIncome: res.user.pendingIncome ?? 0,
            availableIncome: res.user.availableIncome ?? 0,
            appDownloadIncome: res.user.appDownloadIncome ?? 0,
            verificationStatus: res.user.verificationStatus || (cleanAadhaar ? 'PENDING' : 'NON_VERIFIED'),
            customerKycStatus: res.user.customerKycStatus || (cleanAadhaar ? 1 : 0),
            aadhaarNumber: cleanAadhaar || res.user.aadhaarNumber,
            aadharNumber: cleanAadhaar || res.user.aadharNumber,
            customer_image_aadhar_front: aadhaarFrontUrl || res.user.customer_image_aadhar_front,
            customer_image_aadhar_back: aadhaarBackUrl || res.user.customer_image_aadhar_back,
            aadharFrontImage: aadhaarFrontUrl || res.user.aadharFrontImage,
            aadharBackImage: aadhaarBackUrl || res.user.aadharBackImage,
            aadhaarVerified: res.user.aadhaarVerified || false,
          };
          setUser(updatedUser);
          StorageService.saveItem(StorageService.KEYS.USER, updatedUser);

          // DO NOT navigate to dashboard directly!
          // Open Success Modal displaying Sponsor ID & Password
          setRegisteredSponsorId(assignedSponsor);
          setRegisteredPassword(password.trim());
          setShowSuccessModal(true);
          return;
        } else {
          const isConflict = res.message?.includes('already registered') || res.message?.includes('already exists') || res.message?.includes('Delivery') || res.message?.includes('Store') || res.message?.includes('Vendor');
          Alert.alert(
            isConflict ? 'Account Already Exists' : 'Registration Notice',
            res.message || 'Could not complete registration. Please verify your details and try again.'
          );
          return;
        }
      } catch (e: any) {
        setIsSubmitting(false);
        console.warn('Registration error:', e);
        const msg = e?.message || 'Could not complete registration. Please check your network and try again.';
        const isConflict = msg.includes('already registered') || msg.includes('already exists') || msg.includes('Delivery') || msg.includes('Store') || msg.includes('Vendor');
        Alert.alert(
          isConflict ? 'Account Already Exists' : 'Registration Error',
          msg
        );
        return;
      }
    } else {
      Alert.alert(
        'Email Verification Required',
        'Please verify your email with OTP before creating your account.',
        [{ text: 'Verify Email', onPress: () => setActiveScreen('C06_MobileNumber') }]
      );
      return;
    }
  };

  const handleCopySponsorId = async () => {
    if (!registeredSponsorId) return;
    await Clipboard.setStringAsync(registeredSponsorId);
    setCopiedField('sponsor');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyPassword = async () => {
    if (!registeredPassword) return;
    await Clipboard.setStringAsync(registeredPassword);
    setCopiedField('password');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleProceedToLogin = () => {
    setShowSuccessModal(false);
    setUser({
      ...user,
      referralCode: registeredSponsorId,
      email: email.trim(),
      phoneNumber: phone.replace(/\D/g, ''),
    });
    setActiveScreen('C06_MobileNumber');
  };

  const filteredCities = cities.filter(
    (c) =>
      c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

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
          <Text style={styles.subtitle}>Enter your details to complete your Womup profile</Text>

          {/* Registration Hours Closed Warning Banner */}
          {!timingAllowed && (
            <View style={styles.timingClosedBanner}>
              <View style={styles.timingClosedHeader}>
                <Ionicons name="moon" size={20} color="#DC2626" />
                <Text style={styles.timingClosedTitle}>Registrations Closed (10 PM - 6 AM IST)</Text>
              </View>
              <Text style={styles.timingClosedDesc}>
                {timingMessage || 'New registrations are temporarily closed for the night. Please register after 6:00 AM IST. Existing users can log in anytime.'}
              </Text>
            </View>
          )}

          {/* ₹2,000 Shopping Coins Welcome Bonus Card */}
          <View style={styles.coinsBonusBanner}>
            <View style={styles.coinsBonusIconWrap}>
              <Text style={styles.coinsBonusIcon}>🪙</Text>
            </View>
            <View style={styles.coinsBonusTextWrap}>
              <Text style={styles.coinsBonusTitle}>₹2,000 Shopping Coins Bonus</Text>
              <Text style={styles.coinsBonusSub}>
                Instant ₹2,000 shopping bonus credited to your wallet upon joining!
              </Text>
            </View>
          </View>

          {/* Split Name Fields: First Name + Surname (As per Aadhar Card) */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              First Name <Text style={styles.aadharTag}>(as per Aadhar card)</Text> <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>
          <View style={[styles.inputContainer, errors.firstName ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="First name as per Aadhar card (e.g. Ramesh)"
              placeholderTextColor={COLORS.secondaryText}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setFullName(`${text} ${surname}`.trim());
                if (errors.firstName) setErrors({ ...errors, firstName: undefined });
              }}
            />
          </View>
          {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

          <View style={[styles.labelRow, { marginTop: 12 }]}>
            <Text style={styles.label}>
              Last Name / Surname <Text style={styles.aadharTag}>(as per Aadhar card)</Text> <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>
          <View style={[styles.inputContainer, errors.surname ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Last name as per Aadhar card (e.g. Patel)"
              placeholderTextColor={COLORS.secondaryText}
              value={surname}
              onChangeText={(text) => {
                setSurname(text);
                setFullName(`${firstName} ${text}`.trim());
                if (errors.surname) setErrors({ ...errors, surname: undefined });
              }}
            />
          </View>
          {errors.surname ? <Text style={styles.errorText}>{errors.surname}</Text> : null}

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
          <Text style={styles.label}>
            Mobile Number <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
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

          {/* Password Input */}
          <Text style={styles.label}>
            Password <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Create password (min 6 characters)"
              placeholderTextColor={COLORS.secondaryText}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          {/* Confirm Password Input */}
          <Text style={styles.label}>
            Confirm Password <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={COLORS.secondaryText}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

          {/* Sponsor ID Input (Optional) */}
          <View style={styles.labelRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.label}>Sponsor ID</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>Optional</Text>
              </View>
            </View>
            {sponsorChecking && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.sponsorCheckingText}>Validating...</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.inputContainer,
              errors.sponsor ? styles.inputError : null,
              sponsorValid === true ? styles.inputSuccess : null,
              sponsorValid === false ? styles.inputError : null,
            ]}
          >
            <Ionicons
              name="gift-outline"
              size={18}
              color={
                sponsorValid === true
                  ? COLORS.success
                  : sponsorValid === false
                  ? COLORS.error
                  : COLORS.textMuted
              }
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter sponsor code (e.g. WOM12345)"
              placeholderTextColor={COLORS.secondaryText}
              autoCapitalize="characters"
              maxLength={10}
              value={sponsorCode}
              onChangeText={(text) => {
                const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setSponsorCode(upper);
                if (errors.sponsor) setErrors((prev) => ({ ...prev, sponsor: undefined }));
              }}
            />
            {sponsorValid === true && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            )}
            {sponsorValid === false && (
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
            )}
          </View>

          {/* Helper / Status Text for Sponsor */}
          {errors.sponsor ? (
            <Text style={styles.errorText}>{errors.sponsor}</Text>
          ) : sponsorValid === true ? (
            <View style={styles.sponsorSuccessWrap}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
              <Text style={styles.sponsorSuccessText}>
                ✓ {sponsorStatusText || `Sponsor: ${sponsorName}`}
              </Text>
            </View>
          ) : sponsorValid === false ? (
            <View style={styles.sponsorFailWrap}>
              <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
              <Text style={styles.sponsorFailText}>
                ✗ {sponsorStatusText || 'Invalid Sponsor ID. Please check and try again.'}
              </Text>
            </View>
          ) : (
            <Text style={styles.sponsorDefaultHint}>
              💡 Leave blank to join under Admin Sponsor 
            </Text>
          )}

          {/* Delivery Pincode Input (Non-editable, strictly Auto-detected from GPS) */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Delivery Pincode <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            {pincodeChecking ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '600' }}>Detecting...</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={detectCurrentLocation}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons name="lock-closed" size={12} color="#64748B" />
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>Auto-detected</Text>
                <Ionicons name="refresh-outline" size={12} color="#2563EB" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            )}
          </View>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: '#F8FAFC', borderColor: pincodeServiceable === false ? '#93C5FD' : '#E2E8F0' },
              errors.pincode ? styles.inputError : null,
              pincodeServiceable === true ? styles.inputSuccess : null,
            ]}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={
                pincodeServiceable === true
                  ? COLORS.success
                  : pincodeServiceable === false
                  ? '#3B82F6'
                  : COLORS.textMuted
              }
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: '#1E293B', fontWeight: '700' }]}
              placeholder={pincodeChecking ? 'Detecting location...' : 'Auto-detected from GPS'}
              placeholderTextColor={COLORS.secondaryText}
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              editable={false}
              selectTextOnFocus={false}
            />
            {pincodeServiceable === true && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            )}
            {pincodeServiceable === false && (
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
            )}
          </View>
          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3, marginBottom: 8 }}>
            🔒 City and PIN code are auto-detected from your GPS location.
          </Text>
          {errors.pincode ? (
            <Text style={styles.errorText}>{errors.pincode}</Text>
          ) : pincodeStatusText ? (
            <Text
              style={[
                styles.pincodeStatusHint,
                pincodeServiceable ? styles.pincodeSuccessText : { color: '#2563EB', fontWeight: '600' },
              ]}
            >
              {pincodeStatusText}
            </Text>
          ) : null}

          {/* ── YOUR SERVICE CITY * ── */}
          <View style={styles.citySectionHeaderRow}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionHeaderText}>YOUR SERVICE CITY *</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Select City <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="lock-closed" size={12} color="#64748B" />
              <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>Auto-detected</Text>
            </View>
          </View>
          <View
            style={[
              styles.inputContainer,
              styles.cityDropdownBtn,
              { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
              errors.city ? styles.inputError : null,
            ]}
          >
            <View style={styles.cityDropdownLeft}>
              <Text style={styles.cityIcon}>🏙️</Text>
              <Text style={[styles.cityText, { color: '#1E293B', fontWeight: '700' }]}>
                {selectedCityName || 'Ahmedabad'}
              </Text>
            </View>
            <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
          </View>
          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3, marginBottom: 8 }}>
            🔒 City is matched to your detected GPS location and configured service area.
          </Text>
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

          {/* Info Badge */}
          <View style={styles.cityInfoRow}>
            <Ionicons name="information-circle-outline" size={15} color={COLORS.hotPink} />
            <Text style={styles.cityInfoText}>
              You'll see products from stores serving this city
            </Text>
          </View>

          {pincodeServiceable === false && (
            <View style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="information-circle" size={20} color="#2563EB" />
              <Text style={{ color: '#1E40AF', fontSize: 12, flex: 1, fontWeight: '500' }}>
                Registration open across India! Instant delivery & referral income are active in designated launch zones.
              </Text>
            </View>
          )}

          {/* Optional Aadhaar Details Section */}
          <View style={styles.aadhaarCardContainer}>
            <TouchableOpacity
              style={styles.aadhaarHeaderRow}
              onPress={() => setShowAadhaarSection((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={styles.aadhaarHeaderLeft}>
                <View style={styles.aadhaarShieldWrap}>
                  <Ionicons name="shield-checkmark" size={16} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.aadhaarSectionTitle}>Aadhaar Verification</Text>
                    <View style={styles.optionalBadge}>
                      <Text style={styles.optionalBadgeText}>Optional</Text>
                    </View>
                  </View>
                  <Text style={styles.aadhaarSectionSub}>
                    {showAadhaarSection
                      ? 'Add now or manage later in Profile for withdrawals'
                      : 'Tap to add Aadhaar & image uploads (Optional)'}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showAadhaarSection ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {showAadhaarSection && (
              <View style={styles.aadhaarBody}>
                {/* 1. Aadhaar Card Number */}
                <View style={styles.aadhaarFieldGroup}>
                  <Text style={styles.label}>
                    Aadhaar Card Number{' '}
                    <Text style={styles.optionalText}>(Optional)</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="12-digit Aadhaar (e.g. 1234 5678 9012)"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      maxLength={14}
                      value={aadhaarNumber}
                      onChangeText={(t) => {
                        const cleaned = t.replace(/\D/g, '').slice(0, 12);
                        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                        setAadhaarNumber(formatted);
                      }}
                    />
                  </View>
                </View>

                {/* 2. Aadhaar Front Image */}
                <View style={styles.aadhaarFieldGroup}>
                  <FileUploadField
                    label="Aadhaar Front Image (Optional)"
                    required={false}
                    value={aadhaarFrontUrl}
                    folder="womup/kyc/customer"
                    onUploadComplete={(url) => setAadhaarFrontUrl(url)}
                    helperText="Upload front side showing photo & 12-digit number"
                  />
                </View>

                {/* 3. Aadhaar Back Image */}
                <View style={styles.aadhaarFieldGroup}>
                  <FileUploadField
                    label="Aadhaar Back Image (Optional)"
                    required={false}
                    value={aadhaarBackUrl}
                    folder="womup/kyc/customer"
                    onUploadComplete={(url) => setAadhaarBackUrl(url)}
                    helperText="Upload back side showing permanent address"
                  />
                </View>
              </View>
            )}
          </View>

          <Text style={styles.noticeText}>
            🔒 Each email and mobile number can only be registered once.
          </Text>

          {/* Continue Button */}
          <GradientButton
            title="Continue"
            onPress={handleContinue}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.button}
          />
        </View>

        <View />
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={isCityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Select Your Service City</Text>
                <Text style={styles.sheetSubtitle}>Choose where you want orders delivered</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCityModalVisible(false)}
                style={styles.sheetCloseBtn}
              >
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search city..."
                placeholderTextColor={COLORS.secondaryText}
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
                autoCorrect={false}
              />
              {citySearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCitySearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Cities List */}
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cityListContent}
              renderItem={({ item }) => {
                const isSelected = selectedCityId === item.id || selectedCityName.toLowerCase() === item.name.toLowerCase();
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedCityId(item.id);
                      setSelectedCityName(item.name);
                      if (errors.city) setErrors({ ...errors, city: undefined });
                      setIsCityModalVisible(false);
                    }}
                    style={[styles.cityRowItem, isSelected && styles.cityRowItemSelected]}
                  >
                    <View style={styles.cityRowLeft}>
                      <View style={[styles.cityIconWrap, isSelected && styles.cityIconWrapSelected]}>
                        <Text style={styles.cityEmoji}>🏙️</Text>
                      </View>
                      <View>
                        <Text style={[styles.cityNameText, isSelected && styles.cityNameTextSelected]}>
                          {item.name}
                        </Text>
                        <Text style={styles.cityStateText}>
                          {item.state || 'Gujarat'} · Code: {item.code}
                        </Text>
                      </View>
                    </View>
                    {isSelected ? (
                      <View style={styles.checkedCircle}>
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      </View>
                    ) : (
                      <View style={styles.uncheckedCircle} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="business-outline" size={40} color={COLORS.border} />
                  <Text style={styles.emptyText}>No cities found matching "{citySearchQuery}"</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Registration Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            {/* Celebration Icon */}
            <View style={styles.celebrationCircle}>
              <Ionicons name="checkmark-done" size={42} color={COLORS.white} />
            </View>

            <Text style={styles.successModalTitle}>Registration Successful! 🎉</Text>
            <Text style={styles.successModalSubtitle}>
              Please save your Sponsor ID and Password carefully. You will need them to login to your account.
            </Text>

            {/* Sponsor ID Box */}
            <View style={styles.credentialCard}>
              <View style={styles.credentialHeader}>
                <View style={styles.credentialLabelRow}>
                  <Ionicons name="ribbon-outline" size={16} color={COLORS.hotPink} />
                  <Text style={styles.credentialLabel}>Your Sponsor ID (Referral Code)</Text>
                </View>
                {copiedField === 'sponsor' && (
                  <Text style={styles.copiedBadgeText}>✓ Copied!</Text>
                )}
              </View>
              <View style={styles.credentialValueRow}>
                <Text style={styles.credentialValueCode}>{registeredSponsorId}</Text>
                <TouchableOpacity
                  style={[styles.copyBtn, copiedField === 'sponsor' && styles.copyBtnSuccess]}
                  onPress={handleCopySponsorId}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={copiedField === 'sponsor' ? 'checkmark' : 'copy-outline'}
                    size={15}
                    color={COLORS.white}
                  />
                  <Text style={styles.copyBtnText}>
                    {copiedField === 'sponsor' ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Box */}
            <View style={styles.credentialCard}>
              <View style={styles.credentialHeader}>
                <View style={styles.credentialLabelRow}>
                  <Ionicons name="key-outline" size={16} color={COLORS.hotPink} />
                  <Text style={styles.credentialLabel}>Your Password</Text>
                </View>
                {copiedField === 'password' && (
                  <Text style={styles.copiedBadgeText}>✓ Copied!</Text>
                )}
              </View>
              <View style={styles.credentialValueRow}>
                <Text style={styles.credentialValuePass}>
                  {showRegisteredPassword ? registeredPassword : '••••••••••••'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.eyeBtnSmall}
                    onPress={() => setShowRegisteredPassword(!showRegisteredPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showRegisteredPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.hotPink}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.copyBtn, copiedField === 'password' && styles.copyBtnSuccess]}
                    onPress={handleCopyPassword}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === 'password' ? 'checkmark' : 'copy-outline'}
                      size={15}
                      color={COLORS.white}
                    />
                    <Text style={styles.copyBtnText}>
                      {copiedField === 'password' ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNoticeRow}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" />
              <Text style={styles.securityNoticeText}>
                Your account is secure. You can log in using your Sponsor ID, Phone, or Email with your password.
              </Text>
            </View>

            {/* Proceed to Login Button */}
            <GradientButton
              title="Proceed to Login"
              onPress={handleProceedToLogin}
              style={styles.proceedLoginBtn}
            />
          </View>
        </View>
      </Modal>
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
    marginTop: 20,
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
    marginBottom: SPACING.md,
  },
  timingClosedBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#F87171',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  timingClosedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timingClosedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  timingClosedDesc: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 17,
  },
  coinsBonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 12,
  },
  coinsBonusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsBonusIcon: {
    fontSize: 22,
  },
  coinsBonusTextWrap: {
    flex: 1,
  },
  coinsBonusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  coinsBonusSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  fieldHelper: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
    marginLeft: 2,
  },
  pincodeCheckingText: {
    fontSize: 11,
    color: COLORS.hotPink,
    fontWeight: '500',
  },
  inputSuccess: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  pincodeStatusHint: {
    fontSize: 11,
    marginLeft: 4,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  pincodeSuccessText: {
    color: '#15803D',
  },
  pincodeFailText: {
    color: COLORS.error,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  aadharTag: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#0284C7',
  },
  requiredAsterisk: {
    color: COLORS.hotPink,
    fontWeight: '700',
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
  citySectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.hotPink,
    letterSpacing: 0.8,
  },
  cityDropdownBtn: {
    justifyContent: 'space-between',
  },
  cityDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cityIcon: {
    fontSize: 18,
  },
  cityText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cityPlaceholder: {
    color: COLORS.secondaryText,
    fontWeight: '400',
  },
  cityInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  cityInfoText: {
    fontSize: 12,
    color: COLORS.hotPink,
    fontWeight: '500',
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
    marginTop: SPACING.md,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 46,
    paddingHorizontal: SPACING.md,
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  cityListContent: {
    paddingBottom: 20,
  },
  cityRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.card,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  cityRowItemSelected: {
    borderColor: COLORS.hotPink,
    backgroundColor: '#FFF0F7',
  },
  cityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityIconWrapSelected: {
    backgroundColor: '#FDE8F1',
  },
  cityEmoji: {
    fontSize: 18,
  },
  cityNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cityNameTextSelected: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  cityStateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.hotPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  optionalBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  optionalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7E22CE',
  },
  sponsorCheckingText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  sponsorSuccessWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
  },
  sponsorSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  sponsorFailWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
  },
  sponsorFailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  sponsorDefaultHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    marginLeft: 2,
  },

  /* Optional Aadhaar Section Styles */
  aadhaarCardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  aadhaarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F1F5F9',
  },
  aadhaarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  aadhaarShieldWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aadhaarSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  aadhaarSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  aadhaarBody: {
    padding: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  aadhaarFieldGroup: {
    marginBottom: 12,
  },
  optionalText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '400',
  },

  /* Password eye button */
  eyeBtn: {
    padding: 6,
    marginRight: 4,
  },

  /* Success Modal Styles */
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  celebrationCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  successModalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  credentialCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  credentialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  credentialLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  credentialLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  copiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  credentialValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  credentialValueCode: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.hotPink,
    letterSpacing: 1,
  },
  credentialValuePass: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  copyBtnSuccess: {
    backgroundColor: '#059669',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  eyeBtnSmall: {
    padding: 6,
    backgroundColor: '#FFF1F6',
    borderRadius: 8,
  },
  securityNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
    marginBottom: 18,
  },
  securityNoticeText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 16,
  },
  proceedLoginBtn: {
    width: '100%',
  },
});
