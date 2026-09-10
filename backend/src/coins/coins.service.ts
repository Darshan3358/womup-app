import { Injectable, NotFoundException } from '@nestjs/common';
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
}
