import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
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
import { SendOtpDto, VerifyOtpDto, RegisterDto, RegisterRiderDto } from './dto/auth.dto';
import { CoinTransaction, CoinTransactionDocument } from '../coins/schemas/coin-transaction.schema';
import { DeliveryPartner, DeliveryPartnerDocument } from '../delivery/schemas/delivery-partner.schema';
import { EmailService } from './email.service';
import { Role } from '../common/enums/role.enum';

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
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const isDelivery = dto.purpose === 'DELIVERY_LOGIN';

    if (isDelivery) {
      const email = (dto.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        throw new BadRequestException('Please provide a valid email address for delivery login');
      }

      const verificationId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      // 1. Generate secure 6-digit OTP
      const otp = this.emailService.generateOtp();
      const otpHash = this.emailService.hashOtp(otp);

      // 2. Persist verification session in MongoDB
      await this.otpModel.create({
        phone: email,
        email: email,
        verificationId,
        otpHash,
        status: 'pending',
        purpose: 'DELIVERY_LOGIN',
        expiresAt,
      });

      // 3. Dispatch OTP in background so mobile client transitions immediately
      this.emailService
        .sendOtpEmail(email, otp)
        .then((sent) => {
          if (sent) {
            this.logger.log(`[Rider Email OTP] Dispatched real OTP to ${email} (Session: ${verificationId})`);
          } else {
            this.logger.warn(`[Rider Email OTP] Failed to send email to ${email}`);
          }
        })
        .catch((err) => {
          this.logger.error(`[Rider Email OTP] Background send failed: ${err.message}`);
        });

      return {
        message: `OTP sent successfully to ${email}`,
        verificationId,
        status: 'pending',
        expiresInSeconds: 600,
      };
    }

    // Customer flow: Email OTP (or legacy phone if provided)
    const identifier = (dto.email || dto.phoneNumber || '').trim().toLowerCase();
    if (!identifier) {
      throw new BadRequestException('Please provide a valid email address');
    }

    const verificationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const otp = this.emailService.generateOtp();
    const otpHash = this.emailService.hashOtp(otp);

    await this.otpModel.create({
      phone: identifier,
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      verificationId,
      otpHash,
      status: 'pending',
      expiresAt,
    });

    if (dto.email) {
      this.emailService
        .sendOtpEmail(identifier, otp)
        .then((sent) => {
          if (sent) {
            this.logger.log(`[Email OTP] Dispatched to ${identifier} (Session: ${verificationId})`);
          } else {
            this.logger.warn(`[Email OTP] Failed to send email to ${identifier}`);
          }
        })
        .catch((err) => {
          this.logger.error(`[Email OTP] Background send failed: ${err.message}`);
        });
    } else {
      this.logger.log(`[SMS OTP] Code for ${identifier}: ${otp} (Session: ${verificationId})`);
    }

    return {
      message: `OTP sent successfully to ${identifier}`,
      verificationId,
      status: 'pending',
      expiresInSeconds: 600,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { verificationId, phoneNumber, email, otp, purpose } = dto;
    const isDelivery = purpose === 'DELIVERY_LOGIN';

    let record: OtpVerificationDocument | null = null;
    if (verificationId) {
      record = await this.otpModel.findOne({ verificationId });
    } else if (email) {
      const cleanEmail = email.trim().toLowerCase();
      record = await this.otpModel
        .findOne({ $or: [{ email: cleanEmail }, { phone: cleanEmail }], status: 'pending' })
        .sort({ createdAt: -1 });
    } else if (phoneNumber) {
      const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
      record = await this.otpModel
        .findOne({ phone: cleanPhone, status: 'pending' })
        .sort({ createdAt: -1 });
    }

    if (!record) {
      throw new BadRequestException('Invalid or expired verification session');
    }

    if (record.isVerified) {
      throw new BadRequestException('This verification session has already been used');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new code');
    }
    if (record.attempts >= 3) {
      throw new BadRequestException('Maximum verification attempts exceeded. Please request a new code');
    }

    // STRICT real OTP verification: match against cryptographic hash only
    const isApproved = this.emailService.verifyOtpHash(otp, record.otpHash || '');

    if (!isApproved) {
      record.attempts += 1;
      await record.save();
      throw new BadRequestException('Incorrect OTP. Please try again');
    }

    record.isVerified = true;
    record.verifiedAt = new Date();
    record.status = 'approved';
    await record.save();

    // ── Delivery Partner Verification Flow ─────────────────────────
    if (isDelivery) {
      const riderEmail = (record.email || record.phone || email || '').trim().toLowerCase();
      
      // Look for existing rider User and DeliveryPartner profile
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

      // Rider doesn't exist yet -> Prompt registration with verified email session
      return {
        isNewRider: true,
        isNewUser: true,
        verificationId: record.verificationId,
        email: riderEmail,
        message: 'Email verified. Please complete rider profile registration.',
      };
    }

    // ── Customer Verification Flow ────────────────────────────────
    const identifier = record ? record.phone : phoneNumber?.trim().replace(/\s+/g, '') || '';
    let user = await this.userModel.findOne({
      $or: [{ phone: identifier }, { email: identifier }, { phone: `+91${identifier}` }],
    });

    if (!user) {
      return {
        isNewUser: true,
        verificationId: record?.verificationId || crypto.randomUUID(),
        message: 'Identifier verified. Please complete account registration.',
      };
    }

    // Generate dual tokens
    const tokens = await this.generateTokens(user);
    return {
      isNewUser: false,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        walletBalance: user.walletBalance,
        shoppingCoins: user.shoppingCoins,
        role: user.role,
        birthday: user.birthday,
      },
      ...tokens,
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

    // 3. Enforce Uniqueness: ONE MOBILE NUMBER = ONE RIDER
    const existingPartnerWithPhone = await this.partnerModel.findOne({
      $or: [
        { phoneNumber: cleanPhone },
        { phoneNumber: formattedPhone },
        { phoneNumber: `+91 ${cleanPhone}` },
      ],
    });
    const existingUserWithPhone = await this.userModel.findOne({
      phone: { $in: [cleanPhone, formattedPhone, `+91 ${cleanPhone}`] },
      role: Role.DELIVERY_PARTNER,
    });

    if (existingPartnerWithPhone || existingUserWithPhone) {
      throw new ConflictException('Mobile number already registered with another rider');
    }

    // 4. Enforce Uniqueness: ONE EMAIL = ONE RIDER
    const existingPartnerWithEmail = await this.partnerModel.findOne({ email: verifiedEmail });
    if (existingPartnerWithEmail) {
      throw new ConflictException('Email address already registered with another rider');
    }

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

    // 6. Assign to active Hub
    const defaultHub = await this.partnerModel.db.collection('stores').findOne({
      $or: [
        { name: { $regex: new RegExp(city || 'Ahmedabad', 'i') } },
        { isActive: true },
      ],
    });

    const partnerCode = `RDR-${Math.floor(1000 + Math.random() * 9000)}`;
    const partner = await this.partnerModel.create({
      userId: user._id,
      partnerCode,
      fullName: fullName.trim(),
      phoneNumber: formattedPhone,
      email: verifiedEmail,
      city: city?.trim() || 'Ahmedabad',
      hubId: defaultHub?._id,
      hubName: defaultHub?.name || `${city?.trim() || 'Ahmedabad'} Hub`,
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

  async register(dto: RegisterDto) {
    const { verificationId, name, phone, referralCode } = dto;
    const otpRecord = await this.otpModel.findOne({ verificationId });

    if (!otpRecord || !otpRecord.isVerified) {
      throw new BadRequestException('Email must be verified before registration');
    }

    const email = otpRecord.phone; // stored as phone field

    // ── Smart Account Linking & Uniqueness ────────────────────────
    // 1. If account with this email already exists, update & log in
    const emailExists = await this.userModel.findOne({ email });
    if (emailExists) {
      if (name && name !== 'Customer') emailExists.name = name;
      if (phone && (!emailExists.phone || emailExists.phone.startsWith('email_'))) {
        emailExists.phone = phone;
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
          walletBalance: emailExists.walletBalance,
          shoppingCoins: emailExists.shoppingCoins,
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
        await phoneExists.save();
        const tokens = await this.generateTokens(phoneExists);
        return {
          message: 'Account verified and linked successfully',
          user: {
            id: phoneExists._id.toString(),
            name: phoneExists.name,
            phone: phoneExists.phone,
            email: phoneExists.email,
            walletBalance: phoneExists.walletBalance,
            shoppingCoins: phoneExists.shoppingCoins,
            role: phoneExists.role,
          },
          ...tokens,
        };
      }
    }
    // ───────────────────────────────────────────────────────────────

    let referredByUser: UserDocument | null = null;
    if (referralCode) {
      referredByUser = await this.userModel.findOne({
        referralCode: referralCode.toUpperCase(),
      });
    }

    const generatedRefCode = `WORM${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await this.userModel.create({
      name,
      email,
      phone: phone || `email_${crypto.randomBytes(4).toString('hex')}`, // placeholder if no phone
      referralCode: generatedRefCode,
      referredBy: referredByUser ? referredByUser._id : undefined,
      isPhoneVerified: false,
      isEmailVerified: true,
      walletBalance: 0,
      shoppingCoins: referredByUser ? 100 : 50,
    });

    // Welcome bonus coins record
    await this.coinTxModel.create({
      userId: user._id,
      type: 'BONUS',
      coins: user.shoppingCoins,
      balanceBefore: 0,
      balanceAfter: user.shoppingCoins,
      referenceType: 'REFERRAL',
      description: referredByUser ? 'Welcome + Referral Bonus Coins' : 'Welcome Reward Coins',
    });

    const tokens = await this.generateTokens(user);

    return {
      message: 'Account created successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        walletBalance: user.walletBalance,
        shoppingCoins: user.shoppingCoins,
        referralCode: user.referralCode,
        role: user.role,
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
}
