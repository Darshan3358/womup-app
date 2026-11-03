import { NormalizedKycStatus, normalizeKycStatus } from '../services/kycService';

export interface IncomeEligibilityResult {
  kycStatus: NormalizedKycStatus;
  isActiveUser: boolean;
  // 4 Income Categories
  isDownloadIncomeEligible: boolean;
  isShoppingCoinEligible: boolean;
  isShoppingReferralEligible: boolean;
  isMonthlyShoppingCoinLevelEligible: boolean;
  // Messages as mandated by SRS Section 6
  messages: {
    downloadIncome: string;
    shoppingCoin: string;
    shoppingReferral: string;
    monthlyLevelIncome: string;
  };
}

/**
 * Evaluates eligibility for all 4 WOMUP income types strictly following SRS rules:
 * 1. App Download Income (₹20 / ₹10 / ₹5): KYC Verified required; Active User NOT required.
 * 2. Normal Shopping Coin Income: NO KYC required; NO Active User required.
 * 3. Shopping Referral Income: NO KYC required; NO Active User required.
 * 4. Monthly Shopping Coin Level Income: BOTH KYC Verified AND Active User required.
 */
export function evaluateIncomeEligibility(
  rawKycStatus: any,
  user: any,
  teamPersonalStatus?: any
): IncomeEligibilityResult {
  const kycStatus = normalizeKycStatus(rawKycStatus, user);

  // Active User check:
  // User is considered Active if isPersonalActive is true, or monthly spend >= ₹2,000
  const monthlySpend = Number(
    teamPersonalStatus?.monthlyPurchaseValue ??
    user?.monthlyPurchaseValue ??
    0
  );
  const isActiveUser = Boolean(
    teamPersonalStatus?.isPersonalActive ||
    user?.isActiveUser === true ||
    user?.isPersonalActive === true ||
    monthlySpend >= 2000
  );

  // Rule 1: App Download Income (₹20 / ₹10 / ₹5)
  // KYC Required: YES | Active User Required: NO
  const isDownloadIncomeEligible = kycStatus === 'VERIFIED';

  // Rule 2: Normal Shopping Coin Income
  // KYC Required: NO | Active User Required: NO
  const isShoppingCoinEligible = true;

  // Rule 3: Shopping Referral Income
  // KYC Required: NO | Active User Required: NO
  const isShoppingReferralEligible = true;

  // Rule 4: Monthly Shopping Coin Level Income
  // KYC Required: YES | Active User Required: YES (Both must be met simultaneously)
  const isMonthlyShoppingCoinLevelEligible = kycStatus === 'VERIFIED' && isActiveUser === true;

  // Messages matching SRS Section 6:
  let downloadMessage = 'Eligible for Download Income.';
  if (kycStatus === 'PENDING') {
    downloadMessage = 'Complete KYC verification to become eligible for Download Income.';
  } else if (kycStatus === 'REJECTED') {
    downloadMessage = 'KYC verification is required for Download Income.';
  } else if (kycStatus === 'NOT_SUBMITTED') {
    downloadMessage = 'Complete KYC verification to become eligible for Download Income.';
  }

  let monthlyLevelMessage = 'You are eligible for Monthly Shopping Coin Level Income.';
  if (kycStatus !== 'VERIFIED') {
    monthlyLevelMessage = 'Complete KYC verification to qualify for Monthly Level Income.';
  } else if (!isActiveUser) {
    monthlyLevelMessage = 'Become an Active User to qualify for Monthly Level Income.';
  }

  return {
    kycStatus,
    isActiveUser,
    isDownloadIncomeEligible,
    isShoppingCoinEligible,
    isShoppingReferralEligible,
    isMonthlyShoppingCoinLevelEligible,
    messages: {
      downloadIncome: downloadMessage,
      shoppingCoin: 'No additional KYC or Active User eligibility condition.',
      shoppingReferral: 'No KYC verification required.',
      monthlyLevelIncome: monthlyLevelMessage,
    },
  };
}
