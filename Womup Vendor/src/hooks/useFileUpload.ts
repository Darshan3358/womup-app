import { useState, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UploadState =
  | 'IDLE'
  | 'PICKING'
  | 'PICKED'
  | 'VALIDATING'
  | 'COMPRESSING'
  | 'REQUESTING_SIGNATURE'
  | 'UPLOADING'
  | 'SAVING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export interface UploadResult {
  url: string;
  publicId?: string;
  bytes?: number;
  format?: string;
  name?: string;
}

export interface QueuedUpload {
  id: string;
  uri: string;
  name: string;
  type: string;
  folder: string;
  timestamp: number;
}

export interface UseFileUploadOptions {
  folder?: string;
  backendBaseUrl?: string;
  maxSizeMB?: number;
  allowedExtensions?: string[];
  entityType?: string;
  entityId?: string;
}

const OFFLINE_QUEUE_KEY = '@wormup_upload_queue_v1';
const MAX_FILE_SIZE_MB = 5;
const DEFAULT_ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5050/api/v1';
    }
  }
  return 'https://womup-app-uquz.onrender.com/api/v1';
};

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    folder = 'wormup/kyc/vendor',
    backendBaseUrl = getApiBaseUrl(),
    maxSizeMB = MAX_FILE_SIZE_MB,
    allowedExtensions = DEFAULT_ALLOWED_EXTS,
    entityType = 'vendor',
    entityId,
  } = options;

  const [state, setState] = useState<UploadState>('IDLE');
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Request media library permission
  const requestMediaPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to select photos.');
        return false;
      }
    }
    return true;
  };

  // Request camera permission
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permissions are required to take photos.');
        return false;
      }
    }
    return true;
  };

  // File Validation
  const validateFile = (name: string, sizeInBytes?: number): boolean => {
    setState('VALIDATING');
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      const msg = `Only ${allowedExtensions.map((e) => e.toUpperCase()).join(', ')} files are allowed.`;
      setError(msg);
      setState('FAILED');
      Alert.alert('Invalid File Type', msg);
      return false;
    }

    if (sizeInBytes && sizeInBytes > maxSizeMB * 1024 * 1024) {
      const msg = `File is too large. Max ${maxSizeMB} MB allowed.`;
      setError(msg);
      setState('FAILED');
      Alert.alert('File Too Large', msg);
      return false;
    }

    return true;
  };

  // Pick Image from Gallery
  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    const hasPerm = await requestMediaPermission();
    if (!hasPerm) return null;

    setState('PICKING');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8, // Built-in compression for images > 1MB
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `image_${Date.now()}.jpg`;
        const size = asset.fileSize;

        if (!validateFile(name, size)) return null;

        setLocalUri(asset.uri);
        setFileName(name);
        setFileSize(size || null);
        setState('PICKED');
        return asset.uri;
      }
      setState('IDLE');
    } catch (e: any) {
      setError(e.message || 'Failed to select image from gallery');
      setState('FAILED');
    }
    return null;
  }, [maxSizeMB, allowedExtensions]);

  // Capture Photo from Camera
  const pickFromCamera = useCallback(async (): Promise<string | null> => {
    const hasPerm = await requestCameraPermission();
    if (!hasPerm) return null;

    setState('PICKING');
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `camera_${Date.now()}.jpg`;
        const size = asset.fileSize;

        if (!validateFile(name, size)) return null;

        setLocalUri(asset.uri);
        setFileName(name);
        setFileSize(size || null);
        setState('PICKED');
        return asset.uri;
      }
      setState('IDLE');
    } catch (e: any) {
      setError(e.message || 'Failed to take photo with camera');
      setState('FAILED');
    }
    return null;
  }, [maxSizeMB, allowedExtensions]);

  // Pick Document / PDF
  const pickDocument = useCallback(async (): Promise<string | null> => {
    setState('PICKING');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.name || `doc_${Date.now()}.pdf`;
        const size = asset.size;

        if (!validateFile(name, size)) return null;

        setLocalUri(asset.uri);
        setFileName(name);
        setFileSize(size || null);
        setState('PICKED');
        return asset.uri;
      }
      setState('IDLE');
    } catch (e: any) {
      setError(e.message || 'Failed to pick document');
      setState('FAILED');
    }
    return null;
  }, [maxSizeMB, allowedExtensions]);

  // Offline Queue Support
  const queueOfflineUpload = async (file: { uri: string; name?: string; type?: string }) => {
    try {
      const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: QueuedUpload[] = existing ? JSON.parse(existing) : [];
      if (queue.length >= 10) queue.shift();
      queue.push({
        id: `queue_${Date.now()}`,
        uri: file.uri,
        name: file.name || 'document',
        type: file.type || 'image/jpeg',
        folder,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      Alert.alert('Offline Mode', 'Internet is unavailable. File queued for upload when connection resumes.');
    } catch (qErr) {
      console.warn('Failed to queue offline upload:', qErr);
    }
  };

  // Cancel in-progress upload
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState('CANCELLED');
    setProgress(0);
    setError('Upload cancelled.');
  }, []);

  // Upload Logic with Retry & Signed Flow
  const uploadFile = useCallback(
    async (fileUri?: string, customFolder?: string): Promise<UploadResult | null> => {
      const uriToUpload = fileUri || localUri;
      if (!uriToUpload) {
        Alert.alert('No file', 'Please select or capture a file first.');
        return null;
      }

      const targetFolder = customFolder || folder;
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setState('REQUESTING_SIGNATURE');
      setProgress(15);
      setError(null);

      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const token =
            (await AsyncStorage.getItem('@womup_vendor_token')) ||
            (await AsyncStorage.getItem('@womup_auth_token')) ||
            (await AsyncStorage.getItem('accessToken'));

          setState('UPLOADING');
          setProgress(30);

          // 1. Prepare FormData
          const formData = new FormData();
          const targetName = fileName || `file_${Date.now()}`;
          const isPdf = targetName.toLowerCase().endsWith('.pdf');

          if (Platform.OS === 'web') {
            const res = await fetch(uriToUpload);
            const blob = await res.blob();
            formData.append('file', blob, targetName);
          } else {
            const match = /\.(\w+)$/.exec(targetName);
            const mimeType = isPdf ? 'application/pdf' : match ? `image/${match[1]}` : 'image/jpeg';
            formData.append('file', {
              uri: uriToUpload,
              name: targetName,
              type: mimeType,
            } as any);
          }

          setProgress(60);

          // 2. Resilient Upload: Upload directly to backend service
          // The backend executes Cloudinary upload on the server, and automatically
          // falls back to local storage if Cloudinary returns a 403 / permission error.
          let finalUrl = '';
          let publicId = '';

          const sendVendorXhr = (url: string) => {
            return new Promise<any>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('POST', url);
              if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              if (signal) {
                signal.addEventListener('abort', () => xhr.abort());
              }
              xhr.onload = () => {
                let data: any;
                try { data = JSON.parse(xhr.responseText); } catch { data = { text: xhr.responseText }; }
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve(data);
                } else {
                  reject(new Error(data?.message || data?.error || `Upload failed with status ${xhr.status}`));
                }
              };
              xhr.onerror = () => reject(new Error('Network error during file upload'));
              xhr.onabort = () => reject(new Error('Upload cancelled'));
              xhr.timeout = 60000;
              xhr.send(formData);
            });
          };

          try {
            const bData = await sendVendorXhr(`${backendBaseUrl}/uploads/upload?folder=${encodeURIComponent(targetFolder)}`);
            if (bData && (bData.data?.url || bData.url || bData.data?.secure_url)) {
              finalUrl = bData.data?.url || bData.url || bData.data?.secure_url;
              publicId = bData.data?.publicId || bData.public_id || `doc_${Date.now()}`;
            } else {
              throw new Error(bData?.message || 'Primary backend upload returned an error');
            }
          } catch (primaryErr: any) {
            if (signal.aborted) throw primaryErr;
            console.warn('[useFileUpload] Primary /uploads/upload fallback to /media/upload:', primaryErr?.message);

            // Secondary fallback endpoint
            const altData = await sendVendorXhr(`${backendBaseUrl}/media/upload?folder=${encodeURIComponent(targetFolder)}`);
            if (altData && (altData.data?.url || altData.url)) {
              finalUrl = altData.data?.url || altData.url;
              publicId = altData.data?.publicId || `doc_${Date.now()}`;
            } else {
              throw new Error(altData?.message || primaryErr.message || 'File upload failed');
            }
          }

          if (finalUrl.startsWith('/uploads/')) {
            finalUrl = `${backendBaseUrl.replace('/api/v1', '')}${finalUrl}`;
          }

          setProgress(85);
          setState('SAVING');

          // 4. Record to backend save audit
          try {
            await fetch(`${backendBaseUrl}/uploads/save`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                url: finalUrl,
                publicId,
                resourceType: isPdf ? 'pdf' : 'image',
                entityType,
                entityId,
              }),
            });
          } catch (saveErr) {
            console.warn('Backend save audit skipped:', saveErr);
          }

          setProgress(100);
          setState('SUCCESS');
          setUploadedUrl(finalUrl);

          return { url: finalUrl, publicId, name: targetName };
        } catch (err: any) {
          if (err.name === 'AbortError') {
            setState('CANCELLED');
            return null;
          }

          attempt++;
          if (attempt <= maxRetries) {
            const backoff = attempt === 1 ? 2000 : 5000;
            console.log(`Upload attempt ${attempt} failed, retrying in ${backoff / 1000}s...`);
            await new Promise((r) => setTimeout(r, backoff));
          } else {
            if (err.message?.includes('Network') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
              await queueOfflineUpload({ uri: uriToUpload, name: fileName || undefined });
            }
            setState('FAILED');
            setProgress(0);
            const errMsg = err.message || 'Upload failed. Please check connection and retry.';
            setError(errMsg);
            Alert.alert('Upload Error', errMsg);
            return null;
          }
        }
      }
      return null;
    },
    [localUri, fileName, folder, backendBaseUrl, entityType, entityId]
  );

  // Retry failed upload
  const retry = useCallback(() => {
    if (localUri) {
      return uploadFile(localUri);
    }
  }, [localUri, uploadFile]);

  // Reset all state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState('IDLE');
    setProgress(0);
    setUploadedUrl(null);
    setLocalUri(null);
    setFileName(null);
    setFileSize(null);
    setError(null);
  }, []);

  return {
    state,
    isUploading: state === 'UPLOADING' || state === 'REQUESTING_SIGNATURE' || state === 'SAVING',
    progress,
    uploadedUrl,
    localUri,
    fileName,
    fileSize,
    error,
    pickFromCamera,
    pickFromGallery,
    pickDocument,
    uploadFile,
    retry,
    cancel,
    reset,
  };
}
