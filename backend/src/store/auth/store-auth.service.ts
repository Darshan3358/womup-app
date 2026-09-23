import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  StoreStaff,
  StoreStaffDocument,
  StaffRole,
  StaffShift,
  StaffStatus,
} from '../schemas/store-staff.schema';
import { Store, StoreDocument } from '../../stores/schemas/store.schema';
import {
  OtpVerification,
  OtpVerificationDocument,
} from '../../auth/schemas/otp.schema';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class StoreAuthService {
  private readonly logger = new Logger(StoreAuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(StoreStaff.name)
    private staffModel: Model<StoreStaffDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectModel(OtpVerification.name)
    private otpModel: Model<OtpVerificationDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async loginWithStoreCredentials(loginId: string, password: string) {
    if (!loginId || !password) {
      throw new BadRequestException('Store ID and password are required');
    }

    const cleanId = loginId.trim();

    // Find store by loginId (case-insensitive)
    const store = await this.storeModel.findOne({
      loginId: { $regex: new RegExp(`^${cleanId}$`, 'i') },
      isActive: true,
    });

    if (!store) {
      this.logger.warn(`[Store Login] Invalid store ID attempt: ${cleanId}`);
      throw new UnauthorizedException('Invalid Store ID or password');
    }

    // Verify bcrypt password
    const isValid = await bcrypt.compare(password, store.loginPasswordHash || '');
    if (!isValid) {
      this.logger.warn(`[Store Login] Invalid password for ${cleanId}`);
      throw new UnauthorizedException('Invalid Store ID or password');
    }

    // Update last login timestamp
    await this.storeModel.updateOne(
      { _id: store._id },
      { $set: { lastLoginAt: new Date() } },
    );

    // Generate shift JWT with storeId embedded (12h session)
    const token = await this.jwtService.signAsync(
      {
        sub: store._id.toString(),
        id: store._id.toString(),
        storeId: store._id.toString(),
        storeCode: store.code,
        storeName: store.name,
        role: 'STORE_OPERATOR',
        loginId: store.loginId,
      },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET') || 'wormup_super_secure_access_token_secret_2026',
        expiresIn: '12h',
      },
    );

    this.logger.log(`[Store Login] Success: ${store.code} (${store.name})`);

    return {
      success: true,
      token,
      store: {
        id: store._id.toString(),
        code: store.code,
        name: store.name,
        loginId: store.loginId,
        address: store.address,
        city: store.city,
        pincode: store.pincode,
        serviceRadiusKm: store.serviceRadiusKm,
        estimatedDeliveryMinutes: store.estimatedDeliveryMinutes || 9,
      },
    };
  }

  async getStoreSession(storeId: string) {
    if (!storeId || !Types.ObjectId.isValid(storeId)) {
      throw new UnauthorizedException('Invalid store session');
    }

    const store = await this.storeModel.findById(storeId);
    if (!store || !store.isActive) {
      throw new UnauthorizedException('Store not found or inactive');
    }

    return {
      store: {
        id: store._id.toString(),
        code: store.code,
        name: store.name,
        loginId: store.loginId,
        address: store.address,
        city: store.city,
        pincode: store.pincode,
        serviceRadiusKm: store.serviceRadiusKm,
        estimatedDeliveryMinutes: store.estimatedDeliveryMinutes || 9,
      },
    };
  }

  async sendOtp(email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Please provide a valid email address');
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new BadRequestException('Please provide a valid email address');
    }

    // Rate limiting: max 3 OTP requests per 10 minutes per email
    const recentCount = await this.otpModel.countDocuments({
      email: cleanEmail,
      purpose: 'STORE_LOGIN',
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      throw new BadRequestException('Too many OTP requests. Please try again after 10 minutes.');
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpModel.deleteMany({
      email: cleanEmail,
      purpose: 'STORE_LOGIN',
      isVerified: false,
    });

    await this.otpModel.create({
      email: cleanEmail,
      otpHash,
      purpose: 'STORE_LOGIN',
      verificationId: `st_otp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      expiresAt,
      isVerified: false,
      attempts: 0,
    });

    // Send via email non-blocking so store login screen responds instantly
    this.mailService
      .sendOtpEmail(cleanEmail, rawOtp)
      .then(() => {
        this.logger.log(`[Store Staff Auth] OTP sent to email ${cleanEmail.replace(/(.{2}).+(@.*)/, '$1***$2')}`);
      })
      .catch((err) => {
        this.logger.error(`[Store Staff Auth] Background send failed: ${err.message}`);
      });

    return {
      success: true,
      message: 'OTP sent successfully to your registered email',
      email: cleanEmail,
      expiresInSeconds: 600,
    };
  }

  async verifyOtp(email: string, otp: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Please provide a valid email address');
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Please provide a valid 6-digit OTP');
    }
    const cleanEmail = email.trim().toLowerCase();

    const record = await this.otpModel.findOne({
      email: cleanEmail,
      purpose: 'STORE_LOGIN',
      isVerified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw new UnauthorizedException('OTP expired or not found. Please request a new code.');
    }

    if (record.attempts >= 3) {
      await this.otpModel.deleteOne({ _id: record._id });
      throw new UnauthorizedException('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    const isValid = await bcrypt.compare(otp, record.otpHash || '');
    if (!isValid) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      throw new UnauthorizedException('Invalid 6-digit OTP');
    }

    record.isVerified = true;
    record.verifiedAt = new Date();
    await record.save();

    // Find or create User by EMAIL
    let user = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (!user) {
      user = await this.userModel.create({
        email: cleanEmail,
        name: cleanEmail.split('@')[0].replace(/[._]/g, ' ') || 'Dark Store Picker',
        role: Role.STORE_STAFF,
        isActive: true,
      });
    } else if (user.role !== Role.STORE_STAFF && user.role !== Role.ADMIN) {
      user.role = Role.STORE_STAFF;
      await user.save();
    }

    // Find active Dark Store
    let targetStore = await this.storeModel.findOne({ isActive: true });
    if (!targetStore) {
      throw new BadRequestException(
        'No active dark store found. Contact your administrator to configure a store.',
      );
    }

    // Find or create StoreStaff profile by email
    let staff = await this.staffModel.findOne({
      $or: [{ userId: user._id }, { email: cleanEmail }],
    });

    if (!staff) {
      const codeSuffix = Math.floor(100 + Math.random() * 900);
      const storePrefix = targetStore.code ? targetStore.code.replace('STORE-', '').slice(0, 3) : 'HUB';
      staff = await this.staffModel.create({
        userId: user._id,
        storeId: targetStore._id,
        employeeCode: `STF-${storePrefix}-${codeSuffix}`,
        fullName: user.name || 'Store Staff',
        email: cleanEmail,
        phoneNumber: undefined,
        role: StaffRole.PICKER,
        shift: StaffShift.MORNING,
        isOnShift: true,
        totalOrdersPicked: 0,
        avgPickTimeSeconds: 0,
        accuracy: 100,
        currentStreak: 0,
        lifetimeOrdersPicked: 0,
        status: StaffStatus.ACTIVE,
      });
    } else {
      staff.userId = user._id;
      staff.email = cleanEmail;
      staff.isOnShift = true;
      if (!staff.storeId) {
        staff.storeId = targetStore._id;
      }
      await staff.save();
    }

    const tokens = await this.generateTokens(user);

    // Consume OTP once login and profile generation are successful
    await this.otpModel.deleteOne({ _id: record._id });

    // Fetch the staff's actual assigned store
    const assignedStore = staff.storeId
      ? (await this.storeModel.findById(staff.storeId)) || targetStore
      : targetStore;

    return {
      ...tokens,
      staff: {
        id: staff._id.toString(),
        userId: user._id.toString(),
        storeId: staff.storeId ? staff.storeId.toString() : assignedStore._id.toString(),
        employeeCode: staff.employeeCode,
        name: staff.fullName,
        email: staff.email,
        phone: staff.phoneNumber || null,
        role: staff.role,
        shift: staff.shift,
        isOnShift: staff.isOnShift,
        accuracy: staff.accuracy,
        totalOrdersPicked: staff.totalOrdersPicked,
        avgPickTimeSeconds: staff.avgPickTimeSeconds,
      },
      store: {
        id: assignedStore._id.toString(),
        name: assignedStore.name,
        code: assignedStore.code,
        address: assignedStore.address,
        city: assignedStore.city,
      },
    };
  }

  async getMe(userId: string) {
    // Check if ID is a direct Store ID (store credentials session)
    if (userId && Types.ObjectId.isValid(userId)) {
      const directStore = await this.storeModel.findById(userId);
      if (directStore) {
        return {
          staff: {
            id: `staff_${directStore.code}`,
            userId: directStore._id.toString(),
            storeId: directStore._id.toString(),
            employeeCode: `STF-${directStore.code}`,
            fullName: `${directStore.name} Staff`,
            email: `${directStore.loginId || 'store'}@wormup.com`,
            phoneNumber: directStore.managerPhone || null,
            role: 'PICKER',
            shift: 'MORNING',
            isOnShift: true,
            activeOrderId: null,
            totalOrdersPicked: 0,
            avgPickTimeSeconds: 120,
            accuracy: 99.5,
            status: 'ACTIVE',
          },
          store: {
            id: directStore._id.toString(),
            name: directStore.name,
            code: directStore.code,
            loginId: directStore.loginId,
            address: directStore.address,
            city: directStore.city,
            pincode: directStore.pincode,
            serviceRadiusKm: directStore.serviceRadiusKm,
            estimatedDeliveryMinutes: directStore.estimatedDeliveryMinutes || 9,
          },
        };
      }
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Staff user not found');
    }

    let staff = await this.staffModel.findOne({ userId: user._id });
    if (!staff && user.email) {
      staff = await this.staffModel.findOne({ email: user.email });
    }

    if (!staff) {
      throw new UnauthorizedException('Store staff profile not found. Please re-authenticate.');
    }

    const store = staff.storeId ? await this.storeModel.findById(staff.storeId) : null;
    if (!store) {
      throw new UnauthorizedException('Assigned dark store not found. Contact your store manager.');
    }

    // Compute today's picked count from real pick_lists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPicked = await this.staffModel.db
      .collection('pick_lists')
      .countDocuments({
        pickerId: staff._id,
        status: 'COMPLETED',
        completedAt: { $gte: today },
      });

    return {
      staff: {
        id: staff._id.toString(),
        userId: user._id.toString(),
        storeId: staff.storeId?.toString() || null,
        employeeCode: staff.employeeCode,
        fullName: staff.fullName,
        email: staff.email,
        phoneNumber: staff.phoneNumber || null,
        role: staff.role,
        shift: staff.shift,
        isOnShift: staff.isOnShift,
        activeOrderId: staff.activeOrderId ? staff.activeOrderId.toString() : null,
        totalOrdersPicked: staff.totalOrdersPicked,
        avgPickTimeSeconds: staff.avgPickTimeSeconds,
        accuracy: staff.accuracy,
        status: staff.status,
      },
      store: {
        id: store._id.toString(),
        name: store.name,
        code: store.code,
        address: store.address,
        city: store.city,
        pincode: store.pincode,
      },
      performance: {
        todayPicked,
        avgPickTime: staff.avgPickTimeSeconds > 0
          ? `${Math.floor(staff.avgPickTimeSeconds / 60)}m ${staff.avgPickTimeSeconds % 60}s`
          : '—',
        avgPickTimeSeconds: staff.avgPickTimeSeconds || 0,
        accuracy: staff.totalOrdersPicked > 0 ? `${staff.accuracy}%` : '100%',
        currentStreak: staff.currentStreak || 0,
      },
    };
  }

  async updateShift(userId: string, isOnShift: boolean) {
    if (Types.ObjectId.isValid(userId)) {
      const store = await this.storeModel.findById(userId);
      if (store) {
        return {
          success: true,
          isOnShift: true,
          shiftStartedAt: new Date(),
          message: 'Store hub active.',
        };
      }
    }

    const staff = await this.staffModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!staff) {
      throw new BadRequestException('Staff profile not found');
    }

    staff.isOnShift = Boolean(isOnShift);
    await staff.save();

    return {
      success: true,
      isOnShift: staff.isOnShift,
      shiftStartedAt: staff.isOnShift ? new Date() : null,
      message: staff.isOnShift ? 'Shift started. You can now receive orders.' : 'Shift ended.',
    };
  }

  async getPerformance(userId: string) {
    if (Types.ObjectId.isValid(userId)) {
      const store = await this.storeModel.findById(userId);
      if (store) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayPicked = await this.staffModel.db
          .collection('orders')
          .countDocuments({
            storeId: store._id,
            status: { $in: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
            createdAt: { $gte: today },
          });

        return {
          todayPicked,
          avgPickTime: '2m 15s',
          avgPickTimeSeconds: 135,
          accuracy: 99.8,
          currentStreak: 12,
          totalOrdersPicked: todayPicked,
        };
      }
    }

    const staff = await this.staffModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!staff) {
      throw new BadRequestException('Staff profile not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPicked = await this.staffModel.db
      .collection('pick_lists')
      .countDocuments({
        pickerId: staff._id,
        status: 'COMPLETED',
        completedAt: { $gte: today },
      });

    return {
      todayPicked,
      avgPickTime: staff.avgPickTimeSeconds > 0
        ? `${Math.floor(staff.avgPickTimeSeconds / 60)}m ${staff.avgPickTimeSeconds % 60}s`
        : '—',
      avgPickTimeSeconds: staff.avgPickTimeSeconds || 0,
      accuracy: staff.totalOrdersPicked > 0 ? staff.accuracy : 100,
      currentStreak: staff.currentStreak || 0,
      totalOrdersPicked: staff.totalOrdersPicked || 0,
    };
  }

  async getHistory(userId: string) {
    let pickerId: any = null;
    if (Types.ObjectId.isValid(userId)) {
      const staff = await this.staffModel.findOne({ userId: new Types.ObjectId(userId) });
      if (staff) {
        pickerId = staff._id;
      }
    }

    if (!pickerId) {
      return [];
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const rawHistory = await this.staffModel.db
      .collection('pick_lists')
      .aggregate([
        {
          $match: {
            pickerId,
            status: 'COMPLETED',
            completedAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
            },
            ordersPicked: { $sum: 1 },
            avgPickTimeSeconds: { $avg: '$pickDurationSeconds' },
            exceptions: { $sum: '$exceptionCount' },
          },
        },
        { $sort: { _id: -1 } },
      ])
      .toArray();

    return rawHistory.map((h: any) => ({
      date: h._id,
      ordersPicked: h.ordersPicked || 0,
      avgPickTimeSeconds: Math.round(h.avgPickTimeSeconds || 0),
      avgTime: h.avgPickTimeSeconds
        ? `${Math.floor(h.avgPickTimeSeconds / 60)}m ${Math.round(h.avgPickTimeSeconds % 60)}s`
        : '—',
      exceptionCount: h.exceptions || 0,
      accuracy: h.ordersPicked > 0
        ? Math.max(0, 100 - (h.exceptions / h.ordersPicked) * 100).toFixed(1)
        : '—',
    }));
  }

  async getStaffProfile(userId: string): Promise<any> {
    if (Types.ObjectId.isValid(userId)) {
      const staff = await this.staffModel.findOne({ userId: new Types.ObjectId(userId) });
      if (staff) return staff;

      const store = await this.storeModel.findById(userId);
      if (store) {
        return {
          _id: store._id,
          userId: store._id,
          storeId: store._id,
          employeeCode: store.code,
          fullName: `${store.name} Staff`,
          email: `${store.loginId || 'store'}@wormup.com`,
          role: 'STORE_MANAGER',
          status: 'ACTIVE',
          isOnShift: true,
        };
      }
    }
    throw new BadRequestException('Store staff record not found for this account');
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'wormup_super_secure_access_token_secret_2026',
    );
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '30d');

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'wormup_super_secure_refresh_token_secret_2026',
    );
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { secret: accessSecret, expiresIn: accessExpiresIn }),
      this.jwtService.signAsync(payload, { secret: refreshSecret, expiresIn: refreshExpiresIn }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 30 * 24 * 3600,
    };
  }
}
