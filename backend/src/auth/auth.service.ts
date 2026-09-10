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
import { SendOtpDto, VerifyOtpDto, RegisterDto } from './dto/auth.dto';
import { CoinTransaction, CoinTransactionDocument } from '../coins/schemas/coin-transaction.schema';
import { EmailService } from './email.service';

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
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const verificationId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 1. Generate secure 6-digit OTP
    const otp = this.emailService.generateOtp();
    const otpHash = this.emailService.hashOtp(otp);

    // 2. Persist verification session in MongoDB
    await this.otpModel.create({
      phone: email, // reusing phone field to store email (identifier)
      verificationId,
      otpHash,
      status: 'pending',
      expiresAt,
    });

    // 3. Send OTP via Email
    await this.emailService.sendOtpEmail(email, otp);

    this.logger.log(`[Email OTP] Dispatched to ${email} (Session: ${verificationId})`);

    return {
      message: `OTP sent successfully to ${email}`,
      verificationId,
      status: 'pending',
      expiresInSeconds: 600,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { verificationId, otp } = dto;
    const record = await this.otpModel.findOne({ verificationId });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification session');
    }

    if (record.isVerified) {
      throw new BadRequestException('This verification session has already been used');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new code');
    }

    if (record.attempts >= 5) {
      throw new BadRequestException('Maximum verification attempts exceeded');
    }

    // Verify code against stored hash
    const isApproved = this.emailService.verifyOtpHash(otp, record.otpHash || '');
    if (!isApproved) {
      record.attempts += 1;
      await record.save();
      throw new BadRequestException('Incorrect OTP. Please check your email and try again');
    }

    record.isVerified = true;
    record.status = 'approved';
    await record.save();

    // record.phone holds the email (identifier)
    const email = record.phone;

    // Check if user already exists with this email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return {
        isNewUser: true,
        verificationId,
        message: 'Email verified. Please complete account registration.',
      };
    }

    // Existing user: Generate dual tokens
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
