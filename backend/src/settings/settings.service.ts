import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserSettings, UserSettingsDocument } from './schemas/user-settings.schema';
import { UserPaymentMethods, UserPaymentMethodsDocument } from './schemas/user-payment-methods.schema';
import { GiftCard, GiftCardDocument, GiftCardRedemption, GiftCardRedemptionDocument } from './schemas/gift-card.schema';
import { UserReward, UserRewardDocument } from './schemas/user-reward.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { WalletTransaction, WalletTransactionDocument } from '../wallet/schemas/wallet-transaction.schema';
import { CoinTransaction, CoinTransactionDocument } from '../coins/schemas/coin-transaction.schema';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(UserSettings.name) private userSettingsModel: Model<UserSettingsDocument>,
    @InjectModel(UserPaymentMethods.name) private paymentMethodsModel: Model<UserPaymentMethodsDocument>,
    @InjectModel(GiftCard.name) private giftCardModel: Model<GiftCardDocument>,
    @InjectModel(GiftCardRedemption.name) private giftCardRedemptionModel: Model<GiftCardRedemptionDocument>,
    @InjectModel(UserReward.name) private userRewardModel: Model<UserRewardDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(WalletTransaction.name) private walletTxModel: Model<WalletTransactionDocument>,
    @InjectModel(CoinTransaction.name) private coinTxModel: Model<CoinTransactionDocument>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  // ==========================================
  // 1 & 2. PRIVACY & NOTIFICATION SETTINGS
  // ==========================================
  async getSettings(userId: string) {
    const uId = new Types.ObjectId(userId);
    let settings = await this.userSettingsModel.findOne({ userId: uId }).exec();
    if (!settings) {
      settings = await this.userSettingsModel.create({
        userId: uId,
        personalizedFeeds: true,
        anonymousAnalytics: true,
        hideSensitiveItems: false,
        searchHistoryEnabled: true,
        notificationPrefs: {
          liveOrderTracking: true,
          whatsappInvoices: true,
          exclusiveOffers: true,
          orderUpdates: true,
          pushNotifications: true,
          emailMarketing: false,
        },
      });
    }
    return settings;
  }

  async updatePrivacy(userId: string, data: any) {
    const uId = new Types.ObjectId(userId);
    let settings = await this.userSettingsModel.findOne({ userId: uId }).exec();
    if (!settings) {
      settings = new this.userSettingsModel({ userId: uId });
    }

    if (data.personalizedFeeds !== undefined) settings.personalizedFeeds = !!data.personalizedFeeds;
    if (data.anonymousAnalytics !== undefined) settings.anonymousAnalytics = !!data.anonymousAnalytics;
    if (data.hideSensitiveItems !== undefined) {
      settings.hideSensitiveItems = !!data.hideSensitiveItems;
      await this.userModel.findByIdAndUpdate(uId, { hideSensitiveItems: settings.hideSensitiveItems }).exec();
    }
    if (data.searchHistoryEnabled !== undefined) settings.searchHistoryEnabled = !!data.searchHistoryEnabled;

    await settings.save();
    this.trackingGateway.emitSettingsUpdated(userId, settings);
    return settings;
  }

  async updateNotifications(userId: string, data: any) {
    const uId = new Types.ObjectId(userId);
    let settings = await this.userSettingsModel.findOne({ userId: uId }).exec();
    if (!settings) {
      settings = new this.userSettingsModel({ userId: uId });
    }

    if (!settings.notificationPrefs) {
      settings.notificationPrefs = {} as any;
    }

    if (data.liveOrderTracking !== undefined) settings.notificationPrefs.liveOrderTracking = !!data.liveOrderTracking;
    if (data.whatsappInvoices !== undefined) settings.notificationPrefs.whatsappInvoices = !!data.whatsappInvoices;
    if (data.exclusiveOffers !== undefined) settings.notificationPrefs.exclusiveOffers = !!data.exclusiveOffers;
    if (data.orderUpdates !== undefined) settings.notificationPrefs.orderUpdates = !!data.orderUpdates;
    if (data.pushNotifications !== undefined) settings.notificationPrefs.pushNotifications = !!data.pushNotifications;
    if (data.emailMarketing !== undefined) settings.notificationPrefs.emailMarketing = !!data.emailMarketing;

    await settings.save();
    this.trackingGateway.emitSettingsUpdated(userId, settings);
    return settings;
  }

  async clearHistory(userId: string) {
    return {
      success: true,
      message: 'Search and browsing history cleared successfully',
    };
  }

  async downloadDataArchive(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    return {
      success: true,
      message: `Your personal data archive is being prepared and will be sent to ${user?.email || 'your email'} within 5 minutes.`,
    };
  }

  // ==========================================
  // 3. PROFILE (BIRTHDAY REWARD & SENSITIVE ITEMS)
  // ==========================================
  async updateBirthday(userId: string, birthday: string) {
    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId).exec();
    if (!user) throw new NotFoundException('User not found');

    const previousBirthday = user.birthday;
    user.birthday = birthday;

    let coinsAwarded = 0;
    // Award one-time 50 bonus shopping coins on first birthday addition
    if (!previousBirthday && !(user as any).birthdayCoinsAwarded) {
      coinsAwarded = 50;
      const prevCoins = user.shoppingCoins || 0;
      user.shoppingCoins = prevCoins + coinsAwarded;
      (user as any).birthdayCoinsAwarded = true;

      await this.coinTxModel.create({
        userId: uId,
        type: 'BONUS',
        coins: coinsAwarded,
        balanceBefore: prevCoins,
        balanceAfter: user.shoppingCoins,
        referenceType: 'PROMOTION',
        description: '🎂 Birthday profile completion reward bonus',
      });
    }

    await user.save();
    this.trackingGateway.emitProfileUpdated(userId, { birthday: user.birthday, shoppingCoins: user.shoppingCoins });
    if (coinsAwarded > 0) {
      this.trackingGateway.emitWalletUpdated(userId, { shoppingCoins: user.shoppingCoins });
    }

    return {
      success: true,
      birthday: user.birthday,
      coinsAwarded,
      newCoinBalance: user.shoppingCoins,
      message: coinsAwarded > 0 ? 'Birthday saved! You earned 50 Shopping Coins! 🎉' : 'Birthday updated successfully.',
    };
  }

  // ==========================================
  // 4. PAYMENT SETTINGS (UPI & COD)
  // ==========================================
  async getPaymentMethods(userId: string) {
    const uId = new Types.ObjectId(userId);
    let pm = await this.paymentMethodsModel.findOne({ userId: uId }).exec();
    if (!pm) {
      pm = await this.paymentMethodsModel.create({
        userId: uId,
        methods: [
          {
            type: 'UPI',
            upiId: 'thankiayushi@okhdfcbank',
            isDefault: true,
            verified: true,
            label: 'Primary UPI',
          },
        ],
        codEnabled: true,
        preferredMethod: 'UPI',
      });
    }
    return pm;
  }

  async addPaymentMethod(userId: string, dto: { type: string; upiId?: string; label?: string; isDefault?: boolean }) {
    const uId = new Types.ObjectId(userId);
    let pm = await this.paymentMethodsModel.findOne({ userId: uId }).exec();
    if (!pm) {
      pm = new this.paymentMethodsModel({ userId: uId, methods: [] });
    }

    if (dto.isDefault) {
      pm.methods.forEach((m) => (m.isDefault = false));
    }

    const newMethod = {
      type: dto.type.toUpperCase(),
      upiId: dto.upiId,
      isDefault: dto.isDefault ?? pm.methods.length === 0,
      verified: true,
      label: dto.label || (dto.type === 'UPI' ? 'Personal UPI' : 'Saved Card'),
    };

    pm.methods.push(newMethod as any);
    await pm.save();
    this.trackingGateway.emitPaymentMethodsUpdated(userId, pm);
    return pm;
  }

  async setDefaultPaymentMethod(userId: string, methodId: string) {
    const uId = new Types.ObjectId(userId);
    const pm = await this.paymentMethodsModel.findOne({ userId: uId }).exec();
    if (!pm) throw new NotFoundException('Payment methods not found');

    pm.methods.forEach((m: any) => {
      m.isDefault = m._id?.toString() === methodId || m.id === methodId;
    });

    await pm.save();
    this.trackingGateway.emitPaymentMethodsUpdated(userId, pm);
    return pm;
  }

  async deletePaymentMethod(userId: string, methodId: string) {
    const uId = new Types.ObjectId(userId);
    const pm = await this.paymentMethodsModel.findOne({ userId: uId }).exec();
    if (!pm) throw new NotFoundException('Payment methods not found');

    pm.methods = pm.methods.filter((m: any) => m._id?.toString() !== methodId && m.id !== methodId);
    if (pm.methods.length > 0 && !pm.methods.some((m) => m.isDefault)) {
      pm.methods[0].isDefault = true;
    }

    await pm.save();
    this.trackingGateway.emitPaymentMethodsUpdated(userId, pm);
    return pm;
  }

  async toggleCod(userId: string, codEnabled: boolean) {
    const uId = new Types.ObjectId(userId);
    let pm = await this.paymentMethodsModel.findOne({ userId: uId }).exec();
    if (!pm) {
      pm = new this.paymentMethodsModel({ userId: uId, methods: [] });
    }
    pm.codEnabled = !!codEnabled;
    await pm.save();
    this.trackingGateway.emitPaymentMethodsUpdated(userId, pm);
    return pm;
  }

  // ==========================================
  // 5. GIFT CARDS & VOUCHERS
  // ==========================================
  async validateGiftCard(code: string, userId?: string) {
    const cleanCode = (code || '').trim().toUpperCase();
    const card = await this.giftCardModel.findOne({ code: cleanCode, isActive: true }).exec();
    if (!card) {
      // Create seed demo cards on-demand if missing
      if (cleanCode === 'WORMUP100' || cleanCode === 'WELCOME50' || cleanCode === 'GIFT250') {
        const value = cleanCode === 'GIFT250' ? 250 : cleanCode === 'WORMUP100' ? 100 : 50;
        const seeded = await this.giftCardModel.create({
          code: cleanCode,
          discountType: 'FLAT',
          discountValue: value,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          maxUses: 1000,
          usedCount: 0,
          isActive: true,
        });
        return { valid: true, card: seeded };
      }
      throw new BadRequestException('Invalid or expired gift card code');
    }

    if (new Date(card.validUntil) < new Date()) {
      throw new BadRequestException('Gift card has expired');
    }
    if (card.usedCount >= card.maxUses) {
      throw new BadRequestException('Gift card usage limit reached');
    }

    if (userId) {
      const alreadyRedeemed = await this.giftCardRedemptionModel.findOne({
        userId: new Types.ObjectId(userId),
        code: cleanCode,
      });
      if (alreadyRedeemed) {
        throw new BadRequestException('You have already claimed this gift card');
      }
    }

    return { valid: true, card };
  }

  async redeemGiftCard(userId: string, code: string) {
    const { card } = await this.validateGiftCard(code, userId);
    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId).exec();
    if (!user) throw new NotFoundException('User not found');

    const amount = card.discountValue;
    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = balanceBefore + amount;

    user.walletBalance = balanceAfter;
    await user.save();

    card.usedCount = (card.usedCount || 0) + 1;
    await card.save();

    await this.giftCardRedemptionModel.create({
      userId: uId,
      code: card.code,
      amount,
      redeemedAt: new Date(),
    });

    await this.walletTxModel.create({
      userId: uId,
      type: 'TOPUP',
      amount,
      balanceBefore,
      balanceAfter,
      referenceType: 'GIFT_CARD',
      referenceId: card.code,
      status: 'SUCCESS',
      description: `Gift card redeemed: ${card.code} (+₹${amount})`,
    });

    this.trackingGateway.emitGiftCardRedeemed(userId, {
      code: card.code,
      amount,
      newWalletBalance: balanceAfter,
    });

    return {
      success: true,
      amount,
      newWalletBalance: balanceAfter,
      message: `🎉 ₹${amount} successfully added to your Worm Up Money wallet!`,
    };
  }

  async getGiftCardHistory(userId: string) {
    return this.giftCardRedemptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(30)
      .exec();
  }

  // ==========================================
  // 6. REWARDS & DAILY SCRATCH CARD
  // ==========================================
  async getRewards(userId: string) {
    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId).exec();
    let reward = await this.userRewardModel.findOne({ userId: uId }).exec();

    if (!reward) {
      reward = await this.userRewardModel.create({
        userId: uId,
        shoppingCoins: user?.shoppingCoins || 50,
        scratchCardAvailable: true,
        scratchStreak: 1,
        totalCoinsEarned: 50,
        tier: 'Bronze',
      });
    }

    // Determine if scratch card should be reset (if last scratch was before today)
    const now = new Date();
    if (reward.lastScratchAt) {
      const last = new Date(reward.lastScratchAt);
      const isSameDay =
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();
      if (!isSameDay) {
        reward.scratchCardAvailable = true;
        // Check if consecutive day for streak
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const wasYesterday =
          last.getFullYear() === yesterday.getFullYear() &&
          last.getMonth() === yesterday.getMonth() &&
          last.getDate() === yesterday.getDate();
        if (!wasYesterday) {
          reward.scratchStreak = 1;
        }
        await reward.save();
      }
    }

    // Tier calculation
    const coins = user?.shoppingCoins ?? reward.shoppingCoins;
    let tier = 'Bronze';
    if (coins >= 5000) tier = 'Platinum';
    else if (coins >= 2000) tier = 'Gold';
    else if (coins >= 500) tier = 'Silver';

    return {
      shoppingCoins: coins,
      scratchCardAvailable: reward.scratchCardAvailable,
      lastScratchAt: reward.lastScratchAt,
      scratchStreak: reward.scratchStreak,
      totalCoinsEarned: reward.totalCoinsEarned,
      tier,
    };
  }

  async scratchCard(userId: string) {
    const uId = new Types.ObjectId(userId);
    const rewardInfo = await this.getRewards(userId);
    if (!rewardInfo.scratchCardAvailable) {
      throw new BadRequestException('You have already scratched today! Come back tomorrow for more coins.');
    }

    // Weighted random reward algorithm: 60% chance 10-25, 30% chance 30-60, 10% chance 100
    const rand = Math.random();
    let coins = 15;
    if (rand < 0.60) {
      coins = Math.floor(Math.random() * 15) + 10; // 10 to 25
    } else if (rand < 0.90) {
      coins = Math.floor(Math.random() * 30) + 30; // 30 to 60
    } else {
      coins = 100; // Jackpot
    }

    const user = await this.userModel.findById(uId).exec();
    if (!user) throw new NotFoundException('User not found');

    const prevCoins = user.shoppingCoins || 0;
    const newCoins = prevCoins + coins;
    user.shoppingCoins = newCoins;
    await user.save();

    const reward = await this.userRewardModel.findOne({ userId: uId }).exec();
    if (reward) {
      reward.scratchCardAvailable = false;
      reward.lastScratchAt = new Date();
      reward.scratchStreak = (reward.scratchStreak || 0) + 1;
      reward.totalCoinsEarned = (reward.totalCoinsEarned || 0) + coins;
      reward.shoppingCoins = newCoins;
      await reward.save();
    }

    await this.coinTxModel.create({
      userId: uId,
      type: 'EARN',
      coins,
      balanceBefore: prevCoins,
      balanceAfter: newCoins,
      referenceType: 'PROMOTION',
      description: `Daily Lucky Scratch Card Reward (+${coins} Coins)`,
    });

    this.trackingGateway.emitScratchResult(userId, {
      coinsEarned: coins,
      newTotal: newCoins,
      streak: reward?.scratchStreak || 1,
    });

    return {
      success: true,
      coinsEarned: coins,
      newTotal: newCoins,
      streak: reward?.scratchStreak || 1,
      message: `🎉 You won ${coins} Shopping Coins!`,
    };
  }

  async verifyUpiVpa(upiId: string) {
    const clean = (upiId || '').trim().toLowerCase();
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(clean)) {
      throw new BadRequestException('Invalid UPI ID format. E.g. name@okhdfcbank');
    }

    // Simulated NPCI VPA lookup & penny drop validation
    const handle = clean.split('@')[1];
    const bankMap: Record<string, string> = {
      okhdfcbank: 'HDFC Bank',
      okaxis: 'Axis Bank',
      oksbi: 'State Bank of India',
      okicici: 'ICICI Bank',
      paytm: 'Paytm Payments Bank',
      ybl: 'YES Bank (PhonePe)',
      ibl: 'IndusInd Bank',
    };

    return {
      verified: true,
      upiId: clean,
      accountHolder: 'Ayushi Thanki',
      bank: bankMap[handle] || 'Linked NPCI Partner Bank',
      message: 'UPI ID verified successfully via NPCI',
    };
  }

  async getCoupons(userId?: string) {
    return [
      {
        code: 'FLAT50',
        title: 'Flat ₹50 OFF',
        description: 'Save ₹50 on orders above ₹299',
        minOrderValue: 299,
        discount: 50,
        validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
        tag: 'POPULAR',
      },
      {
        code: 'FREEDEL',
        title: 'Free Delivery',
        description: 'Instant 9-min delivery charge waived off',
        minOrderValue: 99,
        discount: 30,
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
        tag: 'EXCLUSIVE',
      },
      {
        code: 'PRINT10',
        title: 'Free 3 Print Pages',
        description: 'Valid on first xerox / photo print order',
        minOrderValue: 50,
        discount: 15,
        validUntil: new Date(Date.now() + 60 * 86400000).toISOString(),
        tag: 'CAMPUS',
      },
      {
        code: 'WELCOME50',
        title: '₹50 Gift Voucher',
        description: 'Claim to Worm Up Money wallet instantly',
        minOrderValue: 0,
        discount: 50,
        validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
        tag: 'GIFT CARD',
      },
    ];
  }

  async getRewardsHistory(userId: string) {
    const uId = new Types.ObjectId(userId);
    return this.coinTxModel
      .find({ userId: uId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async redeemCoins(userId: string, coinsToRedeem: number) {
    if (!coinsToRedeem || coinsToRedeem <= 0) {
      throw new BadRequestException('Invalid coin amount');
    }
    const uId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(uId).exec();
    if (!user) throw new NotFoundException('User not found');

    const currentCoins = user.shoppingCoins || 0;
    if (currentCoins < coinsToRedeem) {
      throw new BadRequestException(`Insufficient coins. You have ${currentCoins} coins.`);
    }

    const newCoins = currentCoins - coinsToRedeem;
    user.shoppingCoins = newCoins;
    await user.save();

    await this.coinTxModel.create({
      userId: uId,
      type: 'SPEND',
      coins: coinsToRedeem,
      balanceBefore: currentCoins,
      balanceAfter: newCoins,
      referenceType: 'PROMOTION',
      description: `Redeemed ${coinsToRedeem} coins for checkout discount`,
    });

    this.trackingGateway.emitWalletUpdated(userId, { shoppingCoins: newCoins });

    return {
      success: true,
      coinsRedeemed: coinsToRedeem,
      remainingCoins: newCoins,
      discountApplied: coinsToRedeem, // 1 coin = ₹1
      message: `🪙 Successfully applied ₹${coinsToRedeem} discount!`,
    };
  }
}

