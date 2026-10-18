import { useState, useRef, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export type UploadState = 'idle' | 'picking' | 'picked' | 'uploading' | 'success' | 'failed';

export interface PickedFileInfo {
  uri: string;
  name: string;
  size: number; // in bytes
  type: string; // mime type
  isPdf: boolean;
}

export interface UseFileUploadOptions {
  folder?: string;
  entityType?: string;
  entityId?: string;
  maxSizeMb?: number;
  onSuccess?: (url: string) => void;
  onError?: (errorMsg: string) => void;
}

const isLocalWeb =
  typeof window !== 'undefined' &&
  (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

const DEFAULT_API_URL = isLocalWeb
  ? 'http://localhost:5050/api/v1'
  : 'https://womup-app.onrender.com/api/v1';

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_URL;
};

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    folder = 'wormup/rider/kyc',
    entityType = 'rider',
    entityId = 'temp_rider_id',
    maxSizeMb = 5,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UploadState>('idle');
  const [file, setFile] = useState<PickedFileInfo | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Active XHR reference for cancellation
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Compress image if size exceeds 1 MB or large dimensions
   */
  const compressImageIfNeeded = async (uri: string, currentSize: number): Promise<string> => {
    try {
      if (currentSize > 1 * 1024 * 1024) {
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1400 } }],
          { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
        );
        return manipResult.uri;
      }
    } catch (err) {
      console.warn('[useFileUpload] Image compression skipped:', err);
    }
    return uri;
  };

  /**
   * Helper to validate file size and format
   */
  const validateFile = (size: number, fileName: string, mimeType?: string): boolean => {
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (size > maxBytes) {
      const msg = `File is too large (${formatFileSize(size)}). Maximum allowed size is ${maxSizeMb} MB.`;
      setError(msg);
      Alert.alert('File Too Large', msg);
      return false;
    }

    const lowerName = fileName.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt && mimeType && !mimeType.includes('image') && !mimeType.includes('pdf')) {
      const msg = 'Unsupported file format. Please upload JPG, PNG, or PDF.';
      setError(msg);
      Alert.alert('Invalid Format', msg);
      return false;
    }

    return true;
  };

  /**
   * 1. Pick from Camera
   */
  const pickFromCamera = useCallback(async () => {
    setError(null);
    setState('picking');

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setState('idle');
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in your device settings to take a photo of your driving license.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS !== 'web') {
                  Linking.openSettings().catch(() => {});
                }
              },
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setState(file ? 'picked' : 'idle');
        return;
      }

      const asset = result.assets[0];
      const estimatedSize = asset.fileSize || 1.8 * 1024 * 1024;
      const fileName = asset.fileName || `dl_camera_${Date.now()}.jpg`;

      if (!validateFile(estimatedSize, fileName, asset.mimeType)) {
        setState('idle');
        return;
      }

      const processedUri = await compressImageIfNeeded(asset.uri, estimatedSize);

      const fileInfo: PickedFileInfo = {
        uri: processedUri,
        name: fileName,
        size: estimatedSize,
        type: asset.mimeType || 'image/jpeg',
        isPdf: false,
      };

      setFile(fileInfo);
      setPreview(processedUri);
      setState('picked');
    } catch (err: any) {
      console.error('[useFileUpload] Camera error:', err);
      setError(err.message || 'Failed opening camera');
      setState('idle');
    }
  }, [file, maxSizeMb]);

  /**
   * 2. Pick from Gallery
   */
  const pickFromGallery = useCallback(async () => {
    setError(null);
    setState('picking');

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setState('idle');
        Alert.alert(
          'Photo Library Access Required',
          'Please allow photo library access in settings to select your driving license.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS !== 'web') {
                  Linking.openSettings().catch(() => {});
                }
              },
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setState(file ? 'picked' : 'idle');
        return;
      }

      const asset = result.assets[0];
      const estimatedSize = asset.fileSize || 2.2 * 1024 * 1024;
      const fileName = asset.fileName || `dl_gallery_${Date.now()}.jpg`;

      if (!validateFile(estimatedSize, fileName, asset.mimeType)) {
        setState('idle');
        return;
      }

      const processedUri = await compressImageIfNeeded(asset.uri, estimatedSize);

      const fileInfo: PickedFileInfo = {
        uri: processedUri,
        name: fileName,
        size: estimatedSize,
        type: asset.mimeType || 'image/jpeg',
        isPdf: false,
      };

      setFile(fileInfo);
      setPreview(processedUri);
      setState('picked');
    } catch (err: any) {
      console.error('[useFileUpload] Gallery error:', err);
      setError(err.message || 'Failed picking image from gallery');
      setState('idle');
    }
  }, [file, maxSizeMb]);

  /**
   * 3. Pick Document (PDF / Image)
   */
  const pickDocument = useCallback(async () => {
    setError(null);
    setState('picking');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setState(file ? 'picked' : 'idle');
        return;
      }

      const asset = result.assets[0];
      const fileSize = asset.size || 1.5 * 1024 * 1024;
      const fileName = asset.name || `dl_doc_${Date.now()}.pdf`;
      const isPdf = fileName.toLowerCase().endsWith('.pdf') || (asset.mimeType?.includes('pdf') ?? false);

      if (!validateFile(fileSize, fileName, asset.mimeType)) {
        setState('idle');
        return;
      }

      let finalUri = asset.uri;
      if (!isPdf) {
        finalUri = await compressImageIfNeeded(asset.uri, fileSize);
      }

      const fileInfo: PickedFileInfo = {
        uri: finalUri,
        name: fileName,
        size: fileSize,
        type: asset.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'),
        isPdf,
      };

      setFile(fileInfo);
      setPreview(isPdf ? null : finalUri);
      setState('picked');
    } catch (err: any) {
      console.error('[useFileUpload] Document picker error:', err);
      setError(err.message || 'Failed opening document picker');
      setState('idle');
    }
  }, [file, maxSizeMb]);

  /**
   * 4. Upload to Cloudinary with Real Signature & Progress
   */
  const upload = useCallback(async (): Promise<string | null> => {
    if (!file) {
      Alert.alert('No File Selected', 'Please take a photo or pick a document first.');
      return null;
    }

    setState('uploading');
    setProgress(5);
    setError(null);

    const baseUrl = getApiBaseUrl();

    try {
      const token =
        (await AsyncStorage.getItem('@womup_rider_token')) ||
        (await AsyncStorage.getItem('@womup_auth_token')) ||
        (await AsyncStorage.getItem('accessToken'));

      // Step A: Request signature from backend
      let signatureData: any = null;
      try {
        const sigRes = await fetch(`${baseUrl}/uploads/signature`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            folder,
            publicId: `rider_dl_${Date.now()}`,
            resourceType: file.isPdf ? 'raw' : 'image',
          }),
        });

        const sigJson = await sigRes.json();
        if (sigJson && sigJson.success && sigJson.data) {
          signatureData = sigJson.data;
        }
      } catch (sigErr) {
        console.warn('[useFileUpload] Signature request failed, falling back to direct server upload:', sigErr);
      }

      // Step B: Upload file via backend resilient Cloudinary upload service
      const uploadedResultUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        activeXhrRef.current = xhr;

        xhr.open('POST', `${baseUrl}/uploads/upload?folder=${encodeURIComponent(folder)}`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        const formData = new FormData();
        const executeSend = () => {
          xhr.send(formData);
        };

        if (Platform.OS === 'web') {
          fetch(file.uri)
            .then((r) => r.blob())
            .then((blob) => {
              formData.append('file', blob, file.name);
              executeSend();
            })
            .catch(reject);
        } else {
          formData.append('file', {
            uri: file.uri,
            type: file.type,
            name: file.name,
          } as any);
          executeSend();
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.min(95, Math.round((event.loaded / event.total) * 100));
            setProgress(pct);
          } else {
            setProgress((prev) => Math.min(90, prev + 10));
          }
        };

        xhr.onload = () => {
          activeXhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              const finalUrl = res.secure_url || res.url || res.data?.secure_url || res.data?.url;
              const pid = res.public_id || res.data?.public_id || signatureData?.publicId || '';
              if (pid) setPublicId(pid);
              if (finalUrl) {
                resolve(finalUrl);
              } else {
                reject(new Error('Upload completed but URL was not returned.'));
              }
            } catch (pErr: any) {
              reject(new Error(`Failed parsing response: ${pErr.message}`));
            }
          } else {
            reject(new Error(`Upload failed with HTTP ${xhr.status}: ${xhr.statusText || xhr.responseText}`));
          }
        };

        xhr.onerror = () => {
          activeXhrRef.current = null;
          reject(new Error('Network error during file upload. Please check your connection.'));
        };

        xhr.onabort = () => {
          activeXhrRef.current = null;
          reject(new Error('Upload cancelled by user'));
        };
      });

      // Step C: Save record to backend audit
      try {
        await fetch(`${baseUrl}/uploads/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceType: 'RIDER_DL_IMAGE',
            url: uploadedResultUrl,
            publicId: publicId || `rider_dl_${Date.now()}`,
            entityType,
            entityId,
          }),
        });
      } catch (saveErr) {
        console.warn('[useFileUpload] Non-critical save audit error:', saveErr);
      }

      setProgress(100);
      setUrl(uploadedResultUrl);
      setState('success');
      onSuccess?.(uploadedResultUrl);
      return uploadedResultUrl;
    } catch (err: any) {
      if (err.message === 'Upload cancelled by user') {
        setState('picked');
        return null;
      }
      console.error('[useFileUpload] Upload failed:', err);
      setError(err.message || 'File upload failed. Please try again.');
      setState('failed');
      onError?.(err.message || 'File upload failed');
      return null;
    }
  }, [file, folder, entityType, entityId, publicId, onSuccess, onError]);

  /**
   * 5. Retry upload
   */
  const retry = useCallback(() => {
    upload();
  }, [upload]);

  /**
   * 6. Cancel in-progress upload
   */
  const cancel = useCallback(() => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    setState(file ? 'picked' : 'idle');
    setProgress(0);
  }, [file]);

  /**
   * 7. Remove uploaded file
   */
  const remove = useCallback(async () => {
    if (publicId) {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/uploads/${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      }).catch((delErr) => console.warn('[useFileUpload] Delete warning:', delErr));
    }

    setFile(null);
    setPreview(null);
    setUrl(null);
    setPublicId(null);
    setProgress(0);
    setError(null);
    setState('idle');
  }, [publicId]);

  return {
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
  };
};
