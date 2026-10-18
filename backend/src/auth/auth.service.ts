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
import { SendOtpDto, VerifyOtpDto, RegisterDto, RegisterRiderDto, GoogleAuthDto, LinkPhoneDto, AdminLoginDto } from './dto/auth.dto';
import { CoinTransaction, CoinTransactionDocument } from '../coins/schemas/coin-transaction.schema';
import { EmailService } from './email.service';
import { Role } from '../common/enums/role.enum';
import { City, CityDocument } from '../areas/schemas/city.schema';
import { Area, AreaDocument } from '../areas/schemas/area.schema';
import { ApprovedPincode, ApprovedPincodeDocument } from '../areas/schemas/approved-pincode.schema';
import { IncomeTransaction, IncomeTransactionDocument } from '../users/schemas/income-transaction.schema';
import { DeliveryPartner, DeliveryPartnerDocument } from '../delivery/schemas/delivery-partner.schema';

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
  ) { }

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

    // Real OTP verification: match strictly against cryptographic hash
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
        preferredCityId: (user as any).preferredCityId?.toString(),
        preferredCityName: (user as any).preferredCityName,
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

    // 1. Check in approved_pincodes
    const approved = await this.approvedPincodeModel.findOne({
      pincode: cleanPin,
      isRegistrationAllowed: true,
    });

    if (approved) {
      return {
        isAvailable: true,
        serviceable: true,
        pincode: approved.pincode,
        city: approved.cityName,
        areaName: approved.areaName || 'Ahmedabad Delivery Zone',
        message: `Service available in ${approved.cityName}`,
      };
    }

    // 2. Check Area collection
    const areaMatch = await this.areaModel.findOne({
      pincodes: cleanPin,
      isActive: true,
    });
    if (areaMatch) {
      return {
        isAvailable: true,
        serviceable: true,
        pincode: cleanPin,
        city: areaMatch.city || 'Ahmedabad',
        areaName: areaMatch.name,
        message: `Service available in ${areaMatch.name}, ${areaMatch.city || 'Ahmedabad'}`,
      };
    }

    // 3. Fallback approved launch pincodes
    const defaultApprovedPins = [
      '380015', '380054', '382481', '380009', '380058', '380061',
      '380001', '380006', '380051', '380052', '380059', '382424', '382480',
    ];

    if (defaultApprovedPins.includes(cleanPin)) {
      await this.approvedPincodeModel.findOneAndUpdate(
        { pincode: cleanPin },
        {
          pincode: cleanPin,
          cityName: 'Ahmedabad',
          isRegistrationAllowed: true,
          isDeliveryAllowed: true,
          areaName: 'Ahmedabad City',
        },
        { upsert: true },
      );
      return {
        isAvailable: true,
        serviceable: true,
        pincode: cleanPin,
        city: 'Ahmedabad',
        areaName: 'Ahmedabad City',
        message: 'Service is available in Ahmedabad',
      };
    }

    return {
      isAvailable: false,
      serviceable: false,
      pincode: cleanPin,
      message: `Sorry, WormUp is not available in pincode ${cleanPin} yet. We'll notify you when we launch!`,
    };
  }

  async getOrCreateCompanyRoot(): Promise<UserDocument> {
    let company = await this.userModel.findOne({
      $or: [{ isCompanyAccount: true }, { referralCode: 'WORMUP001' }],
    });

    if (!company) {
      company = await this.userModel.create({
        name: 'WormUp Company Root',
        phone: '+910000000000',
        email: 'root@wormup.com',
        role: Role.ADMIN,
        referralCode: 'WORMUP001',
        sponsorCode: 'WORMUP001',
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
    if (!code || code === 'WORMUP001' || code === 'WORMUP') {
      const company = await this.getOrCreateCompanyRoot();
      return {
        isValid: true,
        valid: true,
        isCompany: true,
        isCompanyRoot: true,
        sponsorName: 'WormUp Company Root',
        referralCode: company.referralCode,
        sponsorCode: company.referralCode,
        message: 'Company default sponsor will be assigned',
      };
    }

    const sponsor = await this.userModel.findOne({
      referralCode: code,
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
      throw new BadRequestException('Email must be verified before registration');
    }

    const email = otpRecord.phone; // stored as phone field

    // 2. Validate PIN Code if provided
    if (pincode) {
      const pinCheck = await this.checkPincode(pincode);
      if (!pinCheck.isAvailable) {
        throw new BadRequestException(pinCheck.message);
      }
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

    if (rawSponsor && rawSponsor.toUpperCase() !== 'WORMUP001' && rawSponsor.toUpperCase() !== 'WORMUP') {
      const found = await this.userModel.findOne({
        referralCode: rawSponsor.toUpperCase(),
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

    // 5. Generate User's own unique referral code
    const generatedRefCode = `WORM${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Create User with 2000 Shopping Coins per SRS
    const user = await this.userModel.create({
      name,
      email,
      phone: phone || `email_${crypto.randomBytes(4).toString('hex')}`,
      preferredCityId: validCityObjectId,
      preferredCityName,
      registrationCity: preferredCityName,
      registrationPincode: pincode,
      fullNameAsPerAadhaar: dto.fullNameAsPerAadhaar || name,
      referralCode: generatedRefCode,
      sponsorId: sponsor._id,
      sponsorCode: sponsor.referralCode,
      isCompanySponsored,
      parentId: sponsor._id,
      level: (sponsor.level || 0) + 1,
      referredBy: isCompanySponsored ? undefined : sponsor._id,
      verificationStatus: 'NON_VERIFIED',
      aadhaarVerified: false,
      isPhoneVerified: false,
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
        walletBalance: user.walletBalance,
        shoppingCoins: user.shoppingCoins,
        verificationStatus: user.verificationStatus,
        aadhaarVerified: user.aadhaarVerified,
        sponsorCode: user.sponsorCode,
        isCompanySponsored: user.isCompanySponsored,
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
      user = await this.userModel.create({
        name: name || email.split('@')[0],
        email,
        googleId: googleId || undefined,
        avatar: photoUrl || undefined,
        role: Role.CUSTOMER,
        authProvider: 'GOOGLE',
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
    const validIdentifiers = ['admin@wormup.com', 'root@wormup.com', '+910000000000', 'wormup001', 'wormup', 'admin'];

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
        sponsorId: adminUser.referralCode || 'WORMUP001',
        user: {
          id: adminUser._id.toString(),
          name: adminUser.name,
          email: adminUser.email,
          phone: adminUser.phone,
          role: adminUser.role,
          sponsorId: adminUser.referralCode || 'WORMUP001',
          referralCode: adminUser.referralCode || 'WORMUP001',
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
      message: 'Admin authenticated successfully with Master Sponsor ID WORMUP001',
      ...tokens,
      sponsorId: company.referralCode || 'WORMUP001',
      user: {
        id: company._id.toString(),
        name: company.name || 'WormUp Admin Root',
        email: company.email || 'root@wormup.com',
        phone: company.phone,
        role: Role.ADMIN,
        sponsorId: company.referralCode || 'WORMUP001',
        referralCode: company.referralCode || 'WORMUP001',
      },
    };
  }

  async testSendEmail(targetEmail: string) {
    const cleanEmail = (targetEmail || 'ayushithanki77@gmail.com').trim().toLowerCase();
    const otp = this.emailService.generateOtp();
    const result = await this.emailService.sendMail({
      to: cleanEmail,
      subject: `${otp} is your Worm Up verification code`,
      text: `Your Worm Up OTP is: ${otp}. Valid for 10 minutes.`,
      html: `<h2>Worm Up Live Email </h2><p>Your OTP is: <strong>${otp}</strong></p>`,
      fromName: 'Worm Up Live',
    });
    return {
      target: cleanEmail,
      otp,
      ...result,
    };
  }
}

