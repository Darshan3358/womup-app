import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { RiderDocument } from '../../types/rider.types';

export const DocumentsScreen: React.FC<{ isAuthOnboarding?: boolean }> = ({ isAuthOnboarding }) => {
  const { setSubScreen, setAuthStep, updateProfile } = useRider();
  const [documents, setDocuments] = useState<RiderDocument[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [selectedDoc, setSelectedDoc] = useState<RiderDocument | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isPickingImage, setIsPickingImage] = useState(false);

  const loadDocs = async () => {
    const list = await RiderApiService.getDocuments();
    setDocuments(list);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocs();
    setRefreshing(false);
  };

  const handleOpenEdit = (doc: RiderDocument) => {
    setSelectedDoc(doc);
    setDocNumber(doc.documentNumberMasked && !doc.documentNumberMasked.includes('****') ? doc.documentNumberMasked : '');
    setExpiry(doc.expiresAt || '');
    setUploadedUrl(doc.fileUrl || '');
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    setIsPickingImage(true);
    try {
      let res: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera access is required to photograph your document.');
          setIsPickingImage(false);
          return;
        }
        res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8, base64: true });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery access is required.');
          setIsPickingImage(false);
          return;
        }
        res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8, base64: true });
      }

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setUploadedUrl(uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to pick document image.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSaveDoc = async () => {
    if (!selectedDoc) return;
    try {
      const updated = await RiderApiService.updateDocument(selectedDoc.id, {
        documentNumberMasked: docNumber.trim() || undefined,
        expiresAt: expiry.trim() || undefined,
        fileUrl: uploadedUrl || undefined,
      });
      setDocuments(updated);
      setSelectedDoc(null);
      Alert.alert('Document Submitted', `${selectedDoc.title} updated and submitted for verification.`);
    } catch {
      Alert.alert('Error', 'Failed to update document details.');
    }
  };

  const handleSubmitKycForApproval = async () => {
    setSubmitting(true);
    try {
      await updateProfile({ status: 'UNDER_REVIEW' });
      setAuthStep('APPROVAL_PENDING');
    } catch {
      Alert.alert('Submission Error', 'Failed to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {!isAuthOnboarding && (
        <>
          <TouchableOpacity style={[styles.backRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => setSubScreen('None')}>
            <Ionicons name="arrow-back" size={16} color={COLORS.hotPink} />
            <Text style={styles.backArrow}>Back to Menu</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>KYC & Fleet Legal Documents</Text>
          <Text style={styles.screenSubtitle}>
            Live verification status synced with WormUp Super Admin compliance desk.
          </Text>
        </>
      )}

      <View style={styles.docsList}>
        {documents.map((doc) => {
          const isVerified = doc.status === 'VERIFIED';
          const isPending = doc.status === 'PENDING';
          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docHeader}>
                <View style={[styles.docIconBox, { backgroundColor: isVerified ? '#ECFDF5' : isPending ? '#FFFBEB' : '#FEF2F2' }]}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={isVerified ? '#059669' : isPending ? '#D97706' : '#DC2626'}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docNumber}>{doc.documentNumberMasked || 'Not provided'}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isVerified ? '#ECFDF5' : isPending ? '#FFFBEB' : '#FEF2F2',
                      borderColor: isVerified ? '#A7F3D0' : isPending ? '#FDE68A' : '#FECACA',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: isVerified ? '#059669' : isPending ? '#D97706' : '#DC2626' },
                    ]}
                  >
                    {isVerified ? 'VERIFIED' : isPending ? 'PENDING' : 'NOT UPLOADED'}
                  </Text>
                </View>
              </View>

              <View style={styles.docFooter}>
                <Text style={styles.expiryText}>
                  {doc.expiresAt ? `Valid till: ${doc.expiresAt}` : isVerified ? 'Verified by Compliance' : 'Pending Verification'}
                </Text>
                <TouchableOpacity onPress={() => handleOpenEdit(doc)}>
                  <Text style={styles.uploadLink}>
                    {doc.fileUrl || doc.documentNumberMasked !== 'Not uploaded' ? 'Update Copy' : 'Upload Now →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {isAuthOnboarding ? (
        <TouchableOpacity
          style={styles.submitKycBtn}
          onPress={handleSubmitKycForApproval}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Text style={styles.submitKycBtnText}>
              {submitting ? 'SUBMITTING...' : 'SUBMIT FOR ADMIN APPROVAL'}
            </Text>
            {!submitting && <Ionicons name="arrow-forward" size={14} color="#FFF" />}
          </View>
        </TouchableOpacity>
      ) : null}

      <View style={styles.noticeBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Ionicons name="shield-checkmark" size={16} color="#059669" />
          <Text style={styles.noticeTitle}>Compliance Assurance</Text>
        </View>
        <Text style={styles.noticeDesc}>
          Commercial insurance and driver validity are synced in real time. If any document expires, the platform will notify you 15 days in advance.
        </Text>
      </View>

      {/* Edit Document Modal */}
      {selectedDoc && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setSelectedDoc(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Update {selectedDoc.title}</Text>
              <Text style={styles.modalSub}>Enter latest renewal details for compliance verification</Text>

              <Text style={styles.fieldLabel}>DOCUMENT / REGISTRATION NUMBER</Text>
              <TextInput
                style={styles.input}
                value={docNumber}
                onChangeText={setDocNumber}
                placeholder="e.g. GJ01-2019-0034892"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.fieldLabel}>EXPIRY DATE (IF APPLICABLE)</Text>
              <TextInput
                style={styles.input}
                value={expiry}
                onChangeText={setExpiry}
                placeholder="e.g. 11 Jan 2031"
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setSelectedDoc(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveDoc}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalSaveText}>Save & Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  backRow: {
    marginBottom: 12,
  },
  backArrow: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  docsList: {
    gap: 12,
    marginBottom: 20,
  },
  docCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  docIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIcon: {
    fontSize: 20,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  docNumber: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: COLORS.onlineGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onlineGreenDark,
  },
  docFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBackground,
    paddingTop: 10,
  },
  expiryText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  uploadLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },
  noticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 4,
  },
  noticeDesc: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondaryText,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: COLORS.hotPink,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  bottomSpacer: {
    height: 30,
  },
  onboardingHeader: {
    paddingTop: 10,
    marginBottom: 8,
  },
  onboardingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 98, 175, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 98, 175, 0.4)',
    marginBottom: 8,
  },
  onboardingBadgeText: {
    color: COLORS.hotPink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  submitKycBtn: {
    backgroundColor: COLORS.hotPink,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitKycBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

