import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  RefreshCw,
  Trash2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react-native';
import { useFileUpload } from '../hooks/useFileUpload';

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  value?: string;
  folder?: string;
  accept?: 'image' | 'pdf' | 'all';
  maxSizeMB?: number;
  entityType?: 'customer' | 'user' | 'rider' | 'vendor' | 'store';
  entityId?: string;
  resourceType?: string;
  onUploadComplete: (url: string) => void;
  helperText?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  required = false,
  value,
  folder = 'wormup/customer/kyc',
  accept = 'all',
  maxSizeMB = 5,
  entityType,
  entityId,
  resourceType,
  onUploadComplete,
  helperText,
}) => {
  const {
    isUploading,
    progress,
    uploadedUrl,
    error,
    pickFromCamera,
    pickFromGallery,
    pickDocument,
    uploadFile,
    retry,
    reset,
  } = useFileUpload({ folder, entityType, entityId, resourceType });

  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);

  const handlePickAndUpload = async (source: 'camera' | 'gallery' | 'document') => {
    let uri: string | null = null;
    if (source === 'camera') uri = await pickFromCamera();
    else if (source === 'gallery') uri = await pickFromGallery();
    else if (source === 'document') uri = await pickDocument();

    if (uri) {
      setPreviewUrl(uri);
      const res = await uploadFile(uri);
      if (res?.url) {
        setPreviewUrl(res.url);
        onUploadComplete(res.url);
      }
    }
  };

  const handleRetry = async () => {
    const res = await retry();
    if (res?.url) {
      setPreviewUrl(res.url);
      onUploadComplete(res.url);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    reset();
    onUploadComplete('');
  };

  const activeImage = uploadedUrl || previewUrl || value;
  const isPdf = activeImage?.toLowerCase().endsWith('.pdf');

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.asterisk}>*</Text>}
        </Text>
        {activeImage && !isUploading && (
          <View style={styles.successBadge}>
            <CheckCircle2 size={12} color="#10B981" />
            <Text style={styles.successText}>Uploaded</Text>
          </View>
        )}
      </View>

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      {/* UPLOADING STATE WITH PROGRESS BAR */}
      {isUploading ? (
        <View style={styles.uploadingBox}>
          <View style={styles.uploadHeader}>
            <ActivityIndicator color="#4F46E5" size="small" />
            <Text style={styles.uploadingText}>
              Uploading securely to Cloudinary ({progress}%)...
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      ) : activeImage ? (
        /* SUCCESS / PREVIEW STATE */
        <View style={styles.previewBox}>
          {isPdf ? (
            <View style={styles.pdfBadge}>
              <FileText size={24} color="#EF4444" />
              <Text style={styles.pdfText} numberOfLines={1}>
                PDF Document
              </Text>
            </View>
          ) : (
            <Image source={{ uri: activeImage }} style={styles.thumbnail} resizeMode="cover" />
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handlePickAndUpload(accept === 'pdf' ? 'document' : 'gallery')}
            >
              <RefreshCw size={13} color="#4F46E5" />
              <Text style={styles.actionText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleRemove}>
              <Trash2 size={13} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* EMPTY STATE: Pick buttons */
        <View style={styles.emptyBox}>
          <View style={styles.btnRow}>
            {accept !== 'pdf' && (
              <>
                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => handlePickAndUpload('camera')}
                  activeOpacity={0.8}
                >
                  <Camera size={16} color="#4F46E5" />
                  <Text style={styles.pickBtnText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => handlePickAndUpload('gallery')}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={16} color="#4F46E5" />
                  <Text style={styles.pickBtnText}>Gallery</Text>
                </TouchableOpacity>
              </>
            )}

            {(accept === 'pdf' || accept === 'all') && (
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => handlePickAndUpload('document')}
                activeOpacity={0.8}
              >
                <FileText size={16} color="#D97706" />
                <Text style={styles.pickBtnText}>PDF / Doc</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.metaText}>
            Max {maxSizeMB} MB • {accept === 'pdf' ? 'PDF only' : 'JPG, PNG, PDF supported'}
          </Text>
        </View>
      )}

      {/* ERROR STATE & RETRY */}
      {error ? (
        <View style={styles.errorRow}>
          <View style={styles.errorBox}>
            <AlertCircle size={13} color="#EF4444" />
            <Text style={styles.errorText} numberOfLines={2}>
              {error}
            </Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <RotateCcw size={12} color="#D97706" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  asterisk: {
    color: '#EF4444',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  uploadingBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E0E7FF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbnail: {
    width: 70,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pdfText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
    maxWidth: 160,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  emptyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 12,
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  metaText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
});
