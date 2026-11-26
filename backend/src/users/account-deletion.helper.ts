import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UserDocument } from './schemas/user.schema';

/**
 * Shared customer account deletion & PII anonymization helper.
 * Preserves referral tree links (sponsorId/parentId) and order ledger references
 * while erasing/unsetting all personally identifiable fields and closing active sessions.
 */
export async function performCustomerAccountDeletion(
  userModel: Model<UserDocument>,
  userId: string,
  reason = 'User requested account deletion',
) {
  const user = await userModel.findById(userId);
  if (!user || !user.isActive || user.isDeleted) {
    throw new NotFoundException('Active customer account not found or already deleted');
  }

  const oid = new Types.ObjectId(user._id.toString());
  const uidStr = user._id.toString();
  const phoneValues = [user.phone, user.phoneNumber].filter(Boolean) as string[];
  const emailValue = user.email;
  const deletedAt = new Date();

  await userModel.updateOne(
    { _id: oid },
    {
      $set: {
        name: 'Deleted User',
        firstName: 'Deleted',
        surname: 'User',
        isActive: false,
        isDeleted: true,
        deletedAt,
        deletionReason: reason,
        isLogin: false,
        isPhoneVerified: false,
        isEmailVerified: false,
        phoneVerified: false,
        aadhaarVerified: false,
        verificationStatus: 'NON_VERIFIED',
        customerIsVerify: 2,
        customerKycStatus: 1,
        kycStatus: 'Deleted',
        kycRejectReason: '',
        avatar: '',
        fullNameAsPerAadhaar: '',
        aadharFrontImage: '',
        customer_image_aadhar_front: '',
        aadharBackImage: '',
        customer_image_aadhar_back: '',
        passbookImage: '',
        bankProofImage: '',
        cancelledChequeImage: '',
        customer_image_bank: '',
        bankName: '',
        branchName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
        address: '',
        landmark: '',
        village: '',
        birthday: '',
        androidToken: '',
        iosToken: '',
        wishlist: [],
        notificationPrefs: {
          orderUpdates: false,
          promotions: false,
          whatsappInvoices: false,
          emailReceipts: false,
          dndEnabled: true,
        },
      },
      $unset: {
        phone: '',
        phoneNumber: '',
        email: '',
        googleId: '',
        aadhaarNumber: '',
      },
    },
  );

  const db = userModel.db;
  const userFilter = { $or: [{ userId: oid }, { userId: uidStr }] };
  const otpFilters: any[] = [];
  phoneValues.forEach((p) => {
    otpFilters.push({ phone: p }, { phoneNumber: p });
  });
  if (emailValue) {
    otpFilters.push({ email: emailValue }, { phone: emailValue }, { phoneNumber: emailValue });
  }

  await Promise.allSettled([
    db.collection('addresses').deleteMany(userFilter),
    db.collection('carts').deleteMany(userFilter),
    db.collection('notifications').deleteMany(userFilter),
    db.collection('refresh_tokens').deleteMany(userFilter),
    ...(otpFilters.length > 0 ? [db.collection('otp_verifications').deleteMany({ $or: otpFilters })] : []),
  ]);

  return {
    success: true,
    deletedAt: deletedAt.toISOString(),
    message: 'Your WOMART account and personal data have been permanently deleted.',
  };
}
