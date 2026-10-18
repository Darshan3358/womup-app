import type {
  Customer,
  DeliveryPartnerItem,
  Order,
  ProductItem,
  ProductVariantItem,
  AreaPricingRecord,
  CategoryItem,
  DarkStoreItem,
  AreaItem,
  CityItem,
  PayoutRateItem,
  CoinLedgerItem,
  AuditLogItem,
  MarketingCampaign,
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

export const API_BASE_URL = getApiBaseUrl();

const getNestApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5050/api/v1';
    }
  }
  return 'https://womup-app-uquz.onrender.com/api/v1';
};

export const NEST_API_BASE_URL = getNestApiBaseUrl();

export interface LiveDbData {
  customers: Customer[];
  riders: DeliveryPartnerItem[];
  orders: Order[];
  products: ProductItem[];
  productVariants: ProductVariantItem[];
  areaPricing: AreaPricingRecord[];
  categories: CategoryItem[];
  cities: CityItem[];
  areas: AreaItem[];
  stores: DarkStoreItem[];
  staff: DeliveryPartnerItem[];
  campaigns: MarketingCampaign[];
  coinLedger: CoinLedgerItem[];
  auditLogs: AuditLogItem[];
  payoutRates: PayoutRateItem[];
}

export const AdminApiService = {
  // Check backend server connection
  async checkHealth(): Promise<{ status: string; database?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        headers: { Accept: 'application/json' },
      });
      return await res.json();
    } catch (e: any) {
      return { status: 'offline' };
    }
  },

  // 1. Fetch complete real-time snapshot (same as admin app)
  async fetchLiveSnapshot(): Promise<LiveDbData | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/realtime-data`, {
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch snapshot`);
      }

      const raw = await res.json();

      // Normalize structures to match portal UI expectations
      const customers: Customer[] = (raw.users || []).map((u: any) => ({
        id: u._id?.toString() || u.id,
        _id: u._id?.toString() || u.id,
        name: u.name || 'Customer',
        phone: u.phone || '',
        email: u.email || '',
        status: (u.isBlocked === 1 || u.isActive === false) ? 'Blocked' : 'Active',
        spend: u.spend || 0,
        totalOrders: u.orderCount || u.totalOrders || 0,
        avatar: u.avatar || '',
        walletBalance: u.walletBalance || 0,
        shoppingCoinBalance: u.shoppingCoins !== undefined ? u.shoppingCoins : (u.coins || 0),
        kycStatus: (u.customerKycStatus === 2 || u.verificationStatus === 'VERIFIED') ? 'Verified' : (u.customerKycStatus === 3 ? 'Rejected' : 'Pending'),
        createdAt: u.createdAt || new Date().toISOString(),
        firstName: u.firstName || (u.name ? u.name.split(' ')[0] : ''),
        surname: u.surname || (u.name ? u.name.split(' ').slice(1).join(' ') : ''),
        fatherHusbandName: u.fatherHusbandName || '',
        gender: u.gender || 'Female',
        birthdate: u.birthDate || u.birthday || '',
        birthDate: u.birthDate || u.birthday || '',
        address: u.address || '',
        landmark: u.landmark || '',
        village: u.village || '',
        zoneName: u.preferredCityName || u.zoneName || 'Bopal',
        pincode: u.customerPincode || u.registrationPincode || '380015',
        sponsorId: u.sponsorId ? String(u.sponsorId) : (u.sponsorCode || 'WORM5871'),
        sponsorName: u.sponsorName || 'Darshan T.',
        referralCode: u.sponsorCode || 'WORM5871',
        userCode: u.referralCode || u.customerCode || 'WORM1213',
        bankName: u.bankName || 'HDFC Bank',
        branchName: u.branchName || 'SG Highway',
        accountHolderName: u.accountHolderName || u.name,
        accountNumber: u.accountNumber || u.bankAccountNo || '',
        ifscCode: u.ifscCode || 'HDFC0000123',
        upiId: u.upiId || 'ayushi@okhdfcbank',
        paymentStatus: u.customerPaymentStatus !== undefined ? u.customerPaymentStatus : 1,
        isBlocked: u.isBlocked !== undefined ? u.isBlocked : (u.isActive === false ? 1 : 0),
        isSuspended: u.isSuspended || 0,
        adminNotes: u.adminNotes || '',
        aadhaarNumber: u.aadhaarNumber || u.customer_aadhar_no || '',
        aadhaarFrontImage: u.customer_image_aadhar_front || u.aadharFrontImage || '',
        customer_image_aadhar_front: u.customer_image_aadhar_front || u.aadharFrontImage || '',
        aadhaarBackImage: u.customer_image_aadhar_back || u.aadharBackImage || '',
        customer_image_aadhar_back: u.customer_image_aadhar_back || u.aadharBackImage || '',
        kycSubmittedAt: u.updatedAt || u.createdAt || '',
        kycRejectReason: u.kycRejectReason || '',
      }));

      const riders: DeliveryPartnerItem[] = (raw.deliveryPartners || raw.riders || []).map((r: any) => ({
        id: r._id?.toString() || r.id,
        _id: r._id?.toString() || r.id,
        partnerCode: r.partnerCode || `RID-${(r._id || '').toString().slice(-4)}`,
        name: r.name || r.fullName || 'Partner',
        phone: r.phone || r.phoneNumber || '',
        email: r.email || '',
        hubName: r.hubName || r.hub || 'Chandlodiya Dark Store',
        hubId: r.hubId?.toString() || '',
        city: r.city || 'Ahmedabad',
        vehicleType: r.vehicleType || 'Motorbike',
        vehicleNumber: r.vehicleNumber || 'GJ-01-AB-1234',
        status: r.status || 'APPROVED',
        isOnline: r.isOnline || r.isOnDuty || false,
        rating: r.rating || 4.9,
        totalDeliveries: r.totalDeliveries || r.completedDeliveries || 0,
        completedDeliveries: r.completedDeliveries || 0,
        activeDeliveries: r.activeDeliveries || 0,
        avgDeliveryMinutes: r.avgDeliveryMinutes || 9,
      }));

      const userMap = new Map<string, any>((raw.users || []).map((u: any) => [(u._id || u.id)?.toString(), u]));
      const storeMap = new Map<string, any>((raw.stores || []).map((s: any) => [(s._id || s.id)?.toString(), s]));

      const orders: Order[] = (raw.orders || []).map((o: any) => {
        const uId = (typeof o.userId === 'object' ? o.userId?._id : o.userId)?.toString();
        const user = uId ? userMap.get(uId) : null;

        const sId = (typeof o.storeId === 'object' ? o.storeId?._id : o.storeId)?.toString();
        const store = sId ? storeMap.get(sId) : null;

        const addr = typeof o.deliveryAddress === 'object' && o.deliveryAddress !== null
          ? (o.deliveryAddress.address || [o.deliveryAddress.houseNumber, o.deliveryAddress.street, o.deliveryAddress.landmark, o.deliveryAddress.city].filter(Boolean).join(', ') || 'Ahmedabad')
          : (o.deliveryAddress || o.address || 'Ahmedabad');

        return {
          id: o._id?.toString() || o.id,
          _id: o._id?.toString() || o.id,
          orderNumber: o.orderNumber || `#WUP-${(o._id || '').toString().slice(-6)}`,
          customerName: o.customerName || (typeof o.userId === 'object' ? o.userId?.name : null) || user?.name || 'Customer',
          customerPhone: o.customerPhone || (typeof o.userId === 'object' ? o.userId?.phone : null) || user?.phone || '',
          customerEmail: o.customerEmail || (typeof o.userId === 'object' ? o.userId?.email : null) || user?.email || '',
          storeId: sId || '',
          storeName: o.storeName || store?.name || 'Dark Store',
          totalAmount: o.totalAmount || o.finalAmount || 0,
          finalAmount: o.finalAmount || o.totalAmount || 0,
          paymentStatus: o.paymentStatus || (o.paymentMethod === 'COD' ? 'PENDING' : 'PAID'),
          paymentMethod: o.paymentMethod || 'ONLINE',
          status: o.status || 'PLACED',
          items: (o.items || []).map((it: any) => ({
            productId: it.productId?.toString() || it.id,
            name: it.name || it.title || 'Item',
            quantity: it.quantity || 1,
            price: it.price || it.unitPrice || 0,
            unit: it.unit || it.quantityLabel || '1 unit',
            imageUrl: it.imageUrl || it.image || '',
          })),
          riderName: o.deliveryPartner?.name || o.rider?.name || o.riderName || '',
          riderPhone: o.deliveryPartner?.phone || o.riderPhone || '',
          deliveryAddress: addr,
          createdAt: o.createdAt || new Date().toISOString(),
        };
      });

      // Map product variants
      const variantsByProductId = new Map<string, ProductVariantItem[]>();
      const productVariants: ProductVariantItem[] = (raw.productVariants || []).map((v: any) => {
        const pId = v.productId?.toString() || '';
        const item: ProductVariantItem = {
          id: v._id?.toString() || v.id,
          _id: v._id?.toString() || v.id,
          productId: pId,
          sku: v.sku || '',
          weightOrVolume: v.weightOrVolume || v.unit || '1 unit',
          mrp: Number(v.mrp) || Number(v.sellingPrice) || 0,
          sellingPrice: Number(v.sellingPrice) || 0,
          discountPercent: Number(v.discountPercent) || 0,
          stock: v.stock !== undefined ? Number(v.stock) : 100,
          isDefault: !!v.isDefault,
          isActive: v.isActive !== false,
        };
        if (pId) {
          const list = variantsByProductId.get(pId) || [];
          list.push(item);
          variantsByProductId.set(pId, list);
        }
        return item;
      });

      const products: ProductItem[] = (raw.products || []).map((p: any) => {
        const prodId = p._id?.toString() || p.id;
        const assignedVariants = variantsByProductId.get(prodId) || [];
        return {
          id: prodId,
          _id: prodId,
          name: p.name,
          category: p.category || p.categoryId?.name || 'Groceries',
          categoryId: p.categoryId?._id?.toString() || p.categoryId?.toString() || '',
          basePrice: p.basePrice || p.mrp || p.sellingPrice || 0,
          sellingPrice: p.sellingPrice || p.price || 0,
          mrp: p.mrp || p.sellingPrice || p.price || 0,
          discountPercent: p.discountPercent || 0,
          stock: p.stock ?? 50,
          sku: p.sku || `SKU-${(p._id || '').toString().slice(-6)}`,
          imageUrl: p.imageUrl || p.image || '',
          image: p.imageUrl || p.image || '',
          unit: p.quantityLabel || p.unit || '1 unit',
          brand: p.brand || 'WormUp Essentials',
          isActive: p.isActive !== false,
          variants: assignedVariants,
        };
      });

      const areaPricing: AreaPricingRecord[] = (raw.areaPricing || []).map((ap: any) => ({
        id: ap._id?.toString() || ap.id,
        _id: ap._id?.toString() || ap.id,
        productId: ap.productId?.toString() || '',
        variantId: ap.variantId?.toString() || '',
        areaId: ap.areaId?.toString() || '',
        price: Number(ap.price) || 0,
        mrp: ap.mrp !== undefined ? Number(ap.mrp) : undefined,
        discountPercent: ap.discountPercent !== undefined ? Number(ap.discountPercent) : undefined,
        stock: ap.stock !== undefined ? Number(ap.stock) : undefined,
        isAvailable: ap.isAvailable !== false,
      }));

      const categories: CategoryItem[] = (raw.categories || []).map((c: any) => ({
        id: c._id?.toString() || c.id,
        _id: c._id?.toString() || c.id,
        name: c.name,
        code: c.code || c.slug?.toUpperCase().replace(/-/g, '_') || 'CAT',
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
        icon: c.icon || 'ShoppingBag',
        image: c.image || c.imageUrl || '',
        imageUrl: c.imageUrl || c.image || '',
        bgColor: c.bgColor || '#F3F0FF',
        description: c.description || '',
        sortOrder: c.sortOrder || 0,
        itemCount: c.productCount || c.itemCount || 0,
        productCount: c.productCount || c.itemCount || 0,
        subCategories: c.subCategories || [],
        isActive: c.isActive !== false,
      }));

      const stores: DarkStoreItem[] = (raw.stores || []).map((s: any) => ({
        id: s._id?.toString() || s.id,
        _id: s._id?.toString() || s.id,
        name: s.name,
        code: s.code,
        loginId: s.loginId || `womup_${(s.code || '').toLowerCase()}`,
        address: s.address,
        city: s.cityName || s.city || 'Ahmedabad',
        cityName: s.cityName || s.city || 'Ahmedabad',
        cityId: s.cityId?.toString() || null,
        pincode: s.pincode || '380015',
        areaId: s.areaId?.toString() || null,
        areaName: s.areaName || s.area || null,
        isActive: s.isActive !== false,
        isOnShift: s.isOnShift === true,
        isOnline: s.isOnline !== false,
        staffOnShift: s.staffOnShift || 2,
        staffTotal: s.staffTotal || 4,
        orderCount: s.orderCount || 0,
        pendingOrders: s.pendingOrders || 0,
        serviceRadiusKm: s.serviceRadiusKm || 4.5,
        estimatedDeliveryMinutes: s.estimatedDeliveryMinutes || 9,
        coordinates: s.location?.coordinates || [72.53, 23.03],
        createdAt: s.createdAt || new Date().toISOString(),
      }));

      const areas: AreaItem[] = (raw.areas || []).map((a: any) => ({
        id: a._id?.toString() || a.id,
        _id: a._id?.toString() || a.id,
        name: a.name,
        code: a.code || a.name.toUpperCase().replace(/\s+/g, '_'),
        cityName: a.cityName || 'Ahmedabad',
        cityId: a.cityId?.toString(),
        pincodes: a.pincodes || ['380015'],
        radiusKm: a.radiusKm || 4.5,
        defaultDeliveryMinutes: a.defaultDeliveryMinutes || 9,
        maxStores: a.maxStores || 3,
        activeStoreCount: a.activeStoreCount || 1,
        surgeMultiplier: a.surgeMultiplier || 1.0,
        baseDeliveryFee: a.baseDeliveryFee || 0,
        isActive: a.isActive !== false,
      }));

      const cities: CityItem[] = (raw.cities || [
        { id: 'city_1', name: 'Ahmedabad', code: 'AMD', state: 'Gujarat', isActive: true, areaCount: 8, storeCount: 4 },
        { id: 'city_2', name: 'Gandhinagar', code: 'GNR', state: 'Gujarat', isActive: true, areaCount: 4, storeCount: 2 },
      ]);

      const payoutRates: PayoutRateItem[] = [
        { id: 'pr_1', vehicleType: 'Motorbike', baseFare: 35, perKmRate: 12, peakHourBonus: 15, rainSurgeBonus: 25 },
        { id: 'pr_2', vehicleType: 'Electric Scooter (EV)', baseFare: 40, perKmRate: 14, peakHourBonus: 18, rainSurgeBonus: 25 },
        { id: 'pr_3', vehicleType: 'Bicycle / Pedestrian', baseFare: 25, perKmRate: 8, peakHourBonus: 10, rainSurgeBonus: 15 },
      ];

      const campaigns: MarketingCampaign[] = (raw.campaigns || [
        { id: 'camp_1', title: '₹100 Off on First 3 Orders', targetAudience: 'New Customers', discountCode: 'WOMUP100', discountPercent: 20, status: 'ACTIVE' },
        { id: 'camp_2', title: 'Midnight Quick-Commerce Lightning Deals', targetAudience: 'All Active Users', discountCode: 'NIGHT9', discountPercent: 15, status: 'ACTIVE' },
        { id: 'camp_3', title: 'Free Delivery Weekend Extravaganza', targetAudience: 'Ahmedabad North', discountCode: 'FREEDEL', discountPercent: 0, status: 'COMPLETED' },
      ]);

      const auditLogs: AuditLogItem[] = (raw.auditLogs || [
        { id: 'log_1', adminName: 'Chief SuperAdmin', action: 'CREATE_DARK_STORE', target: 'WomUp Chandlodiya Store', details: 'Added 4.5km service radius in Tragad area', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { id: 'log_2', adminName: 'Operations Lead', action: 'UPDATE_PRODUCT_PRICE', target: 'Amul Gold Milk 500ml', details: 'Price synchronized to ₹34', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
        { id: 'log_3', adminName: 'Fleet Controller', action: 'DISPATCH_ORDER', target: '#WUP-749102', details: 'Assigned to Rider Rahul Parmar', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      ]);

      return {
        customers,
        riders,
        orders,
        products,
        productVariants,
        areaPricing,
        categories,
        cities,
        areas,
        stores,
        staff: riders,
        campaigns,
        coinLedger: raw.coinTransactions || [],
        auditLogs,
        payoutRates,
      };
    } catch (err: any) {
      console.warn('[AdminApiService] fetchLiveSnapshot notice:', err.message);
      return null;
    }
  },

  // 2. CREATE STORE (Instant MongoDB Write & Multi-Store Area Capacity Validation)
  async createStore(payload: any): Promise<{ success: boolean; id?: any; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create dark store' };
    }
  },

  // 3. TOGGLE STORE SHIFT / ONLINE STATUS
  async toggleStoreShift(storeId: string, isOnShift: boolean): Promise<{ success: boolean; data?: any }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnShift, isOnline: isOnShift }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false };
    }
  },

  // 4. RESET STORE PASSWORD
  async resetStorePassword(storeId: string, password?: string): Promise<{ success: boolean; password?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 5. DELETE STORE
  async deleteStore(storeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 6. UPDATE ORDER STATUS (Sync to Customer Web & Rider App)
  async updateOrderStatus(orderNumber: string, status: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderNumber}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 7. CREATE PRODUCT
  async createProduct(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalog/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 7b. UPDATE PRODUCT
  async updateProduct(id: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalog/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 8. UPDATE PRODUCT PRICE
  async updateProductPrice(productName: string, sellingPrice: number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, sellingPrice }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 9. ADJUST SHOPPING COINS (Credit / Debit)
  async adjustCoins(payload: { userId: string; amount: number; type: 'Credit' | 'Debit'; reason: string }): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/coins/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 10. CREATE CATEGORY
  async createCategory(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 10b. UPDATE CATEGORY
  async updateCategory(id: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 10c. DELETE CATEGORY
  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 11. CREATE AREA
  async createArea(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 12. SAVE VARIANT AREA PRICE OVERRIDE
  async saveVariantAreaPrice(payload: {
    productId: string;
    variantId: string;
    areaId: string;
    price: number;
    mrp?: number;
    stock?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/areas/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateVariant(variantId: string, data: { sellingPrice?: number; mrp?: number; stock?: number }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalog/variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 13. DELETE PRODUCT
  async deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalog/products/${productId}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 14. CITIES & AREAS CRUD
  async createCity(payload: { name: string; code: string; state?: string; status?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateCity(id: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async deleteCity(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cities/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateArea(id: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/areas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async deleteArea(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/areas/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 15. PAYOUT RATES
  async fetchPayoutRates(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payout-rates`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async savePayoutRate(payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = payload.id && payload.id !== 'global_default'
        ? `${API_BASE_URL}/api/payout-rates/${payload.id}`
        : `${API_BASE_URL}/api/payout-rates`;
      const method = payload.id && payload.id !== 'global_default' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async deletePayoutRate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payout-rates/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async simulatePayout(params: { cityId?: string; areaId?: string; cityName?: string; areaName?: string; distanceKm: number }): Promise<any> {
    try {
      const query = new URLSearchParams();
      if (params.cityId) query.set('cityId', params.cityId);
      if (params.areaId) query.set('areaId', params.areaId);
      if (params.cityName) query.set('cityName', params.cityName);
      if (params.areaName) query.set('areaName', params.areaName);
      query.set('distanceKm', String(params.distanceKm));
      const res = await fetch(`${API_BASE_URL}/api/payout-rates/resolve?${query.toString()}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 16. WALLETS & SETTLEMENTS (3-WAY REVENUE ENGINE)
  async getWalletsSummary(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/wallets/summary`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async getStoreWallets(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/wallets/stores`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async getRiderWallets(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/wallets/riders`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async getWalletTransactions(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/wallet/transactions`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async settleStoreWallet(storeId: string, amount: number, notes?: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/wallets/store-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, amount, notes }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async payoutRiderWallet(riderId: string, amount: number, notes?: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/wallets/rider-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId, amount, notes }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 17. RIDERS & USERS MANAGEMENT
  async fetchRiderDetail(riderId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/riders/${riderId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateRider(riderId: string, payload: any): Promise<any> {

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/riders/${riderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async toggleCustomerBlock(userId: string, isBlocked: boolean): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isBlocked }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async createCustomer(payload: { name: string; phone: string; email?: string; address?: string; type?: string; zoneName?: string }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async getCustomerKyc(userId: string): Promise<any> {
    try {
      const res = await fetch(`${NEST_API_BASE_URL}/admin/customers/${userId}/kyc`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async approveCustomerKyc(userId: string): Promise<any> {
    try {
      const res = await fetch(`${NEST_API_BASE_URL}/admin/customers/${userId}/approve-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async rejectCustomerKyc(userId: string, reason?: string): Promise<any> {
    try {
      const res = await fetch(`${NEST_API_BASE_URL}/admin/customers/${userId}/reject-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', rejectionReason: reason || 'Aadhaar image not clear' }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async updateCustomer(userId: string, payload: any): Promise<any> {
    try {
      // Sync to Nest API
      await fetch(`${NEST_API_BASE_URL}/admin/customers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      // Sync to Express API
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async cancelOrder(orderIdOrNumber: string, payload: { reason: string; refundAmount?: number }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderIdOrNumber}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  // 18. MARKETING CAMPAIGNS
  async createCampaign(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/marketing/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async toggleCampaign(campaignId: string, isEnabled: boolean): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled, status: isEnabled ? 'Scheduled' : 'Paused' }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
};
