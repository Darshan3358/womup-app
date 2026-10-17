import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  Package,
  Plus,
  Minus,
  Search,
  Edit2,
  Check,
  X,
  Warehouse,
  Lock,
  MapPin,
  Navigation,
  Layers,
  ChevronDown,
  ClipboardList,
  AlertTriangle,
  Clock,
  PlusCircle,
  XCircle,
} from 'lucide-react-native';
import { useAdminState } from '../context/AdminStateContext';
import { ProductItem, ProductVariantItem } from '../types/admin';

export const InventoryScreen: React.FC = () => {
  const {
    products,
    categories,
    cities,
    zones,
    darkStores,
    selectedDarkStore,
    setSelectedDarkStore,
    areaPricingRecords,
    updateVariantAreaPrice,
    updateProductItem,
    setActiveModal,
    setSelectedProduct,
    updateShelfLocation,
    reportStockDiscrepancy,
  } = useAdminState();

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Tabs: All Items, Low Stock, Expired
  const [activeTab, setActiveTab] = useState<'All Items' | 'Low Stock' | 'Expired'>('All Items');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // Cascading City & Area Selection States
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

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

  // Inline Shelf / Bin Location Edit (Default: A1-R2)
  const [shelfLocations, setShelfLocations] = useState<Record<string, string>>({
    default: 'A1-R2',
  });
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editingShelfValue, setEditingShelfValue] = useState<string>('');

  // Stock Discrepancy Audit Modal State
  const [auditProduct, setAuditProduct] = useState<ProductItem | null>(null);
  const [auditPhysicalStock, setAuditPhysicalStock] = useState<string>('');
  const [auditReason, setAuditReason] = useState<
    'Miscount Correction' | 'Damaged / Spoilage' | 'Shrinkage / Theft' | 'Expired Stock'
  >('Miscount Correction');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditSubmitting, setAuditSubmitting] = useState(false);
  const [auditSuccessBanner, setAuditSuccessBanner] = useState<string | null>(null);

  // 1. Resolve Active Cities
  const activeCities = cities.filter((c) => c.status === 'Active' || !c.status);
  const currentCity =
    activeCities.find(
      (c) =>
        (c.id && c.id === selectedCityId) ||
        ((c as any)._id && (c as any)._id === selectedCityId) ||
        c.name.toLowerCase() === selectedCityId.toLowerCase()
    ) ||
    activeCities.find((c) => c.code === 'AHM' || c.name.toLowerCase() === 'ahmedabad') ||
    activeCities[0];

  // 2. Resolve Available Areas for Selected City
  const availableAreas = zones.filter((z) => {
    if (!currentCity) return true;
    const currentCityIdStr = currentCity.id || (currentCity as any)._id;
    if (z.cityId && currentCityIdStr && String(z.cityId) === String(currentCityIdStr)) return true;
    if (z.cityName && currentCity.name && z.cityName.toLowerCase() === currentCity.name.toLowerCase()) return true;
    if (z.city && currentCity.name && z.city.toLowerCase() === currentCity.name.toLowerCase()) return true;
    return false;
  });

  const currentArea =
    availableAreas.find(
      (a) =>
        (a.id && a.id === selectedAreaId) ||
        ((a as any)._id && (a as any)._id === selectedAreaId) ||
        a.name.toLowerCase() === selectedAreaId.toLowerCase()
    ) ||
    (selectedAreaId === 'ALL' ? null : availableAreas[0]);

  // 3. Auto-Select the ONE Dark Store assigned to this area (1-store-per-area rule)
  const resolvedStore =
    darkStores.find((s) => {
      if (currentArea) {
        const areaIdStr = currentArea.id || (currentArea as any)._id;
        if (s.areaId && areaIdStr && String(s.areaId) === String(areaIdStr)) return true;
        if (s.areaName && currentArea.name && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
        if (currentArea.assignedStore && (s.id === currentArea.assignedStore.id || s.code === currentArea.assignedStore.code)) return true;
        if (currentArea.darkStore && s.name.toLowerCase().includes(currentArea.name.toLowerCase())) return true;
      }
      return false;
    }) ||
    (currentCity ? darkStores.find((s) => (s.cityName || s.city || '').toLowerCase() === currentCity.name.toLowerCase()) : null) ||
    darkStores[0];

  const currentStoreName = resolvedStore?.name || selectedDarkStore || 'Wom Up Satellite Dark Store';

  // Fast Area Pricing lookup map: variantId -> areaId -> { price, mrp, stock }
  const areaPricingMap = useMemo(() => {
    const map = new Map<string, Map<string, { price: number; mrp?: number; stock?: number }>>();
    (areaPricingRecords || []).forEach((ap) => {
      const vId = String(ap.variantId);
      const aId = String(ap.areaId);
      if (!map.has(vId)) map.set(vId, new Map());
      map.get(vId)!.set(aId, { price: ap.price, mrp: ap.mrp, stock: ap.stock });
    });
    return map;
  }, [areaPricingRecords]);

  // Helper: Get effective variant price, mrp, and stock for the selected area
  const getEffectiveVariantData = (variant: any) => {
    if (!variant) return { price: 0, mrp: 0, stock: 50, isAreaCustom: false };
    const vId = String(variant.id || (variant as any)._id || '');
    if (selectedAreaId !== 'ALL' && currentArea) {
      const aId = String(currentArea.id || (currentArea as any)._id || '');
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
      price: variant.sellingPrice || variant.price || 0,
      mrp: variant.mrp || variant.sellingPrice || 0,
      stock: variant.stock !== undefined ? variant.stock : 50,
      isAreaCustom: false,
    };
  };

  // Stock calculations
  const totalStockUnits = products.reduce((sum, p) => {
    if (selectedAreaId !== 'ALL' && currentArea && p.variants && p.variants.length > 0) {
      const areaVarStock = p.variants.reduce((vSum: number, v: any) => {
        const vd = getEffectiveVariantData(v);
        return vSum + (vd.stock || 0);
      }, 0);
      if (areaVarStock > 0) return sum + areaVarStock;
    }
    return sum + (Number(p.stockKg) || 50);
  }, 0);

  const availableStockUnits = Math.round(totalStockUnits * 0.88);
  const reservedStockUnits = totalStockUnits - availableStockUnits;

  const lowStockCount = products.filter((p) => {
    const defaultVar = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
    const stockVal = defaultVar ? getEffectiveVariantData(defaultVar).stock : (p.stockKg || 50);
    return stockVal > 0 && stockVal < 15;
  }).length;

  const outOfStockCount = products.filter((p) => {
    const defaultVar = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
    const stockVal = defaultVar ? getEffectiveVariantData(defaultVar).stock : (p.stockKg || 50);
    return stockVal <= 0;
  }).length;

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q));

    const matchCategory =
      selectedCategory === 'ALL' ||
      p.category === selectedCategory ||
      p.categoryId === selectedCategory;

    let matchTab = true;
    const defaultVar = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
    const stockVal = defaultVar ? getEffectiveVariantData(defaultVar).stock : (p.stockKg !== undefined ? p.stockKg : 50);

    if (activeTab === 'Low Stock') {
      matchTab = stockVal > 0 && stockVal < 15;
    } else if (activeTab === 'Expired') {
      matchTab = stockVal <= 0;
    }

    return matchSearch && matchCategory && matchTab;
  });

  // Action handlers
  const startEditPrice = (prod: ProductItem) => {
    setEditingPriceId(prod.id);
    setEditingPriceValue(String(prod.sellingPrice));
  };

  const handleSavePrice = async (prod: ProductItem) => {
    const newPrice = parseFloat(editingPriceValue);
    if (isNaN(newPrice) || newPrice <= 0) return;

    setSavingPrice(true);
    try {
      if (selectedAreaId !== 'ALL' && currentArea) {
        const prodId = prod.id;
        const currentVarId =
          selectedVariants[prodId] ||
          (prod.variants && prod.variants[0] ? prod.variants[0].id : '');
        const curVar = (prod.variants || []).find((v) => v.id === currentVarId) || (prod.variants && prod.variants[0]);
        if (curVar) {
          const curData = getEffectiveVariantData(curVar);
          await updateVariantAreaPrice(
            prodId,
            curVar.id,
            currentArea.id || (currentArea as any)._id,
            newPrice,
            curData.mrp,
            curData.stock
          );
        } else {
          await updateProductItem(prod.id, { sellingPrice: newPrice });
        }
      } else {
        await updateProductItem(prod.id, { sellingPrice: newPrice });
      }
    } catch {
      // Ignore
    } finally {
      setSavingPrice(false);
      setEditingPriceId(null);
    }
  };

  const handleSaveStock = async (prod: ProductItem) => {
    const newStock = parseInt(editingStockValue, 10);
    if (isNaN(newStock) || newStock < 0) return;

    setSavingStock(true);
    try {
      const defaultVar = prod.variants?.find((v) => v.isDefault) || prod.variants?.[0];
      if (defaultVar) {
        if (selectedAreaId !== 'ALL' && currentArea) {
          const curData = getEffectiveVariantData(defaultVar);
          await updateVariantAreaPrice(
            prod.id,
            defaultVar.id,
            currentArea.id || (currentArea as any)._id,
            curData.price,
            curData.mrp,
            newStock
          );
        } else {
          const updatedVariants = (prod.variants || []).map((v) =>
            v.id === defaultVar.id ? { ...v, stock: newStock } : v
          );
          await updateProductItem(prod.id, { variants: updatedVariants });
        }
      } else {
        await updateProductItem(prod.id, { stockKg: newStock });
      }
    } catch {
      // Ignore
    } finally {
      setSavingStock(false);
      setEditingStockId(null);
    }
  };

  const handleSaveShelf = async (prodId: string) => {
    if (!editingShelfValue.trim()) return;
    const cleanShelf = editingShelfValue.trim().toUpperCase();
    setShelfLocations((prev) => ({
      ...prev,
      [prodId]: cleanShelf,
    }));
    setEditingShelfId(null);

    try {
      await updateShelfLocation({
        productId: prodId,
        shelfLocation: cleanShelf,
        storeId: resolvedStore?.id,
      });
    } catch {
      // Soft fail
    }
  };

  const handleOpenAuditModal = (prod: ProductItem) => {
    const defaultVar = prod.variants?.find((v) => v.isDefault) || prod.variants?.[0];
    const stockVal = defaultVar ? getEffectiveVariantData(defaultVar).stock : (prod.stockKg || 50);
    setAuditProduct(prod);
    setAuditPhysicalStock(String(stockVal));
    setAuditReason('Miscount Correction');
    setAuditNotes('');
    setAuditSuccessBanner(null);
  };

  const handleAuditSubmit = async () => {
    if (!auditProduct) return;
    const parsedStock = parseInt(auditPhysicalStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert('Invalid Count', 'Please enter a valid physical stock number.');
      return;
    }

    setAuditSubmitting(true);
    try {
      const defaultVar = auditProduct.variants?.find((v) => v.isDefault) || auditProduct.variants?.[0];
      const recordedStock = defaultVar ? getEffectiveVariantData(defaultVar).stock : (auditProduct.stockKg || 50);
      const discrepancy = parsedStock - recordedStock;

      if (selectedAreaId !== 'ALL' && currentArea && defaultVar) {
        const curData = getEffectiveVariantData(defaultVar);
        await updateVariantAreaPrice(
          auditProduct.id,
          defaultVar.id,
          currentArea.id || (currentArea as any)._id,
          curData.price,
          curData.mrp,
          parsedStock
        );
      } else {
        await updateProductItem(auditProduct.id, { stockKg: parsedStock });
      }

      if (reportStockDiscrepancy) {
        await reportStockDiscrepancy(
          auditProduct.name,
          discrepancy < 0 ? 'Shrinkage' : 'Discrepancy',
          Math.abs(discrepancy),
          `${auditReason}${auditNotes ? ` - ${auditNotes}` : ''}`
        );
      }

      setAuditSuccessBanner(`Physical audit logged for ${auditProduct.name}! New stock: ${parsedStock} units.`);
      setTimeout(() => {
        setAuditProduct(null);
        setAuditSuccessBanner(null);
      }, 1400);
    } catch {
      Alert.alert('Error', 'Failed to update stock audit. Please try again.');
    } finally {
      setAuditSubmitting(false);
    }
  };

  // Expandable Mobile Row Drawer (+ / -)
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (prodId: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [prodId]: !prev[prodId],
    }));
  };

  const handleQuickAdjustVariantStock = async (prod: ProductItem, variantId: string, delta: number) => {
    const curVar = (prod.variants || []).find((v) => v.id === variantId);
    if (!curVar) return;
    const curData = getEffectiveVariantData(curVar);
    const newStock = Math.max(0, (curData.stock || 0) + delta);

    try {
      if (selectedAreaId !== 'ALL' && currentArea) {
        await updateVariantAreaPrice(
          prod.id,
          curVar.id,
          currentArea.id || (currentArea as any)._id,
          curData.price,
          curData.mrp,
          newStock
        );
      } else {
        const updatedVariants = (prod.variants || []).map((v) =>
          v.id === variantId ? { ...v, stock: newStock } : v
        );
        await updateProductItem(prod.id, { variants: updatedVariants });
      }
    } catch {
      // Soft fail
    }
  };

  const handleQuickAdjustStock = async (prod: ProductItem, delta: number) => {
    const defaultVar = prod.variants?.find((v) => v.isDefault) || prod.variants?.[0];
    if (defaultVar) {
      await handleQuickAdjustVariantStock(prod, defaultVar.id, delta);
      return;
    }
    const currentStock = prod.stockKg !== undefined ? prod.stockKg : 50;
    const newStock = Math.max(0, currentStock + delta);

    try {
      await updateProductItem(prod.id, { stockKg: newStock });
    } catch {
      // Soft fail
    }
  };

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={[styles.mainContent, isMobile && { padding: 0, paddingBottom: 85 }]}
    >
      {/* Top Desktop Controls */}
      {!isMobile && (
        <>
          {/* Top Header Bar */}
          <View style={[styles.headerRow, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
            <View style={isMobile ? { width: '100%' } : { flex: 1, minWidth: 260 }}>
          <Text style={[styles.headerTitle, isMobile && { fontSize: 20 }]}>Warehouse Inventory Control</Text>
          <Text style={[styles.headerSubtitle, isMobile && { fontSize: 12, lineHeight: 17 }]}>
            Filter by City & Area — inventory automatically locked to that zone's 1:1 Dark Store
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addProductBtn, isMobile && { width: '100%', justifyContent: 'center', paddingVertical: 12 }]}
          onPress={() => setActiveModal('AddProduct')}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addProductBtnText}>+ Add Product Item</Text>
        </TouchableOpacity>
      </View>

      {/* 2-Step Cascading Selector (City & Area) */}
      <View style={[styles.cascadingCard, isMobile && { padding: 12 }]}>
        <View style={[styles.cascadingGrid, isMobile && { flexDirection: 'column', gap: 12 }]}>
          {/* STEP 1: SELECT CITY */}
          <View style={[styles.cascadingCol, isMobile && { minWidth: '100%' }]}>
            <View style={styles.stepLabelRow}>
              <MapPin size={13} color="#4F46E5" />
              <Text style={styles.stepLabelText}>STEP 1: SELECT CITY</Text>
            </View>
            {Platform.OS === 'web' ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <select
                  value={selectedCityId || currentCity?.name}
                  onChange={(e: any) => {
                    setSelectedCityId(e.target.value);
                    setSelectedAreaId('ALL');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#071B52',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    outline: 'none',
                  }}
                >
                  {activeCities.map((c) => (
                    <option key={c.id || (c as any)._id} value={c.name}>
                      {c.name} ({c.code || 'AMD'})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  color="#64748B"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            ) : (
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setShowCityPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorBtnText} numberOfLines={1}>
                  {currentCity ? `${currentCity.name} (${currentCity.code || 'AMD'})` : 'Select City'}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* STEP 2: SELECT AREA (1:1 STORE LOCK) */}
          <View style={[styles.cascadingCol, isMobile && { minWidth: '100%' }]}>
            <View style={styles.stepLabelRow}>
              <Navigation size={13} color="#0D9488" />
              <Text style={[styles.stepLabelText, { color: '#0D9488' }]}>
                STEP 2: SELECT AREA (1:1 STORE LOCK)
              </Text>
            </View>
            {Platform.OS === 'web' ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <select
                  value={selectedAreaId || currentArea?.name || 'ALL'}
                  onChange={(e: any) => setSelectedAreaId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#071B52',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All City Areas ({availableAreas.length})</option>
                  {availableAreas.map((a) => (
                    <option key={a.id || (a as any)._id} value={a.name}>
                      {a.name} • {a.code || 'ZONE'}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  color="#64748B"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            ) : (
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setShowAreaPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorBtnText} numberOfLines={1}>
                  {currentArea ? `${currentArea.name} • ${currentArea.code || 'ZONE'}` : 'All City Areas'}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Fulfilling Dark Store Locked Banner */}
        <View style={[styles.lockedStoreBanner, isMobile && { padding: 12, alignItems: 'flex-start' }]}>
          <View style={styles.storeIconBox}>
            <Warehouse size={18} color="#4F46E5" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.storeTitleRow}>
              <Text style={styles.storeNameText}>{currentStoreName}</Text>
              <View style={styles.lockedAreaPill}>
                <Lock size={10} color="#047857" />
                <Text style={styles.lockedAreaPillText}>1:1 LOCKED</Text>
              </View>
            </View>
            <View style={styles.storeChipsRow}>
              <View style={styles.storeChip}>
                <Text style={styles.storeChipLabel}>Area: </Text>
                <Text style={styles.storeChipVal}>{currentArea?.name || 'All Areas'}</Text>
              </View>
              <View style={styles.storeChip}>
                <Text style={styles.storeChipLabel}>City: </Text>
                <Text style={styles.storeChipVal}>{currentCity?.name || 'Ahmedabad'}</Text>
              </View>
              <View style={[styles.storeChip, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
                <Text style={[styles.storeChipLabel, { color: '#BE185D' }]}>Hub: </Text>
                <Text style={[styles.storeChipVal, { color: '#DB2777', fontWeight: '800' }]}>
                  {resolvedStore?.code || 'STORE-SATELLITE'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* KPI Cards: Total Stock, Available, Reserved */}
      <View style={[styles.kpiGrid, isMobile && { flexDirection: 'column', gap: 10 }]}>
        {/* TOTAL WAREHOUSE STOCK */}
        <View style={[styles.kpiCard, isMobile && { minWidth: '100%', padding: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>TOTAL WAREHOUSE STOCK</Text>
            <Text style={styles.kpiValueNavy}>{totalStockUnits.toLocaleString()} units</Text>
            <Text style={styles.kpiSubtext}>Across {products.length} SKUs in catalog</Text>
          </View>
          <View style={[styles.kpiIconBox, { backgroundColor: '#EEF2FF' }]}>
            <Package size={22} color="#4F46E5" />
          </View>
        </View>

        {/* AVAILABLE FOR DISPATCH */}
        <View style={[styles.kpiCard, isMobile && { minWidth: '100%', padding: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kpiLabel, { color: '#047857' }]}>AVAILABLE FOR DISPATCH</Text>
            <Text style={styles.kpiValueGreen}>{availableStockUnits.toLocaleString()} units</Text>
            <Text style={[styles.kpiSubtext, { color: '#10B981', fontWeight: '700' }]}>
              88% Available Free Stock
            </Text>
          </View>
          <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Check size={22} color="#059669" />
          </View>
        </View>

        {/* RESERVED FOR LIVE ORDERS */}
        <View style={[styles.kpiCard, isMobile && { minWidth: '100%', padding: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kpiLabel, { color: '#6D28D9' }]}>RESERVED FOR LIVE ORDERS</Text>
            <Text style={styles.kpiValuePurple}>{reservedStockUnits.toLocaleString()} units</Text>
            <Text style={[styles.kpiSubtext, { color: '#8B5CF6', fontWeight: '700' }]}>
              Live Cart / Packing Locks
            </Text>
          </View>
          <View style={[styles.kpiIconBox, { backgroundColor: '#F5F3FF' }]}>
            <Layers size={22} color="#7C3AED" />
          </View>
        </View>
      </View>

      {/* Tabs Row + Category Filter & Search Toolbar */}
      <View style={[styles.filterToolbar, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
        {/* Left Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabButtonsGroup, isMobile && { paddingBottom: 2 }]}
        >
          {(['All Items', 'Low Stock', 'Expired'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            const count =
              tab === 'All Items'
                ? products.length
                : tab === 'Low Stock'
                ? lowStockCount
                : outOfStockCount;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                  {tab}
                </Text>
                <View style={[styles.tabCountBadge, isSelected && styles.tabCountBadgeActive]}>
                  <Text style={[styles.tabCountText, isSelected && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Right Controls: Category Dropdown & Search Input */}
        <View style={[styles.rightControls, isMobile && { flexDirection: 'column', width: '100%', gap: 8 }]}>
          {Platform.OS === 'web' ? (
            <div style={{ position: 'relative', width: isMobile ? '100%' : '180px' }}>
              <select
                value={selectedCategory}
                onChange={(e: any) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 30px 9px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#071B52',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id || (c as any)._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                color="#64748B"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ) : (
            <TouchableOpacity
              style={[styles.categoryDropdownBtn, isMobile && { width: '100%' }]}
              onPress={() => setShowCategoryPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryDropdownText} numberOfLines={1}>
                {selectedCategory === 'ALL'
                  ? `All Categories (${categories.length})`
                  : selectedCategory}
              </Text>
              <ChevronDown size={14} color="#64748B" />
            </TouchableOpacity>
          )}

          <View style={[styles.searchBox, isMobile && { width: '100%', minWidth: '100%' }]}>
            <Search size={14} color="#94A3B8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search SKU, brand..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </View>
      </>
      )}

      {/* Master Inventory Table (Horizontal + Vertical Scrollable on Desktop, Responsive 2-Column + / - View on Mobile) */}
      <View style={isMobile ? styles.storeTableCard : styles.tableCard}>
        {isMobile ? (
          // Mobile Responsive Layout (Matching Store App 1:1)
          <View style={{ width: '100%' }}>
            {/* Top Header & Store Lock Banner */}
            <View style={styles.topStoreBanner}>
              <View style={styles.storeIconBox}>
                <Warehouse size={18} color="#4F46E5" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.storeTitleRow}>
                  <Text style={styles.storeNameText} numberOfLines={1}>
                    {currentStoreName}
                  </Text>
                  <View style={styles.lockedAreaPill}>
                    <Lock size={10} color="#047857" />
                    <Text style={styles.lockedAreaPillText}>1:1 LOCKED</Text>
                  </View>
                </View>
                <View style={styles.storeChipsRow}>
                  <TouchableOpacity
                    style={styles.storeChip}
                    onPress={() => setShowAreaPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.storeChipLabel}>Zone: </Text>
                    <Text style={styles.storeChipVal}>{currentArea?.name || 'All Areas'}</Text>
                    <ChevronDown size={10} color="#64748B" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.storeChip, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}
                    onPress={() => setShowCityPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.storeChipLabel, { color: '#BE185D' }]}>Hub: </Text>
                    <Text style={[styles.storeChipVal, { color: '#DB2777', fontWeight: '800' }]}>
                      {resolvedStore?.code || 'STORE-HUB'}
                    </Text>
                    <ChevronDown size={10} color="#DB2777" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Search & Actions Bar */}
            <View style={styles.storeTopBar}>
              <View style={styles.storeSearchRow}>
                <Search size={15} color="#94A3B8" />
                <TextInput
                  style={styles.storeSearchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search SKU, product..."
                  placeholderTextColor="#94A3B8"
                />
                {Boolean(search) && (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <XCircle size={15} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.storeAddProductBtn}
                onPress={() => setActiveModal('AddProduct')}
                activeOpacity={0.8}
              >
                <PlusCircle size={14} color="#FFFFFF" />
                <Text style={styles.storeAddProductBtnText}>ADD ITEM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storeLogsBtn}
                onPress={() => setActiveModal('PriceHistory')}
                activeOpacity={0.8}
              >
                <Clock size={14} color="#06B6D4" />
                <Text style={styles.storeLogsBtnText}>LOGS</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.storeFilterRow}>
              {[
                { key: 'All Items', label: 'All Stock' },
                { key: 'Low Stock', label: 'Low Stock (≤10)' },
                { key: 'Expired', label: 'Out of Stock' },
              ].map((f) => {
                const isSelected = activeTab === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.storeFilterPill, isSelected && styles.storeFilterPillActive]}
                    onPress={() => setActiveTab(f.key as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.storeFilterText, isSelected && styles.storeFilterTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Master Inventory Table: 2-Column Header */}
            <View style={styles.mobileTableHeaderRow}>
              <Text style={styles.mobileTableHeaderCol}>PRODUCT SKU & TITLE</Text>
              <Text style={[styles.mobileTableHeaderCol, { textAlign: 'right' }]}>
                AUDIT / ACTIONS
              </Text>
            </View>

            {/* Mobile Product Items */}
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyTableState}>
                <Package size={36} color="#CBD5E1" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTableText}>
                  No items match current warehouse filters for {currentStoreName}.
                </Text>
              </View>
            ) : (
              filteredProducts.map((p, index) => {
                const prodId = p.id;
                const defaultVar = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
                const defaultVarData = defaultVar ? getEffectiveVariantData(defaultVar) : null;

                const effectiveSellingPrice = defaultVarData
                  ? defaultVarData.price
                  : p.sellingPrice;
                const effectiveMrp = defaultVarData
                  ? defaultVarData.mrp
                  : p.mrp || p.sellingPrice;
                const stockVal = defaultVarData
                  ? defaultVarData.stock
                  : p.stockKg !== undefined
                  ? p.stockKg
                  : 50;

                const isEditingStock = editingStockId === p.id;
                const isEditingShelf = editingShelfId === p.id;
                const currentShelf = shelfLocations[p.id] || 'A1-R1';
                const isExpanded = !!expandedProductIds[p.id];
                const hasVariants = Boolean(p.variants && p.variants.length > 0);
                const thresholdVal = (p as any).threshold || 10;
                const slugText =
                  (p as any).slug ||
                  (p as any).sku ||
                  p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                return (
                  <View
                    key={p.id}
                    style={[
                      styles.mobileTableRowContainer,
                      index % 2 === 1 && { backgroundColor: '#FBFDFE' },
                    ]}
                  >
                    {/* Primary Row: Left: PRODUCT SKU & TITLE, Right: AUDIT / ACTIONS + [+ / -] */}
                    <View style={styles.mobileTableRow}>
                      {/* Left: PRODUCT SKU & TITLE */}
                      <View style={styles.mobileProductInfo}>
                        {p.imageUrl ? (
                          <Image
                            source={{ uri: p.imageUrl }}
                            style={styles.productThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.productThumbFallback}>
                            <Package size={18} color="#1D4ED8" />
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.productTitleText} numberOfLines={2}>
                            {p.name}
                          </Text>
                          <Text style={styles.productSkuText}>
                            {slugText}
                          </Text>
                        </View>
                      </View>

                      {/* Right: AUDIT / ACTIONS + [+ / -] Toggle */}
                      <View style={styles.mobileActionsCol}>
                        <TouchableOpacity
                          style={styles.actionEditBtn}
                          onPress={() => {
                            setSelectedProduct(p);
                            setActiveModal('EditProduct');
                          }}
                          activeOpacity={0.8}
                        >
                          <Edit2 size={12} color="#071B52" />
                          <Text style={styles.actionEditBtnText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionAuditBtn}
                          onPress={() => handleOpenAuditModal(p)}
                          activeOpacity={0.8}
                        >
                          <ClipboardList size={13} color="#4F46E5" />
                          <Text style={styles.actionAuditBtnText}>Audit</Text>
                        </TouchableOpacity>

                        {/* [+ / -] Toggle Button */}
                        <TouchableOpacity
                          style={[
                            styles.mobileToggleBtn,
                            isExpanded && styles.mobileToggleBtnExpanded,
                          ]}
                          onPress={() => toggleExpand(p.id)}
                          activeOpacity={0.8}
                        >
                          {isExpanded ? (
                            <Minus size={15} color="#FFFFFF" strokeWidth={2.8} />
                          ) : (
                            <Plus size={15} color="#4F46E5" strokeWidth={2.8} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* EXPANDED SECTION: "another thing show in + / -" */}
                    {isExpanded && (
                      <View style={styles.mobileExpandedSection}>
                        {/* Row 1: Stock Level with quick + / - stepper adjustment & direct edit */}
                        <View style={styles.drawerCard}>
                          <View style={styles.drawerCardHeader}>
                            <Text style={styles.drawerLabel}>STOCK LEVEL</Text>
                            <View
                              style={[
                                styles.statusBadge,
                                stockVal <= 0
                                  ? styles.statusBadgeRed
                                  : stockVal <= thresholdVal
                                  ? styles.statusBadgeAmber
                                  : styles.statusBadgeGreen,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  stockVal <= 0
                                    ? styles.statusTextRed
                                    : stockVal <= thresholdVal
                                    ? styles.statusTextAmber
                                    : styles.statusTextGreen,
                                ]}
                              >
                                {stockVal <= 0
                                  ? 'OUT OF STOCK'
                                  : stockVal <= thresholdVal
                                  ? 'LOW STOCK'
                                  : 'IN STOCK'}
                              </Text>
                            </View>
                          </View>

                          {/* Quick Stepper + / - & Direct Inline Count Edit */}
                          <View style={styles.stepperRow}>
                            {/* Decrement (-) Button */}
                            <TouchableOpacity
                              style={styles.stepperBtn}
                              onPress={() => handleQuickAdjustStock(p, -1)}
                              activeOpacity={0.7}
                            >
                              <Minus size={14} color="#BE123C" strokeWidth={2.5} />
                            </TouchableOpacity>

                            {/* Direct inline edit or display */}
                            {isEditingStock ? (
                              <View style={styles.inlineEditWrap}>
                                <TextInput
                                  style={[styles.inlineInput, { width: 65, textAlign: 'center' }]}
                                  keyboardType="numeric"
                                  value={editingStockValue}
                                  onChangeText={setEditingStockValue}
                                  autoFocus
                                />
                                <TouchableOpacity
                                  style={styles.inlineSaveBtn}
                                  onPress={() => handleSaveStock(p)}
                                  disabled={savingStock}
                                >
                                  <Check size={12} color="#FFFFFF" strokeWidth={3} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.inlineCancelBtn}
                                  onPress={() => setEditingStockId(null)}
                                >
                                  <X size={12} color="#FFFFFF" strokeWidth={3} />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.stepperValWrap}
                                onPress={() => {
                                  setEditingStockId(p.id);
                                  setEditingStockValue(String(stockVal));
                                }}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.stepperValText,
                                    stockVal <= thresholdVal && { color: '#DC2626' },
                                  ]}
                                >
                                  {stockVal} units
                                </Text>
                                <Edit2 size={10} color="#94A3B8" style={{ marginLeft: 5 }} />
                              </TouchableOpacity>
                            )}

                            {/* Increment (+) Button */}
                            <TouchableOpacity
                              style={[
                                styles.stepperBtn,
                                { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
                              ]}
                              onPress={() => handleQuickAdjustStock(p, 1)}
                              activeOpacity={0.7}
                            >
                              <Plus size={14} color="#047857" strokeWidth={2.5} />
                            </TouchableOpacity>

                            <View style={styles.areaTag}>
                              <Lock size={10} color="#047857" style={{ marginRight: 3 }} />
                              <Text style={styles.areaTagText}>
                                {currentArea?.name ? `${currentArea.name} Hub` : resolvedStore?.name ? `${resolvedStore.name.split(' ')[0]} Hub` : 'Tragad Hub'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Row 2: Price & Shelf Location */}
                        <View style={styles.drawerTwoCol}>
                          {/* Selling Price / MRP */}
                          <View style={styles.drawerMiniCol}>
                            <Text style={styles.drawerLabel}>SELLING PRICE / MRP</Text>
                            <View style={styles.priceRowWrap}>
                              <Text style={styles.sellingPriceText}>₹{effectiveSellingPrice}</Text>
                              {Boolean(effectiveMrp && effectiveMrp > effectiveSellingPrice) && (
                                <Text style={[styles.mrpText, { marginLeft: 6 }]}>
                                  ₹{effectiveMrp}
                                </Text>
                              )}
                            </View>
                          </View>

                          {/* Shelf Location */}
                          <View style={styles.drawerMiniCol}>
                            <Text style={styles.drawerLabel}>SHELF LOCATION</Text>
                            {isEditingShelf ? (
                              <View style={[styles.inlineEditWrap, { marginTop: 4 }]}>
                                <TextInput
                                  style={[styles.inlineInput, { width: 70 }]}
                                  value={editingShelfValue}
                                  onChangeText={setEditingShelfValue}
                                  autoFocus
                                />
                                <TouchableOpacity
                                  style={styles.inlineSaveBtn}
                                  onPress={() => handleSaveShelf(p.id)}
                                >
                                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.inlineCancelBtn}
                                  onPress={() => setEditingShelfId(null)}
                                >
                                  <X size={11} color="#FFFFFF" strokeWidth={3} />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.shelfLocationBadge}
                                onPress={() => {
                                  setEditingShelfId(p.id);
                                  setEditingShelfValue(currentShelf);
                                }}
                                activeOpacity={0.7}
                              >
                                <MapPin size={12} color="#4F46E5" />
                                <Text style={styles.shelfLocationText}>
                                  {currentShelf}
                                </Text>
                                <Edit2 size={10} color="#94A3B8" style={{ marginLeft: 2 }} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>

                        {/* Row 3: Variants Section if available */}
                        {hasVariants && (
                          <View style={styles.variantsBox}>
                            <Text style={styles.variantsTitle}>PACK SIZES & VARIANT INVENTORY</Text>
                            {p.variants?.map((v) => {
                              const vData = getEffectiveVariantData(v);
                              const isDefault = v.isDefault || v.id === p.variants?.[0]?.id;
                              return (
                                <View key={v.id} style={styles.variantItemRow}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.variantWeight}>
                                      {v.weightOrVolume} {isDefault ? '(Default)' : ''}
                                    </Text>
                                    <Text style={styles.variantPriceText}>
                                      ₹{vData.price} {vData.mrp > vData.price ? `(MRP ₹${vData.mrp})` : ''}
                                    </Text>
                                  </View>

                                  <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                                    <Text
                                      style={[
                                        styles.variantStockCount,
                                        vData.stock === 0
                                          ? { color: '#DC2626' }
                                          : vData.stock <= 5
                                          ? { color: '#D97706' }
                                          : { color: '#047857' },
                                      ]}
                                    >
                                      {vData.stock} units
                                    </Text>
                                    <Text style={styles.variantStockSub}>in stock</Text>
                                  </View>

                                  <View style={styles.quickStepper}>
                                    <TouchableOpacity
                                      style={styles.quickStepBtn}
                                      onPress={() => handleQuickAdjustVariantStock(p, v.id, -1)}
                                      activeOpacity={0.7}
                                    >
                                      <Minus size={13} color="#BE123C" strokeWidth={2.5} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.quickStepBtn, styles.quickStepBtnPlus]}
                                      onPress={() => handleQuickAdjustVariantStock(p, v.id, 1)}
                                      activeOpacity={0.7}
                                    >
                                      <Plus size={13} color="#047857" strokeWidth={2.5} />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}

                        {/* Row 4: Metrics Row */}
                        <View style={styles.stockMetricsRow}>
                          <View style={styles.stockCol}>
                            <Text style={styles.stockColLabel}>Total Available</Text>
                            <Text style={[styles.stockColValue, { color: '#071B52' }]}>
                              {stockVal} units
                            </Text>
                          </View>
                          <View style={styles.stockCol}>
                            <Text style={styles.stockColLabel}>Reserved (Orders)</Text>
                            <Text style={styles.stockColValue}>{(p as any).reservedStock || 0} units</Text>
                          </View>
                          <View style={styles.stockCol}>
                            <Text style={styles.stockColLabel}>Low Alert Level</Text>
                            <Text style={styles.stockColValue}>{(p as any).threshold || 10} units</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ) : (
          // Desktop View: Keep full 1080px table with horizontal scroll
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ minWidth: 1080 }}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCol, { width: 230 }]}>PRODUCT SKU & TITLE</Text>
                <Text style={[styles.tableHeaderCol, { width: 120 }]}>CATEGORY</Text>
                <Text style={[styles.tableHeaderCol, { width: 120 }]}>SHELF LOCATION</Text>
                <Text style={[styles.tableHeaderCol, { width: 80 }]}>MRP</Text>
                <Text style={[styles.tableHeaderCol, { width: 110 }]}>SELLING PRICE</Text>
                <Text style={[styles.tableHeaderCol, { width: 110 }]}>STOCK LEVEL</Text>
                <Text style={[styles.tableHeaderCol, { width: 210 }]}>VARIANT-WISE STOCK</Text>
                <Text style={[styles.tableHeaderCol, { width: 100 }]}>STATUS</Text>
                <Text style={[styles.tableHeaderCol, { width: 140, textAlign: 'right' }]}>
                  AUDIT / ACTIONS
                </Text>
              </View>

              {/* Table Body */}
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyTableState}>
                  <Package size={36} color="#CBD5E1" style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyTableText}>
                    No inventory products match current warehouse filters.
                  </Text>
                </View>
              ) : (
                filteredProducts.map((p, idx) => {
                  const prodId = p.id;
                  const currentVarId =
                    selectedVariants[prodId] ||
                    (p.variants && p.variants[0] ? p.variants[0].id : '');
                  const currentVar =
                    (p.variants || []).find((v) => v.id === currentVarId) ||
                    (p.variants && p.variants[0]);

                  const currentVarData = currentVar ? getEffectiveVariantData(currentVar) : null;
                  const defaultVar = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
                  const defaultVarData = defaultVar ? getEffectiveVariantData(defaultVar) : null;

                  const effectiveSellingPrice = currentVarData
                    ? currentVarData.price
                    : defaultVarData
                    ? defaultVarData.price
                    : p.sellingPrice;
                  const effectiveMrp = currentVarData
                    ? currentVarData.mrp
                    : defaultVarData
                    ? defaultVarData.mrp
                    : p.mrp || p.sellingPrice;
                  const stockVal = currentVarData
                    ? currentVarData.stock
                    : p.stockKg !== undefined
                    ? p.stockKg
                    : 50;

                  const isEditingPrice = editingPriceId === p.id;
                  const isEditingStock = editingStockId === p.id;
                  const isEditingShelf = editingShelfId === p.id;
                  const isEditingVarStock =
                    editingVarStockId === (currentVar?.id || '');
                  const currentShelf = shelfLocations[p.id] || 'A1-R2';

                  return (
                    <View
                      key={p.id}
                      style={[
                        styles.tableRow,
                        idx % 2 === 1 && { backgroundColor: '#FBFDFE' },
                      ]}
                    >
                      {/* PRODUCT SKU & TITLE */}
                      <View style={[styles.tableCell, { width: 230 }]}>
                        <View style={styles.productCellWrap}>
                          {p.imageUrl ? (
                            <Image
                              source={{ uri: p.imageUrl }}
                              style={styles.productThumb}
                            />
                          ) : (
                            <View style={styles.productThumbFallback}>
                              <Package size={18} color="#1D4ED8" />
                            </View>
                          )}
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.productTitleText} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <Text style={styles.productSkuText}>
                              SKU-{p.id.slice(-6)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* CATEGORY */}
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText} numberOfLines={1}>
                            {p.category || 'Vegetables'}
                          </Text>
                        </View>
                      </View>

                      {/* SHELF LOCATION */}
                      <View style={[styles.tableCell, { width: 120 }]}>
                        {isEditingShelf ? (
                          <View style={styles.inlineEditWrap}>
                            <TextInput
                              style={styles.inlineInput}
                              value={editingShelfValue}
                              onChangeText={setEditingShelfValue}
                              autoFocus
                            />
                            <TouchableOpacity
                              style={styles.inlineSaveBtn}
                              onPress={() => handleSaveShelf(p.id)}
                            >
                              <Check size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.inlineCancelBtn}
                              onPress={() => setEditingShelfId(null)}
                            >
                              <X size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.shelfLocationBadge}
                            onPress={() => {
                              setEditingShelfId(p.id);
                              setEditingShelfValue(currentShelf);
                            }}
                            activeOpacity={0.7}
                          >
                            <Warehouse size={12} color="#64748B" />
                            <Text style={styles.shelfLocationText}>{currentShelf}</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* MRP */}
                      <View style={[styles.tableCell, { width: 80 }]}>
                        <Text style={styles.mrpText}>₹{effectiveMrp}</Text>
                      </View>

                      {/* SELLING PRICE */}
                      <View style={[styles.tableCell, { width: 110 }]}>
                        {isEditingPrice ? (
                          <View style={styles.inlineEditWrap}>
                            <TextInput
                              style={styles.inlineInput}
                              keyboardType="numeric"
                              value={editingPriceValue}
                              onChangeText={setEditingPriceValue}
                              autoFocus
                            />
                            <TouchableOpacity
                              style={styles.inlineSaveBtn}
                              onPress={() => handleSavePrice(p)}
                              disabled={savingPrice}
                            >
                              <Check size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.inlineCancelBtn}
                              onPress={() => setEditingPriceId(null)}
                            >
                              <X size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.priceRowWrap}
                            onPress={() => startEditPrice(p)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.sellingPriceText}>₹{effectiveSellingPrice}</Text>
                            {currentVarData?.isAreaCustom ? (
                              <View style={styles.zoneTag}>
                                <Text style={styles.zoneTagText}>Zone</Text>
                              </View>
                            ) : (
                              <Edit2 size={10} color="#94A3B8" style={{ marginLeft: 4 }} />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* STOCK LEVEL */}
                      <View style={[styles.tableCell, { width: 110 }]}>
                        {isEditingStock ? (
                          <View style={styles.inlineEditWrap}>
                            <TextInput
                              style={styles.inlineInput}
                              keyboardType="numeric"
                              value={editingStockValue}
                              onChangeText={setEditingStockValue}
                              autoFocus
                            />
                            <TouchableOpacity
                              style={styles.inlineSaveBtn}
                              onPress={() => handleSaveStock(p)}
                              disabled={savingStock}
                            >
                              <Check size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.inlineCancelBtn}
                              onPress={() => setEditingStockId(null)}
                            >
                              <X size={11} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.stockLevelWrap}
                            onPress={() => {
                              setEditingStockId(p.id);
                              setEditingStockValue(String(stockVal));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.stockLevelText,
                                stockVal < 15 && { color: '#DC2626' },
                              ]}
                            >
                              {stockVal} units
                            </Text>
                            {currentVarData?.isAreaCustom && (
                              <View style={styles.areaTag}>
                                <Text style={styles.areaTagText}>Area</Text>
                              </View>
                            )}
                            <Edit2 size={10} color="#94A3B8" style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* VARIANT-WISE STOCK */}
                      <View style={[styles.tableCell, { width: 210 }]}>
                        {p.variants && p.variants.length > 0 ? (
                          <View style={{ width: '100%' }}>
                            {/* Variant Selector Dropdown */}
                            {Platform.OS === 'web' ? (
                              <div style={{ position: 'relative', width: '100%' }}>
                                <select
                                  value={currentVarId}
                                  onChange={(e: any) =>
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [prodId]: e.target.value,
                                    }))
                                  }
                                  style={{
                                    width: '100%',
                                    padding: '5px 22px 5px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: '1.5px solid #CBD5E1',
                                    backgroundColor: '#FFFFFF',
                                    color: '#071B52',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    outline: 'none',
                                  }}
                                >
                                  {p.variants.map((v) => {
                                    const vData = getEffectiveVariantData(v);
                                    const vLabel = v.weightOrVolume || v.sku || 'Variant';
                                    return (
                                      <option key={v.id} value={v.id}>
                                        {vLabel} — {vData.stock} units (₹{vData.price})
                                      </option>
                                    );
                                  })}
                                </select>
                                <ChevronDown
                                  size={12}
                                  color="#64748B"
                                  style={{
                                    position: 'absolute',
                                    right: 6,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                  }}
                                />
                              </div>
                            ) : (
                              <TouchableOpacity
                                style={styles.variantSelectorPill}
                                onPress={() => {
                                  const idx = p.variants!.findIndex((v) => v.id === currentVarId);
                                  const nextVar = p.variants![(idx + 1) % p.variants!.length];
                                  if (nextVar) {
                                    setSelectedVariants((prev) => ({ ...prev, [prodId]: nextVar.id }));
                                  }
                                }}
                              >
                                <Text style={styles.variantSelectorText} numberOfLines={1}>
                                  {currentVar?.weightOrVolume || 'Variant'} — {currentVarData?.stock} units (₹{currentVarData?.price})
                                </Text>
                                <ChevronDown size={12} color="#64748B" />
                              </TouchableOpacity>
                            )}

                            {/* Selected Variant Stock Quick Edit Line */}
                            {currentVar && currentVarData && (
                              <View style={styles.variantQuickEditRow}>
                                <Text style={styles.variantUnitLabel}>
                                  {currentVar.weightOrVolume}:
                                </Text>

                                {isEditingVarStock ? (
                                  <View style={styles.inlineEditWrap}>
                                    <TextInput
                                      style={styles.inlineInput}
                                      keyboardType="numeric"
                                      value={editingVarStockValue}
                                      onChangeText={setEditingVarStockValue}
                                      autoFocus
                                    />
                                    <TouchableOpacity
                                      style={styles.inlineSaveBtn}
                                      onPress={async () => {
                                        const val = parseInt(editingVarStockValue, 10);
                                        if (!isNaN(val) && val >= 0) {
                                          setSavingVarStock(true);
                                          if (selectedAreaId !== 'ALL' && currentArea) {
                                            await updateVariantAreaPrice(
                                              p.id,
                                              currentVar.id,
                                              currentArea.id || (currentArea as any)._id,
                                              currentVarData.price,
                                              currentVarData.mrp,
                                              val
                                            );
                                          } else {
                                            await updateProductItem(p.id, { stockKg: val });
                                          }
                                          setSavingVarStock(false);
                                          setEditingVarStockId(null);
                                        }
                                      }}
                                    >
                                      <Check size={10} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.inlineCancelBtn}
                                      onPress={() => setEditingVarStockId(null)}
                                    >
                                      <X size={10} color="#FFFFFF" />
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.varStockTag}
                                    onPress={() => {
                                      setEditingVarStockId(currentVar.id);
                                      setEditingVarStockValue(String(currentVarData.stock));
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={styles.varStockTagText}>
                                      {currentVarData.stock} units
                                    </Text>
                                    {currentVarData.isAreaCustom && (
                                      <View style={styles.zoneMicroTag}>
                                        <Text style={styles.zoneMicroTagText}>Zone</Text>
                                      </View>
                                    )}
                                    <Edit2 size={9} color="#94A3B8" style={{ marginLeft: 3 }} />
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                          </View>
                        ) : (
                          <View style={styles.standardUnitTag}>
                            <Text style={styles.standardUnitText}>
                              Standard: <Text style={styles.boldNavy}>{stockVal} units</Text>
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* STATUS */}
                      <View style={[styles.tableCell, { width: 100 }]}>
                        <View
                          style={[
                            styles.statusBadge,
                            stockVal <= 0
                              ? styles.statusBadgeRed
                              : stockVal < 15
                              ? styles.statusBadgeAmber
                              : styles.statusBadgeGreen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              stockVal <= 0
                                ? styles.statusTextRed
                                : stockVal < 15
                                ? styles.statusTextAmber
                                : styles.statusTextGreen,
                            ]}
                          >
                            {stockVal <= 0
                              ? 'OUT OF STOCK'
                              : stockVal < 15
                              ? 'LOW STOCK'
                              : 'IN STOCK'}
                          </Text>
                        </View>
                      </View>

                      {/* AUDIT / ACTIONS */}
                      <View style={[styles.tableCell, { width: 140, justifyContent: 'flex-end' }]}>
                        <View style={styles.actionsBtnRow}>
                          <TouchableOpacity
                            style={styles.actionEditBtn}
                            onPress={() => {
                              setSelectedProduct(p);
                              setActiveModal('EditProduct');
                            }}
                            activeOpacity={0.8}
                          >
                            <Edit2 size={12} color="#071B52" />
                            <Text style={styles.actionEditBtnText}>Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionAuditBtn}
                            onPress={() => handleOpenAuditModal(p)}
                            activeOpacity={0.8}
                          >
                            <ClipboardList size={13} color="#4F46E5" />
                            <Text style={styles.actionAuditBtnText}>Audit</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* ========================================================================= */}
      {/* STOCK DISCREPANCY AUDIT MODAL (100% Matching Web Admin Portal)             */}
      {/* ========================================================================= */}
      {auditProduct && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ClipboardList size={20} color="#4F46E5" />
                  <Text style={styles.modalTitle}>Stock Discrepancy Audit</Text>
                </View>
                <TouchableOpacity onPress={() => setAuditProduct(null)} activeOpacity={0.7}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {auditSuccessBanner && (
                <View style={styles.modalSuccessBanner}>
                  <Check size={14} color="#065F46" style={{ marginRight: 6 }} />
                  <Text style={styles.modalSuccessBannerText}>{auditSuccessBanner}</Text>
                </View>
              )}

              <View style={styles.modalBody}>
                {/* Product Summary Box */}
                <View style={styles.auditProductSummary}>
                  <Text style={styles.auditProdName}>{auditProduct.name}</Text>
                  <Text style={styles.auditProdMeta}>
                    Fulfilling Store: <Text style={{ color: '#071B52', fontWeight: '700' }}>{currentStoreName}</Text>
                  </Text>
                  <Text style={styles.auditProdMeta}>
                    Current System Stock: <Text style={{ color: '#071B52', fontWeight: '800' }}>{auditProduct.stockKg || 50} units</Text>
                  </Text>
                </View>

                {/* Physical Stock Input */}
                <View style={styles.formFieldGroup}>
                  <Text style={styles.formLabel}>Physical Stock Count (Units)</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    placeholder="Enter actual counted units"
                    value={auditPhysicalStock}
                    onChangeText={setAuditPhysicalStock}
                  />
                  {(() => {
                    const recorded = auditProduct.stockKg || 50;
                    const physical = parseInt(auditPhysicalStock, 10) || 0;
                    const diff = physical - recorded;
                    return (
                      <Text style={[styles.diffNote, diff < 0 ? { color: '#DC2626' } : diff > 0 ? { color: '#059669' } : { color: '#64748B' }]}>
                        Discrepancy: {diff > 0 ? `+${diff}` : diff} units ({diff === 0 ? 'Balanced' : diff < 0 ? 'Shortage / Loss' : 'Surplus'})
                      </Text>
                    );
                  })()}
                </View>

                {/* Audit Reason Selector */}
                <View style={styles.formFieldGroup}>
                  <Text style={styles.formLabel}>Adjustment Reason</Text>
                  <View style={styles.reasonChipsWrap}>
                    {(['Miscount Correction', 'Damaged / Spoilage', 'Shrinkage / Theft', 'Expired Stock'] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.reasonChip, auditReason === r && styles.reasonChipActive]}
                        onPress={() => setAuditReason(r)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.reasonChipText, auditReason === r && styles.reasonChipTextActive]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Notes Input */}
                <View style={styles.formFieldGroup}>
                  <Text style={styles.formLabel}>Audit Notes (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, { height: 60 }]}
                    placeholder="e.g. Shelf audit conducted by floor manager"
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={auditNotes}
                    onChangeText={setAuditNotes}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setAuditProduct(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleAuditSubmit}
                  disabled={auditSubmitting}
                >
                  <Text style={styles.modalSubmitText}>
                    {auditSubmitting ? 'Logging...' : 'Submit Physical Audit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* City Picker Modal */}
      {showCityPicker && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 400 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Warehouse City</Text>
                <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.formInput, { margin: 16, marginBottom: 8 }]}
                placeholder="Search city..."
                value={citySearch}
                onChangeText={setCitySearch}
              />
              <ScrollView style={{ maxHeight: 300, paddingHorizontal: 16 }}>
                {activeCities
                  .filter((c) => c.name.toLowerCase().includes(citySearch.toLowerCase()))
                  .map((c) => (
                    <TouchableOpacity
                      key={c.id || (c as any)._id}
                      style={styles.pickerItemRow}
                      onPress={() => {
                        setSelectedCityId(c.id || (c as any)._id);
                        setSelectedAreaId('ALL');
                        setShowCityPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {c.name} ({c.code || 'AMD'})
                      </Text>
                      {(currentCity?.id === c.id || currentCity?.name === c.name) && (
                        <Check size={16} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Area Picker Modal */}
      {showAreaPicker && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 400 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Area (1:1 Dark Store)</Text>
                <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.formInput, { margin: 16, marginBottom: 8 }]}
                placeholder="Search area..."
                value={areaSearch}
                onChangeText={setAreaSearch}
              />
              <ScrollView style={{ maxHeight: 300, paddingHorizontal: 16 }}>
                <TouchableOpacity
                  style={styles.pickerItemRow}
                  onPress={() => {
                    setSelectedAreaId('ALL');
                    setShowAreaPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>All City Areas ({availableAreas.length})</Text>
                  {selectedAreaId === 'ALL' && <Check size={16} color="#4F46E5" />}
                </TouchableOpacity>
                {availableAreas
                  .filter((a) => a.name.toLowerCase().includes(areaSearch.toLowerCase()))
                  .map((a) => (
                    <TouchableOpacity
                      key={a.id || (a as any)._id}
                      style={styles.pickerItemRow}
                      onPress={() => {
                        setSelectedAreaId(a.id || (a as any)._id);
                        setShowAreaPicker(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {a.name} • {a.code || 'ZONE'}
                      </Text>
                      {currentArea?.id === a.id && <Check size={16} color="#4F46E5" />}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 400 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter by Category</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 320, padding: 16 }}>
                <TouchableOpacity
                  style={styles.pickerItemRow}
                  onPress={() => {
                    setSelectedCategory('ALL');
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>All Categories ({categories.length})</Text>
                  {selectedCategory === 'ALL' && <Check size={16} color="#4F46E5" />}
                </TouchableOpacity>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id || (c as any)._id}
                    style={styles.pickerItemRow}
                    onPress={() => {
                      setSelectedCategory(c.name);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{c.name}</Text>
                    {selectedCategory === c.name && <Check size={16} color="#4F46E5" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainContent: {
    padding: 24,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#071B52',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#071B52',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addProductBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cascadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cascadingGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  cascadingCol: {
    flex: 1,
    minWidth: 260,
  },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  stepLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selectorBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#071B52',
    flex: 1,
  },
  lockedStoreBanner: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  storeNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  lockedAreaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedAreaPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  storeMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  storeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  storeChipLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  storeChipVal: {
    fontSize: 11,
    color: '#071B52',
    fontWeight: '800',
  },
  boldNavy: {
    color: '#071B52',
    fontWeight: '700',
  },
  pinkMono: {
    color: '#FF3B98',
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  kpiValueNavy: {
    fontSize: 22,
    fontWeight: '900',
    color: '#071B52',
    marginVertical: 4,
  },
  kpiValueGreen: {
    fontSize: 22,
    fontWeight: '900',
    color: '#065F46',
    marginVertical: 4,
  },
  kpiValuePurple: {
    fontSize: 22,
    fontWeight: '900',
    color: '#5B21B6',
    marginVertical: 4,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#64748B',
  },
  kpiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  tabButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#071B52',
    borderColor: '#071B52',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#071B52',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 170,
  },
  categoryDropdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071B52',
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 200,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#071B52',
    padding: 0,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCol: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tableCell: {
    justifyContent: 'center',
  },
  productCellWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  productThumbFallback: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
  },
  productSkuText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF3B98',
    marginTop: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  shelfLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  shelfLocationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
  },
  mrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  priceRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellingPriceText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#071B52',
  },
  zoneTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  zoneTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4F46E5',
  },
  stockLevelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLevelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
  },
  areaTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  areaTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  variantSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  variantSelectorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#071B52',
    flex: 1,
  },
  variantQuickEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  variantUnitLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  varStockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  varStockTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  zoneMicroTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 3,
    borderRadius: 3,
    marginLeft: 3,
  },
  zoneMicroTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#4F46E5',
  },
  standardUnitTag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  standardUnitText: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeGreen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeAmber: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgeRed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextGreen: {
    color: '#047857',
  },
  statusTextAmber: {
    color: '#D97706',
  },
  statusTextRed: {
    color: '#DC2626',
  },
  actionsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionEditBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
  },
  actionAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionAuditBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  inlineEditWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineInput: {
    width: 60,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    color: '#071B52',
  },
  inlineSaveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 4,
    padding: 3,
  },
  inlineCancelBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 4,
    padding: 3,
  },
  emptyTableState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
  },
  modalSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 10,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 8,
  },
  modalSuccessBannerText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  auditProductSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  auditProdName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 4,
  },
  auditProdMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  formFieldGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#071B52',
    backgroundColor: '#FFFFFF',
  },
  diffNote: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  reasonChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reasonChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  reasonChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  reasonChipTextActive: {
    color: '#4F46E5',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#071B52',
  },
  // Store Header Banner (Matching Store App 1:1)
  topStoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  // Store Top Search & Action Bar
  storeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  storeSearchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  storeSearchInput: {
    flex: 1,
    color: '#071B52',
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  storeAddProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  storeAddProductBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  storeLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  storeLogsBtnText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '800',
  },
  // Filter Tabs
  storeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  storeFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storeFilterPillActive: {
    backgroundColor: '#071B52',
    borderColor: '#071B52',
  },
  storeFilterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  storeFilterTextActive: {
    color: '#FFFFFF',
  },
  storeTableCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  // Mobile 2-Column Responsive Styles & + / - Drawer
  mobileTableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mobileTableHeaderCol: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  mobileTableRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mobileTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mobileProductInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  mobileActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileToggleBtnExpanded: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  mobileExpandedSection: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 12,
    gap: 10,
  },
  drawerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  drawerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepperValText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#071B52',
  },
  drawerTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  drawerMiniCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // Variants Box & Rows
  variantsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  variantsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  variantItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  variantWeight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071B52',
  },
  variantPriceText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  variantStockCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  variantStockSub: {
    fontSize: 9,
    color: '#94A3B8',
  },
  quickStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStepBtnPlus: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  // Metrics Row
  stockMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  stockCol: {
    flex: 1,
    alignItems: 'center',
  },
  stockColLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  stockColValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 2,
  },
});
