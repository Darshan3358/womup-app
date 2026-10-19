import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin Realtime Data & Platform Sync')
@Controller()
export class AdminRealtimeController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private get db() {
    return this.connection.db;
  }

  /**
   * Health Check
   */
  @Get(['api/health', 'health'])
  @ApiOperation({ summary: 'Admin backend health check' })
  getHealth() {
    return {
      success: true,
      status: 'OK',
      database: 'wormup',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ultra-lightweight Delta Sync Endpoint (<1KB)
   * Only returns orders or inventory modified since requested timestamp.
   */
  @Get(['api/v1/sync-updates', 'api/sync-updates', 'sync-updates'])
  @ApiOperation({ summary: 'Ultra-lightweight Delta Sync endpoint (<1KB)' })
  async getSyncUpdates(
    @Query('since') sinceStr?: string,
    @Query('storeId') storeId?: string,
  ) {
    try {
      const db = this.db;
      if (!db) {
        return { success: false, hasChanges: false, error: 'Database not connected' };
      }

      const sinceDate = sinceStr ? new Date(sinceStr) : new Date(Date.now() - 30000);
      const query: any = {
        updatedAt: { $gte: sinceDate },
      };

      if (storeId) {
        try {
          query.$or = [
            { storeId: new Types.ObjectId(storeId) },
            { storeId: storeId },
          ];
        } catch {
          query.storeId = storeId;
        }
      }

      const changedOrders = await db.collection('orders').find(query, {
        projection: {
          _id: 1,
          orderNumber: 1,
          status: 1,
          bagBarcode: 1,
          totalAmount: 1,
          updatedAt: 1,
          deliveryPartnerId: 1,
        },
      }).limit(20).toArray();

      const changedInventory = await db.collection('inventory').find({
        updatedAt: { $gte: sinceDate },
        ...(storeId ? { storeId: storeId } : {}),
      }, {
        projection: {
          _id: 1,
          productId: 1,
          stock: 1,
          updatedAt: 1,
        },
      }).limit(20).toArray();

      const hasChanges = changedOrders.length > 0 || changedInventory.length > 0;

      return {
        success: true,
        hasChanges,
        timestamp: new Date().toISOString(),
        changedOrders: changedOrders.map((o) => ({
          id: o.orderNumber || o._id.toString(),
          orderNumber: o.orderNumber,
          status: o.status,
          bagBarcode: o.bagBarcode,
          totalAmount: o.totalAmount,
          updatedAt: o.updatedAt,
        })),
        changedInventory: changedInventory.map((i) => ({
          id: i._id.toString(),
          productId: i.productId?.toString(),
          stock: i.stock,
          updatedAt: i.updatedAt,
        })),
      };
    } catch (err: any) {
      return { success: false, hasChanges: false, error: err.message };
    }
  }

  /**
   * Master Realtime Snapshot: Live data synchronization for Admin App
   */
  @Get(['api/realtime-data', 'realtime-data', 'api/v1/realtime-data'])
  @ApiOperation({ summary: 'Master snapshot for Admin App (Orders, Users, Riders, Catalog, Stores, Inventory)' })
  async getRealtimeSnapshot() {
    try {
      const db = this.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const rawDeliveryPartners = await db.collection('delivery_partners').find({}).toArray();
      const partnerUserIds = rawDeliveryPartners.map((p) => p.userId?.toString()).filter(Boolean);

      // Only genuine customers (exclude delivery partners and admins)
      const users = await db.collection('users').find({
        role: { $nin: ['DELIVERY_PARTNER', 'delivery_partner', 'ADMIN', 'admin'] },
        _id: {
          $nin: partnerUserIds
            .map((id) => {
              try { return new Types.ObjectId(id); } catch { return null; }
            })
            .filter(Boolean),
        },
      }).toArray();

      const orders = await db.collection('orders').find({}).toArray();

      // Enrich delivery partners with exact completed and active orders count
      const deliveryPartners = rawDeliveryPartners.map((p: any) => {
        const pIdStr = p._id.toString();
        const uIdStr = p.userId ? p.userId.toString() : '';

        const isOrderOfPartner = (o: any) => {
          const oPartnerId = (typeof o.deliveryPartnerId === 'object' ? o.deliveryPartnerId?._id : o.deliveryPartnerId)?.toString();
          const oRiderId = (typeof o.riderId === 'object' ? o.riderId?._id : o.riderId)?.toString();
          return oPartnerId === pIdStr || oRiderId === pIdStr || (uIdStr && (oPartnerId === uIdStr || oRiderId === uIdStr));
        };

        const deliveredOrdersCount = orders.filter((o: any) => isOrderOfPartner(o) && ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
        const activeOrdersCount = orders.filter((o: any) => isOrderOfPartner(o) && ['OUT_FOR_DELIVERY', 'PICKED_UP', 'REACHED_STORE', 'ASSIGNED'].includes(o.status)).length;
        const effectiveCompleted = Math.max(deliveredOrdersCount, Number(p.completedDeliveries) || Number(p.totalDeliveries) || 0);

        return {
          ...p,
          completedDeliveries: effectiveCompleted,
          totalDeliveries: effectiveCompleted,
          activeDeliveries: activeOrdersCount,
        };
      });

      const products = await db.collection('products').find({}).toArray();
      const categories = await db.collection('categories').find({}).toArray();
      const rawAreas = await db.collection('areas').find({}).toArray();
      const rawStores = await db.collection('stores').find({
        deletedAt: { $exists: false },
        isActive: { $ne: false },
      }).toArray();
      const storeStaffList = await db.collection('store_staff').find({}).toArray();

      const stores = rawStores.map((store: any) => {
        const sId = store._id.toString();
        const staffAtStore = storeStaffList.filter(
          (st: any) => st.storeId && (st.storeId.toString() === sId),
        );
        const staffOnShift = staffAtStore.filter((st: any) => st.isOnShift === true).length;
        const effectiveStaffOnShift = staffOnShift > 0
          ? staffOnShift
          : (store.isOnShift === true ? 1 : 0);
        const effectiveStaffTotal = Math.max(staffAtStore.length, effectiveStaffOnShift, 1);
        const isOnline = (store.isActive !== false) && (effectiveStaffOnShift > 0);

        return {
          ...store,
          staffOnShift: effectiveStaffOnShift,
          staffTotal: effectiveStaffTotal,
          isOnShift: effectiveStaffOnShift > 0,
          isOnline,
        };
      });

      const areas = rawAreas.map((area: any) => {
        const aId = area._id.toString();
        const areaStores = rawStores.filter((s: any) => {
          if (s.isActive === false) return false;
          if (s.areaId && s.areaId.toString() === aId) return true;
          if (s.areaName && area.name && s.areaName.toLowerCase() === area.name.toLowerCase()) return true;
          return false;
        });
        const maxStores = Math.max(1, Number(area.maxStores) || 1);
        const currentStoreCount = areaStores.length;
        const availableSlots = Math.max(0, maxStores - currentStoreCount);
        const isFull = currentStoreCount >= maxStores;

        return {
          ...area,
          id: aId,
          maxStores,
          currentStoreCount,
          availableSlots,
          isFull,
          storeRoutingStrategy: area.storeRoutingStrategy || 'NEAREST',
          hasActiveStore: currentStoreCount > 0,
          assignedStores: areaStores.map((s: any) => ({
            id: s._id.toString(),
            _id: s._id,
            name: s.name,
            code: s.code,
            loginId: s.loginId,
            address: s.address,
            phone: s.phone,
            email: s.email,
            location: s.location,
            coordinates: s.location?.coordinates || s.coordinates || (s.longitude && s.latitude ? [s.longitude, s.latitude] : undefined),
            latitude: s.location?.coordinates ? s.location.coordinates[1] : s.latitude,
            longitude: s.location?.coordinates ? s.location.coordinates[0] : s.longitude,
            serviceRadiusKm: s.serviceRadiusKm || 4.5,
            estimatedDeliveryMinutes: s.estimatedDeliveryMinutes || 9,
            isActive: s.isActive !== false,
          })),
          assignedStore: areaStores[0] || null,
        };
      });

      const inventory = await db.collection('inventory').find({}).toArray();
      const coinTransactions = await db.collection('coin_transactions').find({}).sort({ createdAt: -1 }).limit(500).toArray();
      const coupons = await db.collection('coupons').find({}).toArray();
      const orderHistory = await db.collection('order_status_history').find({}).sort({ timestamp: -1, createdAt: -1 }).limit(500).toArray();
      const addresses = await db.collection('addresses').find({}).toArray();
      const printOrders = await db.collection('print_orders').find({}).toArray();
      const productVariants = await db.collection('product_variants').find({}).toArray();
      const areaPricing = await db.collection('area_pricing').find({}).toArray();
      const cities = await db.collection('cities').find({}).sort({ sortOrder: 1, name: 1 }).toArray();
      const banners = await db.collection('banners').find({}).sort({ sortOrder: 1 }).toArray();

      return {
        success: true,
        users,
        deliveryPartners,
        orders,
        products,
        productVariants,
        areaPricing,
        categories,
        cities,
        areas,
        stores,
        inventory,
        coinTransactions,
        coupons,
        banners,
        orderHistory,
        addresses,
        printOrders,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        users: [],
        deliveryPartners: [],
        orders: [],
        products: [],
        categories: [],
        cities: [],
        areas: [],
        stores: [],
        inventory: [],
      };
    }
  }

  /**
   * Customers list endpoint
   */
  @Get(['api/admin/customers', 'api/admin/users'])
  async getCustomers() {
    const db = this.db;
    const rawDeliveryPartners = await db.collection('delivery_partners').find({}).toArray();
    const partnerUserIds = rawDeliveryPartners.map((p) => p.userId?.toString()).filter(Boolean);

    const customers = await db.collection('users').find({
      role: { $nin: ['DELIVERY_PARTNER', 'delivery_partner', 'ADMIN', 'admin'] },
      _id: {
        $nin: partnerUserIds
          .map((id) => {
            try { return new Types.ObjectId(id); } catch { return null; }
          })
          .filter(Boolean),
      },
    }).toArray();

    return { success: true, count: customers.length, data: customers };
  }

  /**
   * Delivery Partners / Riders list endpoint
   */
  @Get('api/admin/riders')
  async getRiders() {
    const db = this.db;
    const riders = await db.collection('delivery_partners').find({}).toArray();
    return { success: true, count: riders.length, data: riders };
  }

  /**
   * Single Rider Details with Documents & Bank
   */
  @Get('api/admin/riders/:id')
  async getRiderById(@Param('id') id: string) {
    const db = this.db;
    let query: any = {};
    if (Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new Types.ObjectId(id) }, { partnerCode: id }] };
    } else {
      query = { partnerCode: id };
    }

    const rider = await db.collection('delivery_partners').findOne(query);
    if (!rider) {
      return { success: false, error: 'Rider not found' };
    }

    let email = '';
    let userDoc: any = null;
    if (rider.userId) {
      try {
        userDoc = await db.collection('users').findOne({
          $or: [
            ...(Types.ObjectId.isValid(rider.userId) ? [{ _id: new Types.ObjectId(rider.userId.toString()) }] : []),
            { _id: rider.userId.toString() },
          ],
        });
      } catch (_) {}
      if (userDoc) {
        email = userDoc.email || '';
      }
    }

    let bankAccount: any = null;
    const bankDoc = await db.collection('rider_bank_accounts').findOne({
      $or: [
        { riderId: rider._id },
        { riderId: rider._id.toString() },
        ...(rider.userId ? [{ userId: rider.userId }, { userId: rider.userId.toString() }] : []),
      ],
    });

    if (bankDoc) {
      bankAccount = {
        accountNumber: bankDoc.accountNumberFull || bankDoc.accountNumber || bankDoc.maskedAccount || 'N/A',
        ifscCode: bankDoc.ifscCode || bankDoc.ifsc || 'N/A',
        bankName: bankDoc.bankName || 'N/A',
        accountHolderName: bankDoc.accountHolderName || rider.fullName || 'N/A',
        branchName: bankDoc.branchName || bankDoc.bankBranch || rider.bankBranch || '',
        upiId: bankDoc.upiId || rider.upiId || '',
        isVerified: bankDoc.isVerified || bankDoc.verificationStatus === 'VERIFIED' || rider.status === 'APPROVED',
      };
    } else if (rider.bankName || rider.accountNumber) {
      bankAccount = {
        accountNumber: rider.accountNumber || 'N/A',
        ifscCode: rider.ifscCode || 'N/A',
        bankName: rider.bankName || 'N/A',
        accountHolderName: rider.accountHolderName || rider.fullName || 'N/A',
        branchName: rider.bankBranch || '',
        upiId: rider.upiId || '',
        isVerified: rider.verificationStatus === 'VERIFIED' || rider.status === 'APPROVED',
      };
    }

    const documents = {
      dlFront: rider.dlImageUrl || rider.drivingLicenseUrl || userDoc?.dlFrontImage || (rider.documents && (rider.documents.dlFront || rider.documents.dlFrontUrl)) || null,
      dlBack: rider.dlBackUrl || userDoc?.dlBackImage || (rider.documents && (rider.documents.dlBack || rider.documents.dlBackUrl)) || null,
      dlNumber: rider.drivingLicense || rider.drivingLicenseNumber || rider.dlNumber || userDoc?.dlNumber || (rider.documents && rider.documents.dlNumber) || null,
      rcFront: rider.rcImageUrl || userDoc?.rcFrontImage || (rider.documents && (rider.documents.rcFront || rider.documents.rcFrontUrl)) || null,
      rcBack: rider.rcBackUrl || (rider.documents && (rider.documents.rcBack || rider.documents.rcBackUrl)) || null,
      rcNumber: rider.rcNumber || userDoc?.rcNumber || (rider.documents && rider.documents.rcNumber) || null,
      insurance: rider.vehicleInsuranceUrl || (rider.documents && (rider.documents.insurance || rider.documents.insuranceUrl)) || null,
      aadhaarFront: rider.aadharFrontUrl || userDoc?.aadharFrontImage || userDoc?.customer_image_aadhar_front || (rider.documents && (rider.documents.aadhaarFront || rider.documents.aadhaarFrontUrl)) || null,
      aadhaarBack: rider.aadharBackUrl || userDoc?.aadharBackImage || userDoc?.customer_image_aadhar_back || (rider.documents && (rider.documents.aadhaarBack || rider.documents.aadhaarBackUrl)) || null,
      profilePhoto: rider.profilePhotoUrl || userDoc?.avatar || (rider.documents && (rider.documents.profilePhoto || rider.documents.profilePhotoUrl)) || null,
    };

    return {
      success: true,
      data: {
        ...rider,
        email,
        bankAccount,
        bankDetails: bankAccount,
        documents,
      },
    };
  }

  /**
   * Update Rider
   */
  @Patch('api/admin/riders/:id')
  @Put('api/admin/riders/:id')
  async updateRider(@Param('id') id: string, @Body() updates: any) {
    const db = this.db;
    let query: any = {};
    if (Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new Types.ObjectId(id) }, { partnerCode: id }] };
    } else {
      query = { partnerCode: id };
    }

    const rider = await db.collection('delivery_partners').findOne(query);
    if (!rider) {
      return { success: false, error: 'Rider not found' };
    }

    const fieldsToUpdate: any = {};
    if (updates.fullName !== undefined) fieldsToUpdate.fullName = updates.fullName;
    if (updates.name !== undefined) fieldsToUpdate.fullName = updates.name;
    if (updates.phoneNumber !== undefined) fieldsToUpdate.phoneNumber = updates.phoneNumber;
    if (updates.phone !== undefined) fieldsToUpdate.phoneNumber = updates.phone;
    if (updates.vehicleType !== undefined) fieldsToUpdate.vehicleType = updates.vehicleType;
    if (updates.vehicleNumber !== undefined) fieldsToUpdate.vehicleNumber = updates.vehicleNumber;
    if (updates.hubName !== undefined) fieldsToUpdate.hubName = updates.hubName;
    if (updates.hubId !== undefined) fieldsToUpdate.hubId = updates.hubId;
    if (updates.city !== undefined) fieldsToUpdate.city = updates.city;
    if (updates.status !== undefined) fieldsToUpdate.status = updates.status;
    if (updates.verificationStatus !== undefined) fieldsToUpdate.verificationStatus = updates.verificationStatus;
    if (updates.isOnline !== undefined) fieldsToUpdate.isOnline = Boolean(updates.isOnline);
    fieldsToUpdate.updatedAt = new Date();

    await db.collection('delivery_partners').updateOne({ _id: rider._id }, { $set: fieldsToUpdate });

    if (rider.userId && (fieldsToUpdate.fullName || fieldsToUpdate.phoneNumber)) {
      const userUpdate: any = {};
      if (fieldsToUpdate.fullName) userUpdate.name = fieldsToUpdate.fullName;
      if (fieldsToUpdate.phoneNumber) userUpdate.phone = fieldsToUpdate.phoneNumber;
      await db.collection('users').updateOne(
        { _id: new Types.ObjectId(rider.userId.toString()) },
        { $set: userUpdate },
      );
    }

    const updatedRider = await db.collection('delivery_partners').findOne({ _id: rider._id });
    return { success: true, message: 'Rider updated successfully', data: updatedRider };
  }

  /**
   * Delete Rider
   */
  @Delete('api/admin/riders/:id')
  async deleteRider(@Param('id') id: string) {
    const db = this.db;
    let query: any = {};
    if (Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: new Types.ObjectId(id) }, { partnerCode: id }] };
    } else {
      query = { partnerCode: id };
    }

    const rider = await db.collection('delivery_partners').findOne(query);
    if (!rider) {
      return { success: false, error: 'Rider not found' };
    }

    await db.collection('delivery_partners').deleteOne({ _id: rider._id });
    await db.collection('rider_bank_accounts').deleteMany({
      $or: [{ riderId: rider._id }, { riderId: rider._id.toString() }],
    });
    await db.collection('rider_wallets').deleteMany({
      $or: [{ riderId: rider._id }, { riderId: rider._id.toString() }],
    });

    if (rider.userId) {
      try {
        const uId = Types.ObjectId.isValid(rider.userId) ? new Types.ObjectId(rider.userId.toString()) : rider.userId;
        await db.collection('users').deleteOne({ _id: uId });
      } catch (_) {}
    }

    return { success: true, message: 'Delivery partner deleted successfully' };
  }

  /**
   * Delete Customer
   */
  @Delete('api/admin/customers/:id')
  async deleteCustomer(@Param('id') id: string) {
    const db = this.db;
    let userObjId: any;
    try {
      userObjId = new Types.ObjectId(id);
    } catch {
      return { success: false, error: 'Invalid customer ID' };
    }

    await db.collection('users').deleteOne({
      $or: [{ _id: userObjId }, { _id: id }],
    });
    await db.collection('addresses').deleteMany({
      $or: [{ userId: userObjId }, { userId: id }],
    });
    await db.collection('cart').deleteMany({
      $or: [{ userId: userObjId }, { userId: id }],
    });

    return { success: true, message: 'Customer deleted successfully' };
  }

  /**
   * Update Product Price
   */
  @Put(['api/products/price', 'api/admin/catalog/products/price'])
  async updateProductPrice(@Body() body: any) {
    const db = this.db;
    const { productName, sellingPrice, productId } = body;
    const sPrice = Number(sellingPrice);
    if (!productName && !productId) {
      return { success: false, error: 'Product name or ID is required' };
    }
    const filter = productId && Types.ObjectId.isValid(productId) ? { _id: new Types.ObjectId(productId) } : { name: productName };
    const prod = await db.collection('products').findOne(filter);
    if (prod) {
      await db.collection('products').updateOne(
        { _id: prod._id },
        {
          $set: { sellingPrice: sPrice, updatedAt: new Date() },
          $push: {
            priceHistory: {
              id: 'ph_' + Date.now(),
              oldSellingPrice: prod.sellingPrice,
              newSellingPrice: sPrice,
              changedBy: 'Admin Portal',
              changedAt: new Date(),
              notes: 'Inline price update from Admin Portal',
            },
          } as any,
        },
      );
      await db.collection('product_variants').updateMany(
        { productId: prod._id },
        { $set: { sellingPrice: sPrice, updatedAt: new Date() } },
      );
    }
    return { success: true, message: 'Price updated successfully in MongoDB Atlas' };
  }

  /**
   * Adjust Coins
   */
  @Post(['api/coins/adjust', 'api/admin/finance/coins/adjust'])
  async adjustCoins(@Body() body: any) {
    const db = this.db;
    const { userId, amount, type, reason } = body;
    const numAmount = Number(amount);
    const filter = Types.ObjectId.isValid(userId) ? { _id: new Types.ObjectId(userId) } : { _id: userId };
    const user = await db.collection('users').findOne(filter);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    const current = (user.shoppingCoins !== undefined ? user.shoppingCoins : user.coins) || 0;
    const delta = type === 'Debit' ? -Math.abs(numAmount) : Math.abs(numAmount);
    const nextBalance = Math.max(0, current + delta);

    await db.collection('users').updateOne(filter, {
      $set: {
        coins: nextBalance,
        shoppingCoins: nextBalance,
        updatedAt: new Date(),
      },
    });

    await db.collection('coin_transactions').insertOne({
      userId: user._id,
      amount: Math.abs(numAmount),
      type: type || 'Credit',
      reason: reason || 'Admin adjustment',
      balanceBefore: current,
      balanceAfter: nextBalance,
      createdAt: new Date(),
    });

    return { success: true, message: 'Coins adjusted successfully', balance: nextBalance };
  }

  /**
   * Update Order Status
   */
  @Put('api/admin/orders/:orderNumber/status')
  async updateOrderStatus(@Param('orderNumber') orderNumber: string, @Body() body: any) {
    const db = this.db;
    const { status, notes } = body;
    const order = await db.collection('orders').findOne({
      $or: [{ orderNumber }, { id: orderNumber }, ...(Types.ObjectId.isValid(orderNumber) ? [{ _id: new Types.ObjectId(orderNumber) }] : [])],
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    await db.collection('orders').updateOne(
      { _id: order._id },
      {
        $set: { status, updatedAt: new Date() },
        $push: {
          timeline: {
            stage: status,
            timestamp: new Date().toISOString(),
            notes: notes || 'Status updated via Admin',
          },
        } as any,
      },
    );

    return { success: true, message: 'Order status updated' };
  }

  /**
   * Cancel Order
   */
  @Post('api/admin/orders/:orderNumber/cancel')
  async cancelOrder(@Param('orderNumber') orderNumber: string, @Body() body: any) {
    const db = this.db;
    const { reason, refundAmount } = body;
    const order = await db.collection('orders').findOne({
      $or: [{ orderNumber }, { id: orderNumber }, ...(Types.ObjectId.isValid(orderNumber) ? [{ _id: new Types.ObjectId(orderNumber) }] : [])],
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    await db.collection('orders').updateOne(
      { _id: order._id },
      {
        $set: {
          status: 'CANCELLED',
          cancelReason: reason || 'Cancelled by Admin',
          refundAmount: refundAmount || 0,
          updatedAt: new Date(),
        },
        $push: {
          timeline: {
            stage: 'CANCELLED',
            timestamp: new Date().toISOString(),
            notes: reason || 'Order cancelled by Admin',
          },
        } as any,
      },
    );

    return { success: true, message: 'Order cancelled successfully' };
  }

  /**
   * Set Area Pricing
   */
  @Post('api/admin/areas/pricing')
  async setAreaPricing(@Body() body: any) {
    const db = this.db;
    const { variantId, areaId, price, productId } = body;
    if (!variantId && !productId) {
      return { success: false, error: 'variantId or productId required' };
    }

    const query: any = {};
    if (variantId) query.variantId = variantId;
    if (areaId) query.areaId = areaId;

    await db.collection('area_pricing').updateOne(
      query,
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return { success: true, message: 'Area price updated' };
  }

  /**
   * Create New Customer User
   */
  @Post('api/admin/users')
  async createAdminUser(@Body() body: any) {
    const db = this.db;
    const { name, phone, email, address, zoneName } = body;

    const existing = await db.collection('users').findOne({ phone });
    if (existing) {
      return { success: false, error: 'User with this phone number already exists' };
    }

    const newUser = {
      name: name || 'WormUp Customer',
      phone: phone || '',
      email: email || '',
      role: 'CUSTOMER',
      isActive: true,
      walletBalance: 0,
      shoppingCoins: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection('users').insertOne(newUser);

    if (address) {
      await db.collection('addresses').insertOne({
        userId: res.insertedId,
        street: address,
        city: zoneName || 'Ahmedabad',
        isDefault: true,
        label: 'Home',
        createdAt: new Date(),
      });
    }

    return { success: true, data: { ...newUser, _id: res.insertedId } };
  }
}
