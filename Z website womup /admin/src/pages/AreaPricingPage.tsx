import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Store,
  Lock,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Table as TableIcon,
  Package,
  Zap,
  X,
  Check,
  RefreshCw,
  Coins,
  History,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { ProductItem, ProductVariantItem, AreaPricingRecord } from '../types/admin';

export const AreaPricingPage: React.FC = () => {
  const {
    cities,
    areas,
    stores,
    products,
    productVariants,
    areaPricing,
    categories,
    saveVariantAreaPrice,
    updateVariant,
    deleteProduct,
    setShowAddProductModal,
    refreshData,
    isSyncing,
  } = useAdmin();

  // Primary Tab
  const [activeTabMode, setActiveTabMode] = useState<'PRODUCT_PRICING' | 'DELIVERY_SURGE'>('PRODUCT_PRICING');

  // Step 1: Selected City
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  // Step 2: Selected Area
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');

  // Step 3: Selected Store in Area
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');

  // Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collapsed product card states
  const [collapsedProducts, setCollapsedProducts] = useState<Record<string, boolean>>({});

  // Modals state
  const [editPriceModal, setEditPriceModal] = useState<{
    product: ProductItem;
    variant: ProductVariantItem;
    currentAreaPrice: number;
    currentStock: number;
  } | null>(null);

  const [editDefaultPriceInput, setEditDefaultPriceInput] = useState<string>('');
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [editMrpInput, setEditMrpInput] = useState<string>('');
  const [editStockInput, setEditStockInput] = useState<string>('100');
  const [isSavingPrice, setIsSavingPrice] = useState<boolean>(false);
  const [priceModalError, setPriceModalError] = useState<string | null>(null);

  // Cross Zone Matrix Modal
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [matrixVariantId, setMatrixVariantId] = useState<string>('');

  // Bulk Adjust Modal
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState<string>('5');
  const [bulkAction, setBulkAction] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [isApplyingBulk, setIsApplyingBulk] = useState<boolean>(false);

  // 1. Resolve Active Cities
  const activeCities = useMemo(() => {
    return cities.filter((c) => c.isActive !== false);
  }, [cities]);

  // Current City
  const currentCity = useMemo(() => {
    if (selectedCityId) {
      const found = activeCities.find((c) => c.id === selectedCityId || c.code === selectedCityId);
      if (found) return found;
    }
    return (
      activeCities.find((c) => c.name.toLowerCase().includes('ahmedabad') || c.code === 'AMD') ||
      activeCities[0] || { id: 'city_1', name: 'Ahmedabad', code: 'AMD', state: 'Gujarat' }
    );
  }, [activeCities, selectedCityId]);

  // 2. Resolve Available Areas for Current City
  const availableAreas = useMemo(() => {
    return areas.filter((a) => {
      if (!currentCity) return true;
      const cityIdStr = currentCity.id || (currentCity as any)._id;
      if (a.cityId && cityIdStr && String(a.cityId) === String(cityIdStr)) return true;
      if (a.cityName && currentCity.name && a.cityName.toLowerCase() === currentCity.name.toLowerCase()) return true;
      return true; // fallback to show areas
    });
  }, [areas, currentCity]);

  // Current Selected Area
  const currentArea = useMemo(() => {
    if (selectedAreaId) {
      const found = availableAreas.find((a) => a.id === selectedAreaId || a._id === selectedAreaId || a.name === selectedAreaId);
      if (found) return found;
    }
    // Default to Satellite or first available
    return (
      availableAreas.find((a) => a.name.toLowerCase().includes('satellite')) ||
      availableAreas[0] || { id: 'area_sat', name: 'Satellite', code: 'SATELLITE', cityName: 'Ahmedabad' }
    );
  }, [availableAreas, selectedAreaId]);

  // 3. Resolve all stores operating in this area
  const storesInSelectedArea = useMemo(() => {
    if (!currentArea) return stores;
    const aId = currentArea.id || currentArea._id;
    return stores.filter((s) => {
      if (s.areaId && aId && String(s.areaId) === String(aId)) return true;
      if (s.areaName && currentArea.name && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
      if (s.name.toLowerCase().includes(currentArea.name.toLowerCase())) return true;
      return false;
    });
  }, [stores, currentArea]);

  // Active Store: If specific store is selected in dropdown, lock to that store
  const resolvedStore = useMemo(() => {
    if (selectedStoreId !== 'ALL') {
      const found = storesInSelectedArea.find((s) => (s.id || s._id) === selectedStoreId || s.name === selectedStoreId);
      if (found) return found;
    }
    return storesInSelectedArea[0] || stores[0] || null;
  }, [storesInSelectedArea, selectedStoreId, stores]);

  // Fast Area Pricing lookup map: variantId -> areaId -> price
  const areaPricingMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    areaPricing.forEach((ap) => {
      const vId = String(ap.variantId);
      const aId = String(ap.areaId);
      if (!map.has(vId)) map.set(vId, new Map());
      map.get(vId)!.set(aId, ap.price);
    });
    return map;
  }, [areaPricing]);

  // Helper: Get zone price for variant
  const getVariantPriceInArea = (variant: ProductVariantItem, areaId: string) => {
    const vId = String(variant.id || variant._id);
    const aId = String(areaId);
    const override = areaPricingMap.get(vId)?.get(aId);
    if (override !== undefined && override !== null && override > 0) {
      return { price: override, isOverridden: true };
    }
    return { price: variant.sellingPrice, isOverridden: false };
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'ALL' ||
        p.category === selectedCategory ||
        p.categoryId === selectedCategory ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Product counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: products.length };
    categories.forEach((c) => {
      counts[c.name] = products.filter(
        (p) => p.category === c.name || p.categoryId === c.id || (p.category && p.category.toLowerCase() === c.slug.toLowerCase())
      ).length;
    });
    return counts;
  }, [categories, products]);

  // Toggle Collapse
  const toggleCollapse = (prodId: string) => {
    setCollapsedProducts((prev) => ({
      ...prev,
      [prodId]: !prev[prodId],
    }));
  };

  // Open Edit Price Modal
  const openEditModal = (product: ProductItem, variant: ProductVariantItem) => {
    const areaId = currentArea.id || currentArea._id || '';
    const { price } = getVariantPriceInArea(variant, areaId);
    setEditPriceModal({
      product,
      variant,
      currentAreaPrice: price,
      currentStock: variant.stock ?? 100,
    });
    setEditDefaultPriceInput(String(variant.sellingPrice || product.sellingPrice || price));
    setEditPriceInput(String(price));
    setEditMrpInput(String(variant.mrp || product.mrp || price));
    setEditStockInput(String(variant.stock ?? 100));
    setPriceModalError(null);
  };

  // Save Price
  const handleSavePrice = async () => {
    if (!editPriceModal) return;
    setPriceModalError(null);

    const parsedDefault = parseFloat(editDefaultPriceInput);
    const parsedAreaPrice = parseFloat(editPriceInput);
    const parsedMrp = parseFloat(editMrpInput);
    const parsedStock = parseInt(editStockInput, 10);

    if (isNaN(parsedDefault) || parsedDefault <= 0) {
      setPriceModalError('Please enter a valid Catalog Default Price.');
      return;
    }
    if (isNaN(parsedAreaPrice) || parsedAreaPrice <= 0) {
      setPriceModalError('Please enter a valid Area Selling Price.');
      return;
    }
    if (isNaN(parsedMrp) || parsedMrp <= 0) {
      setPriceModalError('Please enter a valid MRP.');
      return;
    }

    if (parsedAreaPrice > parsedMrp) {
      setPriceModalError(`Area selling price (₹${parsedAreaPrice}) cannot exceed MRP (₹${parsedMrp}).`);
      return;
    }
    if (parsedDefault > parsedMrp) {
      setPriceModalError(`Catalog default price (₹${parsedDefault}) cannot exceed MRP (₹${parsedMrp}).`);
      return;
    }

    setIsSavingPrice(true);
    const areaId = currentArea.id || currentArea._id || '';
    const variantId = editPriceModal.variant.id || editPriceModal.variant._id || '';
    const productId = editPriceModal.product.id || editPriceModal.product._id || '';

    // 1. Save Area Price override
    const success = await saveVariantAreaPrice({
      productId,
      variantId,
      areaId,
      price: parsedAreaPrice,
      mrp: parsedMrp,
      stock: isNaN(parsedStock) ? 100 : parsedStock,
    });

    // 2. If Catalog Default or MRP changed, update variant default in database
    if (
      parsedDefault !== editPriceModal.variant.sellingPrice ||
      parsedMrp !== (editPriceModal.variant.mrp || editPriceModal.product.mrp)
    ) {
      await updateVariant(variantId, {
        sellingPrice: parsedDefault,
        mrp: parsedMrp,
        stock: isNaN(parsedStock) ? undefined : parsedStock,
      });
    }

    setIsSavingPrice(false);

    if (success) {
      setEditPriceModal(null);
    } else {
      setPriceModalError('Failed to save price override. Please check network/server.');
    }
  };

  // Delete product
  const handleDeleteProduct = async (product: ProductItem) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This removes it across all areas.`)) {
      await deleteProduct(product.id || product._id || '');
    }
  };

  // Execute Bulk Adjust
  const handleApplyBulkAdjust = async () => {
    const val = parseFloat(bulkAdjustmentValue);
    if (isNaN(val) || val <= 0) return;
    setIsApplyingBulk(true);

    const areaId = currentArea.id || currentArea._id || '';
    for (const prod of filteredProducts) {
      const vars = prod.variants && prod.variants.length > 0 ? prod.variants : [
        {
          id: prod.id || prod._id || '',
          productId: prod.id || prod._id || '',
          sellingPrice: prod.sellingPrice,
          mrp: prod.mrp,
          weightOrVolume: prod.unit || '1 unit',
        } as ProductVariantItem
      ];

      for (const v of vars) {
        const { price } = getVariantPriceInArea(v, areaId);
        let newPrice = price;
        if (bulkAdjustmentType === 'PERCENT') {
          const delta = (price * val) / 100;
          newPrice = bulkAction === 'INCREASE' ? price + delta : Math.max(1, price - delta);
        } else {
          newPrice = bulkAction === 'INCREASE' ? price + val : Math.max(1, price - val);
        }
        newPrice = Math.round(newPrice);
        const mrp = v.mrp || prod.mrp || newPrice;
        if (newPrice > mrp) newPrice = mrp;

        await saveVariantAreaPrice({
          productId: prod.id || prod._id || '',
          variantId: v.id || v._id || '',
          areaId,
          price: newPrice,
          mrp,
        });
      }
    }

    setIsApplyingBulk(false);
    setShowBulkModal(false);
    refreshData();
  };

  // All variants list for matrix
  const allVariantsList = useMemo(() => {
    const list: Array<{ id: string; label: string; defaultPrice: number; mrp: number }> = [];
    products.forEach((p) => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          list.push({
            id: v.id || v._id || '',
            label: `${p.name} (${v.weightOrVolume || '1 unit'})`,
            defaultPrice: v.sellingPrice,
            mrp: v.mrp || v.sellingPrice,
          });
        });
      } else {
        list.push({
          id: p.id || p._id || '',
          label: p.name,
          defaultPrice: p.sellingPrice,
          mrp: p.mrp || p.sellingPrice,
        });
      }
    });
    return list;
  }, [products]);

  const selectedMatrixVariant = useMemo(() => {
    return allVariantsList.find((v) => v.id === matrixVariantId) || allVariantsList[0];
  }, [allVariantsList, matrixVariantId]);

  return (
    <div>
      {/* Top Header & Mode Tabs */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>💰</span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
              Area Dynamic Pricing
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '3px' }}>
            Configure hyper-local selling prices per Area (cascades from City) · Real-time MongoDB Atlas sync
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
            }}
          >
            <button
              onClick={() => setActiveTabMode('PRODUCT_PRICING')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTabMode === 'PRODUCT_PRICING' ? '#071B52' : 'transparent',
                color: activeTabMode === 'PRODUCT_PRICING' ? '#FFFFFF' : '#64748B',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Package size={14} />
              <span>Catalog Pricing Matrix</span>
            </button>
            <button
              onClick={() => setActiveTabMode('DELIVERY_SURGE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTabMode === 'DELIVERY_SURGE' ? '#071B52' : 'transparent',
                color: activeTabMode === 'DELIVERY_SURGE' ? '#FFFFFF' : '#64748B',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={14} />
              <span>Delivery Fees & Surge</span>
            </button>
          </div>

          <button
            onClick={() => refreshData()}
            className="btn btn-secondary btn-sm"
            title="Refresh prices from MongoDB Atlas"
            disabled={isSyncing}
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: PRODUCT PRICING MATRIX ================= */}
      {activeTabMode === 'PRODUCT_PRICING' ? (
        <>
          {/* Cascading 2-Step Selector Card (Matches Mobile App Steps 1 & 2) */}
          <div
            className="admin-card"
            style={{
              padding: '20px 24px',
              marginBottom: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '18px',
              }}
            >
              {/* STEP 1: SELECT CITY */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}
                >
                  STEP 1: SELECT CITY
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2
                    size={16}
                    color="#64748B"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <select
                    value={currentCity?.id || currentCity?.code || ''}
                    onChange={(e) => {
                      setSelectedCityId(e.target.value);
                      setSelectedAreaId('');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.90rem',
                      fontWeight: 700,
                      color: '#071B52',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {activeCities.map((c) => (
                      <option key={c.id || c.code} value={c.id || c.code}>
                        {c.name} ({c.state || 'Gujarat'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 2: SELECT AREA */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}
                >
                  STEP 2: SELECT AREA / ZONE
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin
                    size={16}
                    color="#FF3B98"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <select
                    value={currentArea?.id || currentArea?._id || currentArea?.name || ''}
                    onChange={(e) => {
                      setSelectedAreaId(e.target.value);
                      setSelectedStoreId('ALL');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.90rem',
                      fontWeight: 700,
                      color: '#071B52',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {availableAreas.map((a) => (
                      <option key={a.id || a._id || a.name} value={a.id || a._id || a.name}>
                        {a.name} (Pincodes: {a.pincodes?.join(', ') || 'Covered'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STEP 3: SELECT STORE IN AREA */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}
                >
                  STEP 3: SELECT STORE ({storesInSelectedArea.length} IN {currentArea?.name.toUpperCase() || 'ZONE'})
                </label>
                <div style={{ position: 'relative' }}>
                  <Store
                    size={16}
                    color="#6366F1"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.90rem',
                      fontWeight: 700,
                      color: '#071B52',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">
                      All Stores in {currentArea?.name || 'Area'} ({storesInSelectedArea.length})
                    </option>
                    {storesInSelectedArea.map((st) => (
                      <option key={st.id || st._id} value={st.id || st._id}>
                        {st.name} {st.code ? `(${st.code})` : ''} {st.isActive === false ? '[OFFLINE]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* FULFILLING STORE BANNER */}
            <div
              style={{
                backgroundColor: '#FDF2F8',
                border: '1px solid #FBCFE8',
                borderRadius: '12px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #F472B6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#DB2777',
                  }}
                >
                  <Store size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#071B52' }}>
                      {selectedStoreId === 'ALL' && storesInSelectedArea.length > 1
                        ? `All Stores in ${currentArea?.name || 'Area'} (${storesInSelectedArea.length} Hubs)`
                        : resolvedStore?.name || `Wom Up ${currentArea?.name} Dark Store`}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #FBCFE8',
                        color: '#DB2777',
                        fontSize: '0.70rem',
                        fontWeight: 800,
                      }}
                    >
                      <Lock size={10} />
                      <span>
                        {selectedStoreId !== 'ALL'
                          ? `STORE LOCKED · ${resolvedStore?.code || 'ACTIVE'}`
                          : storesInSelectedArea.length > 1
                          ? `MULTI-STORE ZONE (${storesInSelectedArea.length} STORES)`
                          : `1:1 AREA LOCKED · ${currentCity?.name}`}
                      </span>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                    Bound to area: <strong style={{ color: '#071B52' }}>{currentArea?.name}</strong> ({currentCity?.name}) ·{' '}
                    Hub Code: <strong style={{ color: '#DB2777' }}>{resolvedStore?.code || (resolvedStore as any)?.hubCode || 'AMD-HUB'}</strong> ·{' '}
                    SLA: {resolvedStore?.estimatedDeliveryMinutes || 9} min delivery
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowMatrixModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <TableIcon size={14} />
                  <span>Cross-Zone Matrix</span>
                </button>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <SlidersHorizontal size={14} />
                  <span>Bulk Adjust</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Badges / Pills (Horizontal Carousel) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '12px',
              marginBottom: '16px',
            }}
          >
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedCategory === 'ALL' ? '2px solid #071B52' : '1px solid #E2E8F0',
                backgroundColor: selectedCategory === 'ALL' ? '#071B52' : '#FFFFFF',
                color: selectedCategory === 'ALL' ? '#FFFFFF' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              All Categories ({categoryCounts['ALL'] || products.length})
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name || selectedCategory === cat.slug;
              const count = categoryCounts[cat.name] || 0;
              return (
                <button
                  key={cat.id || cat._id}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: isSelected ? '2px solid #FF3B98' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#FDF2F8' : '#FFFFFF',
                    color: isSelected ? '#BE185D' : '#475569',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cat.name}</span>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? '#FBCFE8' : '#F1F5F9',
                      color: isSelected ? '#9D174D' : '#64748B',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Catalog Section Header & Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                {selectedCategory === 'ALL' ? 'Catalog Master' : `${selectedCategory} Catalog`}
              </h3>
              <p style={{ fontSize: '0.80rem', color: '#64748B', margin: '2px 0 0' }}>
                {filteredProducts.length} products configured for {currentArea?.name} ({currentCity?.name})
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '450px', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter products or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 30px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Plus size={14} />
                <span>+ Add Item</span>
              </button>
            </div>
          </div>

          {/* Product Cards Accordion List (Matching Mobile App Design Exactly) */}
          {filteredProducts.length === 0 ? (
            <div
              className="admin-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748B',
              }}
            >
              <Package size={42} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#071B52' }}>No products found</div>
              <p style={{ fontSize: '0.82rem', margin: '4px 0 16px' }}>
                No products match the selected category & search in {currentArea?.name}.
              </p>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} />
                <span>Add Product to Catalog</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredProducts.map((product) => {
                const prodId = product.id || product._id || '';
                const isCollapsed = collapsedProducts[prodId] === true;
                const variants =
                  product.variants && product.variants.length > 0
                    ? product.variants
                    : [
                        {
                          id: prodId,
                          _id: prodId,
                          productId: prodId,
                          sku: product.sku || '',
                          weightOrVolume: product.unit || '1 unit',
                          sellingPrice: product.sellingPrice,
                          mrp: product.mrp,
                          isDefault: true,
                          stock: product.stock,
                        } as ProductVariantItem,
                      ];

                // Calculate lowest price in current area
                const areaPrices = variants.map((v) => getVariantPriceInArea(v, currentArea.id || currentArea._id || '').price);
                const minPrice = Math.min(...areaPrices);

                return (
                  <div
                    key={prodId}
                    className="admin-card"
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    {/* Product Card Header */}
                    <div
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#FFFFFF',
                        borderBottom: isCollapsed ? 'none' : '1px solid #F1F5F9',
                        cursor: 'pointer',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                      onClick={() => toggleCollapse(prodId)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Collapse Chevron */}
                        <div style={{ color: '#64748B' }}>
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                        </div>

                        {/* Product Image */}
                        {product.imageUrl || product.image ? (
                          <img
                            src={product.imageUrl || product.image}
                            alt={product.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid #E2E8F0',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              backgroundColor: '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94A3B8',
                            }}
                          >
                            <Package size={20} />
                          </div>
                        )}

                        {/* Title and metadata */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#071B52' }}>
                              {product.name}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#F3E8FF',
                                color: '#7E22CE',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                              }}
                            >
                              {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                            <strong style={{ color: '#071B52' }}>
                              {currentCity?.name} - {currentArea?.name}
                            </strong>{' '}
                            · From <strong style={{ color: '#FF3B98' }}>₹{minPrice}</strong> in {currentCity?.name} → {currentArea?.name} ·{' '}
                            <span style={{ color: '#10B981', fontWeight: 700 }}>● Active</span>
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          title="Delete Product"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #FEE2E2',
                            backgroundColor: '#FEF2F2',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Nested Variants Table (Expanded State) */}
                    {!isCollapsed && (
                      <div style={{ backgroundColor: '#FAFAFA', padding: '0 16px 16px' }}>
                        <div
                          style={{
                            overflowX: 'auto',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '10px',
                            border: '1px solid #E2E8F0',
                            marginTop: '12px',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                                  PACK / SKU
                                </th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                                  DEFAULT
                                </th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                                  AREA PRICE
                                </th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                                  MRP
                                </th>
                                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', fontSize: '0.70rem' }}>
                                  ACTION
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {variants.map((v) => {
                                const vId = v.id || v._id || '';
                                const areaId = currentArea.id || currentArea._id || '';
                                const { price: areaPrice, isOverridden } = getVariantPriceInArea(v, areaId);
                                const defaultPrice = v.sellingPrice;
                                const mrp = v.mrp || defaultPrice;

                                return (
                                  <tr
                                    key={vId}
                                    style={{
                                      borderBottom: '1px solid #F1F5F9',
                                      transition: 'background 0.15s ease',
                                    }}
                                  >
                                    {/* PACK / SKU */}
                                    <td style={{ padding: '12px 14px' }}>
                                      <div style={{ fontWeight: 800, color: '#071B52' }}>
                                        {v.weightOrVolume || '1 unit'}{' '}
                                        {v.isDefault && (
                                          <span style={{ fontSize: '0.70rem', color: '#7E22CE', fontWeight: 700 }}>
                                            (Default)
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                                        SKU: {v.sku || `${product.name.toLowerCase().replace(/\s+/g, '-')}-${v.weightOrVolume || 'unit'}`}
                                      </div>
                                    </td>

                                    {/* DEFAULT */}
                                    <td style={{ padding: '12px 14px' }}>
                                      <div style={{ fontWeight: 800, color: '#071B52', fontSize: '0.88rem' }}>
                                        ₹{defaultPrice}
                                      </div>
                                      <div style={{ fontSize: '0.70rem', color: '#94A3B8' }}>
                                        Catalog Base
                                      </div>
                                    </td>

                                    {/* AREA PRICE */}
                                    <td style={{ padding: '12px 14px' }}>
                                      {isOverridden ? (
                                        <div>
                                          <span
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '4px 10px',
                                              borderRadius: '8px',
                                              backgroundColor: '#F3E8FF',
                                              color: '#6B21A8',
                                              fontWeight: 900,
                                              fontSize: '0.88rem',
                                            }}
                                          >
                                            ₹{areaPrice}
                                          </span>
                                          <span style={{ display: 'block', fontSize: '0.70rem', color: '#7E22CE', fontWeight: 700, marginTop: '2px' }}>
                                            Area Override
                                          </span>
                                        </div>
                                      ) : (
                                        <div>
                                          <span
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '4px 8px',
                                              borderRadius: '8px',
                                              backgroundColor: '#F1F5F9',
                                              color: '#334155',
                                              fontWeight: 800,
                                              fontSize: '0.86rem',
                                            }}
                                          >
                                            ₹{areaPrice}
                                          </span>
                                          <span style={{ display: 'block', fontSize: '0.70rem', color: '#94A3B8', marginTop: '2px' }}>
                                            Standard Base
                                          </span>
                                        </div>
                                      )}
                                    </td>

                                    {/* MRP */}
                                    <td style={{ padding: '12px 14px', color: '#64748B', fontWeight: 600 }}>
                                      ₹{mrp}
                                    </td>

                                    {/* ACTION */}
                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                      <button
                                        onClick={() => openEditModal(product, v)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          padding: '5px 12px',
                                          borderRadius: '8px',
                                          backgroundColor: '#7C3AED',
                                          color: '#FFFFFF',
                                          border: 'none',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'background 0.15s ease',
                                        }}
                                      >
                                        <Edit2 size={12} />
                                        <span>Edit</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ================= TAB 2: DELIVERY FEES & SURGE MATRIX ================= */
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Zone / Area</th>
                <th>City</th>
                <th>Base Delivery Fee</th>
                <th>Free Delivery Threshold</th>
                <th>Dynamic Surge Multiplier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id || a._id}>
                  <td style={{ fontWeight: 800, color: '#071B52' }}>{a.name}</td>
                  <td>{a.cityName || 'Ahmedabad'}</td>
                  <td style={{ fontWeight: 700 }}>₹{a.baseDeliveryFee || 15}</td>
                  <td style={{ fontWeight: 700, color: '#10B981' }}>Orders above ₹199</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: (a.surgeMultiplier || 1.0) > 1.0 ? '#FFFBEB' : '#F1F5F9',
                        color: (a.surgeMultiplier || 1.0) > 1.0 ? '#B45309' : '#071B52',
                        fontWeight: 800,
                      }}
                    >
                      <Zap size={13} color={(a.surgeMultiplier || 1.0) > 1.0 ? '#F59E0B' : '#94A3B8'} />
                      <span>{a.surgeMultiplier || '1.0x'} Standard</span>
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= EDIT AREA PRICE MODAL ================= */}
      {editPriceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 27, 82, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                  Edit Area Selling Price
                </h3>
                <p style={{ fontSize: '0.80rem', color: '#64748B', margin: '2px 0 0' }}>
                  Setting prices for <strong style={{ color: '#071B52' }}>{currentArea?.name}</strong> ({currentCity?.name})
                </p>
              </div>
              <button
                onClick={() => setEditPriceModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Product Summary */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '18px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: '#071B52', fontSize: '0.92rem' }}>
                  {editPriceModal.product.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                  Pack Size: <strong style={{ color: '#071B52' }}>{editPriceModal.variant.weightOrVolume || '1 unit'}</strong>
                  {editPriceModal.variant.sku && ` • SKU: ${editPriceModal.variant.sku}`}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#EDE9FE',
                  color: '#7C3AED',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                3-Price Control
              </span>
            </div>

            {/* Error notice */}
            {priceModalError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '0.80rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} />
                <span>{priceModalError}</span>
              </div>
            )}

            {/* Row 1: DEFAULT (Catalog) & AREA PRICE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              {/* 1. Catalog Default Price */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#071B52',
                    marginBottom: '6px',
                  }}
                >
                  DEFAULT Price (₹) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontWeight: 800,
                      color: '#64748B',
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    value={editDefaultPriceInput}
                    onChange={(e) => setEditDefaultPriceInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 28px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#071B52',
                      outline: 'none',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.70rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                  Catalog baseline price
                </span>
              </div>

              {/* 2. Area Selling Price */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#7C3AED',
                    marginBottom: '6px',
                  }}
                >
                  AREA PRICE ({currentArea?.name}) (₹) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontWeight: 800,
                      color: '#7C3AED',
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    value={editPriceInput}
                    onChange={(e) => setEditPriceInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 28px',
                      borderRadius: '8px',
                      border: '1.5px solid #7C3AED',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#071B52',
                      backgroundColor: '#FAF5FF',
                      outline: 'none',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.70rem', color: '#7C3AED', fontWeight: 600, marginTop: '3px', display: 'block' }}>
                  Zone price in {currentArea?.name}
                </span>
              </div>
            </div>

            {/* Row 2: MRP & Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
              {/* 3. MRP */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#071B52',
                    marginBottom: '6px',
                  }}
                >
                  MRP (Maximum Retail Price) (₹) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontWeight: 800,
                      color: '#64748B',
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    value={editMrpInput}
                    onChange={(e) => setEditMrpInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 28px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#071B52',
                      outline: 'none',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.70rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                  Packaging printed MRP
                </span>
              </div>

              {/* 4. Stock */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#071B52',
                    marginBottom: '6px',
                  }}
                >
                  Stock in {currentArea?.name} (Units)
                </label>
                <input
                  type="number"
                  value={editStockInput}
                  onChange={(e) => setEditStockInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#071B52',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.70rem', color: '#64748B', marginTop: '3px', display: 'block' }}>
                  Available inventory
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setEditPriceModal(null)}
                className="btn btn-secondary"
                disabled={isSavingPrice}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                className="btn btn-primary"
                disabled={isSavingPrice}
                style={{ backgroundColor: '#7C3AED' }}
              >
                {isSavingPrice ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save Area Price</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CROSS-ZONE COMPARISON MATRIX MODAL ================= */}
      {showMatrixModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 27, 82, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '850px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                  Cross-Zone Price Comparison Matrix
                </h3>
                <p style={{ fontSize: '0.80rem', color: '#64748B', margin: '2px 0 0' }}>
                  Compare live variant selling price across all operational areas in {currentCity?.name}
                </p>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Variant Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Select Product Variant:
              </label>
              <select
                value={selectedMatrixVariant?.id || ''}
                onChange={(e) => setMatrixVariantId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.90rem',
                  fontWeight: 700,
                  color: '#071B52',
                  outline: 'none',
                }}
              >
                {allVariantsList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} · Default ₹{v.defaultPrice} (MRP ₹{v.mrp})
                  </option>
                ))}
              </select>
            </div>

            {/* Matrix Table */}
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: '#64748B', fontSize: '0.72rem' }}>
                      ZONE / AREA
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: '#64748B', fontSize: '0.72rem' }}>
                      FULFILLING STORE
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#64748B', fontSize: '0.72rem' }}>
                      BASE PRICE
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#64748B', fontSize: '0.72rem' }}>
                      AREA OVERRIDE
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#64748B', fontSize: '0.72rem' }}>
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {availableAreas.map((area) => {
                    const aId = String(area.id || area._id || '');
                    const vId = String(selectedMatrixVariant?.id || '');
                    const override = areaPricingMap.get(vId)?.get(aId);
                    const effectivePrice = override !== undefined && override > 0 ? override : selectedMatrixVariant?.defaultPrice || 0;
                    const isOverridden = override !== undefined && override > 0;
                    const assignedStore = stores.find((s) => s.areaId === aId || s.name.toLowerCase().includes(area.name.toLowerCase()));

                    return (
                      <tr key={aId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#071B52' }}>
                          {area.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '0.78rem' }}>
                          {assignedStore?.name || `Wom Up ${area.name} Hub`}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                          ₹{selectedMatrixVariant?.defaultPrice}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              backgroundColor: isOverridden ? '#F3E8FF' : '#F1F5F9',
                              color: isOverridden ? '#6B21A8' : '#334155',
                              fontWeight: 900,
                            }}
                          >
                            ₹{effectivePrice}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {isOverridden ? (
                            <span style={{ fontSize: '0.72rem', color: '#7E22CE', fontWeight: 800 }}>
                              ● Customized
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                              Default
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMatrixModal(false)} className="btn btn-secondary">
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BULK ADJUSTMENT MODAL ================= */}
      {showBulkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 27, 82, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                  Bulk Adjust Prices in {currentArea?.name}
                </h3>
                <p style={{ fontSize: '0.80rem', color: '#64748B', margin: '2px 0 0' }}>
                  Adjust all {filteredProducts.length} filtered items simultaneously
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Action Increase / Decrease */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#071B52',
                  marginBottom: '6px',
                }}
              >
                Adjustment Action:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBulkAction('INCREASE')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: bulkAction === 'INCREASE' ? '2px solid #10B981' : '1px solid #E2E8F0',
                    backgroundColor: bulkAction === 'INCREASE' ? '#ECFDF5' : '#FFFFFF',
                    color: bulkAction === 'INCREASE' ? '#047857' : '#64748B',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  + Increase Prices
                </button>
                <button
                  type="button"
                  onClick={() => setBulkAction('DECREASE')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: bulkAction === 'DECREASE' ? '2px solid #EF4444' : '1px solid #E2E8F0',
                    backgroundColor: bulkAction === 'DECREASE' ? '#FEF2F2' : '#FFFFFF',
                    color: bulkAction === 'DECREASE' ? '#B91C1C' : '#64748B',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  - Discount / Decrease
                </button>
              </div>
            </div>

            {/* Adjustment Type & Value */}
            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#071B52',
                  marginBottom: '6px',
                }}
              >
                Adjustment Value:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={bulkAdjustmentType}
                  onChange={(e) => setBulkAdjustmentType(e.target.value as any)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
                <input
                  type="number"
                  value={bulkAdjustmentValue}
                  onChange={(e) => setBulkAdjustmentValue(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.90rem',
                    fontWeight: 800,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowBulkModal(false)}
                className="btn btn-secondary"
                disabled={isApplyingBulk}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkAdjust}
                className="btn btn-primary"
                disabled={isApplyingBulk}
              >
                {isApplyingBulk ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Applying Changes...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Apply to {filteredProducts.length} Items</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
