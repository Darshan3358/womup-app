import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpRight,
  PlaySquare,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { NEST_API_BASE_URL } from '../services/api';

interface BannerItem {
  _id: string;
  id?: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  placement: 'HOME_HERO' | 'CATEGORY_SPOTLIGHT' | 'FESTIVE_RAIL' | string;
  targetType: string;
  targetId: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export const BannerPromotionScreen: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePlacement, setActivePlacement] = useState<string>('ALL');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formPlacement, setFormPlacement] = useState<'HOME_HERO' | 'CATEGORY_SPOTLIGHT' | 'FESTIVE_RAIL'>('HOME_HERO');
  const [formTargetType, setFormTargetType] = useState('CATEGORY');
  const [formTargetId, setFormTargetId] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${NEST_API_BASE_URL}/banners/admin/all`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      } else {
        // Fallback to public banners endpoint
        const pubRes = await fetch(`${NEST_API_BASE_URL}/banners`);
        if (pubRes.ok) {
          const list = await pubRes.json();
          setBanners(Array.isArray(list) ? list : []);
        }
      }
    } catch (e) {
      console.warn('Failed fetching banners:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormTitle('');
    setFormImageUrl('');
    setFormVideoUrl('');
    setFormPlacement('HOME_HERO');
    setFormTargetType('CATEGORY');
    setFormTargetId('');
    setFormSortOrder('0');
    setFormIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (b: BannerItem) => {
    setEditingBanner(b);
    setFormTitle(b.title || '');
    setFormImageUrl(b.imageUrl || '');
    setFormVideoUrl(b.videoUrl || '');
    setFormPlacement((b.placement as any) || 'HOME_HERO');
    setFormTargetType(b.targetType || 'CATEGORY');
    setFormTargetId(b.targetId || '');
    setFormSortOrder(String(b.sortOrder || 0));
    setFormIsActive(b.isActive !== undefined ? b.isActive : true);
    setShowModal(true);
  };

  const handleSaveBanner = async () => {
    if (!formImageUrl.trim()) {
      Alert.alert('Image URL Required', 'Please provide a valid banner image URL.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formTitle.trim() || 'Promotional Banner',
        imageUrl: formImageUrl.trim(),
        videoUrl: formVideoUrl.trim() || undefined,
        placement: formPlacement,
        targetType: formTargetType,
        targetId: formTargetId.trim(),
        sortOrder: Number(formSortOrder) || 0,
        isActive: formIsActive,
      };

      if (editingBanner) {
        const bannerId = editingBanner._id || editingBanner.id;
        const res = await fetch(`${NEST_API_BASE_URL}/banners/${bannerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed updating banner');
      } else {
        const res = await fetch(`${NEST_API_BASE_URL}/banners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed creating banner');
      }

      setShowModal(false);
      fetchBanners();
    } catch (e: any) {
      Alert.alert('Error Saving Banner', e.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (b: BannerItem) => {
    const bannerId = b._id || b.id;
    try {
      // Optimistic update
      setBanners((prev) =>
        prev.map((item) =>
          (item._id || item.id) === bannerId ? { ...item, isActive: !item.isActive } : item
        )
      );
      await fetch(`${NEST_API_BASE_URL}/banners/${bannerId}/toggle`, {
        method: 'POST',
      });
    } catch (e) {
      fetchBanners();
    }
  };

  const handleDeleteBanner = async (b: BannerItem) => {
    const confirm = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? window.confirm(`Delete banner "${b.title}"?`) : true)
      : await new Promise((resolve) => {
          Alert.alert('Delete Banner', `Are you sure you want to delete banner "${b.title}"?`, [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
          ]);
        });

    if (!confirm) return;

    const bannerId = b._id || b.id;
    try {
      await fetch(`${NEST_API_BASE_URL}/banners/${bannerId}`, {
        method: 'DELETE',
      });
      fetchBanners();
    } catch (e: any) {
      Alert.alert('Delete Error', e.message || 'Failed deleting banner');
    }
  };

  const filteredBanners = banners.filter((b) => {
    if (activePlacement === 'ALL') return true;
    return b.placement === activePlacement;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Megaphone size={20} color={COLORS.purple} />
          </View>
          <View>
            <Text style={styles.headerTitle}>App Banners & Promotions</Text>
            <Text style={styles.headerSubtitle}>
              Control home hero carousels, deals & festive promotional rails
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Banner</Text>
        </TouchableOpacity>
      </View>

      {/* Placement Filter Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'ALL', label: 'All Banners' },
          { key: 'HOME_HERO', label: 'Home Hero' },
          { key: 'CATEGORY_SPOTLIGHT', label: 'Category Spotlight' },
          { key: 'FESTIVE_RAIL', label: 'Festive Rail' },
        ].map((tab) => {
          const isSelected = activePlacement === tab.key;
          const count = banners.filter((b) => tab.key === 'ALL' || b.placement === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isSelected && styles.tabItemActive]}
              onPress={() => setActivePlacement(tab.key)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Banner Cards List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.purple} />
          <Text style={styles.loadingText}>Loading promotional banners...</Text>
        </View>
      ) : filteredBanners.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Megaphone size={42} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Banners Found</Text>
          <Text style={styles.emptyText}>
            No banners configured for {activePlacement === 'ALL' ? 'the app' : activePlacement}. Click "Add Banner" to launch a new campaign.
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAdd}>
            <Plus size={15} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>Add First Banner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
          {filteredBanners.map((b) => {
            const bId = b._id || b.id;
            return (
              <View key={bId} style={styles.bannerCard}>
                {/* Image Preview */}
                <View style={styles.imageBox}>
                  {b.imageUrl ? (
                    <Image source={{ uri: b.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.noImgBox}>
                      <Megaphone size={28} color="#94A3B8" />
                    </View>
                  )}
                  {b.videoUrl ? (
                    <View style={styles.videoBadge}>
                      <PlaySquare size={12} color="#FFFFFF" />
                      <Text style={styles.videoBadgeText}>MP4/GIF</Text>
                    </View>
                  ) : null}
                  <View style={[styles.placementBadge, b.placement === 'HOME_HERO' ? styles.heroBadge : styles.festiveBadge]}>
                    <Text style={styles.placementBadgeText}>{b.placement.replace('_', ' ')}</Text>
                  </View>
                </View>

                {/* Banner Details */}
                <View style={styles.detailsBox}>
                  <View style={styles.titleRow}>
                    <Text style={styles.bannerTitle} numberOfLines={1}>
                      {b.title || 'Untitled Banner'}
                    </Text>
                    <View style={styles.switchRow}>
                      <Text style={[styles.activeStatusText, { color: b.isActive ? '#16A34A' : '#94A3B8' }]}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </Text>
                      <Switch
                        value={b.isActive}
                        onValueChange={() => handleToggleActive(b)}
                        trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                        thumbColor={b.isActive ? '#16A34A' : '#94A3B8'}
                      />
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Action Link:</Text>
                    <Text style={styles.metaValue}>
                      {b.targetType || 'DEFAULT'} {b.targetId ? `➔ ${b.targetId}` : ''}
                    </Text>
                    <Text style={styles.metaLabel}>Order:</Text>
                    <Text style={styles.metaValue}>{b.sortOrder ?? 0}</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleOpenEdit(b)}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={13} color={COLORS.purple} />
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteBanner(b)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#EF4444" />
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add / Edit Banner Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Megaphone size={18} color={COLORS.purple} />
                <Text style={styles.modalTitle}>
                  {editingBanner ? 'Edit Promotional Banner' : 'Create New Banner'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Banner Title / Campaign Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Fresh Mango Fest - 50% Off"
                placeholderTextColor="#9CA3AF"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Image URL *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://images.unsplash.com/... or Cloudinary URL"
                placeholderTextColor="#9CA3AF"
                value={formImageUrl}
                onChangeText={setFormImageUrl}
              />

              {formImageUrl ? (
                <View style={styles.previewImageContainer}>
                  <Image source={{ uri: formImageUrl }} style={styles.previewImage} resizeMode="cover" />
                </View>
              ) : null}

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Video URL (Optional for Animated Hero)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://...mp4 or GIF"
                placeholderTextColor="#9CA3AF"
                value={formVideoUrl}
                onChangeText={setFormVideoUrl}
              />

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Placement Slot</Text>
              <View style={styles.optionRow}>
                {(['HOME_HERO', 'CATEGORY_SPOTLIGHT', 'FESTIVE_RAIL'] as const).map((p) => {
                  const isSel = formPlacement === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.optionBtn, isSel && styles.optionBtnActive]}
                      onPress={() => setFormPlacement(p)}
                    >
                      <Text style={[styles.optionBtnText, isSel && styles.optionBtnTextActive]}>
                        {p.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Target Click Type</Text>
              <View style={styles.optionRow}>
                {['CATEGORY', 'PRODUCT', 'PROMO', 'NONE'].map((t) => {
                  const isSel = formTargetType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.optionBtn, isSel && styles.optionBtnActive]}
                      onPress={() => setFormTargetType(t)}
                    >
                      <Text style={[styles.optionBtnText, isSel && styles.optionBtnTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Target ID / Category Slug</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. fruits-vegetables or product ID"
                placeholderTextColor="#9CA3AF"
                value={formTargetId}
                onChangeText={setFormTargetId}
              />

              <View style={styles.formRowTwoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Sort Order (Priority)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formSortOrder}
                    onChangeText={setFormSortOrder}
                  />
                </View>

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={styles.fieldLabel}>Active for Customers</Text>
                  <Switch
                    value={formIsActive}
                    onValueChange={setFormIsActive}
                    trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                    thumbColor={formIsActive ? '#16A34A' : '#94A3B8'}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveBanner}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>
                      {editingBanner ? 'Update Banner' : 'Create Banner'}
                    </Text>
                  </>
                )}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.purple,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tabBadgeActive: {
    backgroundColor: '#EDE9FE',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBadgeTextActive: {
    color: COLORS.purple,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    gap: 14,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
      default: { elevation: 2 },
    }),
  },
  imageBox: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  noImgBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placementBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  heroBadge: {
    backgroundColor: '#7C3AED',
  },
  festiveBadge: {
    backgroundColor: '#DB2777',
  },
  placementBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  videoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  detailsBox: {
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    flex: 1,
    marginRight: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    marginRight: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3E8FF',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalFormScroll: {
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  previewImageContainer: {
    height: 100,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: COLORS.purple,
  },
  optionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  optionBtnTextActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  formRowTwoCol: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.purple,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
