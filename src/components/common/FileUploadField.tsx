import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Camera, Image as ImageIcon, CheckCircle2, RefreshCw, Trash2, AlertCircle } from 'lucide-react-native';
import { useFileUpload } from '../../hooks/useFileUpload';
import { COLORS } from '../../theme/colors';

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  value?: string;
  folder?: string;
  onUploadComplete: (url: string) => void;
  helperText?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  required = false,
  value,
  folder = 'wormup/kyc',
  onUploadComplete,
  helperText,
}) => {
  const {
    isUploading,
    progress,
    uploadedUrl,
    localUri,
    error,
    pickFromCamera,
    pickFromGallery,
    uploadFile,
    reset,
  } = useFileUpload({ folder });

  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);

  const handlePickAndUpload = async (source: 'camera' | 'gallery') => {
    const uri = source === 'camera' ? await pickFromCamera() : await pickFromGallery();
    if (uri) {
      setPreviewUrl(uri);
      const res = await uploadFile(uri);
      if (res?.url) {
        setPreviewUrl(res.url);
        onUploadComplete(res.url);
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    reset();
    onUploadComplete('');
  };

  const activeImage = uploadedUrl || previewUrl || value;

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

      {/* UPLOADING STATE */}
      {isUploading ? (
        <View style={styles.uploadingBox}>
          <ActivityIndicator color={COLORS.primary || '#E91E63'} size="small" />
          <Text style={styles.uploadingText}>Uploading to secure Cloudinary storage ({progress}%)...</Text>
        </View>
      ) : activeImage ? (
        /* SUCCESS / PREVIEW STATE */
        <View style={styles.previewBox}>
          <Image source={{ uri: activeImage }} style={styles.thumbnail} resizeMode="cover" />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handlePickAndUpload('gallery')}
            >
              <RefreshCw size={14} color="#64748B" />
              <Text style={styles.actionText}>Re-upload</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleRemove}>
              <Trash2 size={14} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* EMPTY STATE: Pick buttons */
        <View style={styles.emptyBox}>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => handlePickAndUpload('camera')}
              activeOpacity={0.8}
            >
              <Camera size={18} color="#0F172A" />
              <Text style={styles.pickBtnText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => handlePickAndUpload('gallery')}
              activeOpacity={0.8}
            >
              <ImageIcon size={18} color="#0F172A" />
              <Text style={styles.pickBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.metaText}>Max 5MB • JPG, PNG, WebP supported</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <AlertCircle size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
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
    backgroundColor: '#ECFDF5',
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
    marginBottom: 8,
  },
  emptyBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadingText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
  },
});
