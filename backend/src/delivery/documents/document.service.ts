import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryPartner,
  DeliveryPartnerDocument,
  DeliveryPartnerDocumentItem,
  DeliveryPartnerDocumentRecord,
} from '../schemas/delivery-partner.schema';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(DeliveryPartnerDocumentItem.name)
    private docModel: Model<DeliveryPartnerDocumentRecord>,
  ) {}

  private async getPartner(userId: string): Promise<DeliveryPartnerDocument> {
    const partner = await this.partnerModel.findOne({
      $or: [
        { userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined },
        { _id: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined },
      ].filter(Boolean),
    });
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }
    return partner;
  }

  async getDocuments(userId: string) {
    const partner = await this.getPartner(userId);
    const isApproved = partner.status === 'APPROVED' || partner.verificationStatus === 'VERIFIED';

    const mask = (str?: string) => {
      if (!str || str.length < 4) return 'Not Provided';
      return `${str.slice(0, 4)}****${str.slice(-4)}`;
    };

    return [
      {
        id: 'doc_dl',
        type: 'DRIVING_LICENSE',
        title: 'Commercial Driving License',
        documentNumberMasked: partner.drivingLicense ? mask(partner.drivingLicense) : 'Not uploaded',
        url: partner.dlImageUrl || '',
        status: isApproved && partner.dlImageUrl ? 'VERIFIED' : partner.dlImageUrl || partner.drivingLicense ? 'PENDING' : 'NOT_UPLOADED',
        issuedAt: 'Recent',
        expiresAt: partner.drivingLicense ? 'Active' : undefined,
      },
      {
        id: 'doc_rc',
        type: 'VEHICLE_RC',
        title: 'Vehicle Registration Certificate (RC)',
        documentNumberMasked: partner.rcNumber ? mask(partner.rcNumber) : (partner.vehicleNumber || 'Not uploaded'),
        url: partner.rcImageUrl || '',
        status: isApproved && partner.rcImageUrl ? 'VERIFIED' : partner.rcImageUrl || partner.rcNumber ? 'PENDING' : 'NOT_UPLOADED',
        issuedAt: 'Recent',
        expiresAt: partner.vehicleNumber ? 'Active' : undefined,
      },
      {
        id: 'doc_insurance',
        type: 'INSURANCE',
        title: 'Two-Wheeler Comprehensive Insurance',
        documentNumberMasked: partner.vehicleInsuranceUrl ? 'Insurance Document Linked' : 'Not uploaded',
        url: partner.vehicleInsuranceUrl || '',
        status: isApproved && partner.vehicleInsuranceUrl ? 'VERIFIED' : partner.vehicleInsuranceUrl ? 'PENDING' : 'NOT_UPLOADED',
        issuedAt: 'Recent',
        expiresAt: partner.vehicleInsuranceUrl ? 'Active' : undefined,
      },
      {
        id: 'doc_aadhaar',
        type: 'AADHAAR_PAN',
        title: 'National Identity Proof (Aadhaar)',
        documentNumberMasked: partner.aadharNumber ? `XXXX-XXXX-${partner.aadharNumber.slice(-4)}` : 'Not uploaded',
        url: partner.aadharFrontUrl || '',
        backUrl: partner.aadharBackUrl || '',
        status: isApproved && partner.aadharFrontUrl ? 'VERIFIED' : partner.aadharFrontUrl || partner.aadharNumber ? 'PENDING' : 'NOT_UPLOADED',
        issuedAt: 'Government UIDAI',
      },
    ];
  }

  async updateDocument(userId: string, docId: string, updates: { url?: string; documentNumber?: string }) {
    const partner = await this.getPartner(userId);

    if (docId === 'doc_dl' || docId === 'DRIVING_LICENSE') {
      if (updates.url) partner.dlImageUrl = updates.url;
      if (updates.documentNumber) partner.drivingLicense = updates.documentNumber.toUpperCase();
    } else if (docId === 'doc_rc' || docId === 'VEHICLE_RC') {
      if (updates.url) partner.rcImageUrl = updates.url;
      if (updates.documentNumber) partner.rcNumber = updates.documentNumber.toUpperCase();
    } else if (docId === 'doc_insurance' || docId === 'INSURANCE') {
      if (updates.url) partner.vehicleInsuranceUrl = updates.url;
    } else if (docId === 'doc_aadhaar' || docId === 'AADHAAR_PAN') {
      if (updates.url) partner.aadharFrontUrl = updates.url;
      if (updates.documentNumber) partner.aadharNumber = updates.documentNumber.replace(/\D/g, '');
    }

    // When updating, set verificationStatus to PENDING if not already APPROVED
    if (partner.status !== 'APPROVED') {
      partner.verificationStatus = 'PENDING';
      partner.status = 'PENDING';
    }

    await partner.save();
    return this.getDocuments(userId);
  }

  async getVehicle(userId: string) {
    const partner = await this.getPartner(userId);
    return {
      vehicleType: partner.vehicleType || 'BIKE',
      vehicleNumber: partner.vehicleNumber || 'Not Registered',
      vehicleModelYear: partner.vehicleModelYear || '2023',
      insuranceStatus: partner.vehicleInsuranceUrl ? 'LINKED' : 'PENDING',
      status: partner.status === 'APPROVED' ? 'VERIFIED' : 'PENDING',
    };
  }
}
