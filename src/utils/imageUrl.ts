import { Platform } from 'react-native';

const getUploadsBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5050';
    }
  }

  // React Native Native platforms (Android emulator vs iOS)
  if (typeof Platform !== 'undefined') {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5050';
      }
      return 'http://localhost:5050';
    }
  }

  return 'https://womup-app-uquz.onrender.com';
};

/**
 * Universal Image URL Resolver
 * Automatically resolves image URLs accurately between local development
 * environments and cloud production so images load identically across Web
 * and Native mobile apps without ERR_BLOCKED_BY_ORB or 404s.
 */
export const resolveImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URIs or local file paths
  if (trimmed.startsWith('data:') || trimmed.startsWith('file://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // External CDN URLs (Cloudinary, Unsplash, Google, etc.) - keep unchanged
  if (
    trimmed.includes('res.cloudinary.com') ||
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('googleusercontent.com')
  ) {
    return trimmed;
  }

  // If the URL contains an /uploads/ asset path
  if (trimmed.includes('/uploads/')) {
    const filename = trimmed.split('/uploads/')[1]?.split('?')[0];
    if (filename) {
      const base = getUploadsBaseUrl();
      return `${base}/uploads/${filename}`;
    }
  }

  // Relative /uploads paths
  if (trimmed.startsWith('/uploads/')) {
    const base = getUploadsBaseUrl();
    return `${base}${trimmed}`;
  }

  // Insecure HTTP to HTTPS conversion for public render domain
  if (trimmed.startsWith('http://womup-app-uquz.onrender.com')) {
    return trimmed.replace('http://', 'https://');
  }

  return trimmed;
};

// ─── Cloudinary Transformation Helpers (SRS §9.1) ────────────────────────────

/**
 * Injects Cloudinary size + quality transforms into an upload URL.
 * Produces: /upload/<transforms>/v.../filename
 * Non-Cloudinary URLs are passed through resolveImageUrl unchanged.
 */
const _injectCloudinaryTransform = (url: string, transform: string): string => {
  const resolved = resolveImageUrl(url);
  if (!resolved.includes('res.cloudinary.com')) return resolved;
  // Insert transforms between /upload/ and the version/public-id segment
  return resolved.replace('/upload/', `/upload/${transform}/`);
};

/**
 * Returns a ~200 px wide thumbnail URL for product cards.
 * Cloudinary: w_200,c_fill,q_auto,f_auto  (~15–30 KB typical)
 */
export const resolveImageThumbnail = (url?: string | null): string =>
  _injectCloudinaryTransform(url || '', 'w_200,c_fill,q_auto,f_auto');

/**
 * Returns a full-quality image URL for product-detail screens.
 * Cloudinary: w_800,c_limit,q_auto,f_auto
 */
export const resolveImageDetail = (url?: string | null): string =>
  _injectCloudinaryTransform(url || '', 'w_800,c_limit,q_auto,f_auto');

