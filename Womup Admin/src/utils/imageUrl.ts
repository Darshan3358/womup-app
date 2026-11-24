import { Platform } from 'react-native';
import { getLocalProductAsset } from './localProductAssets';

const getUploadsBaseUrl = (): string => {
  return 'https://womup-app-uquz.onrender.com';
};

/**
 * Universal Image Source Resolver
 * Prioritizes 34 local bundled assets for 0ms loading, falling back to remote URLs.
 */
export const resolveProductImageSource = (
  url?: any,
  name?: string | null,
  slug?: string | null,
): any => {
  // If url is already an asset number (from require(...)) or direct source object
  if (typeof url === 'number' || (typeof url === 'object' && url && !url.uri)) {
    return url;
  }
  const rawUrl = typeof url === 'string' ? url : (url?.uri || '');

  // 1. If an explicit remote URL or data URI is provided, ALWAYS prioritize it so admin-updated images reflect immediately
  if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('/api/v1/uploads/'))) {
    const remote = resolveImageUrl(rawUrl);
    let optimizedRemote = remote || rawUrl;

    if (optimizedRemote.includes('res.cloudinary.com') && optimizedRemote.includes('/upload/')) {
      if (!optimizedRemote.includes('/upload/f_auto,q_auto') && !optimizedRemote.includes('/upload/w_')) {
        optimizedRemote = optimizedRemote.replace('/upload/', '/upload/f_auto,q_auto,w_400,h_400,c_pad,b_rgb:F7F7F7/');
      }
    }

    if (optimizedRemote.includes('images.unsplash.com')) {
      optimizedRemote = optimizedRemote
        .replace(/w=\d+/, 'w=400')
        .replace(/q=\d+/, 'q=80');
      if (!optimizedRemote.includes('auto=format')) {
        optimizedRemote = `${optimizedRemote}&auto=format`;
      }
    }

    return {
      uri: optimizedRemote,
      cache: 'force-cache',
    };
  }

  // 2. If no valid remote URL, check local bundled assets (by filename or product name)
  const local = getLocalProductAsset(rawUrl, name, slug);
  if (local) return local;

  // 3. Fallback placeholder
  return {
    uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80&auto=format',
    cache: 'force-cache',
  };
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

  // External HTTP/HTTPS URLs (Cloudinary, Unsplash, Google, Wikimedia, CDNs, etc.) - keep unchanged
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (!trimmed.includes('/uploads/files/products/')) {
      return trimmed;
    }
  }

  // If URL starts with api uploads path
  if (trimmed.startsWith('/api/v1/uploads/files/')) {
    const base = getUploadsBaseUrl();
    return `${base}${trimmed}`;
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

const _injectCloudinaryTransform = (url: string, transform: string): string => {
  const resolved = resolveImageUrl(url);
  if (!resolved.includes('res.cloudinary.com')) return resolved;
  return resolved.replace('/upload/', `/upload/${transform}/`);
};

export const resolveImageThumbnail = (url?: string | null): string =>
  _injectCloudinaryTransform(url || '', 'w_200,c_fill,q_auto,f_auto');

export const resolveImageDetail = (url?: string | null): string =>
  _injectCloudinaryTransform(url || '', 'w_800,c_limit,q_auto,f_auto');
