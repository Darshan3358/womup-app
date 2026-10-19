import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ShieldAlert,
  Store,
  MapPin,
  FileCheck2,
  Building2,
  CreditCard,
  RefreshCw,
  LogOut,
  Ban,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Eye,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';

export const VendorStatusScreen: React.FC<{ onResubmit?: () => void }> = ({ onResubmit }) => {
  const { vendor, logout, refreshData } = useVendor();
  const [checking, setChecking] = useState(false);

  const isBlocked = vendor?.isBlocked === 1;
  const isSuspended = vendor?.isSuspended === 1;
  const isRejected = vendor?.vendorStatus === 3;
  const isPending = vendor?.vendorStatus === 1 || (!vendor?.isVerified && !isRejected && !isBlocked);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      await refreshData();
      Alert.alert(
        'Status Checked',
        vendor?.isVerified
          ? '🎉 Congratulations! Your account has been approved by Admin.'
          : 'Your application is still under review by WormUp Admin. Please check back shortly.'
      );
    } catch {
      Alert.alert('Status', 'Could not refresh at this moment. Please check your network.');
    } finally {
      setChecking(false);
    }
  };

  // Mask bank account number for privacy (show last 4 digits)
  const rawAcct = String(vendor?.accountNumber || vendor?.bankAccount?.accountNumber || '');
  const maskedAcct = rawAcct.length > 4 ? `•••• •••• ${rawAcct.slice(-4)}` : rawAcct || '—';

  // Count uploaded docs
  const uploadedDocsList = [
    { label: 'Aadhaar Front', isUploaded: Boolean(vendor?.vendorAadharFrontImage) },
    { label: 'Aadhaar Back', isUploaded: Boolean(vendor?.vendorAadharBackImage) },
    { label: 'PAN Card', isUploaded: Boolean(vendor?.panCardImage) },
    { label: 'GST Certificate', isUploaded: Boolean(vendor?.gstCertificateImage) },
    { label: 'Trade License', isUploaded: Boolean(vendor?.tradeLicenseImage) },
    { label: 'Cancelled Cheque', isUploaded: Boolean(vendor?.cancelledChequeImage) },
    { label: 'Shop Front Photo', isUploaded: Boolean(vendor?.shopPhotoImage) },
    { label: 'Owner Photo', isUploaded: Boolean(vendor?.ownerPhotoImage) },
  ];
  const uploadedCount = uploadedDocsList.filter((d) => d.isUploaded).length;

  return (
    <LinearGradient colors={['#090D1A', '#0F172A', '#1E293B']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Status Card */}
        <View style={styles.statusCard}>
          {isBlocked ? (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' }]}>
              <AlertOctagon size={48} color="#EF4444" />
            </View>
          ) : isSuspended ? (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }]}>
              <ShieldAlert size={48} color="#F59E0B" />
            </View>
          ) : isRejected ? (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' }]}>
              <XCircle size={48} color="#EF4444" />
            </View>
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.2)', borderColor: '#F97316' }]}>
              <Lock size={48} color="#F97316" />
            </View>
          )}

          <Text style={styles.storeTitle}>
            {vendor?.vendorFirmName || vendor?.storeName || 'Vendor Partner'}
          </Text>
          <Text style={styles.vendorCode}>VENDOR ID: {vendor?.vendorCode || 'VND...'}</Text>

          {/* Main Status Header & Message */}
          {isBlocked ? (
            <View style={[styles.badgeBox, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
              <Text style={[styles.badgeTitle, { color: '#EF4444' }]}>ACCOUNT BLOCKED</Text>
              <Text style={styles.badgeDesc}>
                {vendor?.blockReason || 'Your vendor account has been blocked by WormUp Administration for policy violation.'}
              </Text>
            </View>
          ) : isSuspended ? (
            <View style={[styles.badgeBox, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
              <Text style={[styles.badgeTitle, { color: '#F59E0B' }]}>ACCOUNT SUSPENDED</Text>
              <Text style={styles.badgeDesc}>
                {vendor?.blockReason || 'Your merchant terminal is temporarily suspended. You cannot accept customer payments.'}
              </Text>
            </View>
          ) : isRejected ? (
            <View style={[styles.badgeBox, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
              <Text style={[styles.badgeTitle, { color: '#EF4444' }]}>APPLICATION REJECTED</Text>
              <Text style={styles.badgeDesc}>
                Reason: {vendor?.vendorRejectReason || 'Submitted documentation was incomplete or could not be verified by Admin.'}
              </Text>
            </View>
          ) : (
            <View style={[styles.badgeBox, { borderColor: 'rgba(249, 115, 22, 0.4)' }]}>
              <View style={styles.pillRow}>
                <View style={styles.orangePulseDot} />
                <Text style={styles.pillText}>ADMIN APPROVAL PENDING</Text>
              </View>
              <Text style={[styles.badgeTitle, { color: '#FB923C', marginTop: 6 }]}>
                Account Under Verification
              </Text>
              <Text style={styles.badgeDesc}>
                Your application has been submitted to WormUp Admin. For compliance and security, merchant operations remain locked until verification is approved (usually within 24 hours).
              </Text>
            </View>
          )}

          {/* 🔒 LOCKED OPERATIONAL FEATURES (GREYED OUT & DISABLED) */}
          {isPending && (
            <View style={styles.lockedFeaturesBox}>
              <View style={styles.lockedFeaturesHeader}>
                <Lock size={14} color="#F97316" />
                <Text style={styles.lockedFeaturesTitle}>LOCKED OPERATIONAL FEATURES</Text>
              </View>

              <View style={styles.lockedFeatureItem}>
                <View style={styles.lockedItemLeft}>
                  <Ban size={15} color="#94A3B8" />
                  <Text style={styles.lockedItemLabel}>Go Online / Counter QR</Text>
                </View>
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>🔒 Locked</Text>
                </View>
              </View>

              <View style={styles.lockedFeatureItem}>
                <View style={styles.lockedItemLeft}>
                  <Ban size={15} color="#94A3B8" />
                  <Text style={styles.lockedItemLabel}>Accept Orders & Payments</Text>
                </View>
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>🔒 Disabled</Text>
                </View>
              </View>

              <View style={styles.lockedFeatureItem}>
                <View style={styles.lockedItemLeft}>
                  <Ban size={15} color="#94A3B8" />
                  <Text style={styles.lockedItemLabel}>Inventory & Catalog Edit</Text>
                </View>
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>🔒 Read Only</Text>
                </View>
              </View>

              <Text style={styles.lockedHelpText}>
                ⚡ All features will automatically unlock the moment Admin approves your profile.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            {isRejected && onResubmit && (
              <TouchableOpacity style={styles.primaryBtn} onPress={onResubmit}>
                <RefreshCw size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Resubmit Documents</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.checkStatusBtn}
              onPress={handleManualCheck}
              disabled={checking}
              activeOpacity={0.85}
            >
              {checking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <RefreshCw size={18} color="#FFFFFF" />
                  <Text style={styles.checkStatusBtnText}>Check Approval Status</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => logout()}>
              <LogOut size={16} color="#94A3B8" />
              <Text style={styles.outlineBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* READ-ONLY SUBMITTED DETAILS SECTION */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsSectionHeading}>📋 Submitted Profile & Documents</Text>
          <Text style={styles.detailsSectionSub}>
            Review the details submitted for Admin verification. These are locked in read-only mode.
          </Text>

          {/* Section 1: Basic Info */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Store size={16} color="#38BDF8" />
              <Text style={styles.cardTitle}>Basic Store Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Store Name:</Text>
              <Text style={styles.infoVal}>{vendor?.vendorFirmName || vendor?.storeName || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Owner Name:</Text>
              <Text style={styles.infoVal}>{vendor?.vendorOwnerName || vendor?.ownerName || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Category:</Text>
              <Text style={styles.infoVal}>{vendor?.categoryName || vendor?.businessType || 'General Store'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Mobile (Login):</Text>
              <Text style={styles.infoVal}>{vendor?.ownerPhone || vendor?.vendorMobile || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Email:</Text>
              <Text style={styles.infoVal}>{vendor?.vendorEmail || '—'}</Text>
            </View>
          </View>

          {/* Section 2: Location */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <MapPin size={16} color="#38BDF8" />
              <Text style={styles.cardTitle}>Business Location & Pin</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Full Address:</Text>
              <Text style={[styles.infoVal, { flex: 1 }]}>
                {vendor?.address || vendor?.businessAddress || '—'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Landmark / City:</Text>
              <Text style={styles.infoVal}>
                {[vendor?.businessLandmark, vendor?.city].filter(Boolean).join(', ') || '—'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Pincode & State:</Text>
              <Text style={styles.infoVal}>
                {[vendor?.pincode || vendor?.businessPincode, vendor?.stateId || 'Gujarat'].filter(Boolean).join(', ')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>GPS Coordinates:</Text>
              <Text style={[styles.infoVal, { color: '#38BDF8' }]}>
                {vendor?.latitude || vendor?.vendorLat || vendor?.location?.coordinates?.[1] || 0}, {vendor?.longitude || vendor?.vendorLong || vendor?.location?.coordinates?.[0] || 0}
              </Text>
            </View>
          </View>

          {/* Section 3: KYC Documents Verification */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <FileCheck2 size={16} color="#38BDF8" />
              <Text style={styles.cardTitle}>KYC Documents ({uploadedCount} Uploaded)</Text>
            </View>
            <View style={styles.docsList}>
              {uploadedDocsList.map((doc, idx) => (
                <View key={idx} style={styles.docItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {doc.isUploaded ? (
                      <CheckCircle2 size={15} color="#10B981" />
                    ) : (
                      <AlertCircle size={15} color="#64748B" />
                    )}
                    <Text style={[styles.docItemName, !doc.isUploaded && { color: '#64748B' }]}>
                      {doc.label}
                    </Text>
                  </View>
                  <Text style={[styles.docItemStatus, { color: doc.isUploaded ? '#10B981' : '#64748B' }]}>
                    {doc.isUploaded ? 'Uploaded ✓' : 'Not Provided'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section 4: Bank Details */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <CreditCard size={16} color="#38BDF8" />
              <Text style={styles.cardTitle}>Bank Details & Payouts</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Bank Name:</Text>
              <Text style={styles.infoVal}>{vendor?.bankName || 'HDFC Bank'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Account Number:</Text>
              <Text style={styles.infoVal}>{maskedAcct}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>IFSC Code:</Text>
              <Text style={styles.infoVal}>{vendor?.ifscCode || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>UPI ID:</Text>
              <Text style={styles.infoVal}>{vendor?.upiId || '—'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  statusCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  storeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  vendorCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
    letterSpacing: 1,
  },
  badgeBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  orangePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 0.6,
  },
  badgeTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  badgeDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
  },
  lockedFeaturesBox: {
    marginTop: 20,
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  lockedFeaturesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  lockedFeaturesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 0.8,
  },
  lockedFeatureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  lockedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedItemLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  lockedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  lockedBadgeText: {
    fontSize: 11,
    color: '#F87171',
    fontWeight: '700',
  },
  lockedHelpText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 15,
  },
  btnRow: {
    marginTop: 20,
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: COLORS.rose,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  checkStatusBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkStatusBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  outlineBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 13,
  },
  detailsContainer: {
    width: '100%',
    maxWidth: 600,
    marginTop: 24,
    gap: 14,
  },
  detailsSectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  detailsSectionSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: -8,
    marginBottom: 4,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  infoKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    width: '38%',
  },
  infoVal: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    textAlign: 'right',
  },
  docsList: {
    gap: 8,
  },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  docItemName: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  docItemStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
});
