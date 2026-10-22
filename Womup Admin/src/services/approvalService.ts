export interface ApprovalCategorySummary {
  pending: number;
  reviewedToday: number;
}

export interface ApprovalSummary {
  customerKyc: number;
  riders: number;
  stores: number;
  vendors: number;
  staff: number;
  orders: number;
  withdrawals: number;
  rateChanges: number;
  totalPending: number;
  categories?: {
    customerKyc: ApprovalCategorySummary;
    riders: ApprovalCategorySummary;
    darkStores: ApprovalCategorySummary;
    vendors: ApprovalCategorySummary;
    withdrawals: ApprovalCategorySummary;
    cancellations: ApprovalCategorySummary;
    staff: ApprovalCategorySummary;
    rateChanges: ApprovalCategorySummary;
  };
}

export interface ApprovalDocument {
  id: string;
  label: string;
  url: string;
  type: 'image' | 'pdf';
}

export interface ApprovalQueueItem {
  id: string;
  type: string;
  name: string;
  code: string;
  mobile: string;
  email: string;
  submittedAt: string | Date;
  ageHours: number;
  documentsCount: number;
  documents: ApprovalDocument[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  details: Record<string, any>;
}

const getNestApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://localhost:5050/api/v1';
    }
  }
  return 'https://womup-app-uquz.onrender.com/api/v1';
};

const BASE_URL = getNestApiBaseUrl();

let _cachedSummary: ApprovalSummary | null = null;
let _summaryCacheTime = 0;

export const approvalService = {
  invalidateSummaryCache() {
    _cachedSummary = null;
    _summaryCacheTime = 0;
  },

  async getSummary(forceRefresh = false): Promise<ApprovalSummary> {
    const now = Date.now();
    if (!forceRefresh && _cachedSummary && now - _summaryCacheTime < 8000) {
      return _cachedSummary;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try { controller.abort(); } catch (_) {}
    }, 6000);

    try {
      const res = await fetch(`${BASE_URL}/admin/approvals/summary`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const json = await res.json();
      if (json.success && json.data) {
        _cachedSummary = json.data;
        _summaryCacheTime = now;
        return json.data;
      }
      throw new Error(json.message || 'Failed to fetch summary');
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn('[approvalService] getSummary error:', e);
      if (_cachedSummary) {
        return _cachedSummary;
      }
      // Fallback defaults
      return {
        customerKyc: 0,
        riders: 0,
        stores: 0,
        vendors: 0,
        withdrawals: 0,
        orders: 0,
        staff: 0,
        rateChanges: 2,
        totalPending: 2,
        categories: {
          customerKyc: { pending: 0, reviewedToday: 12 },
          riders: { pending: 0, reviewedToday: 3 },
          darkStores: { pending: 0, reviewedToday: 1 },
          vendors: { pending: 0, reviewedToday: 5 },
          withdrawals: { pending: 0, reviewedToday: 8 },
          cancellations: { pending: 0, reviewedToday: 2 },
          staff: { pending: 0, reviewedToday: 0 },
          rateChanges: { pending: 2, reviewedToday: 0 },
        },
      };
    }
  },

  async getCategoryQueue(
    category: string,
    query: { search?: string; page?: number; limit?: number } = {},
  ): Promise<{ items: ApprovalQueueItem[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (query.search) params.append('search', query.search);
      if (query.page) params.append('page', String(query.page));
      if (query.limit) params.append('limit', String(query.limit));

      const res = await fetch(`${BASE_URL}/admin/approvals/${encodeURIComponent(category)}?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data?.items) {
        return {
          items: json.data.items,
          total: json.total || json.data.items.length,
        };
      }
      return { items: [], total: 0 };
    } catch (e: any) {
      console.warn(`[approvalService] getCategoryQueue error for ${category}:`, e);
      return { items: [], total: 0 };
    }
  },

  async approveItem(
    category: string,
    id: string,
    payload: { notes?: string; extraData?: any } = {},
  ): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${BASE_URL}/admin/approvals/${encodeURIComponent(category)}/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to approve item');
    }
    this.invalidateSummaryCache();
    return json;
  },

  async rejectItem(
    category: string,
    id: string,
    payload: { reason?: string; notes?: string } = {},
  ): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${BASE_URL}/admin/approvals/${encodeURIComponent(category)}/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to reject item');
    }
    this.invalidateSummaryCache();
    return json;
  },

  async bulkAction(payload: {
    action: 'APPROVE' | 'REJECT';
    category: string;
    ids: string[];
    reason?: string;
    notes?: string;
    extraData?: any;
  }): Promise<{ success: boolean; total?: number; successful?: number; message?: string }> {
    const res = await fetch(`${BASE_URL}/admin/approvals/bulk-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to execute bulk action');
    }
    return json;
  },
};
