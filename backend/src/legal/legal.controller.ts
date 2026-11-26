import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';

const COMPANY_NAME = 'WOMUP ENTERPRISE PRIVATE LIMITED';
const APP_NAME = 'WOMART';
const SUPPORT_EMAIL = 'support@womup.in';
const SUPPORT_PHONE = '+91 98250 00099';

function renderLegalPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ${APP_NAME}</title>
  <style>
    :root { --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --muted: #475569; --border: #e2e8f0; --accent: #ec4899; --danger: #dc2626; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; }
    .wrap { max-width: 820px; margin: 0 auto; padding: 32px 16px 64px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04); }
    .badge { display: inline-block; background: #fdf2f8; color: #be185d; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 999px; margin-bottom: 10px; }
    h1 { margin: 0 0 6px; font-size: 26px; line-height: 1.25; }
    h2 { margin-top: 26px; font-size: 18px; color: #1e293b; }
    p, li { color: var(--muted); font-size: 15px; }
    ul { padding-left: 20px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    .nav { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 14px; }
    a { color: #db2777; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
    .box { background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin: 16px 0; }
    label { display: block; font-weight: 600; font-size: 14px; margin-bottom: 6px; color: var(--text); }
    input, textarea { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 15px; margin-bottom: 12px; font-family: inherit; }
    button { background: var(--accent); color: #fff; border: 0; border-radius: 10px; padding: 11px 16px; font-weight: 700; font-size: 14px; cursor: pointer; }
    button.danger { background: var(--danger); }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .status { margin-top: 12px; font-size: 14px; font-weight: 600; }
    .ok { color: #059669; }
    .err { color: #dc2626; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="badge">${APP_NAME} · ${COMPANY_NAME}</div>
      ${bodyHtml}
      <div class="nav">
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/terms">Terms &amp; Conditions</a>
        <a href="/delete-account">Delete Account</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

@ApiExcludeController()
@Controller()
export class LegalController {
  @Get('privacy-policy')
  getPrivacyPolicy(@Res() res: Response) {
    const html = renderLegalPage(
      'Privacy Policy',
      `
      <h1>Privacy Policy</h1>
      <div class="meta">Effective Date: November 2026 · Operated by ${COMPANY_NAME}</div>
      <p>
        ${COMPANY_NAME} ("we", "our", or "us") operates the <strong>${APP_NAME}</strong> mobile application.
        This Privacy Policy explains how we collect, use, store, and protect your information when you use ${APP_NAME}.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account &amp; Profile Details:</strong> Name, email address, phone number, referral/sponsor identifiers, and optional birthday provided during registration or profile updates.</li>
        <li><strong>Delivery Addresses &amp; Location:</strong> Saved delivery addresses and device GPS location (precise/approximate) when you grant location permission to check store serviceability and deliver orders accurately.</li>
        <li><strong>Orders &amp; Print Store Files:</strong> Cart items, order history, payment method references (processed securely via Razorpay / UPI), and documents or photos you choose to upload for printing or support tickets. Uploaded print files are automatically purged after delivery.</li>
        <li><strong>KYC Details (Optional for Reward Withdrawals):</strong> Aadhaar details and bank/passbook proofs only when voluntarily submitted for payout verification.</li>
        <li><strong>Camera, Photo Picker &amp; Microphone:</strong> Camera access for scanning vendor counter QR codes or capturing print/support photos; Android System Photo Picker for selecting images to upload; and Microphone access solely when you tap Voice Search.</li>
        <li><strong>Device Identifiers:</strong> Push notification tokens and app version telemetry used strictly for order updates and app stability.</li>
      </ul>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>Fulfill hyper-local grocery, essentials, local shop, and print deliveries from your selected dark store.</li>
        <li>Verify OTP sign-ins, prevent fraud, and provide 24x7 customer support.</li>
        <li>Process payments, wallet credits, refunds, and Loyalty Shopping Coins.</li>
        <li>Send transactional order status notifications and optional promotional updates (controllable in Account Privacy / Notification Preferences).</li>
      </ul>

      <h2>3. Data Sharing &amp; Security</h2>
      <p>
        We do not sell your personal information. Data is shared strictly as needed with dark store staff, delivery partners fulfilling your active order, payment gateways (Razorpay), cloud storage providers (Cloudinary), and communication providers over encrypted HTTPS/TLS connections.
      </p>

      <h2>4. Data Retention &amp; Account Deletion</h2>
      <p>
        You may permanently delete your account inside the ${APP_NAME} app under <strong>Profile → Account privacy → Delete My Account</strong> or via our web deletion portal at
        <a href="/delete-account">/delete-account</a>. Upon deletion, your profile, saved addresses, carts, wishlist, KYC documents, and active sessions are erased/anonymized immediately. Minimal tax/GST invoice records may be retained strictly where required by applicable Indian law.
      </p>

      <h2>5. Children&apos;s Privacy</h2>
      <p>
        ${APP_NAME} is intended for users aged 18 and above and does not knowingly collect personal data from children under 13.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        Data Protection &amp; Grievance Contact: <strong>${COMPANY_NAME}</strong><br />
        Email: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> · Helpline: ${SUPPORT_PHONE}
      </p>
      `,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  @Get('terms')
  getTerms(@Res() res: Response) {
    const html = renderLegalPage(
      'Terms & Conditions',
      `
      <h1>Terms &amp; Conditions</h1>
      <div class="meta">Effective Date: November 2026 · Operated by ${COMPANY_NAME}</div>
      <p>
        By downloading or using the <strong>${APP_NAME}</strong> application operated by <strong>${COMPANY_NAME}</strong>, you agree to these Terms &amp; Conditions.
      </p>
      <h2>1. Service Eligibility &amp; Accounts</h2>
      <p>You are responsible for maintaining accurate account and delivery details. Services are available only in serviceable dark store delivery zones.</p>
      <h2>2. Orders, Pricing &amp; Payments</h2>
      <p>Product availability, pricing, taxes, and delivery charges are shown prior to checkout and depend on your selected dark store.</p>
      <h2>3. Cancellations &amp; Refunds</h2>
      <p>Eligible cancellations and verified refunds are credited to your original payment source or ${APP_NAME} wallet as applicable.</p>
      <h2>4. Shopping Coins &amp; Rewards</h2>
      <p>Shopping Coins are promotional loyalty credits governed by in-app checkout rules and cannot be redeemed for cash outside verified withdrawal rules.</p>
      <h2>5. Support</h2>
      <p>For order, refund, or policy questions, contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> or call ${SUPPORT_PHONE}.</p>
      `,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  @Get('delete-account')
  getDeleteAccountPage(@Res() res: Response) {
    const html = renderLegalPage(
      'Delete Your Account',
      `
      <h1>Delete Your ${APP_NAME} Account</h1>
      <div class="meta">${COMPANY_NAME} · Google Play Data Deletion Portal</div>
      <p>
        You can permanently delete your ${APP_NAME} account and personal data at any time using either method below:
      </p>

      <div class="box">
        <strong>Option 1 — Inside the ${APP_NAME} App (Instant)</strong>
        <p style="margin: 6px 0 0;">
          Open <strong>${APP_NAME}</strong> → tap <strong>Profile</strong> → open <strong>Account privacy</strong> → tap <strong>Delete My Account</strong> → confirm deletion.
        </p>
      </div>

      <div class="box">
        <strong>Option 2 — Verify &amp; Delete Online (No App Needed)</strong>
        <p style="margin: 6px 0 14px;">
          Enter your registered Email or 10-digit Phone Number to receive a 6-digit verification code and permanently delete your account.
        </p>
        <label for="identifier">Registered Email or 10-digit Mobile Number</label>
        <input id="identifier" type="text" placeholder="e.g. name@example.com or 9876543210" />
        <button id="sendOtpBtn" type="button">Send Verification Code</button>

        <div id="otpSection" style="display:none; margin-top: 16px;">
          <label for="otp">6-Digit Verification Code</label>
          <input id="otp" type="text" maxlength="6" placeholder="Enter 6-digit OTP" />
          <label for="reason">Reason (optional)</label>
          <input id="reason" type="text" placeholder="Optional feedback" />
          <button id="confirmDeleteBtn" class="danger" type="button">Permanently Delete My Account</button>
        </div>
        <div id="statusMsg" class="status"></div>
      </div>

      <h2>What Data Is Deleted vs. Retained</h2>
      <ul>
        <li><strong>Deleted Immediately:</strong> Account profile (name, email, phone), saved delivery addresses, active shopping cart, wishlist, KYC/bank proofs, notification tokens, and active login sessions.</li>
        <li><strong>Retained for Legal Compliance:</strong> Anonymized tax/GST invoice totals and past order transaction audit logs where required by Indian statutory accounting law.</li>
      </ul>

      <p>
        Need manual assistance? Email <a href="mailto:${SUPPORT_EMAIL}?subject=WOMART%20Account%20Deletion%20Request">${SUPPORT_EMAIL}</a> from your registered email address or call ${SUPPORT_PHONE}.
      </p>

      <script>
        (function () {
          var verificationId = '';
          var sendBtn = document.getElementById('sendOtpBtn');
          var confirmBtn = document.getElementById('confirmDeleteBtn');
          var otpSection = document.getElementById('otpSection');
          var statusEl = document.getElementById('statusMsg');

          function setStatus(msg, ok) {
            statusEl.className = 'status ' + (ok ? 'ok' : 'err');
            statusEl.textContent = msg;
          }

          sendBtn.addEventListener('click', function () {
            var val = (document.getElementById('identifier').value || '').trim();
            if (!val) { setStatus('Please enter your registered email or mobile number.', false); return; }
            sendBtn.disabled = true;
            setStatus('Sending verification code...', true);
            var payload = val.indexOf('@') !== -1 ? { email: val, purpose: 'LOGIN' } : { phoneNumber: val, purpose: 'LOGIN' };
            fetch('/api/v1/auth/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
            .then(function (res) {
              sendBtn.disabled = false;
              var data = res.body && res.body.data ? res.body.data : res.body;
              if (!res.ok || (res.body && res.body.success === false)) {
                setStatus((res.body && res.body.message) || 'Could not send OTP. Please check your details.', false);
                return;
              }
              verificationId = (data && data.verificationId) || '';
              otpSection.style.display = 'block';
              setStatus('Verification code sent. Enter the 6-digit code below to confirm deletion.', true);
            })
            .catch(function () {
              sendBtn.disabled = false;
              setStatus('Network error while sending code. Please try again or email ${SUPPORT_EMAIL}.', false);
            });
          });

          confirmBtn.addEventListener('click', function () {
            var val = (document.getElementById('identifier').value || '').trim();
            var otp = (document.getElementById('otp').value || '').trim();
            var reason = (document.getElementById('reason').value || '').trim();
            if (!otp || otp.length < 4) { setStatus('Please enter the verification code.', false); return; }
            confirmBtn.disabled = true;
            setStatus('Deleting account permanently...', true);
            fetch('/api/v1/auth/delete-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: val, otp: otp, verificationId: verificationId, reason: reason })
            })
            .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
            .then(function (res) {
              confirmBtn.disabled = false;
              var data = res.body && res.body.data ? res.body.data : res.body;
              if (!res.ok || (res.body && res.body.success === false)) {
                setStatus((res.body && res.body.message) || 'Could not delete account.', false);
                return;
              }
              setStatus((data && data.message) || 'Your account has been permanently deleted.', true);
              otpSection.style.display = 'none';
            })
            .catch(function () {
              confirmBtn.disabled = false;
              setStatus('Request failed. Please try again or email ${SUPPORT_EMAIL}.', false);
            });
          });
        })();
      </script>
      `,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }
}
