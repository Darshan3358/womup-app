import { NormalizedKycStatus, normalizeKycStatus } from '../services/kycService';

export interface IncomeEligibilityResult {
  kycStatus: NormalizedKycStatus;
  isActiveUser: boolean;
  isPersonalActive: boolean;
  isDirectsActive: boolean;
  monthlySpend: number;
  direct5ActiveCount: number;
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
 * 4. Monthly Shopping Coin Level Income: BOTH KYC Verified AND Active User (Personal Spend >= ₹2,000 AND 5 Direct Active members) required.
 */
export function evaluateIncomeEligibility(
  rawKycStatus: any,
  user: any,
  teamPersonalStatus?: any
): IncomeEligibilityResult {
  const kycStatus = normalizeKycStatus(rawKycStatus, user);

  // Active User Qualification
  const monthlySpend = Number(
    teamPersonalStatus?.monthlyPurchaseValue ??
    user?.monthlyPurchaseValue ??
    0
  );

  const direct5ActiveCount = Number(
    teamPersonalStatus?.direct5ActiveCount ??
    user?.direct5ActiveCount ??
    0
  );

  // Condition 1: Personal monthly purchase >= ₹2,000
  const isPersonalActive = Boolean(
    teamPersonalStatus?.isPersonalActive ||
    monthlySpend >= 2000
  );

  // Condition 2: Minimum 5 direct active members
  const isDirectsActive = direct5ActiveCount >= 5;

  // Both conditions required for Active User status
  const isActiveUser = isPersonalActive && isDirectsActive;

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
  const isMonthlyShoppingCoinLevelEligible = kycStatus === 'VERIFIED' && isActiveUser;

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
  } else if (!isPersonalActive) {
    monthlyLevelMessage = 'Complete monthly personal shopping of ₹2,000 to qualify.';
  } else if (!isDirectsActive) {
    monthlyLevelMessage = 'Ensure at least 5 direct active members to qualify.';
  }

  return {
    kycStatus,
    isActiveUser,
    isPersonalActive,
    isDirectsActive,
    monthlySpend,
    direct5ActiveCount,
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

