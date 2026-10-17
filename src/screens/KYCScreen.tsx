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
  Alert,
  Modal,
  Platform,
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
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { KycService, CustomerKycStatusResponse } from '../services/kycService';
import { useToast } from '../context/ToastContext';
import { uploadService } from '../services/uploadService';

export const KYCScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { goBack, user } = useApp();
  const toast = useToast();

  // Status state
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [kycStatus, setKycStatus] = useState<CustomerKycStatusResponse['kycStatus']>('none');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Form fields
  const [aadharNumber, setAadharNumber] = useState<string>('');
  const [aadharFrontUri, setAadharFrontUri] = useState<string>('');
  const [aadharBackUri, setAadharBackUri] = useState<string>('');

  const [bankName, setBankName] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>(user?.fullName || '');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');

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
        setKycStatus(res.data.kycStatus || 'none');
        if (res.data.aadharNumber) setAadharNumber(res.data.aadharNumber);
        if (res.data.bankName) setBankName(res.data.bankName);
        if (res.data.accountNumber) setAccountNumber(res.data.accountNumber);
        if (res.data.ifscCode) setIfscCode(res.data.ifscCode);
        if (res.data.upiId) setUpiId(res.data.upiId);
        if (res.data.aadharFront) setAadharFrontUri(res.data.aadharFront);
        if (res.data.aadharBack) setAadharBackUri(res.data.aadharBack);
        if (res.data.rejectionReason) setRejectionReason(res.data.rejectionReason);
      }
    } catch (e: any) {
      console.warn('Failed to load KYC status:', e.message);
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

        // Set immediate local preview
        if (type === 'front') {
          setAadharFrontUri(localFileUri);
        } else {
          setAadharBackUri(localFileUri);
        }

        showToast(`Uploading Aadhaar ${type === 'front' ? 'Front' : 'Back'} to secure cloud...`, 'info');

        try {
          const uploadRes = await uploadService.uploadMedia(localFileUri, {
            folder: 'wormup/customer/kyc/aadhaar',
            entityType: 'customer',
            fieldName: type === 'front' ? 'aadharFront' : 'aadharBack',
          });

          if (uploadRes.success && uploadRes.url) {
            if (type === 'front') {
              setAadharFrontUri(uploadRes.url);
            } else {
              setAadharBackUri(uploadRes.url);
            }
            showToast(`Aadhaar ${type === 'front' ? 'Front' : 'Back'} uploaded successfully!`, 'success');
          }
        } catch (uploadErr: any) {
          console.warn('[KYCScreen] Direct Cloudinary upload fallback:', uploadErr);
          // Keep local preview if cloud upload retried during submit
        }
      }
    } catch (e: any) {
      showToast('Failed to pick document image', 'error');
    }
  };

  const formatAadhar = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 12);
    setAadharNumber(cleaned);
  };

  const handleSubmit = async () => {
    if (aadharNumber.length !== 12) {
      showToast('Please enter a valid 12-digit Aadhaar number', 'error');
      return;
    }
    if (!aadharFrontUri) {
      showToast('Please upload front side of Aadhaar card', 'error');
      return;
    }
    if (!aadharBackUri) {
      showToast('Please upload back side of Aadhaar card', 'error');
      return;
    }
    if (!bankName.trim()) {
      showToast('Please enter your Bank Name', 'error');
      return;
    }
    if (!accountHolderName.trim()) {
      showToast('Please enter Account Holder Name', 'error');
      return;
    }
    if (!accountNumber.trim() || accountNumber.length < 8) {
      showToast('Please enter a valid Account Number', 'error');
      return;
    }
    if (!ifscCode.trim() || ifscCode.length < 9) {
      showToast('Please enter a valid IFSC Code', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let finalFrontUrl = aadharFrontUri;
      let finalBackUrl = aadharBackUri;

      // Guarantee clean Cloudinary URL before backend persistence
      if (!finalFrontUrl.startsWith('http://') && !finalFrontUrl.startsWith('https://')) {
        showToast('Uploading Aadhaar Front to cloud...', 'info');
        const upFront = await uploadService.uploadMedia(finalFrontUrl, {
          folder: 'wormup/customer/kyc/aadhaar',
          fieldName: 'aadharFront',
        });
        if (upFront.success && upFront.url) {
          finalFrontUrl = upFront.url;
          setAadharFrontUri(upFront.url);
        }
      }

      if (!finalBackUrl.startsWith('http://') && !finalBackUrl.startsWith('https://')) {
        showToast('Uploading Aadhaar Back to cloud...', 'info');
        const upBack = await uploadService.uploadMedia(finalBackUrl, {
          folder: 'wormup/customer/kyc/aadhaar',
          fieldName: 'aadharBack',
        });
        if (upBack.success && upBack.url) {
          finalBackUrl = upBack.url;
          setAadharBackUri(upBack.url);
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
        setKycStatus('pending');
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
        {/* Status Banner */}
        {loadingStatus ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingBannerText}>Checking verification status...</Text>
          </View>
        ) : kycStatus === 'verified' ? (
          <View style={[styles.statusBanner, styles.verifiedBanner]}>
            <CheckCircle size={22} color="#059669" />
            <View style={styles.statusBannerTextCol}>
              <Text style={styles.verifiedBannerTitle}>KYC Verified & Active</Text>
              <Text style={styles.verifiedBannerSubtitle}>
                Your identity and bank account are approved. Fast payouts unlocked!
              </Text>
            </View>
          </View>
        ) : kycStatus === 'pending' ? (
          <View style={[styles.statusBanner, styles.pendingBanner]}>
            <Clock size={22} color="#D97706" />
            <View style={styles.statusBannerTextCol}>
              <Text style={styles.pendingBannerTitle}>Under Verification</Text>
              <Text style={styles.pendingBannerSubtitle}>
                Our compliance team is verifying your Aadhaar and bank details.
              </Text>
            </View>
          </View>
        ) : kycStatus === 'rejected' ? (
          <View style={[styles.statusBanner, styles.rejectedBanner]}>
            <AlertCircle size={22} color="#DC2626" />
            <View style={styles.statusBannerTextCol}>
              <Text style={styles.rejectedBannerTitle}>Verification Rejected</Text>
              <Text style={styles.rejectedBannerSubtitle}>
                Reason: {rejectionReason || 'Document blurred or information mismatch.'} Please re-upload.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.statusBanner, styles.noneBanner]}>
            <ShieldCheck size={22} color="#2563EB" />
            <View style={styles.statusBannerTextCol}>
              <Text style={styles.noneBannerTitle}>Complete KYC to Unlock Rewards</Text>
              <Text style={styles.noneBannerSubtitle}>
                Submit your Aadhaar card and bank account details for instant withdrawals.
              </Text>
            </View>
          </View>
        )}

        {/* SECTION 1: Aadhaar Card Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FileCheck2 size={20} color="#059669" />
            <Text style={styles.cardTitle}>1. Aadhaar Card Verification</Text>
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
              editable={kycStatus !== 'verified'}
            />
          </View>

          {/* Upload Front Image */}
          <Text style={[styles.label, { marginTop: 14 }]}>Aadhaar Front Image *</Text>
          {aadharFrontUri ? (
            <View style={styles.previewBox}>
              <Image source={{ uri: aadharFrontUri }} style={styles.previewImage} />
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => setPreviewImage(aadharFrontUri)}
                >
                  <Eye size={16} color="#374151" />
                  <Text style={styles.previewBtnText}>View</Text>
                </TouchableOpacity>
                {kycStatus !== 'verified' && (
                  <TouchableOpacity
                    style={[styles.previewBtn, styles.deleteBtn]}
                    onPress={() => setAadharFrontUri('')}
                  >
                    <Trash2 size={16} color="#DC2626" />
                    <Text style={[styles.previewBtnText, { color: '#DC2626' }]}>Remove</Text>
                  </TouchableOpacity>
                )}
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
              <Image source={{ uri: aadharBackUri }} style={styles.previewImage} />
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => setPreviewImage(aadharBackUri)}
                >
                  <Eye size={16} color="#374151" />
                  <Text style={styles.previewBtnText}>View</Text>
                </TouchableOpacity>
                {kycStatus !== 'verified' && (
                  <TouchableOpacity
                    style={[styles.previewBtn, styles.deleteBtn]}
                    onPress={() => setAadharBackUri('')}
                  >
                    <Trash2 size={16} color="#DC2626" />
                    <Text style={[styles.previewBtnText, { color: '#DC2626' }]}>Remove</Text>
                  </TouchableOpacity>
                )}
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
            <Building size={20} color="#059669" />
            <Text style={styles.cardTitle}>2. Bank & Withdrawal Details</Text>
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
              editable={kycStatus !== 'verified'}
            />
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Branch Name</Text>
          <TextInput
            style={[styles.input, styles.standaloneInput]}
            placeholder="e.g. Navrangpura Branch"
            placeholderTextColor="#9CA3AF"
            value={branchName}
            onChangeText={setBranchName}
            editable={kycStatus !== 'verified'}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Account Holder Name *</Text>
          <TextInput
            style={[styles.input, styles.standaloneInput]}
            placeholder="Name matching bank records"
            placeholderTextColor="#9CA3AF"
            value={accountHolderName}
            onChangeText={setAccountHolderName}
            editable={kycStatus !== 'verified'}
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
              editable={kycStatus !== 'verified'}
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
            editable={kycStatus !== 'verified'}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>UPI ID (For Instant Payouts)</Text>
          <TextInput
            style={[styles.input, styles.standaloneInput]}
            placeholder="e.g. mobile@okaxis or name@upi"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            value={upiId}
            onChangeText={setUpiId}
            editable={kycStatus !== 'verified'}
          />
        </View>

        {/* Submit Button */}
        {kycStatus !== 'verified' && (
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
                : kycStatus === 'rejected'
                ? 'Resubmit KYC Documents'
                : 'Submit KYC for Verification'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Full Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Document Preview</Text>
            {previewImage && (
              <Image source={{ uri: previewImage }} style={styles.modalImage} resizeMode="contain" />
            )}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPreviewImage(null)}
            >
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
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
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
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
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
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
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
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
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
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
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
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
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
