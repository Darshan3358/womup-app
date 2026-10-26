import { ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Role } from '../enums/role.enum';
import { UserDocument } from '../../users/schemas/user.schema';
import { DeliveryPartnerDocument } from '../../delivery/schemas/delivery-partner.schema';
import { StoreDocument } from '../../stores/schemas/store.schema';
import { VendorDocument } from '../../local-shops/schemas/vendor.schema';

export type TargetAppRole = 'Customer' | 'Delivery Partner' | 'Dark Store' | 'Local Vendor' | 'Admin';

export interface CrossRoleValidationOptions {
  targetRole: TargetAppRole;
  phone?: string;
  email?: string;
  aadhaarNumber?: string;
  excludeUserId?: string | Types.ObjectId;
  excludePartnerId?: string | Types.ObjectId;
  excludeStoreId?: string | Types.ObjectId;
  excludeVendorId?: string | Types.ObjectId;
  userModel?: Model<UserDocument>;
  partnerModel?: Model<DeliveryPartnerDocument>;
  storeModel?: Model<StoreDocument>;
  vendorModel?: Model<VendorDocument>;
}

/**
 * Normalizes phone number to 10 digits and creates search variants.
 */
export function getPhoneSearchVariants(phone?: string): { clean10: string; variants: string[] } {
  if (!phone) return { clean10: '', variants: [] };
  const clean10 = phone.replace(/\D/g, '').slice(-10);
  if (clean10.length !== 10) return { clean10: '', variants: [] };

  return {
    clean10,
    variants: [clean10, `+91${clean10}`, `+91 ${clean10}`, `0${clean10}`],
  };
}

/**
 * Normalizes Aadhaar number to 12 digits.
 */
export function cleanAadhaarNumber(aadhaar?: string): string {
  if (!aadhaar) return '';
  const digits = aadhaar.replace(/\D/g, '');
  return digits.length === 12 ? digits : '';
}

/**
 * Validates that an identity (phone, email, aadhaar) is not already registered under another role or entity.
 * Enforces strict single-role identity across:
 * 1. Customer (users collection)
 * 2. Delivery Partner / Rider (delivery_partners collection)
 * 3. Dark Store (stores collection)
 * 4. Local Vendor (vendors collection)
 */
export async function assertCrossRoleIdentityUniqueness(opts: CrossRoleValidationOptions): Promise<void> {
  const {
    targetRole,
    phone,
    email,
    aadhaarNumber,
    excludeUserId,
    excludePartnerId,
    excludeStoreId,
    excludeVendorId,
    userModel,
    partnerModel,
    storeModel,
    vendorModel,
  } = opts;

  const { clean10, variants: phoneVariants } = getPhoneSearchVariants(phone);
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanAadhaar = cleanAadhaarNumber(aadhaarNumber);

  // ─────────────────────────────────────────────────────────────
  // 1. PHONE NUMBER VALIDATION
  // ─────────────────────────────────────────────────────────────
  if (clean10 && phoneVariants.length > 0) {
    const phoneFilter = {
      $or: [
        { phone: { $in: phoneVariants } },
        { phoneNumber: { $in: phoneVariants } },
        { ownerPhone: { $in: phoneVariants } },
        { vendorMobile: { $in: phoneVariants } },
        { managerPhone: { $in: phoneVariants } },
      ],
    };

    // A. Check in users collection (Customer / Rider / Store / Admin)
    if (userModel) {
      const existingUser = await userModel.findOne({
        phone: { $in: phoneVariants },
        ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
      }).lean();

      if (existingUser) {
        if (existingUser.role === Role.DELIVERY_PARTNER) {
          if (targetRole === 'Delivery Partner') {
            throw new ConflictException('An account with this mobile number already exists. Please login.');
          }
          throw new ConflictException(
            `This mobile number is already registered as a Delivery Rider. You cannot use it for a ${targetRole} account.`
          );
        }

        if (existingUser.role === Role.STORE_STAFF) {
          if (targetRole === 'Dark Store') {
            throw new ConflictException('An account with this mobile number already exists for a Dark Store. Please login.');
          }
          throw new ConflictException(
            `This mobile number is already registered as a Dark Store. You cannot use it for a ${targetRole} account.`
          );
        }

        if (existingUser.role === Role.ADMIN) {
          throw new ConflictException(
            `This mobile number is registered with Admin privileges. You cannot use it for a ${targetRole} account.`
          );
        }

        // Customer role
        if (targetRole === 'Customer') {
          // In customer registration, if a customer already exists:
          // Notice: Caller handles login linking if needed, but if strictly blocking duplicate customer:
          // We let caller handle same-role customer logic unless explicitly invoked
        } else {
          throw new ConflictException(
            `This mobile number is already registered as a Customer. You cannot use it for a ${targetRole} account.`
          );
        }
      }
    }

    // B. Check in delivery_partners collection
    if (partnerModel) {
      const existingPartner = await partnerModel.findOne({
        phoneNumber: { $in: phoneVariants },
        ...(excludePartnerId ? { _id: { $ne: excludePartnerId } } : {}),
      }).lean();

      if (existingPartner) {
        if (targetRole === 'Delivery Partner') {
          throw new ConflictException('An account with this mobile number already exists. Please login.');
        }
        throw new ConflictException(
          `This mobile number is already registered as a Delivery Rider (${existingPartner.fullName || existingPartner.partnerCode}). You cannot use it for a ${targetRole} account.`
        );
      }
    }

    // C. Check in stores collection
    if (storeModel) {
      const existingStore = await storeModel.findOne({
        $or: [
          { phone: { $in: phoneVariants } },
          { managerPhone: { $in: phoneVariants } },
        ],
        ...(excludeStoreId ? { _id: { $ne: excludeStoreId } } : {}),
      }).lean();

      if (existingStore) {
        if (targetRole === 'Dark Store') {
          throw new ConflictException('An account with this mobile number already exists for a Dark Store. Please login.');
        }
        throw new ConflictException(
          `This mobile number is already registered with a Dark Store (${existingStore.name}). You cannot use it for a ${targetRole} account.`
        );
      }
    }

    // D. Check in vendors collection
    if (vendorModel) {
      const existingVendor = await vendorModel.findOne({
        $or: [
          { ownerPhone: { $in: phoneVariants } },
          { vendorMobile: { $in: phoneVariants } },
          { ownerPhone: new RegExp(`${clean10}$`, 'i') },
          { vendorMobile: new RegExp(`${clean10}$`, 'i') },
        ],
        ...(excludeVendorId ? { _id: { $ne: excludeVendorId } } : {}),
      }).lean();

      if (existingVendor) {
        if (targetRole === 'Local Vendor') {
          throw new ConflictException('An account with this mobile number already exists as a Local Vendor. Please login.');
        }
        throw new ConflictException(
          `This mobile number is already registered with a Local Vendor (${existingVendor.storeName || existingVendor.ownerName}). You cannot use it for a ${targetRole} account.`
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. EMAIL ADDRESS VALIDATION
  // ─────────────────────────────────────────────────────────────
  if (cleanEmail && cleanEmail.includes('@')) {
    // A. Check in users collection
    if (userModel) {
      const existingUser = await userModel.findOne({
        email: cleanEmail,
        ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
      }).lean();

      if (existingUser) {
        if (existingUser.role === Role.DELIVERY_PARTNER) {
          if (targetRole === 'Delivery Partner') {
            throw new ConflictException('An account with this email already exists. Please login.');
          }
          throw new ConflictException(
            `This email is already registered as a Delivery Rider. You cannot use it for a ${targetRole} account.`
          );
        }

        if (existingUser.role === Role.STORE_STAFF) {
          if (targetRole === 'Dark Store') {
            throw new ConflictException('An account with this email already exists for a Dark Store. Please login.');
          }
          throw new ConflictException(
            `This email is already registered as a Dark Store. You cannot use it for a ${targetRole} account.`
          );
        }

        if (existingUser.role === Role.ADMIN) {
          throw new ConflictException(
            `This email is registered with Admin privileges. You cannot use it for a ${targetRole} account.`
          );
        }

        // Customer role
        if (targetRole !== 'Customer') {
          throw new ConflictException(
            `This email is already registered as a Customer. You cannot use it for a ${targetRole} account.`
          );
        }
      }
    }

    // B. Check in delivery_partners collection
    if (partnerModel) {
      const existingPartner = await partnerModel.findOne({
        email: cleanEmail,
        ...(excludePartnerId ? { _id: { $ne: excludePartnerId } } : {}),
      }).lean();

      if (existingPartner) {
        if (targetRole === 'Delivery Partner') {
          throw new ConflictException('An account with this email already exists. Please login.');
        }
        throw new ConflictException(
          `This email is already registered as a Delivery Rider (${existingPartner.fullName || existingPartner.partnerCode}). You cannot use it for a ${targetRole} account.`
        );
      }
    }

    // C. Check in stores collection
    if (storeModel) {
      const existingStore = await storeModel.findOne({
        email: cleanEmail,
        ...(excludeStoreId ? { _id: { $ne: excludeStoreId } } : {}),
      }).lean();

      if (existingStore) {
        if (targetRole === 'Dark Store') {
          throw new ConflictException('An account with this email already exists for a Dark Store. Please login.');
        }
        throw new ConflictException(
          `This email is already registered with a Dark Store (${existingStore.name}). You cannot use it for a ${targetRole} account.`
        );
      }
    }

    // D. Check in vendors collection
    if (vendorModel) {
      const existingVendor = await vendorModel.findOne({
        vendorEmail: cleanEmail,
        ...(excludeVendorId ? { _id: { $ne: excludeVendorId } } : {}),
      }).lean();

      if (existingVendor) {
        if (targetRole === 'Local Vendor') {
          throw new ConflictException('An account with this email already exists as a Local Vendor. Please login.');
        }
        throw new ConflictException(
          `This email is already registered with a Local Vendor (${existingVendor.storeName || existingVendor.ownerName}). You cannot use it for a ${targetRole} account.`
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. AADHAAR NUMBER VALIDATION
  // ─────────────────────────────────────────────────────────────
  if (cleanAadhaar) {
    // A. Check in users collection (Customer KYC)
    if (userModel) {
      const existingUser = await userModel.findOne({
        $or: [
          { aadhaarNumber: cleanAadhaar },
          { customer_aadhar_no: cleanAadhaar },
        ],
        ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
      }).lean();

      if (existingUser) {
        if (targetRole === 'Customer' && existingUser.role === Role.CUSTOMER) {
          throw new ConflictException('This Aadhaar number is already linked to another Customer account.');
        }
        throw new ConflictException(
          `This Aadhaar number is already registered with a Customer account (${existingUser.name}). You cannot use it for a ${targetRole} account.`
        );
      }
    }

    // B. Check in delivery_partners collection (Rider KYC)
    if (partnerModel) {
      const existingPartner = await partnerModel.findOne({
        $or: [
          { aadharNumber: cleanAadhaar },
          { aadhaarNumber: cleanAadhaar },
          { 'documents.aadharNumber': cleanAadhaar },
        ],
        ...(excludePartnerId ? { _id: { $ne: excludePartnerId } } : {}),
      }).lean();

      if (existingPartner) {
        if (targetRole === 'Delivery Partner') {
          throw new ConflictException('This Aadhaar number is already registered with another Delivery Partner.');
        }
        throw new ConflictException(
          `This Aadhaar number is already registered with a Delivery Partner (${existingPartner.fullName || existingPartner.partnerCode}). You cannot use it for a ${targetRole} account.`
        );
      }
    }

    // C. Check in vendors collection (Vendor KYC)
    if (vendorModel) {
      const existingVendor = await vendorModel.findOne({
        $or: [
          { vendorAadharNo: cleanAadhaar },
          { 'kycDocuments.aadhaarNumber': cleanAadhaar },
        ],
        ...(excludeVendorId ? { _id: { $ne: excludeVendorId } } : {}),
      }).lean();

      if (existingVendor) {
        if (targetRole === 'Local Vendor') {
          throw new ConflictException('This Aadhaar number is already registered with another Local Vendor.');
        }
        throw new ConflictException(
          `This Aadhaar number is already registered with a Local Vendor (${existingVendor.storeName || existingVendor.ownerName}). You cannot use it for a ${targetRole} account.`
        );
      }
    }
  }
}
