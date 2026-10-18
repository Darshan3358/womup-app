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

    // Resolve user's confirmed saved address and coordinates
    let userAddress: any = null;
    if (user) {
      userAddress = await this.connection.collection('addresses').findOne({
        userId: user._id,
        isDefault: true,
      });
      if (!userAddress) {
        userAddress = await this.connection.collection('addresses').findOne({
          userId: user._id,
        });
      }
    }

    // Resolve assigned store
    let assignedStore: any = null;
    const sId = storeId || (cart.storeId ? cart.storeId.toString() : undefined);
    if (sId && Types.ObjectId.isValid(sId)) {
      assignedStore = await this.connection.collection('stores').findOne({ _id: new Types.ObjectId(sId) });
    }
    if (!assignedStore && targetAreaId) {
      const areaObjId = Types.ObjectId.isValid(targetAreaId) ? new Types.ObjectId(targetAreaId) : targetAreaId;
      assignedStore = await this.connection.collection('stores').findOne({
        $or: [{ areaId: areaObjId }, { areaId: targetAreaId.toString() }],
        isActive: true,
      });
    }
    if (!assignedStore && userAddress) {
      const uArea = (userAddress.area || userAddress.areaLandmark || userAddress.areaName || '').trim();
      if (uArea) {
        const esc = uArea.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const terms = uArea.split(/[-–—,]/).map((t: string) => t.trim()).filter(Boolean);
        const termRgx = terms.map((t: string) => new RegExp(t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'));
        assignedStore = await this.connection.collection('stores').findOne({
          isActive: true,
          $or: [
            { areaName: new RegExp(`^${esc}$`, 'i') },
            { area: new RegExp(`^${esc}$`, 'i') },
            { name: new RegExp(esc, 'i') },
            ...termRgx.map((r: RegExp) => ({ areaName: r })),
            ...termRgx.map((r: RegExp) => ({ name: r })),
          ],
        });
      }
    }
    if (!assignedStore) {
      assignedStore = await this.connection.collection('stores').findOne({ isActive: true });
    }

    // Calculate dynamic delivery fee from authoritative OSRM quote
    let deliveryFee = 35;
    let dynamicQuoteData: any = null;

    if (itemSubtotal === 0) {
      deliveryFee = 0;
    } else if (userAddress && assignedStore) {
      try {
        const quote = await this.calculateDynamic({
          items: detailedItems.map((it) => ({
            productId: it.product.id,
            variantId: it.variantId,
            quantity: it.quantity,
            price: it.product.sellingPrice,
            mrp: it.product.mrp,
          })),
          deliveryAddress: userAddress,
          storeId: assignedStore._id.toString(),
          cityName: userAddress.city || 'Ahmedabad',
          areaName: userAddress.landmark || userAddress.street || 'Prahlad Nagar',
        });
        if (quote?.success && quote.data) {
          dynamicQuoteData = quote.data;
          deliveryFee = quote.data.deliveryFee;
        }
      } catch (err: any) {
        deliveryFee = 35;
      }
    }

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
      deliveryDistanceKm: dynamicQuoteData?.deliveryDistanceKm ?? 2.6,
      deliveryDistanceMeters: dynamicQuoteData?.deliveryDistanceMeters,
      deliveryRatePerKm: dynamicQuoteData?.deliveryRatePerKm ?? 12,
      deliveryMinFee: dynamicQuoteData?.deliveryMinFee ?? 35,
      deliveryMaxFee: dynamicQuoteData?.deliveryMaxFee ?? 160,
      rawDeliveryFee: dynamicQuoteData?.rawDeliveryFee,
      floorApplied: dynamicQuoteData?.floorApplied,
      capApplied: dynamicQuoteData?.capApplied,
      rateSource: dynamicQuoteData?.rateSource ?? 'GLOBAL',
      roundingPolicy: 'WHOLE_RUPEE',
      deliveryQuote: dynamicQuoteData,
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

  async updateQuantity(userId: string, productId: string, delta: number, variantId?: string) {
    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();

    const targetIdStr = product ? product._id.toString() : productId;
    const resolvedVariantId = variantId && Types.ObjectId.isValid(variantId) ? new Types.ObjectId(variantId) : undefined;
    const cart = await this.getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex((i) => {
      const pMatch = i.productId.toString() === targetIdStr || i.productId.toString() === productId;
      if (!pMatch) return false;
      if (resolvedVariantId && i.variantId) {
        return i.variantId.toString() === resolvedVariantId.toString();
      }
      return !resolvedVariantId && !i.variantId;
    });

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += delta;
      if (cart.items[existingIndex].quantity <= 0) {
        cart.items.splice(existingIndex, 1);
      }
      await cart.save();
    } else if (delta > 0 && product) {
      cart.items.push({
        productId: product._id,
        variantId: resolvedVariantId,
        quantity: delta,
      } as any);
      await cart.save();
    }

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async setExactQuantity(userId: string, productId: string, quantity: number, variantId?: string) {
    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();

    const targetIdStr = product ? product._id.toString() : productId;
    const resolvedVariantId = variantId && Types.ObjectId.isValid(variantId) ? new Types.ObjectId(variantId) : undefined;
    const cart = await this.getOrCreateCart(userId);
    const existingIndex = cart.items.findIndex((i) => {
      const pMatch = i.productId.toString() === targetIdStr || i.productId.toString() === productId;
      if (!pMatch) return false;
      if (resolvedVariantId && i.variantId) {
        return i.variantId.toString() === resolvedVariantId.toString();
      }
      return !resolvedVariantId && !i.variantId;
    });

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
          variantId: resolvedVariantId,
          quantity,
        } as any);
        await cart.save();
      }
    }

    const summary = await this.getCartSummary(userId);
    this.trackingGateway.emitCartUpdated(userId, summary);
    return summary;
  }

  async removeItem(userId: string, productId: string, variantId?: string) {
    const product = Types.ObjectId.isValid(productId)
      ? await this.productModel.findById(productId).exec()
      : await this.productModel.findOne({
          $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }],
        }).exec();
    const targetIdStr = product ? product._id.toString() : productId;
    const resolvedVariantIdStr = variantId && Types.ObjectId.isValid(variantId) ? variantId.toString() : undefined;

    const cart = await this.getOrCreateCart(userId);
    cart.items = cart.items.filter((i) => {
      const pMatch = i.productId.toString() === targetIdStr || i.productId.toString() === productId;
      if (!pMatch) return true;
      if (resolvedVariantIdStr && i.variantId) {
        return i.variantId.toString() !== resolvedVariantIdStr;
      }
      return false;
    });
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

    // Resolve Customer Coordinates early for geospatial nearest store routing
    const latValue =
      deliveryAddress.latitude ??
      deliveryAddress.lat ??
      deliveryAddress.location?.coordinates?.[1] ??
      deliveryAddress.coordinates?.[1];

    const lngValue =
      deliveryAddress.longitude ??
      deliveryAddress.lng ??
      deliveryAddress.location?.coordinates?.[0] ??
      deliveryAddress.coordinates?.[0];

    const custLat = Number(latValue);
    const custLng = Number(lngValue);

    // Priority 1: Match by areaName or store name (case-insensitive substring)
    if (!resolvedStore && effectiveArea) {
      const escaped = effectiveArea.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const areaTerms = effectiveArea.split(/[-–—,]/).map((t: string) => t.trim()).filter(Boolean);
      const termRegexes = areaTerms.map((t: string) => new RegExp(t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'));

      resolvedStore = await db.collection('stores').findOne({
        isActive: true,
        $or: [
          { areaName: new RegExp(`^${escaped}$`, 'i') },
          { area: new RegExp(`^${escaped}$`, 'i') },
          { name: new RegExp(escaped, 'i') },
          ...termRegexes.map((r: RegExp) => ({ areaName: r })),
          ...termRegexes.map((r: RegExp) => ({ name: r })),
        ],
      });
    }

    // Priority 2: Geospatial nearest active store to customer coordinates
    if (!resolvedStore && Number.isFinite(custLat) && Number.isFinite(custLng) && custLat !== 0 && custLng !== 0) {
      const allStores = await db.collection('stores').find({ isActive: true }).toArray();
      let closestStore: any = null;
      let minDistance = Infinity;

      for (const s of allStores) {
        const sLat = Number(s.location?.coordinates?.[1] ?? s.latitude);
        const sLng = Number(s.location?.coordinates?.[0] ?? s.longitude);
        if (Number.isFinite(sLat) && Number.isFinite(sLng) && (sLat !== 0 || sLng !== 0)) {
          const dLat = (sLat - custLat) * 111;
          const dLng = (sLng - custLng) * 111 * Math.cos((custLat * Math.PI) / 180);
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);
          if (dist < minDistance) {
            minDistance = dist;
            closestStore = s;
          }
        }
      }
      if (closestStore) {
        resolvedStore = closestStore;
      }
    }

    // Priority 3: Fallback to city store
    if (!resolvedStore) {
      resolvedStore = await db.collection('stores').findOne({
        city: new RegExp(`^${effectiveCity}$`, 'i'),
        isActive: true,
      });
    }

    // 3. Compute Distance using Real OSRM Road Route (Customer Coordinates to Store Coordinates)
    const storeCoords = resolvedStore?.location?.coordinates;
    const storeLng = Number(storeCoords?.[0]);
    const storeLat = Number(storeCoords?.[1]);

    let routeDistanceMeters: number;
    let distanceKm: number;

    // Admin simulator override flow (only if explicitly flagged isSimulator)
    if (dto.isSimulator && customDist && !isNaN(Number(customDist))) {
      distanceKm = Number(customDist);
      routeDistanceMeters = Math.round(distanceKm * 1000);
    } else {
      if (
        !resolvedStore ||
        !Number.isFinite(storeLat) ||
        !Number.isFinite(storeLng) ||
        !Number.isFinite(custLat) ||
        !Number.isFinite(custLng) ||
        Math.abs(storeLat) > 90 ||
        Math.abs(custLat) > 90 ||
        Math.abs(storeLng) > 180 ||
        Math.abs(custLng) > 180 ||
        (storeLat === 0 && storeLng === 0) ||
        (custLat === 0 && custLng === 0)
      ) {
        throw new BadRequestException(
          'Valid assigned Store and delivery coordinates are required to calculate the delivery fee.',
        );
      }

      // Do not trust client-supplied distanceKm for a customer order.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${storeLng},${storeLat};${custLng},${custLat}?overview=false`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`OSRM HTTP ${response.status}`);
        }

        const data: any = await response.json();
        const route = data?.routes?.[0];

        if (
          data?.code !== 'Ok' ||
          typeof route?.distance !== 'number' ||
          !Number.isFinite(route.distance) ||
          route.distance < 0
        ) {
          throw new Error('No valid OSRM route');
        }

        routeDistanceMeters = route.distance;
      } catch {
        // Fallback to Haversine with 1.25 urban road curvature factor if OSRM service is unreachable
        const R = 6371;
        const dLat = ((storeLat - custLat) * Math.PI) / 180;
        const dLon = ((storeLng - custLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((custLat * Math.PI) / 180) *
            Math.cos((storeLat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        routeDistanceMeters = Math.round(R * c * 1.25 * 1000);
      } finally {
        clearTimeout(timeoutId);
      }

      // Keep full precision for calculation; round only for display.
      distanceKm = routeDistanceMeters / 1000;
    }

    // 4. Rate Resolution (Area Override > City Override > Global Fallback)
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

    // Admin PayoutRates configuration: Default Global fallback ₹12/km, min ₹35, max ₹160
    const ratePerKm = rateRecord ? Number(rateRecord.ratePerKm) : 12;
    const minPayout = rateRecord ? Number(rateRecord.minimumPayout) : 35;
    const maxPayout = rateRecord ? Number(rateRecord.maximumPayout) : 160;

    // 5. Dynamic Delivery Fee Calculation:
    const rawFee = distanceKm * ratePerKm;
    const floorApplied = rawFee < minPayout;
    const capApplied = rawFee > maxPayout;

    const boundedFee = Math.min(
      maxPayout,
      Math.max(minPayout, rawFee),
    );

    // Preserve current whole-rupee rounding policy.
    const deliveryFee = Math.round(boundedFee);
    const floorAdjustment = floorApplied
      ? Number((minPayout - rawFee).toFixed(2))
      : 0;

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

    const formulaText = floorApplied
      ? `${distanceKm.toFixed(1)} km × ₹${ratePerKm}/km = ₹${rawFee.toFixed(2)} · ₹${minPayout} minimum applied`
      : capApplied
      ? `${distanceKm.toFixed(1)} km × ₹${ratePerKm}/km = ₹${rawFee.toFixed(2)} · ₹${maxPayout} maximum cap applied`
      : `${distanceKm.toFixed(1)} km × ₹${ratePerKm}/km = ₹${rawFee.toFixed(2)}`;

    return {
      success: true,
      data: {
        itemSubtotal,
        mrpTotal,
        discount: Math.max(0, mrpTotal - itemSubtotal),
        deliveryFee,
        deliveryDistanceMeters: routeDistanceMeters,
        deliveryDistanceKm: distanceKm,
        deliveryRatePerKm: ratePerKm,
        deliveryMinFee: minPayout,
        deliveryMaxFee: maxPayout,
        rawDeliveryFee: Number(rawFee.toFixed(2)),
        floorApplied,
        capApplied,
        rateSource: winningScope,
        roundingPolicy: 'WHOLE_RUPEE',
        handlingFee,
        convenienceFee: handlingFee,
        tip: tipAmount,
        couponDiscount,
        coinsDiscount,
        total: grandTotal,
        distanceKm: Number(distanceKm.toFixed(1)),
        routeDistanceKm: Number(distanceKm.toFixed(1)),
        rateUsed: ratePerKm,
        ratePerKm,
        minimumFee: minPayout,
        maximumFee: maxPayout,
        rawFee: Number(rawFee.toFixed(2)),
        storeName: resolvedStore?.name || 'Wom Up Dark Store',
        areaName: rateRecord?.areaName || effectiveArea,
        cityName: rateRecord?.cityName || effectiveCity,
        breakdown: {
          rawFee: Number(rawFee.toFixed(2)),
          minimumPayout: minPayout,
          maximumPayout: maxPayout,
          floorApplied,
          floorAdjustment,
          capApplied,
          formula: formulaText,
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
