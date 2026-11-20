import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CoinTransaction,
  CoinTransactionDocument,
} from './schemas/coin-transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class CoinsService {
  constructor(
    @InjectModel(CoinTransaction.name)
    private coinTxModel: Model<CoinTransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getCoinsDetails(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const recentTransactions = await this.coinTxModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return {
      shoppingCoins: user.shoppingCoins,
      coinValueRupees: user.shoppingCoins, // 1 coin = ₹1
      recentTransactions,
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const uId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.coinTxModel
        .find({ userId: uId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.coinTxModel.countDocuments({ userId: uId }).exec(),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Get all coin transactions and history for a specific user (Item 8)
   */
  async getUserHistoryForAdmin(userId: string) {
    let uId: Types.ObjectId;
    try {
      uId = new Types.ObjectId(userId);
    } catch (e) {
      const userByPhone = await this.userModel.findOne({ phone: userId }).exec();
      if (!userByPhone) throw new NotFoundException('User not found');
      uId = userByPhone._id as Types.ObjectId;
    }

    const user = await this.userModel.findById(uId).exec();
    if (!user) throw new NotFoundException('User not found');

    const transactions = await this.coinTxModel
      .find({ userId: uId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        shoppingCoins: user.shoppingCoins || 0,
        walletBalance: user.walletBalance || 0,
      },
      transactions,
    };
  }

  /**
   * Admin: Points purchase report with filters and KPIs (Item 3)
   */
  async getPurchasesReport(query: {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter: any = {
      $or: [
        { referenceType: 'PURCHASE' },
        { referenceType: 'ADMIN_ADJUSTMENT' },
        { description: { $regex: 'purchas|credit|recharge', $options: 'i' } },
      ],
    };

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [txList, totalCount] = await Promise.all([
      this.coinTxModel
        .find(filter)
        .populate('userId', 'name phone email referralCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.coinTxModel.countDocuments(filter).exec(),
    ]);

    // Aggregate overall statistics
    const stats = await this.coinTxModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$coins' },
          totalRevenue: { $sum: { $ifNull: ['$amountPaid', '$coins'] } },
          users: { $addToSet: '$userId' },
        },
      },
    ]);

    const overallTotalCoins = stats[0]?.totalCoins || 0;
    const overallTotalRevenue = stats[0]?.totalRevenue || 0;
    const uniqueUserCount = stats[0]?.users?.length || 0;

    return {
      success: true,
      stats: {
        totalCoinsPurchased: overallTotalCoins,
        totalRevenue: overallTotalRevenue,
        uniqueUsersCount: uniqueUserCount,
        totalTransactions: totalCount,
      },
      transactions: txList.map((tx: any) => ({
        id: tx._id,
        coins: tx.coins,
        amountPaid: tx.amountPaid || tx.coins,
        paymentMethod: tx.paymentMethod || 'UPI',
        referenceType: tx.referenceType,
        referenceId: tx.referenceId || `TX-${tx._id}`,
        description: tx.description,
        balanceAfter: tx.balanceAfter,
        createdAt: tx.createdAt,
        user: tx.userId
          ? {
              id: tx.userId._id,
              name: tx.userId.name || 'Womup Customer',
              phone: tx.userId.phone || '',
              email: tx.userId.email || '',
              referralCode: tx.userId.referralCode || '',
            }
          : { id: 'Unknown', name: 'Womup User', phone: '', email: '', referralCode: '' },
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Admin: Credit/Add points directly to user (Item 3 "user can purchase shopping point so add option for that also")
   */
  async adminCreditPurchase(dto: {
    userId?: string;
    phone?: string;
    coins: number;
    amountPaid?: number;
    paymentMethod?: string;
    notes?: string;
    referenceId?: string;
  }) {
    if (!dto.coins || Number(dto.coins) <= 0) {
      throw new BadRequestException('Coins amount must be a positive integer');
    }

    let user: UserDocument | null = null;
    if (dto.userId) {
      try {
        user = await this.userModel.findById(dto.userId).exec();
      } catch (e) {}
    }
    if (!user && dto.phone) {
      user = await this.userModel.findOne({ phone: dto.phone }).exec();
    }
    if (!user && dto.userId) {
      user = await this.userModel.findOne({
        $or: [{ phone: dto.userId }, { referralCode: dto.userId.toUpperCase() }],
      }).exec();
    }

    if (!user) {
      throw new NotFoundException('Target customer not found by ID, Phone, or Referral Code');
    }

    const coinsToAdd = Math.floor(Number(dto.coins));
    const previousCoins = user.shoppingCoins || 0;
    user.shoppingCoins = previousCoins + coinsToAdd;
    await user.save();

    const amountPaid = dto.amountPaid !== undefined ? Number(dto.amountPaid) : coinsToAdd;
    const paymentMethod = dto.paymentMethod || 'UPI';
    const referenceId = dto.referenceId || `CREDIT-${Date.now()}`;
    const description =
      dto.notes ||
      `Purchased ${coinsToAdd} Shopping Points (₹${amountPaid}) via ${paymentMethod}`;

    const tx = new this.coinTxModel({
      userId: user._id,
      type: 'EARN',
      coins: coinsToAdd,
      balanceBefore: previousCoins,
      balanceAfter: user.shoppingCoins,
      referenceType: 'PURCHASE',
      amountPaid,
      paymentMethod,
      referenceId,
      description,
    });
    await tx.save();

    return {
      success: true,
      message: `Successfully credited ${coinsToAdd} Shopping Points to ${user.name} (${user.phone})`,
      newBalance: user.shoppingCoins,
      transaction: tx,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        shoppingCoins: user.shoppingCoins,
      },
    };
  }
}
