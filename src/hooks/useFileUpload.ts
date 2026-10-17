import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadService } from '../services/uploadService';

export interface UploadResult {
  url: string;
  publicId?: string;
  bytes?: number;
}

export interface UseFileUploadOptions {
  folder?: string;
  backendBaseUrl?: string;
  entityType?: 'customer' | 'user' | 'rider' | 'vendor' | 'store';
  entityId?: string;
  resourceType?: string;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    folder = 'wormup/kyc',
    backendBaseUrl = 'http://localhost:5050/api/v1',
    entityType,
    entityId,
    resourceType,
  } = options;

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
  /**
   * Upload file to Cloudinary via universal signed direct upload or backend fallback
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
        const result = await uploadService.uploadMedia(uriToUpload, {
          folder: targetFolder,
          entityType,
          entityId,
          resourceType,
          onProgress: (p) => setProgress(p),
        });

        setProgress(100);
        setIsUploading(false);
        setUploadedUrl(result.url);

        return { url: result.url, publicId: result.publicId };
      } catch (err: any) {
        setIsUploading(false);
        setProgress(0);
        setError(err.message || 'Upload failed');
        Alert.alert('Upload Failed', err.message || 'Failed to upload document');
        return null;
      }
    },
    [localUri, folder, entityType, entityId, resourceType],
  );

  const retry = useCallback(() => {
    if (localUri) {
      return uploadFile(localUri);
    }
  }, [localUri, uploadFile]);

  const cancel = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError('Upload cancelled.');
  }, []);

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
    retry,
    cancel,
    reset,
  };
}
