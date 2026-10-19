// REALTIME DATABASE CACHE & SYNC GENERATOR
// SOURCED DIRECTLY FROM LIVE MONGODB: mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/wormup
// Generated at: 2026-09-09T12:14:36.575Z

import {
  Customer,
  Zone,
  ProductItem,
  CategoryItem,
  InventoryItem,
  Order,
  StaffMember,
  MarketingCampaign,
  CoinLedgerItem,
  AuditLogItem,
} from '../types/admin';

export const LIVE_CATEGORIES: CategoryItem[] = [
  { id: '6aa2712acb3d55073acc2101', name: 'Vegetables', slug: 'vegetables', icon: '🥦', bgColor: '#E8F5E9', sortOrder: 1, isActive: true },
  { id: '6aa2712acb3d55073acc2102', name: 'Fruits', slug: 'fruits', icon: '🍎', bgColor: '#FFF3E0', sortOrder: 2, isActive: true },
  { id: '6aa2712acb3d55073acc2103', name: 'Dairy', slug: 'dairy', icon: '🥛', bgColor: '#E3F2FD', sortOrder: 3, isActive: true },
  { id: '6aa2712bcb3d55073acc2104', name: 'Bakery', slug: 'bakery', icon: '🍞', bgColor: '#FFF8E1', sortOrder: 4, isActive: true },
  { id: '6aa2712bcb3d55073acc2105', name: 'Beverages', slug: 'beverages', icon: '🧃', bgColor: '#FCE4EC', sortOrder: 5, isActive: true },
  { id: '6aa2712bcb3d55073acc2106', name: 'Snacks', slug: 'snacks', icon: '🍿', bgColor: '#FBE9E7', sortOrder: 6, isActive: true },
  { id: '6aa11866c6c3e5984e2ef5ea', name: 'Cooking Essentials', slug: 'cooking-essentials', icon: '🧄', bgColor: '#F3E5F5', sortOrder: 7, isActive: true },
];

export const LIVE_CUSTOMERS: Customer[] = [
  {
    "id": "6aa03b67541adcfbf7aa876a",
    "name": "AYUSHI THANKI",
    "phone": "9879432011",
    "email": "darshanthanki77@gmail.com",
    "type": "Individual",
    "zoneId": "z_prahlad",
    "zoneName": "Prahlad Nagar, Ahmedabad",
    "address": "Prahlad Nagar Garden Road Prahlad Nagar Ahmedabad",
    "addresses": [
      {
        "id": "6aa03b86541adcfbf7aa877d",
        "label": "Home",
        "address": "Flat 402, Shivalik High Street Prahlad Nagar, SG Highway Ahmedabad - 380015",
        "zone": "Ahmedabad"
      },
      {
        "id": "6aa04261ef41f4f28882310c",
        "label": "Home",
        "address": "XZY XYZ Ahmedabad - 380015",
        "zone": "Ahmedabad"
      },
      {
        "id": "6aa055e9c67770b3854f0e5c",
        "label": "Current",
        "address": "Current Street Ghatlodiya Taluka Tragad - 382501",
        "zone": "Tragad"
      },
      {
        "id": "6aa055ecc67770b3854f0e62",
        "label": "Current",
        "address": "Current Street Ghatlodiya Taluka Tragad - 382501",
        "zone": "Tragad"
      },
      {
        "id": "6aa1141dccb901a1c84b0385",
        "label": "Current",
        "address": "Prahlad Nagar Garden Road Prahlad Nagar Ahmedabad - 380015",
        "zone": "Ahmedabad"
      },
      {
        "id": "6aa1142bccb901a1c84b0395",
        "label": "Current",
        "address": "Prahlad Nagar Garden Road Prahlad Nagar Ahmedabad - 380015",
        "zone": "Ahmedabad"
      }
    ],
    "status": "Active",
    "spend": 366,
    "totalOrders": 2,
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
    "walletBalance": 0,
    "shoppingCoinBalance": 137,
    "kycStatus": "Pending",
    "createdAt": "08 Sept 2026"
  },
  {
    "id": "6aa0429cef41f4f28882311b",
    "name": "DARSHAN THANKI",
    "phone": "6324957535",
    "email": "mukeshthanki10@gmail.com",
    "type": "Individual",
    "zoneId": "z_prahlad",
    "zoneName": "Ghatlodiya Taluka, Tragad",
    "address": "Current Street Ghatlodiya Taluka Tragad",
    "addresses": [
      {
        "id": "6aa044610d07153332ad4ddb",
        "label": "Current",
        "address": "Current Street Ghatlodiya Taluka Tragad - 382501",
        "zone": "Tragad"
      },
      {
        "id": "6aa044b00d07153332ad4df5",
        "label": "Current",
        "address": "Current Street Ghatlodiya Taluka Tragad - 382501",
        "zone": "Tragad"
      },
      {
        "id": "6aa045330d07153332ad4e0f",
        "label": "Current",
        "address": "Current Street Ghatlodiya Taluka Tragad - 382501",
        "zone": "Tragad"
      }
    ],
    "status": "Active",
    "spend": 334,
    "totalOrders": 1,
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
    "walletBalance": 0,
    "shoppingCoinBalance": 82,
    "kycStatus": "Pending",
    "createdAt": "08 Sept 2026"
  }
];

export const LIVE_ORDERS: Order[] = [
  {
    "id": "WORM-355908-136",
    "customerId": "6aa03b67541adcfbf7aa876a",
    "customerName": "AYUSHI THANKI",
    "customerPhone": "9879432011",
    "address": "Flat 402, Shivalik High Street, Prahlad Nagar, SG Highway, Ahmedabad - 380015",
    "zoneName": "Prahlad Nagar, SG Highway",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "items": [
      {
        "id": "6aa03d53e16ee9e38f2d7b1a",
        "name": "Citizen Raincoat With Zip - Free Size (Transparent) 1 pc",
        "quantityKg": 1,
        "pricePerKg": 329,
        "subtotal": 329
      }
    ],
    "subtotal": 329,
    "deliveryFee": 0,
    "discount": 120,
    "total": 334,
    "status": "Order Placed",
    "riderId": "6ad4c0e28448016b6b21cb9c",
    "riderName": "harry (GJ 25 AE 4974)",
    "riderPhone": "7676677757",
    "riderVehicle": "GJ 25 AE 4974",
    "timeAgo": "19 hrs ago",
    "timestamp": "10:22 PM",
    "timeline": [
      {
        "stage": "Order Placed",
        "timestamp": "10:22 PM",
        "actor": "AYUSHI THANKI",
        "notes": "Paid via UPI - Status: COMPLETED"
      },
      {
        "stage": "Payment Confirmed",
        "timestamp": "10:22 PM",
        "actor": "System Gateway",
        "notes": "Payment verified successfully"
      }
    ]
  },
  {
    "id": "WORM-550147-117",
    "customerId": "6aa0429cef41f4f28882311b",
    "customerName": "DARSHAN THANKI",
    "customerPhone": "6324957535",
    "address": "Current Street, Ghatlodiya Taluka, Tragad - 382501",
    "zoneName": "Ghatlodiya Taluka",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "items": [
      {
        "id": "6aa045e60d07153332ad4e93",
        "name": "Citizen Raincoat With Zip - Free Size (Transparent) 1 pc",
        "quantityKg": 1,
        "pricePerKg": 329,
        "subtotal": 329
      }
    ],
    "subtotal": 329,
    "deliveryFee": 0,
    "discount": 120,
    "total": 334,
    "status": "Order Placed",
    "riderId": "6ad4c0e28448016b6b21cb9c",
    "riderName": "harry (GJ 25 AE 4974)",
    "riderPhone": "7676677757",
    "riderVehicle": "GJ 25 AE 4974",
    "timeAgo": "18 hrs ago",
    "timestamp": "10:59 PM",
    "timeline": [
      {
        "stage": "Order Placed",
        "timestamp": "10:59 PM",
        "actor": "DARSHAN THANKI",
        "notes": "Paid via COD - Status: PENDING"
      },
      {
        "stage": "Payment Confirmed",
        "timestamp": "10:59 PM",
        "actor": "System Gateway",
        "notes": "Payment verified successfully"
      }
    ]
  },
  {
    "id": "WORM-020039-543",
    "customerId": "6aa03b67541adcfbf7aa876a",
    "customerName": "AYUSHI THANKI",
    "customerPhone": "9879432011",
    "address": "Prahlad Nagar Garden Road, Prahlad Nagar, Ahmedabad - 380015",
    "zoneName": "Prahlad Nagar",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "items": [
      {
        "id": "6aa11866c6c3e5984e2ef5ec",
        "name": "Fresh Tomato 250 g",
        "quantityKg": 1,
        "pricePerKg": 12,
        "subtotal": 12
      }
    ],
    "subtotal": 12,
    "deliveryFee": 15,
    "discount": 3,
    "total": 32,
    "status": "Order Placed",
    "riderId": "6ad4c0e28448016b6b21cb9c",
    "riderName": "harry (GJ 25 AE 4974)",
    "riderPhone": "7676677757",
    "riderVehicle": "GJ 25 AE 4974",
    "timeAgo": "50 mins ago",
    "timestamp": "04:53 PM",
    "timeline": [
      {
        "stage": "Order Placed",
        "timestamp": "04:53 PM",
        "actor": "AYUSHI THANKI",
        "notes": "Paid via UPI - Status: COMPLETED"
      },
      {
        "stage": "Payment Confirmed",
        "timestamp": "04:53 PM",
        "actor": "System Gateway",
        "notes": "Payment verified successfully"
      }
    ]
  }
];

export const LIVE_PRODUCTS: ProductItem[] = [
  {
    "id": "6aa11866c6c3e5984e2ef5ec",
    "name": "Fresh Tomato",
    "category": "Vegetables",
    "basePrice": 50,
    "sellingPrice": 40,
    "mrp": 50,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80"
  },
  {
    "id": "6aa11866c6c3e5984e2ef616",
    "name": "Potato",
    "category": "Vegetables",
    "basePrice": 42,
    "sellingPrice": 34,
    "mrp": 42,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1518977676405-d5b01e0ba50c?w=400&q=80"
  },
  {
    "id": "6aa11867c6c3e5984e2ef640",
    "name": "Onion",
    "category": "Vegetables",
    "basePrice": 47,
    "sellingPrice": 38,
    "mrp": 47,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80"
  },
  {
    "id": "6aa11868c6c3e5984e2ef66a",
    "name": "Banana",
    "category": "Fruits",
    "basePrice": 38,
    "sellingPrice": 30,
    "mrp": 38,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&q=80"
  },
  {
    "id": "6aa11868c6c3e5984e2ef684",
    "name": "Capsicum",
    "category": "Vegetables",
    "basePrice": 42,
    "sellingPrice": 34,
    "mrp": 42,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80"
  },
  {
    "id": "6aa11868c6c3e5984e2ef69e",
    "name": "Apple (Himachali)",
    "category": "Fruits",
    "basePrice": 145,
    "sellingPrice": 115,
    "mrp": 145,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80"
  },
  {
    "id": "6aa11868c6c3e5984e2ef6b8",
    "name": "Amul Taza Milk",
    "category": "Others",
    "basePrice": 54,
    "sellingPrice": 50,
    "mrp": 54,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80"
  },
  {
    "id": "6aa11869c6c3e5984e2ef6d2",
    "name": "Curd (Dahi)",
    "category": "Others",
    "basePrice": 25,
    "sellingPrice": 22,
    "mrp": 25,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80"
  },
  {
    "id": "6aa11869c6c3e5984e2ef6f4",
    "name": "Paneer",
    "category": "Others",
    "basePrice": 215,
    "sellingPrice": 185,
    "mrp": 215,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80"
  },
  {
    "id": "6aa11869c6c3e5984e2ef70e",
    "name": "Bread (Brown)",
    "category": "Others",
    "basePrice": 42,
    "sellingPrice": 35,
    "mrp": 42,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"
  },
  {
    "id": "6aa11869c6c3e5984e2ef728",
    "name": "Water Bottle",
    "category": "Others",
    "basePrice": 24,
    "sellingPrice": 20,
    "mrp": 24,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&q=80"
  },
  {
    "id": "6aa11869c6c3e5984e2ef74a",
    "name": "Lay's Chips (Classic)",
    "category": "Others",
    "basePrice": 40,
    "sellingPrice": 38,
    "mrp": 40,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80"
  },
  {
    "id": "6aa1186ac6c3e5984e2ef76c",
    "name": "Tropicana Orange",
    "category": "Fruits",
    "basePrice": 130,
    "sellingPrice": 110,
    "mrp": 130,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80"
  },
  {
    "id": "6aa1186ac6c3e5984e2ef786",
    "name": "Fortune Sunflower Oil",
    "category": "Others",
    "basePrice": 150,
    "sellingPrice": 125,
    "mrp": 150,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80"
  },
  {
    "id": "6aa1186ac6c3e5984e2ef7b0",
    "name": "Tata Salt",
    "category": "Others",
    "basePrice": 26,
    "sellingPrice": 24,
    "mrp": 26,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1598449356475-b9f71db7d847?w=400&q=80"
  },
  {
    "id": "6aa1186ac6c3e5984e2ef7c2",
    "name": "Aashirvaad Atta",
    "category": "Others",
    "basePrice": 340,
    "sellingPrice": 285,
    "mrp": 340,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80"
  },
  {
    "id": "6aa1186bc6c3e5984e2ef7e4",
    "name": "India Gate Basmati Rice",
    "category": "Others",
    "basePrice": 560,
    "sellingPrice": 460,
    "mrp": 560,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [],
    "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80"
  },
  {
    "id": "6aa14bada007143106ce0068",
    "name": "Alphonso Mango (Ratnagiri)",
    "category": "Fruits",
    "basePrice": 180,
    "sellingPrice": 230,
    "mrp": 260,
    "stockKg": 100,
    "isActive": true,
    "priceHistory": [
      {
        "id": "ph_1788955565065",
        "oldBasePrice": 180,
        "newBasePrice": 180,
        "oldSellingPrice": 220,
        "newSellingPrice": 220,
        "oldMrp": 250,
        "newMrp": 250,
        "changedBy": "Admin",
        "changedAt": "2026-09-09T12:06:05.065Z",
        "notes": "Initial Product Creation"
      },
      {
        "id": "ph_1788955585296",
        "oldBasePrice": 180,
        "newBasePrice": 180,
        "oldSellingPrice": 220,
        "newSellingPrice": 230,
        "oldMrp": 250,
        "newMrp": 260,
        "changedBy": "Rahul (Admin)",
        "changedAt": "2026-09-09T12:06:25.296Z",
        "notes": "Admin Price Update"
      }
    ],
    "image": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80"
  }
];

export const LIVE_ZONES: Zone[] = [
  {
    "id": "6aa11866c6c3e5984e2ef5df",
    "name": "Prahlad Nagar",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "activeOrders": 2,
    "gmvSharePercent": 52
  },
  {
    "id": "6aa11866c6c3e5984e2ef5e0",
    "name": "Satellite",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "activeOrders": 0,
    "gmvSharePercent": 0
  },
  {
    "id": "6aa11866c6c3e5984e2ef5e1",
    "name": "Navrangpura",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "activeOrders": 0,
    "gmvSharePercent": 0
  },
  {
    "id": "6aa11866c6c3e5984e2ef5e2",
    "name": "Ghatlodia",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "activeOrders": 0,
    "gmvSharePercent": 0
  },
  {
    "id": "6aa11866c6c3e5984e2ef5e3",
    "name": "Bopal",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "activeOrders": 0,
    "gmvSharePercent": 0
  },
  {
    "id": "6aa11866c6c3e5984e2ef5e4",
    "name": "SG Highway",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "activeOrders": 1,
    "gmvSharePercent": 48
  },
  {
    "id": "6aa11866c6c3e5984e2ef5e5",
    "name": "Thaltej",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "activeOrders": 0,
    "gmvSharePercent": 0
  }
];

export const LIVE_ZONE_PRICES: Record<string, Record<string, number>> = {
  "Prahlad Nagar": {
    "Fresh Tomato": 40,
    "Potato": 34,
    "Onion": 38,
    "Banana": 30,
    "Capsicum": 34,
    "Apple (Himachali)": 115,
    "Amul Taza Milk": 50,
    "Curd (Dahi)": 22,
    "Paneer": 185,
    "Bread (Brown)": 35,
    "Water Bottle": 20,
    "Lay's Chips (Classic)": 38,
    "Tropicana Orange": 110,
    "Fortune Sunflower Oil": 125,
    "Tata Salt": 24,
    "Aashirvaad Atta": 285,
    "India Gate Basmati Rice": 460,
    "Alphonso Mango (Ratnagiri)": 230
  },
  "Satellite": {
    "Fresh Tomato": 40,
    "Potato": 34,
    "Onion": 38,
    "Banana": 30,
    "Capsicum": 34,
    "Apple (Himachali)": 115,
    "Amul Taza Milk": 50,
    "Curd (Dahi)": 22,
    "Paneer": 185,
    "Bread (Brown)": 35,
    "Water Bottle": 20,
    "Lay's Chips (Classic)": 38,
    "Tropicana Orange": 110,
    "Fortune Sunflower Oil": 125,
    "Tata Salt": 24,
    "Aashirvaad Atta": 285,
    "India Gate Basmati Rice": 460,
    "Alphonso Mango (Ratnagiri)": 230
  },
  "Navrangpura": {
    "Fresh Tomato": 40,
    "Potato": 34,
    "Onion": 38,
    "Banana": 30,
    "Capsicum": 34,
    "Apple (Himachali)": 115,
    "Amul Taza Milk": 50,
    "Curd (Dahi)": 22,
    "Paneer": 185,
    "Bread (Brown)": 35,
    "Water Bottle": 20,
    "Lay's Chips (Classic)": 38,
    "Tropicana Orange": 110,
    "Fortune Sunflower Oil": 125,
    "Tata Salt": 24,
    "Aashirvaad Atta": 285,
    "India Gate Basmati Rice": 460,
    "Alphonso Mango (Ratnagiri)": 230
  },
  "Ghatlodia": {
    "Fresh Tomato": 40,
    "Potato": 34,
    "Onion": 38,
    "Banana": 30,
    "Capsicum": 34,
    "Apple (Himachali)": 115,
    "Amul Taza Milk": 50,
    "Curd (Dahi)": 22,
    "Paneer": 185,
    "Bread (Brown)": 35,
    "Water Bottle": 20,
    "Lay's Chips (Classic)": 38,
    "Tropicana Orange": 110,
    "Fortune Sunflower Oil": 125,
    "Tata Salt": 24,
    "Aashirvaad Atta": 285,
    "India Gate Basmati Rice": 460,
    "Alphonso Mango (Ratnagiri)": 230
  },
  "Bopal": {
    "Fresh Tomato": 40,
    "Potato": 34,
    "Onion": 38,
    "Banana": 30,
    "Capsicum": 34,
    "Apple (Himachali)": 115,
    "Amul Taza Milk": 50,
    "Curd (Dahi)": 22,
    "Paneer": 185,
    "Bread (Brown)": 35,
    "Water Bottle": 20,
    "Lay's Chips (Classic)": 38,
    "Tropicana Orange": 110,
    "Fortune Sunflower Oil": 125,
    "Tata Salt": 24,
    "Aashirvaad Atta": 285,
    "India Gate Basmati Rice": 460,
    "Alphonso Mango (Ratnagiri)": 230
  },
  "SG Highway": {
    "Fresh Tomato": 40,
    "Potato": 34,
    "Onion": 38,
    "Banana": 30,
    "Capsicum": 34,
    "Apple (Himachali)": 115,
    "Amul Taza Milk": 50,
    "Curd (Dahi)": 22,
    "Paneer": 185,
    "Bread (Brown)": 35,
    "Water Bottle": 20,
    "Lay's Chips (Classic)": 38,
    "Tropicana Orange": 110,
    "Fortune Sunflower Oil": 125,
    "Tata Salt": 24,
    "Aashirvaad Atta": 285,
    "India Gate Basmati Rice": 460,
    "Alphonso Mango (Ratnagiri)": 230
  },
  "Thaltej": {
    "Fresh Tomato": 40,
    "Potato": 34,
    "Onion": 38,
    "Banana": 30,
    "Capsicum": 34,
    "Apple (Himachali)": 115,
    "Amul Taza Milk": 50,
    "Curd (Dahi)": 22,
    "Paneer": 185,
    "Bread (Brown)": 35,
    "Water Bottle": 20,
    "Lay's Chips (Classic)": 38,
    "Tropicana Orange": 110,
    "Fortune Sunflower Oil": 125,
    "Tata Salt": 24,
    "Aashirvaad Atta": 285,
    "India Gate Basmati Rice": 460,
    "Alphonso Mango (Ratnagiri)": 230
  }
};

export const LIVE_INVENTORY: InventoryItem[] = [
  {
    "id": "inv_tomato_250",
    "productId": "6aa11866c6c3e5984e2ef5ec",
    "variantId": "6aa11866c6c3e5984e2ef5ee",
    "sku": "fresh-tomato-250g",
    "name": "Fresh Tomato",
    "packSize": "250 g",
    "category": "Vegetables",
    "darkStoreId": "6a9ffe87d4a21fe082fbbe2c",
    "darkStoreName": "Wom Up Ahmedabad Central Dark Store",
    "availableKg": 120,
    "reservedKg": 0,
    "lowStockThreshold": 15,
    "status": "Healthy"
  },
  {
    "id": "inv_tomato_500",
    "productId": "6aa11866c6c3e5984e2ef5ec",
    "variantId": "6aa11866c6c3e5984e2ef5ef",
    "sku": "fresh-tomato-500g",
    "name": "Fresh Tomato",
    "packSize": "500 g",
    "category": "Vegetables",
    "darkStoreId": "6a9ffe87d4a21fe082fbbe2c",
    "darkStoreName": "Wom Up Ahmedabad Central Dark Store",
    "availableKg": 80,
    "reservedKg": 0,
    "lowStockThreshold": 15,
    "status": "Healthy"
  },
  {
    "id": "inv_potato_1kg",
    "productId": "6aa11866c6c3e5984e2ef616",
    "variantId": "6aa11866c6c3e5984e2ef619",
    "sku": "potato-1kg",
    "name": "Potato",
    "packSize": "1 kg",
    "category": "Vegetables",
    "darkStoreId": "6a9ffe87d4a21fe082fbbe2c",
    "darkStoreName": "Wom Up Ahmedabad Central Dark Store",
    "availableKg": 45,
    "reservedKg": 0,
    "lowStockThreshold": 15,
    "status": "Healthy"
  },
  {
    "id": "inv_potato_5kg",
    "productId": "6aa11866c6c3e5984e2ef616",
    "variantId": "6aa11866c6c3e5984e2ef61b",
    "sku": "potato-5kg",
    "name": "Potato",
    "packSize": "5 kg",
    "category": "Vegetables",
    "darkStoreId": "6a9ffe87d4a21fe082fbbe2c",
    "darkStoreName": "Wom Up Ahmedabad Central Dark Store",
    "availableKg": 10,
    "reservedKg": 0,
    "lowStockThreshold": 15,
    "status": "Low Stock"
  },
  {
    "id": "inv_onion_1kg",
    "productId": "6aa11867c6c3e5984e2ef640",
    "variantId": "6aa11867c6c3e5984e2ef643",
    "sku": "onion-1kg",
    "name": "Onion",
    "packSize": "1 kg",
    "category": "Vegetables",
    "darkStoreId": "6a9ffe87d4a21fe082fbbe2c",
    "darkStoreName": "Wom Up Ahmedabad Central Dark Store",
    "availableKg": 250,
    "reservedKg": 5,
    "lowStockThreshold": 15,
    "status": "Healthy"
  },
  {
    "id": "inv_banana_6pcs",
    "productId": "6aa11868c6c3e5984e2ef66a",
    "variantId": "6aa11868c6c3e5984e2ef66c",
    "sku": "banana-6pcs",
    "name": "Banana",
    "packSize": "6 pcs",
    "category": "Fruits",
    "darkStoreId": "6a9ffe87d4a21fe082fbbe2c",
    "darkStoreName": "Wom Up Ahmedabad Central Dark Store",
    "availableKg": 60,
    "reservedKg": 0,
    "lowStockThreshold": 15,
    "status": "Healthy"
  },
  {
    "id": "inv_bread_200g",
    "productId": "6aa11869c6c3e5984e2ef70e",
    "variantId": "6aa11869c6c3e5984e2ef710",
    "sku": "brown-bread-200g",
    "name": "Bread (Brown)",
    "packSize": "200 g",
    "category": "Bakery",
    "darkStoreId": "6a9ffe87d4a21fe082fbbe2c",
    "darkStoreName": "Wom Up Ahmedabad Central Dark Store",
    "availableKg": 10,
    "reservedKg": 0,
    "lowStockThreshold": 15,
    "status": "Expired"
  },
  {
    "id": "inv_milk_500ml",
    "productId": "6aa11868c6c3e5984e2ef6b8",
    "variantId": "6aa11868c6c3e5984e2ef6ba",
    "sku": "amul-taza-milk-500ml",
    "name": "Amul Taza Milk",
    "packSize": "500 ml",
    "category": "Dairy",
    "darkStoreId": "6a9ffe87d4a21fe082fbbe2c",
    "darkStoreName": "Wom Up Ahmedabad Central Dark Store",
    "availableKg": 50,
    "reservedKg": 0,
    "lowStockThreshold": 15,
    "status": "Healthy"
  }
];

export const LIVE_STAFF: StaffMember[] = [
  {
    "id": "st_staff_01",
    "name": "Ramesh Patel",
    "phone": "9879100101",
    "role": "Picker",
    "zone": "Prahlad Nagar",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "status": "On Duty",
    "activeOrdersCount": 1,
    "rating": 4.9,
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80"
  },
  {
    "id": "st_rider_01",
    "name": "Vikram Solanki",
    "phone": "9879100102",
    "role": "Rider",
    "zone": "Satellite",
    "darkStore": "Womup Ahmedabad Central Dark Store",
    "status": "On Duty",
    "activeOrdersCount": 1,
    "rating": 4.8,
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80"
  }
];

export const LIVE_CAMPAIGNS: MarketingCampaign[] = [
  {
    "id": "6a9ffe88d4a21fe082fbbe71",
    "name": "FESTIVE20 Promo Campaign",
    "scheduledAt": "Valid till 07 Nov 2026",
    "targetAudience": "All Womup Customers",
    "isEnabled": true,
    "subject": "20% OFF on Festive & Pooja essentials up to ₹75",
    "message": "Apply FESTIVE20 at checkout for 20% OFF! Min order: ₹299.",
    "status": "Completed",
    "sentCount": 2
  },
  {
    "id": "6a9ffe88d4a21fe082fbbe70",
    "name": "WORM100 Promo Campaign",
    "scheduledAt": "Valid till 07 Mar 2027",
    "targetAudience": "All Womup Customers",
    "isEnabled": true,
    "subject": "Flat ₹100 OFF on orders above ₹499",
    "message": "Apply WORM100 at checkout for ₹100 OFF! Min order: ₹499.",
    "status": "Completed",
    "sentCount": 2
  },
  {
    "id": "6a9ffe88d4a21fe082fbbe6f",
    "name": "WELCOME50 Promo Campaign",
    "scheduledAt": "Valid till 08 Sept 2027",
    "targetAudience": "All Womup Customers",
    "isEnabled": true,
    "subject": "Flat ₹50 OFF on your first order above ₹199",
    "message": "Apply WELCOME50 at checkout for ₹50 OFF! Min order: ₹199.",
    "status": "Completed",
    "sentCount": 2
  }
];

export const LIVE_COIN_LEDGER: CoinLedgerItem[] = [
  {
    "id": "6aa0002b0b9291dfedc2b17f",
    "userName": "Ayushi",
    "type": "Earned",
    "amount": 50,
    "reason": "Welcome Reward Coins",
    "timestamp": "08 Sept 2026 06:01 PM"
  },
  {
    "id": "6aa0377147caad50f3e8644c",
    "userName": "Ayushi",
    "type": "Earned",
    "amount": 50,
    "reason": "Welcome Reward Coins",
    "timestamp": "08 Sept 2026 09:57 PM"
  },
  {
    "id": "6aa03b67541adcfbf7aa876c",
    "userName": "AYUSHI THANKI",
    "type": "Earned",
    "amount": 50,
    "reason": "Welcome Reward Coins",
    "timestamp": "08 Sept 2026 10:14 PM"
  },
  {
    "id": "6aa03d54e16ee9e38f2d7b22",
    "userName": "AYUSHI THANKI",
    "type": "Earned",
    "amount": 32,
    "reason": "Earned 10% Shopping Coins reward on Order #WORM-355908-136",
    "timestamp": "08 Sept 2026 10:22 PM"
  },
  {
    "id": "6aa0429cef41f4f28882311d",
    "userName": "DARSHAN THANKI",
    "type": "Earned",
    "amount": 50,
    "reason": "Welcome Reward Coins",
    "timestamp": "08 Sept 2026 10:45 PM"
  },
  {
    "id": "6aa045e60d07153332ad4e9b",
    "userName": "DARSHAN THANKI",
    "type": "Earned",
    "amount": 32,
    "reason": "Earned 10% Shopping Coins reward on Order #WORM-550147-117",
    "timestamp": "08 Sept 2026 10:59 PM"
  },
  {
    "id": "6aa141bc9345f75482f17f62",
    "userName": "AYUSHI THANKI",
    "type": "Earned",
    "amount": 5,
    "reason": "Earned 10% Shopping Coins reward on Order #WORM-020039-543",
    "timestamp": "09 Sept 2026 04:53 PM"
  }
];

export const LIVE_AUDIT_LOGS: AuditLogItem[] = [
  {
    "id": "6aa03d53e16ee9e38f2d7b1f",
    "adminName": "CUSTOMER",
    "action": "Order Status Transition: PLACED",
    "target": "Order #2D7B1D",
    "details": "Order placed by customer",
    "timestamp": "08 Sept 2026 10:22 PM"
  },
  {
    "id": "6aa045e60d07153332ad4e98",
    "adminName": "CUSTOMER",
    "action": "Order Status Transition: PLACED",
    "target": "Order #AD4E96",
    "details": "Order placed by customer",
    "timestamp": "08 Sept 2026 10:59 PM"
  },
  {
    "id": "6aa141bc9345f75482f17f5f",
    "adminName": "CUSTOMER",
    "action": "Order Status Transition: PLACED",
    "target": "Order #F17F5D",
    "details": "Order placed by customer",
    "timestamp": "09 Sept 2026 04:53 PM"
  }
];
