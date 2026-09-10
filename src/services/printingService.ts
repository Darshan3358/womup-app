import { api } from './api';

export interface PaperQualityOption {
  id: string;
  label: string;
  extraPricePerPage: number;
  description: string;
}

export interface PrintTypeOption {
  id: string;
  label: string;
  isDoubleSided: boolean;
}

export interface ColorOption {
  id: string;
  label: string;
  pricePerPage: number;
  isColor: boolean;
}

export interface BindingOption {
  id: string;
  label: string;
  price: number;
}

export interface PrintServicesConfig {
  serviceName: string;
  basePrice: number;
  deliveryTime: string;
  isActive: boolean;
  paperQualities: PaperQualityOption[];
  printTypes: PrintTypeOption[];
  colorOptions: ColorOption[];
  bindingOptions: BindingOption[];
}

export interface PrintQuoteParams {
  pageCount: number;
  numberOfCopies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  paperQuality?: string;
  binding?: string;
}

export interface PrintQuoteResult {
  pageCount: number;
  numberOfCopies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  ratePerPage: number;
  paperQuality: string;
  binding: string;
  bindingPrice: number;
  deliveryTimeEstimate: string;
  totalAmount: number;
}

export interface PrintOrderItem {
  _id: string;
  printOrderNumber: string;
  userId?: string;
  originalFileName: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileType?: string;
  fileSize?: string;
  pageCount: number;
  numberOfCopies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  paperQuality: string;
  binding: string;
  bindingPrice?: number;
  pricePerPage?: number;
  totalAmount: number;
  deliveryAddress?: string;
  status: 'UPLOADED' | 'PROCESSING' | 'PRINTING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'PURGED';
  isDocumentPurged?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePrintOrderParams extends PrintQuoteParams {
  fileName: string;
  storageKey?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileType?: string;
  fileSize?: string;
  deliveryAddress?: string;
  guestUserId?: string;
}

export const PrintingService = {
  async fetchConfig(): Promise<PrintServicesConfig | null> {
    const res = await api.get<PrintServicesConfig>('/printing/config');
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  },

  async calculateQuote(params: PrintQuoteParams): Promise<PrintQuoteResult | null> {
    const res = await api.post<PrintQuoteResult>('/printing/quote', params);
    if (res.success && res.data) {
      return res.data;
    }
    // Fallback calculation if backend unreachable
    const rate = params.isColor ? 10 : 3;
    const gsmExtra = params.paperQuality?.includes('80') ? 1 : params.paperQuality?.includes('100') ? 3 : 0;
    const bindingExtra = params.binding === 'staple' ? 5 : params.binding === 'spiral' ? 25 : 0;
    const total = (params.pageCount * (rate + gsmExtra) * params.numberOfCopies) + (bindingExtra * params.numberOfCopies);

    return {
      ...params,
      ratePerPage: rate + gsmExtra,
      paperQuality: params.paperQuality || '70 GSM Standard',
      binding: params.binding || 'none',
      bindingPrice: bindingExtra,
      deliveryTimeEstimate: '10 minutes',
      totalAmount: total,
    };
  },

  async uploadDocumentFile(file: any): Promise<{ url: string; secure_url: string } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload<any>('/media/upload?folder=wormup/printing', formData);
      if (res.success && res.data) {
        return {
          url: res.data.url || res.data.secure_url,
          secure_url: res.data.secure_url || res.data.url,
        };
      }
    } catch (e) {
      console.warn('Cloudinary direct upload fallback to local preview', e);
    }
    return null;
  },

  async createPrintOrder(params: CreatePrintOrderParams): Promise<any> {
    const payload = {
      ...params,
      storageKey: params.storageKey || `s3://wormup-prints/${Date.now()}-${params.fileName}`,
    };
    const res = await api.post<any>('/printing/orders', payload);
    return res;
  },

  async fetchMyPrintOrders(): Promise<PrintOrderItem[]> {
    const res = await api.get<PrintOrderItem[]>('/printing/orders');
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  async fetchPrintOrderById(id: string): Promise<PrintOrderItem | null> {
    const res = await api.get<PrintOrderItem>(`/printing/orders/${id}`);
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  },
};
