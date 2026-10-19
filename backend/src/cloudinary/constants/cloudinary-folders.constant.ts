export const CLOUDINARY_FOLDERS = {
  USERS_AVATARS: 'womup/users/avatars',
  PRODUCTS_MAIN: 'womup/products/main',
  PRODUCTS_GALLERY: 'womup/products/gallery',
  PRODUCTS_VARIANTS: 'womup/products/variants',
  CATEGORIES_ICONS: 'womup/categories/icons',
  CATEGORIES_BANNERS: 'womup/categories/banners',
  SUBCATEGORIES: 'womup/subcategories',
  BRANDS_LOGOS: 'womup/brands/logos',
  BANNERS_HOME: 'womup/banners/home',
  BANNERS_FESTIVE: 'womup/banners/festive',
  BANNERS_PROMOTIONAL: 'womup/banners/promotional',
  PROMOTIONS: 'womup/promotions',
  STORES: 'womup/stores',
  PRINTING: 'womup/printing',

  // ── Customer KYC Folders ──
  CUSTOMER_AADHAAR_FRONT: 'womup/customer/kyc/aadhaar-front',
  CUSTOMER_AADHAAR_BACK: 'womup/customer/kyc/aadhaar-back',
  CUSTOMER_PROFILE: 'womup/customer/kyc/profile',

  // ── Rider KYC Folders ──
  RIDER_DL_FRONT: 'womup/rider/kyc/dl-front',
  RIDER_DL_BACK: 'womup/rider/kyc/dl-back',
  RIDER_RC_FRONT: 'womup/rider/kyc/rc-front',
  RIDER_RC_BACK: 'womup/rider/kyc/rc-back',
  RIDER_AADHAAR_FRONT: 'womup/rider/kyc/aadhaar-front',
  RIDER_AADHAAR_BACK: 'womup/rider/kyc/aadhaar-back',
  RIDER_INSURANCE: 'womup/rider/kyc/insurance',
  RIDER_PROFILE: 'womup/rider/kyc/profile',

  // ── Vendor KYC Folders ──
  VENDOR_AADHAAR_FRONT: 'womup/vendor/kyc/aadhaar-front',
  VENDOR_AADHAAR_BACK: 'womup/vendor/kyc/aadhaar-back',
  VENDOR_PAN: 'womup/vendor/kyc/pan-card',
  VENDOR_GST: 'womup/vendor/kyc/gst-cert',
  VENDOR_TRADE_LICENSE: 'womup/vendor/kyc/trade-license',
  VENDOR_CHEQUE: 'womup/vendor/kyc/cancelled-cheque',
  VENDOR_CARD: 'womup/vendor/kyc/business-card',
  VENDOR_SHOP: 'womup/vendor/kyc/shop-photo',
  VENDOR_OWNER: 'womup/vendor/kyc/owner-photo',

  // ── Dark Store KYC Folders ──
  STORE_LICENSE: 'womup/store/kyc/store-license',
  STORE_AADHAAR_FRONT: 'womup/store/kyc/owner-aadhaar-front',
  STORE_AADHAAR_BACK: 'womup/store/kyc/owner-aadhaar-back',
  STORE_PHOTOS: 'womup/store/kyc/shop-photos',
} as const;


export type CloudinaryFolder = typeof CLOUDINARY_FOLDERS[keyof typeof CLOUDINARY_FOLDERS];
