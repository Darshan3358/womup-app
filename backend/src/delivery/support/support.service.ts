import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryPartner,
  DeliveryPartnerDocument,
  SupportTicket,
  SupportTicketDocument,
} from '../schemas/delivery-partner.schema';

import { DeliveryPartnerCacheService } from '../common/partner-cache.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(SupportTicket.name)
    private ticketModel: Model<SupportTicketDocument>,
    private readonly partnerCacheService: DeliveryPartnerCacheService,
  ) {}

  private async getPartner(userId: string): Promise<DeliveryPartnerDocument> {
    return this.partnerCacheService.getPartner(userId);
  }

  async getSupportOptions() {
    return {
      hubName: 'Satellite Hub Operations',
      hubPhone: '+91 79 4000 8920',
      emergencyPolice: '112',
      emergencyAmbulance: '108',
      categories: [
        { id: 'CAT-1', label: 'Order & Packaging Problem', priority: 'HIGH' },
        { id: 'CAT-2', label: 'Wrong Customer Address', priority: 'MEDIUM' },
        { id: 'CAT-3', label: 'Vehicle Breakdown', priority: 'HIGH' },
        { id: 'CAT-4', label: 'COD Cash Payment Dispute', priority: 'MEDIUM' },
        { id: 'CAT-5', label: 'App or GPS Malfunction', priority: 'LOW' },
      ],
    };
  }

  async createTicket(
    userId: string,
    data: { category: string; description: string; orderId?: string },
  ) {
    const partner = await this.getPartner(userId);
    const ticket = await this.ticketModel.create({
      riderId: partner._id,
      orderId: data.orderId ? new Types.ObjectId(data.orderId) : undefined,
      category: data.category,
      description: data.description,
      status: 'OPEN',
    });

    return {
      success: true,
      ticketId: ticket._id.toString(),
      message: 'Support ticket registered with dark store dispatch manager',
    };
  }

  async getNotifications(userId: string) {
    const t0 = Date.now();
    await this.getPartner(userId);
    const t1 = Date.now();
    if (t1 - t0 > 100) {
      console.log(`[supportService.getNotifications] getPartner took ${t1 - t0}ms`);
    }
    return [
      {
        id: 'NOTIF-1',
        title: 'Settlement Completed',
        message: 'Your yesterday payout of ₹980 has been credited to HDFC Bank A/C ****4829',
        type: 'PAYOUT',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'NOTIF-2',
        title: 'On-Time Performance',
        message: 'Great job maintaining your high on-time delivery track record today!',
        type: 'PERFORMANCE',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }
}
