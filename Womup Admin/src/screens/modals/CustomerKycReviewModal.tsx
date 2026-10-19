import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  CheckCircle2,
  AlertCircle,
  User,
  MapPin,
  FileCheck2,
  Building2,
  Coins,
  Shield,
  Maximize2,
  Users,
} from 'lucide-react-native';
import { ApiService } from '../../services/api';
import { resolveImageUrl } from '../../utils/imageUrl';

interface CustomerKycReviewModalProps {
  isOpen: boolean;
  customerId: string | null;
  onClose: () => void;
  onApproved?: () => void;
  onRejected?: () => void;
}

const CUSTOMER_REJECTION_REASONS = [
  'Aadhaar number does not match image',
  'Aadhaar image not clear or illegible',
  'Front image missing or invalid',
  'Back image missing or address unreadable',
  'Name mismatch with official database',
  'Suspicious or tampered document',
  'Other (specify in additional notes)',
];

export const CustomerKycReviewModal: React.FC<CustomerKycReviewModalProps> = ({
  isOpen,
  customerId,
  onClose,
  onApproved,
  onRejected,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CUSTOMER_REJECTION_REASONS[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Zoom modal
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      loadReviewData();
    }
  }, [isOpen, customerId]);

  const loadReviewData = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const res = await ApiService.getCustomerKycReview(customerId);
      if (res.success && res.data) {
        setCustomer(res.data);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed loading customer review');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!customerId) return;
    setSubmitting(true);
    try {
      const res = await ApiService.approveCustomerKyc(customerId);
      if (res.success) {
        Alert.alert(
          'KYC Approved',
          'Customer KYC verified successfully! Referral App Download income released to sponsor.'
        );
        onApproved?.();
        onClose();
      } else {
        Alert.alert('Failed', res.message || 'Failed approving customer KYC');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error executing customer approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!customerId) return;
    const finalReason = additionalNotes.trim()
      ? `${selectedReason} - ${additionalNotes.trim()}`
      : selectedReason;

    setSubmitting(true);
    try {
      const res = await ApiService.rejectCustomerKyc(customerId, finalReason);
      if (res.success) {
        Alert.alert('Rejected', `Customer KYC rejected: ${finalReason}`);
        setIsRejectModalOpen(false);
        onRejected?.();
        onClose();
      } else {
        Alert.alert('Failed', res.message || 'Failed rejecting customer KYC');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error rejecting customer KYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <User size={22} color="#10B981" />
              <View>
                <Text style={styles.headerTitle}>
                  {customer?.name ||
                    `${customer?.customer_first_name || ''} ${customer?.customer_surname || ''}`.trim() ||
                    'Customer KYC Review'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  Code: {customer?.customer_code || customer?.referralCode || 'WM-NEW'} • KYC Status:{' '}
                  {customer?.customerKycStatus === 2
                    ? 'CONFIRMED'
                    : customer?.customerKycStatus === 3
                    ? 'REJECTED'
                    : 'PENDING'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading Aadhaar documents & customer profile...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* SECTION 1: PERSONAL INFO */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>📋 Section 1: Personal Information</Text>
                <View style={styles.grid}>
                  <InfoItem label="First Name" value={customer?.customer_first_name || customer?.name?.split(' ')[0]} />
                  <InfoItem label="Surname" value={customer?.customer_surname || customer?.name?.split(' ').slice(1).join(' ')} />
                  <InfoItem label="Father / Husband Name" value={customer?.customer_father_husband_name || '—'} />
                  <InfoItem label="Gender" value={customer?.customer_gender || customer?.gender || '—'} />
                  <InfoItem label="Birthdate" value={customer?.customer_birthdate || customer?.birthdate || '—'} />
                  <InfoItem label="Mobile Number" value={customer?.phone || customer?.customer_mobile} />
                  <InfoItem label="Customer Code" value={customer?.customer_code || customer?.referralCode} />
                  <InfoItem label="Aadhaar Number (Masked)" value={customer?.maskedAadhaar || 'XXXX XXXX 1234'} />
                </View>
              </View>

              {/* SECTION 2: ADDRESS */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>📍 Section 2: Residential Address</Text>
                <View style={styles.grid}>
                  <InfoItem label="Street Address" value={customer?.customer_address || customer?.address} fullWidth />
                  <InfoItem label="Landmark" value={customer?.customer_landmark || customer?.landmark || '—'} />
                  <InfoItem label="Village" value={customer?.customer_village || '—'} />
                  <InfoItem label="Taluka" value={customer?.taluka || '—'} />
                  <InfoItem label="District" value={customer?.district || '—'} />
                  <InfoItem label="City" value={customer?.city || customer?.preferredCityName} />
                  <InfoItem label="State" value={customer?.state || 'Gujarat'} />
                  <InfoItem label="Pincode" value={customer?.customer_pincode || customer?.pincode} />
                </View>
              </View>

              {/* SECTION 3: SPONSORSHIP */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>🔗 Section 3: Sponsorship & Team Placement</Text>
                <View style={styles.grid}>
                  <InfoItem
                    label="Sponsor ID"
                    value={customer?.sponsorCode || customer?.sponsor?.referralCode || customer?.sponsorId || 'WORM5871'}
                  />
                  <InfoItem
                    label="Sponsor Name"
                    value={customer?.sponsorName || customer?.sponsor?.name || 'Darshan Thanki'}
                  />
                  <InfoItem
                    label="Referred By Code"
                    value={customer?.customer_refferal_by || customer?.sponsorCode || 'WORM5871'}
                  />
                  <InfoItem
                    label="Joining Date"
                    value={
                      customer?.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString()
                        : '14 Oct 2026'
                    }
                  />
                </View>
              </View>

              {/* SECTION 4: KYC DOCUMENTS */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>📄 Section 4: Aadhaar Card Images</Text>
                <View style={styles.docsRow}>
                  <DocBox
                    title="Aadhaar Front Image"
                    url={customer?.documents?.frontImage || customer?.customer_image_aadhar_front || customer?.aadharFrontImage}
                    onZoom={() =>
                      setZoomImage({
                        url: customer?.documents?.frontImage || customer?.customer_image_aadhar_front || customer?.aadharFrontImage,
                        title: 'Aadhaar Front Image',
                      })
                    }
                  />
                  <DocBox
                    title="Aadhaar Back Image"
                    url={customer?.documents?.backImage || customer?.customer_image_aadhar_back || customer?.aadharBackImage}
                    onZoom={() =>
                      setZoomImage({
                        url: customer?.documents?.backImage || customer?.customer_image_aadhar_back || customer?.aadharBackImage,
                        title: 'Aadhaar Back Image',
                      })
                    }
                  />
                </View>
              </View>

              {/* SECTION 5: BANK DETAILS */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>🏦 Section 5: Bank Details (For Withdrawal Payouts)</Text>
                <View style={styles.grid}>
                  <InfoItem label="Bank Name" value={customer?.bankName || 'Not Linked'} />
                  <InfoItem label="Branch" value={customer?.branchName || 'N/A'} />
                  <InfoItem label="Account Holder" value={customer?.accountHolderName || customer?.name || 'N/A'} />
                  <InfoItem label="Account Number" value={customer?.accountNumber || customer?.maskedAccount || 'N/A'} />
                  <InfoItem label="IFSC Code" value={customer?.ifscCode || 'N/A'} />
                  <InfoItem label="UPI ID" value={customer?.upiId || 'N/A'} />
                </View>
              </View>

              {/* SECTION 6: WALLET SNAPSHOT */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>💰 Section 6: 4-Wallet Balance Snapshot</Text>
                <View style={styles.walletGrid}>
                  <WalletCard
                    title="Shopping Coins"
                    value={`₹${customer?.shoppingCoins ?? 2000}`}
                    color="#F59E0B"
                  />
                  <WalletCard
                    title="Income Wallet"
                    value={`₹${customer?.incomeWalletBalance ?? 0}`}
                    color="#3B82F6"
                  />
                  <WalletCard
                    title="Available Income"
                    value={`₹${customer?.availableIncome ?? 0}`}
                    color="#10B981"
                  />
                  <WalletCard
                    title="Pending Income"
                    value={`₹${customer?.pendingIncome ?? 0}`}
                    color="#8B5CF6"
                  />
                </View>
              </View>

              {/* SECTION 7: CURRENT STATUS */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>🎯 Section 7: Account Status & Controls</Text>
                <View style={styles.grid}>
                  <InfoItem
                    label="Verification"
                    value={customer?.verificationStatus === 'VERIFIED' ? '✅ VERIFIED' : '⏳ PENDING'}
                  />
                  <InfoItem label="Is Blocked" value={customer?.isBlocked ? '🔴 YES' : '🟢 NO'} />
                  <InfoItem label="Is Suspended" value={customer?.isSuspended ? '🔴 YES' : '🟢 NO'} />
                  <InfoItem
                    label="Payment Status"
                    value={customer?.customer_payment_status !== 2 ? '✅ Enabled' : '❌ Disabled'}
                  />
                </View>
              </View>
            </ScrollView>
          )}

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => setIsRejectModalOpen(true)}
              disabled={submitting}
            >
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.rejectBtnText}>Reject with Reason</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.approveBtn}
              onPress={handleApprove}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve & Verify (Unlock Income)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* REJECTION REASON MODAL */}
      {isRejectModalOpen && (
        <Modal transparent animationType="fade" visible={isRejectModalOpen}>
          <View style={styles.innerBackdrop}>
            <View style={styles.rejectCard}>
              <Text style={styles.rejectModalHeading}>❌ Reject Customer KYC</Text>
              <Text style={styles.rejectModalSub}>Select the primary reason for rejection:</Text>

              <ScrollView style={{ maxHeight: 200 }}>
                {CUSTOMER_REJECTION_REASONS.map((reason, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.reasonOption,
                      selectedReason === reason && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        selectedReason === reason && styles.radioCircleActive,
                      ]}
                    />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.notesLabel}>Additional Guidance for Customer:</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Explain why documents were rejected..."
                placeholderTextColor="#64748B"
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                multiline
              />

              <View style={styles.rejectActionRow}>
                <TouchableOpacity
                  style={styles.cancelRejectBtn}
                  onPress={() => setIsRejectModalOpen(false)}
                >
                  <Text style={styles.cancelRejectText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmRejectBtn}
                  onPress={handleRejectConfirm}
                  disabled={submitting}
                >
                  <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ZOOM MODAL */}
      {zoomImage && (
        <Modal transparent visible={!!zoomImage} onRequestClose={() => setZoomImage(null)}>
          <View style={styles.zoomBackdrop}>
            <View style={styles.zoomCard}>
              <View style={styles.zoomHeader}>
                <Text style={styles.zoomTitle}>{zoomImage.title}</Text>
                <TouchableOpacity onPress={() => setZoomImage(null)} style={styles.zoomClose}>
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: zoomImage.url }} style={styles.zoomImg} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const InfoItem: React.FC<{ label: string; value?: string; fullWidth?: boolean }> = ({
  label,
  value,
  fullWidth,
}) => (
  <View style={[styles.infoItem, fullWidth && { width: '100%' }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

const DocBox: React.FC<{ title: string; url?: string; onZoom: () => void }> = ({
  title,
  url,
  onZoom,
}) => (
  <View style={styles.docBox}>
    <Text style={styles.docTitle}>{title}</Text>
    {url ? (
      <TouchableOpacity activeOpacity={0.8} onPress={onZoom} style={styles.docImgWrap}>
        <Image source={{ uri: resolveImageUrl(url) }} style={styles.docImg} resizeMode="cover" />
        <View style={styles.zoomOverlay}>
          <Maximize2 size={14} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    ) : (
      <View style={styles.docEmpty}>
        <AlertCircle size={20} color="#94A3B8" />
        <Text style={styles.docMissingText}>Document Not Uploaded</Text>
      </View>
    )}
  </View>
);

const WalletCard: React.FC<{ title: string; value: string; color: string }> = ({
  title,
  value,
  color,
}) => (
  <View style={[styles.walletCard, { borderColor: color }]}>
    <Text style={styles.walletTitle}>{title}</Text>
    <Text style={[styles.walletValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 850,
    maxHeight: '92%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#090D1A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  loadingBox: {
    padding: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    marginTop: 2,
  },
  docsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  docBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
  },
  docTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  docImgWrap: {
    width: '100%',
    height: 140,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  docImg: {
    width: '100%',
    height: '100%',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
  docEmpty: {
    width: '100%',
    height: 140,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  docMissingText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  walletCard: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
  },
  walletTitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  walletValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#090D1A',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3F1219',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  innerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  rejectCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rejectModalHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F87171',
  },
  rejectModalSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 10,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#1E293B',
  },
  reasonOptionSelected: {
    backgroundColor: '#3F1219',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#64748B',
  },
  radioCircleActive: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  reasonText: {
    fontSize: 12,
    color: '#F8FAFC',
    flex: 1,
  },
  notesLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  notesInput: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    color: '#F8FAFC',
    fontSize: 12,
    height: 60,
    textAlignVertical: 'top',
  },
  rejectActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelRejectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  cancelRejectText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmRejectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  confirmRejectText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  zoomCard: {
    width: '100%',
    maxWidth: 700,
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  zoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#090D1A',
  },
  zoomTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  zoomClose: {
    padding: 4,
  },
  zoomImg: {
    width: '100%',
    height: 480,
    backgroundColor: '#000000',
  },
});
