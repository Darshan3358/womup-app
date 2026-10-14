import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export interface UploadResult {
  url: string;
  publicId?: string;
  bytes?: number;
}

export interface UseFileUploadOptions {
  folder?: string;
  backendBaseUrl?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { folder = 'wormup/kyc', backendBaseUrl = 'http://localhost:5050/api/v1' } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request media library permissions
   */
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

  /**
   * Request camera permissions
   */
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

  /**
   * Pick photo from device gallery
   */
  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    const hasPerm = await requestMediaPermission();
    if (!hasPerm) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setLocalUri(uri);
        return uri;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to select image from gallery');
    }
    return null;
  }, []);

  /**
   * Take new photo with camera
   */
  const pickFromCamera = useCallback(async (): Promise<string | null> => {
    const hasPerm = await requestCameraPermission();
    if (!hasPerm) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setLocalUri(uri);
        return uri;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to take photo with camera');
    }
    return null;
  }, []);

  /**
   * Pick document or PDF
   */
  const pickDocument = useCallback(async (): Promise<string | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setLocalUri(uri);
        return uri;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to select document');
    }
    return null;
  }, []);

  /**
   * Upload file to Cloudinary via backend or signed direct upload
   */
  const uploadFile = useCallback(
    async (fileUri?: string, customFolder?: string): Promise<UploadResult | null> => {
      const uriToUpload = fileUri || localUri;
      if (!uriToUpload) {
        Alert.alert('No file', 'Please select or capture an image first.');
        return null;
      }

      setIsUploading(true);
      setProgress(10);
      setError(null);

      const targetFolder = customFolder || folder;

      try {
        // Step 1: Request upload signature from backend
        let signatureData: any = null;
        try {
          const sigRes = await fetch(`${backendBaseUrl}/uploads/signature`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: targetFolder }),
          });
          if (sigRes.ok) {
            const json = await sigRes.json();
            signatureData = json.data;
          }
        } catch (sigErr) {
          console.warn('Backend signature fallback to direct upload:', sigErr);
        }

        setProgress(30);

        // Step 2: Prepare FormData
        const formData = new FormData();

        if (Platform.OS === 'web') {
          // On Web, fetch blob from object/local URL
          const res = await fetch(uriToUpload);
          const blob = await res.blob();
          const filename = `upload_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
          formData.append('file', blob, filename);
        } else {
          // React Native native file object
          const uriParts = uriToUpload.split('/');
          const filename = uriParts[uriParts.length - 1];
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('file', {
            uri: uriToUpload,
            name: filename,
            type,
          } as any);
        }

        setProgress(50);

        // Step 3: Execute upload (Signed Cloudinary or Backend Proxy)
        let finalUrl = '';
        let publicId = '';

        if (signatureData?.uploadUrl && signatureData?.apiKey) {
          // Direct signed Cloudinary upload
          formData.append('api_key', signatureData.apiKey);
          formData.append('timestamp', String(signatureData.timestamp));
          formData.append('signature', signatureData.signature);
          formData.append('folder', signatureData.folder);

          const cRes = await fetch(signatureData.uploadUrl, {
            method: 'POST',
            body: formData,
          });

          const cData = await cRes.json();
          if (cRes.ok && cData.secure_url) {
            finalUrl = cData.secure_url;
            publicId = cData.public_id;
          } else {
            throw new Error(cData.error?.message || 'Cloudinary upload failed');
          }
        } else {
          // Fallback through backend media upload
          const bRes = await fetch(`${backendBaseUrl}/media/upload?folder=${encodeURIComponent(targetFolder)}`, {
            method: 'POST',
            body: formData,
          });
          const bData = await bRes.json();
          if (bRes.ok && bData.data?.url) {
            finalUrl = bData.data.url;
            publicId = bData.data.publicId;
          } else {
            throw new Error(bData.message || 'Backend upload failed');
          }
        }

        setProgress(100);
        setIsUploading(false);
        setUploadedUrl(finalUrl);

        return { url: finalUrl, publicId };
      } catch (err: any) {
        setIsUploading(false);
        setProgress(0);
        const errMsg = err.message || 'File upload failed. Please try again.';
        setError(errMsg);
        Alert.alert('Upload Error', errMsg);
        return null;
      }
    },
    [localUri, folder, backendBaseUrl]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setUploadedUrl(null);
    setLocalUri(null);
    setError(null);
  }, []);

  return {
    isUploading,
    progress,
    uploadedUrl,
    localUri,
    error,
    pickFromCamera,
    pickFromGallery,
    pickDocument,
    uploadFile,
    reset,
  };
}
