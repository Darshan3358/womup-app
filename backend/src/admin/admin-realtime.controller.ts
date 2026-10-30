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
  Optional,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { clearHomeCache } from '../home/home-cache';
import * as bcrypt from 'bcryptjs';

@ApiTags('Admin Realtime Data & Platform Sync')
@Controller()
export class AdminRealtimeController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Optional() private readonly trackingGateway?: TrackingGateway,
  ) {}

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
   * Admin Areas List
   */
  @Get(['api/admin/areas', 'admin/areas', 'api/v1/admin/areas'])
  @ApiOperation({ summary: 'Admin areas list' })
  async getAdminAreas() {
    try {
      const db = this.db;
      if (!db) return [];
      const areas = await db.collection('areas').find({}).toArray();
      return areas.map((a: any) => ({
        id: a._id?.toString() || a.id,
        _id: a._id?.toString() || a.id,
        name: a.name,
        cityId: a.cityId,
        isActive: a.isActive ?? true,
      }));
    } catch {
      return [];
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
      const rawAreaPricing = await db.collection('area_pricing').find({}).sort({ updatedAt: 1 }).toArray();
      const uniqueAreaPricingMap = new Map<string, any>();
      for (const ap of rawAreaPricing) {
        const vKey = ap.variantId?.toString?.() || String(ap.variantId || '');
        const aKey = ap.areaId?.toString?.() || String(ap.areaId || '');
        if (vKey && aKey) {
          uniqueAreaPricingMap.set(`${vKey}:::${aKey}`, ap);
        }
      }
      const areaPricing = Array.from(uniqueAreaPricingMap.values());
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

    try {
      this.trackingGateway?.server?.emit('rider_updated', {
        id: updatedRider._id.toString(),
        partnerCode: updatedRider.partnerCode,
        status: updatedRider.status,
        verificationStatus: updatedRider.verificationStatus,
        isOnline: updatedRider.isOnline,
        fullName: updatedRider.fullName,
        phoneNumber: updatedRider.phoneNumber,
        vehicleType: updatedRider.vehicleType,
        vehicleNumber: updatedRider.vehicleNumber,
        hubName: updatedRider.hubName,
        hubId: updatedRider.hubId,
        timestamp: new Date().toISOString(),
      });
      this.trackingGateway?.server?.emit('rider:updated', updatedRider);
    } catch (_) {}

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

    try {
      this.trackingGateway?.server?.emit('rider_deleted', { id: rider._id.toString(), partnerCode: rider.partnerCode });
    } catch (_) {}

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

    try {
      this.trackingGateway?.server?.emit('customer_deleted', { id });
    } catch (_) {}

    return { success: true, message: 'Customer deleted successfully' };
  }

  /**
   * Update Product Price
   */
  @Put(['api/products/price', 'api/admin/catalog/products/price'])
  async updateProductPrice(@Body() body: any) {
    const db = this.db;
    const { productName, sellingPrice, productId, mrp } = body;
    const sPrice = Number(sellingPrice);
    if (!productName && !productId) {
      return { success: false, error: 'Product name or ID is required' };
    }
    const filter = productId && Types.ObjectId.isValid(productId) ? { _id: new Types.ObjectId(productId) } : { name: productName };
    const prod = await db.collection('products').findOne(filter);
    if (prod) {
      const updateSet: any = { sellingPrice: sPrice, updatedAt: new Date() };
      if (mrp !== undefined) updateSet.mrp = Number(mrp);
      await db.collection('products').updateOne(
        { _id: prod._id },
        {
          $set: updateSet,
          $push: {
            priceHistory: {
              id: 'ph_' + Date.now(),
              oldSellingPrice: prod.sellingPrice,
              newSellingPrice: sPrice,
              changedBy: 'Admin Portal',
              changedAt: new Date(),
              notes: 'Price update from Admin Portal',
            },
          } as any,
        },
      );
      await db.collection('product_variants').updateMany(
        { productId: prod._id },
        { $set: { sellingPrice: sPrice, updatedAt: new Date() } },
      );

      // Invalidate home cache immediately
      clearHomeCache();

      // Real-time broadcast to all connected apps
      try {
        this.trackingGateway?.server?.emit('catalog:updated', {
          type: 'PRICE_UPDATE',
          productId: prod._id.toString(),
          productName: prod.name,
          sellingPrice: sPrice,
          mrp: updateSet.mrp || prod.mrp,
          timestamp: new Date().toISOString(),
        });
        this.trackingGateway?.server?.emit('catalog:price-updated', {
          productId: prod._id.toString(),
          productName: prod.name,
          price: sPrice,
        });
        this.trackingGateway?.server?.emit('inventory_update', {
          productId: prod._id.toString(),
          price: sPrice,
        });
      } catch (_) {}
    }
    return { success: true, message: 'Price updated and broadcasted to all apps' };
  }

  /**
   * Create Product in Master Catalog
   */
  @Post(['api/admin/catalog/products', 'api/catalog/products'])
  async addCatalogProduct(@Body() body: any) {
    const db = this.db;
    const {
      name,
      description,
      category,
      categoryId,
      sellingPrice,
      mrp,
      costPrice,
      stock,
      image,
      imageUrl,
      unit,
      unitWeight,
      barcode,
      sku,
    } = body;

    const newProd: any = {
      name: name || 'New Product',
      description: description || '',
      category: category || 'Groceries',
      categoryId: categoryId || 'Groceries',
      sellingPrice: Number(sellingPrice || 0),
      mrp: Number(mrp || sellingPrice || 0),
      costPrice: Number(costPrice || 0),
      stock: Number(stock || 0),
      imageUrl: imageUrl || image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      unit: unit || 'kg',
      unitWeight: unitWeight || '1 kg',
      barcode: barcode || 'BAR_' + Date.now(),
      sku: sku || 'SKU_' + Date.now(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection('products').insertOne(newProd);
    const prodId = res.insertedId;

    // Create default 1 unit variant
    await db.collection('product_variants').insertOne({
      productId: prodId,
      name: 'Standard Unit',
      weight: unitWeight || '1 kg',
      sellingPrice: Number(sellingPrice || 0),
      mrp: Number(mrp || sellingPrice || 0),
      stock: Number(stock || 0),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    clearHomeCache();

    try {
      this.trackingGateway?.server?.emit('catalog:updated', {
        type: 'PRODUCT_CREATED',
        productId: prodId.toString(),
        product: { ...newProd, _id: prodId.toString() },
        timestamp: new Date().toISOString(),
      });
      this.trackingGateway?.server?.emit('inventory_update', {
        productId: prodId.toString(),
        newAvailableStock: Number(stock || 0),
      });
    } catch (_) {}

    return { success: true, data: { ...newProd, _id: prodId.toString(), id: prodId.toString() } };
  }

  /**
   * Update Product in Master Catalog
   */
  @Put(['api/admin/catalog/products/:id', 'api/catalog/products/:id'])
  async updateCatalogProduct(@Param('id') id: string, @Body() body: any) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
    const prod = await db.collection('products').findOne(filter);
    if (!prod) {
      return { success: false, error: 'Product not found' };
    }

    const updateSet: any = { updatedAt: new Date() };
    if (body.name !== undefined) updateSet.name = body.name;
    if (body.description !== undefined) updateSet.description = body.description;
    if (body.category !== undefined) updateSet.category = body.category;
    if (body.categoryId !== undefined) updateSet.categoryId = body.categoryId;
    if (body.sellingPrice !== undefined) updateSet.sellingPrice = Number(body.sellingPrice);
    if (body.mrp !== undefined) updateSet.mrp = Number(body.mrp);
    if (body.costPrice !== undefined) updateSet.costPrice = Number(body.costPrice);
    if (body.stock !== undefined) updateSet.stock = Number(body.stock);
    if (body.imageUrl !== undefined || body.image !== undefined) {
      updateSet.imageUrl = body.imageUrl || body.image;
    }
    if (body.unit !== undefined) updateSet.unit = body.unit;
    if (body.unitWeight !== undefined) updateSet.unitWeight = body.unitWeight;
    if (body.isActive !== undefined) updateSet.isActive = Boolean(body.isActive);

    await db.collection('products').updateOne({ _id: prod._id }, { $set: updateSet });

    if (body.sellingPrice !== undefined) {
      await db.collection('product_variants').updateMany(
        { productId: prod._id },
        { $set: { sellingPrice: Number(body.sellingPrice), updatedAt: new Date() } },
      );
    }

    clearHomeCache();

    try {
      this.trackingGateway?.server?.emit('catalog:updated', {
        type: 'PRODUCT_UPDATED',
        productId: prod._id.toString(),
        updates: updateSet,
        timestamp: new Date().toISOString(),
      });
      if (body.stock !== undefined) {
        this.trackingGateway?.server?.emit('inventory_update', {
          productId: prod._id.toString(),
          newAvailableStock: Number(body.stock),
        });
      }
    } catch (_) {}

    return { success: true, message: 'Product updated successfully' };
  }

  /**
   * Toggle Product Active Status
   */
  @Put(['api/admin/catalog/products/:id/status', 'api/catalog/products/:id/status'])
  async toggleCatalogProductStatus(@Param('id') id: string, @Body() body: any) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
    const isActive = Boolean(body.isActive);

    await db.collection('products').updateOne(filter, { $set: { isActive, updatedAt: new Date() } });
    clearHomeCache();

    try {
      this.trackingGateway?.server?.emit('catalog:updated', {
        type: 'STATUS_TOGGLE',
        productId: id,
        isActive,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}

    return { success: true, isActive };
  }

  /**
   * Delete Product
   */
  @Delete(['api/admin/catalog/products/:id', 'api/catalog/products/:id'])
  async deleteCatalogProduct(@Param('id') id: string) {
    const db = this.db;
    const pId: any = Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;

    await db.collection('products').deleteOne({ $or: [{ _id: pId }, { _id: id }] } as any);
    await db.collection('product_variants').deleteMany({ $or: [{ productId: pId }, { productId: id }] } as any);
    await db.collection('area_pricing').deleteMany({ $or: [{ productId: pId }, { productId: id }] } as any);
    await db.collection('inventory').deleteMany({ $or: [{ productId: pId }, { productId: id }] } as any);

    clearHomeCache();

    try {
      this.trackingGateway?.server?.emit('catalog:updated', {
        type: 'PRODUCT_DELETED',
        productId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}

    return { success: true, message: 'Product deleted successfully' };
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

    try {
      this.trackingGateway?.server?.emit('coins_updated', {
        userId: user._id.toString(),
        coins: nextBalance,
        shoppingCoins: nextBalance,
        amount: Math.abs(numAmount),
        type: type || 'Credit',
        reason: reason || 'Admin adjustment',
        timestamp: new Date().toISOString(),
      });
      this.trackingGateway?.server?.emit('wallet_updated', {
        userId: user._id.toString(),
        coins: nextBalance,
        shoppingCoins: nextBalance,
      });
    } catch (_) {}

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

    const payload = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      status,
      notes: notes || 'Status updated via Admin',
      storeId: order.storeId ? order.storeId.toString() : undefined,
      deliveryPartnerId: order.deliveryPartnerId ? order.deliveryPartnerId.toString() : undefined,
      userId: order.userId ? order.userId.toString() : undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      this.trackingGateway?.server?.emit('order_status', payload);
      this.trackingGateway?.server?.to(`order_${order._id.toString()}`).emit('order_status', payload);
      if (order.orderNumber) {
        this.trackingGateway?.server?.to(`order_${order.orderNumber}`).emit('order_status', payload);
      }
    } catch (_) {}

    return { success: true, message: 'Order status updated and broadcasted to all apps' };
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

    const payload = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      status: 'CANCELLED',
      reason: reason || 'Cancelled by Admin',
      storeId: order.storeId ? order.storeId.toString() : undefined,
      deliveryPartnerId: order.deliveryPartnerId ? order.deliveryPartnerId.toString() : undefined,
      userId: order.userId ? order.userId.toString() : undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      this.trackingGateway?.server?.emit('order_status', payload);
      this.trackingGateway?.server?.to(`order_${order._id.toString()}`).emit('order_status', payload);
      if (order.orderNumber) {
        this.trackingGateway?.server?.to(`order_${order.orderNumber}`).emit('order_status', payload);
      }
    } catch (_) {}

    return { success: true, message: 'Order cancelled successfully and broadcasted to all apps' };
  }

  /**
   * Set Area Pricing
   */
  @Post(['api/admin/areas/pricing', 'api/admin/pricing'])
  async setAreaPricing(@Body() body: any) {
    const db = this.db;
    const { variantId, areaId, price, productId } = body;
    if (!variantId && !productId) {
      return { success: false, error: 'variantId or productId required' };
    }

    const vId = variantId && Types.ObjectId.isValid(variantId) ? new Types.ObjectId(variantId) : variantId;
    const aId = areaId && Types.ObjectId.isValid(areaId) ? new Types.ObjectId(areaId) : areaId;
    const pId = productId && Types.ObjectId.isValid(productId) ? new Types.ObjectId(productId) : productId;

    const filterConditions: any[] = [];
    if (vId && aId) {
      filterConditions.push(
        { variantId: vId, areaId: aId },
        { variantId: variantId.toString(), areaId: areaId.toString() },
      );
    } else if (pId && aId) {
      filterConditions.push(
        { productId: pId, areaId: aId },
        { productId: productId.toString(), areaId: areaId.toString() },
      );
    } else if (vId) {
      filterConditions.push({ variantId: vId });
    }

    const numericPrice = Number(price);
    const updateDoc: any = {
      price: numericPrice,
      sellingPrice: numericPrice,
      updatedAt: new Date(),
    };
    if (vId) updateDoc.variantId = vId;
    if (aId) updateDoc.areaId = aId;
    if (pId) updateDoc.productId = pId;
    if (body.mrp !== undefined) updateDoc.mrp = Number(body.mrp);
    if (body.stock !== undefined) updateDoc.stock = Number(body.stock);
    if (body.isAvailable !== undefined) updateDoc.isAvailable = Boolean(body.isAvailable);

    // Find all matching documents (covers both ObjectId and legacy String storage)
    const matchQuery = filterConditions.length > 0 ? { $or: filterConditions } : { variantId };
    const existingMatches = await db.collection('area_pricing').find(matchQuery).toArray();

    let targetDocId = existingMatches.length > 0 ? existingMatches[0]._id : null;
    if (existingMatches.length > 1) {
      // Retain the primary document and purge all duplicate legacy records
      const idsToDelete = existingMatches.slice(1).map((m: any) => m._id);
      await db.collection('area_pricing').deleteMany({ _id: { $in: idsToDelete } });
    }

    let savedDoc: any;
    if (targetDocId) {
      await db.collection('area_pricing').updateOne(
        { _id: targetDocId },
        { $set: updateDoc },
      );
      savedDoc = await db.collection('area_pricing').findOne({ _id: targetDocId });
    } else {
      updateDoc.createdAt = new Date();
      const insertRes = await db.collection('area_pricing').insertOne(updateDoc);
      savedDoc = await db.collection('area_pricing').findOne({ _id: insertRes.insertedId });
    }

    // Invalidate backend home cache immediately
    clearHomeCache();

    // Broadcast real-time catalog update to all connected apps (Customer, Store, Rider, Admin)
    try {
      this.trackingGateway?.server?.emit('catalog:updated', {
        type: 'PRICE_UPDATE',
        productId: productId?.toString(),
        variantId: variantId?.toString(),
        areaId: areaId?.toString(),
        price: numericPrice,
        timestamp: new Date().toISOString(),
      });
      this.trackingGateway?.server?.emit('catalog:price-updated', {
        productId: productId?.toString(),
        variantId: variantId?.toString(),
        areaId: areaId?.toString(),
        price: numericPrice,
      });
      this.trackingGateway?.server?.emit('inventory_update', {
        productId: productId?.toString(),
        areaId: areaId?.toString(),
        price: numericPrice,
      });
    } catch (e) {}

    return {
      success: true,
      message: 'Area price updated and broadcasted',
      data: savedDoc,
    };
  }

  /**
   * Adjust Store Inventory Stock
   */
  @Post(['api/admin/stores/inventory/adjust', 'api/stores/inventory/adjust'])
  async adjustStoreInventoryStock(@Body() body: any) {
    const db = this.db;
    const { storeId, productId, deltaQty, reason, inventoryId } = body;
    const delta = Number(deltaQty || 0);

    const pObjId = productId && Types.ObjectId.isValid(productId) ? new Types.ObjectId(productId) : productId;
    const sObjId = storeId && Types.ObjectId.isValid(storeId) ? new Types.ObjectId(storeId) : storeId;

    const filter: any = {};
    if (inventoryId && Types.ObjectId.isValid(inventoryId)) {
      filter._id = new Types.ObjectId(inventoryId);
    } else if (pObjId && sObjId) {
      filter.$or = [
        { productId: pObjId, storeId: sObjId },
        { productId: productId.toString(), storeId: storeId.toString() },
        { productId: pObjId, storeId: storeId.toString() },
        { productId: productId.toString(), storeId: sObjId },
      ];
    } else if (pObjId) {
      filter.$or = [{ productId: pObjId }, { productId: productId.toString() }];
    }

    const invItem = await db.collection('inventory').findOne(filter);
    const currentStock = invItem ? Number(invItem.stock || invItem.availableQty || 0) : 0;
    const newStock = Math.max(0, currentStock + delta);

    if (invItem) {
      await db.collection('inventory').updateOne(
        { _id: invItem._id },
        {
          $set: {
            stock: newStock,
            availableQty: newStock,
            updatedAt: new Date(),
          },
        },
      );
    } else if (pObjId) {
      await db.collection('inventory').insertOne({
        productId: pObjId,
        storeId: sObjId || null,
        stock: newStock,
        availableQty: newStock,
        reservedQty: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (pObjId) {
      try {
        await db.collection('products').updateOne(
          { $or: [{ _id: pObjId }, { _id: productId }] },
          { $set: { stock: newStock, updatedAt: new Date() } },
        );
      } catch (_) {}
    }

    clearHomeCache();

    try {
      const payload = {
        productId: productId?.toString(),
        storeId: storeId?.toString(),
        newAvailableStock: newStock,
        newReservedStock: invItem?.reservedQty || 0,
        timestamp: new Date().toISOString(),
      };
      this.trackingGateway?.server?.emit('inventory_update', payload);
      this.trackingGateway?.server?.emit('catalog:updated', {
        type: 'STOCK_UPDATE',
        ...payload,
      });
    } catch (_) {}

    return { success: true, message: 'Stock adjusted successfully', stock: newStock };
  }

  /**
   * Update Inventory Shelf Location
   */
  @Post(['api/admin/stores/inventory/shelf', 'api/stores/inventory/shelf'])
  async updateInventoryShelf(@Body() body: any) {
    const db = this.db;
    const { inventoryId, storeId, productId, shelfLocation } = body;
    const pObjId = productId && Types.ObjectId.isValid(productId) ? new Types.ObjectId(productId) : productId;
    const sObjId = storeId && Types.ObjectId.isValid(storeId) ? new Types.ObjectId(storeId) : storeId;

    const filter: any = {};
    if (inventoryId && Types.ObjectId.isValid(inventoryId)) {
      filter._id = new Types.ObjectId(inventoryId);
    } else if (pObjId && sObjId) {
      filter.$or = [
        { productId: pObjId, storeId: sObjId },
        { productId: productId.toString(), storeId: storeId.toString() },
      ];
    } else if (pObjId) {
      filter.$or = [{ productId: pObjId }, { productId: productId.toString() }];
    }

    await db.collection('inventory').updateOne(
      filter,
      { $set: { shelfLocation, updatedAt: new Date() } },
      { upsert: false },
    );

    try {
      this.trackingGateway?.server?.emit('inventory_update', {
        productId: productId?.toString(),
        storeId: storeId?.toString(),
        shelfLocation,
      });
    } catch (_) {}

    return { success: true, shelfLocation };
  }

  /**
   * Operational Zones (Areas) CRUD
   */
  @Post(['api/admin/areas', 'admin/areas'])
  async createArea(@Body() body: any) {
    const db = this.db;
    const newArea: any = {
      name: body.name,
      code: body.code || body.name?.toUpperCase().replace(/\s+/g, '_'),
      cityId: body.cityId || null,
      city: body.city || 'Ahmedabad',
      darkStore: body.darkStore || '',
      address: body.address || '',
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      centerLat: body.centerLat || 23.0225,
      centerLng: body.centerLng || 72.5714,
      radiusKm: body.radiusKm || 5,
      defaultDeliveryMinutes: body.defaultDeliveryMinutes || 9,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection('areas').insertOne(newArea);
    clearHomeCache();

    try {
      this.trackingGateway?.server?.emit('areas:updated', { ...newArea, _id: res.insertedId.toString() });
      this.trackingGateway?.server?.emit('catalog:updated', { type: 'AREA_CREATED' });
    } catch (_) {}

    return { success: true, data: { ...newArea, _id: res.insertedId.toString() }, id: res.insertedId.toString() };
  }

  @Put(['api/admin/areas/:id', 'admin/areas/:id'])
  async updateArea(@Param('id') id: string, @Body() body: any) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
    const updates: any = { ...body, updatedAt: new Date() };
    delete updates._id;
    delete updates.id;

    await db.collection('areas').updateOne(filter, { $set: updates });
    clearHomeCache();

    try {
      this.trackingGateway?.server?.emit('areas:updated', { id, ...updates });
      this.trackingGateway?.server?.emit('catalog:updated', { type: 'AREA_UPDATED' });
    } catch (_) {}

    return { success: true, message: 'Area updated successfully' };
  }

  @Delete(['api/admin/areas/:id', 'admin/areas/:id'])
  async deleteArea(@Param('id') id: string) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };

    await db.collection('areas').deleteOne(filter);
    clearHomeCache();

    try {
      this.trackingGateway?.server?.emit('areas:updated', { id, deleted: true });
    } catch (_) {}

    return { success: true, message: 'Area deleted successfully' };
  }

  /**
   * Pincodes Master & Serviceability Toggle (Admin)
   */
  @Get(['api/v1/admin/pincodes', 'api/admin/pincodes', 'admin/pincodes'])
  @ApiOperation({ summary: 'Get all database pincodes and their serviceability status' })
  async getAdminPincodes(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    try {
      const db = this.db;
      if (!db) return { success: false, data: [] };

      const [rawAreas, rawApproved, rawStores, rawCities] = await Promise.all([
        db.collection('areas').find({}).toArray(),
        db.collection('approved_pincodes').find({}).toArray(),
        db.collection('stores').find({}).toArray(),
        db.collection('cities').find({}).toArray(),
      ]);

      const pincodeMap = new Map<string, any>();

      // 1. Process areas
      for (const area of rawAreas) {
        const aId = area._id.toString();
        const pins = Array.isArray(area.pincodes) && area.pincodes.length > 0
          ? area.pincodes
          : (area.pincode ? [area.pincode] : []);

        const city = rawCities.find((c: any) => c._id?.toString() === area.cityId?.toString() || c.id === area.cityId);
        const cityName = area.cityName || city?.name || area.city || 'Ahmedabad';

        const areaStores = rawStores.filter((s: any) => {
          if (s.isActive === false) return false;
          if (s.areaId && s.areaId.toString() === aId) return true;
          if (s.areaName && area.name && s.areaName.toLowerCase() === area.name.toLowerCase()) return true;
          return false;
        });
        const assignedStore = areaStores[0];
        const assignedStoreName = assignedStore ? assignedStore.name : (area.hasActiveStore ? 'Assigned Dark Store' : 'No Store Assigned');
        const polygonCoords = area.polygon?.coordinates?.[0]?.length || area.geometry?.coordinates?.[0]?.length || 0;

        for (const pin of pins) {
          const cleanPin = String(pin).trim();
          if (!cleanPin) continue;

          const appMatch = rawApproved.find((ap: any) => String(ap.pincode).trim() === cleanPin);

          let isActive = area.isActive !== false;
          let isIncomeEnabled = true;
          let isDeliveryAllowed = true;
          if (appMatch) {
            if (appMatch.isActive !== undefined) isActive = appMatch.isActive;
            if (appMatch.isDeliveryAllowed !== undefined) isDeliveryAllowed = appMatch.isDeliveryAllowed;
            if (appMatch.isIncomeEnabled !== undefined) isIncomeEnabled = appMatch.isIncomeEnabled;
            isActive = isActive && isDeliveryAllowed;
          }

          pincodeMap.set(`${cleanPin}_${aId}`, {
            id: appMatch?._id?.toString() || `${cleanPin}_${aId}`,
            _id: appMatch?._id?.toString() || `${cleanPin}_${aId}`,
            pincode: cleanPin,
            areaId: aId,
            areaName: area.name,
            areaCode: area.code,
            cityName,
            cityId: area.cityId?.toString(),
            isActive,
            isDeliveryAllowed,
            isIncomeEnabled,
            polygonCoordsCount: polygonCoords,
            assignedStoreName,
            hasActiveStore: areaStores.length > 0,
            slaMinutes: Number(area.slaMinutes) || 9,
            centerLat: area.centerLat,
            centerLng: area.centerLng,
            allPins: pins,
          });
        }
      }

      // 2. Process approved_pincodes (including Gujarat expansion locations)
      for (const app of rawApproved) {
        const cleanPin = String(app.pincode).trim();
        if (!cleanPin) continue;

        // Check if already mapped with this area or standalone
        const existingKey = Array.from(pincodeMap.keys()).find(k => k.startsWith(`${cleanPin}_`));
        if (existingKey) {
          const existing = pincodeMap.get(existingKey);
          if (existing) {
            existing.id = app._id.toString();
            existing._id = app._id.toString();
            if (app.isActive !== undefined) existing.isActive = app.isActive;
            if (app.isDeliveryAllowed !== undefined) existing.isDeliveryAllowed = app.isDeliveryAllowed;
            if (app.isIncomeEnabled !== undefined) existing.isIncomeEnabled = app.isIncomeEnabled;
            existing.isActive = existing.isActive && existing.isDeliveryAllowed;
          }
        } else {
          const city = rawCities.find((c: any) =>
            (c.name && app.cityName && c.name.toLowerCase() === app.cityName.toLowerCase()) ||
            (c._id?.toString() === app.cityId?.toString())
          );
          const store = rawStores.find((s: any) =>
            (s.city && app.cityName && s.city.toLowerCase() === app.cityName.toLowerCase()) ||
            (s.pincode && s.pincode === cleanPin)
          );

          const isActive = app.isActive !== false && app.isDeliveryAllowed !== false;

          pincodeMap.set(`${cleanPin}_standalone`, {
            id: app._id.toString(),
            _id: app._id.toString(),
            pincode: cleanPin,
            areaId: app.areaId?.toString() || undefined,
            areaName: app.areaName || cleanPin,
            areaCode: app.areaCode || `AREA-${cleanPin}`,
            cityName: app.cityName || city?.name || 'Gujarat',
            cityId: city?._id?.toString() || app.cityId?.toString(),
            isActive,
            isDeliveryAllowed: app.isDeliveryAllowed !== false,
            isIncomeEnabled: app.isIncomeEnabled !== false,
            polygonCoordsCount: 0,
            assignedStoreName: store ? store.name : 'No Store Assigned',
            hasActiveStore: !!store,
            slaMinutes: 15,
            centerLat: app.latitude,
            centerLng: app.longitude,
            allPins: [cleanPin],
          });
        }
      }

      let list = Array.from(pincodeMap.values());

      // Filter by status: 'Active' | 'Inactive'
      if (status && status !== 'all' && status !== 'All') {
        const s = status.toLowerCase();
        if (s === 'active') {
          list = list.filter((item) => item.isActive);
        } else if (s === 'inactive') {
          list = list.filter((item) => !item.isActive);
        }
      }

      // Filter by search query
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter((item) =>
          item.pincode.toLowerCase().includes(q) ||
          item.areaName.toLowerCase().includes(q) ||
          item.cityName.toLowerCase().includes(q) ||
          (item.areaCode && item.areaCode.toLowerCase().includes(q))
        );
      }

      return {
        success: true,
        count: list.length,
        total: list.length,
        data: list,
      };
    } catch (err: any) {
      return { success: false, message: err?.message, data: [] };
    }
  }

  @Patch(['api/v1/admin/pincodes/:id/toggle-status', 'api/admin/pincodes/:id/toggle-status', 'admin/pincodes/:id/toggle-status'])
  @Post(['api/v1/admin/pincodes/:id/toggle-status', 'api/admin/pincodes/:id/toggle-status'])
  @ApiOperation({ summary: 'Toggle Active/Inactive status for a PIN code or Area' })
  async togglePincodeStatus(@Param('id') id: string, @Body() body: any) {
    try {
      const db = this.db;
      if (!db) return { success: false, message: 'Database not connected' };

      const rawIsActive = body.isActive !== undefined ? body.isActive : (body.isDeliveryAllowed !== undefined ? body.isDeliveryAllowed : true);
      const isActive = Boolean(rawIsActive);
      const reqPincode = body.pincode ? String(body.pincode).trim() : null;
      const reqAreaId = body.areaId ? String(body.areaId).trim() : null;

      let targetPincode: string | null = reqPincode;
      let targetAreaId: string | null = reqAreaId;

      // Check if id is a 6-digit pincode
      if (/^\d{6}$/.test(id)) {
        targetPincode = id;
      } else if (Types.ObjectId.isValid(id)) {
        const appDoc = await db.collection('approved_pincodes').findOne({ _id: new Types.ObjectId(id) });
        if (appDoc) {
          targetPincode = targetPincode || appDoc.pincode;
          targetAreaId = targetAreaId || (appDoc.areaId ? appDoc.areaId.toString() : null);
        } else {
          const areaDoc = await db.collection('areas').findOne({ _id: new Types.ObjectId(id) });
          if (areaDoc) {
            targetAreaId = id;
            if (Array.isArray(areaDoc.pincodes) && areaDoc.pincodes.length > 0) {
              targetPincode = targetPincode || areaDoc.pincodes[0];
            }
          }
        }
      }

      // 1. Update approved_pincodes
      if (targetPincode) {
        await db.collection('approved_pincodes').updateMany(
          { pincode: targetPincode },
          {
            $set: {
              isActive,
              isDeliveryAllowed: isActive,
              isRegistrationAllowed: isActive,
              isIncomeEnabled: isActive,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      } else if (id && Types.ObjectId.isValid(id)) {
        await db.collection('approved_pincodes').updateOne(
          { _id: new Types.ObjectId(id) },
          {
            $set: {
              isActive,
              isDeliveryAllowed: isActive,
              isRegistrationAllowed: isActive,
              isIncomeEnabled: isActive,
              updatedAt: new Date(),
            },
          }
        );
      }

      // 2. Update areas
      if (targetAreaId && Types.ObjectId.isValid(targetAreaId)) {
        await db.collection('areas').updateOne(
          { _id: new Types.ObjectId(targetAreaId) },
          { $set: { isActive, updatedAt: new Date() } }
        );
      } else if (targetPincode) {
        await db.collection('areas').updateMany(
          { pincodes: targetPincode },
          { $set: { isActive, updatedAt: new Date() } }
        );
      }

      // 3. Clear cache and notify WebSocket subscribers
      clearHomeCache();
      try {
        this.trackingGateway?.server?.emit('pincodes:updated', {
          id,
          pincode: targetPincode,
          isActive,
          isDeliveryAllowed: isActive,
          isIncomeEnabled: isActive,
        });
        this.trackingGateway?.server?.emit('areas:updated', {
          id: targetAreaId || id,
          isActive,
        });
      } catch (_) {}

      return {
        success: true,
        message: `Pincode ${targetPincode || id} is now ${isActive ? 'Active' : 'Inactive'}`,
        data: {
          id,
          pincode: targetPincode,
          areaId: targetAreaId,
          isActive,
          isDeliveryAllowed: isActive,
          isIncomeEnabled: isActive,
        },
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update pincode status' };
    }
  }

  /**
   * Add New Pincode (Admin)
   */
  @Post(['api/v1/admin/pincodes', 'api/admin/pincodes', 'admin/pincodes'])
  @ApiOperation({ summary: 'Add a new pincode to serviceability and approved_pincodes' })
  async createAdminPincode(@Body() body: any) {
    try {
      const db = this.db;
      if (!db) return { success: false, message: 'Database not connected' };

      const rawPincode = body.pincode ? String(body.pincode).trim() : '';
      if (!rawPincode || !/^\d{6}$/.test(rawPincode)) {
        return { success: false, message: 'Please provide a valid 6-digit PIN code' };
      }

      // Check if pincode already exists
      const existing = await db.collection('approved_pincodes').findOne({ pincode: rawPincode });
      if (existing) {
        return { success: false, message: `PIN code ${rawPincode} already exists in serviceability master` };
      }

      // Resolve City
      let cityObjId: Types.ObjectId | null = null;
      let cityName = body.cityName || '';
      if (body.cityId && Types.ObjectId.isValid(body.cityId)) {
        cityObjId = new Types.ObjectId(body.cityId);
        const cityDoc = await db.collection('cities').findOne({ _id: cityObjId });
        if (cityDoc) cityName = cityDoc.name || cityName;
      }

      // Resolve Area
      let areaObjId: Types.ObjectId | null = null;
      let areaName = body.areaName || '';
      let areaCode = body.areaCode || '';
      if (body.areaId && Types.ObjectId.isValid(body.areaId)) {
        areaObjId = new Types.ObjectId(body.areaId);
        const areaDoc = await db.collection('areas').findOne({ _id: areaObjId });
        if (areaDoc) {
          areaName = areaDoc.name || areaName;
          areaCode = areaDoc.code || areaCode;
          if (!cityObjId && areaDoc.cityId) {
            cityObjId = Types.ObjectId.isValid(areaDoc.cityId) ? new Types.ObjectId(areaDoc.cityId) : null;
          }
          if (!cityName) cityName = areaDoc.cityName || areaDoc.city || '';
        }
      }

      // Resolve Dark Store
      let storeObjId: Types.ObjectId | null = null;
      let storeName = body.storeName || '';
      if (body.storeId && Types.ObjectId.isValid(body.storeId)) {
        storeObjId = new Types.ObjectId(body.storeId);
        const storeDoc = await db.collection('stores').findOne({ _id: storeObjId });
        if (storeDoc) storeName = storeDoc.name || storeName;
      }

      const isActive = body.isActive !== false;
      const isDeliveryAllowed = body.isDeliveryAllowed !== false && isActive;
      const isIncomeEnabled = body.isIncomeEnabled !== false;

      const newDoc = {
        pincode: rawPincode,
        areaId: areaObjId,
        areaName: areaName || rawPincode,
        areaCode: areaCode || `AREA-${rawPincode}`,
        cityId: cityObjId,
        cityName: cityName || 'Gujarat',
        storeId: storeObjId,
        storeName: storeName || (storeObjId ? 'Assigned Dark Store' : 'No Store Assigned'),
        isActive,
        isDeliveryAllowed,
        isIncomeEnabled,
        isRegistrationAllowed: true,
        slaMinutes: Number(body.slaMinutes) || 9,
        centerLat: Number(body.centerLat) || 23.0225,
        centerLng: Number(body.centerLng) || 72.5714,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('approved_pincodes').insertOne(newDoc);

      // Also add to area's pincodes array if area was chosen
      if (areaObjId) {
        await db.collection('areas').updateOne(
          { _id: areaObjId },
          { $addToSet: { pincodes: rawPincode } }
        );
      }

      clearHomeCache();
      try {
        this.trackingGateway?.server?.emit('pincodes:created', {
          id: result.insertedId.toString(),
          pincode: rawPincode,
          areaId: areaObjId?.toString(),
          isActive,
        });
      } catch (_) {}

      return {
        success: true,
        message: `PIN code ${rawPincode} added successfully`,
        data: {
          id: result.insertedId.toString(),
          _id: result.insertedId.toString(),
          ...newDoc,
        },
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to create pincode' };
    }
  }

  /**
   * Edit / Update Pincode (Admin)
   */
  @Put(['api/v1/admin/pincodes/:id', 'api/admin/pincodes/:id', 'admin/pincodes/:id'])
  @Patch(['api/v1/admin/pincodes/:id', 'api/admin/pincodes/:id', 'admin/pincodes/:id'])
  @ApiOperation({ summary: 'Update an existing pincode and its area mapping' })
  async updateAdminPincode(@Param('id') id: string, @Body() body: any) {
    try {
      const db = this.db;
      if (!db) return { success: false, message: 'Database not connected' };

      let targetDoc: any = null;
      if (Types.ObjectId.isValid(id)) {
        targetDoc = await db.collection('approved_pincodes').findOne({ _id: new Types.ObjectId(id) });
      }
      if (!targetDoc && /^\d{6}$/.test(id)) {
        targetDoc = await db.collection('approved_pincodes').findOne({ pincode: id });
      }
      if (!targetDoc && id.includes('_')) {
        const pinPart = id.split('_')[0];
        targetDoc = await db.collection('approved_pincodes').findOne({ pincode: pinPart });
      }

      const oldPincode = targetDoc?.pincode || (/^\d{6}$/.test(id) ? id : (body.oldPincode || body.pincode));
      const newPincode = body.pincode ? String(body.pincode).trim() : oldPincode;

      if (!newPincode || !/^\d{6}$/.test(newPincode)) {
        return { success: false, message: 'Please provide a valid 6-digit PIN code' };
      }

      // If pincode changed, check for conflict
      if (newPincode !== oldPincode) {
        const conflict = await db.collection('approved_pincodes').findOne({ pincode: newPincode });
        if (conflict) {
          return { success: false, message: `PIN code ${newPincode} already exists in database` };
        }
      }

      // Resolve City
      let cityObjId = targetDoc?.cityId || null;
      let cityName = body.cityName || targetDoc?.cityName || '';
      if (body.cityId && Types.ObjectId.isValid(body.cityId)) {
        cityObjId = new Types.ObjectId(body.cityId);
        const cityDoc = await db.collection('cities').findOne({ _id: cityObjId });
        if (cityDoc) cityName = cityDoc.name || cityName;
      }

      // Resolve Area
      let newAreaObjId = body.areaId && Types.ObjectId.isValid(body.areaId) ? new Types.ObjectId(body.areaId) : targetDoc?.areaId || null;
      let areaName = body.areaName || targetDoc?.areaName || '';
      let areaCode = body.areaCode || targetDoc?.areaCode || '';
      if (body.areaId && Types.ObjectId.isValid(body.areaId)) {
        const areaDoc = await db.collection('areas').findOne({ _id: newAreaObjId });
        if (areaDoc) {
          areaName = areaDoc.name || areaName;
          areaCode = areaDoc.code || areaCode;
          if (!cityName) cityName = areaDoc.cityName || areaDoc.city || '';
        }
      }

      // Resolve Store
      let storeObjId = body.storeId && Types.ObjectId.isValid(body.storeId) ? new Types.ObjectId(body.storeId) : targetDoc?.storeId || null;
      let storeName = body.storeName || targetDoc?.storeName || '';
      if (body.storeId && Types.ObjectId.isValid(body.storeId)) {
        const storeDoc = await db.collection('stores').findOne({ _id: storeObjId });
        if (storeDoc) storeName = storeDoc.name || storeName;
      }

      const isActive = body.isActive !== undefined ? Boolean(body.isActive) : (targetDoc?.isActive ?? true);
      const isDeliveryAllowed = body.isDeliveryAllowed !== undefined ? Boolean(body.isDeliveryAllowed) : isActive;
      const isIncomeEnabled = body.isIncomeEnabled !== undefined ? Boolean(body.isIncomeEnabled) : (targetDoc?.isIncomeEnabled ?? true);

      const updateFields: any = {
        pincode: newPincode,
        cityName: cityName || 'Gujarat',
        areaName: areaName || newPincode,
        areaCode: areaCode || `AREA-${newPincode}`,
        storeName: storeName || (storeObjId ? 'Assigned Dark Store' : 'No Store Assigned'),
        isActive,
        isDeliveryAllowed,
        isIncomeEnabled,
        updatedAt: new Date(),
      };
      if (cityObjId) updateFields.cityId = cityObjId;
      if (newAreaObjId) updateFields.areaId = newAreaObjId;
      if (storeObjId) updateFields.storeId = storeObjId;
      if (body.slaMinutes !== undefined) updateFields.slaMinutes = Number(body.slaMinutes) || 9;

      // Update approved_pincodes
      if (targetDoc?._id) {
        await db.collection('approved_pincodes').updateOne(
          { _id: targetDoc._id },
          { $set: updateFields }
        );
      } else {
        await db.collection('approved_pincodes').updateOne(
          { pincode: oldPincode },
          { $set: updateFields },
          { upsert: true }
        );
      }

      // Handle area changes in areas collection
      const oldAreaId = targetDoc?.areaId ? targetDoc.areaId.toString() : null;
      const newAreaIdStr = newAreaObjId ? newAreaObjId.toString() : null;

      if (oldAreaId && oldAreaId !== newAreaIdStr) {
        // Remove from old area
        await db.collection('areas').updateOne(
          { _id: new Types.ObjectId(oldAreaId) },
          { $pull: { pincodes: oldPincode } } as any
        );
      }

      if (newAreaObjId) {
        // Add to new area
        await db.collection('areas').updateOne(
          { _id: newAreaObjId },
          { $addToSet: { pincodes: newPincode } } as any
        );
      }

      // If pincode changed without area change, update in area
      if (oldPincode !== newPincode && oldAreaId === newAreaIdStr && newAreaObjId) {
        await db.collection('areas').updateOne(
          { _id: newAreaObjId },
          { $pull: { pincodes: oldPincode } } as any
        );
        await db.collection('areas').updateOne(
          { _id: newAreaObjId },
          { $addToSet: { pincodes: newPincode } } as any
        );
      }

      clearHomeCache();
      try {
        this.trackingGateway?.server?.emit('pincodes:updated', {
          id,
          pincode: newPincode,
          areaId: newAreaIdStr,
          isActive,
        });
      } catch (_) {}

      return {
        success: true,
        message: `PIN code ${newPincode} updated successfully`,
        data: updateFields,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update pincode' };
    }
  }

  /**
   * Delete Pincode (Admin)
   */
  @Delete(['api/v1/admin/pincodes/:id', 'api/admin/pincodes/:id', 'admin/pincodes/:id'])
  @ApiOperation({ summary: 'Delete a pincode from serviceability and areas' })
  async deleteAdminPincode(@Param('id') id: string, @Query('pincode') qPincode?: string) {
    try {
      const db = this.db;
      if (!db) return { success: false, message: 'Database not connected' };

      let targetPincode = qPincode ? String(qPincode).trim() : null;
      let targetObjId: Types.ObjectId | null = null;

      if (Types.ObjectId.isValid(id)) {
        targetObjId = new Types.ObjectId(id);
        const doc = await db.collection('approved_pincodes').findOne({ _id: targetObjId });
        if (doc) targetPincode = targetPincode || doc.pincode;
      }

      if (!targetPincode) {
        if (/^\d{6}$/.test(id)) {
          targetPincode = id;
        } else if (id.includes('_')) {
          targetPincode = id.split('_')[0];
        }
      }

      if (!targetPincode) {
        return { success: false, message: 'Could not identify pincode to delete' };
      }

      // Check for active / pending orders in this pincode
      const activeOrdersCount = await db.collection('orders').countDocuments({
        'address.pincode': targetPincode,
        status: { $in: ['PENDING', 'ACCEPTED', 'PACKED', 'ASSIGNED', 'OUT_FOR_DELIVERY'] },
      });

      if (activeOrdersCount > 0) {
        return {
          success: false,
          message: `Cannot delete PIN code ${targetPincode}: There are ${activeOrdersCount} active/pending orders in this area. Please complete or cancel them first.`,
        };
      }

      // Delete from approved_pincodes
      if (targetObjId) {
        await db.collection('approved_pincodes').deleteOne({ _id: targetObjId });
      }
      await db.collection('approved_pincodes').deleteMany({ pincode: targetPincode });

      // Remove from any areas pincodes array
      await db.collection('areas').updateMany(
        { pincodes: targetPincode },
        { $pull: { pincodes: targetPincode } } as any
      );

      clearHomeCache();
      try {
        this.trackingGateway?.server?.emit('pincodes:deleted', {
          id,
          pincode: targetPincode,
        });
      } catch (_) {}

      return {
        success: true,
        message: `PIN code ${targetPincode} deleted successfully from serviceability master`,
        data: { pincode: targetPincode },
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to delete pincode' };
    }
  }

  /**
   * Cities CRUD
   */
  @Get(['api/admin/cities', 'admin/cities'])
  async getAdminCities() {
    const db = this.db;
    const cities = await db.collection('cities').find({}).sort({ sortOrder: 1, name: 1 }).toArray();
    return {
      success: true,
      data: cities.map((c: any) => ({
        id: c._id.toString(),
        name: c.name,
        code: c.code,
        state: c.state || 'Gujarat',
        status: c.status || (c.isActive ? 'Active' : 'Inactive'),
      })),
    };
  }

  @Post(['api/admin/cities', 'admin/cities'])
  async createAdminCity(@Body() body: any) {
    const db = this.db;
    const newCity = {
      name: body.name,
      code: body.code || body.name?.toUpperCase().replace(/\s+/g, '_'),
      state: body.state || 'Gujarat',
      status: body.status || 'Active',
      isActive: body.status !== 'Inactive',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.collection('cities').insertOne(newCity);
    try {
      this.trackingGateway?.server?.emit('cities:updated', { ...newCity, id: res.insertedId.toString() });
    } catch (_) {}
    return { success: true, data: { ...newCity, id: res.insertedId.toString() } };
  }

  @Patch(['api/admin/cities/:id', 'admin/cities/:id'])
  async updateAdminCity(@Param('id') id: string, @Body() body: any) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
    const updates: any = { ...body, updatedAt: new Date() };
    delete updates.id;
    delete updates._id;

    await db.collection('cities').updateOne(filter, { $set: updates });
    try {
      this.trackingGateway?.server?.emit('cities:updated', { id, ...updates });
    } catch (_) {}
    return { success: true, data: { id, ...updates } };
  }

  @Delete(['api/admin/cities/:id', 'admin/cities/:id'])
  async deleteAdminCity(@Param('id') id: string) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
    await db.collection('cities').deleteOne(filter);
    try {
      this.trackingGateway?.server?.emit('cities:updated', { id, deleted: true });
    } catch (_) {}
    return { success: true, message: 'City deleted' };
  }

  /**
   * Stores CRUD
   */
  @Post(['api/admin/stores', 'admin/stores', 'api/v1/admin/stores'])
  async createStore(@Body() body: any) {
    const db = this.db;
    const newStore = {
      name: body.name,
      code: body.code || 'STR_' + Date.now(),
      city: body.city || 'Ahmedabad',
      cityId: body.cityId || null,
      areaId: body.areaId || null,
      address: body.address || '',
      latitude: Number(body.latitude || 23.0225),
      longitude: Number(body.longitude || 72.5714),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.collection('stores').insertOne(newStore);
    try {
      this.trackingGateway?.server?.emit('stores:updated', { ...newStore, id: res.insertedId.toString() });
    } catch (_) {}
    return { success: true, data: { ...newStore, id: res.insertedId.toString() } };
  }

  @Post(['api/admin/stores/:id/reset-password', 'admin/stores/:id/reset-password', 'api/v1/admin/stores/:id/reset-password'])
  async resetStorePassword(@Param('id') id: string, @Body() body: any) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
    const password = body.password || 'WomupStore@' + Math.floor(1000 + Math.random() * 9000);
    const hash = await bcrypt.hash(password, 10);
    await db.collection('stores').updateOne(filter, {
      $set: {
        loginPassword: password,
        loginPasswordHash: hash,
        passwordUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return { success: true, password, message: 'Store password reset successfully' };
  }

  @Put(['api/admin/stores/:id', 'admin/stores/:id', 'api/v1/admin/stores/:id'])
  async updateStore(@Param('id') id: string, @Body() body: any) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
    const updates = { ...body, updatedAt: new Date() };
    delete updates.id;
    delete updates._id;

    if (updates.password || updates.loginPassword) {
      const rawPass = updates.password || updates.loginPassword;
      updates.loginPassword = rawPass;
      updates.loginPasswordHash = await bcrypt.hash(rawPass, 10);
      updates.passwordUpdatedAt = new Date();
      delete updates.password;
    }

    await db.collection('stores').updateOne(filter, { $set: updates });
    try {
      this.trackingGateway?.server?.emit('stores:updated', { id, ...updates });
    } catch (_) {}
    return { success: true, data: { id, ...updates } };
  }

  @Delete(['api/admin/stores/:id', 'admin/stores/:id', 'api/v1/admin/stores/:id'])
  async deleteStore(@Param('id') id: string) {
    const db = this.db;
    const filter: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
    await db.collection('stores').deleteOne(filter);
    try {
      this.trackingGateway?.server?.emit('stores:updated', { id, deleted: true });
    } catch (_) {}
    return { success: true, message: 'Store deleted' };
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

    try {
      this.trackingGateway?.server?.emit('customer_created', { ...newUser, _id: res.insertedId.toString() });
    } catch (_) {}

    return { success: true, data: { ...newUser, _id: res.insertedId } };
  }

  /**
   * Payout Rates CRUD
   */
  @Get(['api/admin/payout-rates', 'admin/payout-rates', 'api/v1/admin/payout-rates', 'payout-rates', 'api/payout-rates', 'api/v1/payout-rates'])
  async getPayoutRates() {
    try {
      const db = this.db;
      const rates = await db
        .collection('rider_payout_rates')
        .find({})
        .sort({ scope: 1, cityName: 1, areaName: 1, createdAt: -1 })
        .toArray();

      const normalized = rates.map((r: any) => ({
        id: r._id.toString(),
        _id: r._id.toString(),
        scope: r.scope,
        cityId: r.cityId ? r.cityId.toString() : null,
        cityName: r.cityName || null,
        areaId: r.areaId ? r.areaId.toString() : null,
        areaName: r.areaName || null,
        ratePerKm: Number(r.ratePerKm) || 12,
        minimumPayout: Number(r.minimumPayout) || 30,
        maximumPayout: Number(r.maximumPayout) || 160,
        isActive: r.isActive !== false,
        effectiveFrom: r.effectiveFrom || r.createdAt,
        effectiveUntil: r.effectiveUntil || null,
        description: r.description || '',
        createdAt: r.createdAt || new Date(),
        updatedAt: r.updatedAt || new Date(),
      }));

      const globalRate = normalized.find((r: any) => r.scope === 'GLOBAL') || {
        id: 'default_global',
        scope: 'GLOBAL',
        ratePerKm: 12,
        minimumPayout: 35,
        maximumPayout: 160,
        isActive: true,
        description: 'Universal Platform Fallback',
      };

      const activeOverrides = normalized.filter((r: any) => r.scope !== 'GLOBAL' && r.isActive);
      const allRatesNums = normalized.map((r: any) => r.ratePerKm).filter((n: any) => !isNaN(n));
      const minRate = allRatesNums.length > 0 ? Math.min(...allRatesNums) : 10;
      const maxRate = allRatesNums.length > 0 ? Math.max(...allRatesNums) : 18;

      return {
        success: true,
        count: normalized.length,
        data: normalized,
        globalRate,
        stats: {
          totalRates: normalized.length,
          activeOverridesCount: activeOverrides.length,
          globalRatePerKm: globalRate.ratePerKm,
          rateRangeText: `₹${minRate} - ₹${maxRate}`,
          minRate,
          maxRate,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get(['api/admin/payout-rates/resolve', 'admin/payout-rates/resolve', 'api/v1/admin/payout-rates/resolve'])
  async resolvePayoutRate(
    @Query('cityId') cityId?: string,
    @Query('cityName') cityName?: string,
    @Query('areaId') areaId?: string,
    @Query('areaName') areaName?: string,
    @Query('distanceKm') distanceKm?: string,
  ) {
    try {
      const db = this.db;
      const dist = parseFloat(distanceKm || '5.0') || 5.0;

      let resolvedRate: any = null;
      let winningScope = 'GLOBAL';

      if (areaId || areaName) {
        const areaQuery: any = { scope: 'AREA', isActive: { $ne: false } };
        if (areaId && Types.ObjectId.isValid(areaId)) {
          areaQuery.$or = [{ areaId: new Types.ObjectId(areaId) }, { areaId: areaId.toString() }];
        } else if (areaName) {
          areaQuery.areaName = new RegExp(`^${areaName.trim()}$`, 'i');
        }
        resolvedRate = await db.collection('rider_payout_rates').findOne(areaQuery);
        if (resolvedRate) winningScope = 'AREA';
      }

      if (!resolvedRate && (cityId || cityName)) {
        const cityQuery: any = { scope: 'CITY', isActive: { $ne: false } };
        if (cityId && Types.ObjectId.isValid(cityId)) {
          cityQuery.$or = [{ cityId: new Types.ObjectId(cityId) }, { cityId: cityId.toString() }];
        } else if (cityName) {
          cityQuery.cityName = new RegExp(`^${cityName.trim()}$`, 'i');
        }
        resolvedRate = await db.collection('rider_payout_rates').findOne(cityQuery);
        if (resolvedRate) winningScope = 'CITY';
      }

      if (!resolvedRate) {
        resolvedRate = await db.collection('rider_payout_rates').findOne({ scope: 'GLOBAL', isActive: { $ne: false } });
        if (resolvedRate) winningScope = 'GLOBAL';
      }

      const finalRatePerKm = resolvedRate ? Number(resolvedRate.ratePerKm) : 12;
      const minPayout = resolvedRate ? Number(resolvedRate.minimumPayout) : 35;
      const maxPayout = resolvedRate ? Number(resolvedRate.maximumPayout) : 160;

      const rawCalculated = dist * finalRatePerKm;
      const clampedPayout = Math.min(maxPayout, Math.max(minPayout, Math.round(rawCalculated)));

      return {
        success: true,
        winningScope,
        resolvedRate: {
          id: resolvedRate?._id?.toString() || 'fallback',
          scope: winningScope,
          ratePerKm: finalRatePerKm,
          minimumPayout: minPayout,
          maximumPayout: maxPayout,
          cityName: resolvedRate?.cityName || cityName || null,
          areaName: resolvedRate?.areaName || areaName || null,
          description: resolvedRate?.description || 'Rate applied',
        },
        calculation: {
          distanceKm: dist,
          ratePerKm: finalRatePerKm,
          rawPayout: Math.round(rawCalculated * 100) / 100,
          minimumFloorApplied: rawCalculated < minPayout,
          maximumCapApplied: rawCalculated > maxPayout,
          finalPayout: clampedPayout,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post(['api/admin/payout-rates', 'admin/payout-rates', 'api/v1/admin/payout-rates'])
  async createPayoutRate(@Body() body: any) {
    try {
      const {
        scope,
        cityId,
        cityName,
        areaId,
        areaName,
        ratePerKm,
        minimumPayout,
        maximumPayout,
        description,
        effectiveFrom,
      } = body;

      if (!scope || !['GLOBAL', 'CITY', 'AREA'].includes(scope.toUpperCase())) {
        return { success: false, error: 'Scope must be GLOBAL, CITY, or AREA' };
      }

      const cleanScope = scope.toUpperCase();
      const rate = Number(ratePerKm);
      if (isNaN(rate) || rate <= 0) {
        return { success: false, error: 'Valid rate per km (greater than 0) is required' };
      }

      const minPay = Number(minimumPayout) || 30;
      const maxPay = Number(maximumPayout) || Math.max(minPay * 3, 150);

      const db = this.db;

      if (cleanScope === 'GLOBAL') {
        const existingGlobal = await db.collection('rider_payout_rates').findOne({ scope: 'GLOBAL' });
        if (existingGlobal) {
          await db.collection('rider_payout_rates').updateOne(
            { _id: existingGlobal._id },
            {
              $set: {
                ratePerKm: rate,
                minimumPayout: minPay,
                maximumPayout: maxPay,
                description: description || existingGlobal.description,
                updatedAt: new Date(),
              },
            }
          );
          try {
            this.trackingGateway?.server?.emit('payout_rate_updated', { scope: 'GLOBAL', ratePerKm: rate });
          } catch (_) {}
          return { success: true, message: 'Global default rate updated successfully', id: existingGlobal._id.toString() };
        }
      } else if (cleanScope === 'CITY') {
        if (!cityId && !cityName) {
          return { success: false, error: 'City is required for CITY scope' };
        }
        const existingCity = await db.collection('rider_payout_rates').findOne({
          scope: 'CITY',
          $or: [
            cityId && Types.ObjectId.isValid(cityId) ? { cityId: new Types.ObjectId(cityId) } : null,
            cityName ? { cityName: cityName.trim() } : null,
          ].filter(Boolean) as any,
        });
        if (existingCity) {
          return { success: false, error: `A city-wide rate for ${cityName} already exists` };
        }
      } else if (cleanScope === 'AREA') {
        if ((!areaId && !areaName) || (!cityId && !cityName)) {
          return { success: false, error: 'Both City and Area are required for AREA scope' };
        }
        const existingArea = await db.collection('rider_payout_rates').findOne({
          scope: 'AREA',
          $or: [
            areaId && Types.ObjectId.isValid(areaId) ? { areaId: new Types.ObjectId(areaId) } : null,
            areaName ? { areaName: areaName.trim() } : null,
          ].filter(Boolean) as any,
        });
        if (existingArea) {
          return { success: false, error: `An area override for ${areaName} already exists` };
        }
      }

      const newDoc = {
        scope: cleanScope,
        cityId: cityId && Types.ObjectId.isValid(cityId) ? new Types.ObjectId(cityId) : null,
        cityName: cityName ? cityName.trim() : null,
        areaId: areaId && Types.ObjectId.isValid(areaId) ? new Types.ObjectId(areaId) : null,
        areaName: areaName ? areaName.trim() : null,
        ratePerKm: rate,
        minimumPayout: minPay,
        maximumPayout: maxPay,
        isActive: true,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        description: description ? description.trim() : '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('rider_payout_rates').insertOne(newDoc);
      try {
        this.trackingGateway?.server?.emit('payout_rate_updated', { ...newDoc, id: result.insertedId.toString() });
      } catch (_) {}

      return {
        success: true,
        message: 'Payout rate created successfully',
        id: result.insertedId.toString(),
        data: { ...newDoc, id: result.insertedId.toString() },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Patch(['api/admin/payout-rates/:id', 'admin/payout-rates/:id', 'api/v1/admin/payout-rates/:id'])
  @Put(['api/admin/payout-rates/:id', 'admin/payout-rates/:id', 'api/v1/admin/payout-rates/:id'])
  async updatePayoutRate(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    try {
      const db = this.db;
      const updates: any = {};
      if (body.ratePerKm !== undefined) updates.ratePerKm = Number(body.ratePerKm);
      if (body.minimumPayout !== undefined) updates.minimumPayout = Number(body.minimumPayout);
      if (body.maximumPayout !== undefined) updates.maximumPayout = Number(body.maximumPayout);
      if (body.description !== undefined) updates.description = body.description.trim();
      if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
      updates.updatedAt = new Date();

      let query: any;
      if (id === 'global_default' || body.scope === 'GLOBAL') {
        query = { scope: 'GLOBAL' };
      } else {
        query = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
      }

      await db.collection('rider_payout_rates').updateOne(query, { $set: updates });
      try {
        this.trackingGateway?.server?.emit('payout_rate_updated', { id, ...updates });
      } catch (_) {}

      return { success: true, message: 'Payout rate updated successfully' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Patch(['api/admin/payout-rates/:id/toggle', 'admin/payout-rates/:id/toggle', 'api/v1/admin/payout-rates/:id/toggle'])
  async togglePayoutRate(@Param('id') id: string) {
    try {
      const db = this.db;
      const query: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
      const current = await db.collection('rider_payout_rates').findOne(query);

      if (!current) {
        return { success: false, error: 'Payout rate not found' };
      }

      const nextState = !current.isActive;
      await db.collection('rider_payout_rates').updateOne(query, {
        $set: { isActive: nextState, updatedAt: new Date() },
      });
      try {
        this.trackingGateway?.server?.emit('payout_rate_updated', { id, isActive: nextState });
      } catch (_) {}

      return { success: true, isActive: nextState, message: `Payout rate ${nextState ? 'activated' : 'paused'}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Delete(['api/admin/payout-rates/:id', 'admin/payout-rates/:id', 'api/v1/admin/payout-rates/:id'])
  async deletePayoutRate(@Param('id') id: string) {
    try {
      const db = this.db;
      const query: any = Types.ObjectId.isValid(id) ? { _id: new Types.ObjectId(id) } : { _id: id };
      const rate = await db.collection('rider_payout_rates').findOne(query);

      if (!rate) {
        return { success: false, error: 'Payout rate not found' };
      }

      if (rate.scope === 'GLOBAL') {
        return {
          success: false,
          error: 'Cannot delete the Global default payout rate. You can edit its values instead.',
        };
      }

      await db.collection('rider_payout_rates').deleteOne(query);
      try {
        this.trackingGateway?.server?.emit('payout_rate_updated', { id, deleted: true });
      } catch (_) {}

      return { success: true, message: 'Payout rate deleted successfully' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * =========================================================================
   * FINANCE & WALLETS LEDGER (Dark Stores, Riders, Platform Revenue)
   * =========================================================================
   */

  @Get(['api/finance/wallets/summary', 'finance/wallets/summary', 'api/v1/finance/wallets/summary'])
  async getWalletsSummary() {
    try {
      const db = this.db;
      const [stores, riders, orders] = await Promise.all([
        db.collection('stores').find({}).toArray(),
        db.collection('delivery_partners').find({}).toArray(),
        db.collection('orders').find({}).toArray(),
      ]);

      const totalStoreGross = stores.reduce((sum: number, s: any) => sum + (s.totalEarned || s.walletBalance || s.balance || 0), 0);
      const totalStoreBalance = stores.reduce((sum: number, s: any) => sum + (s.walletBalance || s.balance || 0), 0);
      const totalStoreCommission = stores.reduce((sum: number, s: any) => sum + (s.totalCommission || 0), 0);

      const totalRiderBalance = riders.reduce((sum: number, r: any) => sum + (r.balance || r.walletBalance || 0), 0);
      const totalRiderLifetime = riders.reduce((sum: number, r: any) => sum + (r.lifetimeEarnings || r.totalEarnings || 0), 0);
      const totalRiderTips = riders.reduce((sum: number, r: any) => sum + (r.todayTip || 0), 0);
      const totalRiderBasePay = riders.reduce((sum: number, r: any) => sum + (r.todayBasePay || 0), 0);

      const ordersTotalAmount = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || o.total || 0), 0);
      const handlingFees = orders.reduce((sum: number, o: any) => sum + (o.handlingFee || o.convenienceFee || 5), 0);
      const commissions = Math.round(ordersTotalAmount * 0.18);
      const totalRevenue = handlingFees + commissions;
      const netProfit = Math.round(totalRevenue * 0.75);

      return {
        success: true,
        data: {
          stores: {
            count: stores.length,
            totalBalance: totalStoreBalance,
            totalGross: totalStoreGross,
            totalCommission: totalStoreCommission,
          },
          riders: {
            count: riders.length,
            totalBalance: totalRiderBalance,
            totalLifetime: totalRiderLifetime,
            totalTips: totalRiderTips,
            totalBasePay: totalRiderBasePay,
          },
          platform: {
            handlingFees,
            commissions,
            totalRevenue,
            netProfit,
          },
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get(['api/finance/wallets/stores', 'finance/wallets/stores', 'api/v1/finance/wallets/stores'])
  async getStoreWallets() {
    try {
      const db = this.db;
      const stores = await db.collection('stores').find({}).toArray();

      const data = stores.map((s: any) => {
        const id = s._id.toString();
        const code = s.code || `DS-${id.slice(-4).toUpperCase()}`;
        const cityName = s.cityName || s.city || 'Ahmedabad';
        const area = s.areaName || s.address || 'Ahmedabad';
        const balance = s.walletBalance ?? s.balance ?? 0;
        const totalEarned = s.totalEarned ?? Math.round(balance * 1.25);
        const commissionRate = s.commissionRate || 18;
        const totalCommission = s.totalCommission ?? Math.round(totalEarned * (commissionRate / 100));

        return {
          storeId: id,
          storeName: s.name,
          code,
          cityName,
          city: cityName,
          area,
          balance,
          pendingBalance: s.pendingBalance || 0,
          totalEarned,
          totalCommission,
          commissionRate,
          settlementCycle: s.settlementCycle || 'WEEKLY_NEFT',
          lastSettlementAt: s.lastSettlementAt || null,
          bankAccount: s.bankAccount || {
            bankName: s.bankName || 'HDFC Bank Ltd',
            accountNumber: s.bankAccountNumber || (s.phone ? `•••• •••• ${s.phone.slice(-4)}` : '•••• •••• 4820'),
            ifsc: s.bankIfsc || 'HDFC0001024',
            verified: true,
          },
          isActive: s.status === 'ACTIVE' || s.isActive !== false,
        };
      });

      return { success: true, count: data.length, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get(['api/finance/wallets/riders', 'finance/wallets/riders', 'api/v1/finance/wallets/riders'])
  async getRiderWallets() {
    try {
      const db = this.db;
      const riders = await db.collection('delivery_partners').find({}).toArray();

      const data = riders.map((r: any) => {
        const id = r._id.toString();
        const partnerCode = r.partnerCode || `RDR-${id.slice(-4).toUpperCase()}`;
        const name = r.name || r.fullName || 'Rider Partner';
        const phone = r.phone || r.phoneNumber || '';
        const cod = r.totalCodCollected ?? r.codPending ?? 0;
        const online = r.totalOnlineEarnings ?? r.totalEarnings ?? r.balance ?? 0;
        const net = (r.netBalance !== undefined) ? r.netBalance : (cod - online);
        const limit = r.outstandingCashLimit || 500;
        const isBlocked = r.isBlocked || r.isOrderBlocked || net >= limit;

        return {
          riderId: id,
          partnerCode,
          name,
          riderName: name,
          phone,
          phoneNumber: phone,
          vehicleNumber: r.vehicleNumber || 'GJ-01-XX-0000',
          balance: r.balance || r.walletBalance || online,
          lifetimeEarnings: r.lifetimeEarnings || r.totalEarnings || online,
          codPending: cod,
          totalOrders: r.totalOrders || r.totalDeliveries || 0,
          totalDeliveries: r.totalDeliveries || r.totalOrders || 0,
          completedDeliveries: r.completedDeliveries || r.totalDeliveries || 0,
          totalCodCollected: cod,
          totalOnlineEarnings: online,
          totalEarnings: online,
          netBalance: net,
          outstandingCashLimit: limit,
          isBlocked,
          isOrderBlocked: isBlocked,
          riderOwesAdmin: Math.max(0, net),
          adminOwesRider: Math.max(0, -net),
          settlementType: net >= 0 ? 'COLLECT_FROM_RIDER' : 'PAY_TO_RIDER',
          settlementCycle: 'DAILY_IMPS',
          lastSettlementAt: r.lastSettlementAt || null,
          bankAccount: r.bankAccount || {
            bankName: r.bankName || 'State Bank of India',
            accountNumber: r.bankAccountNumber || (phone ? `•••• •••• ${phone.slice(-4)}` : '•••• •••• 2840'),
            ifsc: r.bankIfsc || 'SBIN0004921',
            verified: true,
          },
          todaySettlement: {
            basePay: r.todayBasePay || 0,
            tip: r.todayTip || 0,
            incentive: r.todayIncentive || 0,
            total: (r.todayBasePay || 0) + (r.todayTip || 0) + (r.todayIncentive || 0),
          },
          isActive: r.status === 'ACTIVE' || r.isActive !== false,
        };
      });

      return { success: true, count: data.length, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get(['api/finance/wallets/platform', 'finance/wallets/platform', 'api/v1/finance/wallets/platform'])
  async getPlatformWallet() {
    try {
      const db = this.db;
      const orders = await db.collection('orders').find({}).toArray();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders.filter((o: any) => new Date(o.createdAt || Date.now()) >= today);

      const todayGross = todayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || o.total || 0), 0);
      const todayHandling = todayOrders.reduce((sum: number, o: any) => sum + (o.handlingFee || o.convenienceFee || 5), 0);
      const todayCommission = Math.round(todayGross * 0.18);
      const todayRevenue = todayHandling + todayCommission;

      const lifetimeGross = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || o.total || 0), 0);
      const handlingFees = orders.reduce((sum: number, o: any) => sum + (o.handlingFee || o.convenienceFee || 5), 0);
      const commissions = Math.round(lifetimeGross * 0.18);
      const totalRevenue = handlingFees + commissions;
      const netProfit = Math.round(totalRevenue * 0.75);

      return {
        success: true,
        data: {
          todayRevenue,
          todayHandling,
          todayCommission,
          todayOrdersCount: todayOrders.length,
          lifetime: {
            totalRevenue,
            handlingFees,
            commissions,
            netProfit,
          },
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get(['api/finance/wallets/transactions', 'finance/wallets/transactions', 'api/v1/finance/wallets/transactions'])
  async getWalletTransactions(@Query() query: any) {
    try {
      const db = this.db;
      const limit = Number(query.limit) || 50;

      const filter: any = {};
      if (query.walletType && query.walletType !== 'ALL') {
        filter.walletType = query.walletType;
      }

      const txs = await db.collection('wallet_transactions').find(filter).sort({ createdAt: -1 }).limit(limit).toArray();

      if (txs.length > 0) {
        const formatted = txs.map((tx: any) => ({
          id: tx._id.toString(),
          walletType: tx.walletType,
          walletId: tx.walletId,
          orderId: tx.orderId || null,
          orderNumber: tx.orderNumber || null,
          title: tx.title || 'Settlement Transaction',
          party: tx.party || 'Platform Party',
          amount: tx.amount || 0,
          direction: tx.direction || (tx.type === 'DEBIT' ? 'DEBIT' : 'CREDIT'),
          method: tx.method || 'Bank NEFT',
          status: tx.status || 'SETTLED',
          time: tx.time || (tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'),
          createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
        }));
        return { success: true, count: formatted.length, data: formatted };
      }

      // If no explicit settlements logged yet, derive real audit entries from recent live orders
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(limit).toArray();
      const derived: any[] = [];

      for (const order of orders) {
        const gross = order.totalAmount || order.total || 0;
        if (gross <= 0) continue;
        const storeCut = Math.round(gross * 0.82);
        const platformCut = Math.round(gross * 0.18);
        const orderNum = order.orderNumber || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'ORD');
        const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

        derived.push({
          id: `TXN-ST-${orderNum}`,
          walletType: 'STORE',
          walletId: order.storeId || 'store_hub',
          orderId: order._id?.toString(),
          orderNumber: orderNum,
          title: 'Store Gross Credit',
          party: order.darkStore || order.storeName || 'Dark Store Hub',
          amount: storeCut,
          direction: 'CREDIT',
          method: order.paymentMethod || 'Online Pay',
          status: 'SETTLED',
          time: timeStr,
          createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
        });

        derived.push({
          id: `TXN-PF-${orderNum}`,
          walletType: 'PLATFORM',
          walletId: 'platform_treasury',
          orderId: order._id?.toString(),
          orderNumber: orderNum,
          title: 'Platform Fee (18%)',
          party: 'Platform Treasury',
          amount: platformCut,
          direction: 'CREDIT',
          method: 'Order Auto-Split',
          status: 'SETTLED',
          time: timeStr,
          createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
        });
      }

      return { success: true, count: derived.length, data: derived };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post(['api/finance/wallets/settle-store', 'finance/wallets/settle-store', 'api/v1/finance/wallets/settle-store'])
  async settleStoreWallet(@Body() body: any) {
    try {
      const db = this.db;
      const { storeId, amount, referenceNotes } = body;
      const settleAmount = Number(amount) || 0;

      let query: any = { _id: storeId };
      if (Types.ObjectId.isValid(storeId)) {
        query = { _id: new Types.ObjectId(storeId) };
      }

      const store = await db.collection('stores').findOne(query);
      if (!store) {
        return { success: false, error: 'Store not found' };
      }

      const currentBalance = store.walletBalance ?? store.balance ?? 0;
      const newBalance = Math.max(0, currentBalance - settleAmount);

      await db.collection('stores').updateOne(query, {
        $set: {
          walletBalance: newBalance,
          balance: newBalance,
          lastSettlementAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      const txRecord = {
        walletType: 'STORE',
        walletId: storeId,
        party: store.name,
        title: 'Store Settlement Payout',
        amount: settleAmount,
        direction: 'DEBIT',
        method: 'Bank NEFT',
        status: 'SETTLED',
        time: 'Just now',
        notes: referenceNotes || 'Weekly NEFT settlement',
        createdAt: new Date().toISOString(),
      };
      await db.collection('wallet_transactions').insertOne(txRecord);

      return {
        success: true,
        message: `Settled ₹${settleAmount} for ${store.name}`,
        newBalance,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post(['api/finance/wallets/settle-rider', 'finance/wallets/settle-rider', 'api/v1/finance/wallets/settle-rider'])
  async settleRiderWallet(@Body() body: any) {
    try {
      const db = this.db;
      const { riderId, amount, referenceNotes, actionType } = body;
      const settleAmount = Number(amount) || 0;

      let query: any = { _id: riderId };
      if (Types.ObjectId.isValid(riderId)) {
        query = { _id: new Types.ObjectId(riderId) };
      }

      const rider = await db.collection('delivery_partners').findOne(query);
      if (!rider) {
        return { success: false, error: 'Rider not found' };
      }

      const currentCod = rider.totalCodCollected ?? 0;
      const newCod = (actionType === 'COLLECT_FROM_RIDER') ? Math.max(0, currentCod - settleAmount) : currentCod;
      const currentOnline = rider.totalOnlineEarnings ?? 0;
      const newOnline = (actionType === 'PAY_TO_RIDER') ? Math.max(0, currentOnline - settleAmount) : currentOnline;
      const newNet = newCod - newOnline;
      const isBlocked = newNet >= (rider.outstandingCashLimit || 500);

      await db.collection('delivery_partners').updateOne(query, {
        $set: {
          totalCodCollected: newCod,
          totalOnlineEarnings: newOnline,
          netBalance: newNet,
          isBlocked,
          isOrderBlocked: isBlocked,
          lastSettlementAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      const txRecord = {
        walletType: 'RIDER',
        walletId: riderId,
        party: rider.name || rider.fullName || 'Rider',
        title: actionType === 'COLLECT_FROM_RIDER' ? 'Rider Cash Settlement Collection' : 'Rider Earnings Payout',
        amount: settleAmount,
        direction: actionType === 'COLLECT_FROM_RIDER' ? 'CREDIT' : 'DEBIT',
        method: 'Instant IMPS',
        status: 'SETTLED',
        time: 'Just now',
        notes: referenceNotes || 'Ledger Net Settlement',
        createdAt: new Date().toISOString(),
      };
      await db.collection('wallet_transactions').insertOne(txRecord);

      return {
        success: true,
        message: `Settled ₹${settleAmount} with ${rider.name || 'Rider'}`,
        newBalance: newNet,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get(['api/finance/wallets/riders/:id/ledger', 'finance/wallets/riders/:id/ledger', 'api/v1/finance/wallets/riders/:id/ledger'])
  async getRiderLedger(@Param('id') riderId: string) {
    try {
      const db = this.db;
      let query: any = { _id: riderId };
      if (Types.ObjectId.isValid(riderId)) {
        query = { _id: new Types.ObjectId(riderId) };
      }

      const rider = await db.collection('delivery_partners').findOne(query);
      const orders = await db
        .collection('orders')
        .find({
          $or: [{ deliveryPartnerId: riderId }, { riderId: riderId }],
        })
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray();

      const ledgerEntries = orders.map((o: any) => ({
        id: o._id.toString(),
        orderNumber: o.orderNumber || o._id.toString().slice(-6).toUpperCase(),
        totalAmount: o.totalAmount || o.total || 0,
        paymentMethod: o.paymentMethod || 'COD',
        codCollected: (o.paymentMethod === 'COD' || o.paymentMethod === 'CASH') ? (o.totalAmount || o.total || 0) : 0,
        riderEarning: o.deliveryFee || 25,
        status: o.status || 'Delivered',
        date: o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Recent',
      }));

      return {
        success: true,
        partner: rider ? {
          id: rider._id.toString(),
          name: rider.name || rider.fullName,
          phone: rider.phone,
          netBalance: rider.netBalance || 0,
          isBlocked: rider.isBlocked || false,
        } : null,
        data: ledgerEntries,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get(['api/finance/settlements/requests', 'finance/settlements/requests', 'api/v1/finance/settlements/requests'])
  async getRiderSettlementRequests(@Query('status') status?: string) {
    try {
      const db = this.db;
      const query: any = {};
      if (status && status !== 'ALL') {
        query.status = status;
      }

      const requests = await db
        .collection('rider_settlement_requests')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return {
        success: true,
        count: requests.length,
        data: requests.map((r: any) => ({
          id: r._id.toString(),
          ...r,
          _id: r._id.toString(),
        })),
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post(['api/finance/settlements/requests/:id/approve', 'finance/settlements/requests/:id/approve', 'api/v1/finance/settlements/requests/:id/approve'])
  async approveRiderSettlementRequest(@Param('id') requestId: string, @Body() body: any) {
    try {
      const db = this.db;
      let q: any = { _id: requestId };
      if (Types.ObjectId.isValid(requestId)) q = { _id: new Types.ObjectId(requestId) };

      const req = await db.collection('rider_settlement_requests').findOne(q);
      if (!req) return { success: false, error: 'Request not found' };

      await db.collection('rider_settlement_requests').updateOne(q, {
        $set: {
          status: 'APPROVED',
          adminRemarks: body.adminRemarks || 'Settlement verified and approved',
          approvedAt: new Date().toISOString(),
        },
      });

      // Update rider COD collected
      if (req.riderId) {
        let riderQuery: any = { _id: req.riderId };
        if (Types.ObjectId.isValid(req.riderId)) riderQuery = { _id: new Types.ObjectId(req.riderId) };

        const rider = await db.collection('delivery_partners').findOne(riderQuery);
        if (rider) {
          const currentCod = rider.totalCodCollected || 0;
          const newCod = Math.max(0, currentCod - (req.amount || 0));
          const net = newCod - (rider.totalOnlineEarnings || 0);
          const isBlocked = net >= (rider.outstandingCashLimit || 500);

          await db.collection('delivery_partners').updateOne(riderQuery, {
            $set: {
              totalCodCollected: newCod,
              netBalance: net,
              isBlocked,
              isOrderBlocked: isBlocked,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      }

      return { success: true, message: 'Settlement approved and rider unblocked' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post(['api/finance/settlements/requests/:id/reject', 'finance/settlements/requests/:id/reject', 'api/v1/finance/settlements/requests/:id/reject'])
  async rejectRiderSettlementRequest(@Param('id') requestId: string, @Body() body: any) {
    try {
      const db = this.db;
      let q: any = { _id: requestId };
      if (Types.ObjectId.isValid(requestId)) q = { _id: new Types.ObjectId(requestId) };

      await db.collection('rider_settlement_requests').updateOne(q, {
        $set: {
          status: 'REJECTED',
          rejectionReason: body.reason || 'Payment not verified',
          rejectedAt: new Date().toISOString(),
        },
      });

      return { success: true, message: 'Settlement request rejected' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Get(['api/finance/settings/upi', 'finance/settings/upi', 'api/v1/finance/settings/upi'])
  async getCompanyUpiSettings() {
    try {
      const db = this.db;
      const setting = await db.collection('system_settings').findOne({ settingKey: 'company_upi' });

      if (setting && setting.data) {
        return { success: true, data: setting.data };
      }

      return {
        success: true,
        data: {
          adminUpiId: 'wormup@okicici',
          adminUpiName: 'Womup Technologies Pvt Ltd',
          supportPhone: '+91 98765 43210',
          qrCodeUrl: '',
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post(['api/finance/settings/upi', 'finance/settings/upi', 'api/v1/finance/settings/upi'])
  async updateCompanyUpiSettings(@Body() body: any) {
    try {
      const db = this.db;
      const data = {
        adminUpiId: body.adminUpiId,
        adminUpiName: body.adminUpiName || 'Womup Technologies Pvt Ltd',
        supportPhone: body.supportPhone || '+91 98765 43210',
        qrCodeUrl: body.qrCodeUrl || '',
        updatedAt: new Date().toISOString(),
      };

      await db.collection('system_settings').updateOne(
        { settingKey: 'company_upi' },
        { $set: { settingKey: 'company_upi', data } },
        { upsert: true }
      );

      return { success: true, message: 'Company UPI settings saved successfully', data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // =========================================================================
  // STORE MANUAL UPI SETTLEMENTS (STORE <-> ADMIN)
  // =========================================================================
  @Get([
    'api/finance/store-settlements',
    'finance/store-settlements',
    'api/v1/admin/store-settlements',
    'admin/store-settlements',
  ])
  async getStoreSettlementRequests(
    @Query('status') status?: string,
    @Query('storeId') storeId?: string,
  ) {
    try {
      const db = this.db;
      const query: any = {};
      if (status && status !== 'ALL') {
        query.status = status;
      }
      if (storeId) {
        if (Types.ObjectId.isValid(storeId)) {
          query.$or = [{ storeId: new Types.ObjectId(storeId) }, { storeCode: storeId }];
        } else {
          query.storeCode = storeId;
        }
      }

      const requests = await db
        .collection('store_settlement_requests')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return {
        success: true,
        count: requests.length,
        data: requests.map((r: any) => ({
          id: r._id.toString(),
          ...r,
          _id: r._id.toString(),
        })),
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post([
    'api/finance/store-settlements/:id/approve',
    'finance/store-settlements/:id/approve',
    'api/v1/admin/store-settlements/:id/approve',
    'admin/store-settlements/:id/approve',
  ])
  @Patch([
    'api/finance/store-settlements/:id/approve',
    'api/v1/admin/store-settlements/:id/approve',
    'admin/store-settlements/:id/approve',
  ])
  async approveStoreSettlementRequest(@Param('id') requestId: string, @Body() body: any) {
    try {
      const db = this.db;
      let q: any = { _id: requestId };
      if (Types.ObjectId.isValid(requestId)) q = { _id: new Types.ObjectId(requestId) };

      const req = await db.collection('store_settlement_requests').findOne(q);
      if (!req) return { success: false, error: 'Settlement request not found' };

      const approvedAt = new Date();
      await db.collection('store_settlement_requests').updateOne(q, {
        $set: {
          status: 'APPROVED',
          adminRemarks: body.adminRemarks || 'Settlement verified and approved by Admin',
          approvedAt: approvedAt.toISOString(),
        },
      });

      // Update store wallet
      if (req.storeId) {
        let storeQuery: any = { storeId: req.storeId };
        if (Types.ObjectId.isValid(req.storeId)) {
          storeQuery = {
            $or: [{ storeId: new Types.ObjectId(req.storeId) }, { storeId: req.storeId.toString() }],
          };
        }

        const wallet = await db.collection('store_wallets').findOne(storeQuery);
        const currentBalance = Number(wallet?.balance) || 0;
        const currentPaid = Number(wallet?.alreadyPaid) || 0;
        const newBalance = Math.max(0, currentBalance - (req.amount || 0));
        const newPaid = currentPaid + (req.amount || 0);

        await db.collection('store_wallets').updateOne(
          storeQuery,
          {
            $set: {
              balance: newBalance,
              alreadyPaid: newPaid,
              lastSettlementAt: approvedAt,
              updatedAt: approvedAt,
            },
          },
          { upsert: true }
        );

        // Record in ledger
        await db.collection('wallet_transactions').insertOne({
          walletType: 'STORE',
          storeId: req.storeId,
          storeName: req.storeName || 'Dark Store',
          type: 'SETTLEMENT',
          direction: 'CREDIT',
          amount: req.amount,
          utrNumber: req.utrNumber,
          description: `Store settlement approved via UPI (UTR: ${req.utrNumber})`,
          status: 'COMPLETED',
          createdAt: approvedAt,
        });

        // Mark completed orders as SETTLED
        await db.collection('orders').updateMany(
          {
            $or: [
              { storeId: req.storeId },
              { 'store.id': req.storeId.toString() },
              { 'store._id': req.storeId.toString() },
            ],
            status: { $in: ['DELIVERED', 'COMPLETED'] },
            settlementStatus: { $ne: 'SETTLED' },
          },
          {
            $set: {
              settlementStatus: 'SETTLED',
              settledAt: approvedAt,
              settlementUtr: req.utrNumber,
            },
          }
        );
      }

      return {
        success: true,
        message: `Settlement request for ${req.storeName} (₹${req.amount}) approved successfully.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  @Post([
    'api/finance/store-settlements/:id/reject',
    'finance/store-settlements/:id/reject',
    'api/v1/admin/store-settlements/:id/reject',
    'admin/store-settlements/:id/reject',
  ])
  @Patch([
    'api/finance/store-settlements/:id/reject',
    'api/v1/admin/store-settlements/:id/reject',
    'admin/store-settlements/:id/reject',
  ])
  async rejectStoreSettlementRequest(@Param('id') requestId: string, @Body() body: any) {
    try {
      const db = this.db;
      let q: any = { _id: requestId };
      if (Types.ObjectId.isValid(requestId)) q = { _id: new Types.ObjectId(requestId) };

      const rejectedAt = new Date();
      await db.collection('store_settlement_requests').updateOne(q, {
        $set: {
          status: 'REJECTED',
          adminRemarks: body.adminRemarks || body.reason || 'Payment UTR verification failed / Not received in bank account',
          rejectedAt: rejectedAt.toISOString(),
        },
      });

      return { success: true, message: 'Settlement request rejected.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}


