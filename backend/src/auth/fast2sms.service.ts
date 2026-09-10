import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';

@Injectable()
export class Fast2SmsService {
  private readonly logger = new Logger(Fast2SmsService.name);
  private readonly apiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FAST2SMS_API_KEY');
    if (this.apiKey) {
      this.logger.log('Fast2SMS Service initialized successfully');
    } else {
      this.logger.warn('FAST2SMS_API_KEY missing — SMS delivery disabled');
    }
  }

  /**
   * Generate a secure 6-digit OTP
   */
  generateOtp(): string {
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0);
    return String(100000 + (num % 900000));
  }

  /**
   * Hash OTP for secure DB storage
   */
  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Verify submitted OTP against stored hash
   */
  verifyOtpHash(submittedOtp: string, storedHash: string): boolean {
    const hash = crypto.createHash('sha256').update(submittedOtp).digest('hex');
    return hash === storedHash;
  }

  /**
   * Send OTP SMS via Fast2SMS to any Indian mobile number (FREE)
   */
  async sendOtp(phone: string, otp: string): Promise<boolean> {
    // Strip country code — Fast2SMS needs 10-digit Indian number
    const mobile = phone.replace(/^\+91/, '').replace(/\D/g, '');

    if (!this.apiKey) {
      this.logger.warn(`[Fast2SMS] API key not configured — OTP for ${mobile}: ${otp} (dev mode)`);
      return true; // Dev mode — return success
    }

    return new Promise((resolve) => {
      const message = `Your Worm Up verification code is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
      const body = JSON.stringify({
        route: 'q', // Quick transactional route
        numbers: mobile,
        message,
        language: 'english',
        flash: 0,
      });

      const options = {
        hostname: 'www.fast2sms.com',
        port: 443,
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.return === true) {
              this.logger.log(`[Fast2SMS] OTP sent successfully to +91${mobile}`);
              resolve(true);
            } else {
              this.logger.error(`[Fast2SMS] Failed: ${JSON.stringify(parsed)}`);
              resolve(false);
            }
          } catch {
            this.logger.error(`[Fast2SMS] Parse error: ${data}`);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        this.logger.error(`[Fast2SMS] Network error: ${err.message}`);
        resolve(false);
      });

      req.write(body);
      req.end();
    });
  }
}
