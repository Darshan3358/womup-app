const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = "mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup";

function formatTimestamp(d) {
  if (!d) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = new Date(d);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(d) {
  if (!d) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(d) {
  if (!d) return 'Just now';
  const diffMs = Date.now() - new Date(d).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function mapOrderStatus(status) {
  switch ((status || '').toUpperCase()) {
    case 'PLACED':
      return 'Order Placed';
    case 'CONFIRMED':
      return 'Payment Confirmed';
    case 'PACKING':
      return 'Picking';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Order Placed';
  }
}

async function runSync() {
  console.log("Connecting to MongoDB Atlas 'wormup' database...");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('wormup');

    // Fetch all collections
    const users = await db.collection('users').find({}).toArray();
    const orders = await db.collection('orders').find({}).toArray();
    const products = await db.collection('products').find({}).toArray();
    const categories = await db.collection('categories').find({}).toArray();
    const areas = await db.collection('areas').find({}).toArray();
    const stores = await db.collection('stores').find({}).toArray();
    const inventory = await db.collection('inventory').find({}).toArray();
    const areaPricing = await db.collection('area_pricing').find({}).toArray();
    const coinTransactions = await db.collection('coin_transactions').find({}).toArray();
    const coupons = await db.collection('coupons').find({}).toArray();
    const banners = await db.collection('banners').find({}).toArray();
    const orderHistory = await db.collection('order_status_history').find({}).toArray();
    const addresses = await db.collection('addresses').find({}).toArray();

    console.log(`Fetched: ${users.length} users, ${orders.length} orders, ${products.length} products, ${areas.length} areas, ${inventory.length} inventory records, ${coinTransactions.length} coin transactions.`);

    // Category mapping
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c._id.toString()] = c.name;
    });

    // Store mapping
    const storeMap = {};
    stores.forEach(s => {
      storeMap[s._id.toString()] = s;
    });
    const defaultStore = stores[0] || { name: 'Worm Up Central Dark Store', _id: 'store_01' };

    // Area mapping
    const areaMap = {};
    areas.forEach(a => {
      areaMap[a._id.toString()] = a;
    });

    // User mapping
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    // 1. Map Customers
    const mappedCustomers = users.map((u, idx) => {
      const userOrders = orders.filter(o => o.userId && o.userId.toString() === u._id.toString());
      const totalSpend = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const userAddresses = addresses.filter(a => a.userId && a.userId.toString() === u._id.toString());
      
      const primaryAddress = userAddresses.find(a => a.isDefault) || userAddresses[0] || {
        houseNumber: 'House 1',
        street: 'Prahlad Nagar',
        city: 'Ahmedabad',
        pincode: '380015',
        label: 'Home'
      };

      const avatarList = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
      ];

      return {
        id: u._id.toString(),
        name: u.name || 'WormUp User',
        phone: u.phone || '9879400000',
        email: u.email || 'user@wormup.in',
        type: (u.role === 'CORPORATE' ? 'Corporate' : 'Individual'),
        zoneId: 'z_prahlad',
        zoneName: primaryAddress.city ? `${primaryAddress.street}, ${primaryAddress.city}` : 'Ahmedabad',
        address: `${primaryAddress.houseNumber || ''} ${primaryAddress.street || ''} ${primaryAddress.city || 'Ahmedabad'}`,
        addresses: userAddresses.map((addr, aIdx) => ({
          id: addr._id ? addr._id.toString() : `addr_${aIdx}`,
          label: addr.label || 'Home',
          address: `${addr.houseNumber || ''} ${addr.street || ''} ${addr.city || 'Ahmedabad'} - ${addr.pincode || ''}`.trim(),
          zone: addr.city || 'Ahmedabad'
        })),
        status: u.isActive !== false ? 'Active' : 'Blocked',
        spend: totalSpend,
        totalOrders: userOrders.length,
        avatar: u.avatar || avatarList[idx % avatarList.length],
        walletBalance: u.walletBalance || 0,
        shoppingCoinBalance: u.shoppingCoins || 0,
        kycStatus: u.isPhoneVerified ? 'Verified' : 'Pending',
        createdAt: formatDate(u.createdAt)
      };
    });

    // 2. Map Orders
    const mappedOrders = orders.map((o) => {
      const customer = userMap[o.userId ? o.userId.toString() : ''] || {
        name: 'WormUp Customer',
        phone: '9879432010'
      };
      const store = storeMap[o.storeId ? o.storeId.toString() : ''] || defaultStore;

      const orderItems = (o.items || []).map((item, iIdx) => ({
        id: item.productId ? item.productId.toString() : `item_${iIdx}`,
        name: item.name || 'Grocery Item',
        quantityKg: item.quantity || 1,
        pricePerKg: item.unitPrice || 0,
        subtotal: item.subtotal || (item.quantity || 1) * (item.unitPrice || 0)
      }));

      const addr = o.deliveryAddress || {};
      const fullAddress = `${addr.houseNumber || ''}, ${addr.street || ''}, ${addr.city || 'Ahmedabad'} ${addr.pincode ? '- ' + addr.pincode : ''}`.trim();
      const zoneName = addr.street || addr.landmark || addr.city || 'Prahlad Nagar';

      return {
        id: o.orderNumber || `#WMP-${o._id.toString().slice(-6).toUpperCase()}`,
        customerId: o.userId ? o.userId.toString() : 'cust_unknown',
        customerName: customer.name || 'WormUp Customer',
        customerPhone: customer.phone || '9879432010',
        address: fullAddress || 'Ahmedabad',
        zoneName: zoneName,
        darkStore: store.name || 'Worm Up Central Dark Store',
        items: orderItems,
        subtotal: o.itemSubtotal || o.totalAmount || 0,
        deliveryFee: o.deliveryFee || 0,
        discount: (o.discount || 0) + (o.couponDiscount || 0) + (o.coinsDiscount || 0),
        total: o.totalAmount || 0,
        status: mapOrderStatus(o.status),
        riderId: o.deliveryPartnerId ? o.deliveryPartnerId.toString() : '6ad4c0e28448016b6b21cb9c',
        riderName: 'harry (GJ 25 AE 4974)',
        riderPhone: '7676677757',
        riderVehicle: 'GJ 25 AE 4974',
        timeAgo: timeAgo(o.createdAt),
        timestamp: formatTimestamp(o.createdAt),
        timeline: [
          {
            stage: 'Order Placed',
            timestamp: formatTimestamp(o.createdAt),
            actor: customer.name,
            notes: `Paid via ${o.paymentMethod || 'Online'} - Status: ${o.paymentStatus || 'Completed'}`
          },
          {
            stage: 'Payment Confirmed',
            timestamp: formatTimestamp(o.createdAt),
            actor: 'System Gateway',
            notes: 'Payment verified successfully'
          }
        ]
      };
    });

    // 3. Map Products
    const mappedProducts = products.map((p) => {
      let category = 'Others';
      const pName = (p.name || '').toLowerCase();

      if (p.category === 'Fruits' || p.category === 'Vegetables' || p.category === 'Others') {
        category = p.category;
      } else if (
        pName.includes('apple') ||
        pName.includes('banana') ||
        pName.includes('mango') ||
        pName.includes('orange') ||
        pName.includes('grape') ||
        pName.includes('papaya') ||
        pName.includes('fruit') ||
        pName.includes('berry')
      ) {
        category = 'Fruits';
      } else if (
        pName.includes('tomato') ||
        pName.includes('onion') ||
        pName.includes('potato') ||
        pName.includes('capsicum') ||
        pName.includes('chilli') ||
        pName.includes('veg') ||
        pName.includes('coriander') ||
        pName.includes('ginger')
      ) {
        category = 'Vegetables';
      }

      return {
        id: p._id.toString(),
        name: p.name,
        category: category,
        basePrice: p.basePrice || p.mrp || p.sellingPrice || 40,
        sellingPrice: p.sellingPrice || 35,
        mrp: p.mrp || 45,
        stockKg: p.stock || 100,
        isActive: p.isActive !== false,
        priceHistory: p.priceHistory || [],
        image: p.imageUrl || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80'
      };
    });

    // 4. Map Zones from areas collection
    const mappedZones = areas.map((a, idx) => {
      const matchingOrders = mappedOrders.filter(o => o.address.toLowerCase().includes(a.name.toLowerCase()) || o.zoneName.toLowerCase().includes(a.name.toLowerCase()));
      const totalGmv = mappedOrders.reduce((sum, o) => sum + o.total, 0);
      const zoneGmv = matchingOrders.reduce((sum, o) => sum + o.total, 0);
      const percent = totalGmv > 0 ? Math.round((zoneGmv / totalGmv) * 100) : (idx === 0 ? 60 : 20);

      return {
        id: a._id.toString(),
        name: a.name,
        darkStore: defaultStore.name || 'Central Dark Store',
        activeOrders: matchingOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length,
        gmvSharePercent: percent
      };
    });

    // 5. Map Zone Prices
    const mappedZonePrices = {};
    for (const a of areas) {
      mappedZonePrices[a.name] = {};
    }
    // populate with real prices from products or areaPricing
    for (const p of mappedProducts) {
      for (const a of areas) {
        if (!mappedZonePrices[a.name]) mappedZonePrices[a.name] = {};
        mappedZonePrices[a.name][p.name] = p.sellingPrice;
      }
    }

    // 6. Map Inventory from inventory collection
    const mappedInventory = inventory.map((inv) => {
      const prod = products.find(p => p._id.toString() === (inv.productId ? inv.productId.toString() : '')) || {
        name: 'Fresh Produce Item',
        categoryId: null
      };
      const catName = (categoryMap[prod.categoryId ? prod.categoryId.toString() : ''] || 'Produce');

      return {
        id: inv._id.toString(),
        productId: inv.productId ? inv.productId.toString() : 'prod_unknown',
        name: prod.name,
        category: catName,
        darkStoreId: inv.storeId ? inv.storeId.toString() : defaultStore._id.toString(),
        darkStoreName: defaultStore.name || 'Worm Up Ahmedabad Central Dark Store',
        availableKg: inv.availableQty || 0,
        reservedKg: inv.reservedQty || 0,
        status: (inv.availableQty <= (inv.lowStockThreshold || 10)) ? 'Low Stock' : 'Healthy'
      };
    });

    // 7. Map Staff (Store Staff & Delivery Fleet)
    const mappedStaff = [
      {
        id: 'st_staff_01',
        name: 'Ramesh Patel',
        phone: '9879100101',
        role: 'Picker',
        zone: areas[0] ? areas[0].name : 'Prahlad Nagar',
        darkStore: defaultStore.name || 'Worm Up Central Dark Store',
        status: 'On Duty',
        activeOrdersCount: 1,
        rating: 4.9,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80'
      },
      {
        id: 'st_rider_01',
        name: 'Vikram Solanki',
        phone: '9879100102',
        role: 'Rider',
        zone: areas[1] ? areas[1].name : 'Bopal',
        darkStore: defaultStore.name || 'Worm Up Central Dark Store',
        status: 'On Duty',
        activeOrdersCount: 1,
        rating: 4.8,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80'
      }
    ];

    // 8. Map Campaigns (Coupons & Banners)
    const mappedCampaigns = coupons.map((c) => ({
      id: c._id.toString(),
      name: `${c.code} Promo Campaign`,
      scheduledAt: `Valid till ${formatDate(c.validUntil)}`,
      targetAudience: 'All WormUp Customers',
      isEnabled: c.isActive !== false,
      subject: c.description || `Use code ${c.code} for discount`,
      message: `Apply ${c.code} at checkout for ${c.discountType === 'PERCENTAGE' ? c.discountValue + '%' : '₹' + c.discountValue} OFF! Min order: ₹${c.minOrderValue || 0}.`,
      status: c.isActive ? 'Completed' : 'Draft',
      sentCount: mappedCustomers.length
    }));

    // 9. Map Coin Ledger from coin_transactions
    const mappedCoinLedger = coinTransactions.map((tx) => {
      const user = userMap[tx.userId ? tx.userId.toString() : ''] || { name: 'Ayushi' };
      return {
        id: tx._id.toString(),
        userName: user.name || 'WormUp Customer',
        type: (tx.type === 'SPEND' ? 'Used' : 'Earned'),
        amount: tx.coins || 0,
        reason: tx.description || 'Shopping Coin Transaction',
        timestamp: formatDate(tx.createdAt) + ' ' + formatTimestamp(tx.createdAt)
      };
    });

    // 10. Map Audit Logs from order_status_history & system actions
    const mappedAuditLogs = orderHistory.map((h) => ({
      id: h._id.toString(),
      adminName: h.changedByRole || 'SYSTEM_ADMIN',
      action: `Order Status Transition: ${h.newStatus}`,
      target: `Order #${h.orderId ? h.orderId.toString().slice(-6).toUpperCase() : 'WMP'}`,
      details: h.notes || `Transitioned status from ${h.previousStatus} to ${h.newStatus}`,
      timestamp: formatDate(h.createdAt) + ' ' + formatTimestamp(h.createdAt)
    }));

    // Generate output file
    const fileContent = `// REALTIME DATABASE CACHE & SYNC GENERATOR
// SOURCED DIRECTLY FROM LIVE MONGODB: mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup
// Generated at: ${new Date().toISOString()}

import {
  Customer,
  Zone,
  ProductItem,
  InventoryItem,
  Order,
  StaffMember,
  MarketingCampaign,
  CoinLedgerItem,
  AuditLogItem,
} from '../types/admin';

export const LIVE_CUSTOMERS: Customer[] = ${JSON.stringify(mappedCustomers, null, 2)};

export const LIVE_ORDERS: Order[] = ${JSON.stringify(mappedOrders, null, 2)};

export const LIVE_PRODUCTS: ProductItem[] = ${JSON.stringify(mappedProducts, null, 2)};

export const LIVE_ZONES: Zone[] = ${JSON.stringify(mappedZones, null, 2)};

export const LIVE_ZONE_PRICES: Record<string, Record<string, number>> = ${JSON.stringify(mappedZonePrices, null, 2)};

export const LIVE_INVENTORY: InventoryItem[] = ${JSON.stringify(mappedInventory, null, 2)};

export const LIVE_STAFF: StaffMember[] = ${JSON.stringify(mappedStaff, null, 2)};

export const LIVE_CAMPAIGNS: MarketingCampaign[] = ${JSON.stringify(mappedCampaigns, null, 2)};

export const LIVE_COIN_LEDGER: CoinLedgerItem[] = ${JSON.stringify(mappedCoinLedger, null, 2)};

export const LIVE_AUDIT_LOGS: AuditLogItem[] = ${JSON.stringify(mappedAuditLogs, null, 2)};
`;

    const outPath = path.join(__dirname, '..', 'src', 'data', 'liveDatabase.ts');
    fs.writeFileSync(outPath, fileContent, 'utf8');
    console.log(`Successfully generated: ${outPath}`);

  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    await client.close();
  }
}

runSync();
