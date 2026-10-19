/**
 * Universal Image URL Resolver
 * Automatically resolves localhost/127.0.0.1 URLs to the public cloud URL
 * so images load identically across Web and Native mobile apps (Android/iOS).
 */
export const resolveImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URIs or local file paths
  if (trimmed.startsWith('data:') || trimmed.startsWith('file://')) {
    return trimmed;
  }

  // Localhost / 127.0.0.1 local server URLs
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    const filename = trimmed.split('/uploads/')[1] || trimmed.split('/').pop();
    if (filename) {
      return `https://womup-app-uquz.onrender.com/uploads/${filename}`;
    }
  }

  // Relative /uploads paths
  if (trimmed.startsWith('/uploads/')) {
    return `https://womup-app-uquz.onrender.com${trimmed}`;
  }

  // Insecure HTTP to HTTPS conversion for public render domain
  if (trimmed.startsWith('http://womup-app-uquz.onrender.com')) {
    return trimmed.replace('http://', 'https://');
  }

  return trimmed;
};
