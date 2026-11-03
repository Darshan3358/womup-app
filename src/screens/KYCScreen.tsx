import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  UploadCloud,
  FileCheck2,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Eye,
  Trash2,
  Building,
  CreditCard,
  Hash,
  Lock,
  ExternalLink,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { KycService, normalizeKycStatus, NormalizedKycStatus } from '../services/kycService';
import { useToast } from '../context/ToastContext';
import { uploadService } from '../services/uploadService';
import { resolveImageUrl } from '../utils/imageUrl';

export const KYCScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { goBack, user } = useApp();
  const toast = useToast();

  // Initialize status from local user state if available to prevent flash of empty form
  const initialStatus = normalizeKycStatus((user as any)?.customerKycStatus, user);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [kycStatus, setKycStatus] = useState<NormalizedKycStatus>(initialStatus);
  const [rejectionReason, setRejectionReason] = useState<string>(
    (user as any)?.customerAadharRejectionReason || (user as any)?.kycRejectReason || ''
  );
  const [submittedAt, setSubmittedAt] = useState<string>('');

  // Form fields
  const [aadharNumber, setAadharNumber] = useState<string>((user as any)?.aadhaarNumber || '');
  const [aadharFrontUri, setAadharFrontUri] = useState<string>(
    (user as any)?.customer_image_aadhar_front || (user as any)?.aadharFrontImage || ''
  );
  const [aadharBackUri, setAadharBackUri] = useState<string>(
    (user as any)?.customer_image_aadhar_back || (user as any)?.aadharBackImage || ''
  );

  const [bankName, setBankName] = useState<string>((user as any)?.bankName || '');
  const [branchName, setBranchName] = useState<string>((user as any)?.branchName || '');
  const [accountHolderName, setAccountHolderName] = useState<string>(
    (user as any)?.accountHolderName || (user as any)?.fullNameAsPerAadhaar || user?.fullName || ''
  );
  const [accountNumber, setAccountNumber] = useState<string>(
    (user as any)?.accountNumber || (user as any)?.bankAccountNo || ''
  );
  const [ifscCode, setIfscCode] = useState<string>((user as any)?.ifscCode || '');
  const [upiId, setUpiId] = useState<string>((user as any)?.upiId || '');

  // UI state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'success') {
      toast.showSuccess(msg);
    } else if (type === 'error') {
      toast.showError(msg);
    } else {
      toast.showInfo(msg);
    }
  };

  useEffect(() => {
    loadExistingKycStatus();
  }, []);

  const loadExistingKycStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await KycService.getKycStatus();
      if (res.success && res.data) {
        const norm = normalizeKycStatus(res.data.kycStatus, res.data);
        setKycStatus(norm);

        const data = res.data;
        const rawAadhar = data.rawAadhaarNumber || data.aadharNumber || '';
        if (rawAadhar) setAadharNumber(rawAadhar);

        const bank = data.bankDetails || {};
        const bName = bank.bankName || (data as any).bankName || '';
        if (bName) setBankName(bName);

        const brName =
          bank.branchName || (data as any).bankBranch || (data as any).branchName || '';
        if (brName) setBranchName(brName);

        const accHolder =
          bank.accountHolderName ||
          (data as any).accountHolderName ||
          data.fullNameAsPerAadhaar ||
          user?.fullName ||
          '';
        if (accHolder) setAccountHolderName(accHolder);

        const accNum =
          bank.rawAccountNumber || bank.accountNumber || (data as any).accountNumber || '';
        if (accNum) setAccountNumber(accNum);

        const ifsc = bank.ifscCode || (data as any).ifscCode || '';
        if (ifsc) setIfscCode(ifsc);

        const upi = bank.upiId || (data as any).upiId || '';
        if (upi) setUpiId(upi);

        const front = data.aadhaarFrontUrl || (data as any).aadharFront || '';
        if (front) setAadharFrontUri(front);

        const back = data.aadhaarBackUrl || (data as any).aadharBack || '';
        if (back) setAadharBackUri(back);

        if (data.rejectionReason) setRejectionReason(data.rejectionReason);
        if (data.submittedAt) setSubmittedAt(data.submittedAt);
      } else {
        const fallbackNorm = normalizeKycStatus((user as any)?.customerKycStatus, user);
        setKycStatus(fallbackNorm);
      }
    } catch (e: any) {
      console.warn('Failed to load KYC status from API:', e.message);
      const fallbackNorm = normalizeKycStatus((user as any)?.customerKycStatus, user);
      setKycStatus(fallbackNorm);
    } finally {
      setLoadingStatus(false);
    }
  };

  const pickImage = async (type: 'front' | 'back', source: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showToast('Camera permission is required', 'error');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast('Gallery permission is required', 'error');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const localFileUri = asset.uri;

        if (type === 'front') {
          setAadharFrontUri(localFileUri);
        } else {
          setAadharBackUri(localFileUri);
        }

        showToast(
          `Uploading Aadhaar ${type === 'front' ? 'Front' : 'Back'} to secure cloud...`,
          'info'
        );

        try {
          const uploadRes = await uploadService.uploadMedia(localFileUri, {
            folder: 'wormup/customer/kyc/aadhaar',
            entityType: 'customer',
            fieldName: type === 'front' ? 'aadharFront' : 'aadharBack',
          });
          const resUrl = uploadRes?.url || (uploadRes as any)?.data?.url;
          if (uploadRes.success && resUrl) {
            if (type === 'front') {
              setAadharFrontUri(resUrl);
            } else {
              setAadharBackUri(resUrl);
            }
            showToast(
              `Aadhaar ${type === 'front' ? 'Front' : 'Back'} uploaded successfully!`,
              'success'
            );
          }
        } catch (uploadErr: any) {
          console.warn('Direct upload warning, file kept locally:', uploadErr.message);
        }
      }
    } catch (e: any) {
      showToast('Error selecting image: ' + e.message, 'error');
    }
  };

  const formatAadhar = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 12) {
      setAadharNumber(cleaned);
    }
  };

  const formatMaskedAadhaar = (val: string) => {
    if (!val) return 'XXXX XXXX XXXX';
    const clean = val.replace(/\s+/g, '');
    if (clean.includes('X')) {
      return clean.replace(/(.{4})/g, '$1 ').trim();
    }
    if (clean.length === 12) {
      return `XXXX XXXX ${clean.slice(-4)}`;
    }
    return val;
  };

  const formatMaskedAccount = (val: string) => {
    if (!val) return 'XXXXXXXXXXXX';
    const clean = val.trim();
    if (clean.includes('X')) return clean;
    if (clean.length > 4) {
      return `XXXX XXXX ${clean.slice(-4)}`;
    }
    return clean;
  };

  const validateForm = () => {
    const cleanAadhaar = aadharNumber.replace(/\s+/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      showToast('Please enter a valid 12-digit Aadhaar number', 'error');
      return false;
    }
    if (!aadharFrontUri) {
      showToast('Please upload Aadhaar Front Image', 'error');
      return false;
    }
    if (!aadharBackUri) {
      showToast('Please upload Aadhaar Back Image', 'error');
      return false;
    }
    if (!bankName.trim()) {
      showToast('Please enter your Bank Name', 'error');
      return false;
    }
    if (!accountHolderName.trim()) {
      showToast('Please enter Account Holder Name', 'error');
      return false;
    }
    if (!accountNumber.trim() || accountNumber.length < 8) {
      showToast('Please enter a valid Bank Account Number', 'error');
      return false;
    }
    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (!cleanIfsc || cleanIfsc.length !== 11) {
      showToast('Please enter a valid 11-character IFSC code', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      let finalFrontUrl = aadharFrontUri;
      let finalBackUrl = aadharBackUri;

      if (!aadharFrontUri.startsWith('http')) {
        const upFront = await uploadService.uploadMedia(aadharFrontUri, {
          folder: 'wormup/customer/kyc/aadhaar',
          entityType: 'customer',
          fieldName: 'aadharFront',
        });
        const frontUrl = upFront?.url || (upFront as any)?.data?.url;
        if (upFront.success && frontUrl) {
          finalFrontUrl = frontUrl;
          setAadharFrontUri(frontUrl);
        }
      }

      if (!aadharBackUri.startsWith('http')) {
        const upBack = await uploadService.uploadMedia(aadharBackUri, {
          folder: 'wormup/customer/kyc/aadhaar',
          entityType: 'customer',
          fieldName: 'aadharBack',
        });
        const backUrl = upBack?.url || (upBack as any)?.data?.url;
        if (upBack.success && backUrl) {
          finalBackUrl = backUrl;
          setAadharBackUri(backUrl);
        }
      }

      const res = await KycService.submitKyc({
        aadharNumber,
        aadharFront: finalFrontUrl,
        aadharBack: finalBackUrl,
        bankName,
        bankBranch: branchName,
        accountHolderName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase().trim(),
        upiId: upiId.trim() || undefined,
      });

      if (res.success) {
        setKycStatus('PENDING');
        showToast('KYC documents submitted successfully for verification!', 'success');
      } else {
        showToast(res.message || 'Submission failed. Please try again.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error submitting KYC', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Render 1: VERIFIED READ-ONLY VIEW
  const renderVerifiedView = () => (
    <>
      {/* Verified Status Banner */}
      <View style={[styles.statusBanner, styles.verifiedBanner]}>
        <CheckCircle size={24} color="#059669" />
        <View style={styles.statusBannerTextCol}>
          <Text style={styles.verifiedBannerTitle}>KYC Verified & Active</Text>
          <Text style={styles.verifiedBannerSubtitle}>
            Your identity and bank account are approved. Payouts and income features are fully active!
          </Text>
        </View>
      </View>

      {/* READ-ONLY SECTION 1: Aadhaar Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <FileCheck2 size={20} color="#059669" />
            <Text style={styles.cardTitle}>1. Aadhaar Identity Details</Text>
          </View>
          <View style={styles.verifiedChip}>
            <CheckCircle size={13} color="#059669" />
            <Text style={styles.verifiedChipText}>Verified</Text>
          </View>
        </View>

        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>12-Digit Aadhaar Number</Text>
          <View style={styles.readOnlyValueBox}>
            <Lock size={15} color="#059669" style={{ marginRight: 8 }} />
            <Text style={styles.readOnlyValueText}>{formatMaskedAadhaar(aadharNumber)}</Text>
          </View>
        </View>

        <View style={[styles.readOnlyField, { marginTop: 12 }]}>
          <Text style={styles.readOnlyLabel}>Name as per Records</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>
              {accountHolderName || user?.fullName || 'Verified Customer'}
            </Text>
          </View>
        </View>

        {/* Aadhaar Images in Read-Only Mode */}
        {(aadharFrontUri || aadharBackUri) && (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.readOnlyLabel}>Verified Aadhaar Documents</Text>
            <View style={styles.verifiedDocsRow}>
              {aadharFrontUri ? (
                <TouchableOpacity
                  style={styles.verifiedDocCard}
                  onPress={() => setPreviewImage(aadharFrontUri)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: resolveImageUrl(aadharFrontUri) }}
                    style={styles.verifiedDocThumb}
                  />
                  <View style={styles.verifiedDocOverlay}>
                    <Eye size={14} color="#FFFFFF" />
                    <Text style={styles.verifiedDocText}>Front Side</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
              {aadharBackUri ? (
                <TouchableOpacity
                  style={styles.verifiedDocCard}
                  onPress={() => setPreviewImage(aadharBackUri)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: resolveImageUrl(aadharBackUri) }}
                    style={styles.verifiedDocThumb}
                  />
                  <View style={styles.verifiedDocOverlay}>
                    <Eye size={14} color="#FFFFFF" />
                    <Text style={styles.verifiedDocText}>Back Side</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      </View>

      {/* READ-ONLY SECTION 2: Bank & Withdrawal Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Building size={20} color="#059669" />
            <Text style={styles.cardTitle}>2. Bank & Withdrawal Details</Text>
          </View>
          <View style={styles.verifiedChip}>
            <CheckCircle size={13} color="#059669" />
            <Text style={styles.verifiedChipText}>Approved Payouts</Text>
          </View>
        </View>

        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Bank Name</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{bankName || 'Verified Bank Account'}</Text>
          </View>
        </View>

        {branchName ? (
          <View style={[styles.readOnlyField, { marginTop: 12 }]}>
            <Text style={styles.readOnlyLabel}>Branch Name</Text>
            <View style={styles.readOnlyValueBox}>
              <Text style={styles.readOnlyValueText}>{branchName}</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.readOnlyField, { marginTop: 12 }]}>
          <Text style={styles.readOnlyLabel}>Account Holder Name</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>
              {accountHolderName || user?.fullName || 'Verified Account Holder'}
            </Text>
          </View>
        </View>

        <View style={[styles.readOnlyField, { marginTop: 12 }]}>
          <Text style={styles.readOnlyLabel}>Account Number</Text>
          <View style={styles.readOnlyValueBox}>
            <Lock size={15} color="#059669" style={{ marginRight: 8 }} />
            <Text style={styles.readOnlyValueText}>{formatMaskedAccount(accountNumber)}</Text>
          </View>
        </View>

        <View style={[styles.readOnlyField, { marginTop: 12 }]}>
          <Text style={styles.readOnlyLabel}>IFSC Code</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{ifscCode || '—'}</Text>
          </View>
        </View>

        {upiId ? (
          <View style={[styles.readOnlyField, { marginTop: 12 }]}>
            <Text style={styles.readOnlyLabel}>UPI ID (Instant Payouts)</Text>
            <View style={styles.readOnlyValueBox}>
              <Text style={styles.readOnlyValueText}>{upiId}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Security & Lock Information Note */}
      <View style={styles.lockInfoCard}>
        <ShieldCheck size={22} color="#059669" />
        <View style={{ flex: 1 }}>
          <Text style={styles.lockInfoTitle}>Verified & Securely Locked</Text>
          <Text style={styles.lockInfoDesc}>
            Your KYC credentials are authenticated. To protect your payouts, details cannot be changed
            directly. To request an update, please contact WormUp Support.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.returnButton} onPress={goBack}>
        <Text style={styles.returnButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </>
  );

  // Render 2: PENDING / UNDER REVIEW VIEW
  const renderPendingView = () => (
    <>
      {/* Pending Status Banner */}
      <View style={[styles.statusBanner, styles.pendingBanner]}>
        <Clock size={24} color="#D97706" />
        <View style={styles.statusBannerTextCol}>
          <Text style={styles.pendingBannerTitle}>Under Verification</Text>
          <Text style={styles.pendingBannerSubtitle}>
            Our compliance team is verifying your Aadhaar and bank details. Verification usually takes up to
            24 hours.
          </Text>
        </View>
      </View>

      {/* READ-ONLY SUBMITTED AADHAAR */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <FileCheck2 size={20} color="#D97706" />
            <Text style={styles.cardTitle}>1. Aadhaar Identity Details</Text>
          </View>
          <View style={styles.pendingChip}>
            <Clock size={13} color="#D97706" />
            <Text style={styles.pendingChipText}>Under Review</Text>
          </View>
        </View>

        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Aadhaar Number</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{formatMaskedAadhaar(aadharNumber)}</Text>
          </View>
        </View>

        {(aadharFrontUri || aadharBackUri) && (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.readOnlyLabel}>Submitted Documents</Text>
            <View style={styles.verifiedDocsRow}>
              {aadharFrontUri ? (
                <TouchableOpacity
                  style={styles.verifiedDocCard}
                  onPress={() => setPreviewImage(aadharFrontUri)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: resolveImageUrl(aadharFrontUri) }}
                    style={styles.verifiedDocThumb}
                  />
                  <View style={styles.verifiedDocOverlay}>
                    <Eye size={14} color="#FFFFFF" />
                    <Text style={styles.verifiedDocText}>Front Side</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
              {aadharBackUri ? (
                <TouchableOpacity
                  style={styles.verifiedDocCard}
                  onPress={() => setPreviewImage(aadharBackUri)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: resolveImageUrl(aadharBackUri) }}
                    style={styles.verifiedDocThumb}
                  />
                  <View style={styles.verifiedDocOverlay}>
                    <Eye size={14} color="#FFFFFF" />
                    <Text style={styles.verifiedDocText}>Back Side</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      </View>

      {/* READ-ONLY SUBMITTED BANK DETAILS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Building size={20} color="#D97706" />
            <Text style={styles.cardTitle}>2. Bank & Withdrawal Details</Text>
          </View>
          <View style={styles.pendingChip}>
            <Clock size={13} color="#D97706" />
            <Text style={styles.pendingChipText}>Under Review</Text>
          </View>
        </View>

        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Bank Name</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{bankName || 'Submitted'}</Text>
          </View>
        </View>

        <View style={[styles.readOnlyField, { marginTop: 12 }]}>
          <Text style={styles.readOnlyLabel}>Account Holder Name</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{accountHolderName || user?.fullName}</Text>
          </View>
        </View>

        <View style={[styles.readOnlyField, { marginTop: 12 }]}>
          <Text style={styles.readOnlyLabel}>Account Number</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{formatMaskedAccount(accountNumber)}</Text>
          </View>
        </View>

        <View style={[styles.readOnlyField, { marginTop: 12 }]}>
          <Text style={styles.readOnlyLabel}>IFSC Code</Text>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{ifscCode || '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.pendingNoticeCard}>
        <Clock size={20} color="#D97706" />
        <View style={{ flex: 1 }}>
          <Text style={styles.pendingNoticeTitle}>Verification in Progress</Text>
          <Text style={styles.pendingNoticeDesc}>
            You will receive a notification as soon as your documents are verified. You do not need to
            re-submit.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.returnButton} onPress={goBack}>
        <Text style={styles.returnButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </>
  );

  // Render 3: EDITABLE FORM VIEW (For NOT_SUBMITTED or REJECTED resubmission)
  const renderFormView = (isResubmit: boolean) => (
    <>
      {/* Status Banner */}
      {isResubmit ? (
        <View style={[styles.statusBanner, styles.rejectedBanner]}>
          <AlertCircle size={24} color="#DC2626" />
          <View style={styles.statusBannerTextCol}>
            <Text style={styles.rejectedBannerTitle}>Verification Rejected</Text>
            <Text style={styles.rejectedBannerSubtitle}>
              Reason: {rejectionReason || 'Document blurred or information mismatch.'} Please update your
              information or re-upload clear photos.
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.statusBanner, styles.noneBanner]}>
          <ShieldCheck size={24} color="#2563EB" />
          <View style={styles.statusBannerTextCol}>
            <Text style={styles.noneBannerTitle}>Complete KYC to Unlock Rewards</Text>
            <Text style={styles.noneBannerSubtitle}>
              Submit your Aadhaar card and bank account details for instant withdrawals and bonuses.
            </Text>
          </View>
        </View>
      )}

      {/* SECTION 1: Aadhaar Card Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <FileCheck2 size={20} color="#059669" />
            <Text style={styles.cardTitle}>1. Aadhaar Card Verification</Text>
          </View>
        </View>

        <Text style={styles.label}>12-Digit Aadhaar Number *</Text>
        <View style={styles.inputContainer}>
          <Hash size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="0000 0000 0000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={12}
            value={aadharNumber}
            onChangeText={formatAadhar}
          />
        </View>

        {/* Upload Front Image */}
        <Text style={[styles.label, { marginTop: 14 }]}>Aadhaar Front Image *</Text>
        {aadharFrontUri ? (
          <View style={styles.previewBox}>
            <Image source={{ uri: resolveImageUrl(aadharFrontUri) }} style={styles.previewImage} />
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewBtn}
                onPress={() => setPreviewImage(aadharFrontUri)}
              >
                <Eye size={16} color="#374151" />
                <Text style={styles.previewBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewBtn, styles.deleteBtn]}
                onPress={() => setAadharFrontUri('')}
              >
                <Trash2 size={16} color="#DC2626" />
                <Text style={[styles.previewBtnText, { color: '#DC2626' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => pickImage('front', 'camera')}
            >
              <Camera size={18} color="#059669" />
              <Text style={styles.uploadBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => pickImage('front', 'gallery')}
            >
              <ImageIcon size={18} color="#059669" />
              <Text style={styles.uploadBtnText}>Pick Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload Back Image */}
        <Text style={[styles.label, { marginTop: 14 }]}>Aadhaar Back Image *</Text>
        {aadharBackUri ? (
          <View style={styles.previewBox}>
            <Image source={{ uri: resolveImageUrl(aadharBackUri) }} style={styles.previewImage} />
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewBtn}
                onPress={() => setPreviewImage(aadharBackUri)}
              >
                <Eye size={16} color="#374151" />
                <Text style={styles.previewBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewBtn, styles.deleteBtn]}
                onPress={() => setAadharBackUri('')}
              >
                <Trash2 size={16} color="#DC2626" />
                <Text style={[styles.previewBtnText, { color: '#DC2626' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => pickImage('back', 'camera')}
            >
              <Camera size={18} color="#059669" />
              <Text style={styles.uploadBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => pickImage('back', 'gallery')}
            >
              <ImageIcon size={18} color="#059669" />
              <Text style={styles.uploadBtnText}>Pick Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* SECTION 2: Bank & Payout Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Building size={20} color="#059669" />
            <Text style={styles.cardTitle}>2. Bank & Withdrawal Details</Text>
          </View>
        </View>

        <Text style={styles.label}>Bank Name *</Text>
        <View style={styles.inputContainer}>
          <Building size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. HDFC Bank, SBI, ICICI"
            placeholderTextColor="#9CA3AF"
            value={bankName}
            onChangeText={setBankName}
          />
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Branch Name</Text>
        <TextInput
          style={[styles.input, styles.standaloneInput]}
          placeholder="e.g. Navrangpura Branch"
          placeholderTextColor="#9CA3AF"
          value={branchName}
          onChangeText={setBranchName}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Account Holder Name *</Text>
        <TextInput
          style={[styles.input, styles.standaloneInput]}
          placeholder="Name matching bank records"
          placeholderTextColor="#9CA3AF"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Account Number *</Text>
        <View style={styles.inputContainer}>
          <CreditCard size={18} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter bank account number"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={accountNumber}
            onChangeText={setAccountNumber}
          />
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>IFSC Code *</Text>
        <TextInput
          style={[styles.input, styles.standaloneInput]}
          placeholder="e.g. HDFC0000123"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
          maxLength={11}
          value={ifscCode}
          onChangeText={(txt) => setIfscCode(txt.toUpperCase())}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>UPI ID (For Instant Payouts)</Text>
        <TextInput
          style={[styles.input, styles.standaloneInput]}
          placeholder="e.g. mobile@okaxis or name@upi"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          value={upiId}
          onChangeText={setUpiId}
        />
      </View>

      {/* Action Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <UploadCloud size={20} color="#FFFFFF" />
        )}
        <Text style={styles.submitButtonText}>
          {submitting
            ? 'Submitting Documents...'
            : isResubmit
            ? 'Resubmit KYC Documents'
            : 'Submit KYC for Verification'}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer KYC Verification</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loadingStatus && !aadharNumber && !bankName ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingBannerText}>Checking verification status...</Text>
          </View>
        ) : null}

        {kycStatus === 'VERIFIED' && renderVerifiedView()}
        {kycStatus === 'PENDING' && renderPendingView()}
        {kycStatus === 'REJECTED' && renderFormView(true)}
        {kycStatus === 'NOT_SUBMITTED' && renderFormView(false)}
      </ScrollView>

      {/* Full Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Document Preview</Text>
            {previewImage && (
              <Image
                source={{ uri: resolveImageUrl(previewImage) }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewImage(null)}>
              <Text style={styles.modalCloseBtnText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  loadingBannerText: {
    fontSize: 13,
    color: '#065F46',
  },
  statusBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  statusBannerTextCol: {
    flex: 1,
  },
  verifiedBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  verifiedBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
  },
  verifiedBannerSubtitle: {
    fontSize: 12.5,
    color: '#047857',
    marginTop: 3,
    lineHeight: 18,
  },
  pendingBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pendingBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingBannerSubtitle: {
    fontSize: 12.5,
    color: '#B45309',
    marginTop: 3,
    lineHeight: 18,
  },
  rejectedBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  rejectedBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  rejectedBannerSubtitle: {
    fontSize: 12.5,
    color: '#B91C1C',
    marginTop: 3,
    lineHeight: 18,
  },
  noneBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  noneBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  noneBannerSubtitle: {
    fontSize: 12.5,
    color: '#2563EB',
    marginTop: 3,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111827',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  pendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  pendingChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  readOnlyField: {
    marginBottom: 4,
  },
  readOnlyLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  readOnlyValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  verifiedDocsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  verifiedDocCard: {
    flex: 1,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    backgroundColor: '#111827',
  },
  verifiedDocThumb: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  verifiedDocOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 5,
  },
  verifiedDocText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  lockInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  lockInfoTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  lockInfoDesc: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 17,
  },
  pendingNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  pendingNoticeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  pendingNoticeDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  returnButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: '#111827',
  },
  standaloneInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
  },
  previewImage: {
    width: 60,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  deleteBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  previewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalImage: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  modalCloseBtn: {
    marginTop: 14,
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
