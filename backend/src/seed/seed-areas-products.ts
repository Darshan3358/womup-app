/**
 * Seed Script: Ahmedabad Delivery Zones + Sample Products + Area Pricing
 * Run: npx ts-node -r tsconfig-paths/register src/seed/seed-areas-products.ts
 */
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wormup';

// ─── Schemas (inline for seed script independence) ───────────────────────────
const AreaSchema = new mongoose.Schema({ name: String, city: String, pincodes: [String], centerLat: Number, centerLng: Number, radiusKm: { default: 3.5, type: Number }, defaultDeliveryMinutes: { default: 9, type: Number }, sortOrder: { default: 0, type: Number }, isActive: { default: true, type: Boolean } }, { timestamps: true, collection: 'areas' });
const CategorySchema = new mongoose.Schema({ name: String, slug: String, icon: String, bgColor: String, sortOrder: Number, isActive: { default: true, type: Boolean } }, { timestamps: true, collection: 'categories' });
const ProductSchema = new mongoose.Schema({ name: String, slug: String, brand: String, categoryId: mongoose.Schema.Types.ObjectId, imageUrl: String, images: [String], mrp: Number, sellingPrice: Number, discountPercent: { default: 0, type: Number }, shoppingCoins: { default: 10, type: Number }, rating: { default: 4.5, type: Number }, reviewCount: { default: 50, type: Number }, deliveryMinutes: { default: 9, type: Number }, isPopular: { default: false, type: Boolean }, isDeal: { default: false, type: Boolean }, description: String, specifications: { type: Object, default: {} }, isActive: { default: true, type: Boolean } }, { timestamps: true, collection: 'products' });
const VariantSchema = new mongoose.Schema({ productId: mongoose.Schema.Types.ObjectId, sku: String, weightOrVolume: String, mrp: Number, sellingPrice: Number, discountPercent: { default: 0, type: Number }, isDefault: { default: false, type: Boolean }, isActive: { default: true, type: Boolean } }, { timestamps: true, collection: 'product_variants' });
const AreaPricingSchema = new mongoose.Schema({ productId: mongoose.Schema.Types.ObjectId, variantId: mongoose.Schema.Types.ObjectId, areaId: mongoose.Schema.Types.ObjectId, price: Number, mrp: Number, discountPercent: { default: 0, type: Number }, stock: { default: 100, type: Number }, isAvailable: { default: true, type: Boolean } }, { timestamps: true, collection: 'area_pricing' });
AreaPricingSchema.index({ productId: 1, variantId: 1, areaId: 1 }, { unique: true });

const AreaModel = mongoose.model('Area', AreaSchema);
const CategoryModel = mongoose.model('Category', CategorySchema);
const ProductModel = mongoose.model('Product', ProductSchema);
const VariantModel = mongoose.model('ProductVariant', VariantSchema);
const AreaPricingModel = mongoose.model('AreaPricing', AreaPricingSchema);

// ─── Ahmedabad Delivery Zones ────────────────────────────────────────────────
const AREAS = [
  { name: 'Prahlad Nagar', city: 'Ahmedabad', pincodes: ['380015'], centerLat: 23.0141, centerLng: 72.5067, radiusKm: 3.5, defaultDeliveryMinutes: 9, sortOrder: 0 },
  { name: 'Satellite', city: 'Ahmedabad', pincodes: ['380015'], centerLat: 23.0267, centerLng: 72.5074, radiusKm: 3.0, defaultDeliveryMinutes: 10, sortOrder: 1 },
  { name: 'Navrangpura', city: 'Ahmedabad', pincodes: ['380009'], centerLat: 23.0395, centerLng: 72.5603, radiusKm: 3.0, defaultDeliveryMinutes: 9, sortOrder: 2 },
  { name: 'Ghatlodia', city: 'Ahmedabad', pincodes: ['380061'], centerLat: 23.0729, centerLng: 72.5613, radiusKm: 3.5, defaultDeliveryMinutes: 11, sortOrder: 3 },
  { name: 'Bopal', city: 'Ahmedabad', pincodes: ['380058'], centerLat: 23.0234, centerLng: 72.4651, radiusKm: 4.0, defaultDeliveryMinutes: 12, sortOrder: 4 },
  { name: 'SG Highway', city: 'Ahmedabad', pincodes: ['380054'], centerLat: 23.0380, centerLng: 72.4972, radiusKm: 4.0, defaultDeliveryMinutes: 10, sortOrder: 5 },
  { name: 'Thaltej', city: 'Ahmedabad', pincodes: ['380054'], centerLat: 23.0623, centerLng: 72.5106, radiusKm: 3.5, defaultDeliveryMinutes: 11, sortOrder: 6 },
];

// ─── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Vegetables & Fruits', slug: 'vegetables-fruits', icon: '🥦', bgColor: '#E8F5E9' },
  { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', icon: '🥛', bgColor: '#FFF8E1' },
  { name: 'Snacks & Drinks', slug: 'snacks-drinks', icon: '🧃', bgColor: '#FCE4EC' },
  { name: 'Cooking Essentials', slug: 'cooking-essentials', icon: '🧄', bgColor: '#F3E5F5' },
];

// ─── Products with Variants ───────────────────────────────────────────────────
// Format: { name, slug, brand, categorySlug, imageUrl, isPopular, description, variants: [{label, basePrice, baseMrp}] }
// Area pricing adds ±20% variation per zone
const PRODUCTS_DATA = [
  // Vegetables & Fruits
  { name: 'Fresh Tomato', slug: 'fresh-tomato', brand: 'Farm Fresh', cat: 'vegetables-fruits', imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80', isPopular: true, isDeal: false, description: 'Fresh red tomatoes, organically grown in Gujarat farms.', variants: [{ l: '250 g', p: 12, m: 15 }, { l: '500 g', p: 22, m: 28 }, { l: '1 kg', p: 40, m: 50, def: true }, { l: '2 kg', p: 76, m: 95 }] },
  { name: 'Potato', slug: 'potato', brand: 'Farm Fresh', cat: 'vegetables-fruits', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', isPopular: true, isDeal: false, description: 'Washed and cleaned potatoes ready to cook.', variants: [{ l: '500 g', p: 18, m: 22 }, { l: '1 kg', p: 34, m: 42, def: true }, { l: '2 kg', p: 65, m: 80 }, { l: '5 kg', p: 155, m: 190 }] },
  { name: 'Onion', slug: 'onion', brand: 'Farm Fresh', cat: 'vegetables-fruits', imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80', isPopular: false, isDeal: false, description: 'Nasik red onions, mild and sweet.', variants: [{ l: '500 g', p: 20, m: 25 }, { l: '1 kg', p: 38, m: 47, def: true }, { l: '2 kg', p: 72, m: 90 }, { l: '5 kg', p: 175, m: 220 }] },
  { name: 'Banana', slug: 'banana', brand: 'Farm Fresh', cat: 'vegetables-fruits', imageUrl: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&q=80', isPopular: true, isDeal: false, description: 'Sweet and ripe Robusta bananas from Surat.', variants: [{ l: '6 pcs', p: 30, m: 38, def: true }, { l: '12 pcs', p: 58, m: 72 }] },
  { name: 'Capsicum', slug: 'capsicum', brand: 'Farm Fresh', cat: 'vegetables-fruits', imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80', isPopular: false, isDeal: false, description: 'Crunchy green capsicums.', variants: [{ l: '250 g', p: 18, m: 22 }, { l: '500 g', p: 34, m: 42, def: true }] },
  { name: 'Apple (Himachali)', slug: 'apple-himachali', brand: 'Himalayan Fresh', cat: 'vegetables-fruits', imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80', isPopular: true, isDeal: true, description: 'Fresh Himachali apples, crisp and sweet.', variants: [{ l: '500 g', p: 60, m: 75 }, { l: '1 kg', p: 115, m: 145, def: true }] },

  // Dairy & Breakfast
  { name: 'Amul Taza Milk', slug: 'amul-taza-milk', brand: 'Amul', cat: 'dairy-breakfast', imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', isPopular: true, isDeal: false, description: 'Fresh standardised Amul Taza milk, 3% fat.', variants: [{ l: '500 ml', p: 26, m: 28 }, { l: '1 L', p: 50, m: 54, def: true }] },
  { name: 'Curd (Dahi)', slug: 'curd-dahi', brand: 'Amul', cat: 'dairy-breakfast', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', isPopular: false, isDeal: false, description: 'Smooth and creamy set curd.', variants: [{ l: '200 g', p: 22, m: 25, def: true }, { l: '400 g', p: 42, m: 48 }, { l: '1 kg', p: 98, m: 115 }] },
  { name: 'Paneer', slug: 'paneer', brand: 'Amul', cat: 'dairy-breakfast', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80', isPopular: true, isDeal: false, description: 'Fresh soft cottage cheese.', variants: [{ l: '200 g', p: 75, m: 88 }, { l: '500 g', p: 185, m: 215, def: true }] },
  { name: 'Bread (Brown)', slug: 'brown-bread', brand: 'Britannia', cat: 'dairy-breakfast', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', isPopular: true, isDeal: false, description: 'Soft wholegrain brown bread.', variants: [{ l: '200 g', p: 35, m: 42, def: true }, { l: '400 g', p: 65, m: 78 }] },

  // Snacks & Drinks
  { name: 'Water Bottle', slug: 'water-bottle', brand: 'Bisleri', cat: 'snacks-drinks', imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&q=80', isPopular: false, isDeal: false, description: 'Bisleri packaged drinking water.', variants: [{ l: '500 ml', p: 10, m: 12 }, { l: '1 L', p: 20, m: 24, def: true }, { l: '2 L', p: 38, m: 45 }] },
  { name: 'Lay\'s Chips (Classic)', slug: 'lays-classic', brand: 'PepsiCo', cat: 'snacks-drinks', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', isPopular: true, isDeal: true, description: 'Classic salted potato chips.', variants: [{ l: '26 g', p: 20, m: 20 }, { l: '52 g', p: 38, m: 40, def: true }, { l: '114 g', p: 78, m: 80 }] },
  { name: 'Tropicana Orange', slug: 'tropicana-orange', brand: 'PepsiCo', cat: 'snacks-drinks', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80', isPopular: false, isDeal: false, description: '100% pure orange juice.', variants: [{ l: '200 ml', p: 28, m: 32 }, { l: '1 L', p: 110, m: 130, def: true }] },

  // Cooking Essentials
  { name: 'Fortune Sunflower Oil', slug: 'fortune-sunflower-oil', brand: 'Fortune', cat: 'cooking-essentials', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', isPopular: true, isDeal: false, description: 'Light and healthy sunflower oil.', variants: [{ l: '500 ml', p: 65, m: 78 }, { l: '1 L', p: 125, m: 150, def: true }, { l: '2 L', p: 245, m: 295 }, { l: '5 L', p: 598, m: 720 }] },
  { name: 'Tata Salt', slug: 'tata-salt', brand: 'Tata', cat: 'cooking-essentials', imageUrl: 'https://images.unsplash.com/photo-1598449356475-b9f71db7d847?w=400&q=80', isPopular: false, isDeal: false, description: 'Iodised vacuum evaporated salt.', variants: [{ l: '1 kg', p: 24, m: 26, def: true }] },
  { name: 'Aashirvaad Atta', slug: 'aashirvaad-atta', brand: 'ITC', cat: 'cooking-essentials', imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80', isPopular: true, isDeal: false, description: 'Superior MP wheat atta, soft rotis guaranteed.', variants: [{ l: '1 kg', p: 60, m: 72 }, { l: '5 kg', p: 285, m: 340, def: true }, { l: '10 kg', p: 560, m: 670 }] },
  { name: 'India Gate Basmati Rice', slug: 'india-gate-basmati', brand: 'KRBL', cat: 'cooking-essentials', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', isPopular: true, isDeal: false, description: 'Extra long grain premium basmati rice.', variants: [{ l: '1 kg', p: 95, m: 115 }, { l: '5 kg', p: 460, m: 560, def: true }] },
];

const DEFAULT_SPECS_MAP: Record<string, Record<string, string>> = {
  'fresh-tomato': {
    'Type': 'Organically Grown Red Tomatoes',
    'Shelf Life': '4 - 6 Days',
    'Origin': 'Gujarat Direct Sourced Farms',
    'Storage Instructions': 'Keep in cool, dry place away from moisture',
    'Nutritional Benefits': 'Rich in Vitamin C, Lycopene & Potassium',
    'FSSAI License': '10018021003456',
    'Country of Origin': 'India',
  },
  'potato': {
    'Type': 'Washed Fresh Tubers',
    'Shelf Life': '10 - 15 Days',
    'Origin': 'Deesa, Gujarat',
    'Storage Instructions': 'Store in a cool, dark, well-ventilated space',
    'Best For': 'Curries, boiling, roasting & chaats',
    'Country of Origin': 'India',
  },
  'onion': {
    'Type': 'Nashik Medium Red Onions',
    'Shelf Life': '12 - 18 Days',
    'Origin': 'Nashik, Maharashtra',
    'Storage Instructions': 'Keep in airy mesh basket at room temperature',
    'Country of Origin': 'India',
  },
  'banana': {
    'Type': 'Ripe Robusta Bananas',
    'Shelf Life': '3 - 5 Days',
    'Origin': 'Surat, Gujarat',
    'Storage Instructions': 'Store at room temperature',
    'Country of Origin': 'India',
  },
  'capsicum': {
    'Type': 'Crisp Green Bell Peppers',
    'Shelf Life': '5 - 7 Days',
    'Origin': 'Vadodara, Gujarat',
    'Storage Instructions': 'Refrigerate in vegetable crisper',
    'Country of Origin': 'India',
  },
  'apple-himachali': {
    'Type': 'Himachal Royal Delicious Apples',
    'Shelf Life': '7 - 10 Days',
    'Origin': 'Shimla, Himachal Pradesh',
    'Storage Instructions': 'Store in refrigerator',
    'Country of Origin': 'India',
  },
  'amul-taza-milk': {
    'Brand': 'Amul',
    'Type': 'Pasteurised Toned Milk',
    'Fat / SNF': '3.0% Fat, 8.5% SNF',
    'Shelf Life': '2 Days',
    'Storage Instructions': 'Refrigerate below 4°C at all times',
    'Manufacturer': 'GCMMF Ltd., Anand, Gujarat',
    'FSSAI License': '10012021000071',
    'Country of Origin': 'India',
  },
  'curd-dahi': {
    'Brand': 'Amul',
    'Type': 'Pasteurised Toned Curd',
    'Shelf Life': '7 Days',
    'Storage Instructions': 'Keep refrigerated below 4°C',
    'Manufacturer': 'GCMMF Ltd., Anand, Gujarat',
    'Country of Origin': 'India',
  },
  'paneer': {
    'Brand': 'Amul',
    'Type': 'Fresh Malai Paneer',
    'Shelf Life': '5 Days',
    'Storage Instructions': 'Keep refrigerated in water',
    'Manufacturer': 'GCMMF Ltd., Anand, Gujarat',
    'Country of Origin': 'India',
  },
  'brown-bread': {
    'Brand': 'Britannia',
    'Type': '100% Whole Wheat Bread',
    'Shelf Life': '5 Days',
    'Storage Instructions': 'Keep sealed in cool, dry place',
    'Manufacturer': 'Britannia Industries Ltd.',
    'Country of Origin': 'India',
  },
  'water-bottle': {
    'Brand': 'Bisleri',
    'Type': 'Packaged Drinking Water with Added Minerals',
    'Shelf Life': '6 Months',
    'Manufacturer': 'Bisleri International Pvt. Ltd.',
    'Country of Origin': 'India',
  },
  'lays-classic': {
    'Brand': "Lay's (PepsiCo)",
    'Type': 'Crispy Salted Potato Chips',
    'Shelf Life': '4 Months',
    'Diet Type': 'Vegetarian',
    'Manufacturer': 'PepsiCo India Holdings Pvt. Ltd.',
    'Country of Origin': 'India',
  },
  'tropicana-orange': {
    'Brand': 'Tropicana',
    'Type': '100% Real Orange Juice',
    'Shelf Life': '6 Months',
    'Storage Instructions': 'Refrigerate after opening and consume in 5 days',
    'Manufacturer': 'PepsiCo India Holdings Pvt. Ltd.',
    'Country of Origin': 'India',
  },
  'fortune-sunflower-oil': {
    'Brand': 'Fortune',
    'Type': 'Refined Sunflower Cooking Oil',
    'Shelf Life': '9 Months',
    'Features': 'Enriched with Vitamins A & D',
    'Manufacturer': 'Adani Wilmar Ltd., Ahmedabad, Gujarat',
    'Country of Origin': 'India',
  },
  'tata-salt': {
    'Brand': 'Tata Salt',
    'Type': 'Vacuum Evaporated Iodised Salt',
    'Shelf Life': '24 Months',
    'Purity': '100% Pure & Iodised',
    'Manufacturer': 'Tata Consumer Products Ltd.',
    'Country of Origin': 'India',
  },
  'aashirvaad-atta': {
    'Brand': 'Aashirvaad',
    'Type': 'Superior Whole Wheat Atta',
    'Shelf Life': '3 Months',
    'Features': '0% Maida, 100% Sampoorna Chakki Atta',
    'Manufacturer': 'ITC Limited',
    'Country of Origin': 'India',
  },
  'india-gate-basmati': {
    'Brand': 'India Gate',
    'Type': 'Premium Aged Basmati Rice',
    'Grain Length': 'Extra Long Slender Grain',
    'Shelf Life': '24 Months',
    'Manufacturer': 'KRBL Limited',
    'Country of Origin': 'India',
  },
};

// ─── Price variation per area (±% from base price) ──────────────────────────
const AREA_PRICE_FACTORS: Record<string, number> = {
  'Prahlad Nagar': 1.0,
  'Satellite': 1.03,
  'Navrangpura': 1.05,
  'Ghatlodia': 0.97,
  'Bopal': 0.95,
  'SG Highway': 1.02,
  'Thaltej': 0.98,
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI.split('@').pop());

  // Wipe existing seed data (idempotent)
  await AreaModel.deleteMany({});
  await CategoryModel.deleteMany({});
  await ProductModel.deleteMany({});
  await VariantModel.deleteMany({});
  await AreaPricingModel.deleteMany({});
  console.log('🗑️  Cleared existing areas/categories/products/variants/area_pricing');

  // Insert Areas
  const areas = await AreaModel.insertMany(AREAS);
  console.log(`📍 Inserted ${areas.length} delivery areas`);

  // Insert Categories
  const cats = await CategoryModel.insertMany(CATEGORIES.map(c => ({ ...c, itemCount: 0, isActive: true })));
  const catMap = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of cats) catMap.set((cat as any).slug, (cat as any)._id);
  console.log(`📂 Inserted ${cats.length} categories`);

  // Insert Products + Variants + AreaPricing
  let prodCount = 0;
  let variantCount = 0;
  let pricingCount = 0;

  for (const pd of PRODUCTS_DATA) {
    const catId = catMap.get(pd.cat);
    if (!catId) { console.warn(`⚠️  Category not found: ${pd.cat}`); continue; }

    // Base price from default variant
    const defVariant = pd.variants.find(v => (v as any).def) || pd.variants[0];

    const specs = DEFAULT_SPECS_MAP[pd.slug] || {
      'Brand': pd.brand,
      'Product Type': 'Fresh Grocery Item',
      'Shelf Life': '7 Days',
      'Storage Instructions': 'Store in a cool and dry place',
      'Country of Origin': 'India',
    };

    const product = await ProductModel.create({
      name: pd.name,
      slug: pd.slug,
      brand: pd.brand,
      categoryId: catId,
      imageUrl: pd.imageUrl,
      images: [pd.imageUrl],
      mrp: defVariant.m,
      sellingPrice: defVariant.p,
      discountPercent: Math.round(((defVariant.m - defVariant.p) / defVariant.m) * 100),
      shoppingCoins: 10,
      rating: Math.round((4.3 + Math.random() * 0.6) * 10) / 10,
      reviewCount: Math.floor(20 + Math.random() * 500),
      deliveryMinutes: 9,
      isPopular: pd.isPopular,
      isDeal: pd.isDeal || false,
      description: pd.description,
      specifications: specs,
      isActive: true,
    });
    prodCount++;

    // Insert variants
    const insertedVariants = await VariantModel.insertMany(
      pd.variants.map((v, i) => ({
        productId: (product as any)._id,
        sku: `${pd.slug}-${v.l.replace(/\s+/g, '').toLowerCase()}`,
        weightOrVolume: v.l,
        mrp: v.m,
        sellingPrice: v.p,
        discountPercent: Math.round(((v.m - v.p) / v.m) * 100),
        isDefault: !!(v as any).def || i === 0,
        isActive: true,
      }))
    );
    variantCount += insertedVariants.length;

    // Insert area pricing for each area × variant
    for (const area of areas) {
      const factor = AREA_PRICE_FACTORS[(area as any).name] || 1.0;
      const pricingDocs = insertedVariants.map(v => ({
        productId: (product as any)._id,
        variantId: (v as any)._id,
        areaId: (area as any)._id,
        price: Math.round((v as any).sellingPrice * factor),
        mrp: (v as any).mrp,
        discountPercent: Math.round(((v as any).mrp - Math.round((v as any).sellingPrice * factor)) / (v as any).mrp * 100),
        stock: Math.floor(50 + Math.random() * 200),
        isAvailable: true,
      }));
      await AreaPricingModel.insertMany(pricingDocs, { ordered: false }).catch(() => {});
      pricingCount += pricingDocs.length;
    }
  }

  console.log(`🛒 Inserted ${prodCount} products, ${variantCount} variants, ${pricingCount} area pricing records`);
  console.log('\n✅ Seed complete! You can now call:');
  console.log('   POST /api/v1/location/resolve { latitude: 23.0141, longitude: 72.5067 }');
  console.log('   GET  /api/v1/products?areaId=<returned_id>');

  await mongoose.disconnect();
}

seed().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
