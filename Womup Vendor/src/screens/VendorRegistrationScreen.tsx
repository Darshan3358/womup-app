import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Store,
  MapPin,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Smartphone,
  Mail,
  CreditCard,
  Building2,
  ShieldCheck,
  Compass,
  Sparkles,
  Info,
  AlertCircle,
  X,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { FileUploadField } from '../components/FileUploadField';
import { MapPicker } from '../components/MapPicker';
import { VendorApi } from '../services/api';
import { useVendor } from '../context/VendorAuthContext';

interface VendorRegistrationScreenProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const BUSINESS_TYPES = [
  'Kirana / Grocery',
  'Vegetables & Fruits',
  'Dairy & Milk',
  'Bakery & Confectionery',
  'Medical & Pharmacy',
  'General Store',
  'Snacks & Sweets',
  'Meat & Fish',
];

const CATEGORIES = [
  { id: 'cat_veg', name: 'Vegetables' },
  { id: 'cat_fruit', name: 'Fruits' },
  { id: 'cat_dairy', name: 'Dairy & Eggs' },
  { id: 'cat_cook', name: 'Cooking Essentials' },
  { id: 'cat_bake', name: 'Bakery' },
  { id: 'cat_bev', name: 'Beverages' },
  { id: 'cat_snack', name: 'Snacks' },
  { id: 'cat_gen', name: 'General Merchandise' },
];

export const VendorRegistrationScreen: React.FC<VendorRegistrationScreenProps> = ({
  onCancel,
  onSuccess,
}) => {
  const { setVendorProfile } = useVendor();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: Basic Information ──
  const [firmName, setFirmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessType, setBusinessType] = useState('Vegetables & Fruits');
  const [businessCategory, setBusinessCategory] = useState('Vegetables');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [email, setEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  // ── Step 2: OTP Verification ──
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const [otpTimer, setOtpTimer] = useState(60);
  const [verificationId, setVerificationId] = useState<string | undefined>(undefined);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // ── Step 3: Business Location ──
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Gujarat');
  const [district, setDistrict] = useState('Ahmedabad');
  const [taluka, setTaluka] = useState('Daskroi');
  const [city, setCity] = useState('Ahmedabad');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState('23.1288');
  const [lng, setLng] = useState('72.5507');

  // ── Step 4: KYC Documents ──
  const [aadharNo, setAadharNo] = useState('');
  const [aadharFront, setAadharFront] = useState('');
  const [aadharBack, setAadharBack] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [gstCert, setGstCert] = useState('');
  const [panCard, setPanCard] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [cancelledCheque, setCancelledCheque] = useState('');
  const [businessCard, setBusinessCard] = useState('');
  const [shopPhoto, setShopPhoto] = useState('');
  const [ownerPhoto, setOwnerPhoto] = useState('');

  // ── Step 5: Bank & Password ──
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Step 6: Post-Registration Result ──
  const [registeredVendorCode, setRegisteredVendorCode] = useState('VND001');

  // ── Toastify State & Methods ──
  const [toast, setToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'info' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  const toastTimerRef = useRef<any>(null);

  const showToast = (
    title: string,
    message: string,
    type: 'error' | 'success' | 'info' | 'warning' = 'error',
  ) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({
      visible: true,
      title,
      message,
      type,
    });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4500);
  };

  const hideToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (currentStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, otpTimer]);

  // Handle Send OTP from Step 1
  const handleStep1SendOtp = async () => {
    if (!firmName.trim()) {
      showToast('Store Name Missing', 'Please enter your Store / Firm Name.', 'error');
      return;
    }
    if (!ownerName.trim()) {
      showToast('Owner Name Missing', 'Please enter Owner Full Name.', 'error');
      return;
    }
    if (!businessType) {
      showToast('Business Type Missing', 'Please select a Business Type.', 'error');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!cleanMobile) {
      showToast('Mobile Number Missing', 'Please enter Mobile Number for login & OTP.', 'error');
      return;
    }
    if (cleanMobile.length !== 10) {
      showToast('Invalid Mobile Number', 'Mobile Number must be exactly 10 digits.', 'error');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showToast('Email Address Missing', 'Please enter your Email Address to receive the verification OTP.', 'error');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showToast('Invalid Email Address', 'Please enter a valid Email Address (e.g. shop@example.com).', 'error');
      return;
    }

    setSendingOtp(true);
    const res = await VendorApi.sendOtp(cleanEmail, 'REGISTRATION');
    setSendingOtp(false);

    if (res.success) {
      setVerificationId(res.verificationId);
      setOtpTimer(60);
      setCurrentStep(2);
      showToast(
        'OTP Sent ✉️',
        `A 6-digit code has been sent to ${cleanEmail}. ${res.devOtp ? `(Dev Code: ${res.devOtp})` : ''}`,
        'success',
      );
    } else {
      showToast('Failed to Send OTP', res.error || 'Please check your email address and try again.', 'error');
    }
  };

  // Handle Verify OTP in Step 2
  const handleStep2VerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      showToast('Incomplete OTP', 'Please enter all 6 digits of the verification code.', 'error');
      return;
    }

    setVerifyingOtp(true);
    const cleanEmail = email.trim().toLowerCase();
    const res = await VendorApi.verifyOtp(cleanEmail, code, verificationId);
    setVerifyingOtp(false);

    if (res.success) {
      showToast('Email Verified ✓', 'OTP verified successfully. Now pin your store location.', 'success');
      setCurrentStep(3);
    } else {
      showToast('Verification Failed', res.error || 'Invalid OTP code. Master test OTP is 123456.', 'error');
    }
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    if (val.length > 1) {
      const clean = val.replace(/\D/g, '').slice(0, 6);
      const newArr = [...otpDigits];
      for (let i = 0; i < clean.length; i++) {
        newArr[i] = clean[i];
      }
      setOtpDigits(newArr);
      const nextFocus = Math.min(clean.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const cleaned = val.replace(/\D/g, '').slice(-1);
    const newArr = [...otpDigits];
    newArr[index] = cleaned;
    setOtpDigits(newArr);

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, e: any) => {
    if (e.nativeEvent?.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Step 3 Location Next
  const handleStep3Next = () => {
    if (!address.trim()) {
      showToast('Store Address Missing', 'Please enter your Full Store Address.', 'error');
      return;
    }
    if (!city.trim()) {
      showToast('City Missing', 'Please enter City Name.', 'error');
      return;
    }
    if (!pincode.trim()) {
      showToast('Pincode Missing', 'Please enter postal Pincode.', 'error');
      return;
    }
    if (pincode.trim().length !== 6) {
      showToast('Invalid Pincode', 'Pincode must be exactly 6 digits.', 'error');
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || latNum < -90 || latNum > 90 || latNum === 0) {
      showToast('Location Required', 'Please pin your shop on the map or tap Auto GPS.', 'error');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180 || lngNum === 0) {
      showToast('Location Required', 'Please pin your shop on the map or tap Auto GPS.', 'error');
      return;
    }

    showToast('Location Saved 📍', 'Proceeding to KYC Documents verification.', 'success');
    setCurrentStep(4);
  };

  // Auto-fill GPS Coordinates
  const handleAutoGps = () => {
    setLat('23.1288');
    setLng('72.5507');
    showToast('GPS Location Captured 📍', 'Coordinates set to Lat: 23.1288, Lng: 72.5507', 'success');
  };

  // Handle Step 4 KYC Next
  const handleStep4Next = () => {
    const cleanAadhar = aadharNo.replace(/\D/g, '');
    if (!aadharNo.trim()) {
      showToast('Aadhaar Card Missing', 'Aadhaar Card Number is required. Please enter 12-digit number.', 'error');
      return;
    }
    if (cleanAadhar.length !== 12) {
      showToast('Invalid Aadhaar Number', `Aadhaar Number must be exactly 12 digits (currently ${cleanAadhar.length} digits).`, 'error');
      return;
    }
    if (!aadharFront) {
      showToast('Aadhaar Front Missing', 'Please upload Front side photo of Aadhaar Card.', 'error');
      return;
    }
    if (!aadharBack) {
      showToast('Aadhaar Back Missing', 'Please upload Back side photo of Aadhaar Card.', 'error');
      return;
    }
    if (!panCard) {
      showToast('PAN Card Missing', 'Please upload PAN Card document image.', 'error');
      return;
    }
    if (!tradeLicense) {
      showToast('Trade License Missing', 'Please upload Trade License or Gumastadhara certificate.', 'error');
      return;
    }
    if (!cancelledCheque) {
      showToast('Cancelled Cheque Missing', 'Please upload Cancelled Cheque or Bank Passbook photo.', 'error');
      return;
    }
    if (!shopPhoto) {
      showToast('Shop Photo Missing', 'Please upload Shop Front Photo showing your store board.', 'error');
      return;
    }
    if (!ownerPhoto) {
      showToast('Owner Photo Missing', 'Please upload Store Owner Passport/Selfie Photo.', 'error');
      return;
    }

    showToast('KYC Documents Verified ✓', 'Proceeding to Bank Account setup.', 'success');
    setCurrentStep(5);
  };

  // Handle Step 5 Complete Registration
  const handleCompleteRegistration = async () => {
    // Re-verify Step 4 documents in case jumped
    const cleanAadhar = aadharNo.replace(/\D/g, '');
    if (!aadharNo.trim()) {
      showToast('Aadhaar Card Missing', 'Aadhaar Card Number is missing. Please complete Step 4.', 'error');
      setCurrentStep(4);
      return;
    }
    if (cleanAadhar.length !== 12) {
      showToast('Invalid Aadhaar Number', `Aadhaar Number must be 12 digits. Please check Step 4.`, 'error');
      setCurrentStep(4);
      return;
    }
    if (!aadharFront || !aadharBack) {
      showToast('Aadhaar Images Missing', 'Please upload both Aadhaar Front and Back documents.', 'error');
      setCurrentStep(4);
      return;
    }
    if (!panCard || !tradeLicense || !cancelledCheque || !shopPhoto || !ownerPhoto) {
      showToast('KYC Documents Incomplete', 'Please upload all required KYC documents in Step 4.', 'error');
      setCurrentStep(4);
      return;
    }

    // Step 5 Bank checks
    if (!bankName.trim()) {
      showToast('Bank Name Missing', 'Please enter your Bank Name.', 'error');
      return;
    }
    if (!bankBranch.trim()) {
      showToast('Branch Name Missing', 'Please enter Bank Branch Name.', 'error');
      return;
    }
    if (!accountNumber.trim()) {
      showToast('Account Number Missing', 'Please enter Bank Account Number.', 'error');
      return;
    }
    if (accountNumber.trim().length < 8) {
      showToast('Invalid Account Number', 'Bank account number must be at least 8 digits.', 'error');
      return;
    }
    if (!ifscCode.trim()) {
      showToast('IFSC Code Missing', 'Please enter Bank IFSC Code.', 'error');
      return;
    }
    if (ifscCode.trim().length !== 11) {
      showToast('Invalid IFSC Code', 'IFSC Code must be exactly 11 characters (e.g. HDFC0001234).', 'error');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password Too Short', 'Password must be at least 6 characters long.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Password Mismatch', 'Password and Confirm Password do not match.', 'error');
      return;
    }
    if (!termsAccepted) {
      showToast('Terms & Conditions Required', 'Please accept the Terms & Conditions to complete registration.', 'warning');
      return;
    }

    setSubmitting(true);
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

    const payload = {
      verificationId,
      firmName: firmName.trim(),
      ownerName: ownerName.trim(),
      businessType,
      businessCategoryName: businessCategory,
      mobile: `+91${cleanMobile}`,
      alternateMobile: altMobile.trim() ? `+91${altMobile.replace(/\D/g, '').slice(-10)}` : '',
      email: email.trim().toLowerCase(),
      address: address.trim(),
      landmark: landmark.trim(),
      countryId: country === 'India' ? 'IN' : country,
      stateId: state === 'Gujarat' ? 'GJ' : state,
      districtId: district,
      talukaId: taluka,
      cityName: city,
      pincode: pincode.trim(),
      latitude: parseFloat(lat) || 23.1288,
      longitude: parseFloat(lng) || 72.5507,
      aadhaarNumber: aadharNo.trim(),
      aadhaarFrontUrl: aadharFront,
      aadhaarBackUrl: aadharBack,
      gstNumber: gstNo.trim(),
      gstCertificateUrl: gstCert,
      panCardUrl: panCard,
      tradeLicenseUrl: tradeLicense,
      cancelledChequeUrl: cancelledCheque,
      businessCardUrl: businessCard,
      shopPhotoUrl: shopPhoto,
      ownerPhotoUrl: ownerPhoto,
      bankName: bankName.trim(),
      bankBranch: bankBranch.trim(),
      accountHolderName: accountHolder.trim() || ownerName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      upiId: upiId.trim(),
      password,
    };

    const res = await VendorApi.register(payload);
    setSubmitting(false);

    if (res.success) {
      const code = res.vendorCode || res.vendor?.vendorCode || 'VND001';
      setRegisteredVendorCode(code);
      if (res.vendor) {
        setVendorProfile(res.vendor);
      }
      showToast('Registration Successful! 🎉', `Store registered with code ${code}.`, 'success');
      setCurrentStep(6);
    } else {
      const err = res.error || 'Please check your inputs and try again.';
      const isConflict = err.includes('already registered') || err.includes('already exists') || err.includes('Customer') || err.includes('Rider') || err.includes('Store');
      showToast(isConflict ? 'Account Already Exists' : 'Registration Failed', err, 'error');
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* FLOATING TOASTIFY NOTIFICATION BANNER                             */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {toast.visible && (
        <View style={styles.toastContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.toastCard,
              toast.type === 'error' && styles.toastError,
              toast.type === 'success' && styles.toastSuccess,
              toast.type === 'info' && styles.toastInfo,
              toast.type === 'warning' && styles.toastWarning,
            ]}
            onPress={hideToast}
          >
            <View style={styles.toastIconWrap}>
              {toast.type === 'error' && <AlertCircle size={22} color="#EF4444" />}
              {toast.type === 'success' && <CheckCircle2 size={22} color="#10B981" />}
              {toast.type === 'info' && <Info size={22} color="#38BDF8" />}
              {toast.type === 'warning' && <AlertCircle size={22} color="#F59E0B" />}
            </View>

            <View style={styles.toastTextCol}>
              <Text
                style={[
                  styles.toastTitle,
                  toast.type === 'error' && { color: '#FCA5A5' },
                  toast.type === 'success' && { color: '#6EE7B7' },
                  toast.type === 'info' && { color: '#7DD3FC' },
                  toast.type === 'warning' && { color: '#FCD34D' },
                ]}
              >
                {toast.title}
              </Text>
              <Text style={styles.toastMessage}>{toast.message}</Text>
            </View>

            <TouchableOpacity onPress={hideToast} style={styles.toastCloseBtn}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header & Steps Navigator (Steps 1 to 5) */}
          {currentStep <= 5 && (
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                  <ArrowLeft size={18} color="#94A3B8" />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.stepBadge}>Step {currentStep} of 5</Text>
              </View>

              <Text style={styles.title}>Register Store</Text>
              <Text style={styles.subtitle}>
                {currentStep === 1 && 'Basic Information'}
                {currentStep === 2 && 'Verify Email OTP'}
                {currentStep === 3 && 'Business Location & GPS'}
                {currentStep === 4 && 'KYC Documents Verification'}
                {currentStep === 5 && 'Bank Account & Security'}
              </Text>

              {/* 5-Step Progress Indicators */}
              <View style={styles.stepper}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.stepBar,
                      s <= currentStep && styles.stepBarActive,
                      s === currentStep && styles.stepBarCurrent,
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: Basic Information                                         */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Store size={20} color={COLORS.rose} />
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Store / Firm Name *</Text>
                <TextInput
                  style={styles.input}
                  value={firmName}
                  onChangeText={setFirmName}
                  placeholder="e.g. Gokul Vegetables"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Owner Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="e.g. Ramesh Patel"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {BUSINESS_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt}
                      style={[styles.chip, businessType === bt && styles.chipActive]}
                      onPress={() => setBusinessType(bt)}
                    >
                      <Text style={[styles.chipText, businessType === bt && styles.chipTextActive]}>
                        {bt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, businessCategory === cat.name && styles.chipActive]}
                      onPress={() => setBusinessCategory(cat.name)}
                    >
                      <Text style={[styles.chipText, businessCategory === cat.name && styles.chipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number (For Login & OTP) *</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.prefixText}>+91</Text>
                  <TextInput
                    style={styles.input}
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="98765 43210"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Alternate Mobile (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.prefixText}>+91</Text>
                  <TextInput
                    style={styles.input}
                    value={altMobile}
                    onChangeText={setAltMobile}
                    placeholder="98765 43211"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="gokul@example.com"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleStep1SendOtp}
                disabled={sendingOtp}
                activeOpacity={0.85}
              >
                {sendingOtp ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Send OTP to Email</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: OTP Verification                                           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Mail size={20} color={COLORS.rose} />
                <Text style={styles.sectionTitle}>Verify Email OTP</Text>
              </View>

              <Text style={styles.stepDesc}>
                We sent a 6-digit verification code to your email:{' '}
                <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{email.trim().toLowerCase()}</Text>
              </Text>

              <View style={styles.otpBoxesRow}>
                {otpDigits.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleOtpBoxChange(idx, v)}
                    onKeyPress={(e) => handleOtpKeyPress(idx, e)}
                    keyboardType="number-pad"
                    maxLength={6}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>

              <View style={styles.timerRow}>
                {otpTimer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend OTP in <Text style={{ color: COLORS.rose, fontWeight: '800' }}>00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleStep1SendOtp} disabled={sendingOtp}>
                    <Text style={styles.resendLink}>Resend OTP Now</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(1)}>
                  <ArrowLeft size={16} color="#94A3B8" />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                  onPress={handleStep2VerifyOtp}
                  disabled={verifyingOtp}
                  activeOpacity={0.85}
                >
                  {verifyingOtp ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: Business Location & GPS                                    */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color={COLORS.rose} />
                <Text style={styles.sectionTitle}>Business Location</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Address *</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Shop 10-14, Ground Floor, Shukan Hub..."
                  placeholderTextColor="#64748B"
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Landmark (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="Near Chandlodiya Railway Station"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.twoCol}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Country *</Text>
                  <TextInput style={styles.input} value={country} editable={false} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>State *</Text>
                  <TextInput style={styles.input} value={state} onChangeText={setState} />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>District *</Text>
                  <TextInput style={styles.input} value={district} onChangeText={setDistrict} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Taluka *</Text>
                  <TextInput style={styles.input} value={taluka} onChangeText={setTaluka} />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>City *</Text>
                  <TextInput style={styles.input} value={city} onChangeText={setCity} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Pincode *</Text>
                  <TextInput
                    style={styles.input}
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              {/* ───────────────────────────── */}
              <View style={styles.mapDivider} />

              <View style={styles.sectionHeader}>
                <Compass size={20} color="#38BDF8" />
                <Text style={styles.sectionTitle}>📌 PIN YOUR SHOP ON MAP *</Text>
              </View>
              <Text style={styles.mapExplainer}>
                Riders and customers rely on exact shop coordinates to navigate and calculate 9-minute delivery ETAs. Tap map or use GPS button.
              </Text>

              {/* Interactive Map Picker Component */}
              <MapPicker
                initialLatitude={parseFloat(lat) || 23.1288}
                initialLongitude={parseFloat(lng) || 72.5507}
                pinTitle="Shop Entrance"
                confirmLabel="Confirm Pin Location"
                onLocationSelect={(coords) => {
                  setLat(coords.latitude.toFixed(6));
                  setLng(coords.longitude.toFixed(6));
                  if (coords.address && !address) {
                    setAddress(coords.address);
                  }
                }}
              />

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(2)}>
                  <ArrowLeft size={16} color="#94A3B8" />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                  onPress={handleStep3Next}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 4: KYC Documents                                              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <FileCheck2 size={20} color={COLORS.rose} />
                <Text style={styles.sectionTitle}>KYC Documents (9 Items)</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aadhaar Card Number *</Text>
                <TextInput
                  style={styles.input}
                  value={aadharNo}
                  onChangeText={setAadharNo}
                  placeholder="1234 1234 1234"
                  placeholderTextColor="#64748B"
                  keyboardType="number-pad"
                  maxLength={12}
                />
              </View>

              <FileUploadField
                label="Aadhaar Front Image"
                required
                value={aadharFront}
                onUploadComplete={setAadharFront}
              />

              <FileUploadField
                label="Aadhaar Back Image"
                required
                value={aadharBack}
                onUploadComplete={setAadharBack}
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>GST Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={gstNo}
                  onChangeText={setGstNo}
                  placeholder="24ABCDE1234F1Z5"
                  placeholderTextColor="#64748B"
                  autoCapitalize="characters"
                />
              </View>

              <FileUploadField
                label="GST Certificate (Optional)"
                value={gstCert}
                onUploadComplete={setGstCert}
              />

              <FileUploadField
                label="PAN Card Image"
                required
                value={panCard}
                onUploadComplete={setPanCard}
              />

              <FileUploadField
                label="Trade License / Gumastadhara"
                required
                value={tradeLicense}
                onUploadComplete={setTradeLicense}
              />

              <FileUploadField
                label="Cancelled Cheque / Passbook"
                required
                value={cancelledCheque}
                onUploadComplete={setCancelledCheque}
              />

              <FileUploadField
                label="Business Card (Optional)"
                value={businessCard}
                onUploadComplete={setBusinessCard}
              />

              <FileUploadField
                label="Shop Front Photo"
                required
                value={shopPhoto}
                onUploadComplete={setShopPhoto}
              />

              <FileUploadField
                label="Owner Photo / Selfie"
                required
                value={ownerPhoto}
                onUploadComplete={setOwnerPhoto}
              />

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(3)}>
                  <ArrowLeft size={16} color="#94A3B8" />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                  onPress={handleStep4Next}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 5: Bank & Password                                            */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Building2 size={20} color={COLORS.rose} />
                <Text style={styles.sectionTitle}>Bank & Security Details</Text>
              </View>

              <Text style={styles.groupSub}>🏦 Bank Account Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bank Name *</Text>
                <TextInput
                  style={styles.input}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Branch Name *</Text>
                <TextInput
                  style={styles.input}
                  value={bankBranch}
                  onChangeText={setBankBranch}
                  placeholder="e.g. SG Highway"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Holder Name *</Text>
                <TextInput
                  style={styles.input}
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                  placeholder="Gokul Vegetables"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Number *</Text>
                <TextInput
                  style={styles.input}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="123456789012"
                  placeholderTextColor="#64748B"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>IFSC Code *</Text>
                <TextInput
                  style={styles.input}
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  placeholder="HDFC0000123"
                  placeholderTextColor="#64748B"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>UPI ID (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="gokul@okhdfc"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                />
              </View>

              <Text style={[styles.groupSub, { marginTop: 14 }]}>🔒 Create Account Password</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password (min 6 chars) *</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                />
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                  {termsAccepted && <CheckCircle2 size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.termsText}>
                  I agree to WormUp Vendor Partner Terms, Platform Policies & Commission Agreement.
                </Text>
              </TouchableOpacity>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(4)}>
                  <ArrowLeft size={16} color="#94A3B8" />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                  onPress={handleCompleteRegistration}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Complete Registration</Text>
                      <CheckCircle2 size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* STEP 6: Registration Complete Success Screen                       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {currentStep === 6 && (
            <View style={styles.successCard}>
              <View style={styles.successIconCircle}>
                <CheckCircle2 size={48} color="#10B981" />
              </View>

              <Text style={styles.successTitle}>Registration Submitted!</Text>
              <Text style={styles.successSub}>
                Your store application has been successfully lodged in WormUp Portal.
              </Text>

              {/* Vendor Code Pill */}
              <View style={styles.codePill}>
                <Text style={styles.codePillLabel}>ASSIGNED VENDOR CODE</Text>
                <Text style={styles.codePillVal}>{registeredVendorCode}</Text>
              </View>

              <View style={styles.reviewAlertBox}>
                <Info size={20} color="#38BDF8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewAlertTitle}>Application Under Review</Text>
                  <Text style={styles.reviewAlertText}>
                    Expected verification time: 24 to 48 business hours. Admin will verify your KYC documents.
                  </Text>
                </View>
              </View>

              <View style={styles.notifBox}>
                <Text style={styles.notifTitle}>You will be notified via:</Text>
                <View style={styles.notifItem}>
                  <Smartphone size={16} color="#10B981" />
                  <Text style={styles.notifText}>SMS on +91 {mobile}</Text>
                </View>
                <View style={styles.notifItem}>
                  <Building2 size={16} color="#10B981" />
                  <Text style={styles.notifText}>Email on {email}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onSuccess}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.rose,
    backgroundColor: 'rgba(255, 59, 152, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12,
  },
  stepper: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  stepBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  stepBarActive: {
    backgroundColor: '#10B981',
  },
  stepBarCurrent: {
    backgroundColor: COLORS.rose,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  chipsScroll: {
    flexDirection: 'row',
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.rose,
    borderColor: COLORS.rose,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 14,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  otpBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 48,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 12,
    backgroundColor: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  otpBoxFilled: {
    borderColor: COLORS.rose,
    backgroundColor: '#1E293B',
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: 6,
  },
  timerText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  resendLink: {
    fontSize: 13,
    color: COLORS.rose,
    fontWeight: '800',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  gpsBox: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
    flex: 1,
    marginLeft: 6,
  },
  gpsDetectBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gpsDetectText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  gpsCoords: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  groupSub: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.rose,
    borderColor: COLORS.rose,
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 16,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.rose,
    height: 48,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  // Success Card Styles
  successCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 8,
    marginTop: 20,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  codePill: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  codePillLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  codePillVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 2,
    marginTop: 4,
  },
  reviewAlertBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  reviewAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  reviewAlertText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  notifBox: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    width: '100%',
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  mapDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  mapExplainer: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: -4,
  },
  // ── Toastify Floating Notification Styles ──
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 48,
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 24,
  },
  toastCard: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#0F172A',
  },
  toastError: {
    backgroundColor: '#1E1014',
    borderColor: '#EF4444',
  },
  toastSuccess: {
    backgroundColor: '#0C1E17',
    borderColor: '#10B981',
  },
  toastInfo: {
    backgroundColor: '#0C1929',
    borderColor: '#38BDF8',
  },
  toastWarning: {
    backgroundColor: '#21180A',
    borderColor: '#F59E0B',
  },
  toastIconWrap: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastTextCol: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 12.5,
    color: '#E2E8F0',
    lineHeight: 17,
  },
  toastCloseBtn: {
    padding: 6,
    marginLeft: 8,
  },
});
