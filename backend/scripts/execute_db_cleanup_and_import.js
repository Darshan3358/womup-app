const mongoose = require('../node_modules/mongoose');
const { Types } = mongoose;

const URI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup';
const RETAINED_USER_ID = '6af858814ec5de25e3ab9d4a'; // Womup Company Root (root@wormup.com | ADMIN)

const CATEGORIES_SPEC = [
  { name: 'Vegetables', slug: 'vegetables', icon: '🥦' },
  { name: 'Fruits', slug: 'fruits', icon: '🍎' },
  { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', icon: '🌾' },
  { name: 'Dairy, Bread & Eggs', slug: 'dairy-bread-eggs', icon: '🥛' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: '✨' },
];

const PRODUCTS_SPEC = [
  // 1. Vegetables
  { name: 'Potato', category: 'Vegetables', mrp: 30, sellingPrice: 28, unit: '1 kg', file: 'potato.png', brand: 'Farm Fresh' },
  { name: 'Onion', category: 'Vegetables', mrp: 20, sellingPrice: 15, unit: '1 kg', file: 'onion.png', brand: 'Farm Fresh' },
  { name: 'Tomato', category: 'Vegetables', mrp: 15, sellingPrice: 12, unit: '1 kg', file: 'tomato.png', brand: 'Farm Fresh' },
  { name: 'Lady Fingers', category: 'Vegetables', mrp: 40, sellingPrice: 32, unit: '1 kg', file: 'lady-fingers.png', brand: 'Farm Fresh' },
  { name: 'Cabbage', category: 'Vegetables', mrp: 32, sellingPrice: 28, unit: '1 kg', file: 'cabbage.png', brand: 'Farm Fresh' },
  { name: 'Ginger', category: 'Vegetables', mrp: 18, sellingPrice: 15, unit: '1 kg', file: 'ginger.png', brand: 'Farm Fresh' },
  { name: 'Guwar', category: 'Vegetables', mrp: 12, sellingPrice: 9, unit: '1 kg', file: 'guwar.png', brand: 'Farm Fresh' },
  { name: 'Lemon', category: 'Vegetables', mrp: 15, sellingPrice: 12, unit: '1 kg', file: 'lemon.png', brand: 'Farm Fresh' },
  { name: 'Bottle Gourd', category: 'Vegetables', mrp: 40, sellingPrice: 35, unit: '1 kg', file: 'bottle-gourd.png', brand: 'Farm Fresh' },
  { name: 'Parwal', category: 'Vegetables', mrp: 35, sellingPrice: 27, unit: '1 kg', file: 'parwal.png', brand: 'Farm Fresh' },
  { name: 'Beetroot', category: 'Vegetables', mrp: 30, sellingPrice: 20, unit: '1 kg', file: 'beetroot.png', brand: 'Farm Fresh' },

  // 2. Fruits
  { name: 'Apple', category: 'Fruits', mrp: 45, sellingPrice: 40, unit: '1 kg', file: 'apple.png', brand: 'Fresh Orchard' },
  { name: 'Banana', category: 'Fruits', mrp: 35, sellingPrice: 31, unit: '1 kg', file: 'banana.png', brand: 'Fresh Orchard' },
  { name: 'Orange', category: 'Fruits', mrp: 60, sellingPrice: 51, unit: '1 kg', file: 'orange.png', brand: 'Fresh Orchard' },
  { name: 'Pineapple', category: 'Fruits', mrp: 80, sellingPrice: 60, unit: '1 kg', file: 'pineapple.png', brand: 'Fresh Orchard' },
  { name: 'Muskmelon', category: 'Fruits', mrp: 70, sellingPrice: 65, unit: '1 kg', file: 'muskmelon.png', brand: 'Fresh Orchard' },
  { name: 'Papaya', category: 'Fruits', mrp: 65, sellingPrice: 50, unit: '1 kg', file: 'papaya.png', brand: 'Fresh Orchard' },
  { name: 'Kiwi', category: 'Fruits', mrp: 90, sellingPrice: 70, unit: '1 kg', file: 'kiwi.png', brand: 'Fresh Orchard' },
  { name: 'Watermelon', category: 'Fruits', mrp: 100, sellingPrice: 70, unit: '1 kg', file: 'watermelon.png', brand: 'Fresh Orchard' },

  // 3. Atta, Rice & Dal
  { name: 'Aashirvaad Atta', category: 'Atta, Rice & Dal', mrp: 60, sellingPrice: 45, unit: '1 kg', file: 'aashirvaad-atta.png', brand: 'Aashirvaad' },
  { name: 'Basmati Rice', category: 'Atta, Rice & Dal', mrp: 120, sellingPrice: 95, unit: '1 kg', file: 'basmati-rice.png', brand: 'Royal Basmati' },
  { name: 'Tata Salt', category: 'Atta, Rice & Dal', mrp: 30, sellingPrice: 21, unit: '1 kg', file: 'tata-salt.png', brand: 'Tata' },
  { name: 'Sunflower Oil', category: 'Atta, Rice & Dal', mrp: 130, sellingPrice: 110, unit: '1 L', file: 'sunflower-oil.png', brand: 'Fortune' },

  // 4. Dairy, Bread & Eggs
  { name: 'Paneer', category: 'Dairy, Bread & Eggs', mrp: 175, sellingPrice: 150, unit: '1 pack', file: 'paneer.png', brand: 'Amul' },
  { name: 'Curd (Dahi)', category: 'Dairy, Bread & Eggs', mrp: 80, sellingPrice: 65, unit: '1 pack', file: 'curd.png', brand: 'Amul' },
  { name: 'Amul TATA Milk', category: 'Dairy, Bread & Eggs', mrp: 100, sellingPrice: 70, unit: '1 L', file: 'amul-tata-milk.png', brand: 'Amul' },
  { name: 'Bread', category: 'Dairy, Bread & Eggs', mrp: 80, sellingPrice: 65, unit: '1 loaf', file: 'bread.png', brand: 'Fresh Bake' },
  { name: 'Amul Butter Milk', category: 'Dairy, Bread & Eggs', mrp: 25, sellingPrice: 21, unit: '1 pack', file: 'amul-butter-milk.png', brand: 'Amul' },

  // 5. Beauty & Personal Care
  { name: 'Shampoo', category: 'Beauty & Personal Care', mrp: 250, sellingPrice: 230, unit: '1 bottle', file: 'shampoo.png', brand: 'Dove' },
  { name: 'Hair Oil', category: 'Beauty & Personal Care', mrp: 180, sellingPrice: 150, unit: '1 bottle', file: 'hair-oil.png', brand: 'Parachute' },
  { name: 'Conditioner', category: 'Beauty & Personal Care', mrp: 200, sellingPrice: 170, unit: '1 bottle', file: 'conditioner.png', brand: 'Tresemme' },
  { name: 'Body Spray', category: 'Beauty & Personal Care', mrp: 370, sellingPrice: 250, unit: '1 bottle', file: 'body-spray.png', brand: 'Fogg' },
  { name: 'Body Perfume', category: 'Beauty & Personal Care', mrp: 550, sellingPrice: 500, unit: '1 bottle', file: 'body-perfume.png', brand: 'Wild Stone' },
  { name: 'Hair Colour', category: 'Beauty & Personal Care', mrp: 70, sellingPrice: 50, unit: '1 pack', file: 'hair-colour.png', brand: 'Garnier' },
];

function toKebab(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(URI);
  const db = mongoose.connection.db;

  console.log('\n--- PHASE 2: DELETING EXISTING DATA ---');

  // 1. Delete Products & associated collections
  const delProds = await db.collection('products').deleteMany({});
  const delVariants = await db.collection('product_variants').deleteMany({});
  const delAreaPrices = await db.collection('area_pricing').deleteMany({});
  const delInv = await db.collection('inventory').deleteMany({});
  const delInvLogs = await db.collection('inventory_logs').deleteMany({});
  const delPickLists = await db.collection('pick_lists').deleteMany({});
  console.log(`Deleted products: ${delProds.deletedCount}`);
  console.log(`Deleted product_variants: ${delVariants.deletedCount}`);
  console.log(`Deleted area_pricing: ${delAreaPrices.deletedCount}`);
  console.log(`Deleted inventory: ${delInv.deletedCount}`);
  console.log(`Deleted inventory_logs: ${delInvLogs.deletedCount}`);
  console.log(`Deleted pick_lists: ${delPickLists.deletedCount}`);

  // 2. Delete Vendors & associated collections
  const delVendors = await db.collection('vendors').deleteMany({});
  const delVendorCats = await db.collection('vendor_categories').deleteMany({});
  const delVendorTx = await db.collection('vendor_transactions').deleteMany({});
  const delVendorReq = await db.collection('vendor_collection_requests').deleteMany({});
  const delVendorSet = await db.collection('vendor_settlements').deleteMany({});
  console.log(`Deleted vendors: ${delVendors.deletedCount}`);
  console.log(`Deleted vendor_categories: ${delVendorCats.deletedCount}`);
  console.log(`Deleted vendor_transactions: ${delVendorTx.deletedCount}`);
  console.log(`Deleted vendor_collection_requests: ${delVendorReq.deletedCount}`);
  console.log(`Deleted vendor_settlements: ${delVendorSet.deletedCount}`);

  // 3. Delete Dark Stores & Store Staff & Store Wallets
  const delStores = await db.collection('stores').deleteMany({});
  const delStaff = await db.collection('store_staff').deleteMany({});
  const delStoreWallets = await db.collection('store_wallets').deleteMany({});
  const delStoreReq = await db.collection('store_settlement_requests').deleteMany({});
  console.log(`Deleted stores: ${delStores.deletedCount}`);
  console.log(`Deleted store_staff: ${delStaff.deletedCount}`);
  console.log(`Deleted store_wallets: ${delStoreWallets.deletedCount}`);
  console.log(`Deleted store_settlement_requests: ${delStoreReq.deletedCount}`);

  // 4. Delete Users EXCEPT RETAINED USER
  const retainedObjId = new Types.ObjectId(RETAINED_USER_ID);
  const delUsers = await db.collection('users').deleteMany({ _id: { $ne: retainedObjId } });
  const delSettings = await db.collection('user_settings').deleteMany({ userId: { $ne: retainedObjId } });
  const delPayMethods = await db.collection('user_payment_methods').deleteMany({ userId: { $ne: retainedObjId } });
  const delRewards = await db.collection('user_rewards').deleteMany({ userId: { $ne: retainedObjId } });
  const delCarts = await db.collection('carts').deleteMany({});
  const delRefreshTokens = await db.collection('refresh_tokens').deleteMany({ userId: { $ne: retainedObjId } });
  console.log(`Deleted users: ${delUsers.deletedCount} (Retained 1 user: ${RETAINED_USER_ID})`);
  console.log(`Deleted user_settings: ${delSettings.deletedCount}`);
  console.log(`Deleted user_payment_methods: ${delPayMethods.deletedCount}`);
  console.log(`Deleted user_rewards: ${delRewards.deletedCount}`);
  console.log(`Cleared carts: ${delCarts.deletedCount}`);
  console.log(`Cleared refresh_tokens: ${delRefreshTokens.deletedCount}`);

  console.log('\n--- PHASE 3: CATEGORIES SETUP & PRODUCT IMPORT ---');

  // Setup / Ensure the 5 Target Categories
  const categoryMap = new Map();
  for (const catSpec of CATEGORIES_SPEC) {
    let existing = await db.collection('categories').findOne({
      $or: [{ name: catSpec.name }, { slug: catSpec.slug }]
    });
    if (!existing) {
      const newCat = {
        _id: new Types.ObjectId(),
        name: catSpec.name,
        slug: catSpec.slug,
        icon: catSpec.icon,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('categories').insertOne(newCat);
      categoryMap.set(catSpec.name, newCat._id);
      console.log(`Created Category: ${catSpec.name} (${newCat._id})`);
    } else {
      await db.collection('categories').updateOne(
        { _id: existing._id },
        { $set: { name: catSpec.name, slug: catSpec.slug, icon: catSpec.icon, isActive: true } }
      );
      categoryMap.set(catSpec.name, existing._id);
      console.log(`Updated Category: ${catSpec.name} (${existing._id})`);
    }
  }

  // Fetch all active areas for seeding area_pricing
  const areas = await db.collection('areas').find({}).toArray();
  console.log(`Found ${areas.length} areas to seed area_pricing.`);

  const now = new Date();
  const insertedProducts = [];
  const insertedVariants = [];
  const insertedAreaPrices = [];

  for (const item of PRODUCTS_SPEC) {
    const catId = categoryMap.get(item.category);
    const prodId = new Types.ObjectId();
    const variantId = new Types.ObjectId();
    const slug = toKebab(item.name);
    const discountPercent = item.mrp > item.sellingPrice ? Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100) : 0;
    const imageUrl = `/api/v1/uploads/files/products/${item.file}`;

    const defaultVariant = {
      _id: variantId,
      productId: prodId,
      sku: `${slug}-base`,
      weightOrVolume: item.unit,
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      discountPercent: discountPercent,
      isDefault: true,
      isActive: true,
      stock: 100,
      createdAt: now,
      updatedAt: now
    };
    insertedVariants.push(defaultVariant);

    const productDoc = {
      _id: prodId,
      name: item.name,
      slug: slug,
      brand: item.brand,
      categoryId: catId,
      category: item.category,
      imageUrl: imageUrl,
      images: [imageUrl],
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      discountPercent: discountPercent,
      shoppingCoins: 10,
      rating: 4.8,
      reviewCount: 45,
      deliveryMinutes: 9,
      isPopular: true,
      isDeal: discountPercent >= 15,
      description: `Fresh quality ${item.name} sourced directly for prompt 9-minute doorstep delivery.`,
      specifications: {
        "Brand": item.brand,
        "Package Size": item.unit,
        "Country of Origin": "India"
      },
      isActive: true,
      stock: 100,
      basePrice: item.sellingPrice,
      quantityLabel: item.unit,
      variants: [
        {
          id: variantId.toString(),
          _id: variantId.toString(),
          label: item.unit,
          price: item.sellingPrice,
          mrp: item.mrp,
          discountPercent: discountPercent,
          stock: 100,
          isDefault: true,
          isActive: true
        }
      ],
      createdAt: now,
      updatedAt: now
    };
    insertedProducts.push(productDoc);

    // Create area pricing for each area
    for (const a of areas) {
      insertedAreaPrices.push({
        _id: new Types.ObjectId(),
        productId: prodId,
        variantId: variantId,
        areaId: a._id,
        price: item.sellingPrice,
        mrp: item.mrp,
        discountPercent: discountPercent,
        stock: 100,
        isAvailable: true,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  await db.collection('products').insertMany(insertedProducts);
  await db.collection('product_variants').insertMany(insertedVariants);
  if (insertedAreaPrices.length > 0) {
    await db.collection('area_pricing').insertMany(insertedAreaPrices);
  }

  console.log(`Successfully imported ${insertedProducts.length} products.`);
  console.log(`Successfully imported ${insertedVariants.length} product variants.`);
  console.log(`Successfully imported ${insertedAreaPrices.length} area pricing entries.`);

  console.log('\n--- PHASE 7: DATABASE VERIFICATION ---');
  const finalProductCount = await db.collection('products').countDocuments();
  const finalVariantCount = await db.collection('product_variants').countDocuments();
  const finalUserCount = await db.collection('users').countDocuments();
  const finalVendorCount = await db.collection('vendors').countDocuments();
  const finalStoreCount = await db.collection('stores').countDocuments();
  const finalAreaPricingCount = await db.collection('area_pricing').countDocuments();
  const finalCartCount = await db.collection('carts').countDocuments();

  const retainedUser = await db.collection('users').findOne({ _id: retainedObjId });

  console.log('Final Entity Counts:');
  console.log(`- Imported products: ${finalProductCount} (Expected: 34)`);
  console.log(`- Product variants: ${finalVariantCount} (Expected: 34)`);
  console.log(`- Retained users: ${finalUserCount} (Expected: 1)`);
  console.log(`  Name: ${retainedUser?.name} | Email: ${retainedUser?.email} | Role: ${retainedUser?.role}`);
  console.log(`- Vendors: ${finalVendorCount} (Expected: 0)`);
  console.log(`- Dark stores: ${finalStoreCount} (Expected: 0)`);
  console.log(`- Area pricing: ${finalAreaPricingCount} (Expected: ${34 * areas.length})`);
  console.log(`- Active carts: ${finalCartCount} (Expected: 0)`);

  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
