import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { IncomeTransaction, IncomeTransactionDocument } from './schemas/income-transaction.schema';
import { CoinTransaction, CoinTransactionDocument } from '../coins/schemas/coin-transaction.schema';
import { TeamPurchaseIncome, TeamPurchaseIncomeDocument } from './schemas/team-purchase-income.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { NotificationService } from '../notifications/notification.service';

export function sanitizePublicDocUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('file://')) return trimmed;
  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    const filename = trimmed.split('/uploads/')[1] || trimmed.split('/').pop();
    return `https://womup-app-uquz.onrender.com/uploads/${filename}`;
  }
  if (trimmed.startsWith('/uploads/')) {
    return `https://womup-app-uquz.onrender.com${trimmed}`;
  }
  if (trimmed.startsWith('http://womup-app-uquz.onrender.com')) {
    return trimmed.replace('http://', 'https://');
  }
  return trimmed;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(IncomeTransaction.name)
    private incomeTxModel: Model<IncomeTransactionDocument>,
    @InjectModel(CoinTransaction.name)
    private coinTxModel: Model<CoinTransactionDocument>,
    @InjectModel(TeamPurchaseIncome.name)
    private teamIncomeModel: Model<TeamPurchaseIncomeDocument>,
    private readonly trackingGateway: TrackingGateway,
    @Optional() private readonly notificationService?: NotificationService,
  ) {}

  private getNextMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  async settleUserPendingIncome(userId: string) {
    try {
      const now = new Date();
      const uId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
      if (!uId) return;

      const pendingTxs = await this.incomeTxModel.find({
        userId: uId,
        status: 'PENDING',
        availableFrom: { $lte: now },
      });

      if (pendingTxs.length > 0) {
        const totalToMove = pendingTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        await this.userModel.findByIdAndUpdate(uId, {
          $inc: {
            pendingIncome: -totalToMove,
            availableIncome: totalToMove,
            walletBalance: totalToMove,
          },
        });
        await this.incomeTxModel.updateMany(
          { _id: { $in: pendingTxs.map((t) => t._id) } },
          { $set: { status: 'AVAILABLE', isUsable: true } },
        );
      }
    } catch (e) {
      // Non-blocking
    }
  }

  async getProfile(userId: string) {
    await this.settleUserPendingIncome(userId);
    const user = await this.userModel.findById(userId).select('-__v').exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    // Auto-sync teamSize & direct5ActiveCount if missing/zero
    if (!user.teamSize || user.teamSize === 0) {
      try {
        const downlineLevels = await this.get7LevelDownline(user._id);
        const totalTeamSize = downlineLevels.reduce((acc, lvl) => acc + lvl.length, 0);
        const direct5Active = downlineLevels[0]?.filter((m) => (m.monthlyPurchaseValue || 0) >= 2000).length || 0;
        if (totalTeamSize > 0) {
          user.teamSize = totalTeamSize;
          user.direct5ActiveCount = direct5Active;
          await user.save();
        }
      } catch (e) {
        // Safe fallback
      }
    }

    return user;
  }

  async updateProfile(userId: string, updateData: UpdateUserDto) {
    const currentUser = await this.userModel.findById(userId).exec();
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const updateOps: any = { $set: {} };

    for (const [key, val] of Object.entries(updateData)) {
      if (val !== undefined) {
        updateOps.$set[key] = val;
      }
    }

    if (updateData.firstName || updateData.surname) {
      const fName = updateData.firstName || currentUser.firstName || '';
      const sName = updateData.surname || currentUser.surname || '';
      if (!updateData.name && (fName || sName)) {
        updateOps.$set.name = `${fName} ${sName}`.trim();
      }
    }

    if (updateData.birthday) {
      // Award 50 bonus shopping coins on first-time birthday save
      if (!currentUser.birthday) {
        updateOps.$inc = { shoppingCoins: 50 };
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateOps, { new: true })
      .select('-__v')
      .exec();

    return user;
  }

  async registerPushToken(
    userId: string,
    token: string,
    platform: 'android' | 'ios' | 'web' = 'android',
    appVersion?: string,
  ) {
    const updateFields: any = { updatedAt: new Date() };
    if (platform === 'android') {
      updateFields.androidToken = token;
    } else if (platform === 'ios') {
      updateFields.iosToken = token;
    } else {
      updateFields.androidToken = token;
    }
    await this.userModel.findByIdAndUpdate(userId, { $set: updateFields }).exec();
    return { success: true, message: 'Push token registered successfully' };
  }

  async getWishlist(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const items = await this.productModel.find({ _id: { $in: user.wishlist || [] } }).exec();
    return items;
  }

  async toggleWishlist(userId: string, productId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();

    const resolvedId = product ? product._id : (Types.ObjectId.isValid(productId) ? new Types.ObjectId(productId) : null);
    if (!resolvedId) {
      throw new NotFoundException('Product not found for wishlist');
    }

    const prodIdStr = resolvedId.toString();
    const existingIndex = user.wishlist.findIndex(
      (id) => id && id.toString() === prodIdStr,
    );

    let isInWishlist = false;
    if (existingIndex > -1) {
      user.wishlist.splice(existingIndex, 1);
      isInWishlist = false;
    } else {
      user.wishlist.unshift(resolvedId);
      isInWishlist = true;
    }

    await user.save();
    const items = await this.productModel.find({ _id: { $in: user.wishlist } }).exec();
    const result = {
      action: isInWishlist ? 'ADDED' : 'REMOVED',
      isInWishlist,
      items,
    };

    // Emit live cross-device update to user's web and mobile apps
    this.trackingGateway.emitWishlistUpdated(userId, items);

    return result;
  }

  async clearWishlist(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { $set: { wishlist: [] } });
    this.trackingGateway.emitWishlistUpdated(userId, []);
    return { items: [] };
  }

  // ── Aadhaar Verification & Referral Income ──────────────────────────
  async verifyAadhaar(
    userId: string,
    dto: {
      aadhaarNumber?: string;
      fullNameAsPerAadhaar?: string;
      customer_image_aadhar_front?: string;
      customer_image_aadhar_back?: string;
      aadhaarFrontImage?: string;
      aadhaarBackImage?: string;
      bankName?: string;
      branchName?: string;
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      upiId?: string;
      passbookImage?: string;
      bankProofImage?: string;
      cancelledChequeImage?: string;
      bankProofUrl?: string;
    },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const cleanAadhaar = (dto.aadhaarNumber || '').replace(/\D/g, '');
    if (dto.aadhaarNumber && cleanAadhaar.length !== 12) {
      throw new BadRequestException('Please provide a valid 12-digit Aadhaar number');
    }

    if (cleanAadhaar) {
      user.aadhaarNumber = cleanAadhaar;
      (user as any).customer_aadhar_no = cleanAadhaar;
    }

    if (dto.fullNameAsPerAadhaar && dto.fullNameAsPerAadhaar.trim()) {
      user.fullNameAsPerAadhaar = dto.fullNameAsPerAadhaar.trim();
    }

    if (dto.customer_image_aadhar_front || dto.aadhaarFrontImage) {
      const front = sanitizePublicDocUrl(dto.customer_image_aadhar_front || dto.aadhaarFrontImage);
      user.customer_image_aadhar_front = front;
      user.aadharFrontImage = front;
    }
    if (dto.customer_image_aadhar_back || dto.aadhaarBackImage) {
      const back = sanitizePublicDocUrl(dto.customer_image_aadhar_back || dto.aadhaarBackImage);
      user.customer_image_aadhar_back = back;
      user.aadharBackImage = back;
    }

    // Save Bank Details
    if (dto.bankName) user.bankName = dto.bankName.trim();
    if (dto.branchName) user.branchName = dto.branchName.trim();
    if (dto.accountHolderName) user.accountHolderName = dto.accountHolderName.trim();
    if (dto.accountNumber) {
      user.accountNumber = dto.accountNumber.trim();
      (user as any).bankAccountNo = dto.accountNumber.trim();
    }
    if (dto.ifscCode) user.ifscCode = dto.ifscCode.trim().toUpperCase();
    if (dto.upiId) user.upiId = dto.upiId.trim();

    const bankProof =
      dto.bankProofImage ||
      dto.passbookImage ||
      dto.cancelledChequeImage ||
      dto.bankProofUrl ||
      (dto as any).customer_image_bank;
    if (bankProof) {
      user.passbookImage = bankProof;
      user.bankProofImage = bankProof;
      user.cancelledChequeImage = bankProof;
      (user as any).customer_image_bank = bankProof;
    }

    // Submit for Real Admin Review (Pending state)
    user.aadhaarVerified = false;
    user.verificationStatus = 'PENDING';
    user.customerIsVerify = 2; // 2 = NO
    user.customerKycStatus = 1; // 1 = PENDING
    user.kycStatus = 'Pending';
    user.kycSubmittedAt = new Date();

    await user.save();

    // Live update app that verification is now pending admin approval
    this.trackingGateway.emitWalletUpdated(userId, {
      verificationStatus: 'PENDING',
      aadhaarVerified: false,
      customerKycStatus: 1,
      customerIsVerify: 2,
      fullNameAsPerAadhaar: user.fullNameAsPerAadhaar,
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      ifscCode: user.ifscCode,
    });

    if (this.notificationService) {
      this.notificationService.create({
        recipientType: 'ADMIN',
        recipientId: 'admin',
        role: 'ADMIN',
        type: 'CUSTOMER_KYC_REQUEST',
        title: '👤 New Customer KYC Submitted',
        message: `${user.name || 'A customer'} submitted KYC & bank details for verification.`,
        entityType: 'CUSTOMER_KYC',
        entityId: String(user._id),
        actionType: 'CUSTOMER_APPROVAL',
        dedupeKey: `CUSTOMER_KYC_SUBMITTED:${String(user._id)}:${user.kycSubmittedAt ? new Date(user.kycSubmittedAt).getTime() : Date.now()}`,
        metadata: { userId: String(user._id), userName: user.name, phone: user.phone },
      }).catch(err => console.warn(`Failed creating admin KYC notification: ${err.message}`));
    }

    return {
      success: true,
      message: 'KYC & Bank details submitted successfully. Account is pending admin verification.',
      user: {
        id: user._id.toString(),
        name: user.name,
        verificationStatus: 'PENDING',
        customerKycStatus: 1,
        customerIsVerify: 2,
        aadhaarVerified: false,
        fullNameAsPerAadhaar: user.fullNameAsPerAadhaar,
        aadhaarNumber: user.aadhaarNumber,
        customer_image_aadhar_front: user.customer_image_aadhar_front,
        customer_image_aadhar_back: user.customer_image_aadhar_back,
        bankName: user.bankName,
        accountNumber: user.accountNumber,
        ifscCode: user.ifscCode,
        accountHolderName: user.accountHolderName,
        upiId: user.upiId,
        passbookImage: user.passbookImage,
        bankProofImage: user.bankProofImage,
        shoppingCoins: user.shoppingCoins,
        availableIncome: user.availableIncome,
        pendingIncome: user.pendingIncome,
      },
    };
  }

  // ── Customer Income Withdrawal (Min ₹600, 20% TDS, 80% Net Payout) ──
  async withdrawIncome(userId: string, amount: number, bankDetails?: any) {
    await this.settleUserPendingIncome(userId);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const withdrawAmt = Number(amount);
    if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
      throw new BadRequestException('Please provide a valid withdrawal amount');
    }

    // Rule: Minimum withdrawal ₹600
    if (withdrawAmt < 600) {
      throw new BadRequestException('Minimum withdrawal amount is ₹600 as per policy');
    }

    // Rule: Must have sufficient availableIncome
    if ((user.availableIncome || 0) < withdrawAmt) {
      throw new BadRequestException(`Insufficient available income balance (Available: ₹${user.availableIncome || 0})`);
    }

    // Rule: 20% TDS deduction
    const tdsDeduction = Number((withdrawAmt * 0.20).toFixed(2));
    const netPayout = Number((withdrawAmt - tdsDeduction).toFixed(2));

    user.availableIncome = Number(((user.availableIncome || 0) - withdrawAmt).toFixed(2));
    user.walletBalance = Math.max(0, Number(((user.walletBalance || 0) - withdrawAmt).toFixed(2)));
    await user.save();

    await this.incomeTxModel.create({
      userId: user._id,
      type: 'WITHDRAWAL',
      amount: -withdrawAmt,
      earnedAt: new Date(),
      availableFrom: new Date(),
      isUsable: false,
      status: 'AVAILABLE',
      description: `Income Withdrawal of ₹${withdrawAmt} (TDS 20%: -₹${tdsDeduction}, Net Payout: ₹${netPayout})`,
    });

    this.trackingGateway.emitWalletUpdated(userId, {
      availableIncome: user.availableIncome,
      pendingIncome: user.pendingIncome,
      walletBalance: user.walletBalance,
    });

    return {
      success: true,
      message: `Withdrawal request submitted! ₹${netPayout} will be credited after 20% TDS (-₹${tdsDeduction}).`,
      data: {
        requestedAmount: withdrawAmt,
        tdsDeducted: tdsDeduction,
        netPayout,
        availableIncome: user.availableIncome,
      },
    };
  }

  async getDashboardBanner(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      return {
        bannerType: 'WARNING',
        kycStatus: 0,
        title: 'Complete KYC · Unlock ₹20 Bonus',
        subtitle: 'Verify Aadhaar in 2 minutes',
        ctaText: 'Verify Now',
        ctaAction: 'OPEN_KYC',
        icon: 'alert-circle',
        backgroundColor: '#FEF3C7',
        borderColor: '#FCD34D',
        textColor: '#B45309',
        isDismissible: false,
      };
    }

    const kycStatus = user.customerKycStatus ?? (user.aadhaarVerified ? 2 : (user.verificationStatus === 'PENDING' ? 1 : 0));
    const isVerified = user.customerIsVerify === 1 || user.aadhaarVerified || kycStatus === 2;

    if (isVerified) {
      return {
        bannerType: 'SUCCESS',
        kycStatus: 2,
        title: 'KYC Verified · Income Unlocked',
        subtitle: user.sponsorCode && user.sponsorCode !== 'WORMUP001' ? '₹20 bonus credited to sponsor' : 'All income features unlocked',
        ctaText: 'View Wallet',
        ctaAction: 'VIEW_WALLET',
        icon: 'check-circle',
        backgroundColor: '#DCFCE7',
        borderColor: '#86EFAC',
        textColor: '#166534',
        isDismissible: true,
        autoHideAfterDays: 3,
        approvedAt: user.verifiedAt,
      };
    }

    if (kycStatus === 1 || user.verificationStatus === 'PENDING') {
      return {
        bannerType: 'INFO',
        kycStatus: 1,
        title: 'KYC Under Review',
        subtitle: 'Verification in 24 hours',
        ctaText: 'View Status',
        ctaAction: 'VIEW_STATUS',
        icon: 'clock',
        backgroundColor: '#DBEAFE',
        borderColor: '#93C5FD',
        textColor: '#1E40AF',
        isDismissible: false,
      };
    }

    if (kycStatus === 3 || user.verificationStatus === 'REJECTED') {
      return {
        bannerType: 'ERROR',
        kycStatus: 3,
        title: 'KYC Rejected · Resubmit',
        subtitle: `Reason: ${user.kycRejectReason || (user as any).customerAadharRejectionReason || 'Document not clear'}`,
        ctaText: 'Resubmit',
        ctaAction: 'RESUBMIT',
        icon: 'x-circle',
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
        textColor: '#991B1B',
        isDismissible: false,
      };
    }

    // Default: Not submitted
    return {
      bannerType: 'WARNING',
      kycStatus: 0,
      title: 'Complete KYC · Unlock ₹20 Bonus',
      subtitle: 'Verify Aadhaar in 2 minutes',
      ctaText: 'Verify Now',
      ctaAction: 'OPEN_KYC',
      icon: 'alert-circle',
      backgroundColor: '#FEF3C7',
      borderColor: '#FCD34D',
      textColor: '#B45309',
      isDismissible: false,
    };
  }

  async getWalletSummary(userId: string) {
    await this.settleUserPendingIncome(userId);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const transactions = await this.incomeTxModel
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    return {
      shoppingCoins: user.shoppingCoins ?? 2000,
      pendingIncome: user.pendingIncome ?? 0,
      availableIncome: user.availableIncome ?? 0,
      appDownloadIncome: user.appDownloadIncome ?? 0,
      verificationStatus: user.verificationStatus ?? 'NON_VERIFIED',
      aadhaarVerified: !!user.aadhaarVerified,
      fullNameAsPerAadhaar: user.fullNameAsPerAadhaar,
      sponsorCode: user.sponsorCode,
      referralCode: user.referralCode,
      verifiedReferralsCount: user.verifiedReferralsCount ?? 0,
      monthlyPurchaseValue: user.monthlyPurchaseValue ?? 0,
      isActiveMember: !!user.isActiveMember,
      direct5ActiveCount: user.direct5ActiveCount ?? 0,
      teamSize: user.teamSize ?? 0,
      recentTransactions: transactions,
    };
  }

  // ── Customer Income History with Breakdown ──
  async getIncomeHistory(userId: string, page = 1, limit = 50) {
    await this.settleUserPendingIncome(userId);
    const uId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const user = await this.userModel.findById(uId).select('availableIncome pendingIncome walletBalance name');
    if (!user) throw new NotFoundException('User not found');

    const [transactions, total] = await Promise.all([
      this.incomeTxModel
        .find({ userId: uId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sourceUserId', 'name fullNameAsPerAadhaar phone')
        .lean(),
      this.incomeTxModel.countDocuments({ userId: uId }),
    ]);

    // Compute verified ledger breakdown for available (unlocked) amounts
    const availableTxs = await this.incomeTxModel.find({ userId: uId, status: 'AVAILABLE' }).lean();
    let downloadIncomeTotal = 0;
    let monthlyTeamIncomeTotal = 0;
    let otherIncomeTotal = 0;
    let withdrawalTotal = 0;

    for (const tx of availableTxs) {
      if (tx.type === 'APP_DOWNLOAD' || tx.type === 'REFERRAL') {
        downloadIncomeTotal += tx.amount || 0;
      } else if (tx.type === 'TEAM_PURCHASE') {
        monthlyTeamIncomeTotal += tx.amount || 0;
      } else if (tx.type === 'WITHDRAWAL') {
        withdrawalTotal += Math.abs(tx.amount || 0);
      } else {
        otherIncomeTotal += tx.amount || 0;
      }
    }

    return {
      availableBalance: user.availableIncome || 0,
      pendingBalance: user.pendingIncome || 0,
      walletBalance: user.walletBalance || 0,
      breakdown: {
        downloadIncome: Number(downloadIncomeTotal.toFixed(2)),
        monthlyTeamIncome: Number(monthlyTeamIncomeTotal.toFixed(2)),
        withdrawals: Number(withdrawalTotal.toFixed(2)),
        otherIncome: Number(otherIncomeTotal.toFixed(2)),
        netAvailable: Number((user.availableIncome || 0).toFixed(2)),
      },
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description,
        availableFrom: t.availableFrom,
        earnedAt: t.earnedAt || (t as any).createdAt,
        createdAt: (t as any).createdAt,
        sourceUser: (t as any).sourceUserId ? {
          name: (t as any).sourceUserId.fullNameAsPerAadhaar || (t as any).sourceUserId.name,
        } : undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Record Customer Purchase (Vegetable vs Other) for Team GMV ──
  async recordPurchase(userId: string, amount: number, isVegetable: boolean) {
    const user = await this.userModel.findById(userId);
    if (!user) return;

    const purchaseAmt = Number(amount) || 0;
    if (purchaseAmt <= 0) return;

    user.monthlyPurchaseValue = Number(((user.monthlyPurchaseValue || 0) + purchaseAmt).toFixed(2));
    if (isVegetable) {
      user.monthlyVegetablePurchase = Number(((user.monthlyVegetablePurchase || 0) + purchaseAmt).toFixed(2));
    } else {
      user.monthlyOtherPurchase = Number(((user.monthlyOtherPurchase || 0) + purchaseAmt).toFixed(2));
    }

    const wasActive = user.isActiveMember;
    if (user.monthlyPurchaseValue >= 2000) {
      user.isActiveMember = true;
    }

    await user.save();

    // If member just became active, update their direct sponsor's direct5ActiveCount
    if (!wasActive && user.isActiveMember) {
      const sponsorId = user.referredBy || (user.isCompanySponsored ? null : user.sponsorId);
      if (sponsorId) {
        const directActiveCount = await this.userModel.countDocuments({
          $or: [{ referredBy: sponsorId }, { sponsorId: sponsorId }],
          isActiveMember: true,
        });
        await this.userModel.findByIdAndUpdate(sponsorId, {
          direct5ActiveCount: directActiveCount,
        });
      }
    }
  }

  // ── Helper: Fetch 7 Levels Downline Tree ──
  private async get7LevelDownline(rootUserId: Types.ObjectId): Promise<Array<UserDocument[]>> {
    const levels: Array<UserDocument[]> = [];
    let currentLevelParentIds = [rootUserId];

    for (let level = 1; level <= 7; level++) {
      if (currentLevelParentIds.length === 0) {
        levels.push([]);
        continue;
      }

      const downlineMembers = await this.userModel.find({
        $or: [
          { referredBy: { $in: currentLevelParentIds } },
          { sponsorId: { $in: currentLevelParentIds }, isCompanySponsored: false },
        ],
      }).exec();

      levels.push(downlineMembers);
      currentLevelParentIds = downlineMembers.map((m) => m._id);
    }

    return levels;
  }

  // ── Team Performance & 7-Level Income Dashboard ──
  async getTeamDashboard(userId: string) {
    await this.settleUserPendingIncome(userId);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const downlineLevels = await this.get7LevelDownline(user._id);

    let totalTeamSize = 0;
    let totalVegetableGMV = 0;
    let totalOtherGMV = 0;

    const levelBreakdown = downlineLevels.map((members, index) => {
      const levelNum = index + 1;
      const memberCount = members.length;
      const activeMemberCount = members.filter((m) => (m.monthlyPurchaseValue || 0) >= 2000).length;
      const vegetableGMV = Number(members.reduce((sum, m) => sum + (m.monthlyVegetablePurchase || 0), 0).toFixed(2));
      const otherGMV = Number(members.reduce((sum, m) => sum + (m.monthlyOtherPurchase || 0), 0).toFixed(2));
      const incomeEarned = Number(((vegetableGMV * 0.03) + (otherGMV * 0.004)).toFixed(2));

      totalTeamSize += memberCount;
      totalVegetableGMV += vegetableGMV;
      totalOtherGMV += otherGMV;

      const detailedMembers = members.map((m) => {
        const veg = Number((m.monthlyVegetablePurchase || 0).toFixed(2));
        const other = Number((m.monthlyOtherPurchase || 0).toFixed(2));
        const mIncome = Number(((veg * 0.03) + (other * 0.004)).toFixed(2));
        const isActive = (m.monthlyPurchaseValue || 0) >= 2000;
        const memberCode = m.referralCode || m.sponsorCode || (m.phone ? `WORM${m.phone.slice(-4)}` : `WORM${m._id.toString().slice(-4).toUpperCase()}`);
        return {
          id: m._id.toString(),
          name: m.fullNameAsPerAadhaar || m.name || 'WormUp Member',
          phone: m.phone ? `${m.phone.slice(0, 3)}****${m.phone.slice(-3)}` : undefined,
          memberCode,
          isActive,
          monthlyPurchaseValue: Number((m.monthlyPurchaseValue || 0).toFixed(2)),
          vegetableGMV: veg,
          otherGMV: other,
          incomeEarned: mIncome,
        };
      });

      return {
        level: levelNum,
        memberCount,
        activeMemberCount,
        vegetableGMV,
        otherGMV,
        incomeEarned,
        members: detailedMembers,
      };
    });

    const vegetableIncome = Number((totalVegetableGMV * 0.03).toFixed(2));
    const otherIncome = Number((totalOtherGMV * 0.004).toFixed(2));
    const totalPotentialIncome = Number((vegetableIncome + otherIncome).toFixed(2));

    const personalPurchase = Number((user.monthlyPurchaseValue || 0).toFixed(2));
    const isPersonalActive = personalPurchase >= 2000;
    const direct5ActiveCount = levelBreakdown[0]?.activeMemberCount || 0;
    const isEligible = isPersonalActive && direct5ActiveCount >= 5;

    // Cache updated team size on user doc
    if (user.teamSize !== totalTeamSize || user.direct5ActiveCount !== direct5ActiveCount) {
      user.teamSize = totalTeamSize;
      user.direct5ActiveCount = direct5ActiveCount;
      await user.save();
    }

    const recentStatements = await this.teamIncomeModel
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .exec();

    const earnedIncome = isEligible ? totalPotentialIncome : 0;
    const lockedIncome = isEligible ? 0 : totalPotentialIncome;

    return {
      personalStatus: {
        monthlyPurchaseValue: personalPurchase,
        requiredPurchase: 2000,
        isPersonalActive,
        direct5ActiveCount,
        requiredDirectActive: 5,
        isEligibleForTeamIncome: isEligible,
      },
      teamSummary: {
        isEligible,
        earnedIncome,
        lockedIncome,
        totalTeamSize,
        totalVegetableGMV: Number(totalVegetableGMV.toFixed(2)),
        totalOtherGMV: Number(totalOtherGMV.toFixed(2)),
        vegetableIncomeRate: '3%',
        vegetableIncome,
        otherIncomeRate: '0.4%',
        otherIncome,
        totalPotentialIncome,
      },
      levelBreakdown,
      recentStatements,
    };
  }

  // ── Month-End Team Purchase Income Calculation Engine (Cron / Admin) ──
  async calculateMonthlyTeamPurchaseIncome(targetMonth?: string) {
    const now = new Date();
    const month = targetMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextMidnight = this.getNextMidnight();

    // Query all users with at least 1 direct referral
    const candidates = await this.userModel.find({
      $or: [
        { directReferrals: { $exists: true, $not: { $size: 0 } } },
        { referredUsersCount: { $gt: 0 } },
      ],
      isActive: true,
    }).exec();

    const results: any[] = [];

    for (const user of candidates) {
      const dashboard = await this.getTeamDashboard(user._id.toString());
      const { personalStatus, teamSummary, levelBreakdown } = dashboard;

      const isEligible = personalStatus.isEligibleForTeamIncome && teamSummary.totalPotentialIncome > 0;
      const totalIncome = isEligible ? teamSummary.totalPotentialIncome : 0;

      // Upsert TeamPurchaseIncome record
      const record = await this.teamIncomeModel.findOneAndUpdate(
        { userId: user._id, month },
        {
          userId: user._id,
          month,
          teamSize: teamSummary.totalTeamSize,
          personalPurchaseValue: personalStatus.monthlyPurchaseValue,
          direct5ActiveCount: personalStatus.direct5ActiveCount,
          isEligible,
          vegetablePurchaseValue: teamSummary.totalVegetableGMV,
          otherPurchaseValue: teamSummary.totalOtherGMV,
          vegetableIncome: isEligible ? teamSummary.vegetableIncome : 0,
          otherIncome: isEligible ? teamSummary.otherIncome : 0,
          totalIncome,
          levelBreakdown,
          status: isEligible ? 'PENDING' : 'LAPSED',
          calculatedAt: new Date(),
          availableFrom: nextMidnight,
        },
        { upsert: true, new: true },
      );

      // If eligible and has income, credit to pendingIncome with 24-hr lock (idempotent per month)
      if (isEligible && totalIncome > 0) {
        const existingTx = await this.incomeTxModel.findOne({
          userId: user._id,
          type: 'TEAM_PURCHASE',
          description: { $regex: `for ${month}` },
        });

        if (existingTx) {
          console.log(`[TeamIncome] Skipping user ${user._id} (${user.name}): Already settled for ${month}.`);
        } else {
          user.pendingIncome = Number(((user.pendingIncome || 0) + totalIncome).toFixed(2));
          user.lastIncomeCreditedAt = new Date();
          await user.save();

          await this.incomeTxModel.create({
            userId: user._id,
            type: 'TEAM_PURCHASE',
            amount: totalIncome,
            earnedAt: new Date(),
            availableFrom: nextMidnight,
            isUsable: false,
            status: 'PENDING',
            description: `Team Purchase Income for ${month} (Veg 3%: ₹${teamSummary.vegetableIncome}, Other 0.4%: ₹${teamSummary.otherIncome})`,
          });

          this.trackingGateway.emitWalletUpdated(user._id.toString(), {
            pendingIncome: user.pendingIncome,
            availableIncome: user.availableIncome,
            walletBalance: user.walletBalance,
          });
        }
      }

      results.push({
        userId: user._id.toString(),
        name: user.name,
        isEligible,
        totalIncome,
      });
    }

    return {
      success: true,
      month,
      processedUsersCount: results.length,
      eligibleUsersCount: results.filter((r) => r.isEligible).length,
      totalIncomeDistributed: Number(results.reduce((s, r) => s + r.totalIncome, 0).toFixed(2)),
      results,
    };
  }

  // ── Admin Customer & KYC Management Methods ──
  async adminGetCustomers(query?: { search?: string; kycStatus?: number; isBlocked?: number; page?: number; limit?: number }) {
    const filter: any = {};
    if (query?.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { referralCode: regex },
        { customerCode: regex },
        { customerCodeNumber: regex },
        { aadhaarNumber: regex },
      ];
    }
    if (query?.kycStatus !== undefined && !isNaN(query.kycStatus)) {
      filter.customerKycStatus = Number(query.kycStatus);
    }
    if (query?.isBlocked !== undefined && !isNaN(query.isBlocked)) {
      filter.isBlocked = Number(query.isBlocked);
    }

    const page = Math.max(1, Number(query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      success: true,
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminGetCustomerById(id: string): Promise<any> {
    const customer: any = await this.userModel.findById(id).lean().exec();
    if (!customer) throw new NotFoundException('Customer not found');

    // Get sponsor info
    let sponsor = null;
    if (customer.sponsorId) {
      sponsor = await this.userModel.findById(customer.sponsorId).select('name phone referralCode customerCode').lean().exec();
    }

    // Get downline counts
    const downlineLevels = await this.get7LevelDownline(customer._id);
    const teamSize = downlineLevels.reduce((acc, lvl) => acc + lvl.length, 0);

    return {
      success: true,
      data: {
        ...customer,
        sponsor,
        downlineSummary: {
          totalTeamSize: teamSize,
          level1Count: downlineLevels[0]?.length || 0,
          level2Count: downlineLevels[1]?.length || 0,
          level3Count: downlineLevels[2]?.length || 0,
          level4Count: downlineLevels[3]?.length || 0,
          level5Count: downlineLevels[4]?.length || 0,
          level6Count: downlineLevels[5]?.length || 0,
          level7Count: downlineLevels[6]?.length || 0,
        },
      },
    };
  }

  async distributeKycRewards(user: any) {
    const TIERS = [
      { level: 1, appIncome: 20, coinIncome: 400 },
      { level: 2, appIncome: 10, coinIncome: 400 },
      { level: 3, appIncome: 5,  coinIncome: 300 },
    ];

    let currentSponsorId: Types.ObjectId | undefined = user.referredBy || (user.isCompanySponsored ? undefined : user.sponsorId);

    for (const tier of TIERS) {
      if (!currentSponsorId) break;

      const sponsor = await this.userModel.findById(currentSponsorId);
      if (!sponsor || sponsor.isCompanyAccount) break;

      // Business Rule: ONLY VERIFIED members receive App Download Income & Coin Income
      const isVerifiedSponsor = sponsor.verificationStatus === 'VERIFIED' && sponsor.aadhaarVerified;

      if (isVerifiedSponsor) {
        // 1. App Download Income (To pendingIncome, locked until midnight/24h)
        await this.incomeTxModel.create({
          userId: sponsor._id,
          type: 'APP_DOWNLOAD',
          amount: tier.appIncome,
          sourceUserId: user._id,
          sourceVerificationStatus: 'VERIFIED',
          earnedAt: new Date(),
          availableFrom: this.getNextMidnight(),
          status: 'PENDING',
          description: `Level ${tier.level} App Download Income from verified referral: ${user.fullNameAsPerAadhaar || user.name}`,
        });

        sponsor.pendingIncome = (sponsor.pendingIncome || 0) + tier.appIncome;
        sponsor.appDownloadIncome = (sponsor.appDownloadIncome || 0) + tier.appIncome;
        if (tier.level === 1) {
          sponsor.verifiedReferralsCount = (sponsor.verifiedReferralsCount || 0) + 1;
        }

        // 2. Shopping Coin Income (One-time tier coins credited directly to shoppingCoins)
        if (tier.coinIncome > 0) {
          const coinBefore = sponsor.shoppingCoins || 0;
          sponsor.shoppingCoins = coinBefore + tier.coinIncome;

          await this.coinTxModel.create({
            userId: sponsor._id,
            type: 'EARN',
            coins: tier.coinIncome,
            balanceBefore: coinBefore,
            balanceAfter: sponsor.shoppingCoins,
            referenceType: 'TIER_COIN_INCOME',
            description: `Level ${tier.level} Referral Shopping Coins Bonus from ${user.fullNameAsPerAadhaar || user.name}`,
          });
        }

        await sponsor.save();

        this.trackingGateway.emitWalletUpdated(sponsor._id.toString(), {
          pendingIncome: sponsor.pendingIncome,
          availableIncome: sponsor.availableIncome,
          appDownloadIncome: sponsor.appDownloadIncome,
          shoppingCoins: sponsor.shoppingCoins,
          verifiedReferralsCount: sponsor.verifiedReferralsCount,
        });
      }

      currentSponsorId = sponsor.referredBy || (sponsor.isCompanySponsored ? undefined : sponsor.sponsorId);
    }
  }

  async adminGetPendingCustomerKyc(filter?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const query: any = {
      $or: [
        { customerKycStatus: 1 },
        { customerIsVerify: 2 },
        { verificationStatus: 'NON_VERIFIED' },
      ],
    };

    if (filter?.search) {
      query.$and = [
        {
          $or: [
            { name: { $regex: filter.search, $options: 'i' } },
            { customer_first_name: { $regex: filter.search, $options: 'i' } },
            { customer_surname: { $regex: filter.search, $options: 'i' } },
            { phone: { $regex: filter.search, $options: 'i' } },
            { referralCode: { $regex: filter.search, $options: 'i' } },
            { customer_code: { $regex: filter.search, $options: 'i' } },
          ],
        },
      ];
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.userModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adminGetCustomerKycReview(id: string): Promise<any> {
    const customer = (await this.userModel.findById(id).lean()) as any;
    if (!customer) throw new NotFoundException('Customer not found');

    let sponsor: any = null;
    const sponsorRef = customer.referredBy || customer.sponsorId;
    if (sponsorRef) {
      sponsor = await this.userModel.findById(sponsorRef, 'name customer_first_name customer_surname phone referralCode sponsorCode customer_code').lean();
    }

    const rawAadhaar = customer.aadhaarNumber || customer.customer_aadhar_no || '';
    const maskedAadhaar = rawAadhaar.length >= 4 
      ? `XXXX XXXX ${rawAadhaar.slice(-4)}` 
      : (rawAadhaar ? 'XXXX XXXX XXXX' : 'Not Provided');

    const rawBankAcc = customer.bankAccountNo || customer.account_number || '';
    const maskedAccount = rawBankAcc.length >= 4
      ? `XXXX XXXX ${rawBankAcc.slice(-4)}`
      : (rawBankAcc ? 'XXXX XXXX' : 'Not Provided');

    // sanitizePublicDocUrl used from file scope

    return {
      success: true,
      data: {
        ...customer,
        maskedAadhaar,
        maskedAccount,
        sponsor,
        documents: {
          frontImage: sanitizePublicDocUrl(customer.customer_image_aadhar_front || customer.aadharFrontImage || ''),
          backImage: sanitizePublicDocUrl(customer.customer_image_aadhar_back || customer.aadharBackImage || ''),
        },
      },
    };
  }

  async adminApproveCustomerKyc(id: string) {
    const customer = await this.userModel.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');

    const wasAlreadyVerified = customer.customerKycStatus === 2 && customer.aadhaarVerified;

    customer.customerKycStatus = 2; // Confirmed
    customer.customerIsVerify = 1; // Yes
    customer.aadhaarVerified = true;
    customer.verificationStatus = 'VERIFIED';
    customer.kycStatus = 'Verified';
    customer.kycRejectReason = '';
    customer.verifiedAt = new Date();
    await customer.save();

    if (!wasAlreadyVerified) {
      await this.distributeKycRewards(customer);
    }

    this.trackingGateway.emitWalletUpdated(customer._id.toString(), {
      verificationStatus: 'VERIFIED',
      aadhaarVerified: true,
      customerKycStatus: 2,
      customerIsVerify: 1,
    });

    this.trackingGateway.emitCustomerKycApproved(customer._id.toString(), {
      message: 'KYC approved! Income features unlocked.',
      customerKycStatus: 2,
      customerIsVerify: 1,
      verifiedAt: customer.verifiedAt,
    });

    return {
      success: true,
      message: 'Customer KYC approved successfully, verification unlocked, and sponsor rewards credited',
      data: customer,
    };
  }

  async adminRejectCustomerKyc(id: string, reason?: string) {
    const customer = await this.userModel.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');

    customer.customerKycStatus = 3; // Rejected
    customer.customerIsVerify = 2; // No
    customer.aadhaarVerified = false;
    customer.verificationStatus = 'NON_VERIFIED';
    customer.kycStatus = 'Rejected';
    customer.kycRejectReason = reason || 'Aadhaar image not clear';
    await customer.save();

    this.trackingGateway.emitWalletUpdated(customer._id.toString(), {
      verificationStatus: 'NON_VERIFIED',
      aadhaarVerified: false,
      customerKycStatus: 3,
      customerIsVerify: 2,
    });

    this.trackingGateway.emitKycRejected('user', customer._id.toString(), {
      reason: customer.kycRejectReason,
      customerKycStatus: 3,
      message: `KYC rejected: ${customer.kycRejectReason}`,
    });

    return {
      success: true,
      message: `Customer KYC rejected: ${customer.kycRejectReason}`,
      data: customer,
    };
  }

  async adminBlockCustomer(id: string, isBlocked: number, reason?: string) {
    const customer = await this.userModel.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');

    customer.isBlocked = Number(isBlocked);
    if (reason) customer.blockReason = reason;
    await customer.save();

    return {
      success: true,
      message: `Customer ${isBlocked ? 'Blocked' : 'Unblocked'} successfully`,
      isBlocked: customer.isBlocked,
    };
  }

  async adminSuspendCustomer(id: string, isSuspended: number) {
    const customer = await this.userModel.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');

    customer.isSuspended = Number(isSuspended);
    await customer.save();

    return {
      success: true,
      message: `Customer ${isSuspended ? 'Suspended' : 'Unsuspended'} successfully`,
      isSuspended: customer.isSuspended,
    };
  }

  async adminUpdateCustomerPaymentStatus(id: string, status: number) {
    const customer = await this.userModel.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');

    customer.customerPaymentStatus = Number(status);
    await customer.save();

    return {
      success: true,
      message: `Customer payment status set to ${status === 1 ? 'Enabled' : 'Disabled'}`,
      customerPaymentStatus: customer.customerPaymentStatus,
    };
  }

  async adminCreditCustomerCoins(id: string, coins = 2000) {
    const customer = await this.userModel.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');

    customer.shoppingCoins = (customer.shoppingCoins || 0) + coins;
    customer.lastMonthlyCoinCredit = new Date();
    customer.monthlyCreditStatus = 1;
    await customer.save();

    return {
      success: true,
      message: `Credited ${coins} Shopping Coins to ${customer.name}`,
      shoppingCoins: customer.shoppingCoins,
    };
  }

  async adminGetSponsorTree(id: string) {
    const customer = await this.userModel.findById(id).lean().exec();
    if (!customer) throw new NotFoundException('Customer not found');

    const downlineLevels = await this.get7LevelDownline(customer._id);
    return {
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        referralCode: customer.referralCode,
        sponsorCode: customer.sponsorCode,
        sponsorName: customer.sponsorName,
      },
      levels: downlineLevels.map((lvl, idx) => ({
        level: idx + 1,
        count: lvl.length,
        members: lvl.map((m) => ({
          id: m._id,
          name: m.name,
          phone: m.phone,
          referralCode: m.referralCode,
          monthlyPurchaseValue: m.monthlyPurchaseValue || 0,
          isActiveMember: (m.monthlyPurchaseValue || 0) >= 2000,
          verificationStatus: m.verificationStatus,
        })),
      })),
    };
  }

  async adminGetCustomerKyc(id: string): Promise<any> {
    const customer = (await this.userModel.findById(id).lean()) as any;
    if (!customer) throw new NotFoundException('Customer not found');

    const rawAadhaar = customer.aadhaarNumber || customer.customer_aadhar_no || '';
    const maskedAadhaar = rawAadhaar.length >= 4
      ? `XXXX XXXX ${rawAadhaar.slice(-4)}`
      : (rawAadhaar ? 'XXXX XXXX XXXX' : 'XXXX XXXX 1234');

    const rawBankAcc = customer.accountNumber || customer.bankAccountNo || '';
    const maskedAccount = rawBankAcc.length >= 4
      ? `XXXX ${rawBankAcc.slice(-4)}`
      : (rawBankAcc ? 'XXXX XXXX' : 'XXXX 9182');

    const kycStatusNum = customer.customerKycStatus || (customer.verificationStatus === 'VERIFIED' ? 2 : 1);
    const statusLabel = kycStatusNum === 2 ? 'Verified' : (kycStatusNum === 3 ? 'Rejected' : 'Pending');

    const aadhaarFrontUrl = sanitizePublicDocUrl(customer.customer_image_aadhar_front || customer.aadharFrontImage || '');
    const aadhaarBackUrl = sanitizePublicDocUrl(customer.customer_image_aadhar_back || customer.aadharBackImage || '');

    return {
      success: true,
      data: {
        kycStatus: kycStatusNum,
        statusLabel,
        submittedAt: customer.updatedAt || customer.createdAt || new Date().toISOString(),
        aadhaarNumber: maskedAadhaar,
        rawAadhaarNumber: rawAadhaar,
        aadhaarFrontUrl,
        aadhaarBackUrl,
        bankDetails: {
          bankName: customer.bankName || '',
          branchName: customer.branchName || '',
          accountHolderName: customer.accountHolderName || customer.name || '',
          accountNumber: maskedAccount,
          rawAccountNumber: rawBankAcc,
          ifscCode: customer.ifscCode || '',
          upiId: customer.upiId || '',
        },
        personalInfo: {
          firstName: customer.firstName || (customer.name ? customer.name.split(' ')[0] : ''),
          surname: customer.surname || (customer.name ? customer.name.split(' ').slice(1).join(' ') : ''),
          fatherHusbandName: customer.fatherHusbandName || '',
          gender: customer.gender || 'Not Specified',
          birthdate: customer.birthDate || customer.birthday || '',
        },
        address: customer.address || '',
        landmark: customer.landmark || '',
        village: customer.village || '',
        pincode: customer.customerPincode || customer.registrationPincode || '',
        adminNotes: customer.adminNotes || '',
        kycRejectReason: customer.kycRejectReason || '',
      },
    };
  }

  async adminUpdateCustomer(id: string, updateDto: any): Promise<any> {
    const customer = await this.userModel.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');

    if (updateDto.firstName !== undefined) customer.firstName = updateDto.firstName;
    if (updateDto.surname !== undefined) customer.surname = updateDto.surname;
    if (updateDto.fatherHusbandName !== undefined) customer.fatherHusbandName = updateDto.fatherHusbandName;
    if (updateDto.gender !== undefined) customer.gender = updateDto.gender;
    if (updateDto.birthdate !== undefined || updateDto.birthDate !== undefined) {
      customer.birthDate = updateDto.birthdate || updateDto.birthDate;
    }

    if (customer.firstName || customer.surname) {
      customer.name = `${customer.firstName || ''} ${customer.surname || ''}`.trim() || customer.name;
    } else if (updateDto.name) {
      customer.name = updateDto.name;
    }

    if (updateDto.mobile !== undefined || updateDto.phone !== undefined) {
      customer.phone = updateDto.mobile || updateDto.phone;
    }
    if (updateDto.email !== undefined) customer.email = updateDto.email;

    if (updateDto.address !== undefined) customer.address = updateDto.address;
    if (updateDto.landmark !== undefined) customer.landmark = updateDto.landmark;
    if (updateDto.village !== undefined) customer.village = updateDto.village;
    if (updateDto.areaZone !== undefined || updateDto.zoneName !== undefined) {
      customer.preferredCityName = updateDto.areaZone || updateDto.zoneName;
    }
    if (updateDto.pincode !== undefined || updateDto.customerPincode !== undefined) {
      customer.customerPincode = updateDto.pincode || updateDto.customerPincode;
      customer.registrationPincode = customer.customerPincode;
    }

    // Bank Details
    if (updateDto.bankName !== undefined) customer.bankName = updateDto.bankName;
    if (updateDto.branchName !== undefined) customer.branchName = updateDto.branchName;
    if (updateDto.accountHolderName !== undefined) customer.accountHolderName = updateDto.accountHolderName;
    if (updateDto.accountNumber !== undefined) customer.accountNumber = updateDto.accountNumber;
    if (updateDto.ifscCode !== undefined) customer.ifscCode = updateDto.ifscCode;
    if (updateDto.upiId !== undefined) customer.upiId = updateDto.upiId;

    // Status Controls
    if (updateDto.kycStatus !== undefined) {
      const statusNum = Number(updateDto.kycStatus);
      customer.customerKycStatus = statusNum;
      if (statusNum === 2) {
        customer.customerIsVerify = 1;
        customer.aadhaarVerified = true;
        customer.verificationStatus = 'VERIFIED';
      } else if (statusNum === 3) {
        customer.customerIsVerify = 2;
        customer.aadhaarVerified = false;
        customer.verificationStatus = 'NON_VERIFIED';
      } else {
        customer.customerIsVerify = 2;
        customer.verificationStatus = 'NON_VERIFIED';
      }
    }

    if (updateDto.paymentStatus !== undefined) {
      customer.customerPaymentStatus = Number(updateDto.paymentStatus);
    }
    if (updateDto.isBlocked !== undefined) {
      customer.isBlocked = Number(updateDto.isBlocked);
      customer.isActive = customer.isBlocked === 0;
    }
    if (updateDto.isSuspended !== undefined) {
      customer.isSuspended = Number(updateDto.isSuspended);
    }
    if (updateDto.adminNotes !== undefined) {
      customer.adminNotes = updateDto.adminNotes;
    }

    await customer.save();

    this.trackingGateway.emitWalletUpdated(customer._id.toString(), {
      verificationStatus: customer.verificationStatus,
      customerKycStatus: customer.customerKycStatus,
      customerPaymentStatus: customer.customerPaymentStatus,
      isBlocked: customer.isBlocked,
      isSuspended: customer.isSuspended,
    });

    return {
      success: true,
      message: 'Customer profile updated successfully',
      data: customer,
    };
  }

  /**
   * Submit Customer KYC (Aadhaar & Bank Details)
   */
  async submitCustomerKyc(userId: string, payload: any) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const aadharNum =
      payload.aadhaarNumber ||
      payload.aadharNumber ||
      payload.customer_aadhar_no ||
      user.aadhaarNumber ||
      (user as any).aadharNumber;
    if (aadharNum) {
      user.aadhaarNumber = aadharNum;
      (user as any).aadharNumber = aadharNum;
      (user as any).customer_aadhar_no = aadharNum;
    }

    const frontImg =
      payload.aadharFront ||
      payload.aadhaarFront ||
      payload.aadhaarFrontUrl ||
      payload.aadharFrontUrl ||
      payload.aadhaarFrontImage ||
      payload.aadharFrontImage ||
      payload.customer_image_aadhar_front ||
      user.aadharFrontImage ||
      user.customer_image_aadhar_front;
    if (frontImg) {
      const cleanFront = sanitizePublicDocUrl(frontImg);
      user.aadharFrontImage = cleanFront;
      user.customer_image_aadhar_front = cleanFront;
    }

    const backImg =
      payload.aadharBack ||
      payload.aadhaarBack ||
      payload.aadhaarBackUrl ||
      payload.aadharBackUrl ||
      payload.aadhaarBackImage ||
      payload.aadharBackImage ||
      payload.customer_image_aadhar_back ||
      user.aadharBackImage ||
      user.customer_image_aadhar_back;
    if (backImg) {
      const cleanBack = sanitizePublicDocUrl(backImg);
      user.aadharBackImage = cleanBack;
      user.customer_image_aadhar_back = cleanBack;
    }

    if (payload.fullNameAsPerAadhaar) {
      user.fullNameAsPerAadhaar = payload.fullNameAsPerAadhaar.trim();
    }

    if (payload.bankName) user.bankName = payload.bankName;
    if (payload.branchName) user.branchName = payload.branchName;
    if (payload.accountHolderName) user.accountHolderName = payload.accountHolderName;
    if (payload.accountNumber) {
      user.accountNumber = payload.accountNumber;
      (user as any).bankAccountNo = payload.accountNumber;
    }
    if (payload.ifscCode) user.ifscCode = payload.ifscCode;
    if (payload.upiId) user.upiId = payload.upiId;

    const bankProof =
      payload.bankProof ||
      payload.bankProofUrl ||
      payload.bankProofImage ||
      payload.passbookImage ||
      payload.cancelledChequeImage ||
      payload.customer_image_bank ||
      user.passbookImage ||
      user.bankProofImage ||
      user.cancelledChequeImage;
    if (bankProof) {
      user.passbookImage = bankProof;
      user.bankProofImage = bankProof;
      user.cancelledChequeImage = bankProof;
      (user as any).customer_image_bank = bankProof;
    }

    user.customerKycStatus = 1; // Pending
    user.kycStatus = 'Pending';
    user.kycSubmittedAt = new Date();
    user.customerIsVerify = 2; // Pending / Non-verified

    await user.save();

    // Notify admin via WebSocket
    this.trackingGateway.server?.emit('new_customer_kyc', {
      userId: user._id.toString(),
      name: user.name,
      mobile: user.phone,
      submittedAt: user.kycSubmittedAt,
    });

    return {
      success: true,
      message: 'KYC submitted successfully and is pending admin verification',
      data: {
        kycStatus: 1,
        statusLabel: 'Pending',
        submittedAt: user.kycSubmittedAt,
      },
    };
  }

  /**
   * Get Current Customer KYC Status
   */
  async getCustomerKycStatus(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const kycStatusNum =
      user.customerKycStatus !== undefined && user.customerKycStatus !== null
        ? user.customerKycStatus
        : (user.kycStatus === 'Verified' ? 2 : user.kycStatus === 'Rejected' ? 3 : user.kycStatus === 'Pending' ? 1 : 0);
    const statusLabel =
      kycStatusNum === 2 ? 'Verified' : kycStatusNum === 3 ? 'Rejected' : kycStatusNum === 1 ? 'Pending' : 'Not Submitted';

    const bankProofUrl =
      user.passbookImage ||
      user.bankProofImage ||
      user.cancelledChequeImage ||
      (user as any).customer_image_bank ||
      '';

    return {
      success: true,
      data: {
        kycStatus: kycStatusNum,
        statusLabel,
        isVerified: kycStatusNum === 2,
        submittedAt: user.kycSubmittedAt,
        rejectionReason: user.kycRejectReason || '',
        fullNameAsPerAadhaar: user.fullNameAsPerAadhaar || user.name || '',
        aadhaarNumber: user.aadhaarNumber
          ? `XXXX XXXX ${user.aadhaarNumber.slice(-4)}`
          : '',
        rawAadhaarNumber: user.aadhaarNumber || '',
        aadhaarFrontUrl: sanitizePublicDocUrl(user.customer_image_aadhar_front || user.aadharFrontImage || ''),
        aadhaarBackUrl: sanitizePublicDocUrl(user.customer_image_aadhar_back || user.aadharBackImage || ''),
        bankProofUrl: sanitizePublicDocUrl(bankProofUrl),
        bankDetails: {
          bankName: user.bankName || '',
          branchName: user.branchName || '',
          accountHolderName: user.accountHolderName || user.fullNameAsPerAadhaar || user.name || '',
          accountNumber: user.accountNumber ? `XXXX ${user.accountNumber.slice(-4)}` : '',
          rawAccountNumber: user.accountNumber || (user as any).bankAccountNo || '',
          ifscCode: user.ifscCode || '',
          upiId: user.upiId || '',
          bankProofUrl,
        },
      },
    };
  }
}


