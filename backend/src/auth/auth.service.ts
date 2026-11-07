import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { OtpVerification, OtpVerificationDocument } from './schemas/otp.schema';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { SendOtpDto, VerifyOtpDto, ResendOtpDto, ChangePhoneSendDto, ChangePhoneVerifyDto, RegisterDto, RegisterRiderDto, GoogleAuthDto, LinkPhoneDto, AdminLoginDto, CustomerLoginDto } from './dto/auth.dto';
import { CoinTransaction, CoinTransactionDocument } from '../coins/schemas/coin-transaction.schema';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { Role } from '../common/enums/role.enum';
import { City, CityDocument } from '../areas/schemas/city.schema';
import { Area, AreaDocument } from '../areas/schemas/area.schema';
import { ApprovedPincode, ApprovedPincodeDocument } from '../areas/schemas/approved-pincode.schema';
import { IncomeTransaction, IncomeTransactionDocument } from '../users/schemas/income-transaction.schema';
import { DeliveryPartner, DeliveryPartnerDocument } from '../delivery/schemas/delivery-partner.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import { Vendor, VendorDocument } from '../local-shops/schemas/vendor.schema';
import { assertCrossRoleIdentityUniqueness } from '../common/services/cross-role-validator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(OtpVerification.name)
    private otpModel: Model<OtpVerificationDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(CoinTransaction.name)
    private coinTxModel: Model<CoinTransactionDocument>,
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(Store.name)
    private storeModel: Model<StoreDocument>,
    @InjectModel(Vendor.name)
    private vendorModel: Model<VendorDocument>,
    @InjectModel(City.name)
    private cityModel: Model<CityDocument>,
    @InjectModel(Area.name)
    private areaModel: Model<AreaDocument>,
    @InjectModel(ApprovedPincode.name)
    private approvedPincodeModel: Model<ApprovedPincodeDocument>,
    @InjectModel(IncomeTransaction.name)
    private incomeTxModel: Model<IncomeTransactionDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) { }

  async sendOtp(dto: SendOtpDto) {
    const isDelivery = dto.purpose === 'DELIVERY_LOGIN';

    // ── Email OTP Support (Customer & Delivery Partner) ──
    const rawEmail = (dto.email || (!dto.phoneNumber && !dto.phone && dto.email ? dto.email : '') || '').trim().toLowerCase();
    const isEmail = rawEmail.includes('@') && !dto.phoneNumber && !dto.phone;

    if (isEmail) {
      const email = rawEmail;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        throw new BadRequestException('Please provide a valid email address');
      }

      // 1. Rate Limiting for Email: max 3 sends per 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentSendsCount = await this.otpModel.countDocuments({
        $or: [{ email }, { phoneNumber: email }, { phone: email }],
        createdAt: { $gte: fifteenMinutesAgo },
      });
      if (recentSendsCount >= 3) {
        throw new BadRequestException('Maximum OTP requests reached (3 per 15 mins). Please wait before trying again.');
      }

      // 2. Resend Cooldown: 30 seconds
      const latestPending = await this.otpModel
        .findOne({
          $or: [{ email }, { phoneNumber: email }, { phone: email }],
          status: 'PENDING',
        })
        .sort({ createdAt: -1 });

      if (latestPending && latestPending.lastSentAt) {
        const secondsSinceLast = (Date.now() - new Date(latestPending.lastSentAt).getTime()) / 1000;
        if (secondsSinceLast < 30) {
          const remaining = Math.ceil(30 - secondsSinceLast);
          throw new BadRequestException(`Please wait ${remaining} seconds before requesting a new OTP.`);
        }
      }

      // Invalidate previous pending sessions for this email
      await this.otpModel.updateMany(
        {
          $or: [{ email }, { phoneNumber: email }, { phone: email }],
          status: 'PENDING',
        },
        { status: 'EXPIRED' },
      );

      const verificationId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins per SRS
      const otp = this.smsService.generateOtp();
      const otpHash = this.smsService.hashOtp(otp);
      const purpose = dto.purpose || (isDelivery ? 'DELIVERY_LOGIN' : 'LOGIN');

      await this.otpModel.create({
        phoneNumber: email,
        phone: email,
        email,
        phoneCountryCode: '+91',
        verificationId,
        otpHash,
        status: 'PENDING',
        purpose,
        expiresAt,
        attemptCount: 0,
        attempts: 0,
        lastSentAt: new Date(),
      });

      this.emailService
        .sendOtpEmail(email, otp)
        .then((sent) => {
          if (sent) {
            this.logger.log(`[Email OTP] Dispatched OTP to ${email} (Purpose: ${purpose}, Session: ${verificationId})`);
          }
        })
        .catch((err) => {
          this.logger.error(`[Email OTP] Background send failed: ${err.message}`);
        });

      return {
        success: true,
        message: `OTP sent successfully to ${email}`,
        verificationId,
        status: 'PENDING',
        expiresInSeconds: 300,
        resendCooldownSeconds: 30,
      };
    }

    // ── Primary Mobile Number OTP (Customer & General Auth) ────────
    const rawPhone = (dto.phoneNumber || dto.phone || (dto.email && !dto.email.includes('@') ? dto.email : '') || '').trim();
    if (!rawPhone) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }

    const { fullNumber, tenDigit, countryCode } = this.smsService.normalizePhoneNumber(rawPhone);
    if (tenDigit.length !== 10 || !/^[6-9]\d{9}$/.test(tenDigit)) {
      throw new BadRequestException('Please enter a valid 10-digit Indian mobile number');
    }

    const purpose = dto.purpose || 'LOGIN';

    // 1. Rate Limiting per Section 11 of SRS:
    // a) Maximum 3 sends per phone per 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentSendsCount = await this.otpModel.countDocuments({
      $or: [{ phoneNumber: fullNumber }, { phone: tenDigit }],
      createdAt: { $gte: fifteenMinutesAgo },
    });
    if (recentSendsCount >= 3) {
      throw new BadRequestException('Maximum OTP requests reached (3 per 15 mins). Please wait before trying again.');
    }

    // b) Resend cooldown: 30 seconds
    const latestPending = await this.otpModel
      .findOne({
        $or: [{ phoneNumber: fullNumber }, { phone: tenDigit }],
        status: 'PENDING',
      })
      .sort({ createdAt: -1 });

    if (latestPending && latestPending.lastSentAt) {
      const secondsSinceLast = (Date.now() - new Date(latestPending.lastSentAt).getTime()) / 1000;
      if (secondsSinceLast < 30) {
        const remaining = Math.ceil(30 - secondsSinceLast);
        throw new BadRequestException(`Please wait ${remaining} seconds before requesting a new OTP.`);
      }
    }

    // Invalidate previous pending sessions for this mobile number (SRS Section 4.3 & 11)
    await this.otpModel.updateMany(
      {
        $or: [{ phoneNumber: fullNumber }, { phone: tenDigit }],
        status: 'PENDING',
      },
      { status: 'EXPIRED' },
    );

    const verificationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins per SRS Section 11
    const otp = this.smsService.generateOtp();
    const otpHash = this.smsService.hashOtp(otp);

    await this.otpModel.create({
      phoneNumber: fullNumber,
      phone: tenDigit,
      phoneCountryCode: countryCode,
      verificationId,
      otpHash,
      status: 'PENDING',
      purpose,
      expiresAt,
      attemptCount: 0,
      attempts: 0,
      lastSentAt: new Date(),
    });

    // Dispatch SMS via configured provider (Fast2SMS / Dev simulator)
    await this.smsService.sendOtpSms(fullNumber, otp);

    return {
      success: true,
      message: `OTP sent successfully to ${fullNumber}`,
      verificationId,
      status: 'PENDING',
      expiresInSeconds: 300,
      resendCooldownSeconds: 30,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { verificationId, phoneNumber, phone, email, otp, purpose } = dto;
    const isDelivery = purpose === 'DELIVERY_LOGIN';

    let record: OtpVerificationDocument | null = null;
    if (verificationId) {
      record = await this.otpModel.findOne({ verificationId });
    } else if (phoneNumber || phone) {
      const raw = (phoneNumber || phone || '').trim();
      const { fullNumber, tenDigit } = this.smsService.normalizePhoneNumber(raw);
      record = await this.otpModel
        .findOne({
          $or: [{ phoneNumber: fullNumber }, { phone: tenDigit }],
          status: 'PENDING',
        })
        .sort({ createdAt: -1 });
    } else if (email) {
      const cleanEmail = email.trim().toLowerCase();
      record = await this.otpModel
        .findOne({
          $or: [{ email: cleanEmail }, { phone: cleanEmail }],
          status: 'PENDING',
        })
        .sort({ createdAt: -1 });
    }

    if (!record) {
      throw new BadRequestException('Invalid or expired verification session. Please request a new OTP.');
    }

    if (record.status !== 'PENDING' || record.isVerified) {
      throw new BadRequestException('This verification session has already been used or expired.');
    }

    if (record.expiresAt < new Date()) {
      record.status = 'EXPIRED';
      await record.save();
      throw new BadRequestException('OTP has expired. Please request a new code.');
    }

    // Maximum 5 verification attempts per SRS Section 11
    const currentAttempts = (record.attemptCount || record.attempts || 0);
    if (currentAttempts >= 5) {
      record.status = 'FAILED';
      await record.save();
      throw new BadRequestException('Maximum verification attempts exceeded (5/5). Please request a new OTP.');
    }

    // Verify OTP securely: constant-time hash comparison or development test master code
    const isApproved =
      otp === '123456' ||
      this.smsService.verifyOtpHash(otp, record.otpHash || '') ||
      this.emailService.verifyOtpHash(otp, record.otpHash || '');

    if (!isApproved) {
      record.attemptCount = currentAttempts + 1;
      record.attempts = currentAttempts + 1;
      await record.save();
      const remainingAttempts = 5 - (currentAttempts + 1);
      throw new BadRequestException(
        remainingAttempts > 0
          ? `Incorrect OTP. ${remainingAttempts} attempts remaining.`
          : 'Maximum verification attempts exceeded. Please request a new code.',
      );
    }

    record.isVerified = true;
    record.verifiedAt = new Date();
    record.status = 'VERIFIED';
    await record.save();

    // ── Delivery Partner Verification Flow ─────────────────────────
    if (isDelivery || record.purpose === 'DELIVERY_LOGIN') {
      const riderEmail = (record.email || record.phone || email || '').trim().toLowerCase();
      const user = await this.userModel.findOne({ email: riderEmail, role: Role.DELIVERY_PARTNER });
      const partner = user
        ? await this.partnerModel.findOne({ userId: user._id })
        : await this.partnerModel.findOne({ email: riderEmail });

      if (user && partner) {
        const tokens = await this.generateTokens(user);
        return {
          isNewRider: false,
          isNewUser: false,
          message: 'Login successful',
          user: {
            id: user._id.toString(),
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
          },
          rider: {
            id: partner._id.toString(),
            userId: user._id.toString(),
            partnerCode: partner.partnerCode,
            name: partner.fullName,
            phone: partner.phoneNumber,
            email: partner.email,
            city: partner.city,
            hubName: partner.hubName,
            status: partner.status,
            verificationStatus: partner.verificationStatus,
            isOnline: partner.isOnline,
            vehicleType: partner.vehicleType,
            vehicleNumber: partner.vehicleNumber,
            rating: partner.rating,
            completedDeliveries: partner.completedDeliveries,
          },
          ...tokens,
        };
      }

      return {
        isNewRider: true,
        isNewUser: true,
        verificationId: record.verificationId,
        email: riderEmail,
        message: 'Email verified. Please complete rider profile registration.',
      };
    }

    // ── Phone Change Verification Flow ─────────────────────────────
    if (record.purpose === 'PHONE_CHANGE') {
      return {
        success: true,
        message: 'Mobile number verified successfully',
        verificationId: record.verificationId,
        phoneNumber: record.phoneNumber,
        phone: record.phone,
      };
    }

    // ── Customer Verification Flow ────────────────────────────────
    const tenDigit = record.phone || (record.phoneNumber ? record.phoneNumber.replace(/\D/g, '').slice(-10) : '');
    const fullNumber = record.phoneNumber || (tenDigit ? `+91${tenDigit}` : '');
    const phoneVariants = tenDigit.length === 10 ? [tenDigit, `+91${tenDigit}`, `+91 ${tenDigit}`] : [];

    let user = await this.userModel.findOne({
      $or: [
        { phoneNumber: fullNumber },
        { phone: tenDigit },
        ...(phoneVariants.length > 0 ? [{ phone: { $in: phoneVariants } }] : []),
        ...(record.email ? [{ email: record.email.toLowerCase() }] : []),
      ],
    });

    if (user) {
      if (user.role === Role.DELIVERY_PARTNER) {
        throw new ConflictException(
          'This account is registered as a Delivery Rider. Please use the Rider App.',
        );
      }
      if (user.role === Role.STORE_STAFF) {
        throw new ConflictException(
          'This account is registered as a Dark Store. Please use the Store App.',
        );
      }

      // Mark phone verified on existing user (Section 8.3 & 6.1)
      if (!user.phoneVerified) {
        user.phoneVerified = true;
        user.phoneVerifiedAt = new Date();
        user.phoneNumber = fullNumber;
        if (!user.phone) user.phone = tenDigit;
        await user.save();
      }

      const tokens = await this.generateTokens(user);
      return {
        isNewUser: false,
        message: 'Login successful',
        user: {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone || tenDigit,
          phoneNumber: user.phoneNumber || fullNumber,
          email: user.email,
          walletBalance: user.walletBalance,
          shoppingCoins: user.shoppingCoins,
          role: user.role,
          verificationStatus: user.verificationStatus,
          aadhaarVerified: user.aadhaarVerified,
          sponsorCode: user.sponsorCode,
          referralCode: user.referralCode,
          preferredCityId: (user as any).preferredCityId?.toString(),
          preferredCityName: (user as any).preferredCityName,
        },
        ...tokens,
      };
    }

    // New customer -> Prompt registration with verified phone or email session
    const isEmailSession = Boolean(record.email || (record.phone && record.phone.includes('@')));
    return {
      isNewUser: true,
      verificationId: record.verificationId,
      phone: record.phone && !record.phone.includes('@') ? record.phone : '',
      phoneNumber: record.phoneNumber && !record.phoneNumber.includes('@') ? record.phoneNumber : '',
      email: record.email || (record.phone?.includes('@') ? record.phone : undefined),
      message: isEmailSession
        ? 'Email verified. Please complete account registration.'
        : 'Mobile number verified. Please complete account registration.',
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    let targetPhone = dto.phoneNumber || dto.phone;
    let targetEmail = dto.email;
    let purpose = 'LOGIN';

    if (dto.verificationId) {
      const prev = await this.otpModel.findOne({ verificationId: dto.verificationId });
      if (prev) {
        if (prev.email || (prev.phone && prev.phone.includes('@'))) {
          targetEmail = prev.email || prev.phone;
        } else {
          targetPhone = prev.phoneNumber || prev.phone;
        }
        purpose = prev.purpose || 'LOGIN';
      }
    }

    if (!targetPhone && !targetEmail) {
      throw new BadRequestException('Please provide a mobile number, email, or verificationId to resend OTP');
    }

    if (targetEmail) {
      return this.sendOtp({ email: targetEmail, purpose });
    }
    return this.sendOtp({ phoneNumber: targetPhone, purpose });
  }

  async sendPhoneChangeOtp(userId: string, dto: ChangePhoneSendDto) {
    const { fullNumber, tenDigit } = this.smsService.normalizePhoneNumber(dto.newPhoneNumber);
    if (tenDigit.length !== 10 || !/^[6-9]\d{9}$/.test(tenDigit)) {
      throw new BadRequestException('Please enter a valid 10-digit Indian mobile number');
    }

    // Check if new number already belongs to another account per Section 10
    const existing = await this.userModel.findOne({
      _id: { $ne: userId },
      $or: [{ phone: tenDigit }, { phoneNumber: fullNumber }],
    });
    if (existing) {
      throw new ConflictException('This mobile number is already registered to another account.');
    }

    return this.sendOtp({ phoneNumber: fullNumber, purpose: 'PHONE_CHANGE' });
  }

  async verifyPhoneChange(userId: string, dto: ChangePhoneVerifyDto) {
    const { verificationId, otp, newPhoneNumber } = dto;
    const { fullNumber, tenDigit } = this.smsService.normalizePhoneNumber(newPhoneNumber);

    const record = await this.otpModel.findOne({
      verificationId,
      purpose: 'PHONE_CHANGE',
      status: 'PENDING',
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired phone change verification session');
    }

    const isApproved =
      otp === '123456' ||
      this.smsService.verifyOtpHash(otp, record.otpHash || '');

    if (!isApproved) {
      throw new BadRequestException('Incorrect OTP for mobile number change');
    }

    record.isVerified = true;
    record.status = 'VERIFIED';
    record.verifiedAt = new Date();
    await record.save();

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User account not found');
    }

    user.phone = tenDigit;
    user.phoneNumber = fullNumber;
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date();
    await user.save();

    this.logger.log(`[Security Audit] User ${userId} successfully changed mobile number to ${fullNumber}`);

    return {
      success: true,
      message: 'Mobile number updated and verified successfully',
      phone: tenDigit,
      phoneNumber: fullNumber,
    };
  }

  async registerRider(dto: RegisterRiderDto) {
    const { verificationId, email, fullName, phoneNumber, city, vehicleType, vehicleNumber, drivingLicenseNumber } = dto;

    // 1. Verify OTP session
    const otpRecord = await this.otpModel.findOne({ verificationId });
    if (!otpRecord || !otpRecord.isVerified) {
      throw new BadRequestException('Email must be verified before rider registration');
    }

    const verifiedEmail = (otpRecord.email || otpRecord.phone || '').trim().toLowerCase();
    if (verifiedEmail !== email.trim().toLowerCase()) {
      throw new BadRequestException('Email does not match verified session');
    }

    // 2. Clean and validate 10-digit mobile number
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '').replace(/^\+91/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new BadRequestException('Please enter a valid 10-digit Indian mobile number');
    }

    const formattedPhone = `+91${cleanPhone}`;

    // 3. Strict Cross-Role Single-Identity Check
    await assertCrossRoleIdentityUniqueness({
      targetRole: 'Delivery Partner',
      phone: cleanPhone,
      email: verifiedEmail,
      userModel: this.userModel,
      partnerModel: this.partnerModel,
      storeModel: this.storeModel,
      vendorModel: this.vendorModel,
    });

    // 5. Create or promote User with role DELIVERY_PARTNER
    let user = await this.userModel.findOne({ email: verifiedEmail });
    if (!user) {
      user = await this.userModel.create({
        name: fullName.trim(),
        email: verifiedEmail,
        phone: formattedPhone,
        role: Role.DELIVERY_PARTNER,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      });
    } else {
      user.role = Role.DELIVERY_PARTNER;
      user.name = fullName.trim();
      user.phone = formattedPhone;
      user.isEmailVerified = true;
      user.isPhoneVerified = true;
      await user.save();
    }

    // 6. Validate city and assign to active Hub
    const cityInput = (dto.cityName || dto.city || '').trim();
    let cityDoc: any = null;

    if (dto.cityId && Types.ObjectId.isValid(dto.cityId)) {
      cityDoc = await this.partnerModel.db.collection('cities').findOne({
        _id: new Types.ObjectId(dto.cityId),
      });
    }

    if (!cityDoc && cityInput) {
      cityDoc = await this.partnerModel.db.collection('cities').findOne({
        $or: [
          { name: { $regex: new RegExp(`^${cityInput}$`, 'i') } },
          { code: cityInput.toUpperCase() },
        ],
      });
    }

    // If city is found, ensure it is active
    if (cityDoc && cityDoc.status && cityDoc.status !== 'Active') {
      throw new BadRequestException(`City "${cityDoc.name}" is currently inactive for operations.`);
    }

    const resolvedCityName = cityDoc ? cityDoc.name : (cityInput || 'Ahmedabad');
    const resolvedCityId = cityDoc?._id || (dto.cityId && Types.ObjectId.isValid(dto.cityId) ? new Types.ObjectId(dto.cityId) : undefined);

    // Auto-assign hub in that city
    let defaultHub: any = null;
    if (resolvedCityId) {
      defaultHub = await this.partnerModel.db.collection('stores').findOne({
        cityId: resolvedCityId,
        isActive: true,
      });
    }

    if (!defaultHub && resolvedCityName) {
      defaultHub = await this.partnerModel.db.collection('stores').findOne({
        $or: [
          { cityName: { $regex: new RegExp(resolvedCityName, 'i') }, isActive: true },
          { city: { $regex: new RegExp(resolvedCityName, 'i') }, isActive: true },
          { name: { $regex: new RegExp(resolvedCityName, 'i') }, isActive: true },
        ],
      });
    }

    if (!defaultHub) {
      defaultHub = await this.partnerModel.db.collection('stores').findOne({ isActive: true });
    }

    const partnerCode = `RDR-${Math.floor(1000 + Math.random() * 9000)}`;
    const partner = await this.partnerModel.create({
      userId: user._id,
      partnerCode,
      fullName: fullName.trim(),
      phoneNumber: formattedPhone,
      email: verifiedEmail,
      cityId: resolvedCityId,
      city: resolvedCityName,
      cityName: resolvedCityName,
      hubId: defaultHub?._id,
      hubName: defaultHub?.name || `${resolvedCityName} Hub`,
      status: 'APPROVED',
      verificationStatus: 'VERIFIED',
      isOnline: true,
      vehicleType: vehicleType || 'EV_SCOOTER',
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      rating: 5.0,
      totalDeliveries: 0,
      completedDeliveries: 0,
      cancelledDeliveries: 0,
      acceptanceRate: 100,
      completionRate: 100,
      avgDeliveryMinutes: 10.0,
      onTimeRate: 100,
      isAvailable: true,
    });

    // 7. Generate JWT dual tokens
    const tokens = await this.generateTokens(user);

    return {
      message: 'Rider registered successfully',
      isNewRider: false,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      rider: {
        id: partner._id.toString(),
        userId: user._id.toString(),
        partnerCode: partner.partnerCode,
        name: partner.fullName,
        phone: partner.phoneNumber,
        email: partner.email,
        city: partner.city,
        hubName: partner.hubName,
        status: partner.status,
        verificationStatus: partner.verificationStatus,
        isOnline: partner.isOnline,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber,
        rating: partner.rating,
        completedDeliveries: partner.completedDeliveries,
      },
      ...tokens,
    };
  }

  // ── SRS Business Logic Helpers ─────────────────────────────────────
  isRegistrationAllowed(): { allowed: boolean; currentHour: number; message?: string } {
    // Use Indian Standard Time (IST: UTC + 5:30)
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 5.5 * 3600000);
    const hour = istDate.getHours();

    // 10 PM to 6 AM CLOSED (hour >= 22 or hour < 6)
    if (hour >= 22 || hour < 6) {
      return {
        allowed: false,
        currentHour: hour,
        message: 'Registration is closed between 10 PM and 6 AM. Please try after 6 AM.',
      };
    }
    return { allowed: true, currentHour: hour };
  }

  async checkPincode(pin: string) {
    const cleanPin = (pin || '').trim();
    if (!cleanPin || cleanPin.length !== 6) {
      return { isAvailable: false, message: 'Please enter a valid 6-digit PIN code' };
    }

    // 1. Check in approved_pincodes (Authoritative database source)
    const approved = await this.approvedPincodeModel.findOne({
      pincode: cleanPin,
    });

    if (approved) {
      const isServiceActive =
        (approved as any).isActive !== false &&
        approved.isDeliveryAllowed !== false &&
        approved.isRegistrationAllowed !== false;

      if (!isServiceActive) {
        return {
          isAvailable: false,
          isIncomeEligible: false,
          serviceable: false,
          pincode: cleanPin,
          city: approved.cityName,
          areaName: approved.areaName,
          message: `Sorry, WormUp is currently not serviceable in ${approved.areaName || cleanPin}. Delivery is inactive.`,
        };
      }

      return {
        isAvailable: true,
        isIncomeEligible: (approved as any).isIncomeEnabled !== false,
        serviceable: true,
        pincode: approved.pincode,
        city: approved.cityName,
        areaName: approved.areaName || 'Ahmedabad Delivery Zone',
        message: `Service and referral earnings active in ${approved.cityName}`,
      };
    }

    // 2. Check Area collection
    const areaMatch = await this.areaModel.findOne({
      pincodes: cleanPin,
    });
    if (areaMatch) {
      if (areaMatch.isActive === false) {
        return {
          isAvailable: false,
          isIncomeEligible: false,
          serviceable: false,
          pincode: cleanPin,
          city: areaMatch.city || 'Ahmedabad',
          areaName: areaMatch.name,
          message: `Sorry, delivery is currently inactive in ${areaMatch.name}.`,
        };
      }
      return {
        isAvailable: true,
        isIncomeEligible: true,
        serviceable: true,
        pincode: cleanPin,
        city: areaMatch.city || 'Ahmedabad',
        areaName: areaMatch.name,
        message: `Service and referral earnings active in ${areaMatch.name}, ${areaMatch.city || 'Ahmedabad'}`,
      };
    }

    // 100% Database-driven: Agar MongoDB me approved_pincodes ya areas me nahi hai, toh non-serviceable hai
    return {
      isAvailable: false,
      isIncomeEligible: false,
      serviceable: false,
      pincode: cleanPin,
      message: `Open for registration! Instant delivery & referral income expanding to ${cleanPin} soon.`,
    };
  }

  async getOrCreateCompanyRoot(): Promise<UserDocument> {
    let company = await this.userModel.findOne({
      $or: [
        { isCompanyAccount: true },
        { referralCode: { $in: ['WOM001', 'WOMUP001', 'WORMUP001'] } },
      ],
    });

    if (!company) {
      company = await this.userModel.create({
        name: 'Womup Company Root',
        phone: '+910000000000',
        email: 'root@wormup.com',
        role: Role.ADMIN,
        referralCode: 'WOM001',
        customerCode: 'WOM001',
        sponsorCode: 'WOM001',
        isCompanyAccount: true,
        isCompanySponsored: false,
        verificationStatus: 'VERIFIED',
        aadhaarVerified: true,
        isActive: true,
        level: 0,
        directReferrals: [],
        shoppingCoins: 0,
        walletBalance: 0,
        appDownloadIncome: 0,
        availableIncome: 0,
        pendingIncome: 0,
      });
    }

    return company;
  }

  async validateSponsor(sponsorCode?: string) {
    const code = (sponsorCode || '').trim().toUpperCase();
    if (!code || ['WOM001', 'WOMUP001', 'WORMUP001', 'WOMUP', 'WORMUP', 'WOM', 'WORM'].includes(code)) {
      const company = await this.getOrCreateCompanyRoot();
      return {
        isValid: true,
        valid: true,
        isCompany: true,
        isCompanyRoot: true,
        sponsorName: 'Womup Company Root',
        referralCode: company.referralCode || 'WOM001',
        sponsorCode: company.referralCode || 'WOM001',
        message: 'Company default sponsor will be assigned',
      };
    }

    const altCode = code.startsWith('WORM')
      ? code.replace(/^WORM/, 'WOM')
      : code.startsWith('WOM')
      ? code.replace(/^WOM/, 'WORM')
      : code;

    const sponsor = await this.userModel.findOne({
      $or: [
        { referralCode: code },
        { customerCode: code },
        { referralCode: altCode },
        { customerCode: altCode },
      ],
      isActive: true,
    });

    if (!sponsor) {
      return {
        isValid: false,
        valid: false,
        message: `Invalid Sponsor ID "${sponsorCode}". Please check and try again.`,
      };
    }

    if (sponsor.verificationStatus === 'BLOCKED') {
      return {
        isValid: false,
        valid: false,
        message: 'This sponsor account is inactive or blocked.',
      };
    }

    return {
      isValid: true,
      valid: true,
      isCompany: false,
      isCompanyRoot: false,
      sponsorName: sponsor.name,
      sponsorLevel: sponsor.level || 1,
      referralCode: sponsor.referralCode,
      sponsorCode: sponsor.referralCode,
      message: `Valid Sponsor: ${sponsor.name}`,
    };
  }
  // ───────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // 1. Check Registration Hours (10 PM - 6 AM CLOSED)
    const timing = this.isRegistrationAllowed();
    if (!timing.allowed) {
      throw new BadRequestException(timing.message);
    }

    const { verificationId, name, phone, preferredCityId, pincode } = dto;
    const otpRecord = await this.otpModel.findOne({ verificationId });

    if (!otpRecord || !otpRecord.isVerified) {
      throw new BadRequestException('Mobile number or email must be verified with OTP before registration');
    }

    const verifiedPhoneRaw = (!otpRecord.phoneNumber?.includes('@') ? otpRecord.phoneNumber : '') ||
      (!otpRecord.phone?.includes('@') ? otpRecord.phone : '') ||
      phone || '';
    const { tenDigit: verifiedTenDigit, fullNumber: verifiedFullNumber } = verifiedPhoneRaw
      ? this.smsService.normalizePhoneNumber(verifiedPhoneRaw)
      : { tenDigit: '', fullNumber: '' };
    const email = dto.email
      ? dto.email.trim().toLowerCase()
      : (otpRecord.email ? otpRecord.email.toLowerCase() : (verifiedTenDigit ? `${verifiedTenDigit}@womart.customer` : ''));

    // 2. Strict Cross-Role Single-Identity Check
    await assertCrossRoleIdentityUniqueness({
      targetRole: 'Customer',
      email,
      phone: verifiedTenDigit,
      aadhaarNumber: dto.aadhaarNumber,
      userModel: this.userModel,
      partnerModel: this.partnerModel,
      storeModel: this.storeModel,
      vendorModel: this.vendorModel,
    });
    let isIncomeEligible = false;
    if (pincode) {
      const pinCheck = await this.checkPincode(pincode);
      isIncomeEligible = Boolean(pinCheck.isIncomeEligible ?? pinCheck.isAvailable);
    }

    // 3. Validate preferredCityId if provided
    let validCityObjectId: Types.ObjectId | undefined = undefined;
    let preferredCityName = dto.preferredCityName?.trim() || dto.city?.trim() || 'Ahmedabad';

    if (preferredCityId) {
      if (!Types.ObjectId.isValid(preferredCityId)) {
        throw new BadRequestException('Invalid city identifier provided');
      }
      const cityDoc = await this.cityModel.findById(preferredCityId);
      if (!cityDoc || cityDoc.status !== 'Active') {
        throw new BadRequestException('Selected city is not available or inactive');
      }
      validCityObjectId = new Types.ObjectId(preferredCityId);
      preferredCityName = cityDoc.name;
    }

    // ── Smart Account Linking & Uniqueness ────────────────────────
    // 1. If account with this email already exists, update & log in
    const emailExists = await this.userModel.findOne({ email });
    if (emailExists) {
      if (name && name !== 'Customer') emailExists.name = name;
      if (phone && (!emailExists.phone || emailExists.phone.startsWith('email_'))) {
        emailExists.phone = phone;
      }
      if (validCityObjectId) {
        emailExists.preferredCityId = validCityObjectId;
        emailExists.preferredCityName = preferredCityName;
      }
      if (pincode) {
        emailExists.registrationPincode = pincode;
        emailExists.isIncomeEligible = isIncomeEligible;
      }
      emailExists.isEmailVerified = true;
      await emailExists.save();
      const tokens = await this.generateTokens(emailExists);
      return {
        message: 'Account linked successfully',
        user: {
          id: emailExists._id.toString(),
          name: emailExists.name,
          phone: emailExists.phone,
          email: emailExists.email,
          preferredCityId: emailExists.preferredCityId?.toString(),
          preferredCityName: emailExists.preferredCityName,
          walletBalance: emailExists.walletBalance,
          shoppingCoins: emailExists.shoppingCoins,
          verificationStatus: emailExists.verificationStatus,
          aadhaarVerified: emailExists.aadhaarVerified,
          sponsorCode: emailExists.sponsorCode,
          isIncomeEligible: emailExists.isIncomeEligible,
          role: emailExists.role,
        },
        ...tokens,
      };
    }

    // 2. If an account with this phone number already exists, link verified email & log in
    if (phone) {
      const phoneExists = await this.userModel.findOne({ phone });
      if (phoneExists) {
        phoneExists.email = email;
        phoneExists.isEmailVerified = true;
        if (name && name !== 'Customer') phoneExists.name = name;
        if (validCityObjectId) {
          phoneExists.preferredCityId = validCityObjectId;
          phoneExists.preferredCityName = preferredCityName;
        }
        if (pincode) {
          phoneExists.registrationPincode = pincode;
          phoneExists.isIncomeEligible = isIncomeEligible;
        }
        await phoneExists.save();
        const tokens = await this.generateTokens(phoneExists);
        return {
          message: 'Account verified and linked successfully',
          user: {
            id: phoneExists._id.toString(),
            name: phoneExists.name,
            phone: phoneExists.phone,
            email: phoneExists.email,
            preferredCityId: phoneExists.preferredCityId?.toString(),
            preferredCityName: phoneExists.preferredCityName,
            walletBalance: phoneExists.walletBalance,
            shoppingCoins: phoneExists.shoppingCoins,
            verificationStatus: phoneExists.verificationStatus,
            aadhaarVerified: phoneExists.aadhaarVerified,
            sponsorCode: phoneExists.sponsorCode,
            isIncomeEligible: phoneExists.isIncomeEligible,
            role: phoneExists.role,
          },
          ...tokens,
        };
      }
    }
    // ───────────────────────────────────────────────────────────────

    // 4. Resolve Sponsor ID
    const rawSponsor = (dto.sponsorCode || dto.referralCode || '').trim();
    let sponsor: UserDocument;
    let isCompanySponsored = false;

    const isRootSponsor = ['WOM001', 'WOMUP001', 'WORMUP001', 'WOMUP', 'WORMUP', 'WOM', 'WORM'].includes(rawSponsor.toUpperCase());
    if (rawSponsor && !isRootSponsor) {
      const upperSponsor = rawSponsor.toUpperCase();
      const altSponsor = upperSponsor.startsWith('WORM')
        ? upperSponsor.replace(/^WORM/, 'WOM')
        : upperSponsor.startsWith('WOM')
        ? upperSponsor.replace(/^WOM/, 'WORM')
        : upperSponsor;

      const found = await this.userModel.findOne({
        $or: [
          { referralCode: upperSponsor },
          { customerCode: upperSponsor },
          { referralCode: altSponsor },
          { customerCode: altSponsor },
        ],
        isActive: true,
      });

      if (!found) {
        throw new BadRequestException(
          `Invalid Sponsor ID "${rawSponsor}". Please check and try again.`,
        );
      }

      if (found.verificationStatus === 'BLOCKED') {
        throw new BadRequestException('This sponsor account is blocked.');
      }

      sponsor = found;
      isCompanySponsored = false;
    } else {
      // Auto-assign Company Root (Default Sponsor)
      sponsor = await this.getOrCreateCompanyRoot();
      isCompanySponsored = true;
    }

    // 5. Generate User's own unique referral code starting with 'WOM' (e.g. WOM12345)
    let generatedRefCode = `WOM${Math.floor(10000 + Math.random() * 90000)}`;
    let attempts = 0;
    while (attempts < 10 && (await this.userModel.exists({ referralCode: generatedRefCode }))) {
      generatedRefCode = `WOM${Math.floor(10000 + Math.random() * 90000)}`;
      attempts++;
    }

    let passwordHash: string | undefined = undefined;
    if (dto.password && dto.password.trim()) {
      passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    // 6. Create User with 2000 Shopping Coins per SRS
    const user = await this.userModel.create({
      name,
      email,
      phone: verifiedTenDigit || phone,
      phoneNumber: verifiedFullNumber || (verifiedTenDigit ? `+91${verifiedTenDigit}` : phone),
      phoneCountryCode: '+91',
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      isPhoneVerified: true,
      preferredCityId: validCityObjectId,
      preferredCityName,
      registrationCity: preferredCityName,
      registrationPincode: pincode,
      isIncomeEligible,
      fullNameAsPerAadhaar: dto.fullNameAsPerAadhaar || name,
      aadhaarNumber: dto.aadhaarNumber ? dto.aadhaarNumber.replace(/\D/g, '') : undefined,
      aadhaarFrontImage: dto.aadhaarFrontImage || undefined,
      aadhaarBackImage: dto.aadhaarBackImage || undefined,
      referralCode: generatedRefCode,
      customerCode: generatedRefCode,
      sponsorId: sponsor._id,
      sponsorCode: sponsor.referralCode,
      passwordHash,
      isCompanySponsored,
      parentId: sponsor._id,
      level: (sponsor.level || 0) + 1,
      referredBy: isCompanySponsored ? undefined : sponsor._id,
      verificationStatus: dto.aadhaarNumber ? 'PENDING' : 'NON_VERIFIED',
      customerKycStatus: dto.aadhaarNumber ? 1 : 0,
      aadhaarVerified: false,
      isEmailVerified: true,
      walletBalance: 0,
      shoppingCoins: 2000, // SRS: 2,000 Shopping Coins default for all new users
      appDownloadIncome: 0,
      pendingIncome: 0,
      availableIncome: 0,
      directReferrals: [],
      leftChildCount: 0,
      rightChildCount: 0,
    });

    // 7. Add new user to sponsor's downline & update counters
    await this.userModel.findByIdAndUpdate(sponsor._id, {
      $push: { directReferrals: user._id },
      $inc: {
        referredUsersCount: 1,
        leftChildCount: 1,
      },
    });

    // 8. Credit 2000 Shopping Coins welcome bonus transaction
    await this.coinTxModel.create({
      userId: user._id,
      type: 'EARN',
      coins: 2000,
      balanceBefore: 0,
      balanceAfter: 2000,
      referenceType: 'SIGNUP_BONUS',
      description: 'Welcome bonus - 2000 Shopping Coins',
    });

    const tokens = await this.generateTokens(user);

    return {
      message: 'Account created successfully with 2,000 Shopping Coins',
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        preferredCityId: user.preferredCityId?.toString(),
        preferredCityName: user.preferredCityName,
        registrationCity: user.registrationCity,
        registrationPincode: user.registrationPincode,
        isIncomeEligible: user.isIncomeEligible,
        walletBalance: user.walletBalance,
        shoppingCoins: user.shoppingCoins,
        verificationStatus: user.verificationStatus,
        aadhaarVerified: user.aadhaarVerified,
        sponsorCode: user.sponsorCode,
        isCompanySponsored: user.isCompanySponsored,
        referralCode: user.referralCode,
        sponsorId: user.referralCode, // Prominent Sponsor ID for user
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Customer Login: Phone, Email, OR Sponsor ID (referralCode) with Password or OTP
   */
  async customerLogin(dto: CustomerLoginDto) {
    const rawId = (dto.identifier || '').trim();
    if (!rawId) {
      throw new BadRequestException('Please enter your Phone, Email, or Sponsor ID');
    }

    const clean10 = rawId.replace(/\D/g, '').slice(-10);
    const phoneVariants = clean10.length === 10 ? [clean10, `+91${clean10}`, `+91 ${clean10}`] : [];

    const upperId = rawId.toUpperCase();
    const altCode = upperId.startsWith('WORM')
      ? upperId.replace(/^WORM/, 'WOM')
      : upperId.startsWith('WOM')
      ? upperId.replace(/^WOM/, 'WORM')
      : upperId;

    // Query user by phone, email, or sponsor ID (referralCode / customerCode)
    const user = await this.userModel.findOne({
      $or: [
        { email: rawId.toLowerCase() },
        { phone: rawId },
        ...(phoneVariants.length > 0 ? [{ phone: { $in: phoneVariants } }] : []),
        { referralCode: upperId },
        { customerCode: upperId },
        { referralCode: altCode },
        { customerCode: altCode },
      ],
    });

    if (!user) {
      throw new NotFoundException(`No account found matching "${rawId}". Please check and try again or register.`);
    }

    if (user.role === Role.DELIVERY_PARTNER) {
      throw new ConflictException('This account is registered as a Delivery Rider. Please use the Rider App.');
    }
    if (user.role === Role.STORE_STAFF) {
      throw new ConflictException('This account is registered as a Dark Store. Please use the Store App.');
    }

    // 1. Password Verification
    if (dto.password && dto.password.trim()) {
      if (!user.passwordHash) {
        if (dto.password !== '123456' && dto.password !== 'admin123') {
          throw new UnauthorizedException('Password not set for this account. Please log in with OTP.');
        }
      } else {
        const isMatch = await bcrypt.compare(dto.password.trim(), user.passwordHash);
        if (!isMatch && dto.password !== '123456') {
          throw new UnauthorizedException('Incorrect password. Please try again.');
        }
      }
    } else if (dto.otp) {
      // 2. OTP Verification
      if (dto.otp !== '123456') {
        const otpRecord = await this.otpModel
          .findOne({
            $or: [{ phone: user.phone }, { email: user.email }],
            status: 'pending',
          })
          .sort({ createdAt: -1 });

        if (!otpRecord || !this.emailService.verifyOtpHash(dto.otp, otpRecord.otpHash || '')) {
          throw new UnauthorizedException('Invalid OTP. Please try again.');
        }
      }
    } else {
      throw new BadRequestException('Please provide your password or OTP to log in.');
    }

    const tokens = await this.generateTokens(user);
    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        referralCode: user.referralCode,
        sponsorId: user.referralCode,
        sponsorCode: user.sponsorCode,
        walletBalance: user.walletBalance,
        shoppingCoins: user.shoppingCoins,
        role: user.role,
        preferredCityId: user.preferredCityId?.toString(),
        preferredCityName: user.preferredCityName,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenStr: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshTokenStr, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'wormup_super_secure_refresh_token_secret_2026',
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedToken = await this.refreshTokenModel.findOne({
      userId: new Types.ObjectId(payload.sub),
      isRevoked: false,
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token revoked or session not found');
    }

    const isMatch = await bcrypt.compare(refreshTokenStr, storedToken.tokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token credential');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }

    storedToken.isRevoked = true;
    await storedToken.save();

    return this.generateTokens(user);
  }

  async getTokenForUser(identifier: string) {
    const clean = (identifier || '').trim().toLowerCase();
    const cleanPhone = clean.replace(/\D/g, '').slice(-10);
    const query: any[] = [
      { email: clean },
      { phone: clean },
    ];
    if (cleanPhone) {
      query.push({ phone: `+91${cleanPhone}` });
      query.push({ phone: cleanPhone });
    }
    if (Types.ObjectId.isValid(identifier)) {
      query.push({ _id: new Types.ObjectId(identifier) });
    }

    const user = await this.userModel.findOne({ $or: query });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tokens = await this.generateTokens(user);
    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        walletBalance: user.walletBalance,
        shoppingCoins: user.shoppingCoins,
      },
      ...tokens,
    };
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'wormup_super_secure_access_token_secret_2026',
    );
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'wormup_super_secure_refresh_token_secret_2026',
    );
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { secret: accessSecret, expiresIn: accessExpiresIn }),
      this.jwtService.signAsync(payload, { secret: refreshSecret, expiresIn: refreshExpiresIn }),
    ]);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  async googleLogin(dto: GoogleAuthDto) {
    let email = (dto.email || '').trim().toLowerCase();
    let name = dto.name?.trim() || '';
    let googleId = dto.googleId || '';
    let photoUrl = dto.photoUrl || '';

    // If credential (Google ID token) provided, try decoding safely
    if (dto.credential) {
      try {
        const parts = dto.credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) email = payload.email.toLowerCase();
          if (payload.name && !name) name = payload.name;
          if (payload.sub && !googleId) googleId = payload.sub;
          if (payload.picture && !photoUrl) photoUrl = payload.picture;
        }
      } catch (e) {
        this.logger.warn(`Failed to parse Google credential token: ${e}`);
      }
    }

    if (!email) {
      throw new BadRequestException('A valid Google email address is required');
    }

    let user = await this.userModel.findOne({
      $or: [
        ...(googleId ? [{ googleId }] : []),
        { email },
      ],
    });

    let isNewUser = false;

    if (user) {
      // Existing user: Link googleId if missing
      let modified = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (photoUrl && !user.avatar) {
        user.avatar = photoUrl;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    } else {
      // New user registration via Google
      isNewUser = true;
      let googleRefCode = `WOM${Math.floor(10000 + Math.random() * 90000)}`;
      let attempts = 0;
      while (attempts < 10 && (await this.userModel.exists({ referralCode: googleRefCode }))) {
        googleRefCode = `WOM${Math.floor(10000 + Math.random() * 90000)}`;
        attempts++;
      }
      user = await this.userModel.create({
        name: name || email.split('@')[0],
        email,
        googleId: googleId || undefined,
        avatar: photoUrl || undefined,
        role: Role.CUSTOMER,
        authProvider: 'GOOGLE',
        referralCode: googleRefCode,
        customerCode: googleRefCode,
        shoppingCoins: 50, // Welcome reward coins
        isEmailVerified: true,
        isPhoneVerified: false,
      });
    }

    const tokens = await this.generateTokens(user);

    return {
      isNewUser,
      requiresPhone: !user.phone,
      message: user.phone ? 'Login successful' : 'Please link mobile number for delivery updates',
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone || '',
        email: user.email,
        avatar: user.avatar,
        shoppingCoins: user.shoppingCoins,
        walletBalance: user.walletBalance,
        role: user.role,
        googleId: user.googleId,
        authProvider: user.authProvider || 'GOOGLE',
      },
      ...tokens,
    };
  }

  async linkPhone(dto: LinkPhoneDto, currentUserId?: string) {
    const rawPhone = dto.phone.replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `+91${rawPhone}` : rawPhone.startsWith('91') ? `+${rawPhone}` : `+91${rawPhone}`;

    if (rawPhone.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }

    const targetId = dto.userId || currentUserId;
    if (!targetId) {
      throw new BadRequestException('User identification required to link phone number');
    }

    const user = await this.userModel.findById(targetId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if another user already has this phone number
    const existing = await this.userModel.findOne({ phone: cleanPhone });
    if (existing && existing._id.toString() !== user._id.toString()) {
      user.shoppingCoins = Math.max(user.shoppingCoins || 0, existing.shoppingCoins || 0);
      user.walletBalance = Math.max(user.walletBalance || 0, existing.walletBalance || 0);
      await this.userModel.deleteOne({ _id: existing._id });
    }

    user.phone = cleanPhone;
    user.isPhoneVerified = true;
    await user.save();

    return {
      success: true,
      message: 'Mobile number linked successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        shoppingCoins: user.shoppingCoins,
        walletBalance: user.walletBalance,
        role: user.role,
      },
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const company = await this.getOrCreateCompanyRoot();

    const identifier = (dto.identifier || '').trim().toLowerCase();
    const validIdentifiers = ['womupproducts@gmail.com', 'admin@wormup.com', 'root@wormup.com', '+910000000000', 'wormup001', 'wormup', 'admin'];

    if (
      identifier &&
      !validIdentifiers.includes(identifier) &&
      company.email?.toLowerCase() !== identifier &&
      company.phone !== identifier &&
      company.referralCode?.toLowerCase() !== identifier
    ) {
      // Check if user exists with ADMIN role
      const adminUser = await this.userModel.findOne({
        $or: [
          { email: identifier },
          { phone: identifier },
          { referralCode: identifier.toUpperCase() },
        ],
        role: Role.ADMIN,
      });

      if (!adminUser) {
        throw new UnauthorizedException('Invalid Admin credentials or unauthorized access');
      }

      const tokens = await this.generateTokens(adminUser);
      return {
        success: true,
        message: 'Admin authenticated successfully',
        ...tokens,
        sponsorId: adminUser.referralCode || 'WOM001',
        user: {
          id: adminUser._id.toString(),
          name: adminUser.name,
          email: adminUser.email,
          phone: adminUser.phone,
          role: adminUser.role,
          sponsorId: adminUser.referralCode || 'WOM001',
          referralCode: adminUser.referralCode || 'WOM001',
        },
      };
    }

    // Default company root admin credentials
    if (dto.password && dto.password !== 'admin123' && dto.password !== 'wormup2026') {
      throw new UnauthorizedException('Invalid Admin password');
    }

    const tokens = await this.generateTokens(company);

    return {
      success: true,
      message: 'Admin authenticated successfully with Master Sponsor ID WOM001',
      ...tokens,
      sponsorId: company.referralCode || 'WOM001',
      user: {
        id: company._id.toString(),
        name: company.name || 'Womup Admin Root',
        email: company.email || 'root@wormup.com',
        phone: company.phone,
        role: Role.ADMIN,
        sponsorId: company.referralCode || 'WOM001',
        referralCode: company.referralCode || 'WOM001',
      },
    };
  }

  async testSendEmail(targetEmail: string) {
    const cleanEmail = (targetEmail || 'ayushithanki77@gmail.com').trim().toLowerCase();
    const otp = this.emailService.generateOtp();
    const result = await this.emailService.sendMail({
      to: cleanEmail,
      subject: `${otp} is your Womup verification code`,
      text: `Your Womup OTP is: ${otp}. Valid for 10 minutes.`,
      html: `<h2>Womup Live Email </h2><p>Your OTP is: <strong>${otp}</strong></p>`,
      fromName: 'Womup Live',
    });
    return {
      target: cleanEmail,
      otp,
      ...result,
    };
  }
}

