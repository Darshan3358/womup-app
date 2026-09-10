const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup";

async function inspectUsersAndOrders() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('wormup');

    const users = await db.collection('users').find({}).toArray();
    const orders = await db.collection('orders').find({}).toArray();
    const products = await db.collection('products').find({}).limit(3).toArray();

    console.log('=== ALL USERS ===');
    console.log(JSON.stringify(users, null, 2));

    console.log('=== ALL ORDERS ===');
    console.log(JSON.stringify(orders, null, 2));

    console.log('=== PRODUCTS SAMPLE ===');
    console.log(JSON.stringify(products, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

inspectUsersAndOrders();
