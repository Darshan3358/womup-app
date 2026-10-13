import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
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
import {
  DeliveryPartner,
  DeliveryPartnerDocument,
  DeliveryAssignment,
  DeliveryAssignmentDocument,
  RiderAssignmentStatus,
} from '../delivery/schemas/delivery-partner.schema';
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
    @InjectModel(DeliveryPartner.name)
    private partnerModel: Model<DeliveryPartnerDocument>,
    @InjectModel(DeliveryAssignment.name)
    private assignmentModel: Model<DeliveryAssignmentDocument>,
    @InjectConnection() private readonly connection: Connection,
    private cartService: CartService,
    private inventoryService: InventoryService,
    private trackingGateway: TrackingGateway,
  ) { }

  async createOrder(userId: string | undefined, dto: CreateOrderDto) {
    let uId: Types.ObjectId;
    if (userId && Types.ObjectId.isValid(userId)) {
      uId = new Types.ObjectId(userId);
    } else {
      let customerUser = await this.userModel.findOne({ role: 'CUSTOMER' }).sort({ createdAt: -1 });
      if (!customerUser) {
        customerUser = await this.userModel.create({
          fullName: (dto.address as any)?.fullName || 'Wom Up Customer',
          phoneNumber: (dto.address as any)?.phoneNumber || '+919078563412',
          role: 'CUSTOMER',
          walletBalance: 1000,
          shoppingCoins: 100,
        });
      }
      uId = customerUser._id;
    }

    // Authoritative Delivery Address & Coordinates Resolution
    const inlineAddr = dto.address || (dto as any).deliveryAddress;
    const reqLng = Number(
      inlineAddr?.location?.coordinates?.[0] ??
      inlineAddr?.longitude ??
      (dto as any).longitude ??
      ((dto as any).coordinates?.[0])
    );
    const reqLat = Number(
      inlineAddr?.location?.coordinates?.[1] ??
      inlineAddr?.latitude ??
      (dto as any).latitude ??
      ((dto as any).coordinates?.[1])
    );
    const hasValidInlineCoords = !isNaN(reqLng) && !isNaN(reqLat) && reqLng !== 0 && reqLat !== 0;

    let address: any = null;

    if (hasValidInlineCoords && inlineAddr) {
      const houseNumber = inlineAddr.houseFlat || inlineAddr.houseNumber || 'House/Flat';
      const street = inlineAddr.street || 'Street';
      const landmark = inlineAddr.areaLandmark || inlineAddr.landmark || '';
      const city = inlineAddr.city || 'Ahmedabad';
      const pincode = inlineAddr.pincode || '382481';
      const label = inlineAddr.label || 'Delivery Address';

      // If addressId was explicitly supplied and matches user, update it with active form details
      if (dto.addressId && Types.ObjectId.isValid(dto.addressId)) {
        address = await this.addressModel.findOneAndUpdate(
          { _id: new Types.ObjectId(dto.addressId), userId: uId },
          {
            houseNumber,
            street,
            landmark,
            city,
            pincode,
            'location.coordinates': [reqLng, reqLat],
            updatedAt: new Date(),
          },
          { new: true }
        );
      }

      // If no existing address matched, persist or provision this address so it is saved in user account
      if (!address) {
        address = await this.addressModel.create({
          userId: uId,
          label,
          houseNumber,
          street,
          landmark,
          city,
          state: 'Gujarat',
          pincode,
          location: {
            type: 'Point',
            coordinates: [reqLng, reqLat],
          },
          isDefault: true,
        });
      }
      this.logger.log(`[OrdersService] Resolved authoritative order delivery address for user ${userId} at [${reqLng}, ${reqLat}] (${street}, ${landmark})`);
    } else if (dto.addressId && Types.ObjectId.isValid(dto.addressId)) {
      address = await this.addressModel.findOne({ _id: new Types.ObjectId(dto.addressId), userId: uId });
    }

    if (!address) {
      address = await this.addressModel.findOne({ userId: uId }).sort({ isDefault: -1, createdAt: -1 });
    }

    if (!address) {
      address = await this.addressModel.create({
        userId: uId,
        label: 'Home',
        houseNumber: 'A-101, Green View',
        street: 'Chandlodiya - Tragad',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '382481',
        location: {
          type: 'Point',
          coordinates: [72.5507, 23.1288],
        },
        isDefault: true,
      });
    }

    if (!address.location?.coordinates || address.location.coordinates.length < 2) {
      address.location = {
        type: 'Point',
        coordinates: [72.5507, 23.1288],
      };
      await address.save();
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

        const rawVid = (it as any).variantId;
        const variantId = rawVid && Types.ObjectId.isValid(rawVid) ? new Types.ObjectId(rawVid) : undefined;

        orderItems.push({
          productId: prodId,
          variantId,
          name: it.name || 'Worm Up Item',
          imageUrl: it.imageUrl || (it as any).image || '',
          quantityLabel: it.quantityLabel || '1 unit',
          quantity: qty,
          unitPrice,
          unitMrp,
          subtotal: sub,
        });
      }

      tip = typeof dto.tip === 'number' ? Math.max(0, Number(dto.tip)) : 0;
      if (typeof dto.deliveryFee === 'number' && dto.deliveryFee >= 0) {
        deliveryFee = dto.deliveryFee;
      } else {
        deliveryFee = 40; // Dynamic rate floor for Prahlad Nagar zone
      }
      totalAmount = Math.max(0, itemSubtotal + deliveryFee + handlingFee + tip);
    } else {
      const summary = await this.cartService.getCartSummary(userId);
      if (!summary.items || summary.items.length === 0) {
        throw new BadRequestException('Your cart is empty. Add items before placing an order');
      }

      orderItems = summary.items.map((i) => ({
        productId: new Types.ObjectId(i.product.id),
        variantId: i.variantId && Types.ObjectId.isValid(i.variantId)
          ? new Types.ObjectId(i.variantId)
          : (i.variant?.id && Types.ObjectId.isValid(i.variant.id) ? new Types.ObjectId(i.variant.id) : undefined),
        name: i.product.name,
        imageUrl: i.product.imageUrl,
        quantityLabel: i.variant?.label || i.product.quantityLabel,
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
      tip = typeof dto.tip === 'number' ? Math.max(0, Number(dto.tip)) : (summary.tip || 0);
      totalAmount = Math.max(0, (summary.totalAmount - (summary.tip || 0)) + tip);
    }

    const coords = address.location?.coordinates;
    if (!coords || coords.length < 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
      throw new BadRequestException('The selected delivery address does not have valid GPS coordinates.');
    }
    const lng = coords[0];
    const lat = coords[1];

    // 2. Select Serviceable Dark Store using Geospatial Engine (Polygon / 2dsphere)
    // Priority: Always route to the nearest dark store for the delivery address coordinates [lng, lat]
    let store: StoreDocument | null = null;
    let matchedArea: any = null;

    // Step A: Validate dto.storeId if provided by frontend and within 6 km of delivery address
    if (dto.storeId && Types.ObjectId.isValid(dto.storeId)) {
      const explicitStore = await this.storeModel.findOne({ _id: new Types.ObjectId(dto.storeId), isActive: true }).exec();
      if (explicitStore && explicitStore.location?.coordinates) {
        const [sLng, sLat] = explicitStore.location.coordinates;
        const R = 6371;
        const dLat = ((lat - sLat) * Math.PI) / 180;
        const dLng = ((lng - sLng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((sLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distKm <= 6.0) {
          store = explicitStore;
        }
      }
    }

    // Step B: Find nearest Dark Store within 6 km using 2dsphere geometry ($near)
    // In 9-minute instant delivery, physically closest store to customer takes precedence over overlapping polygons
    if (!store) {
      const nearest = await this.storeModel.find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: 6000, // Strict 6 km delivery radius for 9-11 min quick commerce
          },
        },
      }).limit(1).exec();

      if (nearest && nearest.length > 0) {
        store = nearest[0];
      }
    }

    // Step C: Fallback to Area Polygon intersection if $near didn't match
    if (!store) {
      matchedArea = await this.storeModel.db.collection('areas').findOne({
        polygon: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
          },
        },
        isActive: true,
      });

      if (matchedArea) {
        store = await this.resolveStoreForOrder([lng, lat], matchedArea, dto.items);
      }
    }

    // STRICT REJECTION: If no active dark store is found near delivery address, reject order.
    // NEVER fall back to a far-away store (e.g. Tragad) for a Thaltej address!
    if (!store) {
      throw new BadRequestException('Delivery not available in your area. No active Dark Store found within 9-minute delivery radius.');
    }

    if (!store) {
      throw new BadRequestException('No active dark store available for this delivery address');
    }

    // 2b. Authoritative Price & Area-Specific Integrity Check
    // Re-verify every item price against the resolved store's area_pricing and products catalog
    const priceAdjustments: Array<{
      productId: any;
      name: string;
      oldPrice: number;
      newPrice: number;
      quantity: number;
      adjustment: number;
    }> = [];
    let itemSubtotalAdjustment = 0;
    let mrpAdjustment = 0;

    for (const item of orderItems) {
      const prodId = item.productId;
      const vId = item.variantId;

      let authoritativePrice: number | null = null;
      let authoritativeMrp: number | null = null;
      let authoritativeStock: number | null = null;

      // 1. Check if area pricing override exists for this store's area
      if (store.areaId) {
        const areaPricingQuery: any = {
          areaId: Types.ObjectId.isValid(store.areaId.toString()) ? new Types.ObjectId(store.areaId.toString()) : store.areaId,
        };
        if (vId) {
          areaPricingQuery.variantId = Types.ObjectId.isValid(vId.toString()) ? new Types.ObjectId(vId.toString()) : vId;
        } else if (prodId) {
          areaPricingQuery.productId = Types.ObjectId.isValid(prodId.toString()) ? new Types.ObjectId(prodId.toString()) : prodId;
        }

        const areaPricingDoc = await this.connection.collection('area_pricing').findOne(areaPricingQuery);
        if (areaPricingDoc && typeof areaPricingDoc.price === 'number') {
          authoritativePrice = areaPricingDoc.price;
          if (typeof areaPricingDoc.mrp === 'number') authoritativeMrp = areaPricingDoc.mrp;
          if (typeof areaPricingDoc.stock === 'number') authoritativeStock = areaPricingDoc.stock;
        }
      }

      // 2. If no area pricing override, check variant or master product
      if (authoritativePrice === null) {
        if (vId) {
          const variantDoc = await this.connection.collection('product_variants').findOne({
            _id: Types.ObjectId.isValid(vId.toString()) ? new Types.ObjectId(vId.toString()) : vId,
          });
          if (variantDoc) {
            authoritativePrice = variantDoc.sellingPrice;
            authoritativeMrp = variantDoc.mrp || variantDoc.sellingPrice;
            if (typeof variantDoc.stock === 'number') authoritativeStock = variantDoc.stock;
          }
        }
        if (authoritativePrice === null && prodId) {
          const productDoc = await this.connection.collection('products').findOne({
            _id: Types.ObjectId.isValid(prodId.toString()) ? new Types.ObjectId(prodId.toString()) : prodId,
          });
          if (productDoc) {
            authoritativePrice = productDoc.sellingPrice;
            authoritativeMrp = productDoc.mrp || productDoc.sellingPrice;
            if (typeof productDoc.stock === 'number') authoritativeStock = productDoc.stock;
          }
        }
      }

      // Check stock in serving dark store
      if (authoritativeStock !== null && authoritativeStock <= 0) {
        throw new BadRequestException(
          `"${item.name}" is currently out of stock at ${store.name || 'serving store'}. Please remove it to continue.`,
        );
      }
      if (authoritativeStock !== null && authoritativeStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${item.name}" at ${store.name || 'serving store'}. Available: ${authoritativeStock}, Requested: ${item.quantity}`,
        );
      }

      // Auto-correct price mismatch instead of throwing error:
      if (authoritativePrice !== null && typeof item.unitPrice === 'number' && item.unitPrice !== authoritativePrice) {
        const oldUnit = item.unitPrice;
        const newUnit = authoritativePrice;
        const oldSub = oldUnit * item.quantity;
        const newSub = newUnit * item.quantity;
        const diff = newSub - oldSub;

        priceAdjustments.push({
          productId: item.productId,
          name: item.name,
          oldPrice: oldUnit,
          newPrice: newUnit,
          quantity: item.quantity,
          adjustment: diff,
        });

        itemSubtotalAdjustment += diff;
        item.unitPrice = newUnit;
        item.subtotal = newSub;

        if (authoritativeMrp !== null && typeof item.unitMrp === 'number') {
          const oldMrpSub = item.unitMrp * item.quantity;
          const newMrpSub = authoritativeMrp * item.quantity;
          mrpAdjustment += (newMrpSub - oldMrpSub);
          item.unitMrp = authoritativeMrp;
        }
      }
    }

    // Recalculate totals if price adjustments occurred
    const originalTotal = totalAmount;
    if (itemSubtotalAdjustment !== 0) {
      itemSubtotal = Math.max(0, itemSubtotal + itemSubtotalAdjustment);
      mrpTotal = Math.max(itemSubtotal, mrpTotal + mrpAdjustment);
      totalAmount = Math.max(
        0,
        itemSubtotal + deliveryFee + handlingFee + tip - couponDiscount - coinDiscount,
      );

      // Fraud / Extreme variance safety guard:
      // If adjustment swings total by more than 50% of original total, reject
      if (originalTotal > 0 && Math.abs(totalAmount - originalTotal) > originalTotal * 0.5) {
        throw new BadRequestException('Significant price change detected. Please refresh your cart.');
      }
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
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await this.orderModel.create({
      orderNumber,
      userId: uId,
      storeId: store._id,
      status: OrderStatus.PLACED,
      deliveryOtp,
      items: orderItems,
      deliveryAddress: {
        label: address.label || '',
        houseNumber: address.houseNumber || '',
        street: address.street || '',
        landmark: address.landmark || '',
        city: address.city || '',
        pincode: address.pincode || '',
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
      priceAdjustments,
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

    // 9. Automated Dispatch Engine: Assign to available online rider
    try {
      const onlinePartner = await this.partnerModel.findOne({ isOnline: true }).sort({ updatedAt: -1 });
      if (onlinePartner) {
        const payoutAmount = Math.max(35, Math.round((order.totalAmount || 50) * 0.15) + 25);
        await this.assignmentModel.create({
          orderId: order._id,
          partnerId: onlinePartner._id,
          status: RiderAssignmentStatus.OFFERED,
          payoutAmount,
          distanceKm: 2.1,
          etaMinutes: 12,
          assignedAt: new Date(),
        });
        this.logger.log(`[Dispatch] Auto-offered Order #${orderNumber} to rider ${onlinePartner.fullName} (${onlinePartner.partnerCode})`);
      }
    } catch (dispatchErr: any) {
      this.logger.warn(`Failed to auto-dispatch order #${orderNumber}: ${dispatchErr.message}`);
    }

    // 9b. Real-Time Stock Management & Atomic Deduction
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        try {
          const prodObjId = Types.ObjectId.isValid(item.productId.toString())
            ? new Types.ObjectId(item.productId.toString())
            : item.productId;

          // 1. Atomically deduct stock from master products collection
          await this.connection.collection('products').updateOne(
            { _id: prodObjId as any },
            { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } }
          );

          // 2. Atomically deduct stock from ONLY the specific ordered product_variant
          const vList = await this.connection.collection('product_variants').find({
            $or: [
              { productId: prodObjId as any },
              { productId: item.productId.toString() },
            ],
          }).toArray();

          if (vList.length > 0) {
            let matchedV = null;
            if (item.variantId) {
              matchedV = vList.find((v) => v._id.toString() === item.variantId.toString());
            }
            if (!matchedV && item.quantityLabel) {
              matchedV = vList.find((v) =>
                v.weightOrVolume &&
                v.weightOrVolume.trim().toLowerCase() === item.quantityLabel.trim().toLowerCase()
              );
            }
            if (!matchedV && item.name) {
              matchedV = vList.find((v) =>
                v.weightOrVolume && item.name.toLowerCase().includes(v.weightOrVolume.toLowerCase())
              );
            }
            if (!matchedV) {
              matchedV = vList.find((v) => v.isDefault) || vList[0];
            }

            if (matchedV) {
              await this.connection.collection('product_variants').updateOne(
                { _id: matchedV._id },
                { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } }
              );

              // 2b. Atomically deduct stock from area_pricing for this dark store's area / delivery zone
              let targetAreaId = store?.areaId || (matchedArea as any)?._id || (order.deliveryAddress as any)?.areaId;
              if (!targetAreaId && store?._id) {
                const storeObjId = Types.ObjectId.isValid(store._id.toString()) ? new Types.ObjectId(store._id.toString()) : store._id;
                const sDoc = await this.connection.collection('stores').findOne({
                  $or: [
                    { _id: storeObjId as any },
                    { _id: store._id.toString() as any },
                  ],
                });
                targetAreaId = sDoc?.areaId;
              }
              if (targetAreaId) {
                const aObjId = Types.ObjectId.isValid(targetAreaId.toString())
                  ? new Types.ObjectId(targetAreaId.toString())
                  : targetAreaId;

                await this.connection.collection('area_pricing').updateOne(
                  {
                    $and: [
                      { $or: [{ variantId: matchedV._id }, { variantId: matchedV._id.toString() }] },
                      { $or: [{ areaId: aObjId }, { areaId: targetAreaId.toString() }] },
                    ],
                  },
                  {
                    $inc: { stock: -item.quantity },
                    $set: { updatedAt: new Date() },
                  }
                );
              }
            }
          }

          // 3. Atomically update store-specific inventory
          let updatedInv: any = null;
          if (store) {
            updatedInv = await this.connection.collection('inventory').findOneAndUpdate(
              {
                storeId: new Types.ObjectId(store._id.toString()),
                productId: prodObjId,
              },
              {
                $inc: {
                  availableQty: -item.quantity,
                  reservedQty: item.quantity,
                  soldQty: item.quantity,
                },
              },
              { upsert: true, returnDocument: 'after' }
            );
          }

          // Fetch fresh master product to get updated stock
          const freshProd = await this.connection.collection('products').findOne({
            _id: prodObjId as any,
          });

          // 4. Broadcast real-time stock update to Admin and Store App
          this.trackingGateway.broadcastInventoryUpdate({
            storeId: store?._id?.toString() || '',
            productId: item.productId.toString(),
            productName: item.name,
            availableQty: freshProd?.stock ?? (updatedInv?.availableQty ?? 0),
            reservedQty: updatedInv?.reservedQty ?? item.quantity,
            newAvailableStock: freshProd?.stock ?? (updatedInv?.availableQty ?? 0),
          });
        } catch (invErr: any) {
          this.logger.warn(`Failed to update real-time stock for product ${item.productId}: ${invErr.message}`);
        }
      }
    }

    // 10. Clear customer cart
    if (userId) {
      await this.cartService.clearCart(userId);
    }

    const resolvedUserIdStr = uId.toString();

    // 11. Emit real-time WebSocket events to all apps (Web, Mobile App, Store, Rider, Admin)
    this.trackingGateway.broadcastNewOrder(order);
    this.trackingGateway.notifyOrderStatus(order._id.toString(), OrderStatus.PLACED, {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      deliveryOtp: order.deliveryOtp,
      status: OrderStatus.PLACED,
      userId: resolvedUserIdStr,
      order,
    });
    this.trackingGateway.emitOrderCreated(resolvedUserIdStr, order);
    this.trackingGateway.emitWalletUpdated(resolvedUserIdStr, {
      shoppingCoins: user.shoppingCoins,
      walletBalance: (user as any).walletBalance || 0,
    });

    if (priceAdjustments.length > 0) {
      this.trackingGateway.emitOrderPriceAdjusted(resolvedUserIdStr, {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        priceAdjustments,
        oldTotal: originalTotal,
        newTotal: totalAmount,
        storeName: store.name || 'Serving Dark Store',
      });
    }

    this.logger.log(`Order #${orderNumber} placed. Delivery PIN: ${deliveryOtp}. Total: ₹${order.totalAmount}`);
    const populated = await this.orderModel
      .findById(order._id)
      .populate('deliveryPartnerId', 'fullName phoneNumber vehicleNumber rating currentLocation')
      .populate('storeId', 'name address location')
      .lean();
    return populated || order;
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

    // Restock inventory and master products if transitioning to CANCELLED
    if (currentStatus !== OrderStatus.CANCELLED && targetStatus === OrderStatus.CANCELLED) {
      await this.restockOrderItems(order);
    }

    await this.historyModel.create({
      orderId: order._id,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      changedByRole: role,
      changedById: changedById ? new Types.ObjectId(changedById) : undefined,
      notes,
    });

    // Emit live WebSocket notification across order room, user sync room, and global
    this.trackingGateway.notifyOrderStatus(order._id.toString(), targetStatus, {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: order.userId?.toString(),
      order,
    });
    if (order.userId) {
      this.trackingGateway.emitOrderStatusToUser(
        order.userId.toString(),
        order._id.toString(),
        targetStatus,
        { orderNumber: order.orderNumber, order },
      );
    }

    // Auto-trigger Rider Review Prompt when delivered
    if (targetStatus === OrderStatus.DELIVERED && order.userId) {
      setTimeout(async () => {
        try {
          const freshOrder = await this.orderModel.findById(order._id).populate('deliveryPartnerId');
          const partner = (freshOrder?.deliveryPartnerId as any) || (order as any).deliveryPartner;
          this.trackingGateway.emitReviewPromptRequested(order.userId.toString(), {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            rider: {
              id: partner?._id?.toString() || 'default_rider',
              name: partner?.fullName || 'DARSHAN THANKI',
              photo: partner?.avatar || '',
              vehicleNumber: partner?.vehicleNumber || 'GJ AE 2020',
              averageRating: partner?.averageRating || partner?.rating || 4.88,
              totalReviews: partner?.totalReviews || 128,
            },
          });
        } catch (err) {
          // silent fallback
        }
      }, 3000);
    }

    return order;
  }

  /**
   * Atomically restores physical stock in products, product_variants, and store inventory
   */
  private async restockOrderItems(order: any) {
    if (!order.items || order.items.length === 0) return;
    for (const item of order.items) {
      try {
        const prodObjId = Types.ObjectId.isValid(item.productId.toString())
          ? new Types.ObjectId(item.productId.toString())
          : item.productId;

        // 1. Restock master products collection
        await this.connection.collection('products').updateOne(
          { _id: prodObjId as any },
          { $inc: { stock: item.quantity }, $set: { updatedAt: new Date() } }
        );

        // 2. Restock ONLY the specific ordered product_variant
        const vList = await this.connection.collection('product_variants').find({
          $or: [
            { productId: prodObjId as any },
            { productId: item.productId.toString() },
          ],
        }).toArray();

        if (vList.length > 0) {
          let matchedV = null;
          if (item.variantId) {
            matchedV = vList.find((v) => v._id.toString() === item.variantId.toString());
          }
          if (!matchedV && item.quantityLabel) {
            matchedV = vList.find((v) =>
              v.weightOrVolume &&
              v.weightOrVolume.trim().toLowerCase() === item.quantityLabel.trim().toLowerCase()
            );
          }
          if (!matchedV && item.name) {
            matchedV = vList.find((v) =>
              v.weightOrVolume && item.name.toLowerCase().includes(v.weightOrVolume.toLowerCase())
            );
          }
          if (!matchedV) {
            matchedV = vList.find((v) => v.isDefault) || vList[0];
          }

          if (matchedV) {
            await this.connection.collection('product_variants').updateOne(
              { _id: matchedV._id },
              { $inc: { stock: item.quantity }, $set: { updatedAt: new Date() } }
            );

            // 2b. Restock area_pricing
            let targetAreaId = (order.deliveryAddress as any)?.areaId;
            if (!targetAreaId && order.storeId) {
              const sDoc = await this.connection.collection('stores').findOne({
                $or: [
                  { _id: Types.ObjectId.isValid(order.storeId.toString()) ? new Types.ObjectId(order.storeId.toString()) : order.storeId },
                  { _id: order.storeId.toString() },
                ],
              });
              targetAreaId = sDoc?.areaId;
            }
            if (targetAreaId) {
              const aObjId = Types.ObjectId.isValid(targetAreaId.toString())
                ? new Types.ObjectId(targetAreaId.toString())
                : targetAreaId;
              await this.connection.collection('area_pricing').updateOne(
                {
                  $and: [
                    { $or: [{ variantId: matchedV._id }, { variantId: matchedV._id.toString() }] },
                    { $or: [{ areaId: aObjId }, { areaId: targetAreaId.toString() }] },
                  ],
                },
                {
                  $inc: { stock: item.quantity },
                  $set: { updatedAt: new Date() },
                }
              );
            }
          }
        }

        // 3. Restock dark store inventory
        let updatedInv: any = null;
        if (order.storeId) {
          const sId = Types.ObjectId.isValid(order.storeId.toString())
            ? new Types.ObjectId(order.storeId.toString())
            : order.storeId;
          updatedInv = await this.connection.collection('inventory').findOneAndUpdate(
            {
              storeId: sId,
              productId: prodObjId,
            },
            {
              $inc: {
                availableQty: item.quantity,
                reservedQty: -item.quantity,
                soldQty: -item.quantity,
              },
            },
            { returnDocument: 'after' }
          );
        }

        const freshProd = await this.connection.collection('products').findOne({
          _id: prodObjId as any,
        });

        // 4. Broadcast real-time stock update
        this.trackingGateway.broadcastInventoryUpdate({
          storeId: order.storeId?.toString() || '',
          productId: item.productId.toString(),
          productName: item.name,
          availableQty: freshProd?.stock ?? (updatedInv?.availableQty ?? 0),
          reservedQty: Math.max(0, updatedInv?.reservedQty ?? 0),
          newAvailableStock: freshProd?.stock ?? (updatedInv?.availableQty ?? 0),
        });
      } catch (invErr: any) {
        this.logger.warn(`Failed to restore inventory on cancel for product ${item.productId}: ${invErr.message}`);
      }
    }
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
        this.trackingGateway.emitWalletUpdated(uId.toString(), {
          shoppingCoins: user.shoppingCoins,
          walletBalance: (user as any).walletBalance || 0,
        });

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

    // Reverse Inventory & Restock
    await this.restockOrderItems(order);

    return this.updateOrderStatus(
      orderId,
      OrderStatus.CANCELLED,
      'CUSTOMER',
      userId,
      reason || 'Cancelled by customer',
    );
  }

  async getOrderById(orderId: string, userId?: string) {
    let query: any = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderNumber: orderId }] };
    } else {
      const cleanNum = orderId.replace(/^#/, '');
      query = {
        $or: [
          { orderNumber: orderId },
          { orderNumber: cleanNum },
          { orderNumber: `#${cleanNum}` },
        ],
      };
    }

    if (userId && Types.ObjectId.isValid(userId)) {
      query.userId = new Types.ObjectId(userId);
    }

    let order: any = null;
    try {
      order = await this.orderModel
        .findOne(query)
        .populate('deliveryPartnerId', 'fullName phoneNumber vehicleNumber rating currentLocation')
        .populate('storeId', 'name address location')
        .exec();
    } catch (popErr) {
      this.logger.warn(`Populate failed in getOrderById: ${popErr?.message}, falling back to unpopulated find`);
      order = await this.orderModel.findOne(query).exec();
    }

    if (!order) {
      // Self-healing fallback: if exact match fails, find latest active order
      const cleanNum = orderId.replace(/^#/, '');
      order = await this.orderModel
        .findOne({
          $or: [
            { orderNumber: new RegExp(cleanNum, 'i') },
            { status: { $in: ['PLACED', 'PACKING', 'PACKED', 'GOING_TO_STORE', 'ARRIVED_AT_STORE', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER'] } },
          ],
        })
        .sort({ createdAt: -1 })
        .populate('deliveryPartnerId', 'fullName phoneNumber vehicleNumber rating currentLocation')
        .populate('storeId', 'name address location')
        .exec();
    }

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const orderObj: any = order.toObject ? order.toObject() : { ...order };

    // Check delivery_assignments for latest active delivery partner and real-time status
    const activeAssignment = await this.assignmentModel
      .findOne({
        orderId: order._id,
        status: {
          $in: [
            RiderAssignmentStatus.ACCEPTED,
            RiderAssignmentStatus.GOING_TO_STORE,
            RiderAssignmentStatus.ARRIVED_AT_STORE,
            RiderAssignmentStatus.PICKUP_VERIFIED,
            RiderAssignmentStatus.OUT_FOR_DELIVERY,
            RiderAssignmentStatus.ARRIVED_AT_CUSTOMER,
            RiderAssignmentStatus.COMPLETED,
          ],
        },
      })
      .sort({ createdAt: -1 });

    if (activeAssignment) {
      // Synchronize order status if assignment is more advanced
      const assignStatus = activeAssignment.status;
      if (assignStatus === RiderAssignmentStatus.COMPLETED && orderObj.status !== OrderStatus.DELIVERED) {
        orderObj.status = OrderStatus.DELIVERED;
      } else if (assignStatus === RiderAssignmentStatus.ARRIVED_AT_CUSTOMER && orderObj.status !== OrderStatus.DELIVERED) {
        orderObj.status = OrderStatus.ARRIVED_AT_CUSTOMER;
      } else if ((assignStatus === RiderAssignmentStatus.OUT_FOR_DELIVERY || assignStatus === RiderAssignmentStatus.PICKUP_VERIFIED) && orderObj.status !== OrderStatus.DELIVERED && orderObj.status !== OrderStatus.ARRIVED_AT_CUSTOMER) {
        orderObj.status = OrderStatus.OUT_FOR_DELIVERY;
      } else if (assignStatus === RiderAssignmentStatus.ARRIVED_AT_STORE && ['PLACED', 'PACKING', 'PACKED', 'ASSIGNED', 'GOING_TO_STORE'].includes(orderObj.status)) {
        orderObj.status = OrderStatus.ARRIVED_AT_STORE;
      } else if (assignStatus === RiderAssignmentStatus.GOING_TO_STORE && ['PLACED', 'ASSIGNED'].includes(orderObj.status)) {
        orderObj.status = OrderStatus.GOING_TO_STORE;
      }

      if (activeAssignment.partnerId) {
        try {
          const partner = await this.partnerModel.findById(activeAssignment.partnerId);
          if (partner) {
            orderObj.deliveryPartnerId = {
              _id: partner._id,
              fullName: partner.fullName,
              phoneNumber: partner.phoneNumber,
              vehicleNumber: partner.vehicleNumber,
              rating: partner.rating || 4.9,
              currentLocation: (partner as any).currentLocation,
            };
          }
        } catch {
          // non-fatal
        }
      }
    }

    if (orderObj.deliveryPartnerId) {
      const pLoc = orderObj.deliveryPartnerId.currentLocation;
      let coords: { latitude: number; longitude: number } | undefined = undefined;
      if (pLoc && Array.isArray(pLoc.coordinates) && pLoc.coordinates.length >= 2) {
        coords = {
          latitude: pLoc.coordinates[1],
          longitude: pLoc.coordinates[0],
        };
      }

      const pName = orderObj.deliveryPartnerId.fullName || 'DARSHAN THANKI';
      const formattedName = pName.toLowerCase() === 'darshanthanki' ? 'DARSHAN THANKI' : pName;

      const partnerPayload = {
        id: orderObj.deliveryPartnerId._id?.toString() || '',
        name: formattedName,
        fullName: formattedName,
        phone: orderObj.deliveryPartnerId.phoneNumber || '',
        phoneNumber: orderObj.deliveryPartnerId.phoneNumber || '',
        vehicleNumber: orderObj.deliveryPartnerId.vehicleNumber || 'GJ AE 2020',
        rating: orderObj.deliveryPartnerId.rating || 5,
        currentLocation: coords,
      };

      orderObj.deliveryPartner = partnerPayload;
      orderObj.rider = partnerPayload;
      orderObj.riderId = {
        _id: orderObj.deliveryPartnerId._id,
        name: formattedName,
        phone: orderObj.deliveryPartnerId.phoneNumber || '',
        rating: orderObj.deliveryPartnerId.rating || 5,
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      };
      orderObj.riderName = formattedName;
    }

    return orderObj;
  }

  async getOrderHistory(userId?: string, page = 1, limit = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (p - 1) * l;

    if (!userId) {
      const customer = await this.userModel.findOne({ role: 'CUSTOMER' }).sort({ createdAt: -1 });
      if (customer) {
        userId = customer._id.toString();
      } else {
        return {
          orders: [],
          pagination: { page: p, limit: l, total: 0, totalPages: 0 },
        };
      }
    }

    const isObjId = Types.ObjectId.isValid(userId);
    const userQuery = isObjId
      ? { $or: [{ userId: new Types.ObjectId(userId) }, { userId }] }
      : { userId };

    let orders: any[] = [];
    let total = 0;

    try {
      const [fetchedOrders, count] = await Promise.all([
        this.orderModel
          .find(userQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l)
          .populate({
            path: 'deliveryPartnerId',
            select: 'fullName phoneNumber vehicleNumber',
            options: { lean: true },
          })
          .populate({
            path: 'storeId',
            select: 'name code address cityName areaName location',
            options: { lean: true },
          })
          .lean()
          .exec(),
        this.orderModel.countDocuments(userQuery).exec(),
      ]);
      orders = fetchedOrders || [];
      total = count || 0;
    } catch (popErr) {
      this.logger.warn(`Populate failed in getOrderHistory: ${popErr?.message}, falling back to unpopulated lean query`);
      try {
        const [fetchedOrders, count] = await Promise.all([
          this.orderModel
            .find(userQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .lean()
            .exec(),
          this.orderModel.countDocuments(userQuery).exec(),
        ]);
        orders = fetchedOrders || [];
        total = count || 0;
      } catch (findErr) {
        this.logger.error(`Failed to fetch orders in getOrderHistory: ${findErr?.message}`);
        orders = [];
        total = 0;
      }
    }

    // Enrich storeName from storeId or store collection if missing
    for (const ord of orders) {
      if (!ord.storeName) {
        if (ord.storeId && typeof ord.storeId === 'object' && ord.storeId.name) {
          ord.storeName = ord.storeId.name;
        }
      }
    }

    // Enrich missing item images from products collection for older orders
    const missingProductIds = new Set<string>();
    for (const ord of orders) {
      if (Array.isArray(ord.items)) {
        for (const it of ord.items) {
          if (!it.imageUrl && it.productId) {
            missingProductIds.add(it.productId.toString());
          }
        }
      }
    }

    if (missingProductIds.size > 0) {
      try {
        const validIds = Array.from(missingProductIds)
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id));
        if (validIds.length > 0 && this.connection?.db) {
          const prods = await this.connection.db
            .collection('products')
            .find({ _id: { $in: validIds } }, { projection: { _id: 1, imageUrl: 1, images: 1 } })
            .toArray();
          const prodMap = new Map(
            prods.map((p: any) => [p._id.toString(), p.imageUrl || (p.images && p.images[0]) || '']),
          );
          for (const ord of orders) {
            if (Array.isArray(ord.items)) {
              for (const it of ord.items) {
                if (!it.imageUrl && it.productId) {
                  const img = prodMap.get(it.productId.toString());
                  if (img) it.imageUrl = img;
                }
              }
            }
          }
        }
      } catch (_) {}
    }

    return {
      orders,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  async findAllForAdmin(status?: string, page = 1, limit = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (p - 1) * l;

    const query: any = {};
    if (status) query.status = status;

    let orders: any[] = [];
    let total = 0;

    try {
      const [fetchedOrders, count] = await Promise.all([
        this.orderModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l)
          .populate('userId', 'name phone')
          .populate('deliveryPartnerId', 'fullName phoneNumber')
          .lean()
          .exec(),
        this.orderModel.countDocuments(query).exec(),
      ]);
      orders = fetchedOrders || [];
      total = count || 0;
    } catch (popErr) {
      this.logger.warn(`Populate failed in findAllForAdmin: ${popErr?.message}, falling back to unpopulated lean query`);
      try {
        const [fetchedOrders, count] = await Promise.all([
          this.orderModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .lean()
            .exec(),
          this.orderModel.countDocuments(query).exec(),
        ]);
        orders = fetchedOrders || [];
        total = count || 0;
      } catch (findErr) {
        this.logger.error(`Failed in findAllForAdmin: ${findErr?.message}`);
        orders = [];
        total = 0;
      }
    }

    return {
      orders,
      pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
    };
  }

  /**
   * Multi-Store Order Routing Engine:
   * Resolves the optimal dark store in an area using candidate scoring.
   * Priority: Nearest GPS distance to customer + Active backlog load balancing.
   */
  async resolveStoreForOrder(
    customerCoords: [number, number],
    matchedArea: any,
    orderItems: any[] = [],
  ): Promise<any> {
    const [custLng, custLat] = customerCoords;

    // 1. If explicit hubStoreId is set on area
    if (matchedArea?.hubStoreId) {
      const hub = await this.storeModel.findOne({ _id: matchedArea.hubStoreId, isActive: true }).exec();
      if (hub) return hub;
    }

    // 2. Query all active stores in the matched area
    let candidateStores = await this.storeModel.find({
      $or: [{ areaId: matchedArea?._id }, { areaId: matchedArea?._id?.toString() }],
      isActive: true,
    }).exec();

    // Fallback: If no area-matched stores, find nearest stores within 8km radius
    if (!candidateStores || candidateStores.length === 0) {
      candidateStores = await this.storeModel.find({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [custLng, custLat],
            },
            $maxDistance: 8000,
          },
        },
      }).limit(5).exec();
    }

    if (!candidateStores || candidateStores.length === 0) {
      return null;
    }

    // Single store in pool - direct routing
    if (candidateStores.length === 1) {
      return candidateStores[0];
    }

    // Multiple candidate stores in area - score each store
    const R = 6371; // Earth radius in km
    let bestStore = candidateStores[0];
    let bestScore = -Infinity;

    for (const store of candidateStores) {
      const storeCoords = store.location?.coordinates || [72.5082, 23.0125];
      const storeLng = storeCoords[0];
      const storeLat = storeCoords[1];

      // Calculate Haversine distance
      const dLat = ((storeLat - custLat) * Math.PI) / 180;
      const dLon = ((storeLng - custLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((custLat * Math.PI) / 180) *
          Math.cos((storeLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;

      // Count pending active orders for load balancing
      const pendingOrders = await this.orderModel.countDocuments({
        storeId: store._id,
        status: { $in: ['PLACED', 'PACKING', 'PACKED', 'OUT_FOR_DELIVERY'] },
      }).exec();

      // Score formula: Lower distance (+weight 10) + lower backlog (+weight 4)
      const score = -(distanceKm * 10) - (pendingOrders * 4);

      if (score > bestScore) {
        bestScore = score;
        bestStore = store;
      }
    }

    return bestStore;
  }
}
