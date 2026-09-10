const http = require('http');
const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup";
const PORT = process.env.PORT || 5001;

let client = null;
let db = null;

async function initMongo() {
  if (!db) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('wormup');
    console.log("Connected to MongoDB Atlas 'wormup' database on cluster0!");
  }
  return db;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    const database = await initMongo();

    // Health check
    if (pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'ok',
        database: 'wormup',
        cluster: 'cluster0.f8acy45.mongodb.net',
        connectedAt: new Date().toISOString()
      });
    }

    // Full realtime snapshot
    if (pathname === '/api/realtime-data' && req.method === 'GET') {
      const users = await database.collection('users').find({}).toArray();
      const orders = await database.collection('orders').find({}).toArray();
      const products = await database.collection('products').find({}).toArray();
      const categories = await database.collection('categories').find({}).toArray();
      const areas = await database.collection('areas').find({}).toArray();
      const stores = await database.collection('stores').find({}).toArray();
      const inventory = await database.collection('inventory').find({}).toArray();
      const coinTransactions = await database.collection('coin_transactions').find({}).toArray();
      const coupons = await database.collection('coupons').find({}).toArray();
      const orderHistory = await database.collection('order_status_history').find({}).toArray();
      const addresses = await database.collection('addresses').find({}).toArray();

      return sendJson(res, 200, {
        users,
        orders,
        products,
        categories,
        areas,
        stores,
        inventory,
        coinTransactions,
        coupons,
        orderHistory,
        addresses
      });
    }

    // Update order status in MongoDB
    if (pathname.startsWith('/api/orders/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const parts = pathname.split('/');
      const orderNumber = parts[3];
      const body = await parseBody(req);
      const newStatus = body.status; // e.g. 'Delivered', 'Out for Delivery', 'Cancelled'

      let mongoStatus = 'PLACED';
      if (newStatus === 'Picking') mongoStatus = 'PACKING';
      else if (newStatus === 'Out for Delivery') mongoStatus = 'OUT_FOR_DELIVERY';
      else if (newStatus === 'Delivered') mongoStatus = 'DELIVERED';
      else if (newStatus === 'Cancelled') mongoStatus = 'CANCELLED';

      const result = await database.collection('orders').updateOne(
        { orderNumber: orderNumber },
        { $set: { status: mongoStatus, updatedAt: new Date() } }
      );

      // Add to order_status_history
      await database.collection('order_status_history').insertOne({
        orderId: orderNumber,
        previousStatus: 'PLACED',
        newStatus: mongoStatus,
        changedByRole: 'ADMIN',
        notes: `Admin changed status to ${newStatus}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return sendJson(res, 200, { success: true, updated: result.modifiedCount });
    }

    // Credit / Debit Shopping Coins in MongoDB
    if (pathname === '/api/coins/adjust' && req.method === 'POST') {
      const body = await parseBody(req);
      const { userId, amount, reason, type } = body;

      const userObjId = new ObjectId(userId);
      const user = await database.collection('users').findOne({ _id: userObjId });
      const currentCoins = (user && user.shoppingCoins) || 0;
      const newCoins = type === 'Credit' ? currentCoins + amount : Math.max(0, currentCoins - amount);

      await database.collection('users').updateOne(
        { _id: userObjId },
        { $set: { shoppingCoins: newCoins, updatedAt: new Date() } }
      );

      await database.collection('coin_transactions').insertOne({
        userId: userObjId,
        type: type === 'Credit' ? 'BONUS' : 'SPEND',
        coins: amount,
        balanceBefore: currentCoins,
        balanceAfter: newCoins,
        referenceType: 'ADMIN_ADJUSTMENT',
        description: reason || 'Admin coin adjustment',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return sendJson(res, 200, { success: true, newBalance: newCoins });
    }

    // Update Product Price in MongoDB
    if (pathname === '/api/products/price' && req.method === 'PUT') {
      const body = await parseBody(req);
      const { productName, sellingPrice } = body;

      await database.collection('products').updateMany(
        { name: productName },
        { $set: { sellingPrice: Number(sellingPrice), updatedAt: new Date() } }
      );

      return sendJson(res, 200, { success: true });
    }

    // Not found
    sendJson(res, 404, { error: 'Route not found' });

  } catch (err) {
    console.error("API error:", err);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Womup Admin Realtime MongoDB Server running on http://localhost:${PORT}`);
  initMongo();
});
