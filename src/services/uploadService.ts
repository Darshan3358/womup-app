import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

export interface UploadOptions {
  folder?: string;
  entityType?: 'customer' | 'rider' | 'vendor' | 'store' | 'user';
  entityId?: string;
  fieldName?: string; // e.g. 'aadharFront', 'aadharBack', 'panCard', 'dlFront'
  resourceType?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  publicId?: string;
  bytes?: number;
  format?: string;
  message?: string;
}

// Native-safe XHR multipart uploader (avoids Expo 57 / React Native 0.86 New Architecture WinterCG fetch FormData errors)
function sendMultipartXhr(
  url: string,
  formData: FormData,
  headers?: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (headers) {
      Object.entries(headers).forEach(([k, v]) => {
        if (k.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(k, v);
        }
      });
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const pct = Math.min(95, Math.round((event.loaded / event.total) * 100));
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      let data: any;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = { text: xhr.responseText };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        const errorMsg = data?.message || data?.error || `Upload failed with HTTP ${xhr.status}`;
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload. Please check your connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Please try again.'));
    };

    xhr.timeout = 90000;
    xhr.send(formData);
  });
}

class UniversalUploadService {
  /**
   * Helper to retrieve auth token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const token =
        (await AsyncStorage.getItem('@womup_auth_token')) ||
        (await AsyncStorage.getItem('accessToken')) ||
        (await AsyncStorage.getItem('@womup_token'));
      return token;
    } catch {
      return null;
    }
  }

  /**
   * Main Upload Method:
   * 1. Fetches upload signature from backend with auth token
   * 2. Direct signed upload to Cloudinary
   * 3. Fallback to backend multipart proxy if permissions or direct upload fails
   * 4. Saves reference in database
   */
  async uploadMedia(
    fileUriOrBlob: string | any,
    options: UploadOptions = {},
  ): Promise<UploadResponse> {
    const {
      folder = 'wormup/customer/kyc',
      entityType,
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

    // ── STEP 1: Request signed Cloudinary upload params from backend ──
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
      } else {
        console.warn(`[UploadService] Signature returned ${sigRes.status}, falling back to proxy.`);
      }
    } catch (sigErr) {
      console.warn('[UploadService] Signature request failed, falling back to proxy:', sigErr);
    }

    onProgress?.(30);

    // ── STEP 2: Prepare FormData for Web or React Native ──
    const formData = new FormData();

    if (Platform.OS === 'web') {
      if (typeof fileUriOrBlob === 'string' && (fileUriOrBlob.startsWith('blob:') || fileUriOrBlob.startsWith('data:'))) {
        const res = await fetch(fileUriOrBlob);
        const blob = await res.blob();
        const ext = blob.type.split('/')[1] || 'jpg';
        const filename = `doc_${Date.now()}.${ext}`;
        formData.append('file', blob, filename);
      } else if (typeof fileUriOrBlob === 'string') {
        const res = await fetch(fileUriOrBlob);
        const blob = await res.blob();
        formData.append('file', blob, `file_${Date.now()}.jpg`);
      } else {
        formData.append('file', fileUriOrBlob);
      }
    } else {
      // Native iOS / Android file object
      const uri = String(fileUriOrBlob);
      const uriParts = uri.split('/');
      const filename = uriParts[uriParts.length - 1] || `upload_${Date.now()}.jpg`;
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

    // ── STEP 3: Execute Upload via Backend Service (Resilient with local storage fallback) ──
    try {
      const proxyData = await sendMultipartXhr(
        `${API_BASE_URL}/uploads/upload?folder=${encodeURIComponent(folder)}`,
        formData,
        token ? { Authorization: `Bearer ${token}` } : undefined,
        (p) => onProgress?.(Math.round(50 + p * 0.3)),
      );

      if (proxyData && (proxyData.data?.url || proxyData.data?.secure_url || proxyData.url)) {
        finalUrl = proxyData.data?.url || proxyData.data?.secure_url || proxyData.url;
        publicId = proxyData.data?.publicId || proxyData.data?.public_id || proxyData.publicId || '';
        onProgress?.(80);
      } else {
        throw new Error(
          proxyData?.message || proxyData?.error || 'Backend proxy upload failed.',
        );
      }
    } catch (proxyErr: any) {
      // Optional fallback: attempt direct Cloudinary upload if signature is provided
      if (signatureData?.uploadUrl && signatureData?.apiKey && signatureData?.signature) {
        try {
          formData.append('api_key', signatureData.apiKey);
          formData.append('timestamp', String(signatureData.timestamp));
          formData.append('signature', signatureData.signature);
          formData.append('folder', signatureData.folder || folder);
          if (signatureData.publicId) {
            formData.append('public_id', signatureData.publicId);
          }

          const cloudData = await sendMultipartXhr(
            signatureData.uploadUrl,
            formData,
            undefined,
            (p) => onProgress?.(Math.round(50 + p * 0.3)),
          );

          if (cloudData && (cloudData.secure_url || cloudData.url)) {
            finalUrl = cloudData.secure_url || cloudData.url;
            publicId = cloudData.public_id || signatureData.publicId || '';
            onProgress?.(80);
          }
        } catch {
          // Ignore secondary fallback errors
        }
      }

      if (!finalUrl) {
        throw new Error(`Upload failed: ${proxyErr.message || 'Unknown network error'}`);
      }
    }

    // ── STEP 5: Save record to MongoDB and associate with Entity ──
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
        console.warn('[UploadService] Save audit skipped:', saveErr);
      }
    }

    onProgress?.(100);

    return {
      success: true,
      url: finalUrl,
      publicId,
      message: 'Upload completed successfully',
    };
  }
}

export const uploadService = new UniversalUploadService();
