# WormUp Website — Next-Level Quick-Commerce & Cloud Printing Platform 🛒🖨️⚡

A production-grade **MERN (MongoDB, Express, React 19 TSX, Node.js) Website** with **TypeScript**, built strictly to the **WormUp UI/UX SRS & Architecture Blueprint**.

---

## 🌟 8 Production Pages & Routes

1. **Page 01 — Homepage (`/`)**:
   - **Deep Navy Desktop Header (`#071B52`)**: WormUp Logo, navigation links with pink active underline, rounded search bar with live suggestions, location selector (Satellite, Ahmedabad), Cart drawer trigger, and Account link.
   - **Hero Section**: "Save More. Shop Smarter." with "Up to ₹2,000 monthly benefit", Hot Pink CTA `Shop Now`, and circular benefit badge.
   - **Service Benefits (5 Compact Cards)**: 10 Min Quick Delivery, Fresh & Quality Products, Cloud Printing Docs & Photos, Local Shop Earn Coins, Secure Payments.
   - **Shop by Category**: Circular avatars with pastel glows (Fruits & Vegetables, Groceries, Dairy & Eggs, Snacks & Beverages, Home & Kitchen, Personal Care, Baby Care, Health & Wellness, Pet Care).
   - **Top Deals For You**: 4 large promotional cards with up to 50% OFF.
   - **Cloud Printing Hub Banner**: High-contrast purple-to-pink gradient banner (`#6D38E8` ➔ `#FF3B98`).
   - **Why WormUp**: 5 feature cards with glowing outlined icons.
   - **Shop Local Banner**: "Shop Local • Earn More" with QR scan rewards.
   - **Footer**: Deep navy 4-column footer with quick links, app download triggers, and copyright.

2. **Page 02 — Category & Product Listing (`/shop`, `/category/:slug`)**:
   - Breadcrumb navigation (`Home > Shop > Category`).
   - Category Hero Banner with title, subtitle, and badge.
   - Filter Sidebar: Categories, Price Range slider, Brand checklist, Customer Ratings, and In-Stock toggle.
   - Sorting (Featured, Price Low to High, Price High to Low, Rating, Discount).
   - Product Grid with zoom on hover, wishlist heart, and Quick View trigger.

3. **Page 03 — Product Details (`/product/:slug`)**:
   - High-resolution gallery with 4 interactive thumbnails.
   - Verified ratings, MRP strikethrough, discount percentage, and pack unit.
   - Quantity stepper `[-] Qty [+]`, `Add to Cart` and `Buy Now` buttons.
   - 3-point benefits strip (10 Min Delivery, Premium Quality, Easy Returns).
   - Tabbed specifications: Description & Sourcing, Nutritional Facts, Customer Reviews.
   - Similar Products recommendation rail.

4. **Page 04 — Cart & Checkout (`/cart`, `/checkout`)**:
   - Dual-mode: Slide-in **Cart Drawer** + Full **Checkout Page**.
   - Cart items list with live quantity adjuster and item removal.
   - **WormUp Coins Redemption**: 1-click toggle to redeem 69 Coins for ₹69 discount.
   - **Coupon Validation**: `WORMUP50` and `FIRST100` support.
   - **Ahmedabad Address Selector**: Saved addresses (Satellite, S.G. Highway).
   - **Delivery Slot Choice**: Instant 10-15 Min, Evening 6-8 PM, Tomorrow Morning.
   - **Multi-Payment Methods**: UPI / QR, Credit/Debit Cards, Coin Wallet, Cash on Delivery (COD).

5. **Page 05 — Cloud Printing Hub (`/printing`)**:
   - Drag-and-drop file uploader (PDF, DOCX, JPG, PNG) with automatic page counter.
   - Black & White Laser (₹3/pg) vs High-Res Color (₹10/pg).
   - Single-Sided vs Double-Sided sheet calculation.
   - Finishing Add-ons: Corner Stapled, Spiral Binding (+₹30), Plastic Lamination (+₹15/pg).
   - Live automated quotation calculator and instant dispatch in waterproof sealed pouch.

6. **Page 06 — Local Shop (`/local-shop`)**:
   - Directory of neighborhood partner retailers (Kirana, Supermarkets, Bakeries, Pharmacies, Fashion).
   - Distance (km), verified badge, and cashback percentage (e.g. 5% WormUp Coins).
   - **Interactive Counter QR Scanner**: Simulates scanning a merchant standee QR code, entering an offline bill (e.g. ₹500), and instantly crediting coins to the user's wallet!

7. **Page 07 — Account & Profile (`/account`)**:
   - Deep navy sidebar with navigation items.
   - **My Orders**: Order history with status (`OUT_FOR_DELIVERY`, `DELIVERED`), store name, and **Live Dispatch Tracking** button.
   - **Live Delivery PIN (`4821`)**: Prominently displayed for rider verification upon doorstep arrival.
   - **WormUp Coins Wallet**: 69 Coins balance card with ledger of recent offline & online earnings.
   - Saved Addresses management.

8. **Page 08 — Features & Highlights (`/features`)**:
   - "Why Choose WormUp? More Than Just Shopping".
   - 3×2 super-app ecosystem grid.
   - Dark store micro-fulfillment technology explanation.

---

## 🎨 Color System Tokens

| Color Name | Hex Code | Usage |
|---|---|---|
| **Primary Navy** | `#071B52` | Desktop Header, Footer, Hero headings |
| **Secondary Navy** | `#102B68` | Secondary container gradients |
| **Hot Pink** | `#FF3B98` | Primary CTA buttons, badges, active underlines |
| **Pink** | `#FF5BAA` | Gradient stops, hover states |
| **Purple** | `#7856F6` | Feature icons, category borders, tags |
| **Light Purple** | `#EEE6FF` | Soft card borders, icon backings |
| **Soft Lavender** | `#F8F2FF` | Pill backgrounds, subtle card tints |
| **Page Background** | `#FBFCFF` | High-contrast clean canvas |
| **Success** | `#13B978` | In-stock badges, delivered status |

---

## 🚀 Running the Project

From the root project directory:
```bash
npm run dev
```

- **Frontend (Vite + React TSX)**: [http://localhost:5173/](http://localhost:5173/)
- **Backend (Express + TypeScript API)**: [http://localhost:5001/](http://localhost:5001/)
- **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)
