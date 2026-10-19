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
  Platform,
  Linking,
} from 'react-native';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Store,
  MapPin,
  FileCheck2,
  Building2,
  Percent,
  Shield,
  Eye,
  Maximize2,
  ExternalLink,
} from 'lucide-react-native';
import { ApiService } from '../../services/api';
import { resolveImageUrl } from '../../utils/imageUrl';

interface VendorKycReviewModalProps {
  isOpen: boolean;
  vendorId: string | null;
  onClose: () => void;
  onApproved?: () => void;
  onRejected?: () => void;
}

const REJECTION_REASONS = [
  'Aadhaar image not clear or unreadable',
  'PAN card invalid or name mismatch',
  'GST certificate expired or invalid',
  'Trade license missing or unverified',
  'Shop photo does not match registered address',
  'Bank account details or IFSC incorrect',
  'Firm name mismatch between documents',
  'Other (specify in additional notes)',
];

export const VendorKycReviewModal: React.FC<VendorKycReviewModalProps> = ({
  isOpen,
  vendorId,
  onClose,
  onApproved,
  onRejected,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendor, setVendor] = useState<any>(null);

  // Editable commission rates
  const [shoppingCoinPercent, setShoppingCoinPercent] = useState('18');
  const [platformCommissionPercent, setPlatformCommissionPercent] = useState('2');

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Fullscreen document zoom
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (isOpen && vendorId) {
      loadReviewData();
    }
  }, [isOpen, vendorId]);

  const loadReviewData = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const res = await ApiService.getVendorKycReview(vendorId);
      if (res.success && res.data) {
        setVendor(res.data);
        setShoppingCoinPercent(String(res.data.shoppingCoinPercent || 18));
        setPlatformCommissionPercent(String(res.data.platformCommissionPercent || 2));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed loading vendor review');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!vendorId) return;
    setSubmitting(true);
    try {
      const res = await ApiService.approveVendorKyc(vendorId, {
        shoppingCoinPercent: Number(shoppingCoinPercent),
        platformCommissionPercent: Number(platformCommissionPercent),
      });
      if (res.success) {
        Alert.alert('Approved', 'Vendor KYC approved successfully! QR code generated and vendor activated.');
        onApproved?.();
        onClose();
      } else {
        Alert.alert('Failed', res.message || 'Failed approving vendor');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error executing approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!vendorId) return;
    const finalReason = additionalNotes.trim()
      ? `${selectedReason} - ${additionalNotes.trim()}`
      : selectedReason;

    setSubmitting(true);
    try {
      const res = await ApiService.rejectVendorKyc(vendorId, finalReason);
      if (res.success) {
        Alert.alert('Rejected', `Vendor application rejected: ${finalReason}`);
        setIsRejectModalOpen(false);
        onRejected?.();
        onClose();
      } else {
        Alert.alert('Failed', res.message || 'Failed rejecting vendor');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error rejecting vendor');
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
              <Store size={22} color="#3B82F6" />
              <View>
                <Text style={styles.headerTitle}>
                  {vendor?.storeName || vendor?.vendorFirmName || 'Vendor KYC Review'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  Code: {vendor?.vendorCode || 'Pending'} • Status:{' '}
                  {vendor?.vendorStatus === 2 ? 'ACTIVE' : vendor?.vendorStatus === 3 ? 'REJECTED' : 'PENDING REVIEW'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Fetching 9-document verification profile...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* SECTION 1: BASIC INFO */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>📋 Section 1: Basic Information</Text>
                <View style={styles.grid}>
                  <InfoItem label="Firm Name" value={vendor?.storeName || vendor?.vendorFirmName} />
                  <InfoItem label="Owner Name" value={vendor?.vendorOwnerName || vendor?.ownerName} />
                  <InfoItem label="Business Type" value={vendor?.categoryName || vendor?.businessType} />
                  <InfoItem label="Mobile" value={vendor?.ownerPhone || vendor?.vendorMobile} />
                  <InfoItem label="Alt Mobile" value={vendor?.vendorAlternateMobile || '—'} />
                  <InfoItem label="Email" value={vendor?.vendorEmail || '—'} />
                  <InfoItem
                    label="Owner Aadhaar"
                    value={
                      vendor?.vendorAadharNo
                        ? `XXXX XXXX ${String(vendor.vendorAadharNo).slice(-4)}`
                        : '—'
                    }
                  />
                  <InfoItem label="Vendor Code" value={vendor?.vendorCode || 'VND-AUTO'} />
                </View>
              </View>

              {/* SECTION 2: LOCATION */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>📍 Section 2: Location & Address</Text>
                <View style={styles.grid}>
                  <InfoItem label="Address" value={vendor?.address || vendor?.businessAddress} fullWidth />
                  <InfoItem label="Landmark" value={vendor?.landmark || vendor?.businessLandmark || '—'} />
                  <InfoItem label="City" value={vendor?.city} />
                  <InfoItem label="Taluka" value={vendor?.taluka || '—'} />
                  <InfoItem label="District" value={vendor?.district || '—'} />
                  <InfoItem label="State" value={vendor?.state || 'Gujarat'} />
                  <InfoItem label="Pincode" value={vendor?.pincode || vendor?.businessPincode} />
                  <InfoItem
                    label="Coordinates"
                    value={`${vendor?.latitude || vendor?.vendorLat || vendor?.location?.coordinates?.[1] || 0}, ${vendor?.longitude || vendor?.vendorLong || vendor?.location?.coordinates?.[0] || 0}`}
                  />
                </View>

                {/* Live OpenStreetMap Leaflet Snapshot with Pin */}
                {(() => {
                  const lat = Number(vendor?.latitude || vendor?.vendorLat || vendor?.location?.coordinates?.[1] || 23.127981);
                  const lng = Number(vendor?.longitude || vendor?.vendorLong || vendor?.location?.coordinates?.[0] || 72.548466);
                  const storeTitle = String(vendor?.storeName || vendor?.vendorFirmName || 'Vendor Shop').replace(/"/g, '');
                  const storeAddr = String(vendor?.address || vendor?.businessAddress || '').replace(/"/g, '');

                  return (
                    <View style={styles.mapCard}>
                      <View style={styles.mapHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={15} color="#EF4444" />
                          <Text style={styles.mapLabel}>Pinned Shop Coordinates ({lat.toFixed(6)}, {lng.toFixed(6)})</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.openExternalBtn}
                          onPress={() => Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`)}
                        >
                          <ExternalLink size={12} color="#38BDF8" />
                          <Text style={styles.openExternalText}>Open in Google Maps</Text>
                        </TouchableOpacity>
                      </View>

                      {Platform.OS === 'web' ? (
                        <iframe
                          title="Vendor Shop Location"
                          srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0F172A; }
    .leaflet-popup-content-wrapper { background: #1E293B; color: #F8FAFC; border-radius: 8px; }
    .leaflet-popup-tip { background: #1E293B; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${lat}, ${lng}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    var marker = L.marker([${lat}, ${lng}]).addTo(map);
    marker.bindPopup("<b>${storeTitle}</b><br/>${storeAddr}").openPopup();
  </script>
</body>
</html>`}
                          style={{
                            width: '100%',
                            height: 220,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 10,
                          }}
                        />
                      ) : (
                        <View style={styles.mapFallbackBox}>
                          <MapPin size={24} color="#EF4444" />
                          <Text style={styles.mapFallbackText}>
                            GPS Pinned Location: {lat.toFixed(6)}, {lng.toFixed(6)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>

              {/* SECTION 3: 9 KYC DOCUMENTS */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>📄 Section 3: KYC Documents Verification</Text>
                  <Text style={styles.badgeCount}>
                    {vendor?.uploadedDocsCount || 0} / 9 Uploaded
                  </Text>
                </View>

                <View style={styles.docsGrid}>
                  <DocThumbnail
                    title="Aadhaar Front"
                    url={
                      vendor?.vendorAadharFrontImage ||
                      vendor?.vendor_aadhar_front_image ||
                      vendor?.aadharFrontImage ||
                      vendor?.aadhaarFrontUrl ||
                      vendor?.aadhaarFront
                    }
                    onZoom={() =>
                      setZoomImage({
                        url:
                          vendor?.vendorAadharFrontImage ||
                          vendor?.vendor_aadhar_front_image ||
                          vendor?.aadharFrontImage ||
                          vendor?.aadhaarFrontUrl ||
                          vendor?.aadhaarFront,
                        title: 'Aadhaar Front',
                      })
                    }
                  />
                  <DocThumbnail
                    title="Aadhaar Back"
                    url={
                      vendor?.vendorAadharBackImage ||
                      vendor?.vendor_aadhar_back_image ||
                      vendor?.aadharBackImage ||
                      vendor?.aadhaarBackUrl ||
                      vendor?.aadhaarBack
                    }
                    onZoom={() =>
                      setZoomImage({
                        url:
                          vendor?.vendorAadharBackImage ||
                          vendor?.vendor_aadhar_back_image ||
                          vendor?.aadharBackImage ||
                          vendor?.aadhaarBackUrl ||
                          vendor?.aadhaarBack,
                        title: 'Aadhaar Back',
                      })
                    }
                  />
                  <DocThumbnail
                    title="PAN Card"
                    url={vendor?.pan_card_image || vendor?.panCardImage}
                    onZoom={() =>
                      setZoomImage({
                        url: vendor?.pan_card_image || vendor?.panCardImage,
                        title: 'PAN Card',
                      })
                    }
                  />
                  <DocThumbnail
                    title="GST Certificate"
                    url={vendor?.gst_certificate_image || vendor?.gstCertificateImage}
                    onZoom={() =>
                      setZoomImage({
                        url: vendor?.gst_certificate_image || vendor?.gstCertificateImage,
                        title: 'GST Certificate',
                      })
                    }
                  />
                  <DocThumbnail
                    title="Trade License"
                    url={vendor?.trade_license_image || vendor?.tradeLicenseImage}
                    onZoom={() =>
                      setZoomImage({
                        url: vendor?.trade_license_image || vendor?.tradeLicenseImage,
                        title: 'Trade License',
                      })
                    }
                  />
                  <DocThumbnail
                    title="Cancelled Cheque"
                    url={vendor?.cancelled_cheque_image || vendor?.cancelledChequeImage}
                    onZoom={() =>
                      setZoomImage({
                        url: vendor?.cancelled_cheque_image || vendor?.cancelledChequeImage,
                        title: 'Cancelled Cheque',
                      })
                    }
                  />
                  <DocThumbnail
                    title="Business Card"
                    url={vendor?.business_card_image || vendor?.businessCardImage}
                    onZoom={() =>
                      setZoomImage({
                        url: vendor?.business_card_image || vendor?.businessCardImage,
                        title: 'Business Card',
                      })
                    }
                  />
                  <DocThumbnail
                    title="Shop Front Photo"
                    url={vendor?.shop_photo_image || vendor?.shopPhotoImage || vendor?.imageUrl}
                    onZoom={() =>
                      setZoomImage({
                        url: vendor?.shop_photo_image || vendor?.shopPhotoImage || vendor?.imageUrl,
                        title: 'Shop Front Photo',
                      })
                    }
                  />
                  <DocThumbnail
                    title="Owner Photo"
                    url={vendor?.owner_photo_image || vendor?.ownerPhotoImage}
                    onZoom={() =>
                      setZoomImage({
                        url: vendor?.owner_photo_image || vendor?.ownerPhotoImage,
                        title: 'Owner Photo',
                      })
                    }
                  />
                </View>
              </View>

              {/* SECTION 4: BANK DETAILS */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>🏦 Section 4: Bank Account & Payouts</Text>
                <View style={styles.grid}>
                  <InfoItem label="Bank Name" value={vendor?.bankName || 'HDFC Bank'} />
                  <InfoItem label="Branch" value={vendor?.bankBranch || '—'} />
                  <InfoItem label="Account Holder" value={vendor?.accountHolderName || vendor?.ownerName} />
                  <InfoItem
                    label="Account Number"
                    value={
                      vendor?.accountNumber || vendor?.bankAccountNo
                        ? `XXXX XXXX ${String(vendor.accountNumber || vendor.bankAccountNo).slice(-4)}`
                        : '—'
                    }
                  />
                  <InfoItem label="IFSC Code" value={vendor?.ifscCode || vendor?.bankIfsc || '—'} />
                  <InfoItem label="UPI ID" value={vendor?.upiId || '—'} />
                </View>
              </View>

              {/* SECTION 5: COMMISSION SETUP */}
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>💰 Section 5: Commission & Coin Setup (Admin)</Text>
                <View style={styles.rateRow}>
                  <View style={styles.rateCol}>
                    <Text style={styles.rateLabel}>Shopping Coin % (Customer Discount)</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.rateInput}
                        value={shoppingCoinPercent}
                        onChangeText={setShoppingCoinPercent}
                        keyboardType="numeric"
                      />
                      <Text style={styles.inputUnit}>%</Text>
                    </View>
                  </View>
                  <View style={styles.rateCol}>
                    <Text style={styles.rateLabel}>Platform Commission %</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.rateInput}
                        value={platformCommissionPercent}
                        onChangeText={setPlatformCommissionPercent}
                        keyboardType="numeric"
                      />
                      <Text style={styles.inputUnit}>%</Text>
                    </View>
                  </View>
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
                  <Text style={styles.approveBtnText}>Approve & Activate</Text>
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
              <Text style={styles.rejectModalHeading}>❌ Reject Vendor Registration</Text>
              <Text style={styles.rejectModalSub}>Select the primary reason for rejection:</Text>

              <ScrollView style={{ maxHeight: 220 }}>
                {REJECTION_REASONS.map((reason, idx) => (
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

              <Text style={styles.notesLabel}>Additional Notes for Vendor:</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Explain what needs correction..."
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

      {/* DOCUMENT ZOOM MODAL */}
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
              <Image
                source={{ uri: zoomImage.url }}
                style={styles.zoomImg}
                resizeMode="contain"
              />
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

const DocThumbnail: React.FC<{ title: string; url?: string; onZoom: () => void }> = ({
  title,
  url,
  onZoom,
}) => (
  <View style={styles.docCard}>
    <Text style={styles.docTitle} numberOfLines={1}>
      {title}
    </Text>
    {url ? (
      <TouchableOpacity activeOpacity={0.8} onPress={onZoom} style={styles.docImgWrap}>
        <Image source={{ uri: resolveImageUrl(url) }} style={styles.docImg} resizeMode="cover" />
        <View style={styles.zoomOverlay}>
          <Maximize2 size={14} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    ) : (
      <View style={styles.docEmpty}>
        <AlertCircle size={18} color="#94A3B8" />
        <Text style={styles.docMissingText}>Missing</Text>
      </View>
    )}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 8,
  },
  badgeCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
  mapCard: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapLabel: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  openExternalText: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '600',
  },
  mapFallbackBox: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    gap: 6,
  },
  mapFallbackText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  docCard: {
    width: '31%',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  docTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  docImgWrap: {
    width: '100%',
    height: 75,
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
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 3,
  },
  docEmpty: {
    width: '100%',
    height: 75,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  docMissingText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  rateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rateCol: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
  },
  rateInput: {
    flex: 1,
    height: 38,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  inputUnit: {
    color: '#64748B',
    fontWeight: '700',
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
