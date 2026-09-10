const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= CATEGORIES =================
router.get('/categories', async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.collection('categories').find({}).sort({ sortOrder: 1 }).toArray();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const db = getDB();
    const { name, slug, image, icon, bgColor, sortOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    const newCat = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      image: image || null,
      icon: icon || 'shopping-bag',
      bgColor: bgColor || '#FCE1F5',
      sortOrder: Number(sortOrder) || 0,
      itemCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('categories').insertOne(newCat);
    res.status(201).json({ success: true, id: result.insertedId, data: newCat });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const body = req.body;
    delete body._id;
    body.updatedAt = new Date();

    await db.collection('categories').updateOne({ _id: new ObjectId(id) }, { $set: body });
    res.json({ success: true, message: 'Category updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= SUBCATEGORIES =================
router.get('/subcategories', async (req, res) => {
  try {
    const db = getDB();
    const { categoryId } = req.query;
    const query = {};
    if (categoryId) query.categoryId = new ObjectId(categoryId);

    const subs = await db.collection('subcategories').find(query).toArray();
    res.json({ success: true, count: subs.length, data: subs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/subcategories', async (req, res) => {
  try {
    const db = getDB();
    const { name, slug, categoryId, icon } = req.body;
    if (!name || !categoryId) return res.status(400).json({ success: false, error: 'Name and categoryId required' });

    const newSub = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: new ObjectId(categoryId),
      icon: icon || 'grid',
      itemCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('subcategories').insertOne(newSub);
    res.status(201).json({ success: true, id: result.insertedId, data: newSub });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= PRODUCTS =================
router.get('/products', async (req, res) => {
  try {
    const db = getDB();
    const { categoryId, search, isDeal, isPopular, isActive } = req.query;

    const query = {};
    if (categoryId) query.categoryId = new ObjectId(categoryId);
    if (isDeal !== undefined) query.isDeal = isDeal === 'true';
    if (isPopular !== undefined) query.isPopular = isPopular === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await db.collection('products').find(query).toArray();
    const variants = await db.collection('product_variants').find({}).toArray();

    const productList = products.map(p => {
      const pVariants = variants.filter(v => v.productId && v.productId.toString() === p._id.toString());
      return {
        ...p,
        id: p._id.toString(),
        variants: pVariants,
      };
    });

    res.json({ success: true, count: productList.length, data: productList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const prodObjId = new ObjectId(id);

    const product = await db.collection('products').findOne({ _id: prodObjId });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const variants = await db.collection('product_variants').find({
      $or: [{ productId: prodObjId }, { productId: id }]
    }).toArray();

    res.json({ success: true, data: { ...product, variants } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const db = getDB();
    const {
      name,
      category,
      brand,
      description,
      imageUrl,
      images,
      cloudinaryPublicId,
      basePrice,
      sellingPrice,
      mrp,
      isActive,
      adminName,
      variants,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }

    // Determine default pricing from variants if variants array provided
    let sPrice = Number(sellingPrice);
    let mPrice = Number(mrp);
    let bPrice = Number(basePrice);

    if (Array.isArray(variants) && variants.length > 0) {
      const defaultVar = variants.find(v => v.isDefault) || variants[0];
      if (isNaN(sPrice) || sPrice <= 0) sPrice = Number(defaultVar.sellingPrice) || 0;
      if (isNaN(mPrice) || mPrice <= 0) mPrice = Number(defaultVar.mrp) || sPrice;
      if (isNaN(bPrice) || bPrice <= 0) bPrice = Number(defaultVar.basePrice) || sPrice;
    } else {
      if (isNaN(sPrice) || isNaN(mPrice)) {
        return res.status(400).json({ success: false, error: 'Selling price and MRP or variants are required' });
      }
      if (isNaN(bPrice) || bPrice <= 0) bPrice = sPrice;
    }

    let resolvedCategoryId = null;
    if (req.body.categoryId && ObjectId.isValid(req.body.categoryId)) {
      resolvedCategoryId = new ObjectId(req.body.categoryId);
    } else if (category) {
      const catDoc = await db.collection('categories').findOne({
        $or: [{ name: category }, { slug: (category || '').toLowerCase() }]
      });
      if (catDoc) resolvedCategoryId = catDoc._id;
    }

    const newProduct = {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      brand: brand || 'Womup Fresh',
      category: category || 'Vegetables',
      categoryId: resolvedCategoryId,
      description: description || '',
      imageUrl: imageUrl || '',
      images: Array.isArray(images) ? images : (imageUrl ? [imageUrl] : []),
      cloudinaryPublicId: cloudinaryPublicId || '',
      basePrice: bPrice,
      sellingPrice: sPrice,
      mrp: mPrice,
      discountPercent,
      stockKg: 100,
      rating: 4.8,
      isActive: isActive !== false,
      priceHistory: [
        {
          id: 'ph_' + Date.now(),
          oldBasePrice: bPrice,
          newBasePrice: bPrice,
          oldSellingPrice: sPrice,
          newSellingPrice: sPrice,
          oldMrp: mPrice,
          newMrp: mPrice,
          changedBy: adminName || 'Admin',
          changedAt: new Date(),
          notes: 'Initial Product Creation',
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('products').insertOne(newProduct);
    const productId = result.insertedId;

    // Insert variants if provided
    let insertedVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      const variantDocs = variants.map((v, idx) => {
        const varMrp = Number(v.mrp) || mPrice;
        const varSp = Number(v.sellingPrice) || sPrice;
        const varDiscount = varMrp > 0 ? Math.round(((varMrp - varSp) / varMrp) * 100) : 0;
        return {
          productId: productId,
          sku: v.sku || `${newProduct.slug}-${(v.weightOrVolume || `v${idx + 1}`).toString().replace(/[^a-z0-9]+/gi, '').toLowerCase()}`,
          weightOrVolume: v.weightOrVolume || '1 unit',
          mrp: varMrp,
          sellingPrice: varSp,
          discountPercent: varDiscount,
          stock: Number(v.stock) || 100,
          isDefault: v.isDefault !== undefined ? !!v.isDefault : idx === 0,
          isActive: v.isActive !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const varResult = await db.collection('product_variants').insertMany(variantDocs);
      insertedVariants = variantDocs.map((doc, idx) => ({
        ...doc,
        _id: varResult.insertedIds[idx],
        id: varResult.insertedIds[idx].toString(),
      }));
    }

    res.status(201).json({
      success: true,
      id: productId,
      data: {
        ...newProduct,
        id: productId.toString(),
        variants: insertedVariants,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const body = req.body;
    delete body._id;
    body.updatedAt = new Date();

    let filter = {};
    if (ObjectId.isValid(id)) filter._id = new ObjectId(id);
    else filter._id = id;

    if (body.categoryId && ObjectId.isValid(body.categoryId)) {
      body.categoryId = new ObjectId(body.categoryId);
    } else if (body.category) {
      const catDoc = await db.collection('categories').findOne({
        $or: [{ name: body.category }, { slug: (body.category || '').toLowerCase() }]
      });
      if (catDoc) body.categoryId = catDoc._id;
    }

    const existing = await db.collection('products').findOne(filter);
    if (existing) {
      const priceChanged =
        (body.sellingPrice !== undefined && Number(body.sellingPrice) !== existing.sellingPrice) ||
        (body.basePrice !== undefined && Number(body.basePrice) !== existing.basePrice) ||
        (body.mrp !== undefined && Number(body.mrp) !== existing.mrp);

      if (priceChanged) {
        const historyEntry = {
          id: 'ph_' + Date.now(),
          oldBasePrice: existing.basePrice || existing.sellingPrice,
          newBasePrice: body.basePrice !== undefined ? Number(body.basePrice) : (existing.basePrice || existing.sellingPrice),
          oldSellingPrice: existing.sellingPrice,
          newSellingPrice: body.sellingPrice !== undefined ? Number(body.sellingPrice) : existing.sellingPrice,
          oldMrp: existing.mrp,
          newMrp: body.mrp !== undefined ? Number(body.mrp) : existing.mrp,
          changedBy: body.adminName || 'Admin',
          changedAt: new Date(),
          notes: 'Admin Price Update',
        };
        await db.collection('products').updateOne(filter, {
          $push: { priceHistory: historyEntry }
        });
      }
    }

    // If variants are provided, update/insert each variant
    if (Array.isArray(body.variants) && body.variants.length > 0) {
      const prodObjId = ObjectId.isValid(id) ? new ObjectId(id) : id;
      for (let idx = 0; idx < body.variants.length; idx++) {
        const v = body.variants[idx];
        const varMrp = Number(v.mrp);
        const varSp = Number(v.sellingPrice);
        const varDiscount = varMrp > 0 ? Math.round(((varMrp - varSp) / varMrp) * 100) : 0;

        if (v.id || v._id) {
          const vId = ObjectId.isValid(v.id || v._id) ? new ObjectId(v.id || v._id) : (v.id || v._id);
          const updateDoc = {
            weightOrVolume: v.weightOrVolume,
            mrp: varMrp,
            sellingPrice: varSp,
            discountPercent: varDiscount,
            isDefault: !!v.isDefault,
            isActive: v.isActive !== false,
            updatedAt: new Date(),
          };
          if (v.sku) updateDoc.sku = v.sku;
          if (v.stock !== undefined) updateDoc.stock = Number(v.stock);

          await db.collection('product_variants').updateOne({ _id: vId }, { $set: updateDoc });
        } else {
          const newVar = {
            productId: prodObjId,
            sku: v.sku || `${existing?.slug || 'sku'}-${(v.weightOrVolume || `v${idx + 1}`).toString().replace(/[^a-z0-9]+/gi, '').toLowerCase()}`,
            weightOrVolume: v.weightOrVolume || '1 unit',
            mrp: varMrp,
            sellingPrice: varSp,
            discountPercent: varDiscount,
            stock: Number(v.stock) || 100,
            isDefault: v.isDefault !== undefined ? !!v.isDefault : idx === 0,
            isActive: v.isActive !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await db.collection('product_variants').insertOne(newVar);
        }
      }
    }

    delete body.variants;
    await db.collection('products').updateOne(filter, { $set: body });
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle status (Active / Inactive)
router.put('/products/:id/status', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { isActive } = req.body;

    let filter = {};
    if (ObjectId.isValid(id)) filter._id = new ObjectId(id);
    else filter._id = id;

    await db.collection('products').updateOne(filter, {
      $set: { isActive: !!isActive, updatedAt: new Date() }
    });
    res.json({ success: true, message: `Product ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let filter = {};
    if (ObjectId.isValid(id)) filter._id = new ObjectId(id);
    else filter._id = id;

    await db.collection('products').deleteOne(filter);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get price history
router.get('/products/:id/price-history', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let filter = {};
    if (ObjectId.isValid(id)) filter._id = new ObjectId(id);
    else filter._id = id;

    const product = await db.collection('products').findOne(filter);
    res.json({ success: true, history: product?.priceHistory || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= PRODUCT VARIANTS =================
router.get('/variants', async (req, res) => {
  try {
    const db = getDB();
    const { productId } = req.query;
    const query = {};
    if (productId) query.productId = new ObjectId(productId);

    const variants = await db.collection('product_variants').find(query).toArray();
    res.json({ success: true, count: variants.length, data: variants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/variants', async (req, res) => {
  try {
    const db = getDB();
    const { productId, sku, weightOrVolume, mrp, sellingPrice, isDefault } = req.body;

    const discountPercent = mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

    const newVariant = {
      productId: new ObjectId(productId),
      sku: sku || `SKU-${Date.now()}`,
      weightOrVolume: weightOrVolume || '1 unit',
      mrp: Number(mrp),
      sellingPrice: Number(sellingPrice),
      discountPercent,
      isDefault: isDefault !== false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('product_variants').insertOne(newVariant);
    res.status(201).json({ success: true, id: result.insertedId, data: newVariant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
