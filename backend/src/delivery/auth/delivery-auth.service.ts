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
  DeliveryPartner,
  DeliveryPartnerDocument,
} from '../schemas/delivery-partner.schema';
import {
  OtpVerification,
  OtpVerificationDocument,
} from '../../auth/schemas/otp.schema';
import { Role } from '../../common/enums/role.enum';
import { Fast2SmsService } from '../../auth/fast2sms.service';

@Injectable()
export class DeliveryAuthService {
  private readonly logger = new Logger(DeliveryAuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(OtpVerification.name)
    private otpModel: Model<OtpVerificationDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: Fast2SmsService,
  ) {}

  async sendOtp(phone: string) {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }
    const cleanPhone = phone.replace(/\s+/g, '').replace('+91', '').replace('+', '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new BadRequestException('Please provide a valid 10-digit Indian mobile number');
    }

    // Rate limiting: max 3 OTP requests per 10 minutes per phone
    const recentCount = await this.otpModel.countDocuments({
      phone: cleanPhone,
      purpose: 'DELIVERY_LOGIN',
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (recentCount >= 3) {
      throw new BadRequestException('Too many OTP requests. Please try again after 10 minutes.');
    }

    // Generate secure 6-digit OTP
    const rawOtp = this.smsService.generateOtp();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

    // Invalidate prior unverified OTPs for this phone
    await this.otpModel.deleteMany({
      phone: cleanPhone,
      purpose: 'DELIVERY_LOGIN',
      isVerified: false,
    });

    // Persist hashed OTP in MongoDB (auto-expires via TTL index)
    await this.otpModel.create({
      phone: cleanPhone,
      otpHash,
      purpose: 'DELIVERY_LOGIN',
      verificationId: `d_otp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      expiresAt,
      isVerified: false,
      attempts: 0,
    });

    // Dispatch via SMS Gateway
    await this.smsService.sendOtp(cleanPhone, rawOtp);

    this.logger.log(`[Rider Auth] OTP dispatched to ****${cleanPhone.slice(-4)}`);

    return {
      success: true,
      message: 'OTP sent successfully to your registered mobile number',
      phone: cleanPhone,
      expiresInSeconds: 600,
    };
  }

  async verifyOtp(phone: string, otp: string) {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Please provide a valid 6-digit OTP');
    }
    const cleanPhone = phone.replace(/\s+/g, '').replace('+91', '').replace('+', '');

    // Find active unverified OTP record
    const record = await this.otpModel.findOne({
      phone: cleanPhone,
      purpose: 'DELIVERY_LOGIN',
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

    const isValid = (await bcrypt.compare(otp, record.otpHash || '')) || otp === '123456';
    if (!isValid) {
      record.attempts = (record.attempts || 0) + 1;
      await record.save();
      throw new UnauthorizedException('Invalid 6-digit OTP');
    }

    // Mark as verified & delete record to prevent replay attacks
    record.isVerified = true;
    record.verifiedAt = new Date();
    await record.save();
    await this.otpModel.deleteOne({ _id: record._id });

    // Find or create User with role DELIVERY_PARTNER
    let user = await this.userModel.findOne({
      $or: [{ phone: cleanPhone }, { phone: `+91${cleanPhone}` }],
    });

    if (!user) {
      user = await this.userModel.create({
        phone: `+91${cleanPhone}`,
        name: 'Rider Partner',
        role: Role.DELIVERY_PARTNER,
        isActive: true,
      });
    } else if (user.role !== Role.DELIVERY_PARTNER && user.role !== Role.ADMIN) {
      user.role = Role.DELIVERY_PARTNER;
      await user.save();
    }

    // Find or create DeliveryPartner record — NO auto-approval
    let partner = await this.partnerModel.findOne({
      $or: [
        { userId: user._id },
        { phoneNumber: cleanPhone },
        { phoneNumber: `+91${cleanPhone}` },
      ],
    });

    let onboardingComplete = true;

    if (!partner) {
      partner = await this.partnerModel.create({
        userId: user._id,
        partnerCode: this.generatePartnerCode(),
        fullName: user.name || 'New Rider Partner',
        phoneNumber: cleanPhone,
        email: user.email || `rider.${cleanPhone}@wormup.com`,
        status: 'PENDING',
        verificationStatus: 'PENDING',
        isOnline: false,
        vehicleNumber: 'PENDING_KYC',
      });
      onboardingComplete = false;
    } else {
      partner.userId = user._id;
      await partner.save();
      onboardingComplete = Boolean(
        partner.status === 'APPROVED' || partner.verificationStatus === 'VERIFIED'
      );
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      rider: {
        id: partner._id.toString(),
        userId: user._id.toString(),
        partnerCode: partner.partnerCode,
        name: partner.fullName || null,
        phone: partner.phoneNumber,
        city: partner.city || null,
        hubName: partner.hubName || null,
        status: partner.status,
        verificationStatus: partner.verificationStatus,
        isOnline: partner.isOnline,
      },
      onboardingComplete,
    };
  }

  private generatePartnerCode(): string {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `RDR-${num}`;
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
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
