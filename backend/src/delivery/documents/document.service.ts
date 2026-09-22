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
    const partner = await this.partnerModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }
    return partner;
  }

  async getDocuments(userId: string) {
    const partner = await this.getPartner(userId);
    let docs = await this.docModel.find({ riderId: partner._id });

    if (docs.length === 0) {
      // Return and seed initial verified documents
      const defaults = [
        {
          riderId: partner._id,
          type: 'DRIVING_LICENSE',
          title: 'Commercial Driving License',
          documentNumberMasked: 'GJ01-2019-0034****',
          status: 'VERIFIED',
          issuedAt: '12 Jan 2021',
          expiresAt: '11 Jan 2031',
        },
        {
          riderId: partner._id,
          type: 'VEHICLE_RC',
          title: 'Vehicle Registration Certificate (RC)',
          documentNumberMasked: 'GJ-01-ET-****',
          status: 'VERIFIED',
          issuedAt: '04 Mar 2022',
          expiresAt: '03 Mar 2037',
        },
        {
          riderId: partner._id,
          type: 'INSURANCE',
          title: 'Two-Wheeler Comprehensive Insurance',
          documentNumberMasked: 'POL-ICICI-9938****',
          status: 'VERIFIED',
          issuedAt: '15 Oct 2025',
          expiresAt: '14 Oct 2026',
        },
        {
          riderId: partner._id,
          type: 'AADHAAR_PAN',
          title: 'National Identity Proof (Aadhaar)',
          documentNumberMasked: 'XXXX-XXXX-8921',
          status: 'VERIFIED',
        },
      ];
      docs = await this.docModel.insertMany(defaults);
    }

    return docs.map((d) => ({
      id: d._id.toString(),
      type: d.type,
      title: d.title,
      documentNumberMasked: d.documentNumberMasked,
      status: d.status,
      issuedAt: d.issuedAt,
      expiresAt: d.expiresAt,
    }));
  }

  async getVehicle(userId: string) {
    const partner = await this.getPartner(userId);
    return {
      vehicleType: partner.vehicleType || 'EV_SCOOTER',
      vehicleNumber: partner.vehicleNumber || 'GJ-01-ET-4829',
      registrationDate: '04 Mar 2022',
      insuranceExpiry: '14 Oct 2026',
      pucExpiry: '11 Jan 2027',
      status: 'VERIFIED',
    };
  }
}
