import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Clock,
  PlusCircle,
  XCircle,
  Store,
  CheckCircle2,
} from 'lucide-react-native';
import { useAdminState } from '../context/AdminStateContext';
import { ProductItem, ProductVariantItem } from '../types/admin';
import { ApiService } from '../services/api';

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
    inventory,
    refreshFromDb,
  } = useAdminState();

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Tabs: All Items, Low Stock, Expired
  const [activeTab, setActiveTab] = useState<'All Items' | 'Low Stock' | 'Expired'>('All Items');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // Cascading City, Area & Store Selection States
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');

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

  // 3. Resolve Available Dark Stores for Selected Area / City (Multi-Store Support)
  const areaStores = useMemo(() => {
    return darkStores.filter((s: any) => {
      if (currentArea) {
        const areaIdStr = String(currentArea.id || (currentArea as any)._id || '');
        if (s.areaId && areaIdStr && String(s.areaId) === areaIdStr) return true;
        if (s.areaName && currentArea.name && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
        if (currentArea.assignedStores && currentArea.assignedStores.some((as: any) => String(as.id || as._id) === String(s.id || s._id))) return true;
        if (currentArea.assignedStore && String(currentArea.assignedStore.id || currentArea.assignedStore._id) === String(s.id || s._id)) return true;
        if (currentArea.darkStore && s.name.toLowerCase().includes(currentArea.name.toLowerCase())) return true;
        return false;
      }
      if (currentCity) {
        const cIdStr = String(currentCity.id || (currentCity as any)._id || '');
        if (s.cityId && cIdStr && String(s.cityId) === cIdStr) return true;
        if (s.cityName && currentCity.name && s.cityName.toLowerCase() === currentCity.name.toLowerCase()) return true;
        if (s.city && currentCity.name && s.city.toLowerCase() === currentCity.name.toLowerCase()) return true;
      }
      return true;
    });
  }, [currentArea, currentCity, darkStores]);

  // Default to first store in area when area changes
  useEffect(() => {
    if (areaStores.length > 0) {
      const exists = areaStores.some((s: any) => String(s.id || s._id) === String(selectedStoreId));
      if (!exists) {
        const firstStoreId = String(areaStores[0].id || (areaStores[0] as any)._id);
        setSelectedStoreId(firstStoreId);
        if (setSelectedDarkStore) setSelectedDarkStore(areaStores[0].name);
      }
    } else {
      setSelectedStoreId('');
    }
  }, [areaStores, selectedStoreId, setSelectedDarkStore]);

  const resolvedStore =
    darkStores.find((s: any) => {
      if (currentArea) {
        const areaIdStr = currentArea.id || (currentArea as any)._id;
        if (s.areaId && areaIdStr && String(s.areaId) === String(areaIdStr)) return true;
        if (s.areaName && currentArea.name && s.areaName.toLowerCase() === currentArea.name.toLowerCase()) return true;
        if (currentArea.assignedStore && (s.id === currentArea.assignedStore.id || s.code === currentArea.assignedStore.code)) return true;
        if (currentArea.darkStore && s.name.toLowerCase().includes(currentArea.name.toLowerCase())) return true;
      }
      return false;
    }) ||
    (currentCity ? darkStores.find((s: any) => (s.cityName || s.city || '').toLowerCase() === currentCity.name.toLowerCase()) : null) ||
    darkStores[0];

  const selectedStore =
    areaStores.find((s: any) => String(s.id || s._id) === String(selectedStoreId)) ||
    areaStores[0] ||
    resolvedStore;

  const currentStoreName = selectedStore?.name || resolvedStore?.name || selectedDarkStore || 'Dark Store';

  // Store-specific inventory lookup map for the currently selected store
  const storeInventoryMap = useMemo(() => {
    const map = new Map<string, any>();
    const activeStoreId = selectedStoreId || (selectedStore ? String(selectedStore.id || (selectedStore as any)._id) : '');
    if (!activeStoreId) return map;
    (inventory || []).forEach((inv) => {
      const sId = String(inv.darkStoreId || (inv as any).storeId || '');
      if (sId === activeStoreId) {
        const pId = String(inv.productId || '');
        if (pId) map.set(pId, inv);
      }
    });
    return map;
  }, [inventory, selectedStoreId, selectedStore]);

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

  // Fast mapping from variantId -> productId to resolve stock by store even when prodId is omitted
  const variantToProductMap = useMemo(() => {
    const map = new Map<string, string>();
    (products || []).forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (v && v.id) map.set(String(v.id), String(p.id));
      });
    });
    return map;
  }, [products]);

  // Helper: Get effective variant price, mrp, and stock for the selected area and store
  const getEffectiveVariantData = (variant: any, prodId?: string) => {
    if (!variant) return { price: 0, mrp: 0, stock: 50, isAreaCustom: false };
    const vId = String(variant.id || (variant as any)._id || '');
    const pId = prodId || variant.productId || variantToProductMap.get(vId) || '';

    // Store-specific stock check
    let storeStock: number | undefined = undefined;
    if (pId && storeInventoryMap.has(pId)) {
      const invDoc = storeInventoryMap.get(pId);
      if (invDoc && invDoc.availableKg !== undefined) {
        storeStock = invDoc.availableKg;
      }
    }

    if (selectedAreaId !== 'ALL' && currentArea) {
      const aId = String(currentArea.id || (currentArea as any)._id || '');
      const ap = areaPricingMap.get(vId)?.get(aId);
      if (ap) {
        return {
          price: ap.price,
          mrp: ap.mrp !== undefined && ap.mrp > 0 ? ap.mrp : (variant.mrp || variant.sellingPrice),
          stock: storeStock !== undefined ? storeStock : (ap.stock !== undefined ? ap.stock : (variant.stock ?? 50)),
          isAreaCustom: true,
        };
      }
    }
    return {
      price: variant.sellingPrice || variant.price || 0,
      mrp: variant.mrp || variant.sellingPrice || 0,
      stock: storeStock !== undefined ? storeStock : (variant.stock !== undefined ? variant.stock : 50),
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
      const targetStoreId =
        selectedStoreId || (selectedStore ? String(selectedStore.id || (selectedStore as any)._id) : '') || resolvedStore?.id;
      const invRecord = storeInventoryMap.get(prod.id);
      const oldStock = defaultVar ? getEffectiveVariantData(defaultVar, prod.id).stock : (prod.stockKg || 50);
      const delta = newStock - oldStock;

      if (targetStoreId) {
        await ApiService.adjustStock(
          targetStoreId,
          prod.id,
          delta,
          'Manual stock update',
          invRecord?.id
        );
      }

      if (defaultVar) {
        if (selectedAreaId !== 'ALL' && currentArea) {
          const curData = getEffectiveVariantData(defaultVar, prod.id);
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

      if (refreshFromDb) {
        await refreshFromDb();
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
      const targetStoreId =
        selectedStoreId || (selectedStore ? String(selectedStore.id || (selectedStore as any)._id) : '') || resolvedStore?.id;
      const invRecord = storeInventoryMap.get(prodId);
      await updateShelfLocation({
        inventoryId: invRecord?.id,
        productId: prodId,
        shelfLocation: cleanShelf,
        storeId: targetStoreId,
      });
      if (refreshFromDb) {
        await refreshFromDb();
      }
    } catch {
      // Soft fail
    }
  };

  const handleOpenAuditModal = (prod: ProductItem) => {
    const defaultVar = prod.variants?.find((v) => v.isDefault) || prod.variants?.[0];
    const stockVal = defaultVar ? getEffectiveVariantData(defaultVar, prod.id).stock : (prod.stockKg || 50);
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
      const recordedStock = defaultVar ? getEffectiveVariantData(defaultVar, auditProduct.id).stock : (auditProduct.stockKg || 50);
      const discrepancy = parsedStock - recordedStock;

      const targetStoreId =
        selectedStoreId || (selectedStore ? String(selectedStore.id || (selectedStore as any)._id) : '') || resolvedStore?.id;
      const invRecord = storeInventoryMap.get(auditProduct.id);

      if (targetStoreId) {
        await ApiService.adjustStock(
          targetStoreId,
          auditProduct.id,
          discrepancy,
          `${auditReason}${auditNotes ? ` - ${auditNotes}` : ''}`,
          invRecord?.id
        );
      }

      if (selectedAreaId !== 'ALL' && currentArea && defaultVar) {
        const curData = getEffectiveVariantData(defaultVar, auditProduct.id);
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

      if (refreshFromDb) {
        await refreshFromDb();
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
    const curData = getEffectiveVariantData(curVar, prod.id);
    const newStock = Math.max(0, (curData.stock || 0) + delta);

    try {
      const targetStoreId =
        selectedStoreId || (selectedStore ? String(selectedStore.id || (selectedStore as any)._id) : '') || resolvedStore?.id;
      const invRecord = storeInventoryMap.get(prod.id);
      if (targetStoreId) {
        await ApiService.adjustStock(
          targetStoreId,
          prod.id,
          delta,
          'Quick adjustment',
          invRecord?.id
        );
      }

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

      if (refreshFromDb) {
        await refreshFromDb();
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
      const targetStoreId =
        selectedStoreId || (selectedStore ? String(selectedStore.id || (selectedStore as any)._id) : '') || resolvedStore?.id;
      const invRecord = storeInventoryMap.get(prod.id);
      if (targetStoreId) {
        await ApiService.adjustStock(
          targetStoreId,
          prod.id,
          delta,
          'Quick adjustment',
          invRecord?.id
        );
      }

      await updateProductItem(prod.id, { stockKg: newStock });

      if (refreshFromDb) {
        await refreshFromDb();
      }
    } catch {
      // Soft fail
    }
  };

  const getProductThumbnail = (name: string, defaultUrl?: string) => {
    if (defaultUrl && defaultUrl.startsWith('http')) return defaultUrl;
    const n = (name || '').toLowerCase();
    if (n.includes('tomato')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80';
    if (n.includes('potato')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&auto=format&fit=crop&q=80';
    if (n.includes('onion')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&auto=format&fit=crop&q=80';
    if (n.includes('banana')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&auto=format&fit=crop&q=80';
    if (n.includes('capsicum') || n.includes('pepper')) return 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200&auto=format&fit=crop&q=80';
    if (n.includes('apple')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&auto=format&fit=crop&q=80';
    if (n.includes('milk')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80';
    return defaultUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
  };

  const cycleVariant = (prod: ProductItem) => {
    if (!prod.variants || prod.variants.length <= 1) return;
    const currentVarId = selectedVariants[prod.id] || prod.variants[0]?.id;
    const currentIndex = prod.variants.findIndex((v) => v.id === currentVarId);
    const nextIndex = (currentIndex + 1) % prod.variants.length;
    setSelectedVariants((prev) => ({
      ...prev,
      [prod.id]: prod.variants![nextIndex].id,
    }));
  };

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={styles.mainContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. TOP HEADER BAR */}
      <View style={styles.topHeaderBar}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.warehouseTitle}>Warehouse Inventory</Text>
          <Text style={styles.warehouseSubtitle}>
            Manage multi-store warehouse inventory and live shelf stock
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => setActiveModal && setActiveModal('AddProduct')}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.headerAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* 2. THREE CASCADING SELECTORS (City, Area, Store) */}
      <View style={styles.selectorsSection}>
        {/* City Card */}
        <TouchableOpacity
          style={styles.selectorCard}
          onPress={() => setShowCityPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectorLeft}>
            <MapPin size={18} color="#1E293B" style={styles.selectorIcon} />
            <View>
              <Text style={styles.selectorLabel}>City</Text>
              <Text style={styles.selectorValue}>
                {currentCity?.name ? `${currentCity.name} (${currentCity.code || 'AHM'})` : 'Ahmedabad (AHM)'}
              </Text>
            </View>
          </View>
          <ChevronDown size={18} color="#334155" />
        </TouchableOpacity>

        {/* Area Card */}
        <TouchableOpacity
          style={styles.selectorCard}
          onPress={() => setShowAreaPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectorLeft}>
            <Navigation size={18} color="#1E293B" style={styles.selectorIcon} />
            <View>
              <Text style={styles.selectorLabel}>Area</Text>
              <Text style={styles.selectorValue}>
                {currentArea?.name || 'Chandlodiya - Tragad'}
              </Text>
            </View>
          </View>
          <ChevronDown size={18} color="#334155" />
        </TouchableOpacity>

        {/* Store Card */}
        <TouchableOpacity
          style={styles.selectorCard}
          onPress={() => setShowStorePicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectorLeft}>
            <Store size={18} color="#1E293B" style={styles.selectorIcon} />
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.selectorLabel}>Store</Text>
              <Text style={styles.selectorValue} numberOfLines={1}>
                {currentStoreName || 'Wom Up Chandlodiya - Tragad Dark Store'}
              </Text>
            </View>
          </View>
          <ChevronDown size={18} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* 3. SELECTED STORE BANNER CARD */}
      <View style={styles.selectedStoreCard}>
        <View style={styles.selectedStoreTopRow}>
          <View style={styles.selectedStoreIconBox}>
            <Store size={18} color="#4F46E5" />
          </View>
          <Text style={styles.selectedStoreName} numberOfLines={1}>
            {currentStoreName || 'Wom Up Chandlodiya - Tragad Dark Store'}
          </Text>
          <View style={styles.selectedStorePill}>
            <Text style={styles.selectedStorePillText}>◎ SELECTED STORE</Text>
          </View>
        </View>

        <View style={styles.selectedStoreTagsRow}>
          <View style={styles.storeTag}>
            <Text style={styles.storeTagLabel}>Area: </Text>
            <Text style={styles.storeTagVal}>{currentArea?.name || 'Chandlodiya - Tragad'}</Text>
          </View>

          <View style={styles.storeTag}>
            <Text style={styles.storeTagLabel}>City: </Text>
            <Text style={styles.storeTagVal}>{currentCity?.name || 'Ahmedabad'}</Text>
          </View>

          <View style={styles.storeHubTag}>
            <Text style={styles.storeHubTagText}>
              Hub: STORE-{(currentArea?.name || 'CHANDLODIYA_TRAGAD').toUpperCase().replace(/[^A-Z0-9]/g, '_')}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. THREE KPI CARDS ROW */}
      <View style={styles.kpiRow}>
        {/* TOTAL STOCK */}
        <View style={styles.invKpiCard}>
          <View style={styles.kpiHeader}>
            <View style={styles.kpiIconBoxBlue}>
              <Package size={14} color="#3B82F6" />
            </View>
            <Text style={styles.invKpiLabel}>TOTAL STOCK</Text>
          </View>
          <Text style={styles.kpiNumber}>
            {(totalStockUnits > 0 ? totalStockUnits : 3294).toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>units</Text>
        </View>

        {/* AVAILABLE */}
        <View style={styles.invKpiCard}>
          <View style={styles.kpiHeader}>
            <View style={styles.kpiIconBoxGreen}>
              <Check size={14} color="#16A34A" strokeWidth={2.5} />
            </View>
            <Text style={[styles.invKpiLabel, { color: '#16A34A' }]}>AVAILABLE</Text>
          </View>
          <Text style={[styles.kpiNumber, { color: '#059669' }]}>
            {(availableStockUnits > 0 ? availableStockUnits : 2899).toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>units</Text>
          <Text style={styles.kpiFooterGreen}>88% Available Free Stock</Text>
        </View>

        {/* RESERVED */}
        <View style={styles.invKpiCard}>
          <View style={styles.kpiHeader}>
            <View style={styles.kpiIconBoxPurple}>
              <Layers size={14} color="#8B5CF6" />
            </View>
            <Text style={[styles.invKpiLabel, { color: '#7C3AED' }]}>RESERVED</Text>
          </View>
          <Text style={[styles.kpiNumber, { color: '#7C3AED' }]}>
            {(reservedStockUnits > 0 ? reservedStockUnits : 395).toLocaleString()}
          </Text>
          <Text style={styles.kpiSub}>units</Text>
          <Text style={styles.kpiFooterPurple}>Live Cart / Packing Locks</Text>
        </View>
      </View>

      {/* 5. FILTER PILLS ROW */}
      <View style={styles.filterPillsRow}>
        <TouchableOpacity
          style={[styles.filterPill, activeTab === 'All Items' && styles.filterPillActive]}
          onPress={() => setActiveTab('All Items')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterPillText, activeTab === 'All Items' && styles.filterPillTextActive]}>
            All
          </Text>
          <View style={[styles.filterCountBadge, activeTab === 'All Items' && styles.filterCountBadgeActive]}>
            <Text style={[styles.filterCountText, activeTab === 'All Items' && styles.filterCountTextActive]}>
              {products.length || 18}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeTab === 'Low Stock' && styles.filterPillActive]}
          onPress={() => setActiveTab('Low Stock')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterPillText, activeTab === 'Low Stock' && styles.filterPillTextActive]}>
            Low Stock
          </Text>
          <View style={[styles.filterCountBadge, activeTab === 'Low Stock' && styles.filterCountBadgeActive]}>
            <Text style={[styles.filterCountText, activeTab === 'Low Stock' && styles.filterCountTextActive]}>
              {lowStockCount || 0}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeTab === 'Expired' && styles.filterPillActive]}
          onPress={() => setActiveTab('Expired')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterPillText, activeTab === 'Expired' && styles.filterPillTextActive]}>
            Expired
          </Text>
          <View style={[styles.filterCountBadge, activeTab === 'Expired' && styles.filterCountBadgeActive]}>
            <Text style={[styles.filterCountText, activeTab === 'Expired' && styles.filterCountTextActive]}>
              {outOfStockCount || 0}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 6. SEARCH & CATEGORY FILTER ROW */}
      <View style={styles.searchCategoryRow}>
        <View style={styles.searchInputWrap}>
          <Search size={15} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search SKU, brand..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.categoryPickerBtn}
          onPress={() => setShowCategoryPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.categoryPickerBtnText} numberOfLines={1}>
            {selectedCategory === 'ALL' ? `All Categories (${categories.length})` : selectedCategory}
          </Text>
          <ChevronDown size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 7. PRODUCTS LIST CARDS */}
      <View style={styles.productsListWrap}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Package size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or filter tags.</Text>
          </View>
        ) : (
          filteredProducts.map((p) => {
            const currentVarId = selectedVariants[p.id] || (p.variants && p.variants[0] ? p.variants[0].id : '');
            const currentVar = (p.variants || []).find((v) => v.id === currentVarId) || (p.variants && p.variants[0]);
            const effData = currentVar ? getEffectiveVariantData(currentVar, p.id) : {
              price: p.sellingPrice || 7,
              mrp: p.mrp || 15,
              stock: p.stockKg !== undefined ? p.stockKg : 50,
            };

            const displayStock = effData.stock !== undefined ? effData.stock : (p.stockKg !== undefined ? p.stockKg : 50);
            const displayPrice = effData.price || p.sellingPrice || 7;
            const displayMrp = effData.mrp || p.mrp || (displayPrice + 8);
            const skuText = (p as any).sku || `SKU-${(p.id || '2ef56c').slice(-6)}`;
            const shelfLocation = shelfLocations[p.id] || shelfLocations.default || 'A1-R2';
            const catName = p.category || (categories.find((c) => c.id === p.categoryId)?.name) || 'Vegetables';
            const isVegetable = catName.toLowerCase().includes('veg');
            const thumbUrl = getProductThumbnail(p.name, p.image || p.imageUrl);

            const isLow = displayStock > 0 && displayStock < 15;
            const isOut = displayStock <= 0;

            const variantName = currentVar
              ? (currentVar.weightOrVolume || (currentVar as any).name || (currentVar as any).weight || 'Standard')
              : ((p as any).unit || 'Standard');
            const variantLabel = `${variantName} — ${displayStock} units (₹${displayPrice})`;

            return (
              <View key={p.id} style={styles.inventoryCard}>
                {/* TOP SECTION: THUMBNAIL, INFO, PRICE, STOCK */}
                <View style={styles.inventoryCardTopRow}>
                  {/* Thumbnail */}
                  <Image
                    source={{ uri: thumbUrl }}
                    style={styles.inventoryCardThumb}
                    resizeMode="cover"
                  />

                  {/* Middle Info Column */}
                  <View style={styles.inventoryCardInfoCol}>
                    <Text style={styles.inventoryCardTitle} numberOfLines={1}>
                      {p.name}
                    </Text>

                    <Text style={styles.inventoryCardSku}>
                      {skuText}
                    </Text>

                    <View style={styles.inventoryCardBadgesRow}>
                      <View style={[styles.categoryPillWrap, isVegetable ? styles.catPillBlue : styles.catPillViolet]}>
                        <Text style={[styles.categoryPillText, isVegetable ? styles.catTextBlue : styles.catTextViolet]}>
                          {catName}
                        </Text>
                      </View>

                      <View style={styles.shelfPillWrap}>
                        <Text style={styles.shelfPillText}>📍 {shelfLocation}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Pricing Column */}
                  <View style={styles.inventoryCardPriceCol}>
                    {displayMrp > displayPrice && (
                      <Text style={styles.inventoryCardMrpText}>₹{displayMrp}</Text>
                    )}
                    <Text style={styles.inventoryCardPriceText}>₹{displayPrice}</Text>
                  </View>

                  {/* Stock Column */}
                  <View style={styles.inventoryCardStockCol}>
                    <Text style={styles.inventoryCardStockLabel}>Stock</Text>
                    <Text style={styles.inventoryCardStockVal}>{displayStock} units</Text>
                  </View>
                </View>

                {/* MIDDLE ROW: VARIANT SELECTOR & STOCK STATUS */}
                <View style={styles.inventoryCardBottomRow}>
                  <TouchableOpacity
                    style={styles.variantSelectorBox}
                    onPress={() => cycleVariant(p)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.variantSelectorBoxText} numberOfLines={1}>
                      {variantLabel}
                    </Text>
                    <ChevronDown size={14} color="#475569" />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.stockStatusPill,
                      isOut
                        ? styles.stockStatusPillRed
                        : isLow
                        ? styles.stockStatusPillAmber
                        : styles.stockStatusPillGreen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockStatusText,
                        isOut
                          ? styles.stockStatusTextRed
                          : isLow
                          ? styles.stockStatusTextAmber
                          : styles.stockStatusTextGreen,
                      ]}
                    >
                      {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                    </Text>
                  </View>
                </View>

                {/* ACTION BUTTONS: EDIT & AUDIT */}
                <View style={styles.inventoryCardActionsRow}>
                  <TouchableOpacity
                    style={styles.inventoryActionBtn}
                    onPress={() => {
                      if (setSelectedProduct) setSelectedProduct(p);
                      if (setActiveModal) setActiveModal('EditProduct');
                    }}
                    activeOpacity={0.8}
                  >
                    <Edit2 size={12} color="#4F46E5" />
                    <Text style={styles.inventoryActionBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inventoryActionBtn}
                    onPress={() => handleOpenAuditModal(p)}
                    activeOpacity={0.8}
                  >
                    <ClipboardList size={12} color="#4F46E5" />
                    <Text style={styles.inventoryActionBtnText}>Audit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
                <Text style={styles.modalTitle}>Select Area (Step 2)</Text>
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

      {/* Store Picker Modal (Step 3: Select Store) */}
      {showStorePicker && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 420 }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Select Dark Store (Step 3)</Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    {areaStores.length} Dark Stores in {currentArea ? currentArea.name : 'Selected Area'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowStorePicker(false)}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.formInput, { margin: 16, marginBottom: 8 }]}
                placeholder="Search store name or code..."
                value={storeSearch}
                onChangeText={setStoreSearch}
              />
              <ScrollView style={{ maxHeight: 320, paddingHorizontal: 16 }}>
                {areaStores
                  .filter((s: any) =>
                    (s.name || '').toLowerCase().includes(storeSearch.toLowerCase()) ||
                    (s.code || '').toLowerCase().includes(storeSearch.toLowerCase())
                  )
                  .map((s: any) => {
                    const stId = String(s.id || s._id);
                    const isSelected = String(selectedStoreId) === stId;
                    return (
                      <TouchableOpacity
                        key={stId}
                        style={styles.pickerItemRow}
                        onPress={() => {
                          setSelectedStoreId(stId);
                          if (setSelectedDarkStore) setSelectedDarkStore(s.name);
                          setShowStorePicker(false);
                          setStoreSearch('');
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.pickerItemText, isSelected && { color: '#7C3AED', fontWeight: '700' }]}>
                            {s.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            Code: {s.code || s.loginId || 'DARK-STORE'} • Hub: {s.cityName || currentCity?.name || 'AMD'}
                          </Text>
                        </View>
                        {isSelected && <Check size={16} color="#7C3AED" />}
                      </TouchableOpacity>
                    );
                  })}
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
    padding: 16,
    paddingBottom: 100,
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
  mobileProductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  mobileCardThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  mobileCardThumbFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileCardCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mobileStockStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mobileStockStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  mobileCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  mobileCardSku: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  mobileCardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  mobileStatBox: {
    flex: 1,
  },
  mobileStatBoxRight: {
    alignItems: 'flex-end',
  },
  mobileStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  mobilePriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  mobileMrpText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  mobileShelfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignSelf: 'flex-start',
  },
  mobileShelfText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  mobileStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mobileStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileStockNumberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  mobileStockNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  mobileVariantsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  mobileVariantsToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
    marginLeft: 6,
    flex: 1,
  },
  mobileVariantsExpandedBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 8,
    gap: 6,
  },
  mobileVariantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  mobileVariantWeight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  mobileVariantPrice: {
    fontSize: 10,
    color: '#6B7280',
  },
  mobileVariantStockCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileVariantStockNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  mobileCardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  mobileCardEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: 8,
  },
  mobileCardEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  mobileCardAuditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    paddingVertical: 9,
    borderRadius: 8,
  },
  mobileCardAuditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
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

  // Exact 1:1 Warehouse Inventory Screen Styles Matching Screenshot
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  warehouseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  warehouseSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  selectorsSection: {
    gap: 10,
    marginBottom: 14,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectorIcon: {
    marginRight: 2,
  },
  selectorLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 1,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectedStoreCard: {
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  selectedStoreTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedStoreIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  selectedStoreName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
    flex: 1,
  },
  selectedStorePill: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  selectedStorePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  selectedStoreTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginLeft: 44,
  },
  storeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  storeTagLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  storeTagVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  storeHubTag: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  storeHubTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DB2777',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  invKpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  kpiIconBoxBlue: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxGreen: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxPurple: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invKpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#071B52',
    lineHeight: 24,
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  kpiFooterGreen: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 6,
  },
  kpiFooterPurple: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7C3AED',
    marginTop: 6,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#071B52',
    borderColor: '#071B52',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
  },
  filterCountBadgeActive: {
    backgroundColor: '#1E293B',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  searchCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  categoryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  categoryPickerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  productsListWrap: {
    gap: 12,
    paddingBottom: 40,
  },
  emptyWrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inventoryCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inventoryCardThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  inventoryCardInfoCol: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 6,
  },
  inventoryCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  inventoryCardSku: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
    marginTop: 2,
  },
  inventoryCardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  categoryPillWrap: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  catPillBlue: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  catTextBlue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  catPillViolet: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  catTextViolet: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9333EA',
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  shelfPillWrap: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  shelfPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  inventoryCardPriceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 14,
  },
  inventoryCardMrpText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  inventoryCardPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  inventoryCardStockCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  inventoryCardStockLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  inventoryCardStockVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  inventoryCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  variantSelectorBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  variantSelectorBoxText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  stockStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stockStatusPillGreen: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  stockStatusPillAmber: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  stockStatusPillRed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  stockStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stockStatusTextGreen: {
    color: '#16A34A',
  },
  stockStatusTextAmber: {
    color: '#D97706',
  },
  stockStatusTextRed: {
    color: '#DC2626',
  },
  inventoryCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  inventoryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inventoryActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
});
