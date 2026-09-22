import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_USER');
    const pass = (this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('EMAIL_PASS') || '').replace(/\s+/g, '');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: Number(this.configService.get<number>('SMTP_PORT', 587)),
      secure: false, // TLS
      auth: {
        user,
        pass,
      },
    });

    if (user && pass) {
      this.logger.log(`[MailService] Initialized with Gmail SMTP account: ${user}`);
    } else {
      this.logger.warn('[MailService] SMTP credentials not set');
    }
  }

  async sendOtpEmail(toEmail: string, otp: string): Promise<void> {
    const fromName = 'Worm Up Dark Store';
    const fromAddress =
      this.configService.get<string>('SMTP_USER') ||
      this.configService.get<string>('EMAIL_USER') ||
      'no-reply@wormup.com';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0B0F19; border-radius: 12px; color: #F9FAFB;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #10B981; margin: 0; letter-spacing: 2px;">WORM UP</h1>
          <p style="color: #9CA3AF; margin: 4px 0 0; font-size: 12px; letter-spacing: 1.5px;">DARK STORE OPERATIONS</p>
        </div>

        <div style="background: #111827; padding: 24px; border-radius: 10px; border: 1px solid #273549;">
          <h2 style="color: #F9FAFB; margin: 0 0 8px; font-size: 18px;">Your Login OTP</h2>
          <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0 0 20px;">
            Use the following 6-digit code to sign in to your Dark Store terminal. This code expires in <strong style="color: #F9FAFB;">10 minutes</strong>.
          </p>

          <div style="background: #1F2937; border: 2px dashed #10B981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: 900; color: #10B981; letter-spacing: 8px; font-family: monospace;">${otp}</div>
          </div>

          <p style="color: #6B7280; font-size: 11px; margin: 20px 0 0; text-align: center;">
            Never share this code with anyone. Worm Up staff will never ask for your OTP.
          </p>
        </div>

        <p style="color: #6B7280; font-size: 11px; text-align: center; margin-top: 20px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: toEmail,
        subject: `Worm Up Store — Your Login OTP: ${otp}`,
        text: `Your Worm Up Dark Store login OTP is: ${otp}\n\nThis code expires in 10 minutes. Never share it with anyone.`,
        html,
      });
      this.logger.log(`[Mail] OTP email sent to ${toEmail.replace(/(.{2}).+(@.*)/, '$1***$2')}`);
    } catch (err: any) {
      this.logger.error(`[Mail] Failed to send OTP email to ${toEmail}: ${err.message}`);
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[Mail] Dev Mode fallback OTP for ${toEmail}: ${otp}`);
        return;
      }
      throw new Error('Failed to send OTP email. Please try again.');
    }
  }
}
