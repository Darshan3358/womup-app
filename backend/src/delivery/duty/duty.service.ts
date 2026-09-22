import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeliveryPartner,
  DeliveryPartnerDocument,
  RiderDutySession,
  RiderDutySessionDocument,
} from '../schemas/delivery-partner.schema';

@Injectable()
export class DutyService {
  constructor(
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(RiderDutySession.name)
    private dutyModel: Model<RiderDutySessionDocument>,
  ) {}

  private async getPartner(userId: string): Promise<DeliveryPartnerDocument> {
    const partner = await this.partnerModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }
    return partner;
  }

  async getDutyHistory(userId: string) {
    const partner = await this.getPartner(userId);
    const sessions = await this.dutyModel
      .find({ riderId: partner._id })
      .sort({ startedAt: -1 })
      .limit(20);

    return sessions.map((s) => ({
      id: s._id.toString(),
      date: s.startedAt ? new Date(s.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
      onlineTime: s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00 AM',
      offlineTime: s.isActive ? 'Active Now' : s.endedAt ? new Date(s.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:00 PM',
      totalActiveMinutes: s.onlineDurationMinutes || 0,
      deliveriesCompleted: s.ordersCompleted || 0,
    }));
  }

  async getPerformance(userId: string) {
    const partner = await this.getPartner(userId);
    return {
      acceptanceRate: partner.acceptanceRate ?? 0,
      completionRate: partner.completionRate ?? 0,
      avgDeliveryMinutes: partner.avgDeliveryMinutes ?? 0,
      customerRating: partner.rating ?? 0,
      totalDeliveries: partner.totalDeliveries ?? 0,
      onTimeRate: partner.onTimeRate ?? 0,
      cancelledDeliveries: partner.cancelledDeliveries ?? 0,
    };
  }
}
