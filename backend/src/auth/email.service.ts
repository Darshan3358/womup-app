import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    if (user && pass) {
      const cleanPass = pass.replace(/\s+/g, '');
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass: cleanPass },
      });
      this.logger.log(`Email Service initialized with: ${user}`);
    } else {
      this.logger.warn('EMAIL_USER or EMAIL_PASS not set — email delivery disabled (dev mode)');
    }
  }

  /** Generate a secure 6-digit OTP */
  generateOtp(): string {
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0);
    return String(100000 + (num % 900000));
  }

  /** Hash OTP for secure DB storage */
  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /** Verify submitted OTP against stored hash */
  verifyOtpHash(submittedOtp: string, storedHash: string): boolean {
    const hash = crypto.createHash('sha256').update(submittedOtp).digest('hex');
    return hash === storedHash;
  }

  /** Send OTP email to user */
  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`[Email OTP] Dev mode — OTP for ${email}: ${otp}`);
      return true; // Dev mode fallback
    }

    const fromName = 'Worm Up';
    const fromEmail = this.configService.get<string>('EMAIL_USER');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF2D78,#FF6B35);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🐛 Worm Up</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your verification code</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi there 👋</p>
              <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 32px;">
                Use the OTP below to verify your email address and log in to <strong>Worm Up</strong>.
                This code is valid for <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="text-align:center;margin:0 0 32px;">
                <div style="display:inline-block;background:#FFF1F6;border:2px solid #FF2D78;border-radius:12px;padding:20px 40px;">
                  <p style="margin:0;font-size:42px;font-weight:900;color:#FF2D78;letter-spacing:10px;">${otp}</p>
                </div>
              </div>

              <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0 0 8px;">
                ⚠️ Never share this code with anyone. Worm Up will never ask for your OTP.
              </p>
              <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px 32px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="color:#9CA3AF;font-size:12px;margin:0;">
                © 2025 Worm Up. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: `${otp} is your Worm Up verification code`,
        text: `Your Worm Up OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
        html,
      });
      this.logger.log(`[Email OTP] Sent successfully to ${email}`);
      return true;
    } catch (err: any) {
      this.logger.error(`[Email OTP] Failed to send to ${email}: ${err.message}`);
      return false;
    }
  }
}
