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
  onUploadComplete: (url: string) => void;
  helperText?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  required = false,
  value,
  folder = 'wormup/kyc/vendor',
  accept = 'all',
  maxSizeMB = 5,
  onUploadComplete,
  helperText,
}) => {
  const {
    state,
    isUploading,
    progress,
    uploadedUrl,
    fileName,
    error,
    pickFromCamera,
    pickFromGallery,
    pickDocument,
    uploadFile,
    retry,
    reset,
  } = useFileUpload({ folder, maxSizeMB });

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
  const isPdf = activeImage?.toLowerCase().endsWith('.pdf') || fileName?.toLowerCase().endsWith('.pdf');

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <FileText size={14} color="#38BDF8" />
          <Text style={styles.label}>
            {label.replace(/^📄\s*/, '')} {required && <Text style={styles.asterisk}>*</Text>}
          </Text>
        </View>
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
            <ActivityIndicator color="#3B82F6" size="small" />
            <Text style={styles.uploadingText}>
              {state === 'REQUESTING_SIGNATURE'
                ? 'Securing signed token...'
                : state === 'SAVING'
                ? 'Finalizing record...'
                : `Uploading securely (${progress}%)...`}
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
                {fileName || 'PDF Document'}
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
              <RefreshCw size={13} color="#94A3B8" />
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
                  <Camera size={15} color="#38BDF8" />
                  <Text style={styles.pickBtnText} numberOfLines={1}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => handlePickAndUpload('gallery')}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={15} color="#818CF8" />
                  <Text style={styles.pickBtnText} numberOfLines={1}>Gallery</Text>
                </TouchableOpacity>
              </>
            )}

            {(accept === 'pdf' || accept === 'all') && (
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => handlePickAndUpload('document')}
                activeOpacity={0.8}
              >
                <FileText size={15} color="#F59E0B" />
                <Text style={styles.pickBtnText} numberOfLines={1}>PDF / Doc</Text>
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
            <RotateCcw size={12} color="#F59E0B" />
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
    marginBottom: 8,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  asterisk: {
    color: '#EF4444',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  emptyBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    width: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    alignItems: 'center',
  },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  pickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  uploadingBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 8,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    maxWidth: '65%',
  },
  pdfText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
