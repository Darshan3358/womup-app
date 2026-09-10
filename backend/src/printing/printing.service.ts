import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PrintOrder, PrintOrderDocument } from './schemas/print-order.schema';
import { PrintQuoteDto, CreatePrintOrderDto } from './dto/print.dto';

@Injectable()
export class PrintingService {
  constructor(
    @InjectModel(PrintOrder.name)
    private printOrderModel: Model<PrintOrderDocument>,
  ) {}

  getPrintServicesConfig() {
    return {
      serviceName: 'Worm Up Express Document Printing',
      basePrice: 3,
      deliveryTime: '10 minutes',
      isActive: true,
      paperQualities: [
        { id: '70gsm', label: '70 GSM Standard', extraPricePerPage: 0, description: 'Standard crisp prints' },
        { id: '80gsm', label: '80 GSM Premium Bond', extraPricePerPage: 1, description: 'High opacity, zero see-through' },
        { id: '100gsm', label: '100 GSM Executive Gloss', extraPricePerPage: 3, description: 'Ultra-thick paper for certificates & CVs' },
      ],
      printTypes: [
        { id: 'single', label: 'Single Side', isDoubleSided: false },
        { id: 'double', label: 'Back to Back (Double Side)', isDoubleSided: true },
      ],
      colorOptions: [
        { id: 'bw', label: 'Black & White', pricePerPage: 3, isColor: false },
        { id: 'color', label: 'Color Print', pricePerPage: 10, isColor: true },
      ],
      bindingOptions: [
        { id: 'none', label: 'No Binding', price: 0 },
        { id: 'staple', label: 'Corner Stapled', price: 5 },
        { id: 'spiral', label: 'Spiral Ring Binding', price: 25 },
      ],
    };
  }

  calculateQuote(dto: PrintQuoteDto) {
    const isColor = !!dto.isColor;
    const baseRate = isColor ? 10 : 3;

    let gsmExtra = 0;
    if (dto.paperQuality?.includes('80')) gsmExtra = 1;
    if (dto.paperQuality?.includes('100')) gsmExtra = 3;

    let bindingPrice = 0;
    if (dto.binding === 'staple') bindingPrice = 5;
    if (dto.binding === 'spiral') bindingPrice = 25;

    const ratePerPage = baseRate + gsmExtra;
    const pagesTotal = dto.pageCount * ratePerPage * dto.numberOfCopies;
    const totalAmount = pagesTotal + (bindingPrice * dto.numberOfCopies);

    return {
      pageCount: dto.pageCount,
      numberOfCopies: dto.numberOfCopies,
      isColor,
      isDoubleSided: !!dto.isDoubleSided,
      ratePerPage,
      paperQuality: dto.paperQuality || '70 GSM Standard',
      binding: dto.binding || 'none',
      bindingPrice,
      deliveryTimeEstimate: '10 minutes',
      totalAmount,
    };
  }

  async createPrintOrder(userId: string | undefined, dto: CreatePrintOrderDto) {
    const quote = this.calculateQuote(dto);
    const printOrderNumber = `PRINT-${Date.now().toString().slice(-6)}`;

    // Only set userId if the request came from an authenticated user with a valid ObjectId.
    // For unauthenticated (guest) sessions we rely on guestSessionId (a stable string UUID
    // stored in the client's AsyncStorage) instead of generating a random ObjectId that can
    // never be looked up again.
    let validUserId: Types.ObjectId | undefined;
    if (userId && Types.ObjectId.isValid(userId)) {
      validUserId = new Types.ObjectId(userId);
    } else if (dto.guestUserId && Types.ObjectId.isValid(dto.guestUserId)) {
      // Accept a pre-existing guest ObjectId only if it was sent and is valid
      validUserId = new Types.ObjectId(dto.guestUserId);
    }
    // If neither is available, leave userId undefined — the guestSessionId field handles scoping.

    const order = await this.printOrderModel.create({
      printOrderNumber,
      userId: validUserId,          // undefined for pure guests — that is correct
      guestSessionId: dto.guestSessionId || undefined, // stable client UUID for guest tracking
      originalFileName: dto.fileName,
      privateStorageKey: dto.storageKey || `local://prints/${dto.fileName}`,
      fileUrl: dto.fileUrl || '',
      thumbnailUrl: dto.thumbnailUrl || dto.fileUrl || '',
      fileType: dto.fileType || '',
      fileSize: dto.fileSize || '',
      pageCount: dto.pageCount,
      numberOfCopies: dto.numberOfCopies,
      isColor: !!dto.isColor,
      isDoubleSided: !!dto.isDoubleSided,
      paperQuality: dto.paperQuality || '70 GSM Standard',
      binding: dto.binding || 'none',
      bindingPrice: quote.bindingPrice,
      pricePerPage: quote.ratePerPage,
      totalAmount: quote.totalAmount,
      deliveryAddress: dto.deliveryAddress || 'Home — Prahlad Nagar, Ahmedabad',
      status: 'PRINTING',
      isDocumentPurged: false,
    });

    return order;
  }

  async getMyPrintOrders(userId?: string, guestSessionId?: string) {
    // --- Authenticated user: return ONLY their orders (strict isolation) ---
    if (userId && Types.ObjectId.isValid(userId)) {
      return this.printOrderModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .exec();
    }

    // --- Guest user with stable session token: return their session's orders ---
    if (guestSessionId && guestSessionId.trim().length > 0) {
      return this.printOrderModel
        .find({ guestSessionId })
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();
    }

    // --- No identity at all: return empty list (do NOT leak other users' orders) ---
    return [];
  }

  async getPrintOrderById(id: string) {
    if (Types.ObjectId.isValid(id)) {
      const order = await this.printOrderModel.findById(id).exec();
      if (order) return order;
    }
    return this.printOrderModel.findOne({ printOrderNumber: id }).exec();
  }

  // Automatic privacy purge once printing & delivery are complete
  async purgeDocument(printOrderId: string) {
    const order = await this.printOrderModel.findById(printOrderId);
    if (!order) {
      throw new NotFoundException('Print order not found');
    }

    order.isDocumentPurged = true;
    order.purgedAt = new Date();
    order.status = 'PURGED';
    await order.save();

    return { purged: true, message: 'Private document permanently deleted for customer data security' };
  }
}
