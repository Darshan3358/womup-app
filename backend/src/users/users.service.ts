import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { IncomeTransaction, IncomeTransactionDocument } from './schemas/income-transaction.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(IncomeTransaction.name)
    private incomeTxModel: Model<IncomeTransactionDocument>,
    private readonly trackingGateway: TrackingGateway,
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
    return user;
  }

  async updateProfile(userId: string, updateData: UpdateUserDto) {
    const currentUser = await this.userModel.findById(userId).exec();
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const updateOps: any = { $set: {} };
    if (updateData.name !== undefined) updateOps.$set.name = updateData.name;
    if (updateData.email !== undefined) updateOps.$set.email = updateData.email;
    if (updateData.avatar !== undefined) updateOps.$set.avatar = updateData.avatar;
    if (updateData.hideSensitiveItems !== undefined) updateOps.$set.hideSensitiveItems = updateData.hideSensitiveItems;
    if (updateData.preferredCityId !== undefined) updateOps.$set.preferredCityId = updateData.preferredCityId;
    if (updateData.preferredCityName !== undefined) updateOps.$set.preferredCityName = updateData.preferredCityName;

    if (updateData.birthday) {
      updateOps.$set.birthday = updateData.birthday;
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
    dto: { aadhaarNumber: string; fullNameAsPerAadhaar: string },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const cleanAadhaar = (dto.aadhaarNumber || '').replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      throw new BadRequestException('Please provide a valid 12-digit Aadhaar number');
    }

    if (!dto.fullNameAsPerAadhaar || !dto.fullNameAsPerAadhaar.trim()) {
      throw new BadRequestException('Please provide your full name as per Aadhaar card');
    }

    user.aadhaarVerified = true;
    user.verificationStatus = 'VERIFIED';
    user.aadhaarNumber = cleanAadhaar;
    user.fullNameAsPerAadhaar = dto.fullNameAsPerAadhaar.trim();
    user.verifiedAt = new Date();
    await user.save();

    // Credit ₹50 App Download Income to Referrer / Sponsor
    const sponsorTargetId = user.referredBy || (user.isCompanySponsored ? null : user.sponsorId);
    if (sponsorTargetId) {
      const referrer = await this.userModel.findById(sponsorTargetId);
      if (referrer && !referrer.isCompanyAccount) {
        const APP_DOWNLOAD_INCOME = 50;

        await this.incomeTxModel.create({
          userId: referrer._id,
          type: 'APP_DOWNLOAD',
          amount: APP_DOWNLOAD_INCOME,
          sourceUserId: user._id,
          sourceVerificationStatus: 'VERIFIED',
          earnedAt: new Date(),
          availableFrom: this.getNextMidnight(),
          status: 'PENDING',
          description: `App Download Income from verified referral: ${user.fullNameAsPerAadhaar}`,
        });

        referrer.pendingIncome = (referrer.pendingIncome || 0) + APP_DOWNLOAD_INCOME;
        referrer.appDownloadIncome = (referrer.appDownloadIncome || 0) + APP_DOWNLOAD_INCOME;
        referrer.verifiedReferralsCount = (referrer.verifiedReferralsCount || 0) + 1;
        await referrer.save();

        this.trackingGateway.emitWalletUpdated(referrer._id.toString(), {
          pendingIncome: referrer.pendingIncome,
          availableIncome: referrer.availableIncome,
          appDownloadIncome: referrer.appDownloadIncome,
          verifiedReferralsCount: referrer.verifiedReferralsCount,
        });
      }
    }

    // Emit live update for this user
    this.trackingGateway.emitWalletUpdated(userId, {
      shoppingCoins: user.shoppingCoins,
      verificationStatus: 'VERIFIED',
      aadhaarVerified: true,
      fullNameAsPerAadhaar: user.fullNameAsPerAadhaar,
    });

    return {
      success: true,
      message: 'Aadhaar verified successfully! Referral & income benefits unlocked.',
      user: {
        id: user._id.toString(),
        name: user.name,
        verificationStatus: user.verificationStatus,
        aadhaarVerified: user.aadhaarVerified,
        fullNameAsPerAadhaar: user.fullNameAsPerAadhaar,
        shoppingCoins: user.shoppingCoins,
        availableIncome: user.availableIncome,
        pendingIncome: user.pendingIncome,
      },
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
      recentTransactions: transactions,
    };
  }
}
