import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryPartner,
  DeliveryPartnerDocument,
  RiderSettlement,
  RiderSettlementDocument,
  RiderBankAccount,
  RiderBankAccountDocument,
  RiderSettlementRequest,
  RiderSettlementRequestDocument,
} from '../schemas/delivery-partner.schema';
import { DeliveryPartnerCacheService } from '../common/partner-cache.service';

@Injectable()
export class SettlementService {
  constructor(
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(RiderSettlement.name)
    private settlementModel: Model<RiderSettlementDocument>,
    @InjectModel(RiderBankAccount.name)
    private bankAccountModel: Model<RiderBankAccountDocument>,
    @InjectModel(RiderSettlementRequest.name)
    private settlementRequestModel: Model<RiderSettlementRequestDocument>,
    private readonly partnerCacheService: DeliveryPartnerCacheService,
  ) {}

  public clearPartnerCache(userId?: string) {
    this.partnerCacheService.invalidate(userId);
  }

  private async getPartner(userId: string): Promise<DeliveryPartnerDocument> {
    return this.partnerCacheService.getPartner(userId);
  }

  async getTodaySettlement(userId: string) {
    const partner = await this.getPartner(userId);
    const settlements = await this.settlementModel.find({
      riderId: partner._id,
      period: 'TODAY',
    }).lean();

    const basePayout = settlements.reduce((sum: number, s: any) => sum + (s.basePay || 0), 0);
    const incentives = 0; // Incentives removed completely as per business rule
    const tips = settlements.reduce((sum: number, s: any) => sum + (s.tip || 0), 0);
    const adjustments = settlements.reduce((sum: number, s: any) => sum + (s.adjustment || 0), 0);
    const netPayableToday = basePayout + tips + adjustments;

    // Calculate real week and month earnings from database for this rider
    const allRiderSettlements = await this.settlementModel.find({ riderId: partner._id }, 'total').lean();
    const totalLifetimeEarnings = allRiderSettlements.reduce((sum: number, s: any) => sum + (s.total || 0), 0);

    const totalCod = partner.totalCodCollected || 0;
    const totalEarn = partner.totalEarnings || totalLifetimeEarnings;
    const netBalance = totalCod - totalEarn; // > 0: Rider owes Admin, < 0: Admin owes Rider
    const limit = partner.outstandingCashLimit || 500;
    const isLocked = Boolean(partner.isOrderBlocked || netBalance >= limit);

    const todayCod = settlements
      .filter((s) => (s as any).paymentMode === 'COD')
      .reduce((sum, s) => sum + ((s as any).totalAmount || 0), 0);

    return {
      todayCompleted: settlements.length,
      basePayout,
      incentives,
      tips,
      adjustments,
      netPayableToday,
      weekEarnings: totalLifetimeEarnings,
      monthEarnings: totalLifetimeEarnings,
      pendingTransfer: netPayableToday,
      // New Khata / Ledger Metrics
      totalCodCollected: totalCod,
      totalEarnings: totalEarn,
      totalOnlineEarnings: partner.totalOnlineEarnings || 0,
      netBalance,
      riderOwesAdmin: Math.max(0, netBalance),
      adminOwesRider: Math.max(0, -netBalance),
      cashLimit: limit,
      isOrderBlocked: isLocked,
      todayCod,
    };
  }

  async getWeekSettlement(userId: string) {
    const partner = await this.getPartner(userId);
    const settlements = await this.settlementModel.find({ riderId: partner._id });
    const total = settlements.reduce((sum, s) => sum + (s.total || 0), 0);
    return {
      total,
      deliveries: settlements.length,
    };
  }

  async getMonthSettlement(userId: string) {
    const partner = await this.getPartner(userId);
    const settlements = await this.settlementModel.find({ riderId: partner._id });
    const total = settlements.reduce((sum, s) => sum + (s.total || 0), 0);
    return {
      total,
      deliveries: settlements.length,
    };
  }

  async getRecentSettlements(userId: string) {
    const partner = await this.getPartner(userId);
    const settlements = await this.settlementModel
      .find({ riderId: partner._id })
      .sort({ createdAt: -1 })
      .limit(30);

    return settlements.map((s) => {
      const isCod = (s as any).paymentMode === 'COD';
      const totalAmount = (s as any).totalAmount || (s.basePay + s.tip);
      const riderEarning = (s as any).riderEarning || s.total || (s.basePay + s.tip);
      const adminShare = (s as any).adminShare ?? Math.max(0, totalAmount - riderEarning);
      return {
        id: s._id.toString(),
        date: s.settledAt ? new Date(s.settledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today',
        orderNumber: s.orderNumber || '#WUP-84920',
        paymentMode: (s as any).paymentMode || 'ONLINE',
        totalAmount,
        riderEarning,
        adminShare,
        cashCollected: (s as any).cashCollected || 0,
        netImpact: (s as any).netImpact ?? (isCod ? -adminShare : riderEarning),
        baseAmount: s.basePay || 0,
        tip: s.tip || 0,
        bonus: 0,
        total: s.total || riderEarning,
        status: s.status,
      };
    });
  }

  async getBankAccount(userId: string) {
    const partner = await this.getPartner(userId);
    let account = await this.bankAccountModel.findOne({ riderId: partner._id });

    if (!account && (partner.bankName || partner.accountNumber)) {
      const rawAcc = partner.accountNumber || '';
      const masked = rawAcc.length >= 4 ? `********${rawAcc.slice(-4)}` : (rawAcc ? `********${rawAcc}` : '********4829');
      account = await this.bankAccountModel.create({
        riderId: partner._id,
        bankName: partner.bankName || '',
        accountHolderName: partner.fullName || '',
        accountNumberFull: rawAcc,
        maskedAccount: masked,
        ifsc: partner.ifscCode || '',
        upiId: partner.upiId || '',
        verificationStatus: 'PENDING',
      });
    }

    if (!account) {
      return null;
    }

    const fullAcc = (account as any).accountNumberFull || partner.accountNumber || '';
    const masked = account.maskedAccount || (fullAcc ? `********${fullAcc.slice(-4)}` : '');
    const upi = (account as any).upiId || partner.upiId || '';

    return {
      bankName: account.bankName || partner.bankName || '',
      accountHolderName: account.accountHolderName || partner.fullName || '',
      accountNumber: fullAcc,
      accountNumberFull: fullAcc,
      maskedAccount: masked,
      ifsc: account.ifsc || partner.ifscCode || '',
      upiId: upi,
      verificationStatus: account.verificationStatus || 'PENDING',
    };
  }

  async getBalance(userId: string) {
    const partner = await this.getPartner(userId);
    const settlements = await this.settlementModel.find({ riderId: partner._id });
    
    // Sum settled deliveries
    const settledSum = settlements
      .filter((s) => s.status === 'SETTLED')
      .reduce((sum, s) => sum + (s.total || 0), 0);
    
    const pendingSum = settlements
      .filter((s) => s.status === 'PENDING' || s.status === 'CALCULATED')
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const bank = await this.getBankAccount(userId);

    // Real available balance directly calculated from completed settlements
    const availableBalance = settledSum;

    return {
      availableBalance,
      pendingSettlement: pendingSum,
      lifetimeEarnings: settlements.reduce((sum, s) => sum + (s.total || 0), 0),
      todayCompleted: settlements.filter((s) => s.period === 'TODAY').length,
      bankAccount: bank,
    };
  }

  async getRiderWallet(userId: string) {
    const partner = await this.getPartner(userId);
    const balanceInfo = await this.getBalance(userId);
    const settlements = await this.settlementModel
      .find({ riderId: partner._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const transactions = settlements.map((s) => {
      const isWithdrawal = s.status === 'PROCESSING' || s.status === 'PAID' || (typeof s.total === 'number' && s.total < 0);
      const rawAmount = Math.abs((s as any).riderEarning || s.total || (s.basePay + s.incentive + s.tip) || 0);
      const amount = isWithdrawal ? -rawAmount : rawAmount;

      const type: 'EARNING' | 'TIP' | 'INCENTIVE' | 'WITHDRAWAL' = isWithdrawal
        ? 'WITHDRAWAL'
        : (s.tip || 0) > 0
        ? 'TIP'
        : (s.incentive || 0) > 0
        ? 'INCENTIVE'
        : 'EARNING';

      const orderNum = s.orderNumber || 'Order';
      const title = isWithdrawal
        ? 'Withdrawal to Bank'
        : type === 'TIP'
        ? `Tip Received (${orderNum})`
        : type === 'INCENTIVE'
        ? `Incentive Bonus (${orderNum})`
        : `Order Earnings (${orderNum})`;

      const dateStr = s.settledAt
        ? new Date(s.settledAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : (s as any).createdAt
        ? new Date((s as any).createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Today';

      return {
        id: s._id.toString(),
        title,
        timestamp: dateStr,
        amount,
        type,
      };
    });

    return {
      balance: balanceInfo.availableBalance || 0,
      pendingTransfer: balanceInfo.pendingSettlement || 0,
      lifetimeEarnings: balanceInfo.lifetimeEarnings || 0,
      bankAccount: balanceInfo.bankAccount || null,
      transactions,
    };
  }

  async requestPayout(userId: string, requestedAmount?: number) {
    const partner = await this.getPartner(userId);
    const balance = await this.getBalance(userId);

    const amount = requestedAmount && requestedAmount > 0 ? requestedAmount : balance.availableBalance;

    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than ₹0');
    }

    if (!balance.bankAccount) {
      throw new BadRequestException('Please add and verify your bank account details before requesting a withdrawal.');
    }

    if (amount > balance.availableBalance) {
      throw new BadRequestException(`Insufficient available balance. Available: ₹${balance.availableBalance}`);
    }

    const payoutId = 'PAY-' + Date.now().toString().slice(-6);
    const utr = 'IMPS' + Math.floor(100000000000 + Math.random() * 900000000000);
    const transferredAt = new Date().toISOString();

    // Mark today's settlements as processed if any
    await this.settlementModel.updateMany(
      { riderId: partner._id, status: 'SETTLED' },
      { $set: { status: 'PROCESSING' } },
    );

    // Record payout withdrawal transaction
    await this.settlementModel.create({
      riderId: partner._id,
      orderNumber: payoutId,
      period: 'TODAY',
      basePay: 0,
      incentive: 0,
      tip: 0,
      adjustment: 0,
      total: -amount,
      status: 'PROCESSING',
      settledAt: new Date(),
    });

    return {
      success: true,
      message: 'Transfer initiated successfully via IMPS',
      payoutId,
      amount,
      utr,
      bankName: balance.bankAccount.bankName,
      maskedAccount: balance.bankAccount.maskedAccount,
      transferredAt,
      remainingBalance: Math.max(0, balance.availableBalance - amount),
    };
  }

  async updateBankAccount(
    userId: string,
    data: {
      bankName?: string;
      accountHolderName?: string;
      accountNumber?: string;
      ifsc?: string;
      upiId?: string;
    },
  ) {
    const partner = await this.getPartner(userId);
    let account = await this.bankAccountModel.findOne({ riderId: partner._id });

    const rawAcc = (data.accountNumber || '').trim();
    const masked = rawAcc.length >= 4 ? `********${rawAcc.slice(-4)}` : (rawAcc ? `********${rawAcc}` : '********4829');
    const cleanUpi = data.upiId !== undefined ? data.upiId.trim() : undefined;

    if (!account) {
      account = await this.bankAccountModel.create({
        riderId: partner._id,
        bankName: (data.bankName || '').trim(),
        accountHolderName: (data.accountHolderName || partner.fullName).trim(),
        accountNumberFull: rawAcc,
        maskedAccount: masked,
        ifsc: (data.ifsc || '').toUpperCase().trim(),
        upiId: cleanUpi || '',
        verificationStatus: 'PENDING',
      });
    } else {
      if (data.bankName) account.bankName = data.bankName.trim();
      if (data.accountHolderName) account.accountHolderName = data.accountHolderName.trim();
      if (rawAcc) {
        account.maskedAccount = masked;
        (account as any).accountNumberFull = rawAcc;
      }
      if (data.ifsc) account.ifsc = data.ifsc.toUpperCase().trim();
      if (cleanUpi !== undefined) (account as any).upiId = cleanUpi;
      account.verificationStatus = 'PENDING';
      await account.save();
    }

    if (data.bankName) partner.bankName = data.bankName.trim();
    if (data.accountHolderName) partner.accountHolderName = data.accountHolderName.trim();
    if (rawAcc) partner.accountNumber = rawAcc;
    if (data.ifsc) partner.ifscCode = data.ifsc.toUpperCase().trim();
    if (cleanUpi !== undefined) partner.upiId = cleanUpi;
    await partner.save();

    if (partner.userId) {
      const userUpdate: any = {
        bankName: data.bankName ? data.bankName.trim() : partner.bankName,
        accountHolderName: data.accountHolderName ? data.accountHolderName.trim() : partner.accountHolderName,
        accountNumber: rawAcc || partner.accountNumber,
        ifscCode: data.ifsc ? data.ifsc.toUpperCase().trim() : partner.ifscCode,
      };
      if (cleanUpi !== undefined) userUpdate.upiId = cleanUpi;

      await this.partnerModel.db.collection('users').updateOne(
        { _id: partner.userId },
        { $set: userUpdate }
      );
    }

    const fullAcc = (account as any).accountNumberFull || rawAcc || partner.accountNumber || '';

    return {
      bankName: account.bankName,
      accountHolderName: account.accountHolderName,
      accountNumber: fullAcc,
      accountNumberFull: fullAcc,
      maskedAccount: account.maskedAccount,
      ifsc: account.ifsc,
      upiId: (account as any).upiId || partner.upiId || '',
      verificationStatus: account.verificationStatus,
    };
  }

  // --- ONLINE RIDER SETTLEMENT (UPI PAYMENT TO ADMIN) ---
  async getAdminUpiConfig() {
    try {
      const config = await this.partnerModel.db
        .collection('admin_settings')
        .findOne({ settingName: 'PAYMENT_CONFIG' });
      return {
        adminUpiId: config?.adminUpiId || 'wormup@okicici',
        adminUpiName: config?.adminUpiName || 'WormUp Technologies Pvt Ltd',
        qrCodeUrl: config?.qrCodeUrl || '',
        supportPhone: config?.supportPhone || '+91 98765 43210',
      };
    } catch {
      return {
        adminUpiId: 'wormup@okicici',
        adminUpiName: 'WormUp Technologies Pvt Ltd',
        qrCodeUrl: '',
        supportPhone: '+91 98765 43210',
      };
    }
  }

  async updateAdminUpiConfig(adminUpiId: string, adminUpiName?: string, qrCodeUrl?: string) {
    if (!adminUpiId || !adminUpiId.includes('@')) {
      throw new BadRequestException('Invalid UPI ID. Format should be username@bank');
    }
    await this.partnerModel.db.collection('admin_settings').updateOne(
      { settingName: 'PAYMENT_CONFIG' },
      {
        $set: {
          settingName: 'PAYMENT_CONFIG',
          adminUpiId: adminUpiId.trim(),
          adminUpiName: (adminUpiName || 'WormUp Technologies Pvt Ltd').trim(),
          qrCodeUrl: (qrCodeUrl || '').trim(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return {
      success: true,
      message: 'Admin UPI payment configuration updated successfully',
      adminUpiId: adminUpiId.trim(),
      adminUpiName: (adminUpiName || 'WormUp Technologies Pvt Ltd').trim(),
    };
  }

  async getPaymentInfo(userId: string) {
    const partner = await this.getPartner(userId);
    const upiConfig = await this.getAdminUpiConfig();

    const totalCod = partner.totalCodCollected || 0;
    const totalEarn = partner.totalEarnings || 0;
    const netBalance = totalCod - totalEarn;
    const cashLimit = partner.outstandingCashLimit || 500;
    const isOrderBlocked = Boolean(partner.isOrderBlocked || netBalance >= cashLimit);

    // Check if there is an active pending settlement request
    const pendingRequest = await this.settlementRequestModel
      .findOne({ riderId: partner._id, status: 'PENDING' })
      .sort({ requestedAt: -1 });

    return {
      adminUpiId: upiConfig.adminUpiId,
      adminUpiName: upiConfig.adminUpiName,
      supportPhone: upiConfig.supportPhone,
      riderOwesAdmin: Math.max(0, netBalance),
      totalCodCollected: totalCod,
      totalEarnings: totalEarn,
      cashLimit,
      isOrderBlocked,
      hasPendingVerification: Boolean(pendingRequest),
      pendingRequest: pendingRequest
        ? {
            id: pendingRequest._id,
            amount: pendingRequest.amount,
            utrNumber: pendingRequest.utrNumber,
            status: pendingRequest.status,
            requestedAt: pendingRequest.requestedAt,
          }
        : null,
    };
  }

  async createSettlementRequest(
    userId: string,
    data: { amount: number; utrNumber: string },
  ) {
    const partner = await this.getPartner(userId);

    const amt = Number(data.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      throw new BadRequestException('Invalid settlement amount. Must be greater than 0.');
    }

    const utr = (data.utrNumber || '').trim();
    if (!utr || utr.length < 6) {
      throw new BadRequestException('Please provide a valid UTR or Transaction Reference number (minimum 6 characters).');
    }

    // Check for duplicate pending requests
    const existing = await this.settlementRequestModel.findOne({
      riderId: partner._id,
      status: 'PENDING',
    });
    if (existing) {
      throw new BadRequestException(
        `You already have a pending settlement request of ₹${existing.amount} (UTR: ${existing.utrNumber}). Please wait for Admin approval.`,
      );
    }

    const request = await this.settlementRequestModel.create({
      riderId: partner._id,
      riderName: partner.fullName || 'Rider',
      riderPhone: (partner as any).phoneNumber || (partner as any).phone || '',
      amount: amt,
      utrNumber: utr,
      paymentMethod: 'UPI',
      status: 'PENDING',
      requestedAt: new Date(),
    });

    return {
      success: true,
      message: 'Settlement proof submitted successfully! Admin will verify your payment and unlock your account.',
      request: {
        id: request._id,
        amount: request.amount,
        utrNumber: request.utrNumber,
        status: request.status,
        requestedAt: request.requestedAt,
      },
    };
  }

  async getMySettlementRequests(userId: string) {
    const partner = await this.getPartner(userId);
    const requests = await this.settlementRequestModel
      .find({ riderId: partner._id })
      .sort({ requestedAt: -1 })
      .limit(20);

    return requests.map((r) => ({
      id: r._id,
      amount: r.amount,
      utrNumber: r.utrNumber,
      status: r.status,
      adminRemarks: r.adminRemarks,
      requestedAt: r.requestedAt,
      approvedAt: r.approvedAt,
    }));
  }

  async adminGetSettlementRequests(statusFilter?: string) {
    const filter: any = {};
    if (statusFilter && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter.toUpperCase())) {
      filter.status = statusFilter.toUpperCase();
    }
    const list = await this.settlementRequestModel.find(filter).sort({ requestedAt: -1 }).limit(100);
    return list;
  }

  async adminApproveSettlementRequest(requestId: string, adminRemarks?: string) {
    const request = await this.settlementRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Settlement request not found');
    }
    if (request.status === 'APPROVED') {
      throw new BadRequestException('Settlement request has already been approved');
    }

    request.status = 'APPROVED';
    request.approvedAt = new Date();
    request.adminRemarks = adminRemarks || 'Verified and approved via Admin Panel';
    await request.save();

    // Settle rider's balance & unblock
    const partner = await this.partnerModel.findById(request.riderId);
    if (partner) {
      const settleAmt = request.amount;
      const currentCod = partner.totalCodCollected || 0;
      const currentEarnings = partner.totalEarnings || 0;
      const updatedCod = Math.max(0, currentCod - settleAmt);
      const newNet = updatedCod - currentEarnings;

      partner.totalCodCollected = updatedCod;
      partner.currentOutstandingCash = Math.max(0, newNet);
      partner.isOrderBlocked = false; // UNBLOCK RIDER!
      partner.lastSettledAt = new Date();
      await partner.save();

      // Mark pending settlement items as SETTLED
      await this.settlementModel.updateMany(
        { riderId: partner._id, status: 'PENDING' },
        { $set: { status: 'SETTLED', settledAt: new Date() } },
      );

      // Record in ledger
      await this.partnerModel.db.collection('wallet_transactions').insertOne({
        walletType: 'RIDER',
        walletId: partner._id,
        type: 'CREDIT',
        category: 'UPI_ONLINE_SETTLEMENT',
        amount: settleAmt,
        balanceBefore: currentCod - currentEarnings,
        balanceAfter: newNet,
        description: `Online UPI Settlement: ₹${settleAmt} (UTR: ${request.utrNumber}) - Rider Unblocked`,
        createdAt: new Date(),
      });
    }

    return {
      success: true,
      message: `Settlement request approved. ₹${request.amount} credited and rider has been UNBLOCKED.`,
      request,
    };
  }

  async adminRejectSettlementRequest(requestId: string, reason: string) {
    const request = await this.settlementRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Settlement request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject request with status ${request.status}`);
    }

    request.status = 'REJECTED';
    request.rejectedAt = new Date();
    request.adminRemarks = reason || 'Payment proof verification failed';
    await request.save();

    return {
      success: true,
      message: 'Settlement request rejected',
      request,
    };
  }
}
