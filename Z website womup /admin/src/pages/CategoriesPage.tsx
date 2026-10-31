import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Check,
  Tag,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { CategoryItem } from '../types/admin';
import { API_BASE_URL } from '../services/api';

// Curated high-res grocery category images for quick 1-click presets
const IMAGE_PRESETS = [
  { label: 'Vegetables', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80', emoji: '🥦', color: '#E8F5E9' },
  { label: 'Fruits', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&q=80', emoji: '🍎', color: '#FFF3E0' },
  { label: 'Dairy & Milk', url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&q=80', emoji: '🥛', color: '#E3F2FD' },
  { label: 'Cooking Essentials', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80', emoji: '🧄', color: '#F3E5F5' },
  { label: 'Bakery & Bread', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80', emoji: '🍞', color: '#FFF8E1' },
  { label: 'Cold Beverages', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', emoji: '🧃', color: '#FCE4EC' },
  { label: 'Snacks & Munchies', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80', emoji: '🍿', color: '#FBE9E7' },
  { label: 'Organic Wellness', url: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=500&q=80', emoji: '🌿', color: '#EEF9F3' },
  { label: 'Personal Care', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', emoji: '🧴', color: '#EDE9FE' },
  { label: 'Cleaning & Household', url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&q=80', emoji: '🧼', color: '#F1F5F9' },
  { label: 'Paan Corner', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80', emoji: '🍃', color: '#DCFCE7' },
  { label: 'Baby Care', url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80', emoji: '🍼', color: '#FCE7F3' },
];

const COLOR_PRESETS = [
  '#E8F5E9',
  '#FFF3E0',
  '#E3F2FD',
  '#F3E5F5',
  '#FFF8E1',
  '#FCE4EC',
  '#FBE9E7',
  '#EEF9F3',
  '#EDE9FE',
  '#F1F5F9',
];

export const CategoriesPage: React.FC = () => {
  const { categories, products, refreshData, createCategory, updateCategory, deleteCategory } = useAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // ================= ADD CATEGORY MODAL STATE =================
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatBgColor, setNewCatBgColor] = useState('#E8F5E9');
  const [newCatIcon, setNewCatIcon] = useState('🥦');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatSortOrder, setNewCatSortOrder] = useState<number>(categories.length + 1);
  const [submittingCat, setSubmittingCat] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ================= EDIT CATEGORY MODAL STATE =================
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editBgColor, setEditBgColor] = useState('#FCE1F5');
  const [editIcon, setEditIcon] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSortOrder, setEditSortOrder] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ================= SUBCATEGORY MODAL STATE =================
  const [selectedCatForSub, setSelectedCatForSub] = useState<CategoryItem | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [submittingSub, setSubmittingSub] = useState(false);

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      (c.slug && c.slug.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q));
    const matchStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Active'
        ? c.isActive !== false
        : c.isActive === false;
    return matchSearch && matchStatus;
  });

  // Open Edit Modal
  const startEditCategory = (cat: CategoryItem) => {
    setEditingCat(cat);
    setEditName(cat.name || '');
    setEditSlug(cat.slug || '');
    setEditImage(cat.image || cat.imageUrl || '');
    setEditIcon(cat.icon || '🥦');
    setEditBgColor(cat.bgColor || '#E8F5E9');
    setEditDescription(cat.description || '');
    setEditSortOrder(cat.sortOrder ?? 0);
    setEditIsActive(cat.isActive !== false);
    setEditError(null);
  };

  // Save Category Edit
  const handleSaveCategoryEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editName.trim()) return;

    setSavingEdit(true);
    setEditError(null);

    const catId = editingCat.id || editingCat._id || '';
    const cleanSlug = (editSlug.trim() || editName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');

    const payload = {
      name: editName.trim(),
      slug: cleanSlug,
      image: editImage.trim() || null,
      imageUrl: editImage.trim() || null,
      icon: editIcon.trim() || 'shopping-bag',
      bgColor: editBgColor,
      description: editDescription.trim(),
      sortOrder: Number(editSortOrder) || 0,
      isActive: Boolean(editIsActive),
    };

    const res = await updateCategory(catId, payload);
    setSavingEdit(false);

    if (res && res.success !== false) {
      setEditingCat(null);
      await refreshData();
    } else {
      setEditError(res?.error || 'Failed to update category. Please verify network/server.');
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSubmittingCat(true);
    setAddError(null);

    const cleanSlug = (newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
    const cleanCode = cleanSlug.toUpperCase().replace(/-/g, '_');

    const res = await createCategory({
      name: newCatName.trim(),
      code: cleanCode,
      slug: cleanSlug,
      image: newCatImage.trim() || null,
      imageUrl: newCatImage.trim() || null,
      bgColor: newCatBgColor,
      icon: newCatIcon.trim() || 'shopping-bag',
      description: newCatDescription.trim(),
      sortOrder: Number(newCatSortOrder) || (categories.length + 1),
      isActive: true,
    });

    setSubmittingCat(false);
    if (res && res.success !== false) {
      setShowAddCatModal(false);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatImage('');
      setNewCatDescription('');
      await refreshData();
    } else {
      setAddError(res?.error || 'Failed to create category.');
    }
  };

  // Create Subcategory
  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatForSub || !newSubName.trim()) return;
    setSubmittingSub(true);
    try {
      const catId = selectedCatForSub.id || selectedCatForSub._id;
      await fetch(`${API_BASE_URL}/api/categories/${catId}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubName.trim(),
          slug: newSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        }),
      });
      await refreshData();
    } catch (e) {
      console.error(e);
    }
    setSubmittingSub(false);
    setSelectedCatForSub(null);
    setNewSubName('');
  };

  // Delete Subcategory
  const handleDeleteSubcategory = async (cat: CategoryItem, subId: string, subName: string) => {
    if (!window.confirm(`Delete subcategory "${subName}" from ${cat.name}?`)) return;
    try {
      const catId = cat.id || cat._id;
      await fetch(`${API_BASE_URL}/api/categories/${catId}/subcategories/${subId}`, {
        method: 'DELETE',
      });
      await refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Category Status
  const handleToggleStatus = async (cat: CategoryItem) => {
    try {
      const nextActive = cat.isActive === false;
      const catId = cat.id || cat._id || '';
      await updateCategory(catId, { isActive: nextActive });
      await refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`)) {
      try {
        const catId = cat.id || cat._id || '';
        await deleteCategory(catId);
        await refreshData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
            Category Taxonomy & Department Shelves
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Manage category titles, product images, visual icons, background colors, and subcategories
          </p>
        </div>

        <button
          onClick={() => {
            setNewCatSortOrder(categories.length + 1);
            setShowAddCatModal(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Plus size={16} />
          <span>+ Add Department / Category</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="admin-card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['All', 'Active', 'Inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: statusFilter === tab ? '#071B52' : '#F1F5F9',
                color: statusFilter === tab ? '#FFFFFF' : '#64748B',
                fontSize: '0.80rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search categories & slugs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 34px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.84rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredCategories.map((c) => {
          const catId = c.id || c._id || '';
          const productCount = products.filter(
            (p) =>
              p.category === c.name ||
              p.categoryId === catId ||
              (p.category && c.slug && p.category.toLowerCase() === c.slug.toLowerCase())
          ).length;
          const subCount = c.subCategories?.length || 0;
          const catImg = c.image || c.imageUrl;

          return (
            <div
              key={catId}
              className="admin-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1.5px solid #E2E8F0',
                borderRadius: '14px',
                padding: '18px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div>
                {/* Header row with Image, Title, Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                  {/* Category Image Box */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      minWidth: '56px',
                      borderRadius: '12px',
                      backgroundColor: c.bgColor || '#F3F0FF',
                      border: '1.5px solid #E2E8F0',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    {catImg ? (
                      <img
                        src={catImg}
                        alt={c.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          // Fallback to emoji or icon if broken image
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}

                    {/* Emoji / Icon Overlay if no image or fallback */}
                    {!catImg && (
                      <span style={{ fontSize: '1.6rem', userSelect: 'none' }}>
                        {c.icon && c.icon.length <= 4 ? c.icon : <FolderTree size={24} color="#7856F6" />}
                      </span>
                    )}

                    {/* Small Emoji badge on bottom-right if image exists */}
                    {catImg && c.icon && c.icon.length <= 4 && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          fontSize: '0.85rem',
                          background: 'rgba(255,255,255,0.9)',
                          borderRadius: '6px',
                          padding: '0 2px',
                          lineHeight: '1',
                        }}
                      >
                        {c.icon}
                      </span>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#071B52',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={c.name}
                      >
                        {c.name}
                      </h4>
                    </div>

                    <p
                      style={{
                        fontSize: '0.74rem',
                        color: '#64748B',
                        fontFamily: 'var(--font-mono)',
                        margin: '2px 0 0',
                      }}
                    >
                      /{c.slug}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      {c.sortOrder !== undefined && (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            background: '#F1F5F9',
                            color: '#475569',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          Order #{c.sortOrder}
                        </span>
                      )}
                      {c.code && (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          {c.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top-Right Action Buttons: Edit, Status, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* EDIT CATEGORY BUTTON */}
                    <button
                      onClick={() => startEditCategory(c)}
                      title="Edit Category & Image"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 9px',
                        borderRadius: '6px',
                        border: '1px solid #BFDBFE',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>

                    {/* STATUS TOGGLE */}
                    <button
                      onClick={() => handleToggleStatus(c)}
                      title={c.isActive !== false ? 'Click to Hide Category' : 'Click to Activate Category'}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: c.isActive !== false ? '#ECFDF5' : '#F1F5F9',
                        color: c.isActive !== false ? '#059669' : '#64748B',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {c.isActive !== false ? 'ACTIVE' : 'HIDDEN'}
                    </button>

                    {/* DELETE CATEGORY */}
                    <button
                      onClick={() => handleDeleteCategory(c)}
                      title="Delete Category"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Optional Category Description */}
                {c.description ? (
                  <p
                    style={{
                      fontSize: '0.76rem',
                      color: '#64748B',
                      marginBottom: '12px',
                      lineHeight: '1.35',
                      fontStyle: 'normal',
                    }}
                  >
                    {c.description}
                  </p>
                ) : null}

                {/* Subcategories Section */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      Subcategories ({subCount})
                    </span>
                    <button
                      onClick={() => setSelectedCatForSub(c)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FF3B98',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Sub
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {c.subCategories && c.subCategories.length > 0 ? (
                      c.subCategories.map((sub, i) => (
                        <span
                          key={sub.id || sub._id || i}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            color: '#334155',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {sub.name}
                          <button
                            onClick={() => handleDeleteSubcategory(c, sub.id || sub._id || '', sub.name)}
                            title="Remove subcategory"
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: 0,
                              lineHeight: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        No subcategories defined
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Footer with Quick Edit Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.80rem',
                  color: '#64748B',
                  fontWeight: 600,
                  marginTop: '12px',
                  border: '1px solid #F1F5F9',
                }}
              >
                <div>
                  <span>Live Products: </span>
                  <strong style={{ color: '#071B52', fontSize: '0.86rem' }}>{productCount} items</strong>
                </div>

                <button
                  onClick={() => startEditCategory(c)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                >
                  <ImageIcon size={12} />
                  <span>Edit Image / Details →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= EDIT CATEGORY MODAL ================= */}
      {editingCat && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: editBgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #CBD5E1',
                    fontSize: '1.2rem',
                  }}
                >
                  {editIcon && editIcon.length <= 4 ? editIcon : <Edit2 size={18} color="#071B52" />}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#071B52', fontSize: '1.15rem', fontWeight: 800 }}>
                    Edit Category: {editingCat.name}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    ID: {editingCat.id || editingCat._id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditingCat(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategoryEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {editError && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: '#B91C1C',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{editError}</span>
                  </div>
                )}

                {/* 1. Category Image & Live Preview */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#071B52' }}>Category Image URL *</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Direct image URL (PNG/JPG/WEBP)</span>
                  </label>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                    {/* Live Image Preview Thumbnail */}
                    <div
                      style={{
                        width: '68px',
                        height: '68px',
                        minWidth: '68px',
                        borderRadius: '12px',
                        backgroundColor: editBgColor,
                        border: '1.5px solid #CBD5E1',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        position: 'relative',
                      }}
                    >
                      {editImage ? (
                        <img
                          src={editImage}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon size={28} color="#94A3B8" />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or CDN link"
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.82rem', width: '100%' }}
                      />
                      <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
                        Paste any online image URL or click a ready preset below:
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Image Presets */}
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      ⚡ Quick-Select Image Presets:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {IMAGE_PRESETS.map((p) => (
                        <button
                          type="button"
                          key={p.label}
                          onClick={() => {
                            setEditImage(p.url);
                            setEditIcon(p.emoji);
                            setEditBgColor(p.color);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: editImage === p.url ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                            backgroundColor: editImage === p.url ? '#EFF6FF' : '#F8FAFC',
                            color: editImage === p.url ? '#1D4ED8' : '#334155',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{p.emoji}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Category Name & Slug */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vegetables"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        if (!editSlug || editSlug === editingCat.slug) {
                          setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                        }
                      }}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. vegetables"
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="form-input"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* 3. Icon / Emoji & Sort Order */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                      Icon / Emoji
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 🥦 or shopping-bag"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      placeholder="1, 2, 3..."
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(parseInt(e.target.value, 10) || 0)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 4. Background Color Swatches */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                    Card Background Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                    {COLOR_PRESETS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setEditBgColor(color)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: color,
                          border: editBgColor === color ? '2.5px solid #071B52' : '1.5px solid #CBD5E1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {editBgColor === color && <Check size={14} color="#071B52" />}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={editBgColor}
                      onChange={(e) => setEditBgColor(e.target.value)}
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  </div>
                </div>

                {/* 5. Description */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Short description of products found in this aisle..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="form-input"
                    rows={2}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* 6. Active Status Switch */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.86rem', color: '#071B52', display: 'block' }}>
                      Category Visibility
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      Active categories appear in consumer app & website navigation
                    </span>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: editIsActive ? '#059669' : '#64748B' }}>
                      {editIsActive ? 'ACTIVE' : 'HIDDEN'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="btn btn-secondary"
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEdit}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>{savingEdit ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD CATEGORY MODAL ================= */}
      {showAddCatModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: newCatBgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #CBD5E1',
                    fontSize: '1.2rem',
                  }}
                >
                  {newCatIcon}
                </div>
                <h4 style={{ margin: 0, color: '#071B52', fontSize: '1.15rem', fontWeight: 800 }}>
                  Add New Department Category
                </h4>
              </div>

              <button
                onClick={() => setShowAddCatModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {addError && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      color: '#B91C1C',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{addError}</span>
                  </div>
                )}

                {/* Image URL & Live Preview */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                    Category Image URL
                  </label>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                    <div
                      style={{
                        width: '68px',
                        height: '68px',
                        minWidth: '68px',
                        borderRadius: '12px',
                        backgroundColor: newCatBgColor,
                        border: '1.5px solid #CBD5E1',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      {newCatImage ? (
                        <img
                          src={newCatImage}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon size={28} color="#94A3B8" />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or direct image link"
                        value={newCatImage}
                        onChange={(e) => setNewCatImage(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.82rem', width: '100%' }}
                      />
                      <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
                        Paste image URL or choose a preset:
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Image Presets */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {IMAGE_PRESETS.map((p) => (
                        <button
                          type="button"
                          key={p.label}
                          onClick={() => {
                            setNewCatImage(p.url);
                            setNewCatIcon(p.emoji);
                            setNewCatBgColor(p.color);
                            if (!newCatName) setNewCatName(p.label);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: newCatImage === p.url ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                            backgroundColor: newCatImage === p.url ? '#EFF6FF' : '#F8FAFC',
                            color: newCatImage === p.url ? '#1D4ED8' : '#334155',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{p.emoji}</span>
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name & Slug */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gourmet & Imported"
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        if (!newCatSlug) {
                          setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                        }
                      }}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. gourmet-imported"
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      className="form-input"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Icon & Sort Order */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                      Icon / Emoji
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 🧀 or coffee"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={newCatSortOrder}
                      onChange={(e) => setNewCatSortOrder(parseInt(e.target.value, 10) || 1)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                    Card Background Accent
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {COLOR_PRESETS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setNewCatBgColor(color)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: color,
                          border: newCatBgColor === color ? '2.5px solid #071B52' : '1.5px solid #CBD5E1',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {newCatBgColor === color && <Check size={14} color="#071B52" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Short description of department..."
                    value={newCatDescription}
                    onChange={(e) => setNewCatDescription(e.target.value)}
                    className="form-input"
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="btn btn-secondary"
                  disabled={submittingCat}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingCat}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} />
                  <span>{submittingCat ? 'Creating...' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD SUBCATEGORY MODAL ================= */}
      {selectedCatForSub && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', width: '95%' }}>
            <div className="modal-header">
              <h4 style={{ margin: 0, color: '#071B52', fontSize: '1.15rem', fontWeight: 800 }}>
                Add Subcategory to {selectedCatForSub.name}
              </h4>
              <button
                onClick={() => setSelectedCatForSub(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubcategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, color: '#071B52' }}>
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Greek Yogurt & Butter"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setSelectedCatForSub(null)}
                  className="btn btn-secondary"
                  disabled={submittingSub}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingSub}
                >
                  {submittingSub ? 'Saving...' : 'Add Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
