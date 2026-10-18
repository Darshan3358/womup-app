import React, { useState, useEffect, useCallback } from 'react';
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
  Store,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Sparkles,
  RefreshCw,
  Coins,
  MapPin,
  Clock,
  Phone,
  User,
  ShieldCheck,
  Percent,
  QrCode,
  Building,
} from 'lucide-react-native';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme';
import { ApiService } from '../services/api';
import { VendorAdminItem, VendorCategoryItem } from '../types/admin';
import { VendorKycReviewModal } from './modals/VendorKycReviewModal';

export const VendorsManagementScreen: React.FC = () => {
  const [vendors, setVendors] = useState<VendorAdminItem[]>([]);
  const [categories, setCategories] = useState<VendorCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Form Fields
  const [storeName, setStoreName] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [categoryName, setCategoryName] = useState('Vegetables');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [pincode, setPincode] = useState('380015');
  const [latitude, setLatitude] = useState('23.0225');
  const [longitude, setLongitude] = useState('72.5714');
  const [shoppingCoinPercent, setShoppingCoinPercent] = useState('15');
  const [platformCommissionPercent, setPlatformCommissionPercent] = useState('2');
  const [openingTime, setOpeningTime] = useState('8:00 AM');
  const [closingTime, setClosingTime] = useState('9:00 PM');
  const [imageUrl, setImageUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Quick Coin Edit Modal
  const [coinEditVendor, setCoinEditVendor] = useState<VendorAdminItem | null>(null);
  const [quickCoinPercent, setQuickCoinPercent] = useState('10');
  const [isUpdatingCoin, setIsUpdatingCoin] = useState(false);

  // Status Filter & QR Modal
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED' | 'KYC_PENDING'>('ALL');
  const [qrVendor, setQrVendor] = useState<VendorAdminItem | null>(null);
  const [reviewVendorId, setReviewVendorId] = useState<string | null>(null);

  // Analytics KPI Summary
  const [analytics, setAnalytics] = useState({
    totalVendors: 0,
    activeVendors: 0,
    kycPending: 0,
    monthlyRevenue: 0,
  });

  const fetchVendorsData = useCallback(async () => {
    try {
      setLoading(true);
      const [vendorsRes, catsRes, statsRes] = await Promise.all([
        ApiService.getVendors({
          city: selectedCity,
          category: selectedCategory,
          query: searchQuery,
        }),
        ApiService.getVendorCategories(),
        ApiService.getVendorsAnalytics(),
      ]);

      if (vendorsRes.success && vendorsRes.data) {
        setVendors(vendorsRes.data);
      }
      if (catsRes.success && catsRes.data) {
        setCategories(catsRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setAnalytics(statsRes.data);
      }
    } catch (err: any) {
      console.warn('Failed fetching vendors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCity, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchVendorsData();
  }, [fetchVendorsData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendorsData();
  };

  const handleOpenCreateModal = () => {
    setEditingVendorId(null);
    setStoreName('');
    setVendorCode(`VND${Math.floor(100 + Math.random() * 900)}`);
    setOwnerName('');
    setOwnerPhone('');
    setCategoryName('Vegetables');
    setAddress('');
    setCity('Ahmedabad');
    setPincode('380015');
    setLatitude('23.0225');
    setLongitude('72.5714');
    setShoppingCoinPercent('15');
    setPlatformCommissionPercent('2');
    setOpeningTime('8:00 AM');
    setClosingTime('9:00 PM');
    setImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80');
    setBannerUrl('');
    setUpiId('');
    setBankAccountNo('');
    setBankIfsc('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: VendorAdminItem) => {
    setEditingVendorId(v.id || v._id || null);
    setStoreName(v.storeName);
    setVendorCode(v.vendorCode);
    setOwnerName(v.ownerName || '');
    setOwnerPhone(v.ownerPhone || '');
    setCategoryName(v.categoryName || 'Vegetables');
    setAddress(v.address || '');
    setCity(v.city || 'Ahmedabad');
    setPincode(v.pincode || '');
    setLatitude(v.coordinates?.coordinates?.[1]?.toString() || '23.0225');
    setLongitude(v.coordinates?.coordinates?.[0]?.toString() || '72.5714');
    setShoppingCoinPercent((v.shoppingCoinPercent ?? 10).toString());
    setPlatformCommissionPercent((v.platformCommissionPercent ?? 2).toString());
    setOpeningTime(v.openingTime || '8:00 AM');
    setClosingTime(v.closingTime || '9:00 PM');
    setImageUrl(v.imageUrl || '');
    setBannerUrl(v.bannerUrl || '');
    setUpiId(v.upiId || '');
    setBankAccountNo(v.bankAccount?.accountNumber || '');
    setBankIfsc(v.bankAccount?.ifscCode || '');
    setIsModalOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!storeName.trim() || !vendorCode.trim()) {
      Alert.alert('Required Fields', 'Please enter Store Name and Vendor Code.');
      return;
    }

    const coinVal = parseFloat(shoppingCoinPercent);
    if (isNaN(coinVal) || coinVal < 0 || coinVal > 100) {
      Alert.alert('Invalid Coins', 'Shopping Coin % must be a number between 0 and 100.');
      return;
    }

    setIsSubmitting(true);
    const payload: Partial<VendorAdminItem> = {
      storeName: storeName.trim(),
      vendorCode: vendorCode.trim().toUpperCase(),
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      categoryName: categoryName.trim(),
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      coordinates: {
        type: 'Point',
        coordinates: [parseFloat(longitude) || 72.5714, parseFloat(latitude) || 23.0225],
      },
      shoppingCoinPercent: coinVal,
      platformCommissionPercent: parseFloat(platformCommissionPercent) || 2,
      openingTime: openingTime.trim(),
      closingTime: closingTime.trim(),
      imageUrl: imageUrl.trim() || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
      upiId: upiId.trim() || undefined,
      bankAccount: {
        accountNumber: bankAccountNo.trim(),
        ifscCode: bankIfsc.trim().toUpperCase(),
        bankName: 'HDFC Bank',
      },
      isActive: true,
      isVerified: true,
    };

    try {
      if (editingVendorId) {
        await ApiService.updateVendor(editingVendorId, payload);
        Alert.alert('Success', 'Vendor updated successfully!');
      } else {
        await ApiService.createVendor(payload);
        Alert.alert('Success', `Vendor "${storeName}" created with ${coinVal}% Shopping Coins!`);
      }
      setIsModalOpen(false);
      fetchVendorsData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed saving vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (v: VendorAdminItem) => {
    const id = v.id || v._id;
    if (!id) return;
    try {
      await ApiService.updateVendor(id, { isActive: !v.isActive });
      fetchVendorsData();
    } catch {
      Alert.alert('Error', 'Failed toggling vendor status');
    }
  };

  const handleVerifyKyc = async (v: VendorAdminItem) => {
    const id = v.id || v._id;
    if (!id) return;
    try {
      await ApiService.verifyVendorKyc(id);
      Alert.alert('KYC Verified', `${v.storeName} is now KYC verified!`);
      fetchVendorsData();
    } catch {
      Alert.alert('Error', 'Failed verifying KYC');
    }
  };

  const handleDeleteVendor = (v: VendorAdminItem) => {
    const id = v.id || v._id;
    if (!id) return;
    Alert.alert(
      'Delete Vendor',
      `Are you sure you want to remove "${v.storeName}" from the Local Store network?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await ApiService.deleteVendor(id);
            fetchVendorsData();
          },
        },
      ]
    );
  };

  const handleSaveQuickCoin = async () => {
    if (!coinEditVendor) return;
    const id = coinEditVendor.id || coinEditVendor._id;
    const val = parseFloat(quickCoinPercent);
    if (!id || isNaN(val) || val < 2 || val > 25) {
      Alert.alert('Validation Error', 'Shopping Coin % must be between 2% and 25% per WormUp policy.');
      return;
    }

    setIsUpdatingCoin(true);
    try {
      await ApiService.updateVendorCoinRate(id, val);
      setCoinEditVendor(null);
      fetchVendorsData();
      Alert.alert('Coin Rate Updated', `${coinEditVendor.storeName} cashback is now ${val}%!`);
    } catch {
      Alert.alert('Error', 'Could not update shopping coin rate.');
    } finally {
      setIsUpdatingCoin(false);
    }
  };

  const displayedVendors = vendors.filter((v) => {
    if (statusFilter === 'ACTIVE') return v.isActive;
    if (statusFilter === 'DISABLED') return !v.isActive;
    if (statusFilter === 'KYC_PENDING') return !v.isVerified;
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Bar */}
        <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.topHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Store size={20} color={COLORS.navy} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>Local Store Vendors</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  Manage offline partner shops & Coin %
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw size={16} color={COLORS.navy} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addNewBtn}
                onPress={handleOpenCreateModal}
                activeOpacity={0.85}
              >
                <Plus size={16} color={COLORS.white} />
                <Text style={styles.addNewBtnText}>Add Vendor</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Filters & Search Row */}
          <View style={styles.filtersBar}>
            <View style={styles.searchBox}>
              <Search size={16} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by store name, category, or address..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={fetchVendorsData}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {['All Categories', 'Vegetables', 'Grocery', 'Medical', 'Salon', 'Garments', 'Bakery', 'Electronics'].map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      selectedCategory === cat && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === cat && styles.filterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>
        </LinearGradient>

        {/* KPI Summary Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>{analytics.totalVendors || vendors.length}</Text>
            <Text style={styles.kpiLabel}>Total</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: '#10B981' }]}>
              {analytics.activeVendors || vendors.filter((v) => v.isActive).length}
            </Text>
            <Text style={styles.kpiLabel}>Active</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: '#F59E0B' }]}>
              {analytics.kycPending || vendors.filter((v) => !v.isVerified).length}
            </Text>
            <Text style={styles.kpiLabel}>KYC Pending</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: '#2563EB' }]}>
              ₹{((analytics.monthlyRevenue || 45000) / 1000).toFixed(1)}k
            </Text>
            <Text style={styles.kpiLabel}>Monthly GMV</Text>
          </View>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.statusFilterBar}>
          {[
            { id: 'ALL', label: `All (${vendors.length})` },
            { id: 'ACTIVE', label: `Active (${vendors.filter((v) => v.isActive).length})` },
            { id: 'DISABLED', label: `Disabled (${vendors.filter((v) => !v.isActive).length})` },
            { id: 'KYC_PENDING', label: `KYC Pending (${vendors.filter((v) => !v.isVerified).length})` },
          ].map((st) => (
            <TouchableOpacity
              key={st.id}
              style={[
                styles.statusTabPill,
                statusFilter === st.id && styles.statusTabPillActive,
              ]}
              onPress={() => setStatusFilter(st.id as any)}
            >
              <Text
                style={[
                  styles.statusTabPillText,
                  statusFilter === st.id && styles.statusTabPillTextActive,
                ]}
              >
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. Vendor Cards List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.navy} />
            <Text style={styles.loadingText}>Loading MongoDB vendors collection...</Text>
          </View>
        ) : displayedVendors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Store size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Vendors Found</Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter !== 'ALL'
                ? `No vendors matching filter "${statusFilter}".`
                : 'Click "+ Add Vendor" above to register your first local partner shop.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContent}>
            {displayedVendors.map((vendor) => (
              <View key={vendor.id || vendor._id} style={styles.vendorCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.storeIconBox}>
                      <Store size={20} color={COLORS.navy} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.storeTitleRow}>
                        <Text style={styles.storeNameText} numberOfLines={1}>
                          {vendor.storeName}
                        </Text>
                        <View style={styles.vendorCodePill}>
                          <Text style={styles.vendorCodeText}>{vendor.vendorCode}</Text>
                        </View>
                      </View>
                      <Text style={styles.metaText} numberOfLines={1}>
                        {vendor.categoryName} • {vendor.city} • {vendor.pincode}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badges */}
                  <View style={styles.statusBadgesRow}>
                    <View
                      style={[
                        styles.badgePill,
                        vendor.isActive ? styles.badgeActive : styles.badgeInactive,
                      ]}
                    >
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: vendor.isActive ? '#10B981' : '#94A3B8' },
                        ]}
                      />
                      <Text style={styles.badgeText}>
                        {vendor.isActive ? 'Active' : 'Disabled'}
                      </Text>
                    </View>

                    {vendor.isVerified && (
                      <View style={[styles.badgePill, styles.badgeVerified]}>
                        <ShieldCheck size={11} color="#2563EB" />
                        <Text style={[styles.badgeText, { color: '#2563EB' }]}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* ⭐ CRITICAL: Shopping Coin Config Banner */}
                <View style={styles.coinConfigRow}>
                  <LinearGradient
                    colors={['#FEF3C7', '#FDE68A']}
                    style={styles.coinBanner}
                  >
                    <View style={styles.coinBannerLeft}>
                      <Coins size={18} color="#D97706" />
                      <View style={{ marginLeft: 8, flex: 1, minWidth: 0 }}>
                        <Text style={styles.coinBannerTitle} numberOfLines={1}>
                          Shopping Coin Cashback: <Text style={styles.coinHighlight}>{vendor.shoppingCoinPercent}%</Text>
                        </Text>
                        <Text style={styles.coinBannerSub} numberOfLines={1}>
                          Customer earns ₹{vendor.shoppingCoinPercent} coins per ₹100 bill
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.coinEditBtn}
                      onPress={() => {
                        setCoinEditVendor(vendor);
                        setQuickCoinPercent((vendor.shoppingCoinPercent || 10).toString());
                      }}
                      activeOpacity={0.75}
                    >
                      <Edit2 size={12} color="#92400E" />
                      <Text style={styles.coinEditBtnText}>Edit %</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>

                {/* Details Grid */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <View style={styles.infoRow}>
                      <User size={13} color="#64748B" />
                      <Text style={styles.infoValue} numberOfLines={1}>Owner: {vendor.ownerName || '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Phone size={13} color="#64748B" />
                      <Text style={styles.infoValue} numberOfLines={1}>{vendor.ownerPhone || '—'}</Text>
                    </View>
                  </View>

                  <View style={styles.infoCol}>
                    <View style={styles.infoRow}>
                      <Clock size={13} color="#64748B" />
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {vendor.openingTime || '8:00 AM'} - {vendor.closingTime || '9:00 PM'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <QrCode size={13} color="#64748B" />
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {vendor.upiId || `${vendor.vendorCode.toLowerCase()}@okhdfcbank`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Actions Section */}
                <View style={styles.cardActionsContainer}>
                  <View style={styles.statsPreviewRow}>
                    <Text style={styles.statLabel}>
                      Transactions: <Text style={styles.statVal}>{vendor.totalTransactions ?? 0}</Text>
                    </Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.statLabel}>
                      Revenue: <Text style={styles.statVal}>₹{(vendor.monthlyRevenue ?? 0).toLocaleString()}</Text>
                    </Text>
                  </View>

                  <View style={styles.actionButtonsWrap}>
                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      onPress={() => setQrVendor(vendor)}
                      activeOpacity={0.7}
                    >
                      <QrCode size={12} color={COLORS.navy} style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnOutlineText}>Show QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      onPress={() => handleToggleActive(vendor)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionBtnOutlineText}>
                        {vendor.isActive ? 'Disable' : 'Enable'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      onPress={() => setReviewVendorId((vendor as any)._id || vendor.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.actionBtnOutlineText, { color: !vendor.isVerified ? '#2563EB' : '#10B981' }]}>
                        {!vendor.isVerified ? 'Review KYC' : 'View KYC'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleOpenEditModal(vendor)}
                      activeOpacity={0.8}
                    >
                      <Edit2 size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.actionBtnPrimaryText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDanger}
                      onPress={() => handleDeleteVendor(vendor)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 4. Add / Edit Vendor Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingVendorId ? 'Edit Vendor Details' : 'Add New Local Partner Vendor'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Sets up vendor store, location, UPI QR code, and Shopping Coin %
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              {/* SECTION 1: Store Information */}
              <Text style={styles.sectionHeading}>🏪 Store Information</Text>
              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Store Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={storeName}
                    onChangeText={setStoreName}
                    placeholder="e.g. Gokul Vegetables"
                  />
                </View>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Vendor Code * (Unique)</Text>
                  <TextInput
                    style={styles.input}
                    value={vendorCode}
                    onChangeText={setVendorCode}
                    placeholder="e.g. VND001"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Owner Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={ownerName}
                    onChangeText={setOwnerName}
                    placeholder="e.g. Ramesh Patel"
                  />
                </View>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Owner Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={ownerPhone}
                    onChangeText={setOwnerPhone}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formFieldFull}>
                <Text style={styles.label}>Store Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  {['Vegetables', 'Grocery', 'Medical', 'Salon', 'Garments', 'Bakery', 'Electronics', 'Restaurants', 'More'].map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChoice,
                          categoryName === cat && styles.categoryChoiceActive,
                        ]}
                        onPress={() => setCategoryName(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryChoiceText,
                            categoryName === cat && styles.categoryChoiceTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>
              </View>

              {/* SECTION 2: ⭐ CRITICAL: Shopping Coins Config */}
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
                ⭐ Shopping Coins Configuration (Admin Settable)
              </Text>
              <View style={styles.coinAdminBox}>
                <View style={styles.formRow}>
                  <View style={styles.formFieldHalf}>
                    <Text style={styles.labelBold}>Shopping Coin % (Cashback) *</Text>
                    <View style={styles.percentInputWrapper}>
                      <TextInput
                        style={styles.percentInput}
                        value={shoppingCoinPercent}
                        onChangeText={setShoppingCoinPercent}
                        keyboardType="numeric"
                        placeholder="15"
                      />
                      <Text style={styles.percentSuffix}>%</Text>
                    </View>
                    <Text style={styles.helperNote}>
                      Customer earns {shoppingCoinPercent || 0}% coins on counter purchases
                    </Text>
                  </View>

                  <View style={styles.formFieldHalf}>
                    <Text style={styles.labelBold}>Platform Commission % *</Text>
                    <View style={styles.percentInputWrapper}>
                      <TextInput
                        style={styles.percentInput}
                        value={platformCommissionPercent}
                        onChangeText={setPlatformCommissionPercent}
                        keyboardType="numeric"
                        placeholder="2"
                      />
                      <Text style={styles.percentSuffix}>%</Text>
                    </View>
                    <Text style={styles.helperNote}>
                      WormUp fee retained from offline vendor settlement
                    </Text>
                  </View>
                </View>
              </View>

              {/* SECTION 3: Location */}
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>📍 Location & Coordinates</Text>
              <View style={styles.formFieldFull}>
                <Text style={styles.label}>Full Address *</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Near Nandanvan Society, Highway Road, Mahesana"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>City *</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Ahmedabad / Mahesana"
                  />
                </View>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Pincode *</Text>
                  <TextInput
                    style={styles.input}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="380015"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="23.0225"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="72.5714"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* SECTION 4: Operating Hours & Payments */}
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>🕒 Operating Hours & UPI QR</Text>
              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Opens At</Text>
                  <TextInput
                    style={styles.input}
                    value={openingTime}
                    onChangeText={setOpeningTime}
                    placeholder="8:00 AM"
                  />
                </View>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Closes At</Text>
                  <TextInput
                    style={styles.input}
                    value={closingTime}
                    onChangeText={setClosingTime}
                    placeholder="9:00 PM"
                  />
                </View>
              </View>

              <View style={styles.formFieldFull}>
                <Text style={styles.label}>UPI ID (for Direct Pay & QR)</Text>
                <TextInput
                  style={styles.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="gokul@okhdfcbank"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>Bank Account No.</Text>
                  <TextInput
                    style={styles.input}
                    value={bankAccountNo}
                    onChangeText={setBankAccountNo}
                    placeholder="5010023491823"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formFieldHalf}>
                  <Text style={styles.label}>IFSC Code</Text>
                  <TextInput
                    style={styles.input}
                    value={bankIfsc}
                    onChangeText={setBankIfsc}
                    placeholder="HDFC0000123"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.formFieldFull}>
                <Text style={styles.label}>Shop Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://..."
                />
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveVendor}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingVendorId ? 'Save Changes' : 'Create Vendor'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Quick Coin % Edit Modal */}
      <Modal visible={!!coinEditVendor} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Set Shopping Coin %</Text>
                <Text style={styles.modalSubtitle}>{coinEditVendor?.storeName}</Text>
              </View>
              <TouchableOpacity onPress={() => setCoinEditVendor(null)}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={styles.labelBold}>Enter Shopping Coin Percentage</Text>
              <View style={[styles.percentInputWrapper, { marginTop: 8 }]}>
                <TextInput
                  style={[styles.percentInput, { fontSize: 24, textAlign: 'center' }]}
                  value={quickCoinPercent}
                  onChangeText={setQuickCoinPercent}
                  keyboardType="numeric"
                  autoFocus
                />
                <Text style={[styles.percentSuffix, { fontSize: 24 }]}>%</Text>
              </View>

              <View style={styles.quickPresetRow}>
                {[2, 5, 8, 10, 12, 15, 18, 20, 25].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      quickCoinPercent === preset.toString() && styles.presetChipActive,
                    ]}
                    onPress={() => setQuickCoinPercent(preset.toString())}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        quickCoinPercent === preset.toString() && styles.presetChipTextActive,
                      ]}
                    >
                      {preset}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.earningPreviewCard}>
                <Coins size={16} color="#D97706" />
                <Text style={styles.earningPreviewText}>
                  On a ₹1,000 customer bill: <Text style={{ fontWeight: '900', color: '#B45309' }}>₹{Math.round((1000 * (parseFloat(quickCoinPercent) || 0)) / 100)}</Text> Shopping Coins earned
                </Text>
              </View>

              <Text style={[styles.helperNote, { marginTop: 10, textAlign: 'center' }]}>
                Min: 2% • Max: 25%. Applies immediately to all new customer checkouts.
              </Text>

              <View style={[styles.modalFooter, { marginTop: 20, paddingHorizontal: 0 }]}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setCoinEditVendor(null)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSaveQuickCoin}
                  disabled={isUpdatingCoin}
                >
                  {isUpdatingCoin ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Update Rate</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. QR Code Standee Print Modal */}
      <Modal visible={!!qrVendor} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Counter QR Standee</Text>
                <Text style={styles.modalSubtitle}>{qrVendor?.storeName} ({qrVendor?.vendorCode})</Text>
              </View>
              <TouchableOpacity onPress={() => setQrVendor(null)}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, alignItems: 'center' }}>
              <View style={styles.qrStandeeCard}>
                <View style={styles.qrStandeeHeader}>
                  <Text style={styles.qrStandeeBrand}>WOMUP PAY</Text>
                  <Text style={styles.qrStandeeStore}>{qrVendor?.storeName}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>Counter Terminal: {qrVendor?.vendorCode}</Text>
                </View>

                <View style={styles.qrCodeBox}>
                  <View style={styles.qrCodeMockInner}>
                    <QrCode size={90} color="#0F172A" />
                    <Text style={styles.qrCodeText}>{qrVendor?.vendorCode}</Text>
                  </View>
                </View>

                <View style={styles.qrStandeeBanner}>
                  <Text style={styles.qrStandeeBannerText}>
                    ⭐ Scan with WormUp & Earn {qrVendor?.shoppingCoinPercent}% Coins
                  </Text>
                </View>
              </View>

              <Text style={[styles.helperNote, { textAlign: 'center', marginTop: 8 }]}>
                Payload: womup://vendor/{qrVendor?.vendorCode} • UPI: {qrVendor?.upiId || 'merchant@okhdfcbank'}
              </Text>

              <View style={[styles.modalFooter, { marginTop: 16, width: '100%', justifyContent: 'space-between' }]}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setQrVendor(null)}
                >
                  <Text style={styles.cancelBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => {
                    Alert.alert('Print Standee', `Printing counter standee sheet for ${qrVendor?.storeName} (${qrVendor?.vendorCode})`);
                  }}
                >
                  <Text style={styles.submitBtnText}>Print A4 Standee 🖨️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <VendorKycReviewModal
        isOpen={!!reviewVendorId}
        vendorId={reviewVendorId}
        onClose={() => setReviewVendorId(null)}
        onApproved={fetchVendorsData}
        onRejected={fetchVendorsData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    width: '100%',
    overflow: 'hidden',
  },
  mainScrollView: {
    flex: 1,
    width: '100%',
  },
  mainScrollContent: {
    paddingBottom: 90,
    width: '100%',
  },
  topHeader: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  addNewBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  filtersBar: {
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  categoryScroll: {
    width: '100%',
  },
  categoryScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 10,
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 300,
  },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
    width: '100%',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  storeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  storeNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  vendorCodePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    flexShrink: 0,
  },
  vendorCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    flexShrink: 0,
    maxWidth: 130,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  badgeVerified: {
    backgroundColor: '#EFF6FF',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  coinConfigRow: {
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },
  coinBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
    width: '100%',
  },
  coinBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  coinBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  coinHighlight: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#B45309',
  },
  coinBannerSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 1,
  },
  coinEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
    gap: 3,
    flexShrink: 0,
  },
  coinEditBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
    width: '100%',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  cardActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 8,
    width: '100%',
  },
  statsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  statVal: {
    fontWeight: '800',
    color: '#0F172A',
  },
  actionButtonsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  actionBtnOutlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnDanger: {
    paddingHorizontal: 8,
    paddingVertical: 5.5,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  formScroll: {
    padding: 18,
    gap: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formFieldHalf: {
    flex: 1,
  },
  formFieldFull: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  labelBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryChoice: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChoiceActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  categoryChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  categoryChoiceTextActive: {
    color: '#FFFFFF',
  },
  coinAdminBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  percentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D97706',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  percentInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
    paddingVertical: 6,
  },
  percentSuffix: {
    fontSize: 16,
    fontWeight: '900',
    color: '#B45309',
  },
  helperNote: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    width: '100%',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  statusFilterBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    marginTop: 4,
    flexWrap: 'wrap',
    width: '100%',
  },
  statusTabPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusTabPillActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  statusTabPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  statusTabPillTextActive: {
    color: '#FFFFFF',
  },
  earningPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    marginTop: 12,
  },
  earningPreviewText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  qrStandeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginVertical: 12,
    width: '100%',
  },
  qrStandeeHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrStandeeBrand: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: 1,
  },
  qrStandeeStore: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  qrCodeBox: {
    width: 160,
    height: 160,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 12,
  },
  qrCodeMockInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 6,
  },
  qrStandeeBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  qrStandeeBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
});
