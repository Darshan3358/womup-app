import React, { useState } from 'react';
import {
  X,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  Upload,
  Check,
  Tag,
  Warehouse,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AdminApiService } from '../../services/api';

interface FormVariant {
  id: string;
  sku: string;
  weightOrVolume: string;
  mrp: string;
  sellingPrice: string;
  stock: string;
  isDefault: boolean;
  isActive: boolean;
}

export const AddProductModal: React.FC = () => {
  const { showAddProductModal, setShowAddProductModal, categories, refreshData } = useAdmin();

  // Basic Info
  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [brand, setBrand] = useState('Womup Fresh');
  const [shelfLocation, setShelfLocation] = useState('A1-R2');
  const [description, setDescription] = useState('');

  // Image Upload / URL
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Multi-Variant Pack Size Matrix
  const [variants, setVariants] = useState<FormVariant[]>([
    {
      id: 'v_1',
      sku: '',
      weightOrVolume: '250 g',
      mrp: '15',
      sellingPrice: '12',
      stock: '50',
      isDefault: true,
      isActive: true,
    },
    {
      id: 'v_2',
      sku: '',
      weightOrVolume: '500 g',
      mrp: '28',
      sellingPrice: '22',
      stock: '50',
      isDefault: false,
      isActive: true,
    },
    {
      id: 'v_3',
      sku: '',
      weightOrVolume: '1 kg',
      mrp: '50',
      sellingPrice: '40',
      stock: '50',
      isDefault: false,
      isActive: true,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!showAddProductModal) return null;

  const handleClose = () => {
    setShowAddProductModal(false);
    setErrorMsg(null);
  };

  // Image File Upload Handler
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
      // Attempt backend upload endpoint
      const uploadRes = await fetch('http://localhost:5001/api/media/upload?folder=wormup/products', {
        method: 'POST',
        body: formData,
      });
      const data = await uploadRes.json();
      if (data.success && data.data) {
        setImageUrl(data.data.url || data.data.secureUrl);
      } else {
        // Fallback to data URL or keep custom url
        setImageUrl(reader.result as string || '');
      }
    } catch {
      // Local fallback
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
      // If deleted variant was default, make first remaining default
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a product title / item name.');
      return;
    }

    if (variants.length === 0) {
      setErrorMsg('Please add at least one pack variant.');
      return;
    }

    // Validate all variants
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

      const res = await AdminApiService.createProduct(payload);
      if (res.success) {
        await refreshData();
        setShowAddProductModal(false);
        // Reset form
        setName('');
        setBrand('Womup Fresh');
        setDescription('');
        setImageUrl('');
        setImagePreview('');
      } else {
        setErrorMsg(res.error || 'Failed to create product in database.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred creating product.');
    } finally {
      setSubmitting(false);
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
                backgroundColor: '#EFF6FF',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#071B52', margin: 0, fontWeight: 800 }}>
                Add New Product Item
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                100% synchronized with MongoDB catalog and multi-pack variants matrix
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

        {/* Form Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
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

            {/* SECTION 1: Product Basic Details */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ fontSize: '0.82rem', color: '#071B52', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={15} color="#FF3B98" />
                <span>1. Product Master Details</span>
              </h5>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Product Title / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amul Taaza Fresh Toned Milk"
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
                    placeholder="e.g. Amul, Womup Fresh, Cadbury"
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
                      placeholder="e.g. A1-R2"
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
                <label className="form-label">Product Description / Highlights</label>
                <textarea
                  rows={2}
                  placeholder="Paste brief customer-facing product summary, ingredients or freshness guarantee..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* SECTION 2: Product Image & Media */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{ fontSize: '0.82rem', color: '#071B52', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={15} color="#7C3AED" />
                <span>2. Media & Product Photo</span>
              </h5>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                {/* Preview Box */}
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

                {/* Input and Upload */}
                <div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Image Web URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or Cloudinary URL"
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
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
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
                <h5 style={{ fontSize: '0.82rem', color: '#071B52', fontWeight: 800, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="#10B981" />
                  <span>3. Pack Sizes & Pricing Matrix ({variants.length} Variants)</span>
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

              {/* Variants Table */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflowX: 'auto', background: '#FFFFFF' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Default</th>
                      <th style={{ padding: '10px 12px' }}>Pack Size / Weight *</th>
                      <th style={{ padding: '10px 12px' }}>SKU (Auto or Custom)</th>
                      <th style={{ padding: '10px 12px', width: '110px' }}>Selling Price (₹) *</th>
                      <th style={{ padding: '10px 12px', width: '110px' }}>MRP (₹) *</th>
                      <th style={{ padding: '10px 12px', width: '90px' }}>Discount</th>
                      <th style={{ padding: '10px 12px', width: '90px' }}>Initial Stock</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, idx) => {
                      const sp = parseFloat(v.sellingPrice) || 0;
                      const mrp = parseFloat(v.mrp) || 0;
                      const discount = mrp > 0 && sp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;
                      const isPriceInvalid = sp > mrp;

                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: v.isDefault ? '#FFFDF5' : 'transparent' }}>
                          {/* Default radio */}
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

                          {/* Weight / Pack size */}
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 250 g, 1 kg"
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

                          {/* SKU */}
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="text"
                              placeholder="Auto-generated SKU"
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

                          {/* Selling Price */}
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="number"
                              step="0.5"
                              required
                              min="0"
                              placeholder="₹"
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

                          {/* MRP */}
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="number"
                              step="0.5"
                              required
                              min="0"
                              placeholder="₹"
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

                          {/* Discount % Badge */}
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

                          {/* Stock */}
                          <td style={{ padding: '10px 12px' }}>
                            <input
                              type="number"
                              min="0"
                              placeholder="Qty"
                              value={v.stock}
                              onChange={(e) => handleUpdateVariant(v.id, 'stock', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.82rem',
                              }}
                            />
                          </td>

                          {/* Delete */}
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
            <div className="modal-footer" style={{ padding: '16px 0 0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                <span>{submitting ? 'Creating in MongoDB...' : 'Save & Publish Product'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
