import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from './schemas/wallet-transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(WalletTransaction.name)
    private walletTxModel: Model<WalletTransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getWalletDetails(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const recentTransactions = await this.walletTxModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return {
      balance: user.walletBalance,
      currency: 'INR',
      recentTransactions,
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const uId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.walletTxModel
        .find({ userId: uId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.walletTxModel.countDocuments({ userId: uId }).exec(),
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

  async topup(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Top-up amount must be greater than zero');
    }

    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId);
    if (!user) throw new NotFoundException('User not found');

    const before = user.walletBalance;
    user.walletBalance = Number((user.walletBalance + amount).toFixed(2));
    user.availableIncome = Number(((user.availableIncome || 0) + amount).toFixed(2));
    await user.save();

    const tx = await this.walletTxModel.create({
      userId: uId,
      type: 'TOPUP',
      amount,
      balanceBefore: before,
      balanceAfter: user.walletBalance,
      referenceType: 'TOPUP_GATEWAY',
      status: 'SUCCESS',
      description: `Worm Up Wallet Top-up of ₹${amount}`,
    });

    return {
      success: true,
      message: `₹${amount} added successfully to Worm Up Wallet`,
      balance: user.walletBalance,
      transaction: tx,
    };
  }
}
