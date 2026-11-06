import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly fast2smsKey?: string;
  private readonly isProduction: boolean;
  private readonly testOtp?: string;

  constructor(private readonly configService: ConfigService) {
    this.fast2smsKey = this.configService.get<string>('FAST2SMS_API_KEY');
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.testOtp = !this.isProduction ? this.configService.get<string>('TEST_OTP') : undefined;

    if (this.fast2smsKey) {
      this.logger.log('SmsService initialized with Fast2SMS delivery gateway');
    } else {
      this.logger.warn('FAST2SMS_API_KEY not configured — Running in DEV OTP logging mode (SMS printed in console)');
    }
  }

  /**
   * Generate cryptographically secure random 6-digit OTP
   */
  generateOtp(): string {
    const min = 100000;
    const max = 999999;
    return String(crypto.randomInt(min, max + 1));
  }

  /**
   * SHA-256 hash for secure DB storage (Never store plain text OTP)
   */
  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Timing-safe verification against stored hash
   */
  verifyOtpHash(submittedOtp: string, storedHash: string): boolean {
    if (!submittedOtp || !storedHash) return false;
    const submittedHash = this.hashOtp(submittedOtp);
    try {
      const a = Buffer.from(submittedHash, 'hex');
      const b = Buffer.from(storedHash, 'hex');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return submittedHash === storedHash;
    }
  }

  /**
   * Clean and normalize Indian 10-digit mobile number with +91 country code
   */
  normalizePhoneNumber(rawInput: string): { fullNumber: string; tenDigit: string; countryCode: string } {
    const digitsOnly = (rawInput || '').replace(/\D/g, '');
    let tenDigit = digitsOnly;
    if (digitsOnly.length > 10 && digitsOnly.startsWith('91')) {
      tenDigit = digitsOnly.slice(-10);
    } else if (digitsOnly.length > 10 && digitsOnly.startsWith('0')) {
      tenDigit = digitsOnly.slice(1, 11);
    } else {
      tenDigit = digitsOnly.slice(-10);
    }
    const countryCode = '+91';
    const fullNumber = `${countryCode}${tenDigit}`;
    return { fullNumber, tenDigit, countryCode };
  }

  /**
   * Dispatch OTP SMS to mobile number via configured SMS provider
   * Provider-independent: Can plug in Fast2SMS, Twilio, MSG91, AWS SNS, etc.
   */
  async sendOtpSms(phoneNumber: string, otp: string): Promise<boolean> {
    const { tenDigit, fullNumber } = this.normalizePhoneNumber(phoneNumber);

    if (tenDigit.length !== 10) {
      this.logger.error(`[SmsService] Invalid phone number length: ${phoneNumber}`);
      return false;
    }

    // Dev / Test mode or key missing
    if (!this.fast2smsKey || !this.isProduction) {
      this.logger.log(`\n========================================\n[DEV SMS SIMULATOR] 📱 Mobile OTP for ${fullNumber}: ${otp}\n========================================\n`);
      return true;
    }

    // Real Fast2SMS Quick Route dispatch
    return new Promise((resolve) => {
      const message = `Your WOMART verification code is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
      const postBody = JSON.stringify({
        route: 'q',
        numbers: tenDigit,
        message,
        language: 'english',
        flash: 0,
      });

      const req = https.request(
        {
          hostname: 'www.fast2sms.com',
          port: 443,
          path: '/dev/bulkV2',
          method: 'POST',
          headers: {
            authorization: this.fast2smsKey,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postBody),
          },
        },
        (res) => {
          let buffer = '';
          res.on('data', (chunk) => (buffer += chunk));
          res.on('end', () => {
            try {
              const resJson = JSON.parse(buffer);
              if (resJson.return === true) {
                this.logger.log(`[SmsService] SMS dispatched to ${fullNumber}`);
                resolve(true);
              } else {
                this.logger.error(`[SmsService] Delivery gateway error: ${JSON.stringify(resJson)}`);
                resolve(false);
              }
            } catch (err: any) {
              this.logger.error(`[SmsService] Failed to parse SMS gateway response: ${buffer}`);
              resolve(false);
            }
          });
        },
      );

      req.on('error', (err) => {
        this.logger.error(`[SmsService] Network error sending SMS: ${err.message}`);
        resolve(false);
      });

      req.write(postBody);
      req.end();
    });
  }
}
