import { LocalVendor, LocalTransaction, CoinLedgerItem } from '../types/localShop.types';
import { MOCK_LOCAL_VENDORS, MOCK_LOCAL_TRANSACTIONS, MOCK_COIN_LEDGER } from '../data/mockLocalShops';

const API_BASE = 'http://localhost:5050/api/v1';

export const LocalShopApi = {
  // 1. Fetch nearby shops
  async getNearbyShops(category?: string, query?: string): Promise<LocalVendor[]> {
    try {
      const url = new URL(`${API_BASE}/local/nearby-shops`);
      if (category && category !== 'More') url.searchParams.append('category', category);
      if (query) url.searchParams.append('query', query);

      const res = await fetch(url.toString(), { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // Non-fatal, use local state
    }

    // Filter local mock vendors
    let filtered = [...MOCK_LOCAL_VENDORS];
    if (category && category !== 'More') {
      filtered = filtered.filter(
        (v) => v.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (query && query.trim() !== '') {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  // 2. Fetch single shop detail
  async getShopDetail(vendorId: string): Promise<LocalVendor | undefined> {
    try {
      const res = await fetch(`${API_BASE}/local/shops/${vendorId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch {}
    return MOCK_LOCAL_VENDORS.find((v) => v.id === vendorId);
  },

  // 3. Process In-Store QR Payment & Auto-credit Shopping Coins
  async payVendorQR(payload: {
    vendorId: string;
    amount: number;
    paymentMethod: 'UPI' | 'WALLET' | 'CARD' | 'CASH';
  }): Promise<{ success: boolean; transaction: LocalTransaction; coinsEarned: number }> {
    const vendor = MOCK_LOCAL_VENDORS.find((v) => v.id === payload.vendorId) || MOCK_LOCAL_VENDORS[0];
    const coinPercentage = vendor.coinPercentage || 10;
    const coinsEarned = Math.round((payload.amount * coinPercentage) / 100);

    const newTx: LocalTransaction = {
      id: `tx_loc_${Date.now()}`,
      orderNumber: `#WML-${Math.floor(10000 + Math.random() * 90000)}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorCategory: vendor.category,
      amount: payload.amount,
      coinsEarned,
      paymentMethod: payload.paymentMethod,
      status: 'SUCCESS',
      date: 'Just now',
      qrScanned: true,
    };

    try {
      await fetch(`${API_BASE}/local/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          amount: payload.amount,
          coinsEarned,
          paymentMethod: payload.paymentMethod,
        }),
      });
    } catch {}

    // Add to in-memory history
    MOCK_LOCAL_TRANSACTIONS.unshift(newTx);
    MOCK_COIN_LEDGER.unshift({
      id: `ledger_${Date.now()}`,
      type: 'EARNED',
      coins: coinsEarned,
      vendorName: vendor.name,
      description: `${coinPercentage}% Reward on ₹${payload.amount} in-store QR purchase`,
      date: 'Just now',
      balanceAfter: 2000 + coinsEarned,
    });

    return { success: true, transaction: newTx, coinsEarned };
  },

  // 4. Get Coin Balance
  async getCoinBalance(): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/local/coins/balance`);
      if (res.ok) {
        const json = await res.json();
        if (typeof json.balance === 'number') return json.balance;
      }
    } catch {}
    return 2000;
  },

  // 5. Get Coin Ledger History
  async getCoinHistory(): Promise<CoinLedgerItem[]> {
    return MOCK_COIN_LEDGER;
  },

  // 6. Get Past Local Orders
  async getLocalOrders(): Promise<LocalTransaction[]> {
    return MOCK_LOCAL_TRANSACTIONS;
  },
};
