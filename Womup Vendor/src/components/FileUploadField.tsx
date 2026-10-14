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
import { useFileUpload } from '../hooks/useFileUpload';

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
  folder = 'wormup/kyc/vendor',
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
          <ActivityIndicator color="#3B82F6" size="small" />
          <Text style={styles.uploadingText}>Uploading securely ({progress}%)...</Text>
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
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => handlePickAndUpload('camera')}
              activeOpacity={0.8}
            >
              <Camera size={16} color="#3B82F6" />
              <Text style={styles.pickBtnText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => handlePickAndUpload('gallery')}
              activeOpacity={0.8}
            >
              <ImageIcon size={16} color="#93C5FD" />
              <Text style={styles.pickBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.metaText}>Max 5MB • JPG, PNG, WebP supported</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <AlertCircle size={13} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
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
    color: '#94A3B8',
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
    paddingVertical: 2,
    borderRadius: 12,
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
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metaText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  uploadingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
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
