import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Coupon, CouponDocument } from '../coupons/schemas/coupon.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async getOrCreateCart(userId: string) {
    const uId = new Types.ObjectId(userId);
    let cart = await this.cartModel.findOne({ userId: uId }).exec();
    if (!cart) {
      cart = await this.cartModel.create({
        userId: uId,
        items: [],
        appliedCoins: 0,
        tip: 0,
      });
    }
    return cart;
  }

  async getCartSummary(userId: string, areaId?: string, storeId?: string) {
    const cart = await this.getOrCreateCart(userId);
    const user = await this.userModel.findById(userId);

    // Save location to cart if provided
    if (areaId && Types.ObjectId.isValid(areaId)) {
      cart.areaId = new Types.ObjectId(areaId);
    }
    if (storeId && Types.ObjectId.isValid(storeId)) {
      cart.storeId = new Types.ObjectId(storeId);
    }
    if ((areaId || storeId) && (cart.isModified('areaId') || cart.isModified('storeId'))) {
      await cart.save();
    }

    // Determine target areaId for area_pricing lookup
    let targetAreaId = areaId || (cart.areaId ? cart.areaId.toString() : undefined);
    if (!targetAreaId && (storeId || cart.storeId)) {
      const sId = storeId || cart.storeId?.toString();
      if (sId && Types.ObjectId.isValid(sId)) {
        const sDoc = await this.connection.collection('stores').findOne({ _id: new Types.ObjectId(sId) });
        if (sDoc?.areaId) targetAreaId = sDoc.areaId.toString();
      }
    }

    const detailedItems: any[] = [];
    let itemSubtotal = 0;
    let mrpTotal = 0;

    for (const entry of cart.items) {
      const product = await this.productModel.findById(entry.productId).exec();
      if (product && product.isActive) {
        let sellingPrice = product.sellingPrice;
        let mrp = product.mrp;
        let quantityLabel = product.quantityLabel;
        let variantObj: any = null;

        if (entry.variantId && Types.ObjectId.isValid(entry.variantId.toString())) {
          const vObjId = new Types.ObjectId(entry.variantId.toString());
          const varDoc = await this.connection.collection('product_variants').findOne({
            _id: vObjId,
          });
          if (varDoc) {
            sellingPrice = varDoc.sellingPrice ?? sellingPrice;
            mrp = varDoc.mrp ?? mrp;
            quantityLabel = varDoc.weightOrVolume ?? quantityLabel;

            // Dynamic area pricing lookup matching user's selected area
            if (targetAreaId) {
              try {
                const targetAreaObjId = Types.ObjectId.isValid(targetAreaId)
                  ? new Types.ObjectId(targetAreaId)
                  : targetAreaId;
                const areaPricing = await this.connection.collection('area_pricing').findOne({
                  variantId: { $in: [vObjId, entry.variantId.toString()] },
                  $or: [
                    { areaId: targetAreaObjId },
                    { areaId: targetAreaId.toString() },
                  ],
                });
                if (areaPricing && typeof areaPricing.price === 'number') {
                  sellingPrice = areaPricing.price;
                  if (areaPricing.mrp) mrp = areaPricing.mrp;
                }
              } catch {
                // fallback to varDoc
              }
            }

            variantObj = {
              id: varDoc._id.toString(),
              _id: varDoc._id.toString(),
              label: varDoc.weightOrVolume,
              price: sellingPrice,
              mrp: mrp,
            };
          }
        } else if (targetAreaId) {
          // Dynamic master product area pricing lookup
          try {
            const targetAreaObjId = Types.ObjectId.isValid(targetAreaId)
              ? new Types.ObjectId(targetAreaId)
              : targetAreaId;
            const areaPricing = await this.connection.collection('area_pricing').findOne({
              productId: { $in: [product._id, product._id.toString()] },
              $or: [
                { areaId: targetAreaObjId },
                { areaId: targetAreaId.toString() },
              ],
            });
            if (areaPricing && typeof areaPricing.price === 'number') {
              sellingPrice = areaPricing.price;
              if (areaPricing.mrp) mrp = areaPricing.mrp;
            }
          } catch {}
        }

        const linePrice = sellingPrice * entry.quantity;
        const lineMrp = mrp * entry.quantity;
        itemSubtotal += linePrice;
        mrpTotal += lineMrp;

        detailedItems.push({
          product: {
            id: product._id.toString(),
            name: product.name,
            brand: product.brand,
            imageUrl: product.imageUrl,
            sellingPrice: sellingPrice,
            mrp: mrp,
            discountPercent: mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : product.discountPercent,
            quantityLabel: quantityLabel,
            stock: product.stock,
          },
          variant: variantObj,
          variantId: entry.variantId ? entry.variantId.toString() : undefined,
          quantity: entry.quantity,
          subtotal: linePrice,
          totalMrp: lineMrp,
        });
      }
    }

    const itemDiscount = Math.max(0, mrpTotal - itemSubtotal);

    // Validate and calculate coupon discount
    let couponDiscount = 0;
    if (cart.couponCode) {
      const coupon = await this.couponModel.findOne({
        code: cart.couponCode.toUpperCase(),
        isActive: true,
      });
      if (coupon && itemSubtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'PERCENTAGE') {
          couponDiscount = (itemSubtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount > 0) {
            couponDiscount = Math.min(couponDiscount, coupon.maxDiscountAmount);
          }
        } else {
          couponDiscount = coupon.discountValue;
        }
      } else {
        cart.couponCode = undefined;
        await cart.save();
      }
    }

    const deliveryFee = itemSubtotal >= 199 || itemSubtotal === 0 ? 0 : 25; // Free over ₹199
    const handlingFee = itemSubtotal > 0 ? 5 : 0;
    const tip = cart.tip || 0;

    // Validate and calculate shopping coins discount (1 coin = ₹1, max 20% of order subtotal, min 10, matching App)
    let coinDiscount = 0;
    const orderSubtotal = Math.max(0, itemSubtotal + deliveryFee + handlingFee - couponDiscount);
    const maxCoinsAllowed = Math.max(10, Math.floor(orderSubtotal * 0.2));
    const userCoinBalance = user?.shoppingCoins || 0;

    const isUsingCoins = !!cart.useCoins || (cart.appliedCoins && cart.appliedCoins > 0);
    const validCoins = isUsingCoins
      ? Math.min(
          cart.appliedCoins > 0 ? cart.appliedCoins : maxCoinsAllowed,
          userCoinBalance,
          maxCoinsAllowed,
        )
      : 0;
    coinDiscount = validCoins;

    const totalAmount = Math.max(
      0,
      orderSubtotal - coinDiscount + tip,
    );

    return {
      items: detailedItems,
      itemCount: detailedItems.reduce((acc, curr) => acc + curr.quantity, 0),
      itemSubtotal,
      mrpTotal,
      itemDiscount,
      couponDiscount,
      couponCode: cart.couponCode,
      useCoins: isUsingCoins && validCoins > 0,
      appliedCoins: validCoins,
      coinsUsed: validCoins,
      coinDiscount,
      availableCoins: userCoinBalance,
      maxCoinsAllowed,
      deliveryFee,
      handlingFee,
      tip,
      totalAmount,
      deliveryInstructions: cart.deliveryInstructions,
    };
  }

  async addItem(userId: string, productId: string, quantity: number, variantId?: string) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not available');
    }

    const resolvedProductId = product._id;
    const resolvedVariantId = variantId && Types.ObjectId.isValid(variantId) ? new Types.ObjectId(variantId) : undefined;
    const cart = await this.getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex((i) => {
      const pMatch = i.productId.toString() === resolvedProductId.toString();
      if (!pMatch) return false;
      if (resolvedVariantId && i.variantId) {
        return i.variantId.toString() === resolvedVariantId.toString();
      }
      return !resolvedVariantId && !i.variantId;
    });

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: resolvedProductId,
        variantId: resolvedVariantId,
        quantity,
      } as any);
    }

    await cart.save();
    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async updateQuantity(userId: string, productId: string, delta: number) {
    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();

    const targetIdStr = product ? product._id.toString() : productId;
    const cart = await this.getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex(
      (i) => i.productId.toString() === targetIdStr || i.productId.toString() === productId,
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += delta;
      if (cart.items[existingIndex].quantity <= 0) {
        cart.items.splice(existingIndex, 1);
      }
      await cart.save();
    } else if (delta > 0 && product) {
      cart.items.push({
        productId: product._id,
        quantity: delta,
      } as any);
      await cart.save();
    }

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async setExactQuantity(userId: string, productId: string, quantity: number) {
    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();

    const targetIdStr = product ? product._id.toString() : productId;
    const cart = await this.getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex(
      (i) => i.productId.toString() === targetIdStr || i.productId.toString() === productId,
    );

    if (quantity <= 0) {
      if (existingIndex > -1) {
        cart.items.splice(existingIndex, 1);
        await cart.save();
      }
    } else {
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = quantity;
        await cart.save();
      } else if (product) {
        cart.items.push({
          productId: product._id,
          quantity,
        } as any);
        await cart.save();
      }
    }

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async removeItem(userId: string, productId: string) {
    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();
    const targetIdStr = product ? product._id.toString() : productId;

    const cart = await this.getOrCreateCart(userId);
    cart.items = cart.items.filter(
      (i) => i.productId.toString() !== targetIdStr && i.productId.toString() !== productId,
    );
    await cart.save();

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    cart.useCoins = false;
    cart.appliedCoins = 0;
    cart.couponCode = undefined;
    cart.tip = 0;
    await cart.save();

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async toggleCoins(userId: string, useCoins: boolean) {
    const cart = await this.getOrCreateCart(userId);
    cart.useCoins = !!useCoins;
    if (!useCoins) {
      cart.appliedCoins = 0;
    } else {
      const user = await this.userModel.findById(userId).exec();
      const userBalance = user?.shoppingCoins || 0;
      cart.appliedCoins = userBalance;
    }
    await cart.save();

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async applyCoins(userId: string, coins: number) {
    const cart = await this.getOrCreateCart(userId);
    cart.useCoins = coins > 0;
    cart.appliedCoins = Math.max(0, coins);
    await cart.save();

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async applyCoupon(userId: string, couponCode: string) {
    const coupon = await this.couponModel.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new BadRequestException('Invalid or expired coupon code');
    }

    const cart = await this.getOrCreateCart(userId);
    cart.couponCode = coupon.code;
    await cart.save();

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async setTip(userId: string, tip: number) {
    const cart = await this.getOrCreateCart(userId);
    cart.tip = Math.max(0, tip);
    await cart.save();

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  /**
   * Authoritative dynamic delivery fee calculation:
   * Haversine distance × ratePerKm (Area > City > Global) with Floor & Cap
   */
  async calculateDynamic(dto: any) {
    const {
      items = [],
      deliveryAddress = {},
      storeId,
      cityName = 'Ahmedabad',
      areaName = 'Prahlad Nagar',
      distanceKm: customDist,
      tip = 0,
      couponCode,
      coins = 0,
    } = dto || {};

    const db = this.connection.db;

    // 1. Resolve area & city
    const effectiveCity = (deliveryAddress.city || cityName || 'Ahmedabad').trim();
    const effectiveArea = (deliveryAddress.area || deliveryAddress.areaLandmark || areaName || 'Prahlad Nagar').trim();

    // 2. Resolve store & coords
    let resolvedStore: any = null;
    if (storeId && Types.ObjectId.isValid(storeId)) {
      resolvedStore = await db.collection('stores').findOne({ _id: new Types.ObjectId(storeId) });
    }
    if (!resolvedStore) {
      resolvedStore = await db.collection('stores').findOne({
        $or: [
          { area: new RegExp(`^${effectiveArea}$`, 'i') },
          { name: new RegExp(effectiveArea, 'i') },
          { city: new RegExp(`^${effectiveCity}$`, 'i') },
        ],
      });
    }

    // 3. Compute Distance (Haversine)
    let custLat = deliveryAddress.latitude || deliveryAddress.lat;
    let custLng = deliveryAddress.longitude || deliveryAddress.lng;
    if (Array.isArray(deliveryAddress.coordinates) && deliveryAddress.coordinates.length === 2) {
      custLng = deliveryAddress.coordinates[0];
      custLat = deliveryAddress.coordinates[1];
    }

    let storeLat = 23.0125;
    let storeLng = 72.5082;
    if (resolvedStore?.location?.coordinates?.length === 2) {
      storeLng = resolvedStore.location.coordinates[0];
      storeLat = resolvedStore.location.coordinates[1];
    }

    let distanceKm = 3.26; // Default verified Vejalpur-Prahlad Nagar distance
    if (customDist && !isNaN(Number(customDist))) {
      distanceKm = Number(customDist);
    } else if (custLat && custLng && storeLat && storeLng) {
      const R = 6371;
      const dLat = ((storeLat - custLat) * Math.PI) / 180;
      const dLon = ((storeLng - custLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((custLat * Math.PI) / 180) *
          Math.cos((storeLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const calcDist = Number((R * c).toFixed(2));
      if (calcDist > 0.1) distanceKm = calcDist;
    }

    // 4. Rate Resolution (Area > City > Global)
    let rateRecord: any = null;
    let winningScope = 'GLOBAL';

    const areaQuery: any = {
      scope: 'AREA',
      isActive: { $ne: false },
      $or: [
        { areaName: new RegExp(`^${effectiveArea}$`, 'i') },
        { areaName: new RegExp(effectiveArea, 'i') },
      ],
    };
    if (resolvedStore?.area) {
      areaQuery.$or.push({ areaName: new RegExp(`^${resolvedStore.area}$`, 'i') });
    }
    rateRecord = await db.collection('rider_payout_rates').findOne(areaQuery);
    if (rateRecord) winningScope = 'AREA';

    if (!rateRecord) {
      rateRecord = await db.collection('rider_payout_rates').findOne({
        scope: 'CITY',
        isActive: { $ne: false },
        cityName: new RegExp(`^${effectiveCity}$`, 'i'),
      });
      if (rateRecord) winningScope = 'CITY';
    }

    if (!rateRecord) {
      rateRecord = await db.collection('rider_payout_rates').findOne({
        scope: 'GLOBAL',
        isActive: { $ne: false },
      });
      if (rateRecord) winningScope = 'GLOBAL';
    }

    const ratePerKm = rateRecord ? Number(rateRecord.ratePerKm) : 11;
    const minPayout = rateRecord ? Number(rateRecord.minimumPayout) : 40;
    const maxPayout = rateRecord ? Number(rateRecord.maximumPayout) : 180;

    // 5. Dynamic Delivery Fee:
    const baseFee = Number((distanceKm * ratePerKm).toFixed(2));
    const floorApplied = baseFee < minPayout;
    const floorAdjustment = floorApplied ? Number((minPayout - baseFee).toFixed(2)) : 0;
    const capApplied = baseFee > maxPayout;
    const deliveryFee = Math.round(Math.min(Math.max(baseFee, minPayout), maxPayout));

    // 6. Subtotals
    let itemSubtotal = 0;
    let mrpTotal = 0;
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((it: any) => {
        const qty = it.quantity || 1;
        const price = it.price || it.sellingPrice || 60;
        const mrp = it.mrp || it.price || price;
        itemSubtotal += price * qty;
        mrpTotal += mrp * qty;
      });
    } else {
      itemSubtotal = dto.itemSubtotal || 60;
      mrpTotal = dto.mrpTotal || 75;
    }

    const handlingFee = itemSubtotal > 0 ? 5 : 0;
    const tipAmount = Number(tip) || 0;
    const couponDiscount = Number(dto.couponDiscount) || 0;
    const coinsDiscount = Number(coins) || 0;

    const grandTotal = Math.max(
      0,
      itemSubtotal + deliveryFee + handlingFee + tipAmount - couponDiscount - coinsDiscount,
    );

    return {
      success: true,
      data: {
        itemSubtotal,
        mrpTotal,
        discount: Math.max(0, mrpTotal - itemSubtotal),
        deliveryFee, // Dynamic: e.g. ₹40 instead of hardcoded ₹15
        handlingFee,
        tip: tipAmount,
        couponDiscount,
        coinsDiscount,
        total: grandTotal,
        distanceKm,
        rateUsed: ratePerKm,
        rateSource: winningScope,
        storeName: resolvedStore?.name || 'Wom Up Prahlad Nagar Dark Store',
        areaName: rateRecord?.areaName || effectiveArea,
        cityName: rateRecord?.cityName || effectiveCity,
        breakdown: {
          baseFee,
          minimumPayout: minPayout,
          maximumPayout: maxPayout,
          floorApplied,
          floorAdjustment,
          capApplied,
          formula: `${distanceKm} km × ₹${ratePerKm}/km = ₹${baseFee} (Floor: ₹${minPayout}, Cap: ₹${maxPayout}) → ₹${deliveryFee}`,
          explanation: floorApplied
            ? `Includes ₹${floorAdjustment} minimum pay guarantee for delivery partner`
            : capApplied
            ? `Capped at maximum fee of ₹${maxPayout}`
            : `Distance-based fee at ₹${ratePerKm}/km`,
        },
      },
    };
  }

  async setCartLocation(userId: string, areaId?: string, storeId?: string) {
    const cart = await this.getOrCreateCart(userId);
    if (areaId && Types.ObjectId.isValid(areaId)) {
      cart.areaId = new Types.ObjectId(areaId);
    }
    if (storeId && Types.ObjectId.isValid(storeId)) {
      cart.storeId = new Types.ObjectId(storeId);
      if (!areaId) {
        const sDoc = await this.connection.collection('stores').findOne({ _id: new Types.ObjectId(storeId) });
        if (sDoc?.areaId) {
          cart.areaId = sDoc.areaId;
        }
      }
    }
    await cart.save();
    const summary = await this.getCartSummary(userId, areaId, storeId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }
}
