import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  X,
  Check,
  Lock,
  Package,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Palette,
  Smile,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { CategoryItem, SubCategoryItem } from '../types/admin';

// Preset color options for category backgrounds
const PRESET_BG_COLORS = [
  { label: 'Mint Green', hex: '#EEF9F3' },
  { label: 'Pastel Pink', hex: '#FCEAF5' },
  { label: 'Ice Blue', hex: '#EBF5FF' },
  { label: 'Warm Orange', hex: '#FFF4E5' },
  { label: 'Soft Lavender', hex: '#F5EEFD' },
  { label: 'Light Peach', hex: '#FDF0EE' },
  { label: 'Butter Yellow', hex: '#FEF9E7' },
  { label: 'Soft Slate', hex: '#F1F4F9' },
];

// Preset quick emojis for categories
const PRESET_EMOJIS = [
  '🥬', '🍿', '💄', '🏠', '🐾', '🥛', '🍎', '🍞',
  '☕', '🥩', '🍫', '🧼', '🍼', '🍰', '🍪', '🎁'
];

export const CategoryManagementScreen: React.FC = () => {
  const {
    categories,
    products,
    refreshCategories,
    addCategoryItem,
    updateCategoryItem,
    toggleCategoryItemStatus,
    deleteCategoryItem,
    addSubcategoryItem,
    updateSubcategoryItem,
    deleteSubcategoryItem,
  } = useAdminState();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Category Add / Edit Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('🥬');
  const [categoryBgColor, setCategoryBgColor] = useState('#EEF9F3');
  const [categorySortOrder, setCategorySortOrder] = useState('1');
  const [categoryIsActive, setCategoryIsActive] = useState(true);
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Sub-Category Management Modal
  const [managingCategory, setManagingCategory] = useState<CategoryItem | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [subCategoriesList, setSubCategoriesList] = useState<SubCategoryItem[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Add / Edit Sub-Category Form Modal
  const [showSubFormModal, setShowSubFormModal] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCategoryItem | null>(null);
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subIcon, setSubIcon] = useState('grid');
  const [subShelf, setSubShelf] = useState('');
  const [subSortOrder, setSubSortOrder] = useState('1');
  const [subIsActive, setSubIsActive] = useState(true);
  const [subSubmitting, setSubSubmitting] = useState(false);

  // Confirmation Modals
  const [deactivateCategoryTarget, setDeactivateCategoryTarget] = useState<CategoryItem | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryItem | null>(null);
  const [deleteBlockedInfo, setDeleteBlockedInfo] = useState<{ categoryName: string; count: number } | null>(null);

  // Load latest on mount
  useEffect(() => {
    refreshCategories();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCategories();
    setRefreshing(false);
  };

  // KPI Calculations
  const totalCategories = categories.length;
  const activeCategoriesCount = categories.filter((c) => c.isActive !== false).length;
  const inactiveCategoriesCount = totalCategories - activeCategoriesCount;

  const totalSubCategories = useMemo(() => {
    return categories.reduce((sum, cat) => {
      const subs = cat.subCategories || [];
      return sum + (subs.length > 0 ? subs.length : (cat.subCategoryCount || 0));
    }, 0);
  }, [categories]);

  const zeroProductCategoriesCount = useMemo(() => {
    return categories.filter((c) => {
      const count = c.productCount ?? 0;
      return count === 0;
    }).length;
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.code && cat.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cat.slug && cat.slug.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'Active') return cat.isActive !== false;
      if (statusFilter === 'Inactive') return cat.isActive === false;
      return true;
    }).sort((a, b) => (a.sortOrder || a.displayOrder || 0) - (b.sortOrder || b.displayOrder || 0));
  }, [categories, searchQuery, statusFilter]);

  // Auto-generate code when category name changes in Add mode
  const handleCategoryNameChange = (name: string) => {
    setCategoryName(name);
    if (!editingCategory) {
      const genCode = name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      setCategoryCode(genCode);
    }
  };

  // Open Add Category Modal
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryCode('');
    setCategoryIcon('🥬');
    setCategoryBgColor('#EEF9F3');
    setCategorySortOrder(String(categories.length + 1));
    setCategoryIsActive(true);
    setCategoryDescription('');
    setShowCategoryModal(true);
  };

  // Open Edit Category Modal
  const openEditCategoryModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryCode(cat.code || cat.slug?.toUpperCase().replace(/-/g, '_') || '');
    setCategoryIcon(cat.icon || cat.iconUrl || '🥬');
    setCategoryBgColor(cat.bgColor || '#EEF9F3');
    setCategorySortOrder(String(cat.sortOrder || cat.displayOrder || 1));
    setCategoryIsActive(cat.isActive !== false);
    setCategoryDescription(cat.description || '');
    setShowCategoryModal(true);
  };

  // Save Category (Add or Edit)
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Validation Error', 'Category name is required.');
      return;
    }

    setCategorySubmitting(true);
    try {
      if (editingCategory) {
        const catId = editingCategory.id || (editingCategory as any)._id;
        const res = await updateCategoryItem(catId, {
          name: categoryName.trim(),
          icon: categoryIcon,
          bgColor: categoryBgColor,
          sortOrder: parseInt(categorySortOrder, 10) || 1,
          displayOrder: parseInt(categorySortOrder, 10) || 1,
          isActive: categoryIsActive,
          description: categoryDescription.trim(),
        });
        if (!res.success) {
          Alert.alert('Update Failed', res.error || 'Failed to update category.');
        } else {
          setShowCategoryModal(false);
        }
      } else {
        const res = await addCategoryItem({
          name: categoryName.trim(),
          code: categoryCode.trim() || undefined,
          icon: categoryIcon,
          bgColor: categoryBgColor,
          sortOrder: parseInt(categorySortOrder, 10) || categories.length + 1,
          displayOrder: parseInt(categorySortOrder, 10) || categories.length + 1,
          isActive: categoryIsActive,
          description: categoryDescription.trim(),
        });
        if (!res.success) {
          Alert.alert('Creation Failed', res.error || 'Failed to create category.');
        } else {
          setShowCategoryModal(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Handle Deactivate Category
  const handleDeactivateCategory = async () => {
    if (!deactivateCategoryTarget) return;
    const catId = deactivateCategoryTarget.id || (deactivateCategoryTarget as any)._id;
    const nextStatus = !deactivateCategoryTarget.isActive;
    await toggleCategoryItemStatus(catId, nextStatus);
    setDeactivateCategoryTarget(null);
  };

  // Handle Delete Category Safe Check
  const initiateDeleteCategory = (cat: CategoryItem) => {
    const pCount = cat.productCount ?? 0;
    if (pCount > 0) {
      setDeleteBlockedInfo({
        categoryName: cat.name,
        count: pCount,
      });
      return;
    }
    setDeleteCategoryTarget(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    const catId = deleteCategoryTarget.id || (deleteCategoryTarget as any)._id;
    const res = await deleteCategoryItem(catId);
    if (!res.success) {
      Alert.alert('Delete Blocked', res.error || 'Could not delete category.');
    }
    setDeleteCategoryTarget(null);
  };

  // --- SUB-CATEGORY MANAGEMENT ---

  const openSubCategoryManager = (cat: CategoryItem) => {
    setManagingCategory(cat);
    const initialSubs = cat.subCategories || [];
    setSubCategoriesList(initialSubs);
    setShowSubModal(true);
  };

  const openAddSubForm = () => {
    setEditingSub(null);
    setSubName('');
    setSubSlug('');
    setSubIcon('grid');
    setSubShelf('');
    setSubSortOrder(String(subCategoriesList.length + 1));
    setSubIsActive(true);
    setShowSubFormModal(true);
  };

  const openEditSubForm = (sub: SubCategoryItem) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubSlug(sub.slug);
    setSubIcon(sub.icon || 'grid');
    setSubShelf(sub.defaultShelfAisle || '');
    setSubSortOrder(String(sub.sortOrder || 1));
    setSubIsActive(sub.isActive !== false);
    setShowSubFormModal(true);
  };

  const handleSubNameChange = (name: string) => {
    setSubName(name);
    if (!editingSub) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSubSlug(slug);
    }
  };

  const handleSaveSubCategory = async () => {
    if (!managingCategory || !subName.trim()) {
      Alert.alert('Validation Error', 'Sub-category name is required.');
      return;
    }

    setSubSubmitting(true);
    const catId = managingCategory.id || (managingCategory as any)._id;

    try {
      if (editingSub) {
        const subId = editingSub.id || (editingSub as any)._id;
        const res = await updateSubcategoryItem(catId, subId, {
          name: subName.trim(),
          slug: subSlug.trim() || undefined,
          icon: subIcon,
          defaultShelfAisle: subShelf.trim(),
          sortOrder: parseInt(subSortOrder, 10) || 1,
          isActive: subIsActive,
        });

        if (res.success) {
          setSubCategoriesList((prev) =>
            prev.map((s) =>
              (s.id === subId || (s as any)._id === subId)
                ? { ...s, name: subName.trim(), slug: subSlug.trim(), defaultShelfAisle: subShelf.trim(), sortOrder: parseInt(subSortOrder, 10) || 1, isActive: subIsActive }
                : s
            )
          );
          setShowSubFormModal(false);
        } else {
          Alert.alert('Update Failed', res.error || 'Failed to update sub-category.');
        }
      } else {
        const res = await addSubcategoryItem(catId, {
          name: subName.trim(),
          slug: subSlug.trim() || undefined,
          icon: subIcon,
          defaultShelfAisle: subShelf.trim(),
          sortOrder: parseInt(subSortOrder, 10) || subCategoriesList.length + 1,
          isActive: subIsActive,
        });

        if (res.success && res.data) {
          setSubCategoriesList((prev) => [...prev, res.data as SubCategoryItem]);
          setShowSubFormModal(false);
        } else {
          Alert.alert('Creation Failed', res.error || 'Failed to add sub-category.');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred.');
    } finally {
      setSubSubmitting(false);
    }
  };

  const handleToggleSubStatus = async (sub: SubCategoryItem) => {
    if (!managingCategory) return;
    const catId = managingCategory.id || (managingCategory as any)._id;
    const subId = sub.id || (sub as any)._id;
    const nextStatus = !sub.isActive;

    const res = await updateSubcategoryItem(catId, subId, { isActive: nextStatus });
    if (res.success) {
      setSubCategoriesList((prev) =>
        prev.map((s) => (s.id === subId || (s as any)._id === subId ? { ...s, isActive: nextStatus } : s))
      );
    }
  };

  const handleReorderSub = async (index: number, direction: 'up' | 'down') => {
    if (!managingCategory) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subCategoriesList.length) return;

    const updated = [...subCategoriesList];
    const current = updated[index];
    const target = updated[targetIndex];

    const currentOrder = current.sortOrder || index + 1;
    const targetOrder = target.sortOrder || targetIndex + 1;

    current.sortOrder = targetOrder;
    target.sortOrder = currentOrder;

    updated[index] = target;
    updated[targetIndex] = current;
    setSubCategoriesList(updated);

    const catId = managingCategory.id || (managingCategory as any)._id;
    await updateSubcategoryItem(catId, current.id || (current as any)._id, { sortOrder: current.sortOrder });
    await updateSubcategoryItem(catId, target.id || (target as any)._id, { sortOrder: target.sortOrder });
  };

  const handleDeleteSub = async (sub: SubCategoryItem) => {
    if (!managingCategory) return;
    const catId = managingCategory.id || (managingCategory as any)._id;
    const subId = sub.id || (sub as any)._id;

    Alert.alert(
      'Delete Sub-Category',
      `Are you sure you want to remove "${sub.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteSubcategoryItem(catId, subId);
            if (res.success) {
              setSubCategoriesList((prev) => prev.filter((s) => s.id !== subId && (s as any)._id !== subId));
            } else {
              Alert.alert('Cannot Delete', res.error || 'Failed to delete subcategory.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner Header */}
      <LinearGradient colors={GRADIENTS.navyHeader} style={styles.headerBanner}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.titleIconBadge}>
              <FolderTree size={20} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Category Management</Text>
              <Text style={styles.headerSubtitle}>
                Manage categories & subcategories shown to customers
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              color={COLORS.white}
              style={refreshing ? { transform: [{ rotate: '45deg' }] } : undefined}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* KPI Strip */}
        <View style={styles.kpiStrip}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#F0EBFB' }]}>
              <Layers size={18} color={COLORS.purple} />
            </View>
            <Text style={styles.kpiValue}>{totalCategories}</Text>
            <Text style={styles.kpiLabel}>Categories</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#EBF5FF' }]}>
              <FolderTree size={18} color={COLORS.blue} />
            </View>
            <Text style={styles.kpiValue}>{totalSubCategories}</Text>
            <Text style={styles.kpiLabel}>Sub-Cats</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#FFF4E5' }]}>
              <Package size={18} color={COLORS.warning} />
            </View>
            <Text style={styles.kpiValue}>{zeroProductCategoriesCount}</Text>
            <Text style={styles.kpiLabel}>No Products</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#EEF9F3' }]}>
              <Sparkles size={18} color={COLORS.success} />
            </View>
            <Text style={styles.kpiValue}>{activeCategoriesCount}</Text>
            <Text style={styles.kpiLabel}>Active</Text>
          </View>
        </View>

        {/* Controls: Search + Add Category Button */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBar}>
            <Search size={16} color={COLORS.textMuted} style={{ marginRight: SPACING.xs }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories or codes..."
              placeholderTextColor={COLORS.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.addCategoryBtn} onPress={openAddCategoryModal}>
            <LinearGradient colors={GRADIENTS.cardBadge} style={styles.addCategoryGradient}>
              <Plus size={16} color={COLORS.white} />
              <Text style={styles.addCategoryBtnText}>ADD CATEGORY</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['All', 'Active', 'Inactive'] as const).map((filter) => {
            const isSelected = statusFilter === filter;
            const count =
              filter === 'All'
                ? totalCategories
                : filter === 'Active'
                ? activeCategoriesCount
                : inactiveCategoriesCount;

            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {filter} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Categories List */}
        <View style={styles.listContainer}>
          {filteredCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FolderTree size={48} color={COLORS.secondaryText} />
              <Text style={styles.emptyTitle}>No categories found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No categories match "${searchQuery}"`
                  : 'Get started by creating your first catalog category.'}
              </Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddCategoryModal}>
                <Plus size={16} color={COLORS.purple} />
                <Text style={styles.emptyAddBtnText}>Add New Category</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredCategories.map((cat, idx) => {
              const subsCount = (cat.subCategories && cat.subCategories.length > 0)
                ? cat.subCategories.length
                : (cat.subCategoryCount || 0);
              const pCount = cat.productCount ?? 0;
              const orderNum = cat.sortOrder || cat.displayOrder || idx + 1;
              const isActive = cat.isActive !== false;
              const iconEmoji = cat.icon || cat.iconUrl || '🥬';
              const cardBg = cat.bgColor || '#F4F4FA';

              return (
                <View key={cat.id || (cat as any)._id || idx} style={styles.categoryCard}>
                  {/* Top Row: Icon + Name + Active Status Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.categoryIconCircle, { backgroundColor: cardBg }]}>
                        <Text style={styles.categoryIconText}>{iconEmoji}</Text>
                      </View>
                      <View style={styles.nameBlock}>
                        <View style={styles.nameRow}>
                          <Text style={styles.categoryNameText}>{cat.name}</Text>
                          {cat.code && (
                            <View style={styles.codeBadge}>
                              <Text style={styles.codeBadgeText}>{cat.code}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.categoryMetaText}>
                          {subsCount} sub-categories · {pCount} products · Order: {orderNum}
                        </Text>
                      </View>
                    </View>

                    {/* Status Pill */}
                    <View
                      style={[
                        styles.statusPill,
                        isActive ? styles.statusPillActive : styles.statusPillInactive,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isActive ? COLORS.success : COLORS.error },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: isActive ? COLORS.success : COLORS.error },
                        ]}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  {/* Description if present */}
                  {cat.description ? (
                    <Text style={styles.categoryDescriptionText} numberOfLines={2}>
                      {cat.description}
                    </Text>
                  ) : null}

                  {/* Action Buttons Strip */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => openEditCategoryModal(cat)}
                    >
                      <Edit2 size={13} color={COLORS.purple} />
                      <Text style={styles.actionBtnSecondaryText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => openSubCategoryManager(cat)}
                    >
                      <Layers size={13} color={COLORS.blue} />
                      <Text style={styles.actionBtnPrimaryText}>Manage Sub-Cats ({subsCount})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtnToggle,
                        isActive ? styles.actionBtnDeactivate : styles.actionBtnActivate,
                      ]}
                      onPress={() => setDeactivateCategoryTarget(cat)}
                    >
                      {isActive ? (
                        <>
                          <EyeOff size={13} color={COLORS.textMuted} />
                          <Text style={styles.actionBtnToggleText}>Deactivate</Text>
                        </>
                      ) : (
                        <>
                          <Eye size={13} color={COLORS.success} />
                          <Text style={[styles.actionBtnToggleText, { color: COLORS.success }]}>
                            Activate
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => initiateDeleteCategory(cat)}
                    >
                      <Trash2 size={15} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT CATEGORY MODAL                                        */}
      {/* ========================================================================= */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <FolderTree size={20} color={COLORS.purple} />
                <Text style={styles.modalTitle}>
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowCategoryModal(false)}
              >
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Category Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Organic Products"
                  placeholderTextColor={COLORS.secondaryText}
                  value={categoryName}
                  onChangeText={handleCategoryNameChange}
                />
              </View>

              {/* Category Code */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Category Code *</Text>
                  {editingCategory ? (
                    <View style={styles.lockedPill}>
                      <Lock size={12} color={COLORS.textMuted} />
                      <Text style={styles.lockedText}>Read-Only</Text>
                    </View>
                  ) : (
                    <Text style={styles.fieldHint}>Auto-generated</Text>
                  )}
                </View>
                <TextInput
                  style={[styles.textInput, editingCategory && styles.textInputDisabled]}
                  placeholder="e.g. ORGANIC_PRODUCTS"
                  placeholderTextColor={COLORS.secondaryText}
                  value={categoryCode}
                  onChangeText={setCategoryCode}
                  editable={!editingCategory}
                  autoCapitalize="characters"
                />
              </View>

              {/* Icon Selector (Emoji or Uploaded) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Smile size={14} color={COLORS.purple} />
                  <Text style={[styles.fieldLabel, { marginLeft: 4 }]}>Category Icon / Emoji *</Text>
                </View>
                <View style={styles.iconSelectionRow}>
                  <View style={[styles.iconPreviewBox, { backgroundColor: categoryBgColor }]}>
                    <Text style={styles.iconPreviewText}>{categoryIcon || '🥬'}</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { flex: 1, marginLeft: SPACING.sm }]}
                    placeholder="Custom emoji or icon name"
                    placeholderTextColor={COLORS.secondaryText}
                    value={categoryIcon}
                    onChangeText={setCategoryIcon}
                  />
                </View>

                {/* Preset Emoji Picker Grid */}
                <View style={styles.presetEmojiRow}>
                  {PRESET_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.presetEmojiChip,
                        categoryIcon === emoji && styles.presetEmojiChipSelected,
                      ]}
                      onPress={() => setCategoryIcon(emoji)}
                    >
                      <Text style={styles.presetEmojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Background Pastel Color */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Palette size={14} color={COLORS.purple} />
                  <Text style={[styles.fieldLabel, { marginLeft: 4 }]}>Background Pastel Color</Text>
                </View>
                <View style={styles.presetColorsGrid}>
                  {PRESET_BG_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c.hex}
                      style={[
                        styles.colorChip,
                        { backgroundColor: c.hex },
                        categoryBgColor.toLowerCase() === c.hex.toLowerCase() && styles.colorChipSelected,
                      ]}
                      onPress={() => setCategoryBgColor(c.hex)}
                    >
                      {categoryBgColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check size={14} color={COLORS.navy} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.textInput, { marginTop: SPACING.xs }]}
                  placeholder="#EEF9F3"
                  placeholderTextColor={COLORS.secondaryText}
                  value={categoryBgColor}
                  onChangeText={setCategoryBgColor}
                />
              </View>

              {/* Display Order & Status in Row */}
              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <Text style={styles.fieldLabel}>Display Order</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="1"
                    placeholderTextColor={COLORS.secondaryText}
                    value={categorySortOrder}
                    onChangeText={setCategorySortOrder}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.statusToggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleOption,
                        categoryIsActive && styles.statusToggleActive,
                      ]}
                      onPress={() => setCategoryIsActive(true)}
                    >
                      <Text
                        style={[
                          styles.statusToggleOptionText,
                          categoryIsActive && styles.statusToggleOptionTextActive,
                        ]}
                      >
                        Active
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusToggleOption,
                        !categoryIsActive && styles.statusToggleInactive,
                      ]}
                      onPress={() => setCategoryIsActive(false)}
                    >
                      <Text
                        style={[
                          styles.statusToggleOptionText,
                          !categoryIsActive && styles.statusToggleOptionTextInactive,
                        ]}
                      >
                        Inactive
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Short internal note about this category"
                  placeholderTextColor={COLORS.secondaryText}
                  value={categoryDescription}
                  onChangeText={setCategoryDescription}
                  multiline
                />
              </View>

              {/* If Editing: Stats strip */}
              {editingCategory && (
                <View style={styles.modalStatsBox}>
                  <Text style={styles.modalStatsTitle}>CATALOG STATS</Text>
                  <Text style={styles.modalStatsText}>
                    Products Assigned: {editingCategory.productCount ?? 0} · Sub-Categories:{' '}
                    {editingCategory.subCategories?.length ?? (editingCategory.subCategoryCount || 0)}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCategoryModal(false)}
                disabled={categorySubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveCategory}
                disabled={categorySubmitting}
              >
                <LinearGradient colors={GRADIENTS.cardBadge} style={styles.modalSubmitGradient}>
                  {categorySubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>
                      {editingCategory ? 'Save Changes' : 'Create Category'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: MANAGE SUB-CATEGORIES MODAL                                      */}
      {/* ========================================================================= */}
      <Modal
        visible={showSubModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { maxWidth: 640 }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setShowSubModal(false)}
              >
                <ArrowLeft size={18} color={COLORS.navy} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: SPACING.xs }}>
                <Text style={styles.modalTitle}>
                  {managingCategory?.name || 'Category'}
                </Text>
                <Text style={styles.modalSubtitle}>Sub-Category Management</Text>
              </View>
              <TouchableOpacity
                style={styles.addSubBtn}
                onPress={openAddSubForm}
              >
                <Plus size={14} color={COLORS.white} />
                <Text style={styles.addSubBtnText}>ADD SUB-CATEGORY</Text>
              </TouchableOpacity>
            </View>

            {/* Subcategories List */}
            <ScrollView style={styles.subModalBody} showsVerticalScrollIndicator={false}>
              {subCategoriesList.length === 0 ? (
                <View style={styles.subEmptyBox}>
                  <Layers size={36} color={COLORS.secondaryText} />
                  <Text style={styles.subEmptyTitle}>No sub-categories yet</Text>
                  <Text style={styles.subEmptySubtitle}>
                    Add specific subcategories (e.g. Fresh Vegetables, Milk & Curd) to organize
                    customer browsing.
                  </Text>
                  <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddSubForm}>
                    <Plus size={14} color={COLORS.purple} />
                    <Text style={styles.emptyAddBtnText}>Add First Sub-Category</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                subCategoriesList.map((sub, idx) => {
                  const isActive = sub.isActive !== false;
                  const shelfInfo = sub.defaultShelfAisle ? ` · Shelf: ${sub.defaultShelfAisle}` : '';
                  const pCount = sub.productCount ?? sub.itemCount ?? 0;

                  return (
                    <View key={sub.id || (sub as any)._id || idx} style={styles.subCategoryCard}>
                      <View style={styles.subCardTop}>
                        <View style={styles.subCardInfo}>
                          <View style={styles.subNameRow}>
                            <Text style={styles.subIndexText}>{idx + 1}.</Text>
                            <Text style={styles.subCategoryName}>{sub.name}</Text>
                          </View>
                          <Text style={styles.subMetaText}>
                            {pCount} products{shelfInfo} · Order: {sub.sortOrder || idx + 1}
                          </Text>
                        </View>

                        {/* Status Pill */}
                        <TouchableOpacity
                          style={[
                            styles.statusPill,
                            isActive ? styles.statusPillActive : styles.statusPillInactive,
                          ]}
                          onPress={() => handleToggleSubStatus(sub)}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: isActive ? COLORS.success : COLORS.error },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusPillText,
                              { color: isActive ? COLORS.success : COLORS.error },
                            ]}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Sub-Category Actions */}
                      <View style={styles.subCardActions}>
                        <TouchableOpacity
                          style={styles.subActionBtn}
                          onPress={() => openEditSubForm(sub)}
                        >
                          <Edit2 size={12} color={COLORS.purple} />
                          <Text style={styles.subActionText}>Edit</Text>
                        </TouchableOpacity>

                        {/* Reorder Buttons */}
                        <TouchableOpacity
                          style={[styles.subActionBtn, idx === 0 && styles.subActionDisabled]}
                          disabled={idx === 0}
                          onPress={() => handleReorderSub(idx, 'up')}
                        >
                          <ChevronUp size={14} color={idx === 0 ? COLORS.secondaryText : COLORS.blue} />
                          <Text style={[styles.subActionText, idx === 0 && { color: COLORS.secondaryText }]}>
                            Up
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.subActionBtn,
                            idx === subCategoriesList.length - 1 && styles.subActionDisabled,
                          ]}
                          disabled={idx === subCategoriesList.length - 1}
                          onPress={() => handleReorderSub(idx, 'down')}
                        >
                          <ChevronDown
                            size={14}
                            color={idx === subCategoriesList.length - 1 ? COLORS.secondaryText : COLORS.blue}
                          />
                          <Text
                            style={[
                              styles.subActionText,
                              idx === subCategoriesList.length - 1 && { color: COLORS.secondaryText },
                            ]}
                          >
                            Down
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.subActionBtn, { borderColor: '#FEE2E2' }]}
                          onPress={() => handleDeleteSub(sub)}
                        >
                          <Trash2 size={13} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { width: '100%' }]}
                onPress={() => setShowSubModal(false)}
              >
                <LinearGradient colors={GRADIENTS.cardBadge} style={styles.modalSubmitGradient}>
                  <Text style={styles.modalSubmitBtnText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT SUBCATEGORY FORM                                      */}
      {/* ========================================================================= */}
      <Modal
        visible={showSubFormModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubFormModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Layers size={18} color={COLORS.blue} />
                <Text style={styles.modalTitle}>
                  {editingSub ? `Edit: ${editingSub.name}` : 'Add Sub-Category'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowSubFormModal(false)}
              >
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Parent Category (Locked) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Parent Category</Text>
                <View style={styles.lockedCategoryBox}>
                  <Text style={styles.lockedCategoryText}>
                    📂 {managingCategory?.name || 'Category'} (locked)
                  </Text>
                </View>
              </View>

              {/* Sub-Category Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Sub-Category Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Fresh Vegetables"
                  placeholderTextColor={COLORS.secondaryText}
                  value={subName}
                  onChangeText={handleSubNameChange}
                />
              </View>

              {/* Sub-Category Slug */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Sub-Category Slug *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. fresh-vegetables"
                  placeholderTextColor={COLORS.secondaryText}
                  value={subSlug}
                  onChangeText={setSubSlug}
                  autoCapitalize="none"
                />
              </View>

              {/* Default Shelf Aisle */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Default Shelf Aisle (Optional)</Text>
                  <Text style={styles.fieldHint}>For picker routing</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. A2-R3"
                  placeholderTextColor={COLORS.secondaryText}
                  value={subShelf}
                  onChangeText={setSubShelf}
                  autoCapitalize="characters"
                />
              </View>

              {/* Display Order */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display Order</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1"
                  placeholderTextColor={COLORS.secondaryText}
                  value={subSortOrder}
                  onChangeText={setSubSortOrder}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSubFormModal(false)}
                disabled={subSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveSubCategory}
                disabled={subSubmitting}
              >
                <LinearGradient colors={GRADIENTS.cardBadge} style={styles.modalSubmitGradient}>
                  {subSubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>
                      {editingSub ? 'Save Changes' : 'Create Sub-Cat'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: DEACTIVATE CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        visible={!!deactivateCategoryTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeactivateCategoryTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { maxWidth: 440 }]}>
            <View style={[styles.confirmIconBox, { backgroundColor: '#FEE2E2' }]}>
              <EyeOff size={28} color={COLORS.error} />
            </View>

            <Text style={styles.confirmTitle}>
              {deactivateCategoryTarget?.isActive
                ? `Hide "${deactivateCategoryTarget?.name}"?`
                : `Activate "${deactivateCategoryTarget?.name}"?`}
            </Text>

            <Text style={styles.confirmText}>
              {deactivateCategoryTarget?.isActive
                ? `Hiding this category removes it from customer browsing immediately. All products and sub-categories are preserved safely and can be reactivated anytime.`
                : `Activating this category makes it immediately visible to customers on the app home screen and category grid.`}
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeactivateCategoryTarget(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmActionBtn,
                  { backgroundColor: deactivateCategoryTarget?.isActive ? COLORS.error : COLORS.success },
                ]}
                onPress={handleDeactivateCategory}
              >
                <Text style={styles.confirmActionBtnText}>
                  {deactivateCategoryTarget?.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: DELETE BLOCKED (Products > 0)                                     */}
      {/* ========================================================================= */}
      <Modal
        visible={!!deleteBlockedInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteBlockedInfo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { maxWidth: 460 }]}>
            <View style={[styles.confirmIconBox, { backgroundColor: '#FEF3C7' }]}>
              <AlertCircle size={28} color={COLORS.warning} />
            </View>

            <Text style={styles.confirmTitle}>Cannot Delete Category</Text>
            <Text style={styles.confirmText}>
              Cannot delete <Text style={{ fontWeight: '700' }}>"{deleteBlockedInfo?.categoryName}"</Text>.
              It currently has{' '}
              <Text style={{ fontWeight: '700', color: COLORS.error }}>
                {deleteBlockedInfo?.count} products
              </Text>{' '}
              assigned. Move or delete those products first, or use <Text style={{ fontWeight: '700' }}>Deactivate</Text> instead.
            </Text>

            <TouchableOpacity
              style={[styles.confirmActionBtn, { backgroundColor: COLORS.navy, marginTop: SPACING.md }]}
              onPress={() => setDeleteBlockedInfo(null)}
            >
              <Text style={styles.confirmActionBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: PERMANENT DELETE CONFIRMATION                                    */}
      {/* ========================================================================= */}
      <Modal
        visible={!!deleteCategoryTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteCategoryTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { maxWidth: 440 }]}>
            <View style={[styles.confirmIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Trash2 size={28} color={COLORS.error} />
            </View>

            <Text style={styles.confirmTitle}>
              Permanently delete "{deleteCategoryTarget?.name}"?
            </Text>
            <Text style={styles.confirmText}>
              This will remove the category and all nested subcategories. This action cannot be undone.
            </Text>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteCategoryTarget(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmActionBtn, { backgroundColor: COLORS.error }]}
                onPress={confirmDeleteCategory}
              >
                <Text style={styles.confirmActionBtnText}>Delete Permanently</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  headerBanner: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },

  // KPI Strip
  kpiStrip: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECF2',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  kpiIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Controls Row
  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E4EB',
    borderRadius: RADIUS.card,
    paddingHorizontal: SPACING.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.navy,
  },
  addCategoryBtn: {
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  addCategoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    height: 44,
    justifyContent: 'center',
  },
  addCategoryBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EDEFF5',
  },
  filterPillActive: {
    backgroundColor: COLORS.navy,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },

  // Categories List
  listContainer: {
    gap: SPACING.sm,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#ECECF2',
    padding: SPACING.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryIconText: {
    fontSize: 22,
  },
  nameBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  codeBadge: {
    backgroundColor: '#F1F4F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  categoryMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  categoryDescriptionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },

  // Status Pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillActive: {
    backgroundColor: '#EEF9F3',
  },
  statusPillInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Card Actions Strip
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F2F6',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F5EEFD',
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EBF5FF',
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.blue,
  },
  actionBtnToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  actionBtnDeactivate: {
    backgroundColor: '#F1F2F6',
  },
  actionBtnActivate: {
    backgroundColor: '#EEF9F3',
  },
  actionBtnToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  actionBtnDelete: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 4,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5EEFD',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },

  // Modal Dialogs
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalDialog: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.banner,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECF2',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: SPACING.md,
  },
  fieldGroup: {
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F2F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D2D1E1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.navy,
    backgroundColor: COLORS.white,
  },
  textInputDisabled: {
    backgroundColor: '#F1F2F6',
    color: COLORS.textMuted,
  },

  // Emojis & Icons
  iconSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPreviewBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#D2D1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPreviewText: {
    fontSize: 22,
  },
  presetEmojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  presetEmojiChip: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F4F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetEmojiChipSelected: {
    backgroundColor: '#FCEAF5',
    borderWidth: 1.5,
    borderColor: COLORS.hotPink,
  },
  presetEmojiText: {
    fontSize: 16,
  },

  // Colors Grid
  presetColorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  colorChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D2D1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorChipSelected: {
    borderWidth: 2,
    borderColor: COLORS.navy,
  },

  twoColRow: {
    flexDirection: 'row',
  },
  statusToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDEFF5',
    borderRadius: RADIUS.sm,
    padding: 2,
    height: 38,
  },
  statusToggleOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm - 2,
  },
  statusToggleActive: {
    backgroundColor: COLORS.success,
  },
  statusToggleInactive: {
    backgroundColor: COLORS.error,
  },
  statusToggleOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  statusToggleOptionTextActive: {
    color: COLORS.white,
  },
  statusToggleOptionTextInactive: {
    color: COLORS.white,
  },
  modalStatsBox: {
    backgroundColor: '#F5F6FB',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: 4,
  },
  modalStatsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
  modalStatsText: {
    fontSize: 11,
    color: COLORS.navy,
    marginTop: 2,
  },

  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#ECECF2',
  },
  modalCancelBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EDEFF5',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modalSubmitBtn: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  modalSubmitGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Sub-Category Manager Modal Styles
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  addSubBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  subModalBody: {
    padding: SPACING.md,
    maxHeight: 450,
  },
  subEmptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  subEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 8,
  },
  subEmptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 4,
  },
  subCategoryCard: {
    backgroundColor: '#F9FAFE',
    borderWidth: 1,
    borderColor: '#ECECF2',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  subCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subCardInfo: {
    flex: 1,
  },
  subNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  subCategoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  subMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ECECF2',
  },
  subActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E4EB',
  },
  subActionDisabled: {
    opacity: 0.4,
  },
  subActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.navy,
  },
  lockedCategoryBox: {
    backgroundColor: '#F1F4F9',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lockedCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },

  // Confirmation Modals
  confirmIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  confirmText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  confirmActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
