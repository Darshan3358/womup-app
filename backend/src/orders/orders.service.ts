import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import {
  OrderStatusHistory,
  OrderStatusHistoryDocument,
} from './schemas/order-status-history.schema';
import {
  OrderStatus,
  VALID_STATUS_TRANSITIONS,
} from '../common/enums/order-status.enum';
import { CartService } from '../cart/cart.service';
import { Address, AddressDocument } from '../addresses/schemas/address.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { InventoryService } from '../inventory/inventory.service';
import {
  CoinTransaction,
  CoinTransactionDocument,
} from '../coins/schemas/coin-transaction.schema';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from '../wallet/schemas/wallet-transaction.schema';
import { CreateOrderDto } from './dto/order.dto';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatusHistory.name)
    private historyModel: Model<OrderStatusHistoryDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CoinTransaction.name)
    private coinTxModel: Model<CoinTransactionDocument>,
    @InjectModel(WalletTransaction.name)
    private walletTxModel: Model<WalletTransactionDocument>,
    private cartService: CartService,
    private inventoryService: InventoryService,
    private trackingGateway: TrackingGateway,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const uId = new Types.ObjectId(userId);

    // Look up address or fall back to user's default / auto-provision
    let address = Types.ObjectId.isValid(dto.addressId)
      ? await this.addressModel.findOne({ _id: new Types.ObjectId(dto.addressId), userId: uId })
      : null;

    if (!address) {
      address = await this.addressModel.findOne({ userId: uId }).sort({ isDefault: -1, createdAt: -1 });
    }

    if (!address) {
      address = await this.addressModel.create({
        userId: uId,
        label: 'Home',
        houseNumber: 'Flat 402, Shivalik High Street',
        street: 'Prahlad Nagar, SG Highway',
        landmark: 'Near Corporate Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        isDefault: true,
        location: {
          type: 'Point',
          coordinates: [72.5714, 23.0225],
        },
      });
    }

    let orderItems: any[] = [];
    let itemSubtotal = 0;
    let mrpTotal = 0;
    let couponDiscount = 0;
    let coinsUsed = 0;
    let coinDiscount = 0;
    let deliveryFee = 0;
    let handlingFee = 5;
    let tip = 0;
    let totalAmount = 0;

    // 1. Process items: either from dto.items or server cart summary
    if (dto.items && Array.isArray(dto.items) && dto.items.length > 0) {
      for (const it of dto.items) {
        const prodId = Types.ObjectId.isValid(it.productId)
          ? new Types.ObjectId(it.productId)
          : new Types.ObjectId();
        const qty = Math.max(1, Number(it.quantity) || 1);
        const unitPrice = Number(it.price) || 50;
        const unitMrp = Number(it.mrp) || Math.max(unitPrice, unitPrice + 10);
        const sub = unitPrice * qty;
        itemSubtotal += sub;
        mrpTotal += unitMrp * qty;

        orderItems.push({
          productId: prodId,
          name: it.name || 'Worm Up Item',
          imageUrl: it.imageUrl || '',
          quantityLabel: it.quantityLabel || '1 unit',
          quantity: qty,
          unitPrice,
          unitMrp,
          subtotal: sub,
        });
      }

      deliveryFee = itemSubtotal >= 199 ? 0 : 15;
      totalAmount = Math.max(0, itemSubtotal + deliveryFee + handlingFee);
    } else {
      const summary = await this.cartService.getCartSummary(userId);
      if (!summary.items || summary.items.length === 0) {
        throw new BadRequestException('Your cart is empty. Add items before placing an order');
      }

      orderItems = summary.items.map((i) => ({
        productId: new Types.ObjectId(i.product.id),
        name: i.product.name,
        imageUrl: i.product.imageUrl,
        quantityLabel: i.product.quantityLabel,
        quantity: i.quantity,
        unitPrice: i.product.sellingPrice,
        unitMrp: i.product.mrp,
        subtotal: i.subtotal,
      }));

      itemSubtotal = summary.itemSubtotal;
      mrpTotal = summary.mrpTotal;
      couponDiscount = summary.couponDiscount;
      coinsUsed = summary.coinsUsed;
      coinDiscount = summary.coinDiscount;
      deliveryFee = summary.deliveryFee;
      handlingFee = summary.handlingFee;
      tip = summary.tip;
      totalAmount = summary.totalAmount;
    }

    const coords = address.location?.coordinates || [72.5714, 23.0225];

    // 2. Select Nearest Dark Store
    let store = await this.storeModel.findOne({ isActive: true }).exec();
    if (!store) {
      store = await this.storeModel.findOne().exec();
    }
    if (!store) {
      store = await this.storeModel.create({
        name: 'Worm Up Ahmedabad Central Dark Store',
        code: 'AHM-01',
        address: 'Prahlad Nagar, SG Highway',
        city: 'Ahmedabad',
        pincode: '380015',
        serviceRadiusKm: 10,
        estimatedDeliveryMinutes: 9,
        isActive: true,
        location: {
          type: 'Point',
          coordinates: [72.5714, 23.0225],
        },
      });
    }

    // 3. Confirm Inventory Reservation if supplied or reserve
    if (dto.reservationId) {
      await this.inventoryService.confirmReservation(dto.reservationId);
    }

    // 4. Handle Wallet Payment
    const user = await this.userModel.findById(uId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.paymentMethod === 'WALLET') {
      if (user.walletBalance < totalAmount) {
        throw new BadRequestException(
          `Insufficient wallet balance (Current: ₹${user.walletBalance}, Required: ₹${totalAmount})`,
        );
      }
      const before = user.walletBalance;
      user.walletBalance -= totalAmount;
      await user.save();

      await this.walletTxModel.create({
        userId: uId,
        type: 'DEBIT',
        amount: totalAmount,
        balanceBefore: before,
        balanceAfter: user.walletBalance,
        referenceType: 'ORDER_PAYMENT',
        status: 'SUCCESS',
        description: 'Payment for order',
      });
    }

    // 5. Handle Shopping Coins deduction
    if (coinsUsed > 0) {
      const beforeCoins = user.shoppingCoins;
      user.shoppingCoins -= coinsUsed;
      await user.save();

      await this.coinTxModel.create({
        userId: uId,
        type: 'SPEND',
        coins: coinsUsed,
        balanceBefore: beforeCoins,
        balanceAfter: user.shoppingCoins,
        referenceType: 'ORDER',
        description: 'Coins redeemed for discount at checkout',
      });
    }

    // 6. Create Order with snapshot records in MongoDB Atlas
    const orderNumber = `WORM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const estimatedArrival = new Date(Date.now() + 9 * 60 * 1000); // 9 mins

    const order = await this.orderModel.create({
      orderNumber,
      userId: uId,
      storeId: store._id,
      status: OrderStatus.PLACED,
      items: orderItems,
      deliveryAddress: {
        label: address.label || 'Home',
        houseNumber: address.houseNumber || 'Flat 402, Shivalik High Street',
        street: address.street || 'Prahlad Nagar, SG Highway',
        landmark: address.landmark || 'Near Corporate Road',
        city: address.city || 'Ahmedabad',
        pincode: address.pincode || '380015',
        coordinates: coords,
      },
      itemSubtotal,
      discount: Math.max(0, mrpTotal - itemSubtotal),
      couponDiscount,
      couponCode: undefined,
      coinsUsed,
      coinsDiscount: coinDiscount,
      deliveryFee,
      handlingFee,
      tip,
      totalAmount,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED',
      deliverySlot: 'Instant 9 Minutes',
      deliveryInstructions: dto.deliveryInstructions || 'Leave at door',
      estimatedArrival,
    });

    // 7. Record status history audit
    await this.historyModel.create({
      orderId: order._id,
      previousStatus: OrderStatus.PLACED,
      newStatus: OrderStatus.PLACED,
      changedByRole: 'CUSTOMER',
      changedById: uId,
      notes: 'Order placed by customer',
    });

    // 8. Reward 10% Shopping Coins on the purchase
    const earnedCoins = Math.max(5, Math.floor(itemSubtotal * 0.1));
    user.shoppingCoins += earnedCoins;
    await user.save();

    await this.coinTxModel.create({
      userId: uId,
      type: 'EARN',
      coins: earnedCoins,
      balanceBefore: user.shoppingCoins - earnedCoins,
      balanceAfter: user.shoppingCoins,
      referenceType: 'ORDER',
      referenceId: order._id.toString(),
      description: `Earned 10% Shopping Coins reward on Order #${orderNumber}`,
    });

    // 9. Clear customer cart
    await this.cartService.clearCart(userId);

    // 10. Emit real-time WebSocket event
    this.trackingGateway.notifyOrderStatus(order._id.toString(), OrderStatus.PLACED);

    this.logger.log(`Order #${orderNumber} created successfully for user ${userId}. Total: ₹${order.totalAmount}`);
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    targetStatus: OrderStatus,
    role: string,
    changedById?: string,
    notes?: string,
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const currentStatus = order.status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowedTransitions.join(', ')}]`,
      );
    }

    order.status = targetStatus;
    if (targetStatus === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
      order.paymentStatus = 'COMPLETED';
    } else if (targetStatus === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }
    await order.save();

    await this.historyModel.create({
      orderId: order._id,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      changedByRole: role,
      changedById: changedById ? new Types.ObjectId(changedById) : undefined,
      notes,
    });

    // Emit live WebSocket notification
    this.trackingGateway.notifyOrderStatus(order._id.toString(), targetStatus);

    return order;
  }

  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const uId = new Types.ObjectId(userId);
    const order = await this.orderModel.findOne({ _id: new Types.ObjectId(orderId), userId: uId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.PACKING) {
      throw new BadRequestException(
        `Order cannot be cancelled at stage '${order.status}'. Cancellation is only allowed before dispatch.`,
      );
    }

    // Process refund if paid via Wallet
    if (order.paymentMethod === 'WALLET' && order.paymentStatus === 'COMPLETED') {
      const user = await this.userModel.findById(uId);
      if (user) {
        const before = user.walletBalance;
        user.walletBalance += order.totalAmount;
        await user.save();

        await this.walletTxModel.create({
          userId: uId,
          type: 'REFUND',
          amount: order.totalAmount,
          balanceBefore: before,
          balanceAfter: user.walletBalance,
          referenceType: 'ORDER_REFUND',
          referenceId: order._id.toString(),
          status: 'SUCCESS',
          description: `Refund for cancelled order #${order.orderNumber}`,
        });
      }
    }

    // Refund coins if redeemed
    if (order.coinsUsed > 0) {
      const user = await this.userModel.findById(uId);
      if (user) {
        const before = user.shoppingCoins;
        user.shoppingCoins += order.coinsUsed;
        await user.save();

        await this.coinTxModel.create({
          userId: uId,
          type: 'REFUND',
          coins: order.coinsUsed,
          balanceBefore: before,
          balanceAfter: user.shoppingCoins,
          referenceType: 'ORDER',
          referenceId: order._id.toString(),
          description: `Refund of redeemed coins for cancelled order #${order.orderNumber}`,
        });
      }
    }

    return this.updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      'CUSTOMER',
      userId,
      reason || 'Cancelled by customer',
    );
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
      })
      .populate('deliveryPartnerId', 'fullName phoneNumber vehicleNumber rating')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getOrderHistory(userId: string, page = 1, limit = 20) {
    const uId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find({ userId: uId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('deliveryPartnerId', 'fullName phoneNumber vehicleNumber')
        .exec(),
      this.orderModel.countDocuments({ userId: uId }).exec(),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForAdmin(status?: string, page = 1, limit = 20) {
    const query: any = {};
    if (status) query.status = status;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name phone')
        .populate('deliveryPartnerId', 'fullName phoneNumber')
        .exec(),
      this.orderModel.countDocuments(query).exec(),
    ]);

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
