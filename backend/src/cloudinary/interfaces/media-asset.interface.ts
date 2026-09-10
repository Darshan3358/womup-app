export interface MediaAsset {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  alt?: string;
}

export interface CloudinaryOptimizedOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'fit' | 'thumb' | 'limit' | string;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}
