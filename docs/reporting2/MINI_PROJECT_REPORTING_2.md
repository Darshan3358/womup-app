# Academic Mini Project — Reporting 2

**Project Title:** **WormUp — Hyperlocal Quick Commerce, Dark Store Fleet Logistics & Cloud Printing Platform**  
**Academic Session:** 2026–2027  
**Technology Stack:** React 19, TypeScript, React Native (Expo), NestJS & Node.js, Express, MongoDB Atlas Cluster (v7.0), Socket.IO WebSockets, Cloudinary CDN.  
**Deliverable Type:** Phase 2 Detailed System Design, Module Architecture & Data Modeling Report  
**PowerPoint File:** [`WormUp_Mini_Project_Reporting_2.pptx`](file:///Users/thankiayushi/Desktop/WORM%20UP%20APP/WormUp_Mini_Project_Reporting_2.pptx)  
*Note: In accordance with presentation guidelines, live production demonstration is conducted directly on screen. The presentation and report focus on engineering design, system architecture, module data flows, and database dictionaries.*

---

## Slide-by-Slide Detailed Presentation Content

```
================================================================================
SLIDE 1: TITLE SLIDE (Navy Theme)
================================================================================
[Category Tag]: ACADEMIC MINI PROJECT REPORTING 2
[Title]: WORMUP: HYPERLOCAL QUICK COMMERCE, DARK STORE LOGISTICS & CLOUD PRINTING
[Subtitle]: Phase 2 Detailed Design, System Architecture, Module Decomposition & Data Modeling
[Tech Stack]: React 19 • React Native (Expo) • NestJS & Express • MongoDB Atlas Cluster • Socket.IO Telemetry
[Footer]: Project Team: WormUp Development Team | Academic Session: 2026-2027
          (All live workflows demonstrated directly on screen during committee review)

================================================================================
SLIDE 2: EXECUTIVE SUMMARY & REPORTING 2 SCOPE
================================================================================
[Category Tag]: OVERVIEW & SCOPE
[Title]: Executive Summary & Reporting 2 Objectives

• Reporting 1 Foundation (Recap):
  - Formulated System Requirement Specification (SRS) for quick commerce friction points.
  - Feasibility study for 10-minute grocery delivery and zero-wait cloud printing logistics.
  - Defined actor permissions: Customers, Store Pickers, Delivery Riders, Super Administrators.

• Reporting 2 Engineering Scope (Current Deliverable):
  - Transitioned from SRS to Modular Implementation & Distributed Architecture.
  - Detailed design of 5 core enterprise subsystems with state machines and data flows.
  - Implemented Dynamic Area-Pricing Engine with multi-tier overrides ({variantId, areaId}).
  - Created Normalized Database Schema & Comprehensive Data Dictionary for all 9 collections.

• Live Demonstration Strategy:
  - System functions, live UI interactions, and state sync are shown directly in real-time.
  - Presentation focuses strictly on architecture, algorithms, and schema definitions.

================================================================================
SLIDE 3: HIGH-LEVEL DISTRIBUTED SYSTEM ARCHITECTURE
================================================================================
[Category Tag]: SYSTEM ARCHITECTURE
[Title]: Multi-Tier Distributed System Architecture
[Visual Asset]: docs/reporting2/diagrams/system_architecture.png

• Presentation Layer:
  - Customer Web PWA (React 19, Vite, HTML5 Geolocation API, Context API).
  - Dark Store App (React Native, Expo, Barcode Scanner, Digital Pick-List).
  - Delivery Partner App (React Native, Expo, GPS Telemetry Engine, Digital POD).
  - Admin Portal (React 19, Fleet Tracking Dashboard, Area Pricing Engine).

• Application Gateway & Real-Time Event Bus:
  - NestJS API Gateway with JWT Guards, RBAC, Rate Limiting, and DTO validation.
  - Bidirectional Socket.IO Gateway for order status channels and telemetry rooms.
  - Specialized Micro-Engines: Dynamic Area Pricing, Dispatch Routing, Print Estimator.

• Data & Cloud Tier:
  - MongoDB Atlas Cluster with geospatial 2dsphere indexing and compound unique indices.
  - Cloudinary CDN for encrypted document staging and media delivery.

================================================================================
SLIDE 4: DATA FLOW DIAGRAM (DFD LEVEL 1)
================================================================================
[Category Tag]: SYSTEM MODELING
[Title]: Data Flow Diagram (DFD Level 1 Decomposition)
[Visual Asset]: docs/reporting2/diagrams/dfd_level1.png

• External Interacting Entities:
  - Customer: Transmits GPS coordinates, queries catalog, places grocery & print orders.
  - Dark Store Picker: Receives pick-lists, scans shelf bins (A1-R1), updates pack status.
  - Delivery Partner: Receives dispatch pings, streams live GPS telemetry, verifies doorstep OTP.
  - Super Admin: Configures area price overrides, audits transactions, manages fleet roster.

• Decomposed Functional Processes:
  - Process 1.0 (Catalog & Pricing): Resolves Area Price vs Default Base Price by GPS coordinates.
  - Process 2.0 (Order & Payment): Commits atomic order docs, redeems coins, deducts wallet cash.
  - Process 3.0 (Dark Store Fulfillment): Generates digital pick-lists, decrements inventory stock.
  - Process 4.0 (Fleet Dispatch): Dispatches orders using Haversine algorithm, streams socket telemetry.

================================================================================
SLIDE 5: FUNCTIONAL MODULE BREAKDOWN
================================================================================
[Category Tag]: MODULE DECOMPOSITION
[Title]: 5 Core Subsystems Architecture

• Module 1: Customer Web & Mobile Portal
  - Geofenced live catalog, multi-weight variant selection (250g, 500g, 1kg, 2kg).
  - Dynamic Area Price fallback, cart persistence, loyalty coins redemption, live tracking.

• Module 2: Dark Store Operations & Fulfillment
  - Multi-hub inventory synchronization, digital pick-and-pack workflow, shelf bin tagging.
  - Sub-3-minute fulfillment SLA, store shift state control (On Duty / Off Duty).

• Module 3: Delivery Partner & Fleet Dispatch
  - Automated proximity dispatch (<1.5 km), real-time GPS coordinate telemetry.
  - Digital Proof of Delivery (doorstep OTP), dynamic distance tariff calculation.

• Module 4: Cloud Printing & Document Pipeline
  - Multi-page document upload (PDF/DOCX), automatic page count detector.
  - Custom print options (B&W ₹2, Color ₹10, Spiral Binding ₹35), 15-minute doorstep delivery.

• Module 5: Central Admin Portal & Pricing Engine
  - Dynamic Area-Pricing override engine, customer and rider profile editor.
  - Live fleet tracking monitor, dark store shift manager, financial reconciliation audit.

================================================================================
SLIDE 6: MODULE 1 — CUSTOMER WEB & MOBILE PORTAL
================================================================================
[Category Tag]: MODULE 1 SPECIFICATION
[Title]: Customer App & Dynamic Area-Pricing Lifecycle
[Visual Asset]: docs/reporting2/diagrams/module1_customer_flow.png

• Geolocation Detection:
  - Resolves customer latitude/longitude into target Area ID and assigned Dark Store ID.
• Dynamic Price Resolution:
  - Queries /api/v1/products/:id?areaId=... to retrieve localized tariffs.
  - Example: Fresh Tomato in Chandlodiya - Tragad resolves to ₹7 (53% Off) instead of default ₹11.
• Multi-Variant Support:
  - Instant client-side switching between pack sizes (250 g, 500 g, 1 kg, 2 kg).
• Cart & Checkout Resilience:
  - Atomic stock validation, coupon application, and partial loyalty coins payment.
• Real-time Telemetry:
  - Subscribes to order_{orderNumber} WebSocket room for live rider GPS countdown.

================================================================================
SLIDE 7: MODULE 2 — DARK STORE OPERATIONS & FULFILLMENT
================================================================================
[Category Tag]: MODULE 2 SPECIFICATION
[Title]: Dark Store Pick, Pack & Fulfillment State Machine
[Visual Asset]: docs/reporting2/diagrams/module2_darkstore_flow.png

• Target Fulfillment SLA: Under 3 minutes total pick and pack duration.
• Step 1 — Auto Allocation: Order assigned by geo-perimeter; audio alert sounded at dark store terminal.
• Step 2 — Picker Route: Digital pick-list sorted by physical shelf bin (e.g. A1-R1 -> B2-R3).
• Step 3 — Packing Station: Barcodes verified, items sealed in eco-friendly tamper-proof bags.
• Step 4 — Rider Handover: Delivery partner scans bag QR token; state transitioned to DISPATCHED.
• Inventory Synchronization: Variant stock decremented atomically within MongoDB session transaction.

================================================================================
SLIDE 8: MODULE 3 — DELIVERY PARTNER & FLEET DISPATCH
================================================================================
[Category Tag]: MODULE 3 SPECIFICATION
[Title]: Express Rider Dispatch & Telemetry Workflow
[Visual Asset]: docs/reporting2/diagrams/module3_rider_fleet_flow.png

• Proximity Dispatch: Identifies idle riders within 1.5 km of store hub using Haversine formula.
• Dispatch Ping: 45-second acceptance window; auto-escalates to next nearest partner if unanswered.
• Continuous Telemetry: Transmits GPS coordinates every 5 seconds over Socket.IO channels.
• Dynamic Tariff Formula:
  Payout = (BasePay [₹35] + Distance [km] × PerKmRate [₹12]) × SurgeMultiplier [1.0x - 1.5x]
• Proof of Delivery (POD): Doorstep OTP verified before payout is unlocked into rider wallet.

================================================================================
SLIDE 9: MODULE 4 — CLOUD PRINTING & DOCUMENT PIPELINE
================================================================================
[Category Tag]: MODULE 4 SPECIFICATION
[Title]: Cloud Printing & On-Demand Document Pipeline
[Visual Asset]: docs/reporting2/diagrams/module4_cloud_printing_flow.png

• Document Ingestion: Uploads PDF, DOCX, and high-res images via Cloudinary encrypted CDN.
• Automated Analysis: Server-side page count detector determines document length.
• Custom Print Specifications:
  - Monochrome (₹2/page) vs Full Color (₹10/page).
  - Single-sided vs Back-to-Back duplex discount.
  - Finishing: Corner stapling (free), Spiral binding (₹35), Hard cover (₹120).
• Store Hub Spooling: Dispatched to laser printer stationed inside nearest dark store.
• Privacy Shredder: Temporary signed URLs; document files auto-purged from cloud within 24 hours.

================================================================================
SLIDE 10: MODULE 5 — ADMIN CONTROL PORTAL & PRICING ENGINE
================================================================================
[Category Tag]: MODULE 5 SPECIFICATION
[Title]: Central Admin Portal & Dynamic Area-Pricing Engine
[Visual Asset]: docs/reporting2/diagrams/module5_admin_pricing_engine.png

• Area-Specific Pricing Engine:
  - Admin assigns special prices per area without altering master product catalog.
  - Formula: Customer Price = Area Price (if set) ELSE Default Base Price.
• User & Rider Profile Control:
  - Full management of customer profiles (Name, Phone, Email, Address, Active/Blocked).
  - Delivery fleet management (Full Name, Phone, Vehicle, Hub, Duty Shift, Verification).
• Dark Store Fleet Monitor:
  - Live overview of all 15 dark store hubs, active shifts, and pending packing queues.
• Financial Settlement:
  - Payout tariff editor (Global, City, Area) and store wallet reconciliation.

================================================================================
SLIDE 11: DATABASE ARCHITECTURE & ENTITY RELATIONSHIP MODEL
================================================================================
[Category Tag]: DATABASE DESIGN
[Title]: Entity Relationship (ER) Model & Logical Schemas
[Visual Asset]: docs/reporting2/diagrams/er_diagram.png

• Storage Architecture: MongoDB Atlas (Document-oriented NoSQL).
• Design Rationale:
  - High write throughput for location telemetry and stock increments.
  - Flexible sub-document schema for dynamic product variants and order items.
  - Geospatial 2dsphere index for low-latency proximity queries.
• Core Relationships:
  - STORES 1 : N AREAS (Store serves multiple delivery areas).
  - PRODUCTS 1 : N VARIANTS (Parent product contains weight variants).
  - VARIANTS 1 : N AREA_PRICING (Variant has localized prices per area).
  - USERS 1 : N ORDERS (Customer creates multiple orders).
  - ORDERS 1 : N ORDER_ITEMS (Order contains purchased variants).
  - RIDERS 1 : N ORDERS (Rider fulfills assigned deliveries).
```

---

## Complete Data Dictionary Specification

### 1. Collection: `users`
Represents registered customers, dark store operators, delivery riders, and administrators.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique user document identifier |
| `name` | `String` | Required, Indexed | Legal full name of the user |
| `phone` | `String` | Unique, Required | Mobile contact number in E.164 format (`+91...`) |
| `email` | `String` | Optional, Indexed | Email address for invoices and account security |
| `role` | `String` | Enum, Default: `CUSTOMER` | Roles: `CUSTOMER`, `STORE_STAFF`, `RIDER`, `ADMIN` |
| `walletBalance` | `Number` | Min: 0, Default: 0 | Cash balance in user wallet for fast checkout |
| `shoppingCoins` | `Number` | Min: 0, Default: 50 | Loyalty coins balance redeemable against orders |
| `referralCode` | `String` | Unique, Sparse | Alphanumeric referral code (e.g. `WORM3537`) |
| `isPhoneVerified` | `Boolean` | Default: `false` | SMS OTP verification flag |
| `isActive` | `Boolean` | Default: `true` | Account active state (`true` = Active, `false` = Blocked) |
| `createdAt` | `Date` | Auto Timestamp | User account creation timestamp |
| `updatedAt` | `Date` | Auto Timestamp | Profile last updated timestamp |

---

### 2. Collection: `stores`
Represents physical dark store fulfillment warehouses and hubs.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique dark store hub identifier |
| `code` | `String` | Unique, Required | Internal operational hub code (e.g. `STO-01`) |
| `name` | `String` | Required | Hub display name (e.g. *Wom Up Chandlodiya - Tragad*) |
| `geoCoordinates` | `GeoJSON Point` | 2dsphere Index | `[longitude, latitude]` for proximity delivery mapping |
| `address` | `String` | Required | Physical street address of warehouse facility |
| `cityName` | `String` | Required, Indexed | Operational city (e.g. *Ahmedabad*) |
| `areaName` | `String` | Required | Operational district/locality |
| `pincode` | `String` | Required | 6-digit postal area code (e.g. `380061`) |
| `isOnShift` | `Boolean` | Default: `true` | Real-time shift state (`true` = Open, `false` = Closed) |
| `deliveryRadiusKm`| `Number` | Default: `3.5` | Maximum delivery perimeter covered by this hub |
| `createdAt` | `Date` | Auto Timestamp | Hub onboarding date |

---

### 3. Collection: `products`
Master catalog items representing base products across all dark stores.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique master product identifier |
| `name` | `String` | Required, Indexed | Product brand and title (e.g. *Fresh Tomato*) |
| `slug` | `String` | Unique, Required | URL-safe slug identifier (`fresh-tomato`) |
| `categoryId` | `ObjectId` | Foreign Key -> `categories` | Category document reference (Vegetables, Fruits, etc.) |
| `imageUrl` | `String` | Required URL | Cloudinary primary thumbnail URL |
| `images` | `Array<String>` | Optional | Gallery of high-resolution product imagery |
| `basePrice` | `Number` | Min: 0, Required | Default platform-wide fallback price (₹11) |
| `mrp` | `Number` | Min: 0, Required | Maximum Retail Price for default discount calculations |
| `shelfLife` | `String` | Optional | Perishable expiry guide (e.g. `4 - 6 Days`) |
| `stock` | `Number` | Min: 0, Default: 0 | Total aggregated stock across fulfillment network |
| `shelfLocation` | `String` | Optional | Default warehouse shelf bin tag (e.g. `A1-R1`) |
| `isActive` | `Boolean` | Default: `true` | Visibility toggle in customer mobile app |

---

### 4. Collection: `product_variants`
Represents specific weight, size, and packaging variants of catalog items.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique product variant identifier |
| `productId` | `ObjectId` | Foreign Key -> `products` | Parent product document reference |
| `label` | `String` | Required | Unit size or weight tag (`250 g`, `500 g`, `1 kg`, `2 kg`) |
| `price` | `Number` | Min: 0, Required | Default base catalog price for this specific variant |
| `mrp` | `Number` | Min: 0, Required | Base MRP for this variant |
| `discountPercent` | `Number` | Computed | Discount percentage `((mrp - price) / mrp) * 100` |
| `barcode` | `String` | Optional, Indexed | EAN-13 / Code-128 barcode for store scanner verification |
| `stock` | `Number` | Min: 0, Default: 100 | Quantity available in dark store inventory |
| `isDefault` | `Boolean` | Default: `false` | Initial variant preselected on product card |

---

### 5. Collection: `area_pricing`
Stores dynamic area-specific pricing overrides set by Super Administrator.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique area pricing record identifier |
| `productId` | `ObjectId / String` | Foreign Key, Indexed | Target product ID |
| `variantId` | `ObjectId / String` | Foreign Key, Compound Index | Target variant ID (`{ variantId: 1, areaId: 1 }`) |
| `areaId` | `ObjectId / String` | Foreign Key, Compound Index | Target delivery area ID (e.g. `6aac257b8f337240651ef43c`) |
| `storeId` | `ObjectId / String` | Optional Foreign Key | Store hub override ID |
| `price` | `Number` | Min: 0, Required | **Area Override Price** (e.g. Tomato 250g = **₹7**) |
| `mrp` | `Number` | Optional | Localized MRP for area (₹15) |
| `discountPercent` | `Number` | Computed | Localized discount rate (53% Off) |
| `isAvailable` | `Boolean` | Default: `true` | Area availability flag |
| `updatedAt` | `Date` | Auto Timestamp | Timestamp of last price change by Admin |

---

### 6. Collection: `orders`
Header and itemized breakdown of completed grocery orders.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique order document identifier |
| `orderNumber` | `String` | Unique, Indexed | Human tracking code (e.g. `WUP-94821`) |
| `userId` | `ObjectId` | Foreign Key -> `users` | Customer reference who placed order |
| `storeId` | `ObjectId` | Foreign Key -> `stores` | Assigned fulfilling dark store hub |
| `riderId` | `ObjectId` | Foreign Key -> `delivery_partners` | Assigned delivery partner |
| `items` | `Array<Object>` | Embedded Array | Array of `{ variantId, name, quantity, price, mrp }` |
| `subtotal` | `Number` | Required | Aggregated items sum |
| `discountAmount` | `Number` | Default: 0 | Promo coupon or coins discount |
| `deliveryFee` | `Number` | Default: 0 | Distance/speed delivery charge |
| `totalAmount` | `Number` | Required | Net payable amount charged to customer |
| `status` | `String` | Enum | `PLACED`, `PACKING`, `PACKED`, `DISPATCHED`, `DELIVERED` |
| `deliveryAddress` | `Object` | Embedded Doc | Customer delivery street, area, house number, coordinates |
| `otp` | `String` | 4 Digits | Doorstep delivery authentication PIN |
| `createdAt` | `Date` | Auto Timestamp | Order placement timestamp |

---

### 7. Collection: `print_orders`
Stores document upload records and printing configuration parameters.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique cloud print order ID |
| `orderNumber` | `String` | Unique, Indexed | Tracking identifier (`PRT-1029`) |
| `userId` | `ObjectId` | Foreign Key -> `users` | Customer reference |
| `storeId` | `ObjectId` | Foreign Key -> `stores` | Dark store printer terminal assigned |
| `fileUrl` | `String` | Required URL | Encrypted Cloudinary temporary document URL |
| `pageCount` | `Number` | Min: 1 | Number of pages detected |
| `copies` | `Number` | Min: 1, Default: 1 | Number of document copies requested |
| `colorType` | `String` | `B&W` \| `COLOR` | Print mode (`B&W` = ₹2/page, `COLOR` = ₹10/page) |
| `isDoubleSided` | `Boolean` | Default: `false` | Back-to-back duplex printing selection |
| `bindingType` | `String` | Enum | `NONE`, `STAPLE`, `SPIRAL`, `HARD_COVER` |
| `paperGsm` | `String` | Default: `75_GSM` | Standard 75 GSM vs Executive 100 GSM paper |
| `totalAmount` | `Number` | Required | Computed total printing and binding charge |
| `status` | `String` | Enum | `UPLOADED`, `PRINTING`, `PACKED`, `DELIVERED` |

---

### 8. Collection: `delivery_partners`
Rider fleet roster, vehicles, and real-time operational telemetry.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique rider identifier |
| `userId` | `ObjectId` | Foreign Key -> `users` | Linked account document reference |
| `partnerCode` | `String` | Unique, Indexed | Rider display identifier (e.g. `RDR-6190`) |
| `fullName` | `String` | Required | Rider legal full name |
| `phoneNumber` | `String` | Required | Contact phone number |
| `hubId` | `ObjectId` | Foreign Key -> `stores` | Primary assigned dark store warehouse |
| `hubName` | `String` | Indexed | Name of dark store hub base |
| `city` | `String` | Required | Operational city (e.g. *Ahmedabad*) |
| `vehicleType` | `String` | Enum | `BIKE`, `EV_SCOOTER`, `SCOOTER`, `BICYCLE` |
| `vehicleNumber` | `String` | Required | Vehicle registration plate (e.g. `GJ AE 7898`) |
| `status` | `String` | Enum | `APPROVED`, `PENDING`, `SUSPENDED`, `REJECTED` |
| `isOnline` | `Boolean` | Indexed, Default: `true` | Shift duty state (`true` = On Duty, `false` = Off Duty) |
| `rating` | `Number` | Range: `1.0 - 5.0` | Customer satisfaction rating (e.g. `5.0`) |
| `completedDeliveries`| `Number`| Default: 0 | Total successful orders delivered |

---

### 9. Collection: `rider_payout_rates`
Tariff matrices for calculating delivery partner compensations.

| Field Name | BSON Data Type | Constraints & Key | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary Key, Auto | Unique payout rate identifier |
| `scope` | `String` | Enum | Scope hierarchy: `GLOBAL`, `CITY`, `AREA` |
| `areaId` | `ObjectId / String` | Optional, Indexed | Area override filter |
| `cityId` | `ObjectId / String` | Optional, Indexed | City override filter |
| `basePay` | `Number` | Min: 0, Default: 35 | Fixed compensation per successful pickup (₹35) |
| `perKmRate` | `Number` | Min: 0, Default: 12 | Distance payment per kilometer traveled (₹12/km) |
| `surgeMultiplier` | `Number` | Default: 1.0 | Weather/rush hour demand multiplier (e.g. `1.2x`) |
| `isActive` | `Boolean` | Default: `true` | Rate rule active toggle |

---

## Core Algorithms & Formulae

### 1. Dynamic Area Price Resolution Engine
```typescript
/**
 * Resolves the final display price for a product variant.
 * Precedence: Area Price Override -> Catalog Base Price
 */
function resolveVariantPrice(
  variant: ProductVariant,
  areaPricingRecords: AreaPricingRecord[],
  targetAreaId?: string
): DisplayPriceResult {
  if (targetAreaId) {
    const override = areaPricingRecords.find(
      (rec) =>
        String(rec.variantId) === String(variant.id || variant._id) &&
        String(rec.areaId) === String(targetAreaId) &&
        rec.isAvailable !== false
    );
    if (override && typeof override.price === 'number') {
      const mrp = override.mrp || variant.mrp || override.price;
      const discount = mrp > override.price ? Math.round(((mrp - override.price) / mrp) * 100) : 0;
      return {
        price: override.price,
        mrp: mrp,
        discountPercent: discount,
        source: 'AREA_OVERRIDE',
      };
    }
  }

  // Fallback: Master Catalog Default Base Price
  const basePrice = variant.price;
  const baseMrp = variant.mrp || basePrice;
  const baseDiscount = baseMrp > basePrice ? Math.round(((baseMrp - basePrice) / baseMrp) * 100) : 0;
  return {
    price: basePrice,
    mrp: baseMrp,
    discountPercent: baseDiscount,
    source: 'DEFAULT_CATALOG',
  };
}
```

### 2. Haversine Road Distance Calculation
```typescript
function calculateHaversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;
  
  // Apply urban road curvature detour factor (1.35x for city corridors)
  return parseFloat((straightLineDistance * 1.35).toFixed(2));
}
```

### 3. Dynamic Rider Payout Tariff Formula
$$\text{Total Payout} = \Big(\text{BasePay} + (\text{Distance}_{\text{km}} \times \text{PerKmRate})\Big) \times \text{SurgeMultiplier}$$

*Example (2.4 km delivery in Chandlodiya - Tragad during light rain with 1.2x surge):*
$$\text{Total Payout} = \Big(₹35 + (2.4 \times ₹12)\Big) \times 1.2 = (35 + 28.80) \times 1.2 = ₹63.80 \times 1.2 = ₹76.56$$

---

## Reporting 2 Progress & Milestone Audit

| Milestone | Target Deliverable | Status | Verification Proof |
| :--- | :--- | :---: | :--- |
| **M1: SRS & Architecture** | Multi-tier architecture specification & DFDs | **100% Completed** | Complete DFD L1 and Multi-tier architecture diagrams |
| **M2: Database Modeling** | 9 Normalized Collections on MongoDB Atlas | **100% Completed** | Atlas cluster live, indexed with compound keys |
| **M3: Customer Web Catalog** | Dynamic catalog with multi-variant switcher | **100% Completed** | Verified on `localhost:5173/#/product` |
| **M4: Dynamic Area Pricing** | Area override engine with fallback | **100% Completed** | Tragad Fresh Tomato (250g = ₹7) vs Thaltej (₹12) |
| **M5: Dark Store Fulfillment** | Pick-lists, shelf bin tags, shift toggle | **100% Completed** | Store inventory controller & shift state machine |
| **M6: Delivery Fleet Dispatch** | GPS telemetry & dynamic payout calculator | **100% Completed** | Socket.IO telemetry & driver wallet credit |
| **M7: Cloud Printing Pipeline** | Upload, page count, pricing & dispatch | **100% Completed** | Encrypted Cloudinary storage & 15-min SLA |
| **M8: Central Admin Portal** | Real-time fleet, customer & rider edit | **100% Completed** | Verified on `localhost:5175/` |

---

## Instructions to Generate & Present the PowerPoint File

1. **All Diagrams are Pre-Rendered**:
   The 8 crisp, publication-quality architecture and flow diagrams are generated in:
   `docs/reporting2/diagrams/*.png`

2. **To Build / Regenerate the PowerPoint (`.pptx`)**:
   Run the following command in your terminal:
   ```bash
   python3 scripts/build_reporting2_pptx.py
   ```
   This will output:
   `WormUp_Mini_Project_Reporting_2.pptx` (22 Widescreen 16:9 slides).

3. **Presentation Delivery Tips**:
   * **Do Not Put UI Screenshots in Slides:** You are demonstrating the live running project on screen! Slides 1–21 focus on architectural depth, data dictionaries, algorithms, and engineering design.
   * **Transition to Live Demo:** At Slide 22, transition smoothly to your browser windows (`localhost:5173` for Customer, `localhost:5175` for Admin, and mobile simulators for Store/Rider) to demonstrate the live order flow, area price changes, and customer/rider editing!
