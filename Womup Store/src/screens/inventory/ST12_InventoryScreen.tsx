import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { InventoryItem } from '../../types/store.types';
import { StockAdjustmentModal } from '../../components/modals/StockAdjustmentModal';
import { EditShelfModal } from '../../components/modals/EditShelfModal';
import { COLORS } from '../../theme/colors';

export const ST12_InventoryScreen: React.FC = () => {
  const {
    store,
    staff,
    inventory,
    inventoryFilter,
    setInventoryFilter,
    inventorySearch,
    setInventorySearch,
    adjustStock,
    updateShelfLocation,
    refreshInventory,
    setSubScreen,
    isLoading,
  } = useStore();

  // Accordion Expand/Collapse state: map of productId -> boolean ("another thing show in + / -")
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Detailed Stock Adjustment Modal (Damage, Return, etc.)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Shelf Location Edit Modal
  const [editShelfItem, setEditShelfItem] = useState<InventoryItem | null>(null);
  const [editShelfVisible, setEditShelfVisible] = useState(false);

  // Inline Direct Stock Edit State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<string>('');
  const [savingStock, setSavingStock] = useState(false);

  // Stock Discrepancy Audit Modal State (matches Admin Stock Discrepancy Audit)
  const [auditItem, setAuditItem] = useState<InventoryItem | null>(null);
  const [auditPhysicalStock, setAuditPhysicalStock] = useState<string>('');
  const [auditReason, setAuditReason] = useState<
    'Miscount Correction' | 'Damaged / Spoilage' | 'Shrinkage / Theft' | 'Expired Stock'
  >('Miscount Correction');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditSubmitting, setAuditSubmitting] = useState(false);
  const [auditSuccessBanner, setAuditSuccessBanner] = useState<string | null>(null);

  const currentStoreName = store?.name || 'Chandlodiya - Tragad Dark Store';
  const currentStoreCode = store?.code || 'STORE-CHANDLODIYA_TRAGAD';
  const currentAreaName = store?.areaName || 'Chandlodiya - Tragad';

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleOpenEditShelf = (item: InventoryItem) => {
    setEditShelfItem(item);
    setEditShelfVisible(true);
  };

  const handleConfirmAdjust = async (
    delta: number,
    reason: string,
    changeType: string,
    variantId?: string
  ) => {
    if (!selectedItem) return;
    await adjustStock(selectedItem.productId, delta, reason, changeType, variantId);
    await refreshInventory();
  };

  // Quick Stepper (+ / -) by 1 unit
  const handleQuickStep = async (
    productId: string,
    delta: number,
    variantId?: string
  ) => {
    const reason = delta > 0 ? 'Quick Restock (+1)' : 'Quick Adjustment (-1)';
    await adjustStock(productId, delta, reason, 'ADJUSTMENT', variantId);
  };

  // Inline Direct Save of Stock Count
  const handleSaveInlineStock = async (item: InventoryItem, variantId?: string) => {
    const newQty = parseInt(editingStockValue, 10);
    if (isNaN(newQty) || newQty < 0) {
      Alert.alert('Invalid Count', 'Please enter a valid stock quantity.');
      return;
    }
    const currentBaseQty = variantId
      ? item.variants?.find((v) => v.id === variantId)?.stock ?? item.availableQty
      : item.availableQty;
    const delta = newQty - currentBaseQty;
    if (delta === 0) {
      setEditingStockId(null);
      return;
    }

    setSavingStock(true);
    try {
      const reason = delta > 0 ? `Manual Restock (+${delta})` : `Physical Count Adjustment (${delta})`;
      await adjustStock(item.productId, delta, reason, 'ADJUSTMENT', variantId);
      setEditingStockId(null);
      await refreshInventory();
    } catch {
      Alert.alert('Error', 'Failed to update stock quantity.');
    } finally {
      setSavingStock(false);
    }
  };

  // Open Stock Discrepancy Audit Modal
  const handleOpenAudit = (item: InventoryItem) => {
    setAuditItem(item);
    setAuditPhysicalStock(String(item.availableQty));
    setAuditReason('Miscount Correction');
    setAuditNotes('');
    setAuditSuccessBanner(null);
  };

  // Submit Physical Audit Discrepancy
  const handleAuditSubmit = async () => {
    if (!auditItem) return;
    const parsedStock = parseInt(auditPhysicalStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert('Invalid Count', 'Please enter a valid physical stock number.');
      return;
    }

    setAuditSubmitting(true);
    try {
      const discrepancy = parsedStock - auditItem.availableQty;
      const reason = `${auditReason}: Discrepancy ${discrepancy > 0 ? '+' : ''}${discrepancy} units (${auditNotes || 'Warehouse Floor Audit'})`;
      await adjustStock(auditItem.productId, discrepancy, reason, 'ADJUSTMENT');
      setAuditSuccessBanner(`Physical audit logged: ${auditItem.name} updated to ${parsedStock} units.`);
      setTimeout(async () => {
        setAuditItem(null);
        await refreshInventory();
      }, 900);
    } catch {
      Alert.alert('Audit Error', 'Could not save audit discrepancy.');
    } finally {
      setAuditSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header & Store Lock Banner */}
      <View style={styles.topStoreBanner}>
        <View style={styles.storeIconBox}>
          <Ionicons name="business" size={18} color="#4F46E5" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.storeTitleRow}>
            <Text style={styles.storeNameText} numberOfLines={1}>
              {currentStoreName}
            </Text>
            <View style={styles.lockedAreaPill}>
              <Ionicons name="lock-closed" size={10} color="#047857" />
              <Text style={styles.lockedAreaPillText}>1:1 LOCKED</Text>
            </View>
          </View>
          <View style={styles.storeChipsRow}>
            <View style={styles.storeChip}>
              <Text style={styles.storeChipLabel}>Zone: </Text>
              <Text style={styles.storeChipVal}>{currentAreaName}</Text>
            </View>
            <View style={[styles.storeChip, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
              <Text style={[styles.storeChipLabel, { color: '#BE185D' }]}>Hub: </Text>
              <Text style={[styles.storeChipVal, { color: '#DB2777', fontWeight: '800' }]}>
                {currentStoreCode}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Search & Actions Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={inventorySearch}
            onChangeText={setInventorySearch}
            placeholder="Search SKU, product name, or shelf..."
            placeholderTextColor={COLORS.textMuted}
          />
          {Boolean(inventorySearch) && (
            <TouchableOpacity
              onPress={() => setInventorySearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addProductBtn}
          onPress={() => setSubScreen('AddProduct')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={15} color="#FFF" />
          <Text style={styles.addProductBtnText}>ADD ITEM</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logsBtn}
          onPress={() => setSubScreen('InventoryLogs')}
          activeOpacity={0.8}
        >
          <Ionicons name="time" size={15} color={COLORS.accentCyan} />
          <Text style={styles.logsBtnText}>LOGS</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'low', 'oos'] as const).map((f) => {
          const isSelected = inventoryFilter === f;
          const label =
            f === 'all'
              ? 'All Stock'
              : f === 'low'
              ? 'Low Stock (≤10)'
              : 'Out of Stock';
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setInventoryFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Master Inventory Table: 2-Column Header ("PRODUCT SKU & TITLE" and "AUDIT / ACTIONS") */}
      <View style={styles.tableCard}>
        {/* Table Header: 2 Columns */}
        <View style={styles.mobileTableHeaderRow}>
          <Text style={styles.mobileTableHeaderCol}>PRODUCT SKU & TITLE</Text>
          <Text style={[styles.mobileTableHeaderCol, { textAlign: 'right' }]}>
            AUDIT / ACTIONS
          </Text>
        </View>

        {/* Inventory Product Rows */}
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={{ paddingBottom: 85 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshInventory}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item, index }) => {
            const isExpanded = !!expandedProductIds[item.productId];
            const hasVariants = Boolean(item.variants && item.variants.length > 0);
            const isEditingStock = editingStockId === item.productId;
            const stockVal = item.availableQty;

            return (
              <View
                key={item.productId}
                style={[
                  styles.mobileTableRowContainer,
                  index % 2 === 1 && { backgroundColor: '#FBFDFE' },
                ]}
              >
                {/* Primary Row: Left: PRODUCT SKU & TITLE, Right: AUDIT / ACTIONS + [+ / -] */}
                <View style={styles.mobileTableRow}>
                  {/* Left: PRODUCT SKU & TITLE */}
                  <View style={styles.mobileProductInfo}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.productThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productThumbFallback}>
                        <Ionicons name="cube-outline" size={18} color="#1D4ED8" />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.productTitleText} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.productSkuText}>
                        {item.sku || `SKU-${item.productId.slice(-6)}`}
                      </Text>
                    </View>
                  </View>

                  {/* Right: AUDIT / ACTIONS + [+ / -] Toggle */}
                  <View style={styles.mobileActionsCol}>
                    <TouchableOpacity
                      style={styles.actionEditBtn}
                      onPress={() => handleOpenAdjust(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil" size={12} color="#071B52" />
                      <Text style={styles.actionEditBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionAuditBtn}
                      onPress={() => handleOpenAudit(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="clipboard-outline" size={13} color="#4F46E5" />
                      <Text style={styles.actionAuditBtnText}>Audit</Text>
                    </TouchableOpacity>

                    {/* [+ / -] Toggle Button for "another thing" */}
                    <TouchableOpacity
                      style={[
                        styles.mobileToggleBtn,
                        isExpanded && styles.mobileToggleBtnExpanded,
                      ]}
                      onPress={() => toggleExpand(item.productId)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isExpanded ? 'remove' : 'add'}
                        size={15}
                        color={isExpanded ? '#FFFFFF' : '#4F46E5'}
                      />
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
                              : stockVal <= (item.threshold || 10)
                              ? styles.statusBadgeAmber
                              : styles.statusBadgeGreen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              stockVal <= 0
                                ? styles.statusTextRed
                                : stockVal <= (item.threshold || 10)
                                ? styles.statusTextAmber
                                : styles.statusTextGreen,
                            ]}
                          >
                            {stockVal <= 0
                              ? 'OUT OF STOCK'
                              : stockVal <= (item.threshold || 10)
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
                          onPress={() => handleQuickStep(item.productId, -1)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={14} color="#BE123C" />
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
                              onPress={() => handleSaveInlineStock(item)}
                              disabled={savingStock}
                            >
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.inlineCancelBtn}
                              onPress={() => setEditingStockId(null)}
                            >
                              <Ionicons name="close" size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.stepperValWrap}
                            onPress={() => {
                              setEditingStockId(item.productId);
                              setEditingStockValue(String(stockVal));
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.stepperValText,
                                stockVal <= (item.threshold || 10) && { color: '#DC2626' },
                              ]}
                            >
                              {stockVal} units
                            </Text>
                            <Ionicons
                              name="pencil"
                              size={10}
                              color="#94A3B8"
                              style={{ marginLeft: 5 }}
                            />
                          </TouchableOpacity>
                        )}

                        {/* Increment (+) Button */}
                        <TouchableOpacity
                          style={[
                            styles.stepperBtn,
                            { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
                          ]}
                          onPress={() => handleQuickStep(item.productId, 1)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={14} color="#047857" />
                        </TouchableOpacity>

                        <View style={styles.areaTag}>
                          <Ionicons name="lock-closed" size={10} color="#047857" style={{ marginRight: 2 }} />
                          <Text style={styles.areaTagText}>Tragad Hub</Text>
                        </View>
                      </View>
                    </View>

                    {/* Row 2: Price & Shelf Location */}
                    <View style={styles.drawerTwoCol}>
                      {/* Selling Price / MRP */}
                      <View style={styles.drawerMiniCol}>
                        <Text style={styles.drawerLabel}>SELLING PRICE / MRP</Text>
                        <View style={styles.priceRowWrap}>
                          <Text style={styles.sellingPriceText}>₹{item.sellingPrice}</Text>
                          {Boolean(item.mrp && item.mrp > item.sellingPrice) && (
                            <Text style={[styles.mrpText, { marginLeft: 6 }]}>
                              ₹{item.mrp}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Shelf Location */}
                      <View style={styles.drawerMiniCol}>
                        <Text style={styles.drawerLabel}>SHELF LOCATION</Text>
                        <TouchableOpacity
                          style={styles.shelfLocationBadge}
                          onPress={() => handleOpenEditShelf(item)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="location" size={12} color="#4F46E5" />
                          <Text style={styles.shelfLocationText}>
                            {item.shelfLocation || 'A1-R2'}
                          </Text>
                          <Ionicons name="pencil" size={10} color="#94A3B8" style={{ marginLeft: 2 }} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Row 3: Variants Section if available */}
                    {hasVariants && (
                      <View style={styles.variantsBox}>
                        <Text style={styles.variantsTitle}>PACK SIZES & VARIANT INVENTORY</Text>
                        {item.variants?.map((v) => (
                          <View key={v.id} style={styles.variantItemRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.variantWeight}>
                                {v.weightOrVolume} {v.isDefault ? '(Default)' : ''}
                              </Text>
                              <Text style={styles.variantPriceText}>
                                ₹{v.sellingPrice} {v.mrp > v.sellingPrice ? `(MRP ₹${v.mrp})` : ''}
                              </Text>
                            </View>

                            <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                              <Text
                                style={[
                                  styles.variantStockCount,
                                  v.stock === 0
                                    ? { color: COLORS.danger }
                                    : v.stock <= 5
                                    ? { color: COLORS.warning }
                                    : { color: '#047857' },
                                ]}
                              >
                                {v.stock} units
                              </Text>
                              <Text style={styles.variantStockSub}>in stock</Text>
                            </View>

                            <View style={styles.quickStepper}>
                              <TouchableOpacity
                                style={styles.quickStepBtn}
                                onPress={() => handleQuickStep(item.productId, -1, v.id)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="remove" size={13} color="#BE123C" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.quickStepBtn, styles.quickStepBtnPlus]}
                                onPress={() => handleQuickStep(item.productId, 1, v.id)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="add" size={13} color="#047857" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Row 4: Metrics Row (Reserved & Threshold) */}
                    <View style={styles.stockMetricsRow}>
                      <View style={styles.stockCol}>
                        <Text style={styles.stockColLabel}>Total Available</Text>
                        <Text style={[styles.stockColValue, { color: '#071B52' }]}>
                          {item.availableQty} units
                        </Text>
                      </View>
                      <View style={styles.stockCol}>
                        <Text style={styles.stockColLabel}>Reserved (Orders)</Text>
                        <Text style={styles.stockColValue}>{item.reservedQty || 0} units</Text>
                      </View>
                      <View style={styles.stockCol}>
                        <Text style={styles.stockColLabel}>Low Alert Level</Text>
                        <Text style={styles.stockColValue}>{item.threshold || 10} units</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Matching Inventory</Text>
              <Text style={styles.emptyDesc}>
                No items match current warehouse filters for {currentStoreName}.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setSubScreen('AddProduct')}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.emptyAddBtnText}>Add First Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Stock Discrepancy Audit Modal (matches Admin screenshot audit flow) */}
      {auditItem && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 440 }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="clipboard-outline" size={20} color="#4F46E5" />
                  <Text style={styles.modalTitle}>Stock Discrepancy Audit</Text>
                </View>
                <TouchableOpacity onPress={() => setAuditItem(null)} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {auditSuccessBanner && (
                <View style={styles.modalSuccessBanner}>
                  <Ionicons name="checkmark-circle" size={16} color="#065F46" style={{ marginRight: 6 }} />
                  <Text style={styles.modalSuccessBannerText}>{auditSuccessBanner}</Text>
                </View>
              )}

              <ScrollView style={styles.modalBody}>
                {/* Product Summary Box */}
                <View style={styles.auditProductSummary}>
                  <Text style={styles.auditProdName}>{auditItem.name}</Text>
                  <Text style={styles.auditProdMeta}>
                    Fulfilling Store:{' '}
                    <Text style={{ color: '#071B52', fontWeight: '700' }}>
                      {currentStoreName}
                    </Text>
                  </Text>
                  <Text style={styles.auditProdMeta}>
                    Current System Stock:{' '}
                    <Text style={{ color: '#071B52', fontWeight: '800' }}>
                      {auditItem.availableQty} units
                    </Text>
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
                    const recorded = auditItem.availableQty;
                    const physical = parseInt(auditPhysicalStock, 10) || 0;
                    const diff = physical - recorded;
                    return (
                      <Text
                        style={[
                          styles.diffNote,
                          diff < 0
                            ? { color: '#DC2626' }
                            : diff > 0
                            ? { color: '#059669' }
                            : { color: '#64748B' },
                        ]}
                      >
                        Discrepancy: {diff > 0 ? `+${diff}` : diff} units (
                        {diff === 0 ? 'Balanced' : diff < 0 ? 'Shortage / Loss' : 'Surplus'})
                      </Text>
                    );
                  })()}
                </View>

                {/* Audit Reason Selector */}
                <View style={styles.formFieldGroup}>
                  <Text style={styles.formLabel}>Adjustment Reason</Text>
                  <View style={styles.reasonChipsWrap}>
                    {(
                      [
                        'Miscount Correction',
                        'Damaged / Spoilage',
                        'Shrinkage / Theft',
                        'Expired Stock',
                      ] as const
                    ).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.reasonChip, auditReason === r && styles.reasonChipActive]}
                        onPress={() => setAuditReason(r)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.reasonChipText,
                            auditReason === r && styles.reasonChipTextActive,
                          ]}
                        >
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
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setAuditItem(null)}
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

      {/* Detailed Stock Adjustment Modal (Damage, Return, Reason) */}
      <StockAdjustmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        item={selectedItem}
        onConfirm={handleConfirmAdjust}
      />

      {/* Edit Shelf Location Modal */}
      <EditShelfModal
        visible={editShelfVisible}
        onClose={() => setEditShelfVisible(false)}
        item={editShelfItem}
        onSave={async (prodId, shelf) => {
          await updateShelfLocation(prodId, shelf);
          await refreshInventory();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topStoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  storeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#071B52',
    flex: 1,
  },
  lockedAreaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedAreaPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5,
  },
  storeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storeChipLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  storeChipVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#071B52',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchInput: {
    flex: 1,
    color: '#071B52',
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071B52',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addProductBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  logsBtn: {
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
  logsBtnText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#071B52',
    borderColor: '#071B52',
  },
  filterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  tableCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
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
  productThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
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
  mobileActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionEditBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#071B52',
  },
  actionAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionAuditBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
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
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeGreen: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeAmber: {
    backgroundColor: '#FFFBEB',
  },
  statusBadgeRed: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextGreen: {
    color: '#047857',
  },
  statusTextAmber: {
    color: '#B45309',
  },
  statusTextRed: {
    color: '#BE123C',
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
  inlineEditWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '800',
    color: '#071B52',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  inlineSaveBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCancelBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  areaTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
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
  priceRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sellingPriceText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#071B52',
  },
  mrpText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  shelfLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  shelfLocationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
  },
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
  stockMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-around',
  },
  stockCol: {
    alignItems: 'center',
  },
  stockColLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  stockColValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#071B52',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 27, 82, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#071B52',
  },
  modalSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSuccessBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  auditProductSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
  },
  auditProdName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#071B52',
    marginBottom: 4,
  },
  auditProdMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  formFieldGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#071B52',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  reasonChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  reasonChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  reasonChipTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
