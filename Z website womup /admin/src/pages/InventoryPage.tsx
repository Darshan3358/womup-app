import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  AlertTriangle,
  Edit2,
  Check,
  X,
  Warehouse,
  Lock,
  MapPin,
  Navigation,
  Layers,
  ChevronDown,
  Clock,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { ProductItem } from '../types/admin';

export const InventoryPage: React.FC = () => {
  const {
    products,
    categories,
    cities,
    areas,
    stores,
    areaPricing,
    saveVariantAreaPrice,
    updateProductPrice,
    updateProduct,
    updateVariant,
    setShowAddProductModal,
    setEditingProductForModal,
    refreshData,
    selectedCityFilter: selectedCityId,
    setSelectedCityFilter: setSelectedCityId,
    selectedAreaFilter: selectedAreaId,
    setSelectedAreaFilter: setSelectedAreaId,
    selectedStoreFilter,
    setSelectedStoreFilter,
  } = useAdmin();

  // Tabs: All Items, Low Stock, Expired / Out of Stock
  const [activeTab, setActiveTab] = useState<'All Items' | 'Low Stock' | 'Expired'>('All Items');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // Inline Price Edit
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);

  // Inline Stock Edit
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<string>('');
  const [savingStock, setSavingStock] = useState(false);

  // Variant-Wise Stock Dropdown & Edit
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [editingVarStockId, setEditingVarStockId] = useState<string | null>(null);
  const [editingVarStockValue, setEditingVarStockValue] = useState<string>('');
  const [savingVarStock, setSavingVarStock] = useState(false);

  // Inline Shelf / Bin Location Edit (A1-R2)
  const [shelfLocations, setShelfLocations] = useState<Record<string, string>>({
    default: 'A1-R2',
  });
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editingShelfValue, setEditingShelfValue] = useState<string>('');

  // Stock Discrepancy Audit Modal State
  const [auditProduct, setAuditProduct] = useState<ProductItem | null>(null);
  const [auditPhysicalStock, setAuditPhysicalStock] = useState<string>('');
  const [auditReason, setAuditReason] = useState<'Damaged / Spoilage' | 'Shrinkage / Theft' | 'Miscount Correction' | 'Expired Stock'>('Miscount Correction');
  const [auditSubmitting, setAuditSubmitting] = useState(false);
  const [auditSuccessBanner, setAuditSuccessBanner] = useState<string | null>(null);

  // 1. Resolve Active Cities
  const activeCities = cities.filter((c) => c.isActive !== false);
  const currentCity =
    activeCities.find((c) => c.id === selectedCityId || c._id === selectedCityId || c.name.toLowerCase() === selectedCityId.toLowerCase()) ||
    activeCities[0];

  // 2. Resolve Available Areas for Selected City
  const availableAreas = areas.filter((a) => {
    if (!currentCity) return true;
    return (
      a.cityName?.toLowerCase() === currentCity.name.toLowerCase() ||
      a.cityId === currentCity.id ||
      a.cityId === currentCity._id
    );
  });

  const currentArea =
    availableAreas.find((a) => a.id === selectedAreaId || a._id === selectedAreaId || a.name.toLowerCase() === selectedAreaId.toLowerCase()) ||
    (selectedAreaId === 'ALL' ? null : availableAreas[0]);

  // Fast Area Pricing lookup map: variantId -> areaId -> { price, mrp, stock }
  const areaPricingMap = React.useMemo(() => {
    const map = new Map<string, Map<string, { price: number; mrp?: number; stock?: number }>>();
    (areaPricing || []).forEach((ap) => {
      const vId = String(ap.variantId);
      const aId = String(ap.areaId);
      if (!map.has(vId)) map.set(vId, new Map());
      map.get(vId)!.set(aId, { price: ap.price, mrp: ap.mrp, stock: ap.stock });
    });
    return map;
  }, [areaPricing]);

  // Helper: Get effective variant price, mrp, and stock for the selected area
  const getEffectiveVariantData = (variant: any) => {
    if (!variant) return { price: 0, mrp: 0, stock: 50, isAreaCustom: false };
    const vId = String(variant.id || variant._id || '');
    if (selectedAreaId !== 'ALL' && currentArea) {
      const aId = String(currentArea.id || currentArea._id || '');
      const ap = areaPricingMap.get(vId)?.get(aId);
      if (ap) {
        return {
          price: ap.price,
          mrp: ap.mrp !== undefined && ap.mrp > 0 ? ap.mrp : (variant.mrp || variant.sellingPrice),
          stock: ap.stock !== undefined ? ap.stock : (variant.stock ?? 50),
          isAreaCustom: true,
        };
      }
    }
    return {
      price: variant.sellingPrice,
      mrp: variant.mrp || variant.sellingPrice,
      stock: variant.stock !== undefined ? variant.stock : 50,
      isAreaCustom: false,
    };
  };

  // 3. Resolve all stores operating in the selected area
  const storesInSelectedArea = React.useMemo(() => {
    if (selectedAreaId === 'ALL' || !currentArea) {
      if (!currentCity) return stores;
      return stores.filter(
        (s) =>
          s.cityName?.toLowerCase() === currentCity.name.toLowerCase() ||
          s.cityId === currentCity.id ||
          s.cityId === currentCity._id
      );
    }
    const aId = currentArea.id || currentArea._id;
    return stores.filter((s) => {
      if (s.areaId && aId && String(s.areaId) === String(aId)) return true;
      if (s.areaName && currentArea.name && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
      return false;
    });
  }, [stores, selectedAreaId, currentArea, currentCity]);

  // Active Store: If user selected a specific store in the dropdown, lock to that store
  const resolvedStore = React.useMemo(() => {
    if (selectedStoreFilter && selectedStoreFilter !== 'ALL') {
      const found = storesInSelectedArea.find(
        (s) => (s.id || s._id) === selectedStoreFilter || s.name === selectedStoreFilter
      );
      if (found) return found;
    }
    return storesInSelectedArea[0] || stores[0];
  }, [storesInSelectedArea, selectedStoreFilter, stores]);

  const currentStoreName =
    selectedStoreFilter === 'ALL' && storesInSelectedArea.length > 1
      ? `All Stores in ${currentArea?.name || 'Area'} (${storesInSelectedArea.length} Hubs)`
      : resolvedStore
      ? resolvedStore.name
      : 'Wom Up Central Dark Store';

  // Stock calculations
  const totalStockKg = products.reduce((sum, p) => {
    if (selectedAreaId !== 'ALL' && currentArea && p.variants && p.variants.length > 0) {
      const areaVarStock = p.variants.reduce((vSum: number, v: any) => {
        const vd = getEffectiveVariantData(v);
        return vSum + (vd.stock || 0);
      }, 0);
      if (areaVarStock > 0) return sum + areaVarStock;
    }
    return sum + (Number(p.stock) || 50);
  }, 0);
  const availableStockKg = Math.round(totalStockKg * 0.88);
  const reservedStockKg = totalStockKg - availableStockKg;

  const lowStockCount = products.filter((p) => (p.stock || 50) < 15).length;
  const outOfStockCount = products.filter((p) => (p.stock || 50) <= 0).length;

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q));

    const matchCategory =
      selectedCategory === 'ALL' ||
      p.category === selectedCategory ||
      p.categoryId === selectedCategory;

    let matchTab = true;
    const stockVal = p.stock !== undefined ? p.stock : 50;
    if (activeTab === 'Low Stock') {
      matchTab = stockVal > 0 && stockVal < 15;
    } else if (activeTab === 'Expired') {
      matchTab = stockVal <= 0;
    }

    return matchSearch && matchCategory && matchTab;
  });

  // Action handlers
  const startEditPrice = (prod: ProductItem) => {
    setEditingPriceId(prod.id || prod._id || '');
    setEditingPriceValue(String(prod.sellingPrice));
  };

  const handleSavePrice = async (prod: ProductItem) => {
    const newPrice = parseFloat(editingPriceValue);
    if (isNaN(newPrice) || newPrice <= 0) return;

    setSavingPrice(true);
    if (selectedAreaId !== 'ALL' && currentArea) {
      const prodId = prod.id || prod._id || '';
      const currentVarId =
        selectedVariants[prodId] ||
        (prod.variants && prod.variants[0] ? (prod.variants[0].id || prod.variants[0]._id || '') : '');
      const curVar = (prod.variants || []).find((v: any) => (v.id || v._id) === currentVarId) || (prod.variants && prod.variants[0]);
      if (curVar) {
        const curData = getEffectiveVariantData(curVar);
        await saveVariantAreaPrice({
          productId: prodId,
          variantId: curVar.id || curVar._id || '',
          areaId: currentArea.id || currentArea._id || '',
          price: newPrice,
          mrp: curData.mrp,
          stock: curData.stock,
        });
      } else {
        await updateProductPrice(prod.name, newPrice);
      }
    } else {
      await updateProductPrice(prod.name, newPrice);
    }
    await refreshData();
    setSavingPrice(false);
    setEditingPriceId(null);
  };

  const handleSaveStock = async (prod: ProductItem) => {
    const newStock = parseInt(editingStockValue, 10);
    if (isNaN(newStock) || newStock < 0) return;

    setSavingStock(true);
    if (selectedAreaId !== 'ALL' && currentArea) {
      const prodId = prod.id || prod._id || '';
      const currentVarId =
        selectedVariants[prodId] ||
        (prod.variants && prod.variants[0] ? (prod.variants[0].id || prod.variants[0]._id || '') : '');
      const curVar = (prod.variants || []).find((v: any) => (v.id || v._id) === currentVarId) || (prod.variants && prod.variants[0]);
      if (curVar) {
        const curData = getEffectiveVariantData(curVar);
        await saveVariantAreaPrice({
          productId: prodId,
          variantId: curVar.id || curVar._id || '',
          areaId: currentArea.id || currentArea._id || '',
          price: curData.price,
          mrp: curData.mrp,
          stock: newStock,
        });
      } else {
        await updateProduct(prod.id || prod._id || '', { stock: newStock });
      }
    } else {
      await updateProduct(prod.id || prod._id || '', { stock: newStock });
    }
    await refreshData();
    setSavingStock(false);
    setEditingStockId(null);
  };

  const handleSaveShelf = (prodId: string) => {
    if (!editingShelfValue.trim()) return;
    setShelfLocations((prev) => ({
      ...prev,
      [prodId]: editingShelfValue.trim(),
    }));
    setEditingShelfId(null);
  };

  const handleOpenAuditModal = (prod: ProductItem) => {
    setAuditProduct(prod);
    setAuditPhysicalStock(String(prod.stock !== undefined ? prod.stock : 50));
    setAuditReason('Miscount Correction');
    setAuditSuccessBanner(null);
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditProduct) return;
    setAuditSubmitting(true);
    const parsedStock = parseInt(auditPhysicalStock, 10);
    if (!isNaN(parsedStock) && parsedStock >= 0) {
      auditProduct.stock = parsedStock;
      await updateProduct(auditProduct.id || auditProduct._id || '', { stock: parsedStock });
      await refreshData();
    }
    setAuditSubmitting(false);
    setAuditSuccessBanner(`Physical audit logged for ${auditProduct.name}! New stock: ${parsedStock} units.`);
    setTimeout(() => {
      setAuditProduct(null);
      setAuditSuccessBanner(null);
    }, 1500);
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
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
            Warehouse Inventory Control
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Filter by City & Area — inventory automatically locked to that zone's 1:1 Dark Store
          </p>
        </div>

        <button
          onClick={() => setShowAddProductModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>+ Add Product Item</span>
        </button>
      </div>

      {/* 2-Step Cascading Selector (City & Area) */}
      <div
        className="admin-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {/* STEP 1: CITY */}
          <div>
            <label
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#64748B',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px',
              }}
            >
              <MapPin size={13} color="#4F46E5" />
              <span>STEP 1: SELECT CITY</span>
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => {
                setSelectedCityId(e.target.value);
                setSelectedAreaId('ALL');
                setSelectedStoreFilter('ALL');
              }}
              className="form-select"
              style={{ fontWeight: 700, color: '#071B52' }}
            >
              {activeCities.map((c) => (
                <option key={c.id || c._id} value={c.name}>
                  {c.name} ({c.code || 'AMD'})
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: AREA (1:1 STORE) */}
          <div>
            <label
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#64748B',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px',
              }}
            >
              <Navigation size={13} color="#0D9488" />
              <span>STEP 2: SELECT AREA / ZONE</span>
            </label>
            <select
              value={selectedAreaId}
              onChange={(e) => {
                setSelectedAreaId(e.target.value);
                setSelectedStoreFilter('ALL');
              }}
              className="form-select"
              style={{ fontWeight: 700, color: '#071B52' }}
            >
              <option value="ALL">All City Areas ({availableAreas.length})</option>
              {availableAreas.map((a) => (
                <option key={a.id || a._id} value={a.name}>
                  {a.name} • {a.code || 'ZONE'}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 3: STORE IN AREA */}
          <div>
            <label
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#64748B',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px',
              }}
            >
              <Warehouse size={13} color="#FF3B98" />
              <span>
                STEP 3: SELECT STORE ({storesInSelectedArea.length} IN {currentArea ? currentArea.name.toUpperCase() : 'ZONE'})
              </span>
            </label>
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              className="form-select"
              style={{ fontWeight: 700, color: '#071B52' }}
            >
              <option value="ALL">
                All Stores in {currentArea ? currentArea.name : 'Area'} ({storesInSelectedArea.length})
              </option>
              {storesInSelectedArea.map((st) => (
                <option key={st.id || st._id} value={st.id || st._id}>
                  {st.name} {st.code ? `(${st.code})` : ''} {st.isActive === false ? '[OFFLINE]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fulfilling Dark Store Locked Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F0F4FF 0%, #FAF5FF 100%)',
            border: '1px solid #C7D2FE',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}
            >
              <Warehouse size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.94rem', color: '#071B52' }}>
                  {currentStoreName}
                </strong>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: selectedStoreFilter !== 'ALL' ? '#047857' : '#4F46E5',
                    background: selectedStoreFilter !== 'ALL' ? '#ECFDF5' : '#EEF2FF',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    border: `1px solid ${selectedStoreFilter !== 'ALL' ? '#A7F3D0' : '#C7D2FE'}`,
                  }}
                >
                  <Lock size={10} />
                  <span>
                    {selectedStoreFilter !== 'ALL'
                      ? 'LOCKED TO SELECTED STORE'
                      : storesInSelectedArea.length > 1
                      ? `MULTI-STORE ZONE (${storesInSelectedArea.length} STORES)`
                      : '1:1 AREA LOCKED'}
                  </span>
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748B' }}>
                📍 Area: <strong style={{ color: '#071B52' }}>{currentArea?.name || 'All Areas'}</strong> • City:{' '}
                <strong style={{ color: '#071B52' }}>{currentCity?.name}</strong>
                {resolvedStore && (
                  <>
                    {' '}• Hub Code:{' '}
                    <strong style={{ color: '#FF3B98', fontFamily: 'var(--font-mono)' }}>
                      {resolvedStore.code || (resolvedStore as any).hubCode || 'AMD-HUB-01'}
                    </strong>
                    {selectedStoreFilter !== 'ALL' && (
                      <>
                        {' '}• Status:{' '}
                        <span style={{ color: resolvedStore.isActive !== false ? '#15803D' : '#DC2626', fontWeight: 800 }}>
                          {resolvedStore.isActive !== false ? '● ACTIVE ON-SHIFT' : '○ OFFLINE'}
                        </span>
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (Total Stock, Available, Reserved) */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px' }}>
              Total Warehouse Stock
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
              {totalStockKg.toLocaleString()} units
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0' }}>
              Across {products.length} SKUs in catalog
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
            <Package size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', margin: '0 0 2px' }}>
              Available for Dispatch
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#065F46', margin: 0 }}>
              {availableStockKg.toLocaleString()} units
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, margin: '4px 0 0' }}>
              88% Available Free Stock
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
            <Check size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', margin: '0 0 2px' }}>
              Reserved for Live Orders
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#5B21B6', margin: 0 }}>
              {reservedStockKg.toLocaleString()} units
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#8B5CF6', fontWeight: 700, margin: '4px 0 0' }}>
              Live Cart / Packing Locks
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* Tabs Row: All Items, Low Stock, Expired */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['All Items', 'Low Stock', 'Expired'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            const count =
              tab === 'All Items'
                ? products.length
                : tab === 'Low Stock'
                ? lowStockCount
                : outOfStockCount;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid #071B52' : '1px solid #E2E8F0',
                  background: isSelected ? '#071B52' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab}</span>
                <span
                  style={{
                    fontSize: '0.70rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#071B52',
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar: Category + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
            style={{ width: '180px', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id || c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={14}
              color="#94A3B8"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search SKU, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.80rem' }}
            />
          </div>
        </div>
      </div>

      {/* Inventory Master Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product SKU & Title</th>
              <th>Category</th>
              <th>Shelf Location</th>
              <th>MRP</th>
              <th>Selling Price</th>
              <th>Stock Level</th>
              <th>Variant-Wise Stock</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Audit / Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                  No inventory products match current warehouse filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const prodId = p.id || p._id || '';
                const currentVarId =
                  selectedVariants[prodId] ||
                  (p.variants && p.variants[0] ? (p.variants[0].id || p.variants[0]._id || '') : '');
                const currentVar =
                  (p.variants || []).find((v: any) => (v.id || v._id) === currentVarId) || (p.variants && p.variants[0]);

                const currentVarData = currentVar ? getEffectiveVariantData(currentVar) : null;
                const defaultVar = p.variants?.find((v: any) => v.isDefault) || p.variants?.[0];
                const defaultVarData = defaultVar ? getEffectiveVariantData(defaultVar) : null;

                const effectiveSellingPrice = currentVarData ? currentVarData.price : (defaultVarData ? defaultVarData.price : p.sellingPrice);
                const effectiveMrp = currentVarData ? currentVarData.mrp : (defaultVarData ? defaultVarData.mrp : (p.mrp || p.sellingPrice));
                const stockVal = currentVarData ? currentVarData.stock : (p.stock !== undefined ? p.stock : 50);

                const isEditingPrice = editingPriceId === (p.id || p._id);
                const isEditingShelf = editingShelfId === (p.id || p._id);
                const currentShelf = shelfLocations[p.id || p._id || ''] || 'A1-R2';

                return (
                  <tr key={p.id || p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              backgroundColor: '#EFF6FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#1D4ED8',
                            }}
                          >
                            <Package size={18} />
                          </div>
                        )}
                        <div>
                          <strong style={{ fontSize: '0.86rem', color: '#071B52', display: 'block' }}>
                            {p.name}
                          </strong>
                          <span
                            style={{
                              fontSize: '0.70rem',
                              color: '#FF3B98',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                            }}
                          >
                            {p.sku || `SKU-${(p.id || p._id || '').slice(-6)}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-navy" style={{ fontSize: '0.72rem' }}>
                        {p.category || 'Grocery'}
                      </span>
                    </td>

                    {/* Shelf Location Inline Editor */}
                    <td>
                      {isEditingShelf ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={editingShelfValue}
                            onChange={(e) => setEditingShelfValue(e.target.value)}
                            style={{
                              width: '75px',
                              padding: '2px 6px',
                              fontSize: '0.78rem',
                              border: '1px solid #4F46E5',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono)',
                            }}
                          />
                          <button
                            onClick={() => handleSaveShelf(p.id || p._id || '')}
                            style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px' }}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingShelfId(p.id || p._id || '');
                            setEditingShelfValue(currentShelf);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            background: '#F1F5F9',
                            padding: '3px 7px',
                            borderRadius: '6px',
                            border: '1px dashed #CBD5E1',
                          }}
                          title="Click to edit shelf location"
                        >
                          <Warehouse size={12} color="#64748B" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#071B52', fontFamily: 'var(--font-mono)' }}>
                            {currentShelf}
                          </span>
                        </div>
                      )}
                    </td>

                    <td style={{ fontSize: '0.82rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                      ₹{effectiveMrp}
                    </td>

                    {/* Inline Price Editor */}
                    <td>
                      {isEditingPrice ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            style={{
                              width: '65px',
                              padding: '2px 6px',
                              fontSize: '0.82rem',
                              border: '1px solid #FF3B98',
                              borderRadius: '4px',
                            }}
                          />
                          <button
                            onClick={() => handleSavePrice(p)}
                            disabled={savingPrice}
                            style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '3px 5px' }}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditPrice(p)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title="Click to edit selling price"
                        >
                          <strong style={{ fontSize: '0.88rem', color: '#071B52' }}>
                            ₹{effectiveSellingPrice}
                          </strong>
                          {currentVarData?.isAreaCustom ? (
                            <span style={{ fontSize: '0.62rem', background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>
                              Zone
                            </span>
                          ) : (
                            <Edit2 size={11} color="#94A3B8" />
                          )}
                        </div>
                      )}
                    </td>

                    {/* Inline Stock Editor */}
                    <td>
                      {editingStockId === (p.id || p._id) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={editingStockValue}
                            onChange={(e) => setEditingStockValue(e.target.value)}
                            style={{
                              width: '60px',
                              padding: '2px 6px',
                              fontSize: '0.82rem',
                              border: '1px solid #10B981',
                              borderRadius: '4px',
                            }}
                          />
                          <button
                            onClick={() => handleSaveStock(p)}
                            disabled={savingStock}
                            style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '3px 5px' }}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingStockId(p.id || p._id || '');
                            setEditingStockValue(String(stockVal));
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title="Click to edit stock level"
                        >
                          <strong style={{ fontSize: '0.86rem', color: stockVal < 15 ? '#DC2626' : '#071B52' }}>
                            {stockVal} units
                          </strong>
                          {currentVarData?.isAreaCustom && (
                            <span style={{ fontSize: '0.60rem', background: '#F0FDF4', color: '#16A34A', fontWeight: 700, padding: '1px 4px', borderRadius: '3px' }}>
                              Area
                            </span>
                          )}
                          <Edit2 size={11} color="#94A3B8" />
                        </div>
                      )}
                    </td>

                    {/* Variant-Wise Stock Dropdown & Status */}
                    <td>
                      {p.variants && p.variants.length > 0 ? (
                        (() => {
                          const isEditingThisVar = editingVarStockId === (currentVar?.id || currentVar?._id);

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '185px' }}>
                              {/* Dropdown Selector */}
                              <div style={{ position: 'relative' }}>
                                <select
                                  value={currentVarId}
                                  onChange={(e) =>
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [prodId]: e.target.value,
                                    }))
                                  }
                                  style={{
                                    width: '100%',
                                    padding: '5px 24px 5px 8px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1.5px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    color: '#071B52',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  }}
                                >
                                  {p.variants.map((v) => {
                                    const vData = getEffectiveVariantData(v);
                                    const vLabel = v.weightOrVolume || v.sku || 'Variant';
                                    return (
                                      <option key={v.id || v._id} value={v.id || v._id}>
                                        {vLabel} — {vData.stock} units (₹{vData.price})
                                      </option>
                                    );
                                  })}
                                </select>
                                <ChevronDown
                                  size={13}
                                  color="#64748B"
                                  style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                  }}
                                />
                              </div>

                              {/* Selected Variant Stock Badge & Inline Quick Edit */}
                              {currentVar && currentVarData && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.70rem', color: '#64748B', fontWeight: 600 }}>
                                    {currentVar.weightOrVolume}:
                                  </span>

                                  {isEditingThisVar ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <input
                                        type="number"
                                        value={editingVarStockValue}
                                        onChange={(e) => setEditingVarStockValue(e.target.value)}
                                        style={{
                                          width: '50px',
                                          padding: '2px 4px',
                                          fontSize: '0.75rem',
                                          border: '1px solid #10B981',
                                          borderRadius: '4px',
                                        }}
                                      />
                                      <button
                                        onClick={async () => {
                                          const val = parseInt(editingVarStockValue, 10);
                                          if (!isNaN(val) && val >= 0) {
                                            setSavingVarStock(true);
                                            if (selectedAreaId !== 'ALL' && currentArea) {
                                              await saveVariantAreaPrice({
                                                productId: p.id || p._id || '',
                                                variantId: currentVar.id || currentVar._id || '',
                                                areaId: currentArea.id || currentArea._id || '',
                                                price: currentVarData.price,
                                                mrp: currentVarData.mrp,
                                                stock: val,
                                              });
                                            } else {
                                              await updateVariant(currentVar.id || currentVar._id || '', { stock: val });
                                            }
                                            await refreshData();
                                            setSavingVarStock(false);
                                            setEditingVarStockId(null);
                                          }
                                        }}
                                        disabled={savingVarStock}
                                        style={{
                                          background: '#10B981',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          padding: '2px 4px',
                                        }}
                                      >
                                        <Check size={11} />
                                      </button>
                                      <button
                                        onClick={() => setEditingVarStockId(null)}
                                        style={{
                                          background: '#EF4444',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          padding: '2px 4px',
                                        }}
                                      >
                                        <X size={11} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => {
                                        setEditingVarStockId(currentVar.id || currentVar._id || '');
                                        setEditingVarStockValue(String(currentVarData.stock));
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        background: currentVarData.stock <= 0 ? '#FEF2F2' : currentVarData.stock < 15 ? '#FFFBEB' : '#F0FDF4',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        border: `1px solid ${currentVarData.stock <= 0 ? '#FECACA' : currentVarData.stock < 15 ? '#FDE68A' : '#BBF7D0'}`,
                                      }}
                                      title="Click to edit variant stock in this area"
                                    >
                                      <strong
                                        style={{
                                          fontSize: '0.72rem',
                                          color: currentVarData.stock <= 0 ? '#DC2626' : currentVarData.stock < 15 ? '#D97706' : '#16A34A',
                                        }}
                                      >
                                        {currentVarData.stock} units
                                      </strong>
                                      {currentVarData.isAreaCustom && (
                                        <span style={{ fontSize: '0.60rem', background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, padding: '0 3px', borderRadius: '3px' }}>
                                          Zone
                                        </span>
                                      )}
                                      <Edit2 size={10} color="#94A3B8" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#F8FAFC',
                            padding: '3px 7px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                            {p.unit || 'Standard'}:
                          </span>
                          <strong style={{ fontSize: '0.74rem', color: '#071B52' }}>
                            {stockVal} units
                          </strong>
                        </div>
                      )}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          stockVal <= 0 ? 'badge-red' : stockVal < 15 ? 'badge-amber' : 'badge-emerald'
                        }`}
                      >
                        {stockVal <= 0 ? 'OUT OF STOCK' : stockVal < 15 ? 'LOW STOCK' : 'IN STOCK'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => setEditingProductForModal(p)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Edit Product Master & Variants"
                        >
                          <Edit2 size={12} color="#071B52" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleOpenAuditModal(p)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Audit Physical Stock"
                        >
                          <ClipboardList size={13} color="#4F46E5" />
                          <span>Audit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* STOCK DISCREPANCY AUDIT MODAL (100% Mobile App Parity)                    */}
      {/* ========================================================================= */}
      {auditProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={20} color="#4F46E5" />
                <h4 style={{ margin: 0, color: '#071B52' }}>Stock Discrepancy Audit</h4>
              </div>
              <button
                onClick={() => setAuditProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuditSubmit}>
              <div className="modal-body">
                {auditSuccessBanner && (
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px', borderRadius: '8px', color: '#065F46', fontSize: '0.80rem', marginBottom: '12px' }}>
                    {auditSuccessBanner}
                  </div>
                )}

                <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '14px' }}>
                  Auditing inventory for <strong>{auditProduct.name}</strong> at{' '}
                  <strong style={{ color: '#071B52' }}>{currentStoreName}</strong>.
                </p>

                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.80rem', color: '#64748B' }}>System Recorded Stock:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#071B52' }}>
                    {auditProduct.stock !== undefined ? auditProduct.stock : 50} units
                  </strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Count Observed *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={auditPhysicalStock}
                    onChange={(e) => setAuditPhysicalStock(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Audit Discrepancy Reason *</label>
                  <select
                    value={auditReason}
                    onChange={(e) => setAuditReason(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="Miscount Correction">Miscount Correction</option>
                    <option value="Damaged / Spoilage">Damaged / Spoilage</option>
                    <option value="Shrinkage / Theft">Shrinkage / Theft</option>
                    <option value="Expired Stock">Expired Stock</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setAuditProduct(null)}
                  className="btn btn-secondary"
                  disabled={auditSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={auditSubmitting}
                >
                  {auditSubmitting ? 'Updating...' : 'Commit Stock Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
