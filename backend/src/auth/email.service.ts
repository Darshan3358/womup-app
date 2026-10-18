import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter465: nodemailer.Transporter | null = null;
  private transporter587: nodemailer.Transporter | null = null;
  private defaultUser = 'mukeshthanki10@gmail.com';
  private defaultPass = 'gmpttqcoiyscvqjw';

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('EMAIL_USER') || this.defaultUser;
    const rawPass = this.configService.get<string>('EMAIL_PASS') || this.defaultPass;
    const cleanPass = (rawPass || '').replace(/\s+/g, '');

    if (user && cleanPass) {
      // Primary SSL Port 465
      this.transporter465 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4, // Force IPv4
        auth: { user, pass: cleanPass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      } as any);

      // Fallback TLS Port 587
      this.transporter587 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        family: 4,
        auth: { user, pass: cleanPass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      } as any);

      this.logger.log(`Email Service initialized with: ${user}`);
    } else {
      this.logger.warn('EMAIL_USER or EMAIL_PASS not set');
    }
  }

  /** Centralized dispatcher that tries all available channels to deliver real emails */
  async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
    fromName?: string;
  }): Promise<{ success: boolean; provider?: string; error?: string }> {
    const { to, subject, text, html, fromName = 'Worm Up' } = options;
    const fromEmail = this.configService.get<string>('EMAIL_USER') || this.defaultUser;

    // Channel 1: Google Apps Script / HTTPS Relay (if configured, works 100% on Render without port blocks)
    const relayUrl = this.configService.get<string>('GMAIL_RELAY_URL')?.trim();
    if (relayUrl) {
      try {
        const relayRes = await fetch(relayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, text, html, fromName }),
        });
        if (relayRes.ok) {
          this.logger.log(`[Email] Delivered to ${to} via HTTPS Relay`);
          return { success: true, provider: 'HTTPS Relay' };
        }
      } catch (err: any) {
        this.logger.warn(`[Email] HTTPS Relay failed: ${err.message}`);
      }
    }

    // Channel 2: Resend API (Works for test address mukeshthanki10@gmail.com)
    const resendKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    if (resendKey && to.toLowerCase() === this.defaultUser.toLowerCase()) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Worm Up <onboarding@resend.dev>',
            to: [to],
            subject,
            text,
            html,
          }),
        });
        if (response.ok) {
          this.logger.log(`[Email] Delivered to ${to} via Resend`);
          return { success: true, provider: 'Resend' };
        }
      } catch (err: any) {
        this.logger.warn(`[Email] Resend API failed: ${err.message}`);
      }
    }

    // Channel 3: Gmail SMTP Port 465
    if (this.transporter465) {
      try {
        await this.transporter465.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(`[Email] Delivered successfully via Gmail SMTP (Port 465) to ${to}`);
        return { success: true, provider: 'Gmail SMTP (Port 465)' };
      } catch (err: any) {
        this.logger.warn(`[Email] Gmail SMTP Port 465 failed for ${to}: ${err.message}`);
      }
    }

    // Channel 4: Gmail SMTP Port 587
    if (this.transporter587) {
      try {
        await this.transporter587.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(`[Email] Delivered successfully via Gmail SMTP (Port 587) to ${to}`);
        return { success: true, provider: 'Gmail SMTP (Port 587)' };
      } catch (err: any) {
        this.logger.error(`[Email] Gmail SMTP Port 587 failed for ${to}: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'No email transport available' };
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
    const fromName = 'Worm Up';
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
          <tr>
            <td style="background:linear-gradient(135deg,#FF2D78,#FF6B35);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🐛 Worm Up</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your verification code</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hi there 👋</p>
              <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 32px;">
                Use the OTP below to verify your email address and log in to <strong>Worm Up</strong>.
                This code is valid for <strong>10 minutes</strong>.
              </p>
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
          <tr>
            <td style="background:#F9FAFB;padding:20px 32px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="color:#9CA3AF;font-size:12px;margin:0;">
                © 2026 Worm Up. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await this.sendMail({
      to: email,
      subject: `${otp} is your Worm Up verification code`,
      text: `Your Worm Up OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      html,
      fromName,
    });
    return res.success;
  }

  /** Send 6-digit verification OTP to Rider */
  async sendRiderOtpEmail(email: string, otp: string, riderName?: string): Promise<boolean> {
    const fromName = 'Worm Up Rider Team';
    const name = riderName || 'Rider';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(7,27,82,0.08);border:1px solid #E2E8F0;">
        <tr>
          <td style="background:linear-gradient(135deg,#071B52,#0A2570);padding:30px;text-align:center;">
            <h1 style="color:#FFFFFF;margin:0;font-size:26px;font-weight:900;">🛵 Worm Up Rider</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;font-weight:600;">Email Verification Code</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="color:#071B52;font-size:16px;font-weight:700;margin:0 0 16px;">Hi ${name} 👋</p>
            <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Your 6-digit verification code for <strong>Worm Up Delivery Partner</strong> registration & login is:
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <div style="display:inline-block;background:#EEF2FF;border:2px solid #4F46E5;border-radius:12px;padding:16px 36px;">
                <p style="margin:0;font-size:38px;font-weight:900;color:#4F46E5;letter-spacing:8px;">${otp}</p>
              </div>
            </div>
            <p style="color:#047857;background:#ECFDF5;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:600;margin:0 0 20px;text-align:center;">
              ⏱️ This code is valid for 10 minutes.
            </p>
            <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">
              Do not share this code with anyone. If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F8FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0;">
            <p style="color:#94A3B8;font-size:12px;margin:0;">— WormUp Rider Team • © 2026 Worm Up</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await this.sendMail({
      to: email,
      subject: `${otp} is your Worm Up Rider verification code`,
      text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code is valid for 10 minutes.\nDo not share this code with anyone.\n\n— WormUp Rider Team`,
      html,
      fromName,
    });
    return res.success;
  }

  /** Send Welcome email after successful Rider registration */
  async sendRiderWelcomeEmail(email: string, riderName: string, riderCode: string): Promise<boolean> {
    const fromName = 'Worm Up Rider Team';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(7,27,82,0.08);border:1px solid #E2E8F0;">
        <tr>
          <td style="background:linear-gradient(135deg,#047857,#059669);padding:30px;text-align:center;">
            <h1 style="color:#FFFFFF;margin:0;font-size:26px;font-weight:900;">🎉 Welcome to Worm Up!</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;font-weight:600;">Rider Account Activated</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#071B52;font-size:16px;font-weight:700;margin:0 0 12px;">Hi ${riderName} 👋</p>
            <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Congratulations on joining the <strong>Worm Up Delivery Fleet</strong>! Your rider account has been created successfully.
            </p>
            <div style="background:#F1F5F9;border-radius:10px;padding:16px;margin:0 0 24px;">
              <p style="margin:0 0 6px;color:#64748B;font-size:12px;">Rider ID: <strong style="color:#071B52;font-size:15px;">${riderCode}</strong></p>
              <p style="margin:0;color:#64748B;font-size:12px;">Registered Email: <strong style="color:#071B52;">${email}</strong></p>
            </div>
            <p style="color:#071B52;font-size:13px;font-weight:800;margin:0 0 8px;">What you can do now:</p>
            <ul style="color:#475569;font-size:13px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
              <li>Go online to receive high-paying nearby orders</li>
              <li>View pickup dark stores on live GPS map</li>
              <li>Earn ₹45–₹85 per delivery with instant tips</li>
              <li>Withdraw earnings anytime to your bank account</li>
            </ul>
            <div style="text-align:center;">
              <span style="display:inline-block;background:#071B52;color:#FFFFFF;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:800;">Open Worm Up Rider App</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#F8FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0;">
            <p style="color:#94A3B8;font-size:12px;margin:0;">— WormUp Rider Team • Helpdesk: support@wormup.in</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await this.sendMail({
      to: email,
      subject: 'Welcome to WormUp Rider Program! 🛵',
      text: `Hi ${riderName},\n\nWelcome to WormUp!\n\nYour Rider ID: ${riderCode}\nRegistered Email: ${email}\n\nYou can now go online and start delivering!\n\n— WormUp Rider Team`,
      html,
      fromName,
    });
    return res.success;
  }

  /** Send Password Reset Email with OTP */
  async sendRiderPasswordResetEmail(email: string, otp: string, riderName?: string): Promise<boolean> {
    const fromName = 'Worm Up Security';
    const name = riderName || 'Rider';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(7,27,82,0.08);border:1px solid #E2E8F0;">
        <tr>
          <td style="background:linear-gradient(135deg,#BE123C,#E11D48);padding:30px;text-align:center;">
            <h1 style="color:#FFFFFF;margin:0;font-size:24px;font-weight:900;">🔒 Password Reset Code</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:13px;">Worm Up Rider Account</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#071B52;font-size:16px;font-weight:700;margin:0 0 12px;">Hi ${name} 👋</p>
            <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 20px;">
              We received a request to reset the password for your Worm Up Delivery Partner account. Use the code below:
            </p>
            <div style="text-align:center;margin:0 0 24px;">
              <div style="display:inline-block;background:#FFF1F2;border:2px solid #E11D48;border-radius:12px;padding:16px 36px;">
                <p style="margin:0;font-size:38px;font-weight:900;color:#E11D48;letter-spacing:8px;">${otp}</p>
              </div>
            </div>
            <p style="color:#BE123C;background:#FFF1F2;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:600;margin:0 0 16px;text-align:center;">
              ⏱️ Valid for 10 minutes. Never share this code.
            </p>
            <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">
              If you didn't request a password reset, please contact support immediately.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await this.sendMail({
      to: email,
      subject: `${otp} is your Worm Up Rider password reset code`,
      text: `Hi ${name},\n\nYour password reset code is: ${otp}\n\nValid for 10 minutes.\n\n— WormUp Security Team`,
      html,
      fromName,
    });
    return res.success;
  }
}

