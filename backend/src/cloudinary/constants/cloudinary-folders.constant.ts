export const CLOUDINARY_FOLDERS = {
  USERS_AVATARS: 'wormup/users/avatars',
  PRODUCTS_MAIN: 'wormup/products/main',
  PRODUCTS_GALLERY: 'wormup/products/gallery',
  PRODUCTS_VARIANTS: 'wormup/products/variants',
  CATEGORIES_ICONS: 'wormup/categories/icons',
  CATEGORIES_BANNERS: 'wormup/categories/banners',
  SUBCATEGORIES: 'wormup/subcategories',
  BRANDS_LOGOS: 'wormup/brands/logos',
  BANNERS_HOME: 'wormup/banners/home',
  BANNERS_FESTIVE: 'wormup/banners/festive',
  BANNERS_PROMOTIONAL: 'wormup/banners/promotional',
  PROMOTIONS: 'wormup/promotions',
  STORES: 'wormup/stores',
  PRINTING: 'wormup/printing',
} as const;

export type CloudinaryFolder = typeof CLOUDINARY_FOLDERS[keyof typeof CLOUDINARY_FOLDERS];
