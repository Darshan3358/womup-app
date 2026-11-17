import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  IncomeTransaction,
  IncomeTransactionDocument,
} from '../users/schemas/income-transaction.schema';
import {
  DailyIncomeDistribution,
  DailyIncomeDistributionDocument,
} from './schemas/daily-income-distribution.schema';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class DailyIncomeDistributionService {
  private readonly logger = new Logger(DailyIncomeDistributionService.name);
  private isRunning = false;

  constructor(
    @InjectModel(DailyIncomeDistribution.name)
    private distributionModel: Model<DailyIncomeDistributionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(IncomeTransaction.name)
    private incomeTxModel: Model<IncomeTransactionDocument>,
    private trackingGateway: TrackingGateway,
  ) {}

  /**
   * Automatic Cron Job: Runs daily at 12:00 AM (Midnight) in Asia/Kolkata timezone
   */
  @Cron('0 0 * * *', {
    name: 'daily-income-distribution',
    timeZone: 'Asia/Kolkata',
  })
  async handleDailyMidnightCron() {
    this.logger.log('[Daily Income Cron] 12:00 AM IST Cron triggered. Starting daily distribution...');
    return this.runDailyDistribution(false);
  }

  /**
   * Execute Daily Income Distribution
   * @param force - If true (e.g. manual admin trigger), runs even if already run today
   */
  async runDailyDistribution(force = false) {
    if (this.isRunning) {
      this.logger.warn('[Daily Income Cron] Distribution already in progress. Skipping concurrent run.');
      return { success: false, message: 'Distribution already in progress' };
    }

    this.isRunning = true;
    const startTime = Date.now();

    // Get current date string in Asia/Kolkata timezone (YYYY-MM-DD)
    const nowKolkata = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    );
    const dateStr = nowKolkata.toISOString().slice(0, 10);

    try {
      // Check if already completed today (prevent duplicate execution)
      const existingRun = await this.distributionModel.findOne({
        date: dateStr,
        status: 'SUCCESS',
      });

      if (existingRun && !force) {
        this.logger.log(
          `[Daily Income Cron] Distribution for ${dateStr} has already completed successfully. Idempotent skip.`,
        );
        return {
          success: true,
          message: `Distribution for ${dateStr} already completed`,
          record: existingRun,
        };
      }

      // Step 1: Find all pending income transactions across all users
      const pendingTxs = await this.incomeTxModel.find({
        status: 'PENDING',
        isUsable: false,
      }).lean();

      // Step 2: Also find any users with pendingIncome > 0
      const usersWithPending = await this.userModel.find({
        pendingIncome: { $gt: 0 },
      });

      this.logger.log(
        `[Daily Income Cron] Found ${pendingTxs.length} pending transactions and ${usersWithPending.length} users with pending income.`,
      );

      // Group pending transactions by userId string
      const txsByUser = new Map<string, any[]>();
      for (const tx of pendingTxs) {
        const uId = tx.userId?.toString();
        if (!uId) continue;
        if (!txsByUser.has(uId)) {
          txsByUser.set(uId, []);
        }
        txsByUser.get(uId)!.push(tx);
      }

      // Ensure all users with pendingIncome > 0 are included in the processing list
      const allUserIds = new Set<string>([
        ...txsByUser.keys(),
        ...usersWithPending.map((u) => u._id.toString()),
      ]);

      let totalDistributedAmount = 0;
      let totalReferralAmount = 0;
      let totalLevelAmount = 0;
      let totalOtherAmount = 0;
      let processedTxCount = 0;
      let successUserCount = 0;
      let failedUserCount = 0;
      const userSummaries: any[] = [];

      for (const userIdStr of allUserIds) {
        try {
          const userObjId = new Types.ObjectId(userIdStr);
          const user = await this.userModel.findById(userObjId);
          if (!user) continue;

          const userTxs = txsByUser.get(userIdStr) || [];
          let userReferral = 0;
          let userLevel = 0;
          let userOther = 0;
          const txIdsToSettle: Types.ObjectId[] = [];

          for (const tx of userTxs) {
            const amt = Number(tx.amount || 0);
            if (amt <= 0) continue;

            if (tx.type === 'APP_DOWNLOAD' || tx.type === 'REFERRAL') {
              userReferral += amt;
            } else if (tx.type === 'TEAM_PURCHASE' || tx.type === 'LEVEL_INCOME') {
              userLevel += amt;
            } else {
              userOther += amt;
            }

            if (tx._id) {
              txIdsToSettle.push(tx._id);
            }
          }

          let userTotal = Number((userReferral + userLevel + userOther).toFixed(2));

          // If user had pendingIncome on their model greater than the sum of transactions (legacy fallback)
          if ((user.pendingIncome || 0) > userTotal && userTxs.length === 0) {
            userTotal = Number((user.pendingIncome || 0).toFixed(2));
            userOther = userTotal;
          }

          if (userTotal <= 0) continue;

          // Atomic: Update user wallet balances
          user.availableIncome = Number(((user.availableIncome || 0) + userTotal).toFixed(2));
          user.walletBalance = Number(((user.walletBalance || 0) + userTotal).toFixed(2));
          user.pendingIncome = Math.max(0, Number(((user.pendingIncome || 0) - userTotal).toFixed(2)));
          user.lastIncomeCreditedAt = new Date();
          await user.save();

          // Atomic: Update income transactions to AVAILABLE
          if (txIdsToSettle.length > 0) {
            await this.incomeTxModel.updateMany(
              { _id: { $in: txIdsToSettle } },
              {
                $set: {
                  status: 'AVAILABLE',
                  isUsable: true,
                  availableFrom: new Date(),
                  distributedAt: new Date(),
                },
              },
            );
            processedTxCount += txIdsToSettle.length;
          }

          // Emit real-time wallet update via WebSocket
          try {
            this.trackingGateway.emitWalletUpdated(userIdStr, {
              pendingIncome: user.pendingIncome,
              availableIncome: user.availableIncome,
              walletBalance: user.walletBalance,
            });
          } catch (_) {}

          totalDistributedAmount += userTotal;
          totalReferralAmount += userReferral;
          totalLevelAmount += userLevel;
          totalOtherAmount += userOther;
          successUserCount++;

          userSummaries.push({
            userId: userIdStr,
            userName: user.name || 'User',
            totalAmount: userTotal,
            referralAmount: Number(userReferral.toFixed(2)),
            levelAmount: Number(userLevel.toFixed(2)),
            otherAmount: Number(userOther.toFixed(2)),
            txCount: txIdsToSettle.length,
          });
        } catch (err: any) {
          failedUserCount++;
          this.logger.error(`[Daily Income Cron] Failed to distribute for user ${userIdStr}: ${err.message}`);
        }
      }

      totalDistributedAmount = Number(totalDistributedAmount.toFixed(2));
      totalReferralAmount = Number(totalReferralAmount.toFixed(2));
      totalLevelAmount = Number(totalLevelAmount.toFixed(2));
      totalOtherAmount = Number(totalOtherAmount.toFixed(2));

      // Save execution record to MongoDB
      const distributionRecord = await this.distributionModel.findOneAndUpdate(
        { date: dateStr },
        {
          $set: {
            date: dateStr,
            executedAt: new Date(),
            totalAmount: totalDistributedAmount,
            userCount: successUserCount,
            transactionCount: processedTxCount,
            breakdown: {
              referralIncome: totalReferralAmount,
              levelIncome: totalLevelAmount,
              otherIncome: totalOtherAmount,
            },
            status: failedUserCount === 0 ? 'SUCCESS' : (successUserCount > 0 ? 'PARTIAL' : 'FAILED'),
            failedCount: failedUserCount,
            distributionSummary: userSummaries.slice(0, 100), // store up to 100 entries in log
          },
        },
        { upsert: true, new: true },
      );

      const durationMs = Date.now() - startTime;
      this.logger.log(
        `[Daily Income Cron] Completed distribution for ${dateStr} in ${durationMs}ms. Distributed: ₹${totalDistributedAmount} to ${successUserCount} users across ${processedTxCount} transactions. (Referral: ₹${totalReferralAmount}, Level: ₹${totalLevelAmount}, Other: ₹${totalOtherAmount}).`,
      );

      return {
        success: true,
        date: dateStr,
        totalAmount: totalDistributedAmount,
        userCount: successUserCount,
        transactionCount: processedTxCount,
        breakdown: {
          referralIncome: totalReferralAmount,
          levelIncome: totalLevelAmount,
          otherIncome: totalOtherAmount,
        },
        status: failedUserCount === 0 ? 'SUCCESS' : 'PARTIAL',
        failedCount: failedUserCount,
        record: distributionRecord,
      };
    } catch (err: any) {
      this.logger.error(`[Daily Income Cron] Fatal error during distribution: ${err.message}`);
      await this.distributionModel.findOneAndUpdate(
        { date: dateStr },
        {
          $set: {
            date: dateStr,
            executedAt: new Date(),
            status: 'FAILED',
            errorDetails: err.message,
          },
        },
        { upsert: true },
      );
      return { success: false, error: err.message };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get Daily Income Distribution History for Admin
   */
  async getDistributionHistory(limit = 30) {
    return this.distributionModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get Latest Distribution Record
   */
  async getLatestDistribution() {
    return this.distributionModel
      .findOne()
      .sort({ createdAt: -1 })
      .lean();
  }
}
