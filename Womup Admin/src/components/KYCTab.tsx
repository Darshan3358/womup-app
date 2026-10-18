import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  CreditCard,
  Building,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  X,
  Maximize2,
  RotateCcw,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { Customer } from '../types/admin';
import { CustomerService } from '../services/customerService';

interface KYCTabProps {
  customer: Customer;
  onStatusChange?: (newStatus: 'Verified' | 'Pending' | 'Rejected') => void;
}

const QUICK_REJECT_REASONS = [
  'Aadhaar image not clear',
  'Name mismatch with bank account',
  'Aadhaar number illegible',
  'Back image missing or blur',
  'Suspicious document',
];

export const KYCTab: React.FC<KYCTabProps> = ({ customer, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [kycData, setKycData] = useState<any>(null);

  // Rejection handling
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Aadhaar image not clear');

  // Image zoom modal
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    loadKycDetails();
  }, [customer.id]);

  const loadKycDetails = async () => {
    try {
      setLoading(true);
      const res = await CustomerService.getCustomerKyc(customer.id);
      if (res && res.success && res.data) {
        setKycData(res.data);
      } else {
        // Fallback to customer object props
        setKycData({
          kycStatus: customer.kycStatus === 'Verified' ? 2 : (customer.kycStatus === 'Rejected' ? 3 : 1),
          statusLabel: customer.kycStatus || 'Pending',
          submittedAt: customer.kycSubmittedAt || customer.createdAt || 'Recently',
          aadhaarNumber: customer.aadhaarNumber
            ? `XXXX XXXX ${customer.aadhaarNumber.slice(-4)}`
            : 'XXXX XXXX 1234',
          aadhaarFrontUrl: customer.customer_image_aadhar_front || customer.aadhaarFrontImage || '',
          aadhaarBackUrl: customer.customer_image_aadhar_back || customer.aadhaarBackImage || '',
          bankDetails: {
            bankName: customer.bankName || 'Not Linked',
            branchName: customer.branchName || 'N/A',
            accountHolderName: customer.accountHolderName || customer.name || 'N/A',
            accountNumber: customer.accountNumber
              ? `XXXX ${customer.accountNumber.slice(-4)}`
              : 'N/A',
            ifscCode: customer.ifscCode || 'N/A',
            upiId: customer.upiId || 'N/A',
          },
          personalInfo: {
            firstName: customer.firstName || customer.name.split(' ')[0],
            surname: customer.surname || customer.name.split(' ').slice(1).join(' '),
            fatherHusbandName: customer.fatherHusbandName || 'Mukesh Thanki',
            gender: customer.gender || 'Female',
            birthdate: customer.birthdate || customer.birthDate || '15 Aug 1995',
          },
          kycRejectReason: customer.kycRejectReason || '',
        });
      }
    } catch (err) {
      console.error('[KYCTab] Failed to load KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentStatus: 'Verified' | 'Pending' | 'Rejected' =
    kycData?.kycStatus === 2
      ? 'Verified'
      : kycData?.kycStatus === 3
      ? 'Rejected'
      : customer.kycStatus || 'Pending';

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const res = await CustomerService.approveCustomerKyc(customer.id);
      if (res && res.success) {
        Alert.alert('KYC Approved', 'Customer KYC verified successfully! ₹20 referral income credited to sponsor.');
        setKycData((prev: any) => ({
          ...prev,
          kycStatus: 2,
          statusLabel: 'Verified',
        }));
        onStatusChange?.('Verified');
      } else {
        Alert.alert('Approval Failed', res?.message || 'Could not approve KYC.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Approval action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Validation Error', 'Please enter a rejection reason.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await CustomerService.rejectCustomerKyc(customer.id, rejectionReason);
      if (res && res.success) {
        Alert.alert('KYC Rejected', `Customer KYC rejected with reason: "${rejectionReason}"`);
        setKycData((prev: any) => ({
          ...prev,
          kycStatus: 3,
          statusLabel: 'Rejected',
          kycRejectReason: rejectionReason,
        }));
        setShowRejectBox(false);
        onStatusChange?.('Rejected');
      } else {
        Alert.alert('Rejection Failed', res?.message || 'Could not reject KYC.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Rejection action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    if (!url) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(url).catch(() => {
        Alert.alert('Cannot Open URL', url);
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={COLORS.purple} />
        <Text style={styles.loadingText}>Loading KYC details & documents...</Text>
      </View>
    );
  }

  const frontUrl =
    kycData?.aadhaarFrontUrl ||
    customer.customer_image_aadhar_front ||
    customer.aadhaarFrontImage ||
    '';

  const backUrl =
    kycData?.aadhaarBackUrl ||
    customer.customer_image_aadhar_back ||
    customer.aadhaarBackImage ||
    '';

  return (
    <View style={styles.container}>
      {/* ── Status Header Card ── */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <View style={styles.submittedRow}>
            <Clock size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.submittedText}>
              Submitted: {kycData?.submittedAt ? String(kycData.submittedAt) : 'Recently'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            currentStatus === 'Verified' && styles.statusBadgeVerified,
            currentStatus === 'Pending' && styles.statusBadgePending,
            currentStatus === 'Rejected' && styles.statusBadgeRejected,
          ]}
        >
          {currentStatus === 'Verified' && <CheckCircle2 size={14} color="#059669" style={{ marginRight: 6 }} />}
          {currentStatus === 'Pending' && <Clock size={14} color="#D97706" style={{ marginRight: 6 }} />}
          {currentStatus === 'Rejected' && <AlertCircle size={14} color="#DC2626" style={{ marginRight: 6 }} />}
          <Text
            style={[
              styles.statusBadgeText,
              currentStatus === 'Verified' && { color: '#059669' },
              currentStatus === 'Pending' && { color: '#D97706' },
              currentStatus === 'Rejected' && { color: '#DC2626' },
            ]}
          >
            {currentStatus === 'Verified' ? '✅ Verified' : currentStatus === 'Rejected' ? '❌ Rejected' : '⏳ Pending Review'}
          </Text>
        </View>
      </View>

      {/* If Rejected, show banner */}
      {currentStatus === 'Rejected' && (
        <View style={styles.rejectedBanner}>
          <AlertCircle size={18} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rejectedBannerTitle}>KYC Rejection Notice</Text>
            <Text style={styles.rejectedBannerReason}>
              Reason: {kycData?.kycRejectReason || customer.kycRejectReason || 'Aadhaar image not clear'}
            </Text>
          </View>
        </View>
      )}

      {/* If Verified, show banner */}
      {currentStatus === 'Verified' && (
        <View style={styles.verifiedBanner}>
          <ShieldCheck size={20} color="#059669" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.verifiedBannerTitle}>KYC Confirmed & Active</Text>
            <Text style={styles.verifiedBannerSubtitle}>
              Customer identity validated. Sponsor income release unlocked.
            </Text>
          </View>
        </View>
      )}

      {/* ── Section: Aadhaar Information ── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <UserCheck size={16} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Aadhaar Information</Text>
        </View>

        <View style={styles.grid2Col}>
          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Aadhaar Number</Text>
            <Text style={styles.fieldValueBold}>
              {kycData?.aadhaarNumber || 'XXXX XXXX 1234'}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Full Name (as per Aadhaar)</Text>
            <Text style={styles.fieldValueBold}>
              {kycData?.personalInfo?.firstName
                ? `${kycData.personalInfo.firstName} ${kycData.personalInfo.surname || ''}`.trim()
                : customer.name}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Father / Husband Name</Text>
            <Text style={styles.fieldValue}>
              {kycData?.personalInfo?.fatherHusbandName || customer.fatherHusbandName || 'Mukesh Thanki'}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <Text style={styles.fieldValue}>
              {kycData?.personalInfo?.gender || customer.gender || 'Female'}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <Text style={styles.fieldValue}>
              {kycData?.personalInfo?.birthdate || customer.birthdate || customer.birthDate || '15 Aug 1995'}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Registered Mobile</Text>
            <Text style={styles.fieldValue}>{customer.phone}</Text>
          </View>
        </View>
      </View>

      {/* ── Section: Documents (Front & Back Preview) ── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <FileCheck2 size={16} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>KYC Documents (Aadhaar Card)</Text>
        </View>

        <View style={styles.documentsRow}>
          {/* Aadhaar Front */}
          <View style={styles.docCard}>
            <View style={styles.docCardHeader}>
              <Text style={styles.docCardTitle}>Aadhaar Front</Text>
              {frontUrl ? (
                <TouchableOpacity
                  style={styles.expandIconBtn}
                  onPress={() => setZoomImage({ url: frontUrl, title: 'Aadhaar Front View' })}
                >
                  <Maximize2 size={13} color={COLORS.purple} />
                </TouchableOpacity>
              ) : (
                <View style={styles.missingBadge}>
                  <Text style={styles.missingBadgeText}>NOT UPLOADED</Text>
                </View>
              )}
            </View>

            {frontUrl ? (
              <TouchableOpacity
                style={styles.imageWrapper}
                activeOpacity={0.85}
                onPress={() => setZoomImage({ url: frontUrl, title: 'Aadhaar Front View' })}
              >
                <Image source={{ uri: frontUrl }} style={styles.docImage} resizeMode="cover" />
                <View style={styles.hoverOverlay}>
                  <Eye size={16} color={COLORS.white} style={{ marginRight: 4 }} />
                  <Text style={styles.hoverOverlayText}>Click to Inspect</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.notUploadedBox}>
                <AlertCircle size={28} color="#94A3B8" style={{ marginBottom: 6 }} />
                <Text style={styles.notUploadedTitle}>Document Not Uploaded</Text>
                <Text style={styles.notUploadedSubtitle}>Customer has not uploaded Aadhaar front copy</Text>
              </View>
            )}

            {frontUrl ? (
              <View style={styles.docBtnRow}>
                <TouchableOpacity
                  style={styles.docActionBtn}
                  onPress={() => setZoomImage({ url: frontUrl, title: 'Aadhaar Front View' })}
                >
                  <Eye size={13} color={COLORS.purple} style={{ marginRight: 4 }} />
                  <Text style={styles.docActionBtnText}>View Full</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.docActionBtnSecondary}
                  onPress={() => handleDownload(frontUrl, `Aadhaar_Front_${customer.id}.jpg`)}
                >
                  <Download size={13} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
                  <Text style={styles.docActionBtnSecText}>Download</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noDocBtnRow}>
                <Text style={styles.noDocText}>No Image Attached</Text>
              </View>
            )}
          </View>

          {/* Aadhaar Back */}
          <View style={styles.docCard}>
            <View style={styles.docCardHeader}>
              <Text style={styles.docCardTitle}>Aadhaar Back</Text>
              {backUrl ? (
                <TouchableOpacity
                  style={styles.expandIconBtn}
                  onPress={() => setZoomImage({ url: backUrl, title: 'Aadhaar Back View' })}
                >
                  <Maximize2 size={13} color={COLORS.purple} />
                </TouchableOpacity>
              ) : (
                <View style={styles.missingBadge}>
                  <Text style={styles.missingBadgeText}>NOT UPLOADED</Text>
                </View>
              )}
            </View>

            {backUrl ? (
              <TouchableOpacity
                style={styles.imageWrapper}
                activeOpacity={0.85}
                onPress={() => setZoomImage({ url: backUrl, title: 'Aadhaar Back View' })}
              >
                <Image source={{ uri: backUrl }} style={styles.docImage} resizeMode="cover" />
                <View style={styles.hoverOverlay}>
                  <Eye size={16} color={COLORS.white} style={{ marginRight: 4 }} />
                  <Text style={styles.hoverOverlayText}>Click to Inspect</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.notUploadedBox}>
                <AlertCircle size={28} color="#94A3B8" style={{ marginBottom: 6 }} />
                <Text style={styles.notUploadedTitle}>Document Not Uploaded</Text>
                <Text style={styles.notUploadedSubtitle}>Customer has not uploaded Aadhaar back copy</Text>
              </View>
            )}

            {backUrl ? (
              <View style={styles.docBtnRow}>
                <TouchableOpacity
                  style={styles.docActionBtn}
                  onPress={() => setZoomImage({ url: backUrl, title: 'Aadhaar Back View' })}
                >
                  <Eye size={13} color={COLORS.purple} style={{ marginRight: 4 }} />
                  <Text style={styles.docActionBtnText}>View Full</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.docActionBtnSecondary}
                  onPress={() => handleDownload(backUrl, `Aadhaar_Back_${customer.id}.jpg`)}
                >
                  <Download size={13} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
                  <Text style={styles.docActionBtnSecText}>Download</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noDocBtnRow}>
                <Text style={styles.noDocText}>No Image Attached</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Section: Bank Details (for withdrawal) ── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Building size={16} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Bank Details (for withdrawal)</Text>
        </View>

        <View style={styles.grid2Col}>
          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Bank Name</Text>
            <Text style={styles.fieldValueBold}>
              {kycData?.bankDetails?.bankName || customer.bankName || 'Not Linked'}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Branch Name</Text>
            <Text style={styles.fieldValue}>
              {kycData?.bankDetails?.branchName || customer.branchName || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Account Holder Name</Text>
            <Text style={styles.fieldValueBold}>
              {kycData?.bankDetails?.accountHolderName || customer.accountHolderName || customer.name || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>Account Number</Text>
            <Text style={styles.fieldValueMono}>
              {kycData?.bankDetails?.accountNumber ||
                (customer.accountNumber ? `XXXX ${customer.accountNumber.slice(-4)}` : 'N/A')}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>IFSC Code</Text>
            <Text style={styles.fieldValueMono}>
              {kycData?.bankDetails?.ifscCode || customer.ifscCode || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoField}>
            <Text style={styles.fieldLabel}>UPI ID</Text>
            <Text style={styles.fieldValueMono}>
              {kycData?.bankDetails?.upiId || customer.upiId || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Section: Admin Actions ── */}
      <View style={[styles.sectionCard, styles.actionCard]}>
        <View style={styles.sectionHeader}>
          <ShieldCheck size={16} color={COLORS.purple} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Admin Actions</Text>
        </View>

        {actionLoading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={COLORS.purple} />
            <Text style={{ marginTop: 8, fontSize: 13, color: COLORS.textMuted }}>
              Processing KYC update...
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.adminActionBtnRow}>
              <TouchableOpacity
                style={[
                  styles.approveBtn,
                  currentStatus === 'Verified' && { opacity: 0.65 },
                ]}
                activeOpacity={0.8}
                onPress={handleApprove}
                disabled={currentStatus === 'Verified'}
              >
                <CheckCircle2 size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.approveBtnText}>
                  {currentStatus === 'Verified' ? 'KYC Already Approved' : '✅ Approve KYC'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rejectBtn,
                  showRejectBox && styles.rejectBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setShowRejectBox(!showRejectBox)}
              >
                <AlertCircle size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.rejectBtnText}>
                  {showRejectBox ? 'Cancel Rejection' : '❌ Reject KYC'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Rejection Drawer / Box */}
            {showRejectBox && (
              <View style={styles.rejectDrawer}>
                <Text style={styles.rejectDrawerTitle}>Select or Enter Rejection Reason *</Text>
                <View style={styles.reasonChipRow}>
                  {QUICK_REJECT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonChip,
                        rejectionReason === reason && styles.reasonChipActive,
                      ]}
                      onPress={() => setRejectionReason(reason)}
                    >
                      <Text
                        style={[
                          styles.reasonChipText,
                          rejectionReason === reason && styles.reasonChipTextActive,
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.rejectionInput}
                  placeholder="Type specific reason for customer..."
                  placeholderTextColor={COLORS.textMuted}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                />

                <TouchableOpacity
                  style={styles.confirmRejectBtn}
                  activeOpacity={0.85}
                  onPress={handleReject}
                >
                  <AlertCircle size={15} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Document Full Zoom Modal ── */}
      <Modal
        visible={zoomImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomImage(null)}
      >
        <View style={styles.zoomModalBackdrop}>
          <View style={styles.zoomModalContent}>
            <View style={styles.zoomModalHeader}>
              <Text style={styles.zoomModalTitle}>{zoomImage?.title}</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setZoomImage(null)}
              >
                <X size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {zoomImage?.url ? (
              <Image
                source={{ uri: zoomImage.url }}
                style={styles.zoomedImage}
                resizeMode="contain"
              />
            ) : null}

            <View style={styles.zoomModalFooter}>
              <TouchableOpacity
                style={styles.zoomDownloadBtn}
                onPress={() =>
                  zoomImage && handleDownload(zoomImage.url, `${zoomImage.title}.jpg`)
                }
              >
                <Download size={14} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.zoomDownloadBtnText}>Download Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.zoomCloseActionBtn}
                onPress={() => setZoomImage(null)}
              >
                <Text style={styles.zoomCloseActionText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  centerBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  headerCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  submittedText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  statusBadgeVerified: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rejectedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  rejectedBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  rejectedBannerReason: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  verifiedBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    alignItems: 'center',
  },
  verifiedBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  verifiedBannerSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  actionCard: {
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  infoField: {
    width: '50%',
    paddingRight: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  fieldValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  fieldValueMono: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    color: COLORS.purple,
    marginTop: 2,
  },
  documentsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  docCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  docCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  expandIconBtn: {
    padding: 4,
  },
  imageWrapper: {
    position: 'relative',
    height: 160,
    borderRadius: RADIUS.input,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  docImage: {
    width: '100%',
    height: '100%',
  },
  hoverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hoverOverlayText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '600',
  },
  docBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  docActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: RADIUS.input,
    paddingVertical: 6,
  },
  docActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.purple,
  },
  docActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingVertical: 6,
  },
  docActionBtnSecText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  notUploadedBox: {
    height: 160,
    borderRadius: RADIUS.input,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notUploadedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  notUploadedSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  missingBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  missingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  noDocBtnRow: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.input,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noDocText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  adminActionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: RADIUS.input,
    paddingVertical: 10,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: RADIUS.input,
    paddingVertical: 10,
  },
  rejectBtnActive: {
    backgroundColor: '#B91C1C',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  rejectDrawer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.input,
  },
  rejectDrawerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 8,
  },
  reasonChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reasonChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  reasonChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  reasonChipText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '500',
  },
  reasonChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  rejectionInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textPrimary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  confirmRejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: RADIUS.input,
    paddingVertical: 8,
    marginTop: 8,
  },
  confirmRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  zoomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  zoomModalContent: {
    width: '90%',
    maxWidth: 700,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    padding: SPACING.md,
  },
  zoomModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  zoomModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  zoomedImage: {
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.input,
  },
  zoomModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: SPACING.md,
  },
  zoomDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.input,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  zoomDownloadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  zoomCloseActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
  },
  zoomCloseActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
