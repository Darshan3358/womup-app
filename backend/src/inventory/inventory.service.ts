import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  Inventory,
  InventoryDocument,
  InventoryReservation,
  InventoryReservationDocument,
} from './schemas/inventory.schema';

export interface ReservationItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryReservation.name)
    private reservationModel: Model<InventoryReservationDocument>,
  ) {}

  async checkStock(storeId: string, items: ReservationItem[]) {
    const sId = new Types.ObjectId(storeId);
    const unavailable: { productId: string; requested: number; available: number }[] = [];

    for (const item of items) {
      const pId = new Types.ObjectId(item.productId);
      const query: any = { storeId: sId, productId: pId };
      if (item.variantId) {
        query.variantId = new Types.ObjectId(item.variantId);
      }

      const record = await this.inventoryModel.findOne(query).exec();
      const available = record ? record.availableQty : 100; // Default simulated warehouse stock

      if (available < item.quantity) {
        unavailable.push({
          productId: item.productId,
          requested: item.quantity,
          available,
        });
      }
    }

    return {
      isAvailable: unavailable.length === 0,
      unavailable,
    };
  }

  async reserveInventory(storeId: string, userId: string, items: ReservationItem[]) {
    const stockCheck = await this.checkStock(storeId, items);
    if (!stockCheck.isAvailable) {
      throw new BadRequestException({
        message: 'Some items in your cart are currently out of stock',
        unavailable: stockCheck.unavailable,
      });
    }

    const reservationId = `RES-${crypto.randomUUID()}`;
    const sId = new Types.ObjectId(storeId);
    const uId = new Types.ObjectId(userId);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

    // Atomically shift quantities from availableQty to reservedQty
    for (const item of items) {
      const pId = new Types.ObjectId(item.productId);
      const query: any = { storeId: sId, productId: pId };
      if (item.variantId) {
        query.variantId = new Types.ObjectId(item.variantId);
      }

      await this.inventoryModel.findOneAndUpdate(
        query,
        {
          $inc: { availableQty: -item.quantity, reservedQty: item.quantity },
        },
        { upsert: true },
      );
    }

    const reservation = await this.reservationModel.create({
      reservationId,
      userId: uId,
      storeId: sId,
      items: items.map((i) => ({
        productId: new Types.ObjectId(i.productId),
        variantId: i.variantId ? new Types.ObjectId(i.variantId) : undefined,
        quantity: i.quantity,
      })),
      status: 'PENDING',
      expiresAt,
    });

    this.logger.log(`Created inventory reservation ${reservationId} for user ${userId} with 10m TTL`);

    return {
      reservationId,
      expiresAt,
      expiresInSeconds: 600,
    };
  }

  async releaseReservation(reservationId: string) {
    const reservation = await this.reservationModel.findOne({
      reservationId,
      status: 'PENDING',
    });

    if (!reservation) {
      return { released: false, message: 'Reservation not found or already processed' };
    }

    // Restore stock: decrement reservedQty and increment availableQty
    for (const item of reservation.items) {
      const query: any = { storeId: reservation.storeId, productId: item.productId };
      if (item.variantId) {
        query.variantId = item.variantId;
      }

      await this.inventoryModel.updateOne(query, {
        $inc: { availableQty: item.quantity, reservedQty: -item.quantity },
      });
    }

    reservation.status = 'RELEASED';
    await reservation.save();

    this.logger.log(`Released inventory reservation ${reservationId}`);
    return { released: true };
  }

  async confirmReservation(reservationId: string) {
    const reservation = await this.reservationModel.findOne({
      reservationId,
      status: 'PENDING',
    });

    if (!reservation) {
      return { confirmed: false, message: 'Reservation not found or expired' };
    }

    // Finalize order: decrement reservedQty and increment soldQty
    for (const item of reservation.items) {
      const query: any = { storeId: reservation.storeId, productId: item.productId };
      if (item.variantId) {
        query.variantId = item.variantId;
      }

      await this.inventoryModel.updateOne(query, {
        $inc: { reservedQty: -item.quantity, soldQty: item.quantity },
      });
    }

    reservation.status = 'CONFIRMED';
    await reservation.save();

    return { confirmed: true };
  }
}
