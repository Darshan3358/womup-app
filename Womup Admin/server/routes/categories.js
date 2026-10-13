const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= CATEGORIES MANAGEMENT =================

// 1. GET ALL CATEGORIES WITH LIVE STATS
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const categories = await db
      .collection('categories')
      .find({})
      .sort({ sortOrder: 1, name: 1 })
      .toArray();

    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const catId = cat._id;
        const catIdStr = cat._id.toString();

        // 1. Count products assigned to this category
        const productCount = await db.collection('products').countDocuments({
          $or: [
            { categoryId: catId },
            { categoryId: catIdStr },
            { category: cat.name },
            { categorySlug: cat.slug },
          ],
        });

        // 2. Fetch sub-categories
        const subCats = await db
          .collection('subcategories')
          .find({
            $or: [{ categoryId: catId }, { categoryId: catIdStr }],
          })
          .sort({ sortOrder: 1, name: 1 })
          .toArray();

        // Enrich subcategories with individual product counts if available
        const enrichedSubs = await Promise.all(
          subCats.map(async (sub) => {
            const subId = sub._id;
            const subProductCount = await db.collection('products').countDocuments({
              $or: [
                { subCategoryId: subId },
                { subCategoryId: subId.toString() },
                { subCategory: sub.name },
              ],
            });
            return {
              id: sub._id.toString(),
              _id: sub._id,
              name: sub.name,
              slug: sub.slug,
              icon: sub.icon || 'grid',
              defaultShelfAisle: sub.defaultShelfAisle || '',
              sortOrder: sub.sortOrder || 0,
              displayOrder: sub.sortOrder || 0,
              itemCount: subProductCount,
              productCount: subProductCount,
              isActive: sub.isActive !== false,
            };
          })
        );

        return {
          id: cat._id.toString(),
          _id: cat._id,
          name: cat.name,
          code: cat.code || cat.slug?.toUpperCase().replace(/-/g, '_') || 'CAT',
          slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          icon: cat.icon || 'shopping-bag',
          image: cat.image || null,
          bgColor: cat.bgColor || '#FCE1F5',
          description: cat.description || '',
          sortOrder: cat.sortOrder || 0,
          displayOrder: cat.sortOrder || 0,
          productCount,
          subCategoryCount: enrichedSubs.length,
          subCategories: enrichedSubs,
          isActive: cat.isActive !== false,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET SINGLE CATEGORY WITH STATS
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { slug: id }, { code: id }] };
    } else {
      query = { $or: [{ slug: id }, { code: id }] };
    }

    const cat = await db.collection('categories').findOne(query);
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const catId = cat._id;
    const catIdStr = cat._id.toString();

    const productCount = await db.collection('products').countDocuments({
      $or: [
        { categoryId: catId },
        { categoryId: catIdStr },
        { category: cat.name },
        { categorySlug: cat.slug },
      ],
    });

    const subCats = await db
      .collection('subcategories')
      .find({
        $or: [{ categoryId: catId }, { categoryId: catIdStr }],
      })
      .sort({ sortOrder: 1, name: 1 })
      .toArray();

    const enrichedSubs = subCats.map((sub) => ({
      id: sub._id.toString(),
      _id: sub._id,
      name: sub.name,
      slug: sub.slug,
      icon: sub.icon || 'grid',
      defaultShelfAisle: sub.defaultShelfAisle || '',
      sortOrder: sub.sortOrder || 0,
      isActive: sub.isActive !== false,
    }));

    res.json({
      success: true,
      data: {
        id: cat._id.toString(),
        _id: cat._id,
        name: cat.name,
        code: cat.code || cat.slug?.toUpperCase().replace(/-/g, '_'),
        slug: cat.slug,
        icon: cat.icon || 'shopping-bag',
        image: cat.image || null,
        bgColor: cat.bgColor || '#FCE1F5',
        description: cat.description || '',
        sortOrder: cat.sortOrder || 0,
        displayOrder: cat.sortOrder || 0,
        productCount,
        subCategoryCount: enrichedSubs.length,
        subCategories: enrichedSubs,
        isActive: cat.isActive !== false,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. CREATE NEW CATEGORY
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { name, code, slug, icon, image, bgColor, sortOrder, displayOrder, description, isActive } =
      req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category Name is required' });
    }

    const trimmedName = name.trim();
    const cleanSlug = (slug || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
    const cleanCode = (code || cleanSlug.toUpperCase().replace(/-/g, '_')).trim();

    // Check code / slug uniqueness
    const existing = await db.collection('categories').findOne({
      $or: [{ code: cleanCode }, { slug: cleanSlug }, { name: trimmedName }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Category with code "${cleanCode}" or name "${trimmedName}" already exists.`,
      });
    }

    // Auto sort order if not given
    let finalSortOrder = Number(sortOrder ?? displayOrder);
    if (isNaN(finalSortOrder)) {
      const maxCat = await db.collection('categories').find({}).sort({ sortOrder: -1 }).limit(1).toArray();
      finalSortOrder = maxCat.length > 0 ? (maxCat[0].sortOrder || 0) + 1 : 1;
    }

    const newCategory = {
      name: trimmedName,
      code: cleanCode,
      slug: cleanSlug,
      icon: icon || 'shopping-bag',
      image: image || null,
      bgColor: bgColor || '#EEF9F3',
      description: description?.trim() || '',
      sortOrder: finalSortOrder,
      isActive: isActive !== false,
      itemCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('categories').insertOne(newCategory);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: result.insertedId.toString(),
        _id: result.insertedId,
        ...newCategory,
        productCount: 0,
        subCategoryCount: 0,
        subCategories: [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. UPDATE CATEGORY (Support both PATCH and PUT)
const handleUpdateCategory = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const updates = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Category ID' });
    }

    const cat = await db.collection('categories').findOne({ _id: new ObjectId(id) });
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const fieldsToSet = {};
    if (updates.name !== undefined) fieldsToSet.name = updates.name.trim();
    if (updates.slug !== undefined) fieldsToSet.slug = updates.slug.trim();
    if (updates.icon !== undefined) fieldsToSet.icon = updates.icon;
    if (updates.image !== undefined) {
      fieldsToSet.image = updates.image;
      fieldsToSet.imageUrl = updates.image;
    }
    if (updates.imageUrl !== undefined) {
      fieldsToSet.image = updates.imageUrl;
      fieldsToSet.imageUrl = updates.imageUrl;
    }
    if (updates.bgColor !== undefined) fieldsToSet.bgColor = updates.bgColor;
    if (updates.description !== undefined) fieldsToSet.description = updates.description.trim();
    if (updates.sortOrder !== undefined || updates.displayOrder !== undefined) {
      fieldsToSet.sortOrder = Number(updates.sortOrder ?? updates.displayOrder);
    }
    if (updates.isActive !== undefined) fieldsToSet.isActive = Boolean(updates.isActive);
    fieldsToSet.updatedAt = new Date();

    await db.collection('categories').updateOne({ _id: new ObjectId(id) }, { $set: fieldsToSet });

    const updated = await db.collection('categories').findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: updated._id.toString(),
        _id: updated._id,
        ...updated,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

router.patch('/:id', handleUpdateCategory);
router.put('/:id', handleUpdateCategory);

// 5. TOGGLE ACTIVE/INACTIVE STATUS
router.patch('/:id/status', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { isActive } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Category ID' });
    }

    const cat = await db.collection('categories').findOne({ _id: new ObjectId(id) });
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const newStatus = isActive !== undefined ? Boolean(isActive) : !cat.isActive;

    await db.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: newStatus, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { id: cat._id.toString(), isActive: newStatus },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. DELETE CATEGORY (SAFE DELETION — ONLY IF 0 PRODUCTS)
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Category ID' });
    }

    const cat = await db.collection('categories').findOne({ _id: new ObjectId(id) });
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Safety check: verify product assignment
    const productCount = await db.collection('products').countDocuments({
      $or: [
        { categoryId: cat._id },
        { categoryId: cat._id.toString() },
        { category: cat.name },
        { categorySlug: cat.slug },
      ],
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete "${cat.name}". It has ${productCount} products assigned. Move or delete those products first, or use Deactivate instead.`,
      });
    }

    // Delete child subcategories
    await db.collection('subcategories').deleteMany({
      $or: [{ categoryId: cat._id }, { categoryId: cat._id.toString() }],
    });

    // Delete category
    await db.collection('categories').deleteOne({ _id: cat._id });

    res.json({
      success: true,
      message: `Category "${cat.name}" permanently deleted successfully.`,
      data: { id: cat._id.toString() },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= SUBCATEGORIES MANAGEMENT =================

// 7. GET SUBCATEGORIES FOR A CATEGORY
router.get('/:id/subcategories', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    const query = {};
    if (ObjectId.isValid(id)) {
      query.$or = [{ categoryId: new ObjectId(id) }, { categoryId: id }];
    } else {
      query.categoryId = id;
    }

    const subs = await db.collection('subcategories').find(query).sort({ sortOrder: 1, name: 1 }).toArray();

    const enriched = await Promise.all(
      subs.map(async (s) => {
        const productCount = await db.collection('products').countDocuments({
          $or: [{ subCategoryId: s._id }, { subCategoryId: s._id.toString() }, { subCategory: s.name }],
        });
        return {
          id: s._id.toString(),
          _id: s._id,
          name: s.name,
          slug: s.slug,
          icon: s.icon || 'grid',
          defaultShelfAisle: s.defaultShelfAisle || '',
          sortOrder: s.sortOrder || 0,
          displayOrder: s.sortOrder || 0,
          productCount,
          isActive: s.isActive !== false,
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. ADD SUBCATEGORY
router.post('/:id/subcategories', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { name, slug, icon, defaultShelfAisle, sortOrder, displayOrder, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Sub-Category Name is required' });
    }

    let catQuery = {};
    if (ObjectId.isValid(id)) {
      catQuery = { $or: [{ _id: new ObjectId(id) }, { slug: id }] };
    } else {
      catQuery = { slug: id };
    }

    const cat = await db.collection('categories').findOne(catQuery);
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Parent Category not found' });
    }

    const trimmedName = name.trim();
    const cleanSlug = (slug || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');

    // Check duplicate in this category
    const existing = await db.collection('subcategories').findOne({
      categoryId: cat._id,
      $or: [{ name: trimmedName }, { slug: cleanSlug }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Sub-category "${trimmedName}" already exists under ${cat.name}.`,
      });
    }

    let finalOrder = Number(sortOrder ?? displayOrder);
    if (isNaN(finalOrder)) {
      const maxSub = await db
        .collection('subcategories')
        .find({ categoryId: cat._id })
        .sort({ sortOrder: -1 })
        .limit(1)
        .toArray();
      finalOrder = maxSub.length > 0 ? (maxSub[0].sortOrder || 0) + 1 : 1;
    }

    const newSub = {
      categoryId: cat._id,
      name: trimmedName,
      slug: cleanSlug,
      icon: icon || 'grid',
      defaultShelfAisle: defaultShelfAisle?.trim() || '',
      sortOrder: finalOrder,
      itemCount: 0,
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('subcategories').insertOne(newSub);

    res.status(201).json({
      success: true,
      message: 'Sub-category created successfully',
      data: {
        id: result.insertedId.toString(),
        _id: result.insertedId,
        ...newSub,
        productCount: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. UPDATE SUBCATEGORY
router.patch('/:id/subcategories/:subId', async (req, res) => {
  try {
    const db = getDB();
    const { subId } = req.params;
    const updates = req.body;

    if (!ObjectId.isValid(subId)) {
      return res.status(400).json({ success: false, error: 'Invalid Sub-Category ID' });
    }

    const sub = await db.collection('subcategories').findOne({ _id: new ObjectId(subId) });
    if (!sub) {
      return res.status(404).json({ success: false, error: 'Sub-Category not found' });
    }

    const fieldsToSet = {};
    if (updates.name !== undefined) fieldsToSet.name = updates.name.trim();
    if (updates.slug !== undefined) fieldsToSet.slug = updates.slug.trim().toLowerCase();
    if (updates.icon !== undefined) fieldsToSet.icon = updates.icon;
    if (updates.defaultShelfAisle !== undefined) fieldsToSet.defaultShelfAisle = updates.defaultShelfAisle.trim();
    if (updates.sortOrder !== undefined || updates.displayOrder !== undefined) {
      fieldsToSet.sortOrder = Number(updates.sortOrder ?? updates.displayOrder);
    }
    if (updates.isActive !== undefined) fieldsToSet.isActive = Boolean(updates.isActive);
    fieldsToSet.updatedAt = new Date();

    await db.collection('subcategories').updateOne({ _id: new ObjectId(subId) }, { $set: fieldsToSet });

    const updated = await db.collection('subcategories').findOne({ _id: new ObjectId(subId) });

    res.json({
      success: true,
      message: 'Sub-category updated successfully',
      data: {
        id: updated._id.toString(),
        _id: updated._id,
        ...updated,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. DELETE SUBCATEGORY
router.delete('/:id/subcategories/:subId', async (req, res) => {
  try {
    const db = getDB();
    const { subId } = req.params;

    if (!ObjectId.isValid(subId)) {
      return res.status(400).json({ success: false, error: 'Invalid Sub-Category ID' });
    }

    const sub = await db.collection('subcategories').findOne({ _id: new ObjectId(subId) });
    if (!sub) {
      return res.status(404).json({ success: false, error: 'Sub-Category not found' });
    }

    // Check products
    const productCount = await db.collection('products').countDocuments({
      $or: [{ subCategoryId: sub._id }, { subCategoryId: sub._id.toString() }, { subCategory: sub.name }],
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete sub-category "${sub.name}". It has ${productCount} products assigned. Reassign those products first, or deactivate the sub-category.`,
      });
    }

    await db.collection('subcategories').deleteOne({ _id: sub._id });

    res.json({
      success: true,
      message: `Sub-category "${sub.name}" deleted successfully.`,
      data: { id: sub._id.toString() },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
