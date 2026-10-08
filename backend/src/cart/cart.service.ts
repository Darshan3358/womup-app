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

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
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

  async getCartSummary(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const user = await this.userModel.findById(userId);

    const detailedItems: any[] = [];
    let itemSubtotal = 0;
    let mrpTotal = 0;

    for (const entry of cart.items) {
      const product = await this.productModel.findById(entry.productId).exec();
      if (product && product.isActive) {
        const linePrice = product.sellingPrice * entry.quantity;
        const lineMrp = product.mrp * entry.quantity;
        itemSubtotal += linePrice;
        mrpTotal += lineMrp;

        detailedItems.push({
          product: {
            id: product._id.toString(),
            name: product.name,
            brand: product.brand,
            imageUrl: product.imageUrl,
            sellingPrice: product.sellingPrice,
            mrp: product.mrp,
            discountPercent: product.discountPercent,
            quantityLabel: product.quantityLabel,
            stock: product.stock,
          },
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

    // Validate and calculate shopping coins discount (1 coin = ₹1, max 20% of subtotal)
    let coinDiscount = 0;
    const maxCoinsAllowed = Math.floor(itemSubtotal * 0.2);
    const userCoinBalance = user?.shoppingCoins || 0;
    const validCoins = Math.min(cart.appliedCoins, userCoinBalance, maxCoinsAllowed);
    coinDiscount = validCoins;

    const deliveryFee = itemSubtotal >= 199 || itemSubtotal === 0 ? 0 : 25; // Free over ₹199
    const handlingFee = itemSubtotal > 0 ? 5 : 0;
    const tip = cart.tip || 0;

    const totalAmount = Math.max(
      0,
      itemSubtotal - couponDiscount - coinDiscount + deliveryFee + handlingFee + tip,
    );

    return {
      items: detailedItems,
      itemCount: detailedItems.reduce((acc, curr) => acc + curr.quantity, 0),
      itemSubtotal,
      mrpTotal,
      itemDiscount,
      couponDiscount,
      couponCode: cart.couponCode,
      coinsUsed: validCoins,
      coinDiscount,
      availableCoins: userCoinBalance,
      deliveryFee,
      handlingFee,
      tip,
      totalAmount,
      deliveryInstructions: cart.deliveryInstructions,
    };
  }

  async addItem(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    const product = await this.productModel.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not available');
    }

    const cart = await this.getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex(
      (i) => i.productId.toString() === productId,
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: new Types.ObjectId(productId),
        quantity,
      } as any);
    }

    await cart.save();
    return this.getCartSummary(userId);
  }

  async updateQuantity(userId: string, productId: string, delta: number) {
    const cart = await this.getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex(
      (i) => i.productId.toString() === productId,
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += delta;
      if (cart.items[existingIndex].quantity <= 0) {
        cart.items.splice(existingIndex, 1);
      }
      await cart.save();
    }

    return this.getCartSummary(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);
    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    await cart.save();
    return this.getCartSummary(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    cart.appliedCoins = 0;
    cart.couponCode = undefined;
    cart.tip = 0;
    await cart.save();
    return this.getCartSummary(userId);
  }

  async applyCoins(userId: string, coins: number) {
    const cart = await this.getOrCreateCart(userId);
    cart.appliedCoins = Math.max(0, coins);
    await cart.save();
    return this.getCartSummary(userId);
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
    return this.getCartSummary(userId);
  }

  async setTip(userId: string, tip: number) {
    const cart = await this.getOrCreateCart(userId);
    cart.tip = Math.max(0, tip);
    await cart.save();
    return this.getCartSummary(userId);
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
}
