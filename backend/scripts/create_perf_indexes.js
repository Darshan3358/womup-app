/**
 * WormUp Performance Optimization — MongoDB Index Migration
 *
 * COLLECTION NAMES verified against @Schema decorators in backend/src/:
 *   products          → backend/src/products/schemas/product.schema.ts
 *   product_variants  → backend/src/products/schemas/product.schema.ts
 *   area_pricing      → backend/src/areas/schemas/area-pricing.schema.ts   (NOT area_pricings)
 *   inventory         → backend/src/inventory/schemas/inventory.schema.ts   (NOT inventories)
 *   orders            → backend/src/orders/schemas/order.schema.ts
 *
 * Dry-run (lists indexes without creating):
 *   DRY_RUN=1 node backend/scripts/create_perf_indexes.js
 *
 * Run on staging first, then production:
 *   MONGODB_URI=<staging-uri> node backend/scripts/create_perf_indexes.js
 *   node backend/scripts/create_perf_indexes.js
 *
 * All indexes use { background: true } — build without blocking reads/writes.
 * createIndex is idempotent — re-running is safe.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'womup';
const DRY_RUN = process.env.DRY_RUN === '1';

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set. Check backend/.env');
  process.exit(1);
}

if (DRY_RUN) console.log('DRY RUN — indexes will NOT be created\n');

const indexes = [
  // Products
  { collection: 'products', index: { isActive: 1, isDeal: 1 }, name: 'perf_isActive_isDeal', comment: 'Home deals section' },
  { collection: 'products', index: { isActive: 1, isPopular: 1, rating: -1 }, name: 'perf_isActive_isPopular_rating', comment: 'Popular products' },
  { collection: 'products', index: { isActive: 1, sellingPrice: 1 }, name: 'perf_isActive_sellingPrice', comment: 'Price-sorted listing' },
  // Product Variants
  { collection: 'product_variants', index: { productId: 1, isActive: 1 }, name: 'perf_productId_isActive', comment: 'Variant lookup' },
  // Area Pricing — schema name is 'area_pricing' (singular)
  { collection: 'area_pricing', index: { variantId: 1, areaId: 1 }, name: 'perf_variantId_areaId', comment: 'Area price lookup' },
  // Inventory — schema name is 'inventory' (singular)
  { collection: 'inventory', index: { storeId: 1, productId: 1 }, name: 'perf_storeId_productId', comment: 'Store inventory lookup' },
  // Orders
  { collection: 'orders', index: { storeId: 1, status: 1, createdAt: -1 }, name: 'perf_storeId_status_createdAt', comment: 'Store queue queries' },
  { collection: 'orders', index: { userId: 1, createdAt: -1 }, name: 'perf_userId_createdAt', comment: 'Customer order history' },
];

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Connected to "${DB_NAME}" (${DRY_RUN ? 'DRY RUN' : 'LIVE'})\n`);

  let created = 0; let skipped = 0; let failed = 0;

  for (const { collection, index, name, comment } of indexes) {
    const label = `[${collection}] "${name}"`;
    if (DRY_RUN) { console.log(`  ${label} — ${comment}`); continue; }
    try {
      const coll = db.collection(collection);
      const count = await coll.estimatedDocumentCount();
      await coll.createIndex(index, { background: true, name });
      console.log(`OK  ${label}  (${count} docs) — ${comment}`);
      created++;
    } catch (err) {
      if (err.code === 85 || err.code === 86 || String(err.message).includes('already exists')) {
        console.log(`SKIP  ${label} already exists`);
        skipped++;
      } else {
        console.error(`FAIL  ${label}: ${err.message}`);
        failed++;
      }
    }
  }

  await client.close();
  if (!DRY_RUN) {
    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
  }
}

main().catch((err) => { console.error('Migration failed:', err); process.exit(1); });
