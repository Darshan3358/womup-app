import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UploadOptions {
  folder?: string;
  entityType?: 'rider' | 'customer' | 'vendor' | 'store';
  entityId?: string;
  fieldName?: string; // e.g. 'aadharFront', 'aadharBack', 'rc', 'insurance', 'dl'
  resourceType?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  publicId?: string;
  message?: string;
}

const isLocalWeb =
  typeof window !== 'undefined' &&
  (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1');

const API_BASE_URL = isLocalWeb
  ? 'http://localhost:5050/api/v1'
  : 'https://womup-app.onrender.com/api/v1';

class RiderUploadService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return (
        (await AsyncStorage.getItem('@womup_rider_token')) ||
        (await AsyncStorage.getItem('@womup_auth_token')) ||
        (await AsyncStorage.getItem('accessToken'))
      );
    } catch {
      return null;
    }
  }

  async uploadMedia(
    fileUriOrBlob: string | any,
    options: UploadOptions = {},
  ): Promise<UploadResponse> {
    const {
      folder = 'wormup/rider/kyc',
      entityType = 'rider',
      entityId,
      fieldName,
      resourceType = 'media',
      onProgress,
    } = options;

    if (!fileUriOrBlob) {
      throw new Error('No file provided for upload');
    }

    onProgress?.(10);
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Step 1: Request signed upload params from backend
    let signatureData: any = null;
    try {
      const sigRes = await fetch(`${API_BASE_URL}/uploads/signature`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ folder }),
      });

      if (sigRes.ok) {
        const json = await sigRes.json();
        signatureData = json?.data || json;
      }
    } catch (e) {
      console.warn('[RiderUploadService] Signature request failed, falling back to proxy:', e);
    }

    onProgress?.(30);

    // Step 2: Prepare FormData
    const formData = new FormData();

    if (Platform.OS === 'web') {
      if (typeof fileUriOrBlob === 'string' && (fileUriOrBlob.startsWith('blob:') || fileUriOrBlob.startsWith('data:'))) {
        const res = await fetch(fileUriOrBlob);
        const blob = await res.blob();
        formData.append('file', blob, `rider_doc_${Date.now()}.jpg`);
      } else if (typeof fileUriOrBlob === 'string') {
        const res = await fetch(fileUriOrBlob);
        const blob = await res.blob();
        formData.append('file', blob, `rider_doc_${Date.now()}.jpg`);
      } else {
        formData.append('file', fileUriOrBlob);
      }
    } else {
      const uri = String(fileUriOrBlob);
      const uriParts = uri.split('/');
      const filename = uriParts[uriParts.length - 1] || `rider_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);
    }

    onProgress?.(50);

    let finalUrl = '';
    let publicId = '';

    // Direct resilient upload via backend proxy (100% authenticated Cloudinary upload)
    try {
      const proxyRes = await fetch(
        `${API_BASE_URL}/uploads/upload?folder=${encodeURIComponent(folder)}`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        },
      );
      const proxyData = await proxyRes.json();
      if (proxyRes.ok && (proxyData.data?.secure_url || proxyData.data?.url || proxyData.url)) {
        finalUrl = proxyData.data?.secure_url || proxyData.data?.url || proxyData.url;
        publicId = proxyData.data?.publicId || proxyData.data?.public_id || proxyData.publicId || '';
        onProgress?.(80);
      } else {
        throw new Error(proxyData.message || 'Server upload failed');
      }
    } catch (proxyErr: any) {
      throw new Error(`Upload failed: ${proxyErr.message || 'Network error'}`);
    }

    // Step 5: Save audit reference in DB
    if (finalUrl) {
      try {
        await fetch(`${API_BASE_URL}/uploads/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            url: finalUrl,
            publicId,
            resourceType,
            entityType,
            entityId,
            fieldName,
          }),
        });
      } catch (saveErr) {
        console.warn('[RiderUploadService] Save audit skipped:', saveErr);
      }
    }

    onProgress?.(100);

    return {
      success: true,
      url: finalUrl,
      publicId,
      message: 'Upload completed',
    };
  }
}

export const riderUploadService = new RiderUploadService();
