import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Schemas for Seeding
const StoreSchema = new mongoose.Schema(
  {
    name: String,
    code: String,
    address: String,
    city: String,
    pincode: String,
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
    },
    serviceRadiusKm: Number,
    estimatedDeliveryMinutes: Number,
    isActive: Boolean,
  },
  { collection: 'stores', timestamps: true },
);

const CategorySchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    image: String,
    icon: String,
    bgColor: String,
    sortOrder: Number,
    itemCount: Number,
    isActive: Boolean,
  },
  { collection: 'categories', timestamps: true },
);

const SubCategorySchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    icon: String,
    itemCount: Number,
    isActive: Boolean,
  },
  { collection: 'subcategories', timestamps: true },
);

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    brand: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
    imageUrl: String,
    images: [String],
    quantityLabel: String,
    mrp: Number,
    sellingPrice: Number,
    discountPercent: Number,
    shoppingCoins: Number,
    rating: Number,
    reviewCount: Number,
    deliveryMinutes: Number,
    isPopular: Boolean,
    isDeal: Boolean,
    description: String,
    specifications: Object,
    shelfLife: String,
    manufacturer: String,
    storageInstructions: String,
    stock: Number,
    isActive: Boolean,
  },
  { collection: 'products', timestamps: true },
);

const InventorySchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    availableQty: Number,
    reservedQty: Number,
    soldQty: Number,
    lowStockThreshold: Number,
  },
  { collection: 'inventory', timestamps: true },
);

const CouponSchema = new mongoose.Schema(
  {
    code: String,
    description: String,
    discountType: String,
    discountValue: Number,
    minOrderValue: Number,
    maxDiscountAmount: Number,
    isActive: Boolean,
    validFrom: Date,
    validUntil: Date,
    perUserLimit: Number,
  },
  { collection: 'coupons', timestamps: true },
);

const BannerSchema = new mongoose.Schema(
  {
    title: String,
    imageUrl: String,
    videoUrl: String,
    placement: String,
    sortOrder: Number,
    isActive: Boolean,
  },
  { collection: 'banners', timestamps: true },
);

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  const conn = await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB cluster:', conn.connection.host);

  const Store = mongoose.model('Store', StoreSchema);
  const Category = mongoose.model('Category', CategorySchema);
  const SubCategory = mongoose.model('SubCategory', SubCategorySchema);
  const Product = mongoose.model('Product', ProductSchema);
  const Inventory = mongoose.model('Inventory', InventorySchema);
  const Coupon = mongoose.model('Coupon', CouponSchema);
  const Banner = mongoose.model('Banner', BannerSchema);

  // 1. Seed Dark Stores
  console.log('Seeding Dark Stores...');
  await Store.deleteMany({});
  const primaryStore = await Store.create({
    name: 'Worm Up Ahmedabad Central Dark Store',
    code: 'DARK-STORE-01',
    address: 'Near Corporate Road, Prahlad Nagar',
    city: 'Ahmedabad',
    pincode: '380015',
    location: {
      type: 'Point',
      coordinates: [72.5074, 23.0138], // [lng, lat]
    },
    serviceRadiusKm: 12,
    estimatedDeliveryMinutes: 9,
    isActive: true,
  });
  console.log(`Created Dark Store: ${primaryStore.name} (${primaryStore.code})`);

  // 2. Seed Categories
  console.log('Seeding Categories...');
  await Category.deleteMany({});
  await SubCategory.deleteMany({});

  const categoriesData = [
    {
      name: 'Cooking Essentials',
      slug: 'cooking',
      icon: 'restaurant-outline',
      bgColor: '#FCE1F5',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
      itemCount: 142,
      sortOrder: 1,
    },
    {
      name: 'Snacks & Beverages',
      slug: 'snacks',
      icon: 'cafe-outline',
      bgColor: '#E2E6F9',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80',
      itemCount: 98,
      sortOrder: 2,
    },
    {
      name: 'Dairy & Bakery',
      slug: 'dairy',
      icon: 'nutrition-outline',
      bgColor: '#EBF0FF',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
      itemCount: 76,
      sortOrder: 3,
    },
    {
      name: 'Fruits & Vegetables',
      slug: 'fruits',
      icon: 'leaf-outline',
      bgColor: '#E6F9F0',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80',
      itemCount: 110,
      sortOrder: 4,
    },
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      icon: 'headphones',
      bgColor: '#F9EAFC',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
      itemCount: 64,
      sortOrder: 5,
    },
    {
      name: 'Beauty & Personal Care',
      slug: 'beauty',
      icon: 'beauty',
      bgColor: '#E9EBF8',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80',
      itemCount: 88,
      sortOrder: 6,
    },
    {
      name: 'Ganeshotsav Festive Store',
      slug: 'ganeshotsav',
      icon: 'ganesh',
      bgColor: '#FFF0F5',
      image: 'https://images.unsplash.com/photo-1597072689227-8882273e8f6a?w=300&q=80',
      itemCount: 45,
      sortOrder: 7,
    },
  ];

  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of categoriesData) {
    const created = await Category.create({ ...cat, isActive: true });
    categoryMap.set(cat.slug, created._id);

    // Create subcategory
    await SubCategory.create({
      name: `All ${cat.name}`,
      slug: `${cat.slug}-all`,
      categoryId: created._id,
      icon: cat.icon,
      itemCount: cat.itemCount,
      isActive: true,
    });
  }
  console.log(`Seeded ${categoriesData.length} Categories and Subcategories`);

  // 3. Seed Products from React Native Catalog
  console.log('Seeding Products...');
  await Product.deleteMany({});
  await Inventory.deleteMany({});

  const productsData = [
    {
      name: 'Amul Taaza Homogenised Toned Milk',
      slug: 'amul-taaza-toned-milk-1l',
      brand: 'Amul',
      categorySlug: 'dairy',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80',
      images: [
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80',
        'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80',
      ],
      quantityLabel: '1 Litre',
      mrp: 74,
      sellingPrice: 70,
      discountPercent: 5,
      shoppingCoins: 7,
      rating: 4.8,
      reviewCount: 3410,
      deliveryMinutes: 9,
      isPopular: true,
      isDeal: false,
      description: 'Amul Taaza Toned Milk is pasteurized and homogenized to preserve freshness. Enriched with Vitamin A and Vitamin D.',
      shelfLife: '120 days',
      manufacturer: 'Gujarat Co-operative Milk Marketing Federation Ltd.',
      storageInstructions: 'Store in cool and dry place. Once opened, keep refrigerated.',
      stock: 120,
    },
    {
      name: 'Citizen Raincoat With Zip - Free Size (Transparent)',
      slug: 'citizen-raincoat-with-zip-free-size',
      brand: 'Citizen',
      categorySlug: 'cooking',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80',
      images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80',
      ],
      quantityLabel: '1 pc',
      mrp: 449,
      sellingPrice: 329,
      discountPercent: 27,
      shoppingCoins: 25,
      rating: 4.2,
      reviewCount: 827,
      deliveryMinutes: 9,
      isPopular: true,
      isDeal: true,
      description: 'Heavy duty waterproof transparent raincoat with attached hood and full zip closure. Built for monsoon protection.',
      shelfLife: '3 Years',
      manufacturer: 'Citizen Polytech Pvt Ltd.',
      storageInstructions: 'Keep away from sharp objects.',
      stock: 45,
    },
    {
      name: 'Fortune Sunlite Refined Sunflower Oil',
      slug: 'fortune-sunlite-sunflower-oil-1l',
      brand: 'Fortune',
      categorySlug: 'cooking',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80',
      images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80'],
      quantityLabel: '1 Litre Pouch',
      mrp: 170,
      sellingPrice: 145,
      discountPercent: 15,
      shoppingCoins: 12,
      rating: 4.6,
      reviewCount: 1890,
      deliveryMinutes: 9,
      isPopular: true,
      isDeal: true,
      description: 'Fortune Sunlite Refined Sunflower Oil is light and healthy, rich in natural vitamins and low in absorbable fats.',
      shelfLife: '9 Months',
      manufacturer: 'Adani Wilmar Limited',
      storageInstructions: 'Store in a dry place away from sunlight.',
      stock: 80,
    },
    {
      name: 'Maggi 2-Minute Noodles - Masala',
      slug: 'maggi-2-minute-noodles-masala-280g',
      brand: 'Maggi',
      categorySlug: 'snacks',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80',
      images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80'],
      quantityLabel: 'Pack of 4 (280 g)',
      mrp: 60,
      sellingPrice: 56,
      discountPercent: 7,
      shoppingCoins: 5,
      rating: 4.9,
      reviewCount: 9240,
      deliveryMinutes: 9,
      isPopular: true,
      isDeal: false,
      description: 'Favorite instant noodles made with quality spices. Quick 2-minute snack for any craving.',
      shelfLife: '8 Months',
      manufacturer: 'Nestlé India Limited',
      storageInstructions: 'Store in a cool, dry and hygienic place.',
      stock: 250,
    },
    {
      name: 'Lays India Magic Masala Potato Chips',
      slug: 'lays-india-magic-masala-chips-50g',
      brand: "Lay's",
      categorySlug: 'snacks',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80',
      images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80'],
      quantityLabel: '50 g',
      mrp: 20,
      sellingPrice: 20,
      discountPercent: 0,
      shoppingCoins: 2,
      rating: 4.7,
      reviewCount: 4200,
      deliveryMinutes: 9,
      isPopular: true,
      isDeal: false,
      description: 'Crispy potato slices infused with rich Indian aromatic spices.',
      shelfLife: '4 Months',
      manufacturer: 'PepsiCo India Holdings Pvt Ltd.',
      storageInstructions: 'Consume immediately after opening.',
      stock: 300,
    },
    {
      name: 'Fresh Farm Green Capsicum',
      slug: 'fresh-farm-green-capsicum-500g',
      brand: 'Fresh Farm',
      categorySlug: 'fruits',
      imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&q=80',
      images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&q=80'],
      quantityLabel: '500 g',
      mrp: 45,
      sellingPrice: 38,
      discountPercent: 15,
      shoppingCoins: 3,
      rating: 4.4,
      reviewCount: 520,
      deliveryMinutes: 9,
      isPopular: false,
      isDeal: true,
      description: 'Crisp, garden-fresh green capsicum hand-picked from verified organic farms.',
      shelfLife: '4 Days',
      manufacturer: 'Worm Up Farm Direct',
      storageInstructions: 'Keep refrigerated in vegetable crisper.',
      stock: 60,
    },
    {
      name: 'Portronics Harmonics 216 Wireless Earphones',
      slug: 'portronics-harmonics-216-wireless-earphones',
      brand: 'Portronics',
      categorySlug: 'electronics',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
      quantityLabel: '1 unit (Black)',
      mrp: 1499,
      sellingPrice: 699,
      discountPercent: 53,
      shoppingCoins: 60,
      rating: 4.3,
      reviewCount: 1450,
      deliveryMinutes: 9,
      isPopular: true,
      isDeal: true,
      description: 'Bluetooth 5.0 wireless neckband earphones with 12 hours playtime and deep bass drivers.',
      shelfLife: '1 Year Warranty',
      manufacturer: 'Portronics Digital Pvt Ltd.',
      storageInstructions: 'Store in dry place.',
      stock: 35,
    },
    {
      name: 'L’Oréal Paris Hyaluron Moisture Shampoo',
      slug: 'loreal-paris-hyaluron-moisture-shampoo-180ml',
      brand: "L'Oréal",
      categorySlug: 'beauty',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80',
      images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80'],
      quantityLabel: '180 ml',
      mrp: 209,
      sellingPrice: 179,
      discountPercent: 14,
      shoppingCoins: 15,
      rating: 4.5,
      reviewCount: 780,
      deliveryMinutes: 9,
      isPopular: true,
      isDeal: false,
      description: 'Hydrating shampoo with hyaluronic acid for 72 hours of weightless hydration and shine.',
      shelfLife: '36 Months',
      manufacturer: "L'Oréal India Pvt Ltd.",
      storageInstructions: 'Avoid direct eye contact.',
      stock: 50,
    },
  ];

  for (const p of productsData) {
    const catId = categoryMap.get(p.categorySlug) || categoryMap.get('cooking');
    const product = await Product.create({
      ...p,
      categoryId: catId,
      isActive: true,
    });

    // Create Dark Store inventory record
    await Inventory.create({
      storeId: primaryStore._id,
      productId: product._id,
      availableQty: p.stock,
      reservedQty: 0,
      soldQty: 12,
      lowStockThreshold: 10,
    });
  }
  console.log(`Seeded ${productsData.length} Products with real Dark Store inventory`);

  // 4. Seed Coupons
  console.log('Seeding Promotional Coupons...');
  await Coupon.deleteMany({});
  await Coupon.create([
    {
      code: 'WELCOME50',
      description: 'Flat ₹50 OFF on your first order above ₹199',
      discountType: 'FLAT',
      discountValue: 50,
      minOrderValue: 199,
      maxDiscountAmount: 50,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      perUserLimit: 1,
    },
    {
      code: 'WORM100',
      description: 'Flat ₹100 OFF on orders above ₹499',
      discountType: 'FLAT',
      discountValue: 100,
      minOrderValue: 499,
      maxDiscountAmount: 100,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      perUserLimit: 3,
    },
    {
      code: 'FESTIVE20',
      description: '20% OFF on Festive & Pooja essentials up to ₹75',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 299,
      maxDiscountAmount: 75,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      perUserLimit: 2,
    },
  ]);

  // 5. Seed Promotional Banners
  console.log('Seeding Home Banners...');
  await Banner.deleteMany({});
  await Banner.create([
    {
      title: 'Double Masala Maggi Special',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      videoUrl: 'create_this_banner_as_gif_Crea.mp4',
      placement: 'HOME_HERO',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Celebrate Ganesh Chaturthi with Fresh Modak & Pooja Needs',
      imageUrl: 'https://images.unsplash.com/photo-1597072689227-8882273e8f6a?w=800&q=80',
      placement: 'FESTIVE_RAIL',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'Monsoon Care & Raincoat Store',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
      placement: 'CATEGORY_SPOTLIGHT',
      sortOrder: 3,
      isActive: true,
    },
  ]);

  console.log('\n✅ Database seeding completed successfully into MongoDB Atlas!');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
