import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { IncomeTransaction, IncomeTransactionDocument } from './schemas/income-transaction.schema';
import { CoinTransaction, CoinTransactionDocument } from '../coins/schemas/coin-transaction.schema';
import { TeamPurchaseIncome, TeamPurchaseIncomeDocument } from './schemas/team-purchase-income.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

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

    // ── Idempotency Guard: Prevent double verification and double referral payouts ──
    if (user.aadhaarVerified && user.verificationStatus === 'VERIFIED') {
      return {
        success: true,
        message: 'Aadhaar is already verified.',
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

    user.aadhaarVerified = true;
    user.verificationStatus = 'VERIFIED';
    user.aadhaarNumber = cleanAadhaar;
    user.fullNameAsPerAadhaar = dto.fullNameAsPerAadhaar.trim();
    user.verifiedAt = new Date();
    await user.save();

    // ── 3-Tier Multi-Level Distribution (App Download Income + Shopping Coin Income) ──
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
          description: `Level ${tier.level} App Download Income from verified referral: ${user.fullNameAsPerAadhaar}`,
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
            description: `Level ${tier.level} Referral Shopping Coins Bonus from ${user.fullNameAsPerAadhaar}`,
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

      // Move up to the next upline sponsor in the tree
      currentSponsorId = sponsor.referredBy || (sponsor.isCompanySponsored ? undefined : sponsor.sponsorId);
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

      return {
        level: levelNum,
        memberCount,
        activeMemberCount,
        vegetableGMV,
        otherGMV,
        incomeEarned,
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

      // If eligible and has income, credit to pendingIncome with 24-hr lock
      if (isEligible && totalIncome > 0) {
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
}
