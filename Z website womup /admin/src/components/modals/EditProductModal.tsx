import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  Upload,
  Tag,
  Warehouse,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminApiService, API_BASE_URL } from '../../services/api';

interface FormVariant {
  id: string;
  _id?: string;
  sku: string;
  weightOrVolume: string;
  mrp: string;
  sellingPrice: string;
  stock: string;
  isDefault: boolean;
  isActive: boolean;
}

export const EditProductModal: React.FC = () => {
  const {
    editingProductForModal,
    setEditingProductForModal,
    categories,
    updateProduct,
    deleteProduct,
    refreshData,
    selectedCityFilter,
    selectedAreaFilter,
    areas,
    stores,
    areaPricing,
    saveVariantAreaPrice,
  } = useAdmin();

  // Basic Details
  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [brand, setBrand] = useState('Womup Fresh');
  const [shelfLocation, setShelfLocation] = useState('A1-R2');
  const [description, setDescription] = useState('');

  // Media
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Variants
  const [variants, setVariants] = useState<FormVariant[]>([]);

  // State
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Store / Area Resolution for 1:1 inventory matching
  const currentArea = React.useMemo(() => {
    if (!selectedAreaFilter || selectedAreaFilter === 'ALL') return null;
    return (
      areas.find(
        (a) =>
          a.id === selectedAreaFilter ||
          a._id === selectedAreaFilter ||
          a.name.toLowerCase() === selectedAreaFilter.toLowerCase()
      ) || null
    );
  }, [areas, selectedAreaFilter]);

  const currentStore = React.useMemo(() => {
    if (!currentArea) return null;
    return (
      stores.find((s) => {
        if (s.areaId && (s.areaId === currentArea.id || s.areaId === currentArea._id)) return true;
        if (s.areaName && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
        return false;
      }) ||
      stores.find((s) => s.cityName?.toLowerCase() === selectedCityFilter?.toLowerCase()) ||
      null
    );
  }, [stores, currentArea, selectedCityFilter]);

  // Sync form when modal opens
  useEffect(() => {
    if (editingProductForModal) {
      const p = editingProductForModal;
      setName(p.name || '');
      const matchedCat = categories.find((c) => (c.id && c.id === p.categoryId) || (c._id && c._id === p.categoryId) || c.name.toLowerCase() === (p.category || '').toLowerCase());
      setSelectedCategoryId(matchedCat ? (matchedCat.id || matchedCat._id) : (p.categoryId || ''));
      setBrand(p.brand || 'Womup Fresh');
      setShelfLocation(p.shelfLocation || 'A1-R2');
      setDescription(p.description || '');
      const img = p.imageUrl || p.image || '';
      setImageUrl(img);
      setImagePreview(img);
      setErrorMsg(null);

      // Load variants: resolve against current dark store/area inventory if selected!
      const prodVariants = p.variants || [];
      const baseList = prodVariants.length > 0 ? prodVariants : [
        {
          id: `v_${Date.now()}`,
          sku: p.sku || '',
          weightOrVolume: p.unit || '1 unit',
          mrp: p.mrp || p.sellingPrice || 50,
          sellingPrice: p.sellingPrice || 40,
          stock: p.stock !== undefined ? p.stock : 50,
          isDefault: true,
          isActive: true,
        },
      ];

      setVariants(
        baseList.map((v, idx) => {
          let effStock = v.stock !== undefined ? v.stock : 50;
          let effSellingPrice = v.sellingPrice || 40;
          let effMrp = v.mrp || v.sellingPrice || 50;

          if (currentArea) {
            const aId = String(currentArea.id || currentArea._id || '');
            const vId = String(v.id || v._id || '');
            const ap = areaPricing.find(
              (rec) => String(rec.variantId) === vId && String(rec.areaId) === aId
            );
            if (ap) {
              if (ap.stock !== undefined) effStock = ap.stock;
              if (ap.price !== undefined) effSellingPrice = ap.price;
              if (ap.mrp !== undefined && ap.mrp > 0) effMrp = ap.mrp;
            }
          }

          return {
            id: v.id || v._id || `v_${idx}`,
            _id: v._id,
            sku: v.sku || '',
            weightOrVolume: v.weightOrVolume || '1 unit',
            mrp: String(effMrp),
            sellingPrice: String(effSellingPrice),
            stock: String(effStock),
            isDefault: v.isDefault !== undefined ? !!v.isDefault : idx === 0,
            isActive: v.isActive !== false,
          };
        })
      );
    }
  }, [editingProductForModal, categories, currentArea, areaPricing]);

  if (!editingProductForModal) return null;

  const handleClose = () => {
    setEditingProductForModal(null);
    setErrorMsg(null);
  };

  // Image Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size cannot exceed 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploadingImage(true);
      setErrorMsg(null);
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_BASE_URL}/api/media/upload?folder=wormup/products`, {
        method: 'POST',
        body: formData,
      });
      const data = await uploadRes.json();
      if (data.success && data.data) {
        setImageUrl(data.data.url || data.data.secureUrl);
      } else {
        setImageUrl(reader.result as string || '');
      }
    } catch {
      setImageUrl(reader.result as string || '');
    } finally {
      setUploadingImage(false);
    }
  };

  // Variant Helpers
  const handleAddVariant = () => {
    const nextIdx = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        id: `v_${Date.now()}`,
        sku: '',
        weightOrVolume: nextIdx === 4 ? '2 kg' : '1 unit',
        mrp: '60',
        sellingPrice: '48',
        stock: '50',
        isDefault: false,
        isActive: true,
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) {
      setErrorMsg('Product must have at least one pack size / variant.');
      return;
    }
    setVariants((prev) => {
      const filtered = prev.filter((v) => v.id !== id);
      if (!filtered.some((v) => v.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handleUpdateVariant = (id: string, field: keyof FormVariant, val: any) => {
    setErrorMsg(null);
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          return { ...v, [field]: val };
        }
        if (field === 'isDefault' && val === true) {
          return { ...v, isDefault: false };
        }
        return v;
      })
    );
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a product title / item name.');
      return;
    }

    if (variants.length === 0) {
      setErrorMsg('Please maintain at least one pack variant.');
      return;
    }

    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.weightOrVolume.trim()) {
        setErrorMsg(`Variant #${i + 1} requires a pack size / weight (e.g. 250 g).`);
        return;
      }
      const sPrice = parseFloat(v.sellingPrice);
      const mPrice = parseFloat(v.mrp);
      if (isNaN(sPrice) || sPrice <= 0) {
        setErrorMsg(`Variant "${v.weightOrVolume}" requires a valid Selling Price.`);
        return;
      }
      if (isNaN(mPrice) || mPrice <= 0) {
        setErrorMsg(`Variant "${v.weightOrVolume}" requires a valid MRP.`);
        return;
      }
      if (sPrice > mPrice) {
        setErrorMsg(`Variant "${v.weightOrVolume}": Selling Price (₹${sPrice}) cannot exceed MRP (₹${mPrice}).`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const activeCat = categories.find((c) => c.id === selectedCategoryId || c._id === selectedCategoryId) || categories[0];

      const formattedVariants = variants.map((v) => {
        const generatedSku = v.sku.trim() || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.weightOrVolume.replace(/[^a-z0-9]+/gi, '').toLowerCase()}`;
        const sPrice = parseFloat(v.sellingPrice);
        const mPrice = parseFloat(v.mrp);
        const discountPercent = mPrice > 0 ? Math.round(((mPrice - sPrice) / mPrice) * 100) : 0;
        return {
          id: v.id,
          _id: v._id,
          sku: generatedSku,
          weightOrVolume: v.weightOrVolume.trim(),
          sellingPrice: sPrice,
          mrp: mPrice,
          discountPercent,
          stock: parseInt(v.stock, 10) || 50,
          isDefault: v.isDefault,
          isActive: v.isActive,
        };
      });

      const defaultVariant = formattedVariants.find((v) => v.isDefault) || formattedVariants[0];

      const prodId = editingProductForModal.id || editingProductForModal._id;

      const payload = {
        name: name.trim(),
        category: activeCat ? activeCat.name : 'Groceries',
        categoryId: activeCat ? (activeCat.id || activeCat._id) : undefined,
        brand: brand.trim() || 'Womup Fresh',
        shelfLocation: shelfLocation.trim().toUpperCase() || 'A1-R2',
        description: description.trim(),
        imageUrl: imageUrl.trim() || imagePreview || undefined,
        images: (imageUrl.trim() || imagePreview) ? [imageUrl.trim() || imagePreview] : [],
        sellingPrice: defaultVariant.sellingPrice,
        mrp: defaultVariant.mrp,
        basePrice: defaultVariant.sellingPrice,
        stock: defaultVariant.stock,
        quantityLabel: defaultVariant.weightOrVolume,
        isActive: true,
        variants: formattedVariants,
      };

      const success = await updateProduct(prodId, payload);
      if (success) {
        if (currentArea) {
          const aId = String(currentArea.id || currentArea._id || '');
          try {
            await Promise.all(
              formattedVariants.map((fv) =>
                saveVariantAreaPrice({
                  productId: prodId,
                  variantId: fv._id || fv.id,
                  areaId: aId,
                  price: fv.sellingPrice,
                  mrp: fv.mrp,
                  stock: fv.stock,
                })
              )
            );
          } catch (e) {
            console.warn('Could not sync store area pricing:', e);
          }
        }
        await refreshData();
        setEditingProductForModal(null);
      } else {
        setErrorMsg('Failed to update product in database.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred updating product.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    const prodId = editingProductForModal.id || editingProductForModal._id;
    if (!window.confirm(`Are you sure you want to delete "${editingProductForModal.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const ok = await deleteProduct(prodId);
      if (ok) {
        await refreshData();
        setEditingProductForModal(null);
      } else {
        setErrorMsg('Failed to delete product from database.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FFF0F7',
                color: '#FF3B98',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#071B52', margin: 0, fontWeight: 800 }}>
                Edit Product: {editingProductForModal.name}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                SKU: {editingProductForModal.sku || 'N/A'} • ID: {editingProductForModal.id}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Store Inventory Context Banner */}
        {currentArea ? (
          <div
            style={{
              padding: '10px 18px',
              backgroundColor: '#F0FDF4',
              borderBottom: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Warehouse size={16} color="#16A34A" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>
                Store Locked: {currentStore ? currentStore.name : `${currentArea.name} Dark Store`}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#15803D',
                  backgroundColor: '#DCFCE7',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #86EFAC',
                }}
              >
                1:1 Area Lock: {currentArea.name} ({selectedCityFilter})
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>
              ✓ Showing & saving stock specifically for this Dark Store
            </span>
          </div>
        ) : (
          <div
            style={{
              padding: '9px 18px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#334155' }}>
                🌐 Global Master Catalog (Default Stock & Pricing)
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Select an area on the Inventory page to view & edit store-specific inventory.
            </span>
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          <form onSubmit={handleSave}>
            {errorMsg && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#B91C1C',
                  fontSize: '0.84rem',
                }}
              >
                <AlertTriangle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SECTION 1: Product Master Info */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ fontSize: '0.82rem', color: '#071B52', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={15} color="#FF3B98" />
                <span>1. Product Core Details</span>
              </h5>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Product Title / Item Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="form-select"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Shelf Location / Bin (A1-R2) *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={shelfLocation}
                      onChange={(e) => setShelfLocation(e.target.value.toUpperCase())}
                      className="form-input"
                      style={{ paddingLeft: '32px' }}
                    />
                    <Warehouse size={15} color="#64748B" style={{ position: 'absolute', left: '10px', top: '13px' }} />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Product Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* SECTION 2: Media */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{ fontSize: '0.82rem', color: '#071B52', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={15} color="#7C3AED" />
                <span>2. Media & Product Photo</span>
              </h5>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    border: '2px dashed #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {(imagePreview || imageUrl) ? (
                    <>
                      <img
                        src={imagePreview || imageUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setImageUrl(''); setImagePreview(''); }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                      <ImageIcon size={28} />
                      <span style={{ fontSize: '0.68rem', display: 'block', marginTop: '4px' }}>No Image</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Image Web URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} />
                      <span>{uploadingImage ? 'Uploading...' : 'Replace Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ display: 'none' }}
                        disabled={uploadingImage}
                      />
                    </label>
                    <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      JPG, PNG or WEBP up to 5MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Multi-Variant Pack Sizes Matrix */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h5 style={{ fontSize: '0.82rem', color: '#071B52', fontWeight: 800, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={15} color="#10B981" />
                  <span>3. Pack Sizes & Pricing Matrix ({variants.length} Variants)</span>
                  {currentArea && (
                    <span
                      style={{
                        fontSize: '0.70rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        fontWeight: 700,
                        textTransform: 'none',
                        border: '1px solid #86EFAC',
                      }}
                    >
                      {currentArea.name} Dark Store Stock
                    </span>
                  )}
                </h5>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', borderColor: '#C7D2FE', color: '#4F46E5', fontWeight: 700 }}
                >
                  <Plus size={14} />
                  <span>Add Pack Size</span>
                </button>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflowX: 'auto', background: '#FFFFFF' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Default</th>
                      <th style={{ padding: '10px 12px' }}>Pack Size / Weight *</th>
                      <th style={{ padding: '10px 12px' }}>SKU</th>
                      <th style={{ padding: '10px 12px', width: '110px' }}>Selling Price (₹) *</th>
                      <th style={{ padding: '10px 12px', width: '110px' }}>MRP (₹) *</th>
                      <th style={{ padding: '10px 12px', width: '90px' }}>Discount</th>
                      <th style={{ padding: '10px 12px', width: '110px' }}>
                        Stock {currentArea ? `(${currentArea.name})` : ''}
                      </th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const sp = parseFloat(v.sellingPrice) || 0;
                      const mrp = parseFloat(v.mrp) || 0;
                      const discount = mrp > 0 && sp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
                      const isPriceInvalid = sp > mrp;

                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: v.isDefault ? '#FFFDF5' : 'transparent' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <input
                              type="radio"
                              name="defaultVariant"
                              checked={v.isDefault}
                              onChange={() => handleUpdateVariant(v.id, 'isDefault', true)}
                              style={{ cursor: 'pointer', accentColor: '#FF3B98' }}
                              title="Set as Default Display Pack"
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="text"
                              required
                              value={v.weightOrVolume}
                              onChange={(e) => handleUpdateVariant(v.id, 'weightOrVolume', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                              }}
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => handleUpdateVariant(v.id, 'sku', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.78rem',
                                fontFamily: 'var(--font-mono)',
                              }}
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="number"
                              step="0.5"
                              required
                              min="0"
                              value={v.sellingPrice}
                              onChange={(e) => handleUpdateVariant(v.id, 'sellingPrice', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: isPriceInvalid ? '1px solid #DC2626' : '1px solid #CBD5E1',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#071B52',
                              }}
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="number"
                              step="0.5"
                              required
                              min="0"
                              value={v.mrp}
                              onChange={(e) => handleUpdateVariant(v.id, 'mrp', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.82rem',
                                color: '#64748B',
                              }}
                            />
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <span
                              className={`badge ${
                                isPriceInvalid
                                  ? 'badge-red'
                                  : discount > 0
                                  ? 'badge-emerald'
                                  : 'badge-navy'
                              }`}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {isPriceInvalid ? 'INVALID' : `${discount}% OFF`}
                            </span>
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="number"
                              min="0"
                              value={v.stock}
                              onChange={(e) => handleUpdateVariant(v.id, 'stock', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: currentArea ? '1.5px solid #86EFAC' : '1px solid #CBD5E1',
                                backgroundColor: currentArea ? '#F0FDF4' : '#FFFFFF',
                                fontWeight: currentArea ? 700 : 500,
                                color: currentArea ? '#166534' : 'inherit',
                                fontSize: '0.82rem',
                              }}
                            />
                            {currentArea && (
                              <span style={{ fontSize: '0.66rem', color: '#16A34A', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                                {currentArea.name} Stock
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              disabled={variants.length <= 1}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: variants.length <= 1 ? 'not-allowed' : 'pointer',
                                color: variants.length <= 1 ? '#CBD5E1' : '#DC2626',
                                padding: '4px',
                              }}
                              title="Remove pack size"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-secondary"
                disabled={deleting || submitting}
                style={{ color: '#DC2626', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={15} />
                <span>{deleting ? 'Deleting...' : 'Delete Product'}</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px' }}
                >
                  <Check size={16} />
                  <span>{submitting ? 'Saving to MongoDB...' : 'Save Product Changes'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
