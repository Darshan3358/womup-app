import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TwilioSDK from 'twilio';
const twilio = (TwilioSDK as any).default || TwilioSDK;

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private twilioClient: any = null;
  private readonly verifyServiceSid: string | undefined;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');

    if (accountSid && authToken) {
      try {
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log(
          `Twilio Verify Client initialized successfully with Account SID: ${accountSid} (Service: ${this.verifyServiceSid})`,
        );
      } catch (err: any) {
        this.logger.error(`Failed to initialize Twilio client: ${err.message}`);
      }
    } else {
      this.logger.warn('Twilio Account SID or Auth Token missing in environment.');
    }
  }

  /**
   * Dispatch real carrier SMS via Twilio Verify
   */
  async sendVerification(phone: string): Promise<any> {
    if (!this.twilioClient || !this.verifyServiceSid) {
      throw new InternalServerErrorException('Twilio Verify service is not properly configured.');
    }

    try {
      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({ to: phone, channel: 'sms' });

      this.logger.log(`[Twilio Verify] Real carrier SMS dispatched to ${phone}, Status: ${verification.status}`);
      return verification;
    } catch (err: any) {
      this.logger.error(`[Twilio Verify Error] ${err.message}`);
      throw new BadRequestException(
        err.message || 'Failed to dispatch SMS through Twilio Verify',
      );
    }
  }

  /**
   * Check verification code directly with Twilio Verify
   */
  async checkVerification(phone: string, code: string): Promise<boolean> {
    if (!this.twilioClient || !this.verifyServiceSid) {
      throw new InternalServerErrorException('Twilio Verify service is not properly configured.');
    }

    try {
      const check = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({ to: phone, code });

      this.logger.log(`[Twilio Verify Check] Phone: ${phone}, Result: ${check.status}`);
      return check.status === 'approved';
    } catch (err: any) {
      this.logger.error(`[Twilio Verify Check Error] ${err.message}`);
      return false;
    }
  }
}
