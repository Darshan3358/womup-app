import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
}
