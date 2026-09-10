const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup";

async function fetchAllCollections() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('wormup');

    const users = await db.collection('users').find({}).toArray();
    const orders = await db.collection('orders').find({}).toArray();
    const products = await db.collection('products').find({}).toArray();
    const productVariants = await db.collection('product_variants').find({}).toArray();
    const areas = await db.collection('areas').find({}).toArray();
    const stores = await db.collection('stores').find({}).toArray();
    const inventory = await db.collection('inventory').find({}).toArray();
    const areaPricing = await db.collection('area_pricing').find({}).toArray();
    const coinTransactions = await db.collection('coin_transactions').find({}).toArray();
    const coupons = await db.collection('coupons').find({}).toArray();
    const orderHistory = await db.collection('order_status_history').find({}).toArray();
    const printOrders = await db.collection('print_orders').find({}).toArray();

    console.log('--- USERS ---', users.length);
    console.log(JSON.stringify(users, null, 2));

    console.log('--- ORDERS ---', orders.length);
    console.log(JSON.stringify(orders, null, 2));

    console.log('--- AREAS ---', areas.length);
    console.log(JSON.stringify(areas, null, 2));

    console.log('--- STORES ---', stores.length);
    console.log(JSON.stringify(stores, null, 2));

    console.log('--- COIN TRANSACTIONS ---', coinTransactions.length);
    console.log(JSON.stringify(coinTransactions, null, 2));

    console.log('--- COUPONS ---', coupons.length);
    console.log(JSON.stringify(coupons, null, 2));

    console.log('--- INVENTORY ---', inventory.length);
    console.log(JSON.stringify(inventory, null, 2));

  } catch (err) {
    console.error('Error fetching:', err);
  } finally {
    await client.close();
  }
}

fetchAllCollections();
