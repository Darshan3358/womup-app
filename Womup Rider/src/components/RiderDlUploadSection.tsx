import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useFileUpload } from '../hooks/useFileUpload';

interface RiderDlUploadSectionProps {
  initialUrl?: string;
  onUrlChange: (url: string) => void;
}

export const RiderDlUploadSection: React.FC<RiderDlUploadSectionProps> = ({
  initialUrl,
  onUrlChange,
}) => {
  const [showActionModal, setShowActionModal] = useState<boolean>(false);

  const {
    pickFromCamera,
    pickFromGallery,
    pickDocument,
    upload,
    retry,
    cancel,
    remove,
    file,
    preview,
    url,
    progress,
    state,
    error,
    formatFileSize,
  } = useFileUpload({
    folder: 'wormup/rider/kyc',
    entityType: 'rider',
    maxSizeMb: 5,
    onSuccess: (uploadedUrl) => {
      onUrlChange(uploadedUrl);
    },
  });

  const activeUrl = url || initialUrl;

  const handlePickCamera = async () => {
    setShowActionModal(false);
    await pickFromCamera();
  };

  const handlePickGallery = async () => {
    setShowActionModal(false);
    await pickFromGallery();
  };

  const handlePickDoc = async () => {
    setShowActionModal(false);
    await pickDocument();
  };

  const handleRemove = async () => {
    await remove();
    onUrlChange('');
  };

  // Determine effective display state
  const effectiveState =
    state === 'idle' && activeUrl && !file ? 'success' : state;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleIconRow}>
          <Ionicons name="document-text-outline" size={18} color={COLORS.navy} />
          <Text style={styles.sectionTitle}>DRIVING LICENSE DOCUMENT *</Text>
        </View>
        {effectiveState === 'success' && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.verifiedBadgeText}>Attached</Text>
          </View>
        )}
      </View>

      {/* ────────────────────────────────────────────────────────── */}
      {/* STATE 1: Empty (Initial State)                             */}
      {/* ────────────────────────────────────────────────────────── */}
      {effectiveState === 'idle' && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyHint}>
            Upload a clear front-facing photo or PDF of your Driving License
          </Text>

          <View style={styles.pickerBtnRow}>
            <TouchableOpacity
              style={styles.pickerOptionBtn}
              onPress={pickFromCamera}
              activeOpacity={0.8}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#FCE1F5' }]}>
                <Ionicons name="camera" size={20} color={COLORS.primaryPink} />
              </View>
              <Text style={styles.pickerOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOptionBtn}
              onPress={pickFromGallery}
              activeOpacity={0.8}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="images" size={20} color={COLORS.purple} />
              </View>
              <Text style={styles.pickerOptionText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOptionBtn}
              onPress={pickDocument}
              activeOpacity={0.8}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="document-attach" size={20} color="#0284C7" />
              </View>
              <Text style={styles.pickerOptionText}>PDF / File</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fileSpecsRow}>
            <Ionicons name="information-circle-outline" size={13} color="#64748B" />
            <Text style={styles.fileSpecsText}>
              Max 5 MB · Supported formats: JPG, PNG, PDF
            </Text>
          </View>
        </View>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* STATE 2: File Picked (Preview Before Upload)              */}
      {/* ────────────────────────────────────────────────────────── */}
      {effectiveState === 'picked' && file && (
        <View style={styles.previewCard}>
          <View style={styles.imagePreviewBox}>
            {file.isPdf ? (
              <View style={styles.pdfPlaceholder}>
                <Ionicons name="document-text" size={48} color="#DC2626" />
                <Text style={styles.pdfNameText}>{file.name}</Text>
                <Text style={styles.pdfBadge}>PDF DOCUMENT</Text>
              </View>
            ) : preview ? (
              <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />
            ) : null}
          </View>

          <View style={styles.fileMetaRow}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.fileMetaName} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={styles.fileMetaSize}>• {formatFileSize(file.size)}</Text>
          </View>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setShowActionModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color={COLORS.navy} />
              <Text style={styles.secondaryBtnText}>Retake / Choose</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadConfirmBtn}
              onPress={upload}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-upload" size={16} color={COLORS.white} />
              <Text style={styles.uploadConfirmBtnText}>Confirm & Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* STATE 3: Uploading (Progress Bar 0-100%)                   */}
      {/* ────────────────────────────────────────────────────────── */}
      {effectiveState === 'uploading' && (
        <View style={styles.uploadingCard}>
          {preview && !file?.isPdf && (
            <Image source={{ uri: preview }} style={styles.uploadingThumbnail} />
          )}

          <View style={styles.uploadingInfoCol}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.uploadingTitle}>Uploading to Cloudinary...</Text>
              <Text style={styles.progressPctText}>{progress}%</Text>
            </View>

            {/* Real Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>

            <View style={styles.uploadingFooterRow}>
              <Text style={styles.uploadingSubText}>
                {file ? `${file.name} (${formatFileSize(file.size)})` : 'Encrypting & storing...'}
              </Text>

              <TouchableOpacity
                style={styles.cancelUploadBtn}
                onPress={cancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelUploadText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* STATE 4: Success (Thumbnail + Replace/Remove)             */}
      {/* ────────────────────────────────────────────────────────── */}
      {effectiveState === 'success' && (
        <View style={styles.successCard}>
          <View style={styles.successTopRow}>
            <View style={styles.successThumbBox}>
              {preview || activeUrl ? (
                <Image
                  source={{ uri: preview || activeUrl }}
                  style={styles.successThumb}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="document-text" size={32} color="#059669" />
              )}
            </View>

            <View style={styles.successDetailsCol}>
              <View style={styles.successCheckRow}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={styles.successTitleText}>Uploaded Successfully</Text>
              </View>

              <Text style={styles.successFileName} numberOfLines={1}>
                {file?.name || 'Driving_License.jpg'}
              </Text>
              <Text style={styles.successFileSize}>
                {file?.size ? formatFileSize(file.size) : 'Cloud Verified'} • Cloudinary Secure
              </Text>
            </View>
          </View>

          <View style={styles.successBtnRow}>
            <TouchableOpacity
              style={styles.replaceBtn}
              onPress={() => setShowActionModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={15} color={COLORS.navy} />
              <Text style={styles.replaceBtnText}>Replace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={handleRemove}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color="#DC2626" />
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* STATE 5: Failed (Error + Retry)                           */}
      {/* ────────────────────────────────────────────────────────── */}
      {effectiveState === 'failed' && (
        <View style={styles.failedCard}>
          <View style={styles.failedHeaderRow}>
            <Ionicons name="alert-circle" size={22} color="#DC2626" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.failedTitle}>Upload Failed</Text>
              <Text style={styles.failedErrorMsg}>
                {error || 'Network error occurred while uploading to Cloudinary.'}
              </Text>
            </View>
          </View>

          <View style={styles.failedBtnRow}>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={retry}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={16} color={COLORS.white} />
              <Text style={styles.retryBtnText}>Retry Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.failedCancelBtn}
              onPress={() => setShowActionModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.failedCancelText}>Choose Different File</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* Action Sheet Modal: Camera / Gallery / PDF                */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Document Source</Text>
            <Text style={styles.modalSubtitle}>
              Capture or choose your Driving License document
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickCamera}
              activeOpacity={0.75}
            >
              <View style={[styles.modalIconBox, { backgroundColor: '#FCE1F5' }]}>
                <Ionicons name="camera" size={22} color={COLORS.primaryPink} />
              </View>
              <View style={styles.modalOptionTextCol}>
                <Text style={styles.modalOptionTitle}>Take Photo</Text>
                <Text style={styles.modalOptionSub}>Use camera to scan physical DL</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickGallery}
              activeOpacity={0.75}
            >
              <View style={[styles.modalIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="images" size={22} color={COLORS.purple} />
              </View>
              <View style={styles.modalOptionTextCol}>
                <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.modalOptionSub}>Select existing image from device</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickDoc}
              activeOpacity={0.75}
            >
              <View style={[styles.modalIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="document-text" size={22} color="#0284C7" />
              </View>
              <View style={styles.modalOptionTextCol}>
                <Text style={styles.modalOptionTitle}>Upload PDF / Document</Text>
                <Text style={styles.modalOptionSub}>Upload DigiLocker or scanned PDF</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowActionModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* State 1: Empty Card */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  pickerBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  pickerOptionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pickerOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  fileSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileSpecsText: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* State 2: Preview Card */
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
  },
  imagePreviewBox: {
    width: '100%',
    height: 160,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pdfPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  pdfNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 6,
    textAlign: 'center',
  },
  pdfBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    gap: 6,
  },
  fileMetaName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
  },
  fileMetaSize: {
    fontSize: 11,
    color: '#64748B',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  uploadConfirmBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryPink,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  uploadConfirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },

  /* State 3: Uploading Card */
  uploadingCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadingThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  uploadingInfoCol: {
    flex: 1,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  uploadingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  progressPctText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.purple,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryPink,
    borderRadius: 4,
  },
  uploadingFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadingSubText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  cancelUploadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cancelUploadText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
  },

  /* State 4: Success Card */
  successCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 14,
  },
  successTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successThumbBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successThumb: {
    width: '100%',
    height: '100%',
  },
  successDetailsCol: {
    flex: 1,
  },
  successCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  successTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  successFileName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 2,
  },
  successFileSize: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },
  successBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  replaceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 7,
    gap: 5,
  },
  replaceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 7,
    gap: 5,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* State 5: Failed Card */
  failedCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
  },
  failedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  failedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
  },
  failedErrorMsg: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
  failedBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 6,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  failedCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 8,
  },
  failedCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F1D1D',
  },

  /* Modal Action Sheet */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 18,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionTextCol: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  modalOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
