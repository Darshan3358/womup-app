import { Platform } from 'react-native';
import {
  Customer,
  DeliveryPartnerItem,
  Order,
  ProductItem,
  ProductVariantItem,
  AreaPricingRecord,
  Zone,
  InventoryItem,
  StaffMember,
  MarketingCampaign,
  CoinLedgerItem,
  AuditLogItem,
  PrintOrder,
  PricingCategory,
  CategoryItem,
  SubCategoryItem,
  DarkStoreItem,
  CityItem,
  PayoutRateItem,
  PayoutStats,
} from '../types/admin';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5001';
    }
  }
  return 'https://womup-admin-backend.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();


export interface LiveDbData {
  customers: Customer[];
  riders: DeliveryPartnerItem[];
  orders: Order[];
  printOrders: PrintOrder[];
  products: ProductItem[];
  categories: CategoryItem[];
  cities: CityItem[];
  zones: Zone[];
  stores: DarkStoreItem[];
  zonePrices: Record<string, Record<string, number>>;
  areaPricing: Record<string, Record<string, number>>;
  areaPricingRecords: AreaPricingRecord[];
  inventory: InventoryItem[];
  staff: StaffMember[];
  campaigns: MarketingCampaign[];
  coinLedger: CoinLedgerItem[];
  auditLogs: AuditLogItem[];
}

export const ApiService = {
  getInitialData(): LiveDbData {
    return {
      customers: [],
      riders: [],
      orders: [],
      printOrders: [],
      products: [],
      categories: [],
      cities: [],
      zones: [],
      stores: [],
      zonePrices: {},
      areaPricing: {},
      areaPricingRecords: [],
      inventory: [],
      staff: [],
      campaigns: [],
      coinLedger: [],
      auditLogs: [],
    };
  },

  // Dynamic live snapshot parser connecting directly to MongoDB Atlas
  async fetchLiveSnapshot(): Promise<LiveDbData | null> {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        // 35s timeout to allow Render free-tier cold start & mobile latency
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        const res = await fetch(`${API_BASE_URL}/api/realtime-data`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

      if (data && data.users) {
        // 1. DYNAMICALLY MAP CUSTOMERS FROM LIVE MONGODB (Excluding Delivery Partners)
        const partnerUserIds = (data.deliveryPartners || []).map((dp: any) => (dp.userId?.toString ? dp.userId.toString() : String(dp.userId))).filter(Boolean);
        const customerUsers = (data.users || []).filter((u: any) => {
          const uId = u._id?.toString ? u._id.toString() : String(u._id);
          const role = (u.role || '').toUpperCase();
          return role !== 'DELIVERY_PARTNER' && !partnerUserIds.includes(uId);
        });

        const dynamicCustomers: Customer[] = customerUsers.map((u: any, idx: number) => {
          const userOrders = (data.orders || []).filter((o: any) => o.userId && (o.userId.toString() === u._id || o.userId === u._id));
          const totalSpend = userOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
          const userAddrs = (data.addresses || []).filter((a: any) => a.userId && (a.userId.toString() === u._id || a.userId === u._id));
          const primary = userAddrs.find((a: any) => a.isDefault) || userAddrs[0] || {
            houseNumber: '',
            street: 'Prahlad Nagar',
            city: 'Ahmedabad',
            pincode: '380015',
            label: 'Home'
          };

          return {
            id: u._id.toString ? u._id.toString() : u._id,
            name: u.name || 'WormUp Customer',
            phone: u.phone || '',
            email: u.email || '',
            type: u.role === 'CORPORATE' ? 'Corporate' : 'Individual',
            zoneId: 'z1',
            zoneName: primary.city ? `${primary.street}, ${primary.city}` : 'Ahmedabad',
            address: `${primary.houseNumber || ''} ${primary.street || ''} ${primary.city || 'Ahmedabad'}`.trim(),
            addresses: userAddrs.map((addr: any, aIdx: number) => ({
              id: addr._id ? addr._id.toString() : `addr_${aIdx}`,
              label: addr.label || 'Home',
              address: `${addr.houseNumber || ''} ${addr.street || ''} ${addr.city || 'Ahmedabad'} ${addr.pincode ? '- ' + addr.pincode : ''}`.trim(),
              zone: addr.city || 'Ahmedabad'
            })),
            status: u.isActive !== false ? 'Active' : 'Blocked',
            spend: totalSpend,
            totalOrders: userOrders.length,
            avatar: u.avatar || (idx === 0 ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80'),
            walletBalance: u.walletBalance || 0,
            shoppingCoinBalance: u.shoppingCoins || 0,
            kycStatus: u.isPhoneVerified ? 'Verified' : 'Pending',
            createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
          };
        });

        // 1b. DYNAMICALLY MAP DELIVERY PARTNERS (RIDERS) FROM LIVE MONGODB
        const dynamicRiders: DeliveryPartnerItem[] = (data.deliveryPartners || []).map((r: any) => ({
          id: r._id ? (r._id.toString ? r._id.toString() : r._id) : r.partnerCode,
          partnerCode: r.partnerCode || 'RDR-0000',
          name: r.fullName || 'Delivery Partner',
          phone: r.phoneNumber || '',
          email: r.email || '',
          avatar: r.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
          hubName: r.hubName || 'Satellite Hub Dark Store',
          city: r.city || 'Ahmedabad',
          vehicleType: r.vehicleType || 'EV_SCOOTER',
          vehicleNumber: r.vehicleNumber || 'GJ-01-ET-4829',
          status: r.status || 'APPROVED',
          verificationStatus: r.verificationStatus || 'VERIFIED',
          isOnline: r.isOnline !== false,
          rating: Number(r.rating) || 4.88,
          totalDeliveries: Number(r.totalDeliveries) || 0,
          completedDeliveries: Number(r.completedDeliveries) || 0,
          acceptanceRate: Number(r.acceptanceRate) || 95,
          completionRate: Number(r.completionRate) || 98,
          avgDeliveryMinutes: Number(r.avgDeliveryMinutes) || 12,
          joinedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
        }));

        // 2. DYNAMICALLY MAP ORDERS FROM LIVE MONGODB
        const dynamicOrders: Order[] = (data.orders || []).map((o: any) => {
          const user = (data.users || []).find((u: any) => u._id === o.userId || (u._id.toString && u._id.toString() === o.userId));
          const addr = o.deliveryAddress || {};
          const fullAddress = `${addr.houseNumber || ''}, ${addr.street || ''}, ${addr.city || 'Ahmedabad'}`.trim();

          const oStoreIdStr = o.storeId ? (o.storeId.toString ? o.storeId.toString() : String(o.storeId)) : '';
          const matchedStore = (data.stores || []).find((s: any) => {
            const sIdStr = s._id ? (s._id.toString ? s._id.toString() : String(s._id)) : String(s.id || '');
            return oStoreIdStr && sIdStr === oStoreIdStr;
          });

          let resolvedZoneName = '';
          let resolvedDarkStore = matchedStore ? matchedStore.name : '';

          if (matchedStore) {
            const cleanStoreName = (matchedStore.name || '').replace(/Wom\s*Up|Worm\s*Up|Dark\s*Store/gi, '').trim();
            const matchedArea = (data.areas || []).find((a: any) => {
              if (!a.name) return false;
              const aName = a.name.toLowerCase();
              const cName = cleanStoreName.toLowerCase();
              return aName === cName || matchedStore.name.toLowerCase().includes(aName) || aName.includes(cName);
            });
            resolvedZoneName = matchedArea ? matchedArea.name : cleanStoreName;
          }

          if (!resolvedZoneName) {
            const addrText = `${addr.street || ''} ${addr.landmark || ''} ${addr.city || ''} ${addr.houseNumber || ''}`.toLowerCase();
            const matchedArea = (data.areas || []).find((a: any) => {
              if (!a.name) return false;
              const aName = a.name.toLowerCase();
              if (addrText.includes(aName)) return true;
              const parts = aName.split(/[\s-]+/).filter((p: string) => p.length > 3);
              return parts.some((p: string) => addrText.includes(p));
            });
            if (matchedArea) {
              resolvedZoneName = matchedArea.name;
              if (!resolvedDarkStore) resolvedDarkStore = `Wom Up ${matchedArea.name} Dark Store`;
            }
          }

          if (!resolvedZoneName) {
            resolvedZoneName = addr.street || addr.city || 'Prahlad Nagar';
          }
          if (!resolvedDarkStore) {
            resolvedDarkStore = 'Wom Up Ahmedabad Central Dark Store';
          }

          return {
            id: o.orderNumber || `#WMP-${(o._id || '').slice(-6).toUpperCase()}`,
            storeId: oStoreIdStr,
            customerId: o.userId ? (o.userId.toString ? o.userId.toString() : o.userId) : 'cust_1',
            customerName: user ? user.name : 'Customer',
            customerPhone: user ? user.phone : '9879432010',
            address: fullAddress,
            zoneName: resolvedZoneName,
            darkStore: resolvedDarkStore,
            items: (o.items || []).map((i: any) => ({
              id: i.productId || 'item_1',
              name: i.name,
              quantityKg: i.quantity || 1,
              pricePerKg: i.unitPrice || 0,
              subtotal: i.subtotal || 0,
            })),
            subtotal: o.itemSubtotal || o.totalAmount || 0,
            deliveryFee: o.deliveryFee || 0,
            discount: (o.discount || 0) + (o.couponDiscount || 0) + (o.coinsDiscount || 0),
            total: o.totalAmount || 0,
            status: o.status === 'PACKING' ? 'Picking' : o.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : o.status === 'DELIVERED' ? 'Delivered' : o.status === 'CANCELLED' ? 'Cancelled' : 'Order Placed',
            pickerName: 'Ramesh Patel (Central Hub)',
            riderName: 'Vikram Solanki (Express)',
            timeAgo: 'Recently',
            timestamp: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
            timeline: [
              {
                stage: 'Order Placed',
                timestamp: '12:00 PM',
                actor: user ? user.name : 'Customer',
                notes: `Paid via ${o.paymentMethod || 'Online'}`
              }
            ]
          };
        });

        // 3. DYNAMICALLY MAP PRINT ORDERS FROM LIVE MONGODB
        const dynamicPrintOrders: PrintOrder[] = (data.printOrders || []).map((p: any) => {
          const user = (data.users || []).find((u: any) => u._id === p.userId || (u._id && u._id.toString && u._id.toString() === p.userId));
          return {
            id: p._id ? (p._id.toString ? p._id.toString() : p._id) : (p.printOrderNumber || 'p1'),
            printOrderNumber: p.printOrderNumber || `PRINT-${String(p._id || '').slice(-6)}`,
            userId: p.userId ? (p.userId.toString ? p.userId.toString() : p.userId) : 'u1',
            customerName: user ? user.name : (p.customerName || 'WormUp Customer'),
            customerPhone: user ? user.phone : (p.customerPhone || ''),
            originalFileName: p.originalFileName || p.fileName || 'Document.pdf',
            fileUrl: p.fileUrl || '',
            thumbnailUrl: p.thumbnailUrl || '',
            fileType: p.fileType || 'application/pdf',
            fileSize: p.fileSize || '1.0 MB',
            pageCount: Number(p.pageCount) || 1,
            numberOfCopies: Number(p.numberOfCopies) || 1,
            isColor: !!p.isColor,
            isDoubleSided: !!p.isDoubleSided,
            paperQuality: p.paperQuality || '70 GSM Standard',
            binding: p.binding || 'none',
            bindingPrice: Number(p.bindingPrice) || 0,
            pricePerPage: Number(p.pricePerPage) || 3,
            totalAmount: Number(p.totalAmount) || 3,
            deliveryAddress: p.deliveryAddress || (user?.address || 'Prahlad Nagar, Ahmedabad'),
            deliverySlot: p.deliverySlot || 'Standard Delivery',
            status: (p.status || 'PRINTING') as any,
            isDocumentPurged: !!p.isDocumentPurged,
            createdAt: p.createdAt || new Date().toISOString(),
            timestamp: p.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
          };
        });

        // 4. DYNAMICALLY MAP VARIANTS FROM LIVE MONGODB
        const rawVariants: any[] = data.productVariants || [];
        const mappedVariants: ProductVariantItem[] = rawVariants.map((v: any) => ({
          id: v._id?.toString ? v._id.toString() : v._id || v.id,
          productId: v.productId?.toString ? v.productId.toString() : v.productId,
          sku: v.sku || '',
          weightOrVolume: v.weightOrVolume || v.label || '1 unit',
          sellingPrice: Number(v.sellingPrice || 0),
          mrp: Number(v.mrp || v.sellingPrice || 0),
          discountPercent: Number(v.discountPercent || 0),
          stock: Number(v.stock !== undefined ? v.stock : 100),
          isDefault: !!v.isDefault,
          isActive: v.isActive !== false,
          basePrice: v.basePrice !== undefined ? Number(v.basePrice) : undefined,
        }));

        // 4b. DYNAMICALLY MAP CATEGORIES FROM LIVE MONGODB
        const dynamicCategories: CategoryItem[] = (data.categories && data.categories.length > 0)
          ? data.categories
              .filter((c: any) => c.isActive !== false)
              .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
              .map((c: any) => ({
                id: c._id?.toString ? c._id.toString() : c._id || c.id,
                name: c.name,
                slug: c.slug,
                icon: c.icon,
                bgColor: c.bgColor,
                itemCount: c.itemCount || 0,
                sortOrder: c.sortOrder || 0,
                isActive: c.isActive !== false,
              }))
          : [];

        // 5. DYNAMICALLY MAP PRODUCTS AND ATTACH VARIANTS
        const dynamicProducts: ProductItem[] = (data.products && data.products.length > 0)
          ? data.products.map((p: any) => {
              const prodId = p._id?.toString ? p._id.toString() : p._id || p.id;
              const pVariants = mappedVariants.filter(
                (v) => v.productId === prodId || v.productId === (p._id?.toString ? p._id.toString() : p._id)
              );
              const cId = p.categoryId?.toString ? p.categoryId.toString() : (p.categoryId || '');
              const matchedCat = dynamicCategories.find((c) => c.id === cId);
              const resolvedCat = matchedCat ? matchedCat.name : (p.category || 'General');

              return {
                id: prodId,
                name: p.name,
                category: resolvedCat,
                categoryId: cId,
                brand: p.brand || 'Womup Fresh',
                description: p.description || '',
                basePrice: Number(p.basePrice) || Number(p.sellingPrice) || 40,
                sellingPrice: Number(p.sellingPrice) || 45,
                mrp: Number(p.mrp) || Number(p.sellingPrice) || 50,
                stockKg: Number(p.stockKg) || 100,
                isActive: p.isActive !== false,
                image: p.imageUrl || p.image || 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80',
                imageUrl: p.imageUrl || p.image || '',
                images: p.images || (p.imageUrl ? [p.imageUrl] : []),
                variants: pVariants,
                priceHistory: p.priceHistory || [],
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
              };
            })
          : [];

        // 6. DYNAMICALLY MAP ZONES FROM LIVE MONGODB
        // 5b. DYNAMICALLY MAP CITIES FROM LIVE MONGODB
        const dynamicCities: CityItem[] = (data.cities && data.cities.length > 0)
          ? data.cities.map((c: any) => ({
              id: c._id?.toString ? c._id.toString() : c._id || c.id,
              _id: c._id,
              name: c.name,
              code: c.code,
              state: c.state || 'Gujarat',
              status: c.status || 'Active',
              sortOrder: c.sortOrder || 0,
              areaCount: c.areaCount || 0,
              storeCount: c.storeCount || 0,
              activeStoreCount: c.activeStoreCount || 0,
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
            }))
          : [];

        // 6. DYNAMICALLY MAP OPERATIONAL ZONES (AREAS) FROM LIVE MONGODB
        const dynamicZones: Zone[] = (data.areas && data.areas.length > 0)
          ? data.areas.map((a: any, idx: number) => ({
              id: a._id?.toString ? a._id.toString() : a._id || a.id || `z${idx + 1}`,
              _id: a._id,
              name: a.name,
              code: a.code || a.name.toUpperCase().replace(/\s+/g, '_'),
              darkStore: a.darkStore || `Wom Up ${a.name} Dark Store`,
              address: a.address || `${a.name}, ${a.city || 'Ahmedabad'}`,
              city: a.cityName || a.city || 'Ahmedabad',
              cityName: a.cityName || a.city || 'Ahmedabad',
              cityId: a.cityId?.toString ? a.cityId.toString() : (a.cityId || null),
              isActive: a.isActive !== false,
              activeOrders: 0,
              gmvSharePercent: 0,
              hasActiveStore: !!a.hasActiveStore,
              assignedStore: a.assignedStore || null,
              centerLat: a.centerLat,
              centerLng: a.centerLng,
              radiusKm: a.radiusKm,
              defaultDeliveryMinutes: a.defaultDeliveryMinutes,
              pincodes: a.pincodes,
              sortOrder: a.sortOrder,
            }))
          : [];

        const areaIdToName: Record<string, string> = {};
        dynamicZones.forEach((z) => {
          areaIdToName[z.id] = z.name;
        });

        // 7. DYNAMICALLY MAP AREA PRICING RECORDS FROM LIVE MONGODB
        const rawAreaPricing: any[] = data.areaPricing || [];
        const areaPricingRecords: AreaPricingRecord[] = rawAreaPricing.map((ap: any) => ({
          id: ap._id?.toString ? ap._id.toString() : ap._id || ap.id,
          productId: ap.productId?.toString ? ap.productId.toString() : ap.productId,
          variantId: ap.variantId?.toString ? ap.variantId.toString() : ap.variantId,
          areaId: ap.areaId?.toString ? ap.areaId.toString() : ap.areaId,
          price: Number(ap.price ?? ap.sellingPrice ?? 0),
          mrp: ap.mrp !== undefined ? Number(ap.mrp) : undefined,
          discountPercent: ap.discountPercent !== undefined ? Number(ap.discountPercent) : undefined,
          stock: ap.stock !== undefined ? Number(ap.stock) : undefined,
          isAvailable: ap.isAvailable !== false,
        }));

        // areaPricingMap: variantId -> areaId / zoneName -> price
        const areaPricingMap: Record<string, Record<string, number>> = {};
        for (const ap of areaPricingRecords) {
          if (!areaPricingMap[ap.variantId]) {
            areaPricingMap[ap.variantId] = {};
          }
          areaPricingMap[ap.variantId][ap.areaId] = ap.price;

          const zoneName = areaIdToName[ap.areaId];
          if (zoneName) {
            areaPricingMap[ap.variantId][zoneName] = ap.price;
          }
        }

        // Backward-compatible product-level zone prices
        const dynamicZonePrices: Record<string, Record<string, number>> = {};
        dynamicProducts.forEach((p) => {
          dynamicZonePrices[p.name] = {};
          const defVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
          if (defVariant && areaPricingMap[defVariant.id]) {
            dynamicZonePrices[p.name] = { ...areaPricingMap[defVariant.id] };
          }
        });

        // 8. DYNAMICALLY MAP DARK STORES FROM LIVE MONGODB
        const dynamicStores: DarkStoreItem[] = (data.stores && data.stores.length > 0)
          ? data.stores.map((s: any) => ({
              id: s._id?.toString ? s._id.toString() : String(s._id || s.id),
              name: s.name || 'Wom Up Dark Store',
              code: s.code || '',
              loginId: s.loginId || '',
              address: s.address || '',
              city: s.cityName || s.city || 'Ahmedabad',
              cityName: s.cityName || s.city || 'Ahmedabad',
              cityId: s.cityId?.toString ? s.cityId.toString() : (s.cityId || null),
              pincode: s.pincode || '',
              areaId: s.areaId?.toString ? s.areaId.toString() : (s.areaId || null),
              areaName: s.areaName || null,
              isActive: s.isActive !== false,
              isOnShift: s.isOnShift === true,
              isOnline: s.isOnline ?? (s.isActive !== false && (Number(s.staffOnShift) > 0 || s.isOnShift === true)),
              staffOnShift: Number(s.staffOnShift || 0),
              staffTotal: Number(s.staffTotal || 0),
              orderCount: s.orderCount,
              pendingOrders: s.pendingOrders,
              riderCount: s.riderCount,
              serviceRadiusKm: s.serviceRadiusKm,
              estimatedDeliveryMinutes: s.estimatedDeliveryMinutes,
              lastLoginAt: s.lastLoginAt,
              coordinates: s.coordinates || s.location?.coordinates,
              createdAt: s.createdAt,
            }))
          : [];

        // 9. DYNAMICALLY MAP INVENTORY FROM LIVE MONGODB (Product + Variant + Dark Store)
        const rawInventory: any[] = data.inventory || [];
        const dynamicInventory: InventoryItem[] = rawInventory.map((inv: any) => {
          const pId = inv.productId?.toString ? inv.productId.toString() : String(inv.productId || '');
          const vId = inv.variantId?.toString ? inv.variantId.toString() : String(inv.variantId || '');
          const sId = (inv.storeId || inv.warehouseId)?.toString
            ? (inv.storeId || inv.warehouseId).toString()
            : String(inv.storeId || inv.warehouseId || '');

          const matchedProd = dynamicProducts.find((p) => p.id === pId);
          const matchedVariant = mappedVariants.find(
            (v) => v.id === vId || (v.productId === pId && v.sku === inv.sku)
          );
          const matchedStore = dynamicStores.find((s) => s.id === sId || s.name === inv.storeName);

          const avail = Number(inv.availableQty ?? inv.availableKg ?? 0);
          const reserved = Number(inv.reservedQty ?? inv.reservedKg ?? 0);
          const threshold = Number(inv.lowStockThreshold ?? 15);

          const isExpired =
            inv.status === 'Expired' || (inv.expiryDate && new Date(inv.expiryDate).getTime() < Date.now());
          const isLow = !isExpired && avail <= threshold;
          const status: 'Healthy' | 'Low Stock' | 'Expired' = isExpired
            ? 'Expired'
            : isLow
            ? 'Low Stock'
            : 'Healthy';

          return {
            id: inv._id?.toString ? inv._id.toString() : String(inv._id || inv.id),
            productId: pId,
            variantId: vId || matchedVariant?.id || '',
            sku: inv.sku || matchedVariant?.sku || '',
            name: matchedProd?.name || inv.productName || 'Product',
            packSize: matchedVariant?.weightOrVolume || inv.packSize || '1 unit',
            category: matchedProd?.category || inv.category || 'Produce',
            darkStoreId: sId,
            darkStoreName: matchedStore?.name || inv.storeName || 'Wom Up Ahmedabad Central Dark Store',
            availableKg: avail,
            reservedKg: reserved,
            lowStockThreshold: threshold,
            expiryDate: inv.expiryDate ? new Date(inv.expiryDate).toISOString() : undefined,
            status,
            shelfLocation: inv.shelfLocation || (matchedProd as any)?.shelfLocation || undefined,
          };
        });

        // 10. DYNAMICALLY MAP STAFF FROM USERS COLLECTION (Roles: PICKER, RIDER, STAFF, ADMIN)
        const dynamicStaff: StaffMember[] = (data.users || [])
          .filter((u: any) => u.role && u.role !== 'CUSTOMER')
          .map((u: any) => ({
            id: u._id?.toString ? u._id.toString() : String(u._id),
            name: u.name || 'Staff Member',
            phone: u.phone || '',
            role: (u.role === 'RIDER' ? 'Rider' : 'Picker') as 'Picker' | 'Rider',
            zone: 'Ahmedabad Central',
            darkStore: 'Wom Up Ahmedabad Central Dark Store',
            status: 'On Duty',
            activeOrdersCount: 0,
            rating: 5.0,
            avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
          }));

        // 11. DYNAMICALLY MAP MARKETING CAMPAIGNS FROM REAL COUPONS & BANNERS IN MONGODB
        const dynamicCampaigns: MarketingCampaign[] = [
          ...(data.coupons || []).map((c: any) => ({
            id: c._id?.toString ? c._id.toString() : String(c._id),
            name: `${c.code} Coupon`,
            scheduledAt: c.validUntil ? `Expires: ${new Date(c.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Ongoing',
            targetAudience: `Min Order ₹${c.minOrderValue || 0}`,
            isEnabled: c.isActive !== false,
            subject: c.description || `Get ${c.discountValue}${c.discountType === 'PERCENTAGE' ? '%' : '₹'} OFF`,
            message: `Discount: ${c.discountValue}${c.discountType === 'PERCENTAGE' ? '%' : '₹'} | Max: ₹${c.maxDiscountAmount || c.discountValue}`,
            status: (c.isActive ? 'Scheduled' : 'Completed') as 'Scheduled' | 'Completed',
            sentCount: c.perUserLimit || 1,
          })),
          ...(data.banners || []).map((b: any) => ({
            id: b._id?.toString ? b._id.toString() : String(b._id),
            name: b.title || 'Promotional Banner',
            scheduledAt: `Banner (${b.placement || 'HOME'})`,
            targetAudience: 'All App Users',
            isEnabled: b.isActive !== false,
            subject: b.title || 'App Banner',
            message: b.videoUrl ? `Video Banner: ${b.videoUrl}` : 'Image Banner',
            status: (b.isActive ? 'Scheduled' : 'Completed') as 'Scheduled' | 'Completed',
            sentCount: b.sortOrder || 1,
          }))
        ];

        // 12. DYNAMICALLY MAP COIN LEDGER FROM REAL COIN TRANSACTIONS IN MONGODB
        const dynamicCoinLedger: CoinLedgerItem[] = (data.coinTransactions || []).map((ct: any) => {
          const user = (data.users || []).find(
            (u: any) => (u._id?.toString ? u._id.toString() : String(u._id)) === (ct.userId?.toString ? ct.userId.toString() : String(ct.userId))
          );
          return {
            id: ct._id?.toString ? ct._id.toString() : String(ct._id),
            userName: user ? user.name : 'Customer',
            type: ct.type === 'BONUS' ? 'Earned' : ct.type === 'SPEND' ? 'Used' : 'Adjusted',
            amount: Number(ct.coins) || 0,
            reason: ct.description || ct.referenceType || 'Reward / Transaction',
            timestamp: ct.createdAt ? new Date(ct.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recent',
          };
        });

        // 13. DYNAMICALLY MAP AUDIT LOGS FROM REAL ORDER STATUS HISTORY IN MONGODB
        const dynamicAuditLogs: AuditLogItem[] = (data.orderHistory || []).map((oh: any) => ({
          id: oh._id?.toString ? oh._id.toString() : String(oh._id),
          adminName: oh.changedByRole === 'CUSTOMER' ? 'Customer App' : (oh.changedByRole || 'System Admin'),
          action: `Status: ${oh.previousStatus || 'INIT'} ➔ ${oh.newStatus || 'UPDATED'}`,
          target: `Order #${String(oh.orderId).slice(-6).toUpperCase()}`,
          details: oh.notes || 'Order state transition updated in MongoDB',
          timestamp: oh.createdAt ? new Date(oh.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            year: 'numeric'
          }) : 'Recent',
        }));

        return {
          customers: dynamicCustomers,
          riders: dynamicRiders,
          orders: dynamicOrders,
          printOrders: dynamicPrintOrders,
          products: dynamicProducts,
          categories: dynamicCategories,
          cities: dynamicCities,
          zones: dynamicZones,
          stores: dynamicStores,
          zonePrices: dynamicZonePrices,
          areaPricing: areaPricingMap,
          areaPricingRecords,
          inventory: dynamicInventory,
          staff: dynamicStaff,
          campaigns: dynamicCampaigns,
          coinLedger: dynamicCoinLedger,
          auditLogs: dynamicAuditLogs,
        };
      }
      return null;
    } catch (err: any) {
      console.warn(`[API] fetchLiveSnapshot attempt ${attempt} error:`, err?.message || err);
      if (attempt === 2) return null;
    }
  }
  return null;
},

  // 1. PERSIST CUSTOMER EDIT TO LIVE MONGODB
  async updateCustomer(id: string, data: Partial<Customer>): Promise<boolean> {
    try {
      console.log(`[API] Updating customer ${id} in MongoDB:`, data);
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          status: data.status,
          address: data.address,
          zoneName: data.zoneName,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("[API] Error updating customer in MongoDB:", err);
      return false;
    }
  },

  // 2. PERSIST BLOCK / UNBLOCK TO LIVE MONGODB
  async toggleBlockCustomer(id: string, isBlocked: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 3. PERSIST NEW CUSTOMER TO LIVE MONGODB
  async addCustomer(data: Partial<Customer>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          zoneName: data.zoneName,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 4. PERSIST ORDER STATUS TRANSITION TO LIVE MONGODB + AUDIT TRAIL
  async updateOrderStatus(orderNumber: string, newStatus: string, notes?: string): Promise<boolean> {
    try {
      let mongoStatus = 'PLACED';
      if (newStatus === 'Picking') mongoStatus = 'PACKING';
      else if (newStatus === 'Out for Delivery') mongoStatus = 'OUT_FOR_DELIVERY';
      else if (newStatus === 'Delivered') mongoStatus = 'DELIVERED';
      else if (newStatus === 'Cancelled') mongoStatus = 'CANCELLED';

      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderNumber}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: mongoStatus, notes }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 5. PERSIST ORDER CANCELLATION TO LIVE MONGODB
  async cancelOrder(orderNumber: string, reason: string, refundAmount?: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderNumber}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, refundAmount }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 6. PERSIST PRODUCT PRICE TO LIVE MONGODB
  async updateProductPrice(productName: string, sellingPrice: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/areas/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, sellingPrice, price: sellingPrice, mrp: sellingPrice + 10 }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 6b. PERSIST VARIANT AREA PRICE TO LIVE MONGODB (area_pricing collection only)
  async saveVariantAreaPrice(data: {
    productId: string;
    variantId: string;
    areaId: string;
    price: number;
    mrp?: number;
    stock?: number;
  }): Promise<boolean> {
    try {
      console.log('[API] Saving Variant Area Price to MongoDB:', data);
      const res = await fetch(`${API_BASE_URL}/api/admin/areas/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: data.productId,
          variantId: data.variantId,
          areaId: data.areaId,
          price: data.price,
          mrp: data.mrp,
          stock: data.stock,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error('[API] Error saving variant area price:', errJson);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[API] Network error saving variant area price:', err);
      return false;
    }
  },

  // 6c. PERSIST NEW OPERATIONAL ZONE TO LIVE MONGODB
  async addOperationalZone(data: {
    name: string;
    code?: string;
    cityId?: string;
    city?: string;
    darkStore?: string;
    address?: string;
    isActive?: boolean;
    centerLat?: number;
    centerLng?: number;
    radiusKm?: number;
    defaultDeliveryMinutes?: number;
  }): Promise<{ success: boolean; data?: any; error?: string; id?: string }> {
    try {
      console.log('[API] Creating operational zone in MongoDB:', data);
      const res = await fetch(`${API_BASE_URL}/api/admin/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || `HTTP ${res.status}` };
      }
      return { success: true, data: resData.data, id: resData.id };
    } catch (err: any) {
      console.error('[API] Network error creating operational zone:', err);
      return { success: false, error: err.message || 'Network error creating operational zone' };
    }
  },

  // 6d. CITIES MANAGEMENT CRUD
  async getCities(): Promise<CityItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cities`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('[API] Error fetching cities:', err);
      return [];
    }
  },

  async addCity(payload: { name: string; code: string; state?: string; status?: 'Active' | 'Inactive' }): Promise<{ success: boolean; data?: CityItem; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating city' };
    }
  },

  async updateCity(id: string, payload: Partial<CityItem>): Promise<{ success: boolean; data?: CityItem; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating city' };
    }
  },

  async deleteCity(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cities/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting city' };
    }
  },

  // 6e. AREAS MANAGEMENT CRUD
  async getAreas(cityId?: string): Promise<Zone[]> {
    try {
      const url = cityId ? `${API_BASE_URL}/api/admin/areas?cityId=${encodeURIComponent(cityId)}` : `${API_BASE_URL}/api/admin/areas`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('[API] Error fetching areas:', err);
      return [];
    }
  },

  async updateArea(id: string, payload: Partial<Zone>): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/areas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating area' };
    }
  },

  async deleteArea(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/areas/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting area' };
    }
  },

  async assignStoreToArea(storeId: string, areaId: string, cityId?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stores/${storeId}/assign-area`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaId, cityId }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error assigning store' };
    }
  },

  // 7. PERSIST INVENTORY STOCK ADJUSTMENT TO LIVE MONGODB
  async adjustStock(storeId: string, productId: string, deltaQty: number, reason: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stores/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, productId, deltaQty, reason }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 7b. ASSIGN / UPDATE SHELF LOCATION IN LIVE MONGODB
  async updateShelfLocation(params: {
    inventoryId?: string;
    storeId?: string;
    productId?: string;
    shelfLocation: string;
  }): Promise<{ success: boolean; shelfLocation?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stores/inventory/shelf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update shelf location' };
    }
  },

  // 8. PERSIST SHOPPING COINS ADJUSTMENT TO LIVE MONGODB WITH AUDIT
  async adjustCoins(userId: string, type: 'BONUS' | 'SPEND', coins: number, reason: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/finance/coins/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, coins, reason }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 9. UPDATE PRINT ORDER STATUS IN LIVE MONGODB
  async updatePrintOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/print-orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch (err) {
      console.error('[API] Error updating print order status:', err);
      return false;
    }
  },

  // 10. CREATE PRODUCT IN LIVE MONGODB
  async addProduct(product: Partial<ProductItem>): Promise<ProductItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/catalog/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[API] Error creating product:', err);
      return null;
    }
  },

  // 11. UPDATE PRODUCT IN LIVE MONGODB
  async updateProduct(id: string, product: Partial<ProductItem>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/catalog/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return res.ok;
    } catch (err) {
      console.error('[API] Error updating product:', err);
      return false;
    }
  },

  // 12. TOGGLE PRODUCT STATUS IN LIVE MONGODB
  async toggleProductStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/catalog/products/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      return res.ok;
    } catch (err) {
      console.error('[API] Error toggling product status:', err);
      return false;
    }
  },

  // 13. DELETE PRODUCT FROM LIVE MONGODB
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/catalog/products/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error('[API] Error deleting product:', err);
      return false;
    }
  },

  // 14. FETCH PRICE HISTORY FROM LIVE MONGODB
  async fetchPriceHistory(id: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/catalog/products/${id}/price-history`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.history || [];
    } catch (err) {
      console.error('[API] Error fetching price history:', err);
      return [];
    }
  },

  // 15. FETCH SINGLE RIDER DETAIL
  async fetchRiderDetail(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/riders/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.warn(`[API] Failed to fetch rider detail ${id}:`, e);
      return null;
    }
  },

  // 16. UPDATE RIDER DETAIL
  async updateRider(id: string, updates: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/riders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.warn(`[API] Failed to update rider ${id}:`, e);
      return null;
    }
  },

  // 17. FETCH ALL STORES ENRICHED
  async fetchStores(): Promise<DarkStoreItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stores`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error('[API] Error fetching stores:', err);
      return [];
    }
  },

  // 18. CREATE STORE WITH INITIAL CREDENTIALS & INVENTORY
  async createStore(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating store' };
    }
  },

  // 19. RESET STORE PASSWORD
  async resetStorePassword(id: string, password?: string): Promise<{ success: boolean; password?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stores/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error resetting password' };
    }
  },

  // 20. DELETE STORE
  async deleteStore(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stores/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting store' };
    }
  },

  // 21. FETCH CATEGORIES (with subcategories and stats)
  async fetchCategories(includeInactive = true): Promise<CategoryItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories?includeInactive=${includeInactive}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || json || [];
    } catch (err) {
      console.error('[API] Error fetching categories:', err);
      return [];
    }
  },

  // 22. CREATE CATEGORY
  async createCategory(payload: {
    name: string;
    code?: string;
    slug?: string;
    icon?: string;
    bgColor?: string;
    description?: string;
    sortOrder?: number;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<{ success: boolean; data?: CategoryItem; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating category' };
    }
  },

  // 23. UPDATE CATEGORY
  async updateCategory(
    id: string,
    payload: Partial<CategoryItem>
  ): Promise<{ success: boolean; data?: CategoryItem; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating category' };
    }
  },

  // 24. TOGGLE CATEGORY STATUS
  async toggleCategoryStatus(
    id: string,
    isActive?: boolean
  ): Promise<{ success: boolean; data?: CategoryItem; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating status' };
    }
  },

  // 25. DELETE CATEGORY (Blocked if products exist)
  async deleteCategory(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting category' };
    }
  },

  // 26. FETCH SUBCATEGORIES FOR CATEGORY
  async fetchSubcategories(categoryId: string): Promise<SubCategoryItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${categoryId}/subcategories`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || json || [];
    } catch (err) {
      console.error('[API] Error fetching subcategories:', err);
      return [];
    }
  },

  // 27. CREATE SUBCATEGORY
  async createSubcategory(
    categoryId: string,
    payload: {
      name: string;
      slug?: string;
      icon?: string;
      imageUrl?: string;
      defaultShelfAisle?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; data?: SubCategoryItem; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating subcategory' };
    }
  },

  // 28. UPDATE SUBCATEGORY
  async updateSubcategory(
    categoryId: string,
    subId: string,
    payload: Partial<SubCategoryItem>
  ): Promise<{ success: boolean; data?: SubCategoryItem; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${categoryId}/subcategories/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating subcategory' };
    }
  },

  // 29. DELETE SUBCATEGORY
  async deleteSubcategory(
    categoryId: string,
    subId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${categoryId}/subcategories/${subId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // 30. PAYOUT RATES - FETCH ALL
  async fetchPayoutRates(): Promise<{
    success: boolean;
    data: PayoutRateItem[];
    globalRate: PayoutRateItem;
    stats: PayoutStats;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payout-rates`);
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        data: [],
        globalRate: {
          id: 'fallback_global',
          scope: 'GLOBAL',
          ratePerKm: 10,
          minimumPayout: 30,
          maximumPayout: 150,
          isActive: true,
          description: 'Global Default Rate',
        },
        stats: {
          totalRates: 1,
          activeOverridesCount: 0,
          globalRatePerKm: 10,
          rateRangeText: '₹10 - ₹10',
          minRate: 10,
          maxRate: 10,
        },
        error: err.message,
      };
    }
  },

  // 31. PAYOUT RATES - CREATE
  async createPayoutRate(payload: Partial<PayoutRateItem>): Promise<{
    success: boolean;
    id?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payout-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed creating payout rate' };
    }
  },

  // 32. PAYOUT RATES - UPDATE
  async updatePayoutRate(
    id: string,
    updates: Partial<PayoutRateItem>
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payout-rates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed updating payout rate' };
    }
  },

  // 33. PAYOUT RATES - TOGGLE ACTIVE
  async togglePayoutRate(id: string): Promise<{ success: boolean; isActive?: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payout-rates/${id}/toggle`, {
        method: 'PATCH',
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed toggling payout rate' };
    }
  },

  // 34. PAYOUT RATES - DELETE
  async deletePayoutRate(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payout-rates/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed deleting payout rate' };
    }
  },

  // 35. PAYOUT RATES - RESOLVE / SIMULATE
  async resolvePayoutRatePreview(params: {
    cityId?: string;
    cityName?: string;
    areaId?: string;
    areaName?: string;
    distanceKm?: number;
  }): Promise<any> {
    try {
      const q = new URLSearchParams();
      if (params.cityId) q.append('cityId', params.cityId);
      if (params.cityName) q.append('cityName', params.cityName);
      if (params.areaId) q.append('areaId', params.areaId);
      if (params.areaName) q.append('areaName', params.areaName);
      if (params.distanceKm) q.append('distanceKm', params.distanceKm.toString());

      const res = await fetch(`${API_BASE_URL}/api/admin/payout-rates/resolve?${q.toString()}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};

