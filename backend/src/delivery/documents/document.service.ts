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
    let user: any = null;
    if (partner.userId) {
      try {
        user = await this.partnerModel.db.collection('users').findOne({ _id: partner.userId });
      } catch {
        // ignore
      }
    }

    const isApproved = partner.status === 'APPROVED' || partner.verificationStatus === 'VERIFIED';

    const mask = (str?: string) => {
      if (!str || str.length < 4) return 'Not Provided';
      return `${str.slice(0, 4)}****${str.slice(-4)}`;
    };

    const dlImg = partner.dlImageUrl || user?.dlImageUrl || user?.drivingLicenseImage || '';
    const dlNum = partner.drivingLicense || user?.drivingLicense || '';

    const rcImg = partner.rcImageUrl || user?.rcImageUrl || user?.rcFrontImage || '';
    const rcNum = partner.rcNumber || user?.rcNumber || partner.vehicleNumber || '';

    const insImg = partner.vehicleInsuranceUrl || user?.vehicleInsuranceUrl || user?.insuranceImage || '';

    const aadharFront = partner.aadharFrontUrl || user?.aadharFrontImage || user?.aadharFrontUrl || user?.customer_image_aadhar_front || '';
    const aadharBack = partner.aadharBackUrl || user?.aadharBackImage || user?.aadharBackUrl || user?.customer_image_aadhar_back || '';
    const aadharNum = partner.aadharNumber || user?.aadharNumber || '';

    return [
      {
        id: 'doc_dl',
        type: 'DRIVING_LICENSE',
        title: 'Commercial Driving License',
        documentNumberMasked: dlNum ? mask(dlNum) : 'Not uploaded',
        url: dlImg,
        fileUrl: dlImg,
        status: isApproved && dlImg ? 'VERIFIED' : dlImg || dlNum ? 'PENDING' : 'NOT_UPLOADED',
        issuedAt: 'Recent',
        expiresAt: dlNum ? 'Active' : undefined,
      },
      {
        id: 'doc_rc',
        type: 'VEHICLE_RC',
        title: 'Vehicle Registration Certificate (RC)',
        documentNumberMasked: rcNum ? mask(rcNum) : 'Not uploaded',
        url: rcImg,
        fileUrl: rcImg,
        status: isApproved && rcImg ? 'VERIFIED' : rcImg || rcNum ? 'PENDING' : 'NOT_UPLOADED',
        issuedAt: 'Recent',
        expiresAt: rcNum ? 'Active' : undefined,
      },
      {
        id: 'doc_insurance',
        type: 'INSURANCE',
        title: 'Two-Wheeler Comprehensive Insurance',
        documentNumberMasked: insImg ? 'Insurance Document Linked' : 'Not uploaded',
        url: insImg,
        fileUrl: insImg,
        status: isApproved && insImg ? 'VERIFIED' : insImg ? 'PENDING' : 'NOT_UPLOADED',
        issuedAt: 'Recent',
        expiresAt: insImg ? 'Active' : undefined,
      },
      {
        id: 'doc_aadhaar',
        type: 'AADHAAR_PAN',
        title: 'National Identity Proof (Aadhaar)',
        documentNumberMasked: aadharNum ? `XXXX-XXXX-${aadharNum.slice(-4)}` : 'Not uploaded',
        url: aadharFront,
        fileUrl: aadharFront,
        backUrl: aadharBack,
        status: isApproved && aadharFront ? 'VERIFIED' : aadharFront || aadharNum ? 'PENDING' : 'NOT_UPLOADED',
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
