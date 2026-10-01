const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const router = express.Router();

// ================= CITIES (MASTER LOCATION DATA) =================

// 1. GET ALL CITIES WITH LIVE STATS (Area count, Store count)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const cities = await db.collection('cities').find({}).sort({ sortOrder: 1, name: 1 }).toArray();

    // Enrich each city with area count and store count
    const enriched = await Promise.all(
      cities.map(async (city) => {
        const cityId = city._id;
        const areaCount = await db.collection('areas').countDocuments({
          $or: [{ cityId }, { cityId: cityId.toString() }, { cityName: city.name }, { city: city.name }],
        });
        const storeCount = await db.collection('stores').countDocuments({
          $or: [{ cityId }, { cityId: cityId.toString() }, { city: city.name }],
        });
        const activeStoreCount = await db.collection('stores').countDocuments({
          $or: [{ cityId }, { cityId: cityId.toString() }, { city: city.name }],
          isActive: true,
        });

        return {
          id: city._id.toString(),
          _id: city._id,
          name: city.name,
          code: city.code,
          state: city.state || 'Gujarat',
          status: city.status || 'Active',
          sortOrder: city.sortOrder || 0,
          areaCount,
          storeCount,
          activeStoreCount,
          createdAt: city.createdAt,
          updatedAt: city.updatedAt,
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET SINGLE CITY BY ID WITH ITS AREAS
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { code: id.toUpperCase() }] };
    } else {
      query = { code: id.toUpperCase() };
    }

    const city = await db.collection('cities').findOne(query);
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    const areas = await db.collection('areas').find({
      $or: [{ cityId: city._id }, { cityId: city._id.toString() }, { cityName: city.name }, { city: city.name }],
    }).toArray();

    res.json({
      success: true,
      data: {
        ...city,
        id: city._id.toString(),
        areas,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. CREATE NEW CITY
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { name, code, state, status, sortOrder } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'City Name is required' });
    }

    const trimmedName = name.trim();
    const formattedCode = (
      code && typeof code === 'string' && code.trim()
        ? code.trim()
        : trimmedName.substring(0, 3).toUpperCase()
    )
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '');

    if (!formattedCode) {
      return res.status(400).json({ success: false, error: 'City Code is required' });
    }

    // Uniqueness validation: check duplicate name or code
    const existingName = await db.collection('cities').findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        error: `A city with name "${trimmedName}" already exists.`,
      });
    }

    const existingCode = await db.collection('cities').findOne({ code: formattedCode });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: `A city with code "${formattedCode}" already exists.`,
      });
    }

    const count = await db.collection('cities').countDocuments({});
    const newCity = {
      name: trimmedName,
      code: formattedCode,
      state: (state && typeof state === 'string' && state.trim()) ? state.trim() : 'Gujarat',
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : count + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('cities').insertOne(newCity);

    res.status(201).json({
      success: true,
      message: `City "${trimmedName}" created successfully`,
      id: result.insertedId.toString(),
      data: {
        ...newCity,
        _id: result.insertedId,
        id: result.insertedId.toString(),
        areaCount: 0,
        storeCount: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. UPDATE CITY
router.patch('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { name, code, state, status, sortOrder } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid city ID' });
    }

    const cityId = new ObjectId(id);
    const existingCity = await db.collection('cities').findOne({ _id: cityId });
    if (!existingCity) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    const updates = {};
    if (name && typeof name === 'string' && name.trim()) {
      const trimmedName = name.trim();
      const duplicateName = await db.collection('cities').findOne({
        _id: { $ne: cityId },
        name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (duplicateName) {
        return res.status(400).json({ success: false, error: `City name "${trimmedName}" already exists.` });
      }
      updates.name = trimmedName;
    }

    if (code && typeof code === 'string' && code.trim()) {
      const formattedCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const duplicateCode = await db.collection('cities').findOne({
        _id: { $ne: cityId },
        code: formattedCode,
      });
      if (duplicateCode) {
        return res.status(400).json({ success: false, error: `City code "${formattedCode}" already exists.` });
      }
      updates.code = formattedCode;
    }

    if (state !== undefined) updates.state = state.trim();
    if (status !== undefined) updates.status = status;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    updates.updatedAt = new Date();

    await db.collection('cities').updateOne({ _id: cityId }, { $set: updates });

    // Propagate city name change if changed
    if (updates.name && updates.name !== existingCity.name) {
      await db.collection('areas').updateMany(
        { $or: [{ cityId }, { cityId: id }] },
        { $set: { cityName: updates.name, city: updates.name } }
      );
      await db.collection('stores').updateMany(
        { $or: [{ cityId }, { cityId: id }] },
        { $set: { cityName: updates.name, city: updates.name } }
      );
    }

    const updated = await db.collection('cities').findOne({ _id: cityId });
    res.json({
      success: true,
      message: 'City updated successfully',
      data: {
        ...updated,
        id: updated._id.toString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. DELETE CITY (Checks if areas exist)
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid city ID' });
    }

    const cityId = new ObjectId(id);
    const existing = await db.collection('cities').findOne({ _id: cityId });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    // Check if any areas belong to this city
    const areaCount = await db.collection('areas').countDocuments({
      $or: [{ cityId }, { cityId: id }, { cityName: existing.name }, { city: existing.name }],
    });
    if (areaCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete "${existing.name}". It has ${areaCount} active area(s) configured. Delete or reassign the areas first.`,
      });
    }

    await db.collection('cities').deleteOne({ _id: cityId });
    res.json({ success: true, message: `City "${existing.name}" deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
