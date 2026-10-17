import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';
import * as ImagePicker from 'expo-image-picker';
import { RiderApiService } from '../../services/riderApi';
import { RiderDlUploadSection } from '../../components/RiderDlUploadSection';
import { riderUploadService } from '../../services/uploadService';

export const R04_RiderRegistrationScreen: React.FC = () => {
  const {
    authEmail,
    registrationToken,
    setRegistrationToken,
    registerNewRider,
    setAuthStep,
  } = useRider();

  // Wizard Step: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // -------------------------------------------------------------
  // Step 1: Email Verification Fields
  // -------------------------------------------------------------
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>(authEmail || '');
  const [mobile, setMobile] = useState<string>('');

  // -------------------------------------------------------------
  // Step 2: Email OTP Fields
  // -------------------------------------------------------------
  const [otp, setOtp] = useState<string>('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(45);

  // -------------------------------------------------------------
  // Step 3: Password Fields
  // -------------------------------------------------------------
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Step 4: Rider Details Fields
  // -------------------------------------------------------------
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'SCOOTER' | 'CYCLE'>('BIKE');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [drivingLicense, setDrivingLicense] = useState<string>('');
  const [dlImageUrl, setDlImageUrl] = useState<string>('');

  // Additional KYC & RC fields
  const [aadharNumber, setAadharNumber] = useState<string>('');
  const [aadharFrontUrl, setAadharFrontUrl] = useState<string>('');
  const [aadharBackUrl, setAadharBackUrl] = useState<string>('');
  const [rcNumber, setRcNumber] = useState<string>('');
  const [rcImageUrl, setRcImageUrl] = useState<string>('');
  const [vehicleInsuranceUrl, setVehicleInsuranceUrl] = useState<string>('');
  const [vehicleModelYear, setVehicleModelYear] = useState<string>('2023');
  const [shiftPreference, setShiftPreference] = useState<'MORNING' | 'EVENING' | 'FLEXIBLE'>('FLEXIBLE');
  const [emergencyContact, setEmergencyContact] = useState<string>('');

  // Bank & Payout Details
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const pickRiderDoc = async (field: 'aadharFront' | 'aadharBack' | 'rc' | 'insurance') => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const pickedAsset = res.assets[0];
        setUploadingDoc(field);
        setErrorMsg(null);
        try {
          const uploadRes = await riderUploadService.uploadMedia(pickedAsset.uri, {
            folder: 'wormup/rider/kyc',
            entityType: 'rider',
            fieldName: field,
          });
          if (uploadRes.success && uploadRes.url) {
            if (field === 'aadharFront') setAadharFrontUrl(uploadRes.url);
            else if (field === 'aadharBack') setAadharBackUrl(uploadRes.url);
            else if (field === 'rc') setRcImageUrl(uploadRes.url);
            else if (field === 'insurance') setVehicleInsuranceUrl(uploadRes.url);
          } else {
            setErrorMsg(`Failed uploading ${field}. Please try again.`);
          }
        } catch (uploadErr: any) {
          console.error(`Upload error for ${field}:`, uploadErr);
          setErrorMsg(uploadErr.message || `Upload failed for ${field}`);
        } finally {
          setUploadingDoc(null);
        }
      }
    } catch (e: any) {
      console.warn('Doc picker error:', e);
      setErrorMsg(e?.message || 'Error selecting document');
    }
  };

  // City & Area Pickers
  const [cities, setCities] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedCity, setSelectedCity] = useState<{ id: string; name: string; code: string } | null>(null);
  const [showCityModal, setShowCityModal] = useState<boolean>(false);

  const [areas, setAreas] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [selectedArea, setSelectedArea] = useState<{ id: string; name: string; code?: string } | null>(null);
  const [showAreaModal, setShowAreaModal] = useState<boolean>(false);

  // Global loaders & alerts
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Cities & Areas from Backend on Mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const fetchedCities = await RiderApiService.fetchCities();
        if (isMounted) {
          const activeCities = fetchedCities.filter((c) => c.status === 'Active' || !c.status);
          setCities(activeCities);
          const defaultCity =
            activeCities.find((c) => c.name.toLowerCase() === 'ahmedabad') ||
            activeCities[0] ||
            null;
          if (defaultCity) {
            setSelectedCity(defaultCity);
            const fetchedAreas = await RiderApiService.fetchAreas(defaultCity.id);
            if (isMounted) {
              setAreas(fetchedAreas);
              const defaultArea =
                fetchedAreas.find((a) => a.name.toLowerCase().includes('tragad') || a.name.toLowerCase().includes('chandlodiya')) ||
                fetchedAreas[0] ||
                null;
              if (defaultArea) setSelectedArea(defaultArea);
            }
          }
        }
      } catch (err) {
        console.warn('[R04] Error loading location master data:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update areas when city changes
  const handleSelectCity = async (cityItem: { id: string; name: string; code: string }) => {
    setSelectedCity(cityItem);
    setShowCityModal(false);
    try {
      const fetchedAreas = await RiderApiService.fetchAreas(cityItem.id);
      setAreas(fetchedAreas);
      setSelectedArea(fetchedAreas[0] || null);
    } catch {
      // fallback
    }
  };

  // Timer Countdown for Step 2
  useEffect(() => {
    if (currentStep !== 2 || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, resendTimer]);

  // Validation helpers
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // -------------------------------------------------------------
  // STEP 1 HANDLER: Send OTP to Email
  // -------------------------------------------------------------
  const handleStep1Submit = async () => {
    setErrorMsg(null);
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    const cleanMobile = mobile.trim().replace(/\s+/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await RiderApiService.sendOtp(cleanEmail);
      if (res.verificationId) setVerificationId(res.verificationId);
      setResendTimer(45);
      setSuccessMsg(`OTP sent to ${cleanEmail}`);
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2 HANDLER: Verify OTP
  // -------------------------------------------------------------
  const handleStep2Submit = async () => {
    setErrorMsg(null);
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await RiderApiService.verifyOtp(cleanEmail, otp.trim(), verificationId || undefined);
      if (res.registrationToken) {
        setRegistrationToken(res.registrationToken);
      }
      setSuccessMsg('Email verified successfully!');
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid OTP code. Please enter the code sent to your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await RiderApiService.sendOtp(cleanEmail);
      if (res.verificationId) setVerificationId(res.verificationId);
      setResendTimer(45);
      setSuccessMsg(`New OTP sent to ${cleanEmail}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3 HANDLER: Set Password
  // -------------------------------------------------------------
  const handleStep3Submit = () => {
    setErrorMsg(null);
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    setCurrentStep(4);
  };

  // -------------------------------------------------------------
  // STEP 4 HANDLER: Complete Registration
  // -------------------------------------------------------------
  const handleStep4Submit = async () => {
    setErrorMsg(null);
    if (vehicleType !== 'CYCLE' && !vehicleNumber.trim()) {
      setErrorMsg('Vehicle number is mandatory for motor vehicles');
      return;
    }
    if (!selectedCity) {
      setErrorMsg('Please select your operating city');
      return;
    }
    if (!selectedArea) {
      setErrorMsg('Please select your operating area/zone');
      return;
    }

    setLoading(true);
    try {
      await registerNewRider({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: mobile.trim(),
        phone: mobile.trim(),
        password,
        vehicleType: vehicleType === 'CYCLE' ? 'BICYCLE' : vehicleType === 'SCOOTER' ? 'EV_SCOOTER' : 'BIKE',
        vehicleNumber: (vehicleNumber || 'CYCLE-01').trim().toUpperCase(),
        city: selectedCity.name,
        cityName: selectedCity.name,
        cityId: selectedCity.id,
        areaName: selectedArea.name,
        areaId: selectedArea.id,
        drivingLicenseNumber: drivingLicense.trim().toUpperCase(),
        dlImageUrl: dlImageUrl || undefined,
        aadharNumber: aadharNumber.trim() || undefined,
        aadharFrontUrl: aadharFrontUrl || undefined,
        aadharBackUrl: aadharBackUrl || undefined,
        rcNumber: rcNumber.trim() || undefined,
        rcImageUrl: rcImageUrl || undefined,
        vehicleInsuranceUrl: vehicleInsuranceUrl || undefined,
        vehicleModelYear: vehicleModelYear || undefined,
        shiftPreference: shiftPreference,
        emergencyContact: emergencyContact.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim().toUpperCase() || undefined,
        upiId: upiId.trim() || undefined,
      });
      // Context will set profile and switch authStep to 'AUTHENTICATED'
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Navy Header Bar */}
        <LinearGradient colors={GRADIENTS.navyHeader} style={styles.topHeader}>
          <View style={styles.topHeaderRow}>
            <TouchableOpacity
              onPress={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                } else {
                  setAuthStep('LOGIN');
                }
              }}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP {currentStep} OF 4</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <Text style={styles.headerTitle}>
            {currentStep === 1 && 'Rider Registration'}
            {currentStep === 2 && 'Verify Email'}
            {currentStep === 3 && 'Set Password'}
            {currentStep === 4 && 'Rider Details'}
          </Text>
          <Text style={styles.headerSub}>
            {currentStep === 1 && 'Step 1 of 4 • Basic Information'}
            {currentStep === 2 && 'Step 2 of 4 • Email OTP Verification'}
            {currentStep === 3 && 'Step 3 of 4 • Create Secure Password'}
            {currentStep === 4 && 'Step 4 of 4 • Vehicle & Zone Setup'}
          </Text>

          {/* Progress Dots */}
          <View style={styles.progressTrack}>
            {[1, 2, 3, 4].map((stepNum) => (
              <View
                key={stepNum}
                style={[
                  styles.progressSegment,
                  currentStep >= stepNum && styles.progressSegmentActive,
                  currentStep === stepNum && styles.progressSegmentCurrent,
                ]}
              />
            ))}
          </View>
        </LinearGradient>

        {/* Main Content Form Card */}
        <View style={styles.formCard}>
          {/* Success Banner */}
          {successMsg ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color="#15803D" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* STEP 1: Full Name + Email + Mobile Number                 */}
          {/* ========================================================= */}
          {currentStep === 1 ? (
            <View>
              <Text style={styles.inputLabel}>FULL NAME *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.secondaryText}
                  value={fullName}
                  onChangeText={(txt) => {
                    setFullName(txt);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>EMAIL ADDRESS *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={styles.textInput}
                  placeholder="rider@example.com"
                  placeholderTextColor={COLORS.secondaryText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(txt) => {
                    setEmail(txt);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>
              <Text style={styles.fieldNote}>OTP will be sent to this email address for verification</Text>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>MOBILE NUMBER *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="98765 43210"
                  placeholderTextColor={COLORS.secondaryText}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(txt) => {
                    setMobile(txt);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
              </View>
              <Text style={styles.fieldNote}>Used for operational & emergency calls during deliveries</Text>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                disabled={loading}
                onPress={handleStep1Submit}
                activeOpacity={0.85}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.gradientButton}>
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Send OTP to Email</Text>
                      <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footerLinkRow}>
                <Text style={styles.footerText}>Already registered? </Text>
                <TouchableOpacity onPress={() => setAuthStep('LOGIN')} activeOpacity={0.7}>
                  <Text style={styles.loginLink}>Login Here</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* STEP 2: Email OTP Verification                             */}
          {/* ========================================================= */}
          {currentStep === 2 ? (
            <View>
              <View style={styles.otpHeroBox}>
                <View style={styles.otpIconBadge}>
                  <Ionicons name="mail-open-outline" size={28} color={COLORS.primaryPink} />
                </View>
                <Text style={styles.otpNoticeTitle}>We sent a 6-digit OTP to:</Text>
                <Text style={styles.otpNoticeEmail}>{email}</Text>
              </View>

              {/* 6 Digit Input Display */}
              <View style={styles.otpDigitsContainer}>
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const digit = otp[idx] || '';
                  const isCurrent = otp.length === idx;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                        isCurrent ? styles.otpBoxActive : null,
                      ]}
                    >
                      <Text style={styles.otpBoxText}>{digit}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Actual Input Field */}
              <TextInput
                style={styles.hiddenOtpInput}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(val) => {
                  setOtp(val.replace(/[^0-9]/g, ''));
                  if (errorMsg) setErrorMsg(null);
                }}
                autoFocus={true}
              />

              <View style={styles.resendContainer}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend OTP in 00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                    <Text style={styles.resendActiveText}>Resend OTP Now</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                disabled={loading}
                onPress={handleStep2Submit}
                activeOpacity={0.85}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.gradientButton}>
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Verify & Continue</Text>
                      <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* STEP 3: Create Password + Confirm Password                */}
          {/* ========================================================= */}
          {currentStep === 3 ? (
            <View>
              <Text style={styles.inputLabel}>CREATE PASSWORD *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.secondaryText}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(txt) => {
                    setPassword(txt);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.requirementRow}>
                <Ionicons
                  name={password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={password.length >= 6 ? '#10B981' : '#94A3B8'}
                />
                <Text style={[styles.requirementText, password.length >= 6 && styles.requirementPassed]}>
                  Min 6 characters
                </Text>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>CONFIRM PASSWORD *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.secondaryText}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(txt) => {
                    setConfirmPassword(txt);
                    if (errorMsg) setErrorMsg(null);
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStep3Submit}
                activeOpacity={0.85}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.gradientButton}>
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* STEP 4: Rider Details (Vehicle, City, Area, DL)           */}
          {/* ========================================================= */}
          {currentStep === 4 ? (
            <View>
              {/* Vehicle Type Selector */}
              <Text style={styles.inputLabel}>VEHICLE TYPE *</Text>
              <View style={styles.vehicleTypeRow}>
                {(['BIKE', 'SCOOTER', 'CYCLE'] as const).map((type) => {
                  const isSelected = vehicleType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.vehicleOption, isSelected && styles.vehicleOptionActive]}
                      onPress={() => setVehicleType(type)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={type === 'CYCLE' ? 'bicycle-outline' : 'speedometer-outline'}
                        size={20}
                        color={isSelected ? COLORS.primaryPink : '#64748B'}
                      />
                      <Text style={[styles.vehicleOptionText, isSelected && styles.vehicleOptionTextActive]}>
                        {type === 'BIKE' ? 'Bike' : type === 'SCOOTER' ? 'Scooter' : 'Cycle'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Vehicle Number */}
              {vehicleType !== 'CYCLE' ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.inputLabel}>VEHICLE NUMBER *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="car-outline" size={18} color={COLORS.navy} />
                    <TextInput
                      style={[styles.textInput, { textTransform: 'uppercase' }]}
                      placeholder="GJ 01 AB 1234"
                      placeholderTextColor={COLORS.secondaryText}
                      value={vehicleNumber}
                      onChangeText={(txt) => {
                        setVehicleNumber(txt);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              ) : null}

              {/* City Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>CITY *</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowCityModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownValueRow}>
                  <Ionicons name="location-outline" size={18} color={COLORS.navy} />
                  <Text style={styles.dropdownValueText}>
                    {selectedCity?.name || 'Select City'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>

              {/* Area / Zone Dropdown */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>AREA / ZONE *</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowAreaModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownValueRow}>
                  <Ionicons name="navigate-circle-outline" size={18} color={COLORS.navy} />
                  <Text style={styles.dropdownValueText}>
                    {selectedArea?.name || 'Select Area / Zone'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>

              {/* Driving License Number */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>DRIVING LICENSE NUMBER</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={[styles.textInput, { textTransform: 'uppercase' }]}
                  placeholder="GJ0120180012345"
                  placeholderTextColor={COLORS.secondaryText}
                  value={drivingLicense}
                  onChangeText={(txt) => {
                    setDrivingLicense(txt);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  autoCapitalize="characters"
                />
              </View>

              {/* Real Driving License Upload with Camera / Gallery / PDF and Cloudinary Progress */}
              <RiderDlUploadSection
                initialUrl={dlImageUrl}
                onUrlChange={(uploadedUrl) => {
                  setDlImageUrl(uploadedUrl);
                  if (uploadedUrl) {
                    setSuccessMsg('Driving license uploaded & verified successfully!');
                    setErrorMsg(null);
                  }
                }}
              />

              {/* Aadhaar Card Verification */}
              <Text style={[styles.inputLabel, { marginTop: 18 }]}>AADHAAR CARD NUMBER</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="finger-print-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={styles.textInput}
                  placeholder="0000 0000 0000"
                  placeholderTextColor={COLORS.secondaryText}
                  keyboardType="numeric"
                  maxLength={12}
                  value={aadharNumber}
                  onChangeText={setAadharNumber}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.dropdownBtn, { flex: 1 }]}
                  onPress={() => pickRiderDoc('aadharFront')}
                  disabled={uploadingDoc !== null}
                >
                  {uploadingDoc === 'aadharFront' ? (
                    <ActivityIndicator size="small" color={COLORS.navy} />
                  ) : (
                    <Ionicons name="card-outline" size={18} color={COLORS.navy} />
                  )}
                  <Text style={[styles.dropdownValueText, { fontSize: 12, marginLeft: 6 }]}>
                    {uploadingDoc === 'aadharFront'
                      ? 'Uploading...'
                      : aadharFrontUrl
                      ? 'Aadhaar Front ✓'
                      : 'Aadhaar Front'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dropdownBtn, { flex: 1 }]}
                  onPress={() => pickRiderDoc('aadharBack')}
                  disabled={uploadingDoc !== null}
                >
                  {uploadingDoc === 'aadharBack' ? (
                    <ActivityIndicator size="small" color={COLORS.navy} />
                  ) : (
                    <Ionicons name="card-outline" size={18} color={COLORS.navy} />
                  )}
                  <Text style={[styles.dropdownValueText, { fontSize: 12, marginLeft: 6 }]}>
                    {uploadingDoc === 'aadharBack'
                      ? 'Uploading...'
                      : aadharBackUrl
                      ? 'Aadhaar Back ✓'
                      : 'Aadhaar Back'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* RC & Vehicle Compliance */}
              {vehicleType !== 'CYCLE' && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 18 }]}>VEHICLE REGISTRATION (RC) NUMBER</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="document-text-outline" size={18} color={COLORS.navy} />
                    <TextInput
                      style={[styles.textInput, { textTransform: 'uppercase' }]}
                      placeholder="GJ01XX1234"
                      placeholderTextColor={COLORS.secondaryText}
                      value={rcNumber}
                      onChangeText={setRcNumber}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.dropdownBtn, { flex: 1 }]}
                      onPress={() => pickRiderDoc('rc')}
                      disabled={uploadingDoc !== null}
                    >
                      {uploadingDoc === 'rc' ? (
                        <ActivityIndicator size="small" color={COLORS.navy} />
                      ) : (
                        <Ionicons name="document-attach-outline" size={18} color={COLORS.navy} />
                      )}
                      <Text style={[styles.dropdownValueText, { fontSize: 12, marginLeft: 6 }]}>
                        {uploadingDoc === 'rc'
                          ? 'Uploading...'
                          : rcImageUrl
                          ? 'RC Uploaded ✓'
                          : 'RC Certificate'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dropdownBtn, { flex: 1 }]}
                      onPress={() => pickRiderDoc('insurance')}
                      disabled={uploadingDoc !== null}
                    >
                      {uploadingDoc === 'insurance' ? (
                        <ActivityIndicator size="small" color={COLORS.navy} />
                      ) : (
                        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.navy} />
                      )}
                      <Text style={[styles.dropdownValueText, { fontSize: 12, marginLeft: 6 }]}>
                        {uploadingDoc === 'insurance'
                          ? 'Uploading...'
                          : vehicleInsuranceUrl
                          ? 'Insurance ✓'
                          : 'Insurance Doc'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Shift Preference */}
              <Text style={[styles.inputLabel, { marginTop: 18 }]}>SHIFT PREFERENCE</Text>
              <View style={styles.vehicleTypeRow}>
                {(['MORNING', 'EVENING', 'FLEXIBLE'] as const).map((shift) => {
                  const isSelected = shiftPreference === shift;
                  return (
                    <TouchableOpacity
                      key={shift}
                      style={[styles.vehicleOption, isSelected && styles.vehicleOptionActive]}
                      onPress={() => setShiftPreference(shift)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.vehicleOptionText, isSelected && styles.vehicleOptionTextActive, { fontSize: 12 }]}>
                        {shift === 'MORNING' ? 'Morning 6-2' : shift === 'EVENING' ? 'Evening 2-10' : 'Flexible'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Emergency Contact */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>EMERGENCY CONTACT PHONE</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Family or Guardian Mobile"
                  placeholderTextColor={COLORS.secondaryText}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                />
              </View>

              {/* Bank & Payout Details */}
              <Text style={[styles.inputLabel, { marginTop: 18 }]}>BANK NAME FOR EARNINGS PAYOUT</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. State Bank of India, HDFC"
                  placeholderTextColor={COLORS.secondaryText}
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Account No"
                      placeholderTextColor={COLORS.secondaryText}
                      keyboardType="numeric"
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>IFSC CODE</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.textInput, { textTransform: 'uppercase' }]}
                      placeholder="SBIN0001234"
                      placeholderTextColor={COLORS.secondaryText}
                      autoCapitalize="characters"
                      maxLength={11}
                      value={ifscCode}
                      onChangeText={(t) => setIfscCode(t.toUpperCase())}
                    />
                  </View>
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>UPI ID (FOR INSTANT PAYOUTS)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="wallet-outline" size={18} color={COLORS.navy} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. mobile@okaxis or name@upi"
                  placeholderTextColor={COLORS.secondaryText}
                  autoCapitalize="none"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </View>

              {/* Complete Registration CTA */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled, { marginTop: 22 }]}
                disabled={loading}
                onPress={handleStep4Submit}
                activeOpacity={0.85}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.gradientButton}>
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Complete Registration</Text>
                      <Ionicons name="checkmark-done" size={18} color={COLORS.white} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* City Picker Modal */}
      <Modal visible={showCityModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Operating City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {cities.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.pickerItem,
                    selectedCity?.id === item.id && styles.pickerItemActive,
                  ]}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedCity?.id === item.id && styles.pickerItemTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedCity?.id === item.id && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primaryPink} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Area Picker Modal */}
      <Modal visible={showAreaModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Area / Zone</Text>
              <TouchableOpacity onPress={() => setShowAreaModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {areas.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.pickerItem,
                    selectedArea?.id === item.id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedArea(item);
                    setShowAreaModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedArea?.id === item.id && styles.pickerItemTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedArea?.id === item.id && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primaryPink} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  topHeader: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 59, 152, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 152, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  headerSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 16,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressSegmentActive: {
    backgroundColor: COLORS.primaryPink,
  },
  progressSegmentCurrent: {
    backgroundColor: '#FFFFFF',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 8px 24px rgba(15, 23, 42, 0.08))',
      },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      },
    }),
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 12,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    paddingLeft: 8,
  },
  fieldNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    marginLeft: 2,
  },
  eyeBtn: {
    padding: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  requirementPassed: {
    color: '#10B981',
  },
  otpHeroBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  otpIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 59, 152, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  otpNoticeTitle: {
    fontSize: 13,
    color: '#64748B',
  },
  otpNoticeEmail: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 2,
  },
  otpDigitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 18,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primaryPink,
    backgroundColor: '#FFFFFF',
  },
  otpBoxActive: {
    borderColor: COLORS.navy,
  },
  otpBoxText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendTimerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  resendActiveText: {
    fontSize: 13,
    color: COLORS.primaryPink,
    fontWeight: '800',
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  vehicleOptionActive: {
    borderColor: COLORS.primaryPink,
    backgroundColor: 'rgba(255, 59, 152, 0.08)',
  },
  vehicleOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  vehicleOptionTextActive: {
    color: COLORS.primaryPink,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 12,
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 48,
    marginTop: 14,
  },
  uploadImageText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
  },
  gradientButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryPink,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(255, 59, 152, 0.06)',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },
  pickerItemTextActive: {
    color: COLORS.primaryPink,
    fontWeight: '800',
  },
});
