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

  // ── Customer KYC Folders ──
  CUSTOMER_AADHAAR_FRONT: 'wormup/customer/kyc/aadhaar-front',
  CUSTOMER_AADHAAR_BACK: 'wormup/customer/kyc/aadhaar-back',
  CUSTOMER_PROFILE: 'wormup/customer/kyc/profile',

  // ── Rider KYC Folders ──
  RIDER_DL_FRONT: 'wormup/rider/kyc/dl-front',
  RIDER_DL_BACK: 'wormup/rider/kyc/dl-back',
  RIDER_RC_FRONT: 'wormup/rider/kyc/rc-front',
  RIDER_RC_BACK: 'wormup/rider/kyc/rc-back',
  RIDER_AADHAAR_FRONT: 'wormup/rider/kyc/aadhaar-front',
  RIDER_AADHAAR_BACK: 'wormup/rider/kyc/aadhaar-back',
  RIDER_INSURANCE: 'wormup/rider/kyc/insurance',
  RIDER_PROFILE: 'wormup/rider/kyc/profile',

  // ── Vendor KYC Folders ──
  VENDOR_AADHAAR_FRONT: 'wormup/vendor/kyc/aadhaar-front',
  VENDOR_AADHAAR_BACK: 'wormup/vendor/kyc/aadhaar-back',
  VENDOR_PAN: 'wormup/vendor/kyc/pan-card',
  VENDOR_GST: 'wormup/vendor/kyc/gst-cert',
  VENDOR_TRADE_LICENSE: 'wormup/vendor/kyc/trade-license',
  VENDOR_CHEQUE: 'wormup/vendor/kyc/cancelled-cheque',
  VENDOR_CARD: 'wormup/vendor/kyc/business-card',
  VENDOR_SHOP: 'wormup/vendor/kyc/shop-photo',
  VENDOR_OWNER: 'wormup/vendor/kyc/owner-photo',

  // ── Dark Store KYC Folders ──
  STORE_LICENSE: 'wormup/store/kyc/store-license',
  STORE_AADHAAR_FRONT: 'wormup/store/kyc/owner-aadhaar-front',
  STORE_AADHAAR_BACK: 'wormup/store/kyc/owner-aadhaar-back',
  STORE_PHOTOS: 'wormup/store/kyc/shop-photos',
} as const;


export type CloudinaryFolder = typeof CLOUDINARY_FOLDERS[keyof typeof CLOUDINARY_FOLDERS];
