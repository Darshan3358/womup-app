import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { GradientButton } from './GradientButton';
import { FileUploadField } from './FileUploadField';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { KycService, normalizeKycStatus } from '../../services/kycService';
import { StorageService } from '../../services/storageService';
import { resolveImageUrl } from '../../utils/imageUrl';

interface KycBankVerificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const KycBankVerificationModal: React.FC<KycBankVerificationModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, setUser } = useApp();

  // Has existing KYC or Bank info?
  const hasExistingData = Boolean(
    user.aadhaarNumber ||
    (user as any).aadharNumber ||
    user.bankName ||
    user.accountNumber ||
    (user as any).bankAccountNo ||
    user.customer_image_aadhar_front ||
    user.customer_image_aadhar_back
  );

  const [isEditing, setIsEditing] = useState<boolean>(!hasExistingData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobDay, setDobDay] = useState('01');
  const [dobMonth, setDobMonth] = useState('January');
  const [dobYear, setDobYear] = useState('2000');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [upiId, setUpiId] = useState('');

  const wasVisibleRef = useRef(false);

  // Sync state from user object on open (once per open) and hydrate latest KYC docs/status from backend
  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      return;
    }
    if (wasVisibleRef.current) return;
    wasVisibleRef.current = true;

    const existingAadhaar = user.aadhaarNumber || (user as any).aadharNumber || '';
    const formattedAadhaar = existingAadhaar
      ? existingAadhaar.replace(/\D/g, '').slice(0, 12).match(/.{1,4}/g)?.join(' ') || existingAadhaar
      : '';

    const localFront =
      user.customer_image_aadhar_front ||
      (user as any).aadharFrontImage ||
      (user as any).aadhaarFrontImage ||
      (user as any).frontImage ||
      '';
    const localBack =
      user.customer_image_aadhar_back ||
      (user as any).aadharBackImage ||
      (user as any).aadhaarBackImage ||
      (user as any).backImage ||
      '';

    setFullName(user.fullNameAsPerAadhaar || user.fullName || '');
    setBirthDate((user as any).birthDate || (user as any).birthdate || user.birthday || '');
    setAadhaarNumber(formattedAadhaar);
    setFrontImageUrl(localFront);
    setBackImageUrl(localBack);
    setBankName(user.bankName || '');
    setBranchName((user as any).branchName || '');
    setAccountNumber(user.accountNumber || (user as any).bankAccountNo || '');
    setIfscCode(user.ifscCode || '');
    setAccountHolderName(user.accountHolderName || user.fullNameAsPerAadhaar || user.fullName || '');
    setUpiId(user.upiId || '');

    const hasData = Boolean(
      existingAadhaar ||
      localFront ||
      localBack ||
      user.bankName ||
      user.accountNumber ||
      (user as any).bankAccountNo
    );
    setIsEditing(!hasData);
    setErrorMsg('');
    setSuccessMsg('');

    let active = true;
    KycService.getKycStatus()
      .then((res) => {
        if (!active || !res?.success || !res.data) return;
        const d = res.data;
        const serverFront = d.aadhaarFrontUrl || d.aadharFront || '';
        const serverBack = d.aadhaarBackUrl || d.aadharBack || '';
        const norm = normalizeKycStatus(d.kycStatus ?? (d as any).customerKycStatus, d);

        if (d.fullNameAsPerAadhaar) setFullName(d.fullNameAsPerAadhaar);
        if ((d as any).birthDate || (d as any).birthdate) setBirthDate((d as any).birthDate || (d as any).birthdate || '');
        if (d.rawAadhaarNumber) {
          setAadhaarNumber(
            d.rawAadhaarNumber.replace(/\D/g, '').slice(0, 12).match(/.{1,4}/g)?.join(' ') ||
              d.rawAadhaarNumber
          );
        }
        if (serverFront) setFrontImageUrl(serverFront);
        if (serverBack) setBackImageUrl(serverBack);
        if (d.bankDetails?.bankName || d.bankName) setBankName(d.bankDetails?.bankName || d.bankName || '');
        if (d.bankDetails?.branchName || (d as any).branchName) {
          setBranchName(d.bankDetails?.branchName || (d as any).branchName || '');
        }
        if (d.bankDetails?.rawAccountNumber || d.accountNumber) {
          setAccountNumber(d.bankDetails?.rawAccountNumber || d.accountNumber || '');
        }
        if (d.bankDetails?.ifscCode || d.ifscCode) setIfscCode(d.bankDetails?.ifscCode || d.ifscCode || '');
        if (d.bankDetails?.accountHolderName) setAccountHolderName(d.bankDetails.accountHolderName);
        if (d.bankDetails?.upiId || d.upiId) setUpiId(d.bankDetails?.upiId || d.upiId || '');

        if (norm === 'VERIFIED' || norm === 'PENDING') {
          setIsEditing(false);
        } else if (!hasData && !serverFront && !serverBack) {
          setIsEditing(true);
        }

        setUser((prev: any) => {
          const merged = {
            ...prev,
            customerKycStatus:
              norm === 'VERIFIED' ? 2 : norm === 'PENDING' ? 1 : norm === 'REJECTED' ? 3 : 0,
            verificationStatus: norm,
            aadhaarVerified: norm === 'VERIFIED',
            customer_image_aadhar_front: serverFront || prev.customer_image_aadhar_front,
            customer_image_aadhar_back: serverBack || prev.customer_image_aadhar_back,
            aadharFrontImage: serverFront || prev.aadharFrontImage,
            aadharBackImage: serverBack || prev.aadharBackImage,
            aadhaarFrontImage: serverFront || prev.aadhaarFrontImage,
            aadhaarBackImage: serverBack || prev.aadhaarBackImage,
          };
          StorageService.saveItem(StorageService.KEYS.USER, merged);
          return merged;
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [visible, user, setUser]);

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    const rawAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (!rawAadhaar || rawAadhaar.length !== 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!birthDate.trim()) {
      setErrorMsg('Please select your Date of Birth');
      return;
    }
    if (!bankName.trim()) {
      setErrorMsg('Please enter Bank Name');
      return;
    }
    if (!branchName.trim()) {
      setErrorMsg('Please enter Bank Branch Name');
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid Account Number');
      return;
    }
    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (!cleanIfsc || cleanIfsc.length < 9) {
      setErrorMsg('Please enter a valid IFSC Code (e.g. SBIN0001234)');
      return;
    }
    if (!accountHolderName.trim()) {
      setErrorMsg('Please enter Account Holder Name');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        aadhaarNumber: rawAadhaar,
        fullNameAsPerAadhaar: (fullName.trim() || user.fullName || 'Customer'),
        birthDate: birthDate.trim(),
        frontImage: frontImageUrl,
        backImage: backImageUrl,
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: cleanIfsc,
        accountHolderName: accountHolderName.trim(),
        upiId: upiId.trim(),
      };

      const res = await AuthService.verifyAadhaar(payload);

      if (res && res.success !== false) {
        const updatedUser = {
          ...user,
          verificationStatus: 'PENDING',
          customerKycStatus: 1,
          customerIsVerify: 2,
          aadhaarVerified: false,
          fullNameAsPerAadhaar: fullName.trim() || user.fullName,
          birthDate: birthDate.trim(),
          birthdate: birthDate.trim(),
          aadhaarNumber: rawAadhaar,
          aadharNumber: rawAadhaar,
          customer_image_aadhar_front: frontImageUrl,
          customer_image_aadhar_back: backImageUrl,
          aadharFrontImage: frontImageUrl,
          aadharBackImage: backImageUrl,
          aadhaarFrontImage: frontImageUrl,
          aadhaarBackImage: backImageUrl,
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          accountNumber: accountNumber.trim(),
          bankAccountNo: accountNumber.trim(),
          ifscCode: cleanIfsc,
          accountHolderName: accountHolderName.trim(),
          upiId: upiId.trim(),
        };

        setUser(updatedUser);
        await StorageService.saveItem(StorageService.KEYS.USER, updatedUser);
        AuthService.getProfile()
          .then((fresh) => {
            if (fresh) {
              setUser((prev) => {
                const merged = {
                  ...prev,
                  ...fresh,
                  savedAddresses:
                    prev.savedAddresses && prev.savedAddresses.length > 0
                      ? prev.savedAddresses
                      : fresh.savedAddresses,
                };
                StorageService.saveItem(StorageService.KEYS.USER, merged);
                return merged;
              });
            }
          })
          .catch(() => {});
        setSuccessMsg('KYC & Bank details submitted successfully for admin review!');
        setIsEditing(false);
      } else {
        setErrorMsg(res?.message || 'Verification submission failed. Please check details.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified =
    user.verificationStatus === 'VERIFIED' ||
    user.customerKycStatus === 2 ||
    user.aadhaarVerified;
  const isPending =
    user.verificationStatus === 'PENDING' || user.customerKycStatus === 1;
  const isRejected =
    user.verificationStatus === 'REJECTED' || user.customerKycStatus === 3;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.shieldIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color="#15803D" />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalHeading}>KYC & Bank Verification</Text>
              <Text style={styles.modalSub}>Aadhaar & Bank Account for Withdrawals</Text>
            </View>

            {hasExistingData && (
              <TouchableOpacity
                onPress={() => {
                  setIsEditing((prev) => !prev);
                  setErrorMsg('');
                }}
                style={styles.editToggleBtn}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isEditing ? 'close-outline' : 'create-outline'}
                  size={15}
                  color="#4F46E5"
                />
                <Text style={styles.editToggleText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Scroll Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error & Success Alerts */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorBoxText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                <Text style={styles.successBoxText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Status Banner */}
            {isVerified ? (
              <View style={[styles.statusBannerBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text style={[styles.statusBannerText, { color: '#065F46' }]}>
                  Verified & Approved. All downline income withdrawals and wallet perks are active.
                </Text>
              </View>
            ) : isPending ? (
              <View style={[styles.statusBannerBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Ionicons name="time" size={20} color="#D97706" />
                <Text style={[styles.statusBannerText, { color: '#92400E' }]}>
                  Under Admin Review. Your submitted documents & bank details are being verified.
                </Text>
              </View>
            ) : isRejected ? (
              <View style={[styles.statusBannerBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={[styles.statusBannerText, { color: '#991B1B' }]}>
                  KYC Rejected: {user.kycRejectReason || 'Please review and re-submit valid documents.'}
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBannerBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                <Ionicons name="information-circle" size={20} color="#0284C7" />
                <Text style={[styles.statusBannerText, { color: '#0369A1' }]}>
                  Enter Aadhaar and Bank details to enable secure direct payouts to your account.
                </Text>
              </View>
            )}

            {/* SECTION 1: IDENTITY DETAILS (AADHAAR) */}
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={18} color="#4F46E5" />
              <Text style={styles.sectionTitle}>Identity Details (Aadhaar)</Text>
            </View>

            {isEditing ? (
              <>
                {/* Full Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name (As per Aadhaar) *</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Legal name on Aadhaar"
                      placeholderTextColor={COLORS.secondaryText}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                {/* Date of Birth (Selectable Only) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date of Birth *</Text>
                  <TouchableOpacity
                    style={styles.inputRow}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (birthDate) {
                        const parts = birthDate.split(' ');
                        if (parts.length === 3) {
                          setDobDay(parts[0]);
                          setDobMonth(parts[1]);
                          setDobYear(parts[2]);
                        }
                      }
                      setShowDobPicker(true);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <Text
                      style={[
                        styles.input,
                        { color: birthDate ? COLORS.navy : COLORS.secondaryText },
                      ]}
                    >
                      {birthDate || 'Tap to select Date of Birth'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 12-Digit Aadhaar Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>12-Digit Aadhaar Number *</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="card-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="XXXX XXXX XXXX"
                      placeholderTextColor={COLORS.secondaryText}
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

                {/* Front & Back Image Uploads */}
                <FileUploadField
                  label="Aadhaar Front Image"
                  required={false}
                  value={frontImageUrl}
                  folder="womup/kyc/customer"
                  entityType="customer"
                  entityId={user.id || (user as any)._id}
                  resourceType="AADHAAR_FRONT"
                  onUploadComplete={(url) => {
                    setFrontImageUrl(url);
                    setUser((prev: any) => {
                      const next = {
                        ...prev,
                        customer_image_aadhar_front: url,
                        aadharFrontImage: url,
                        aadhaarFrontImage: url,
                      };
                      StorageService.saveItem(StorageService.KEYS.USER, next);
                      return next;
                    });
                  }}
                  helperText="Upload front side showing photo & 12-digit number"
                />

                <FileUploadField
                  label="Aadhaar Back Image"
                  required={false}
                  value={backImageUrl}
                  folder="womup/kyc/customer"
                  entityType="customer"
                  entityId={user.id || (user as any)._id}
                  resourceType="AADHAAR_BACK"
                  onUploadComplete={(url) => {
                    setBackImageUrl(url);
                    setUser((prev: any) => {
                      const next = {
                        ...prev,
                        customer_image_aadhar_back: url,
                        aadharBackImage: url,
                        aadhaarBackImage: url,
                      };
                      StorageService.saveItem(StorageService.KEYS.USER, next);
                      return next;
                    });
                  }}
                  helperText="Upload back side showing permanent address"
                />
              </>
            ) : (
              /* VIEW MODE: AADHAAR */
              <>
                <View style={styles.viewFieldBox}>
                  <Text style={styles.viewFieldLabel}>FULL NAME (AS PER AADHAAR)</Text>
                  <View style={styles.viewFieldValueRow}>
                    <Ionicons name="person" size={16} color="#4F46E5" />
                    <Text style={styles.viewFieldValue}>
                      {fullName || user.fullNameAsPerAadhaar || user.fullName || 'Not provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewFieldBox}>
                  <Text style={styles.viewFieldLabel}>DATE OF BIRTH</Text>
                  <View style={styles.viewFieldValueRow}>
                    <Ionicons name="calendar" size={16} color="#4F46E5" />
                    <Text style={styles.viewFieldValue}>
                      {birthDate || (user as any).birthDate || (user as any).birthdate || user.birthday || 'Not provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewFieldBox}>
                  <Text style={styles.viewFieldLabel}>12-DIGIT AADHAAR NUMBER</Text>
                  <View style={styles.viewFieldValueRow}>
                    <Ionicons name="card" size={16} color="#4F46E5" />
                    <Text style={styles.viewFieldValue}>
                      {aadhaarNumber || user.aadhaarNumber || (user as any).aadharNumber || 'Not provided'}
                    </Text>
                  </View>
                </View>

                {/* Front Document Card */}
                <View style={styles.viewDocCard}>
                  {frontImageUrl ? (
                    <Image
                      key={frontImageUrl}
                      source={{ uri: resolveImageUrl(frontImageUrl) }}
                      style={styles.viewDocThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.viewDocEmptyThumb}>
                      <Ionicons name="image-outline" size={22} color="#94A3B8" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.viewDocTitle}>Aadhaar Front Side</Text>
                    <Text style={styles.viewDocSubtitle}>
                      {frontImageUrl ? 'Uploaded & on file' : 'Not uploaded yet'}
                    </Text>
                  </View>
                  <View style={[styles.viewDocBadge, !frontImageUrl && { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons
                      name={frontImageUrl ? 'checkmark-circle' : 'close-circle'}
                      size={13}
                      color={frontImageUrl ? '#059669' : '#DC2626'}
                    />
                    <Text style={[styles.viewDocBadgeText, !frontImageUrl && { color: '#DC2626' }]}>
                      {frontImageUrl ? 'Uploaded' : 'Missing'}
                    </Text>
                  </View>
                </View>

                {/* Back Document Card */}
                <View style={styles.viewDocCard}>
                  {backImageUrl ? (
                    <Image
                      key={backImageUrl}
                      source={{ uri: resolveImageUrl(backImageUrl) }}
                      style={styles.viewDocThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.viewDocEmptyThumb}>
                      <Ionicons name="image-outline" size={22} color="#94A3B8" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.viewDocTitle}>Aadhaar Back Side</Text>
                    <Text style={styles.viewDocSubtitle}>
                      {backImageUrl ? 'Uploaded & on file' : 'Not uploaded yet'}
                    </Text>
                  </View>
                  <View style={[styles.viewDocBadge, !backImageUrl && { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons
                      name={backImageUrl ? 'checkmark-circle' : 'close-circle'}
                      size={13}
                      color={backImageUrl ? '#059669' : '#DC2626'}
                    />
                    <Text style={[styles.viewDocBadgeText, !backImageUrl && { color: '#DC2626' }]}>
                      {backImageUrl ? 'Uploaded' : 'Missing'}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* SECTION 2: BANK ACCOUNT DETAILS */}
            <View style={[styles.sectionHeader, { marginTop: 22 }]}>
              <Ionicons name="business-outline" size={18} color="#059669" />
              <Text style={[styles.sectionTitle, { color: '#065F46' }]}>
                Bank Account Details (Payout Destination)
              </Text>
            </View>

            {isEditing ? (
              <>
                {/* Bank Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bank Name *</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="business-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. State Bank of India, HDFC, ICICI..."
                      placeholderTextColor={COLORS.secondaryText}
                      value={bankName}
                      onChangeText={setBankName}
                    />
                  </View>
                </View>

                {/* Branch Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Branch Name *</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="git-branch-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Sarkhej Road, SG Highway, Navrangpura..."
                      placeholderTextColor={COLORS.secondaryText}
                      value={branchName}
                      onChangeText={setBranchName}
                    />
                  </View>
                </View>

                {/* Account Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Number *</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="wallet-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter full bank account number"
                      placeholderTextColor={COLORS.secondaryText}
                      keyboardType="numeric"
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                    />
                  </View>
                </View>

                {/* IFSC Code */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>IFSC Code *</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="qr-code-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. SBIN0001234 / HDFC0001234"
                      placeholderTextColor={COLORS.secondaryText}
                      autoCapitalize="characters"
                      value={ifscCode}
                      onChangeText={(t) => setIfscCode(t.toUpperCase())}
                    />
                  </View>
                </View>

                {/* Account Holder Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Holder Name *</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full name on bank account"
                      placeholderTextColor={COLORS.secondaryText}
                      value={accountHolderName}
                      onChangeText={setAccountHolderName}
                    />
                  </View>
                </View>

                {/* UPI ID */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>UPI ID (Optional)</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="at-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. mobile@upi / username@okhdfcbank"
                      placeholderTextColor={COLORS.secondaryText}
                      value={upiId}
                      onChangeText={setUpiId}
                    />
                  </View>
                </View>

                <GradientButton
                  title={isSubmitting ? 'Submitting Details...' : 'Submit for Verification'}
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  style={{ marginTop: 14, marginBottom: 28 }}
                />
              </>
            ) : (
              /* VIEW MODE: BANK */
              <>
                <View style={styles.viewFieldBox}>
                  <Text style={styles.viewFieldLabel}>BANK NAME</Text>
                  <View style={styles.viewFieldValueRow}>
                    <Ionicons name="business" size={16} color="#059669" />
                    <Text style={styles.viewFieldValue}>{bankName || user.bankName || 'Not entered yet'}</Text>
                  </View>
                </View>

                <View style={styles.viewFieldBox}>
                  <Text style={styles.viewFieldLabel}>BRANCH NAME</Text>
                  <View style={styles.viewFieldValueRow}>
                    <Ionicons name="git-branch" size={16} color="#059669" />
                    <Text style={styles.viewFieldValue}>{branchName || (user as any).branchName || 'Not entered yet'}</Text>
                  </View>
                </View>

                <View style={styles.viewFieldBox}>
                  <Text style={styles.viewFieldLabel}>ACCOUNT NUMBER</Text>
                  <View style={styles.viewFieldValueRow}>
                    <Ionicons name="wallet" size={16} color="#059669" />
                    <Text style={styles.viewFieldValue}>
                      {accountNumber || user.accountNumber || (user as any).bankAccountNo || 'Not entered yet'}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewFieldBox}>
                  <Text style={styles.viewFieldLabel}>IFSC CODE</Text>
                  <View style={styles.viewFieldValueRow}>
                    <Ionicons name="qr-code" size={16} color="#059669" />
                    <Text style={styles.viewFieldValue}>{ifscCode || user.ifscCode || 'Not entered yet'}</Text>
                  </View>
                </View>

                <View style={styles.viewFieldBox}>
                  <Text style={styles.viewFieldLabel}>ACCOUNT HOLDER NAME</Text>
                  <View style={styles.viewFieldValueRow}>
                    <Ionicons name="person" size={16} color="#059669" />
                    <Text style={styles.viewFieldValue}>
                      {accountHolderName || user.accountHolderName || user.fullNameAsPerAadhaar || user.fullName || 'Not entered yet'}
                    </Text>
                  </View>
                </View>

                {upiId || user.upiId ? (
                  <View style={styles.viewFieldBox}>
                    <Text style={styles.viewFieldLabel}>UPI ID</Text>
                    <View style={styles.viewFieldValueRow}>
                      <Ionicons name="at" size={16} color="#059669" />
                      <Text style={styles.viewFieldValue}>{upiId || user.upiId}</Text>
                    </View>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.editBtnBottom}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color="#4F46E5" />
                  <Text style={styles.editBtnBottomText}>Edit KYC & Bank Details</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Selectable-only Date of Birth Picker Modal */}
      <Modal
        visible={showDobPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDobPicker(false)}
      >
        <View style={styles.dobBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDobPicker(false)} />
          <View style={styles.dobCard}>
            <View style={styles.dobHeader}>
              <Text style={styles.dobTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.dobColumns}>
              {/* Day */}
              <View style={styles.dobCol}>
                <Text style={styles.dobColLabel}>Day</Text>
                <ScrollView style={styles.dobScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dobOption, dobDay === d && styles.dobOptionActive]}
                      onPress={() => setDobDay(d)}
                    >
                      <Text style={[styles.dobOptionText, dobDay === d && styles.dobOptionTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month */}
              <View style={[styles.dobCol, { flex: 1.5 }]}>
                <Text style={styles.dobColLabel}>Month</Text>
                <ScrollView style={styles.dobScroll} showsVerticalScrollIndicator={false}>
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December',
                  ].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.dobOption, dobMonth === m && styles.dobOptionActive]}
                      onPress={() => setDobMonth(m)}
                    >
                      <Text style={[styles.dobOptionText, dobMonth === m && styles.dobOptionTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year */}
              <View style={styles.dobCol}>
                <Text style={styles.dobColLabel}>Year</Text>
                <ScrollView style={styles.dobScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 75 }, (_, i) => String(new Date().getFullYear() - 14 - i)).map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.dobOption, dobYear === y && styles.dobOptionActive]}
                      onPress={() => setDobYear(y)}
                    >
                      <Text style={[styles.dobOptionText, dobYear === y && styles.dobOptionTextActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity
              style={styles.dobConfirmBtn}
              onPress={() => {
                setBirthDate(`${dobDay} ${dobMonth} ${dobYear}`);
                setShowDobPicker(false);
              }}
            >
              <Text style={styles.dobConfirmText}>Confirm: {dobDay} {dobMonth} {dobYear}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  shieldIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    marginRight: 8,
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBoxText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  successBoxText: {
    fontSize: 12,
    color: '#15803D',
    flex: 1,
    fontWeight: '600',
  },
  statusBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#312E81',
    letterSpacing: 0.2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 10,
  },
  viewFieldBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  viewFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  viewFieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewFieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  viewDocThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  viewDocEmptyThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewDocSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  viewDocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewDocBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  editBtnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  editBtnBottomText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  dobBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dobCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  dobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dobColumns: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dobCol: {
    flex: 1,
  },
  dobColLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  dobScroll: {
    height: 190,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  dobOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dobOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  dobOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  dobOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  dobConfirmBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dobConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
