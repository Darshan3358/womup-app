import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Search,
  UserPlus,
  ChevronRight,
  Phone,
  Bike,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Save,
  Mail,
  Building,
  MapPin,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Award,
  Clock,
  ArrowLeft,
  Power,
  ChevronDown,
  Navigation,
  Check,
  FileText,
  Eye,
  Trash2,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { Customer, DeliveryPartnerItem } from '../types/admin';
import { ApiService } from '../services/api';
import { CustomerKycReviewModal } from './modals/CustomerKycReviewModal';

interface RiderEditForm {
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  hubName: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  isOnline: boolean;
}

export const CustomersScreen: React.FC = () => {
  const {
    customers,
    riders,
    cities,
    zones,
    darkStores,
    setSelectedCustomer,
    setSubView,
    setActiveModal,
    updateRider,
    deleteCustomer,
    deleteRider,
  } = useAdminState();

  const [activeTabMode, setActiveTabMode] = useState<'CUSTOMERS' | 'RIDERS'>('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCustomerFilter, setActiveCustomerFilter] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [activeRiderFilter, setActiveRiderFilter] = useState<'All' | 'Online' | 'Approved' | 'Pending'>('All');
  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');

  // Modal pickers
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [reviewCustomerId, setReviewCustomerId] = useState<string | null>(null);

  // 1. Resolve Active Cities
  const activeCities = cities.filter((c) => c.status === 'Active' || !c.status);
  const currentCity = activeCities.find(
    (c) => (c.id && c.id === selectedCityId) || (c._id && c._id === selectedCityId)
  );

  // 2. Resolve Available Areas for Selected City
  const availableAreas = zones.filter((z) => {
    if (selectedCityId === 'ALL') return true;
    if (!currentCity) return true;
    const currentCityIdStr = currentCity.id || currentCity._id;
    if (z.cityId && currentCityIdStr && String(z.cityId) === String(currentCityIdStr)) return true;
    if (z.cityName && currentCity.name && z.cityName.toLowerCase() === currentCity.name.toLowerCase()) return true;
    if (z.city && currentCity.name && z.city.toLowerCase() === currentCity.name.toLowerCase()) return true;
    return false;
  });

  const currentArea = availableAreas.find(
    (a) => (a.id && a.id === selectedAreaId) || (a._id && a._id === selectedAreaId)
  );

  // Helper: Resolve Customer location
  const resolveCustomerHierarchy = (c: Customer) => {
    let areaName = c.zoneName || 'Area';
    let matchedZone = zones.find(
      (z) =>
        z.name.toLowerCase() === (c.zoneName || '').toLowerCase() ||
        (c.address && c.address.toLowerCase().includes(z.name.toLowerCase()))
    );
    if (matchedZone) areaName = matchedZone.name;
    let cityName = matchedZone?.cityName || matchedZone?.city || 'Ahmedabad';
    return { cityName, areaName };
  };

  // Helper: Resolve Rider location
  const resolveRiderHierarchy = (r: DeliveryPartnerItem) => {
    let matchedStore = darkStores.find(
      (s) =>
        (r.hubId && (s.id === r.hubId || s.code === r.hubId)) ||
        (r.hubName && s.name.toLowerCase() === r.hubName.toLowerCase()) ||
        (r.hubName && s.name.toLowerCase().includes(r.hubName.toLowerCase()))
    );
    let matchedZone = zones.find(
      (z) =>
        (matchedStore?.areaId && (z.id === matchedStore.areaId || z._id === matchedStore.areaId)) ||
        (r.hubName && z.name.toLowerCase().includes(r.hubName.toLowerCase())) ||
        (r.hubName && r.hubName.toLowerCase().includes(z.name.toLowerCase()))
    );
    let cityName = matchedStore?.cityName || matchedStore?.city || matchedZone?.cityName || 'Ahmedabad';
    let areaName = matchedStore?.areaName || matchedZone?.name || r.hubName || 'Hub Area';
    let hubDisplay = matchedStore?.name || r.hubName || `Wom Up ${areaName} Store`;
    return { cityName, areaName, hubDisplay };
  };

  // Rider Detail & Edit Modal State
  const [selectedRider, setSelectedRider] = useState<(DeliveryPartnerItem & { email?: string; bankAccount?: any; documents?: any }) | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isEditingRider, setIsEditingRider] = useState(false);
  const [isSavingRider, setIsSavingRider] = useState(false);
  const [saveToast, setSaveToast] = useState('');
  const [editForm, setEditForm] = useState<RiderEditForm>({
    name: '',
    phone: '',
    vehicleType: '',
    vehicleNumber: '',
    hubName: '',
    status: 'APPROVED',
    isOnline: false,
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeCustomerFilter === 'All' || c.status === activeCustomerFilter;
    if (!matchesSearch || !matchesFilter) return false;

    const { cityName, areaName } = resolveCustomerHierarchy(c);

    if (selectedCityId !== 'ALL' && currentCity) {
      const matchCity = cityName.toLowerCase() === currentCity.name.toLowerCase();
      if (!matchCity) return false;
    }

    if (selectedAreaId !== 'ALL' && currentArea) {
      const matchArea =
        areaName.toLowerCase() === currentArea.name.toLowerCase() ||
        (c.zoneName && c.zoneName.toLowerCase() === currentArea.name.toLowerCase());
      if (!matchArea) return false;
    }

    return true;
  });

  const filteredRiders = (riders || []).filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      (r.partnerCode && r.partnerCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesFilter = true;
    if (activeRiderFilter === 'Online') matchesFilter = r.isOnline;
    else if (activeRiderFilter === 'Approved') matchesFilter = r.status === 'APPROVED';
    else if (activeRiderFilter === 'Pending') matchesFilter = r.status === 'PENDING';

    if (!matchesSearch || !matchesFilter) return false;

    const { cityName, areaName } = resolveRiderHierarchy(r);

    if (selectedCityId !== 'ALL' && currentCity) {
      const matchCity = cityName.toLowerCase() === currentCity.name.toLowerCase();
      if (!matchCity) return false;
    }

    if (selectedAreaId !== 'ALL' && currentArea) {
      const matchArea =
        areaName.toLowerCase() === currentArea.name.toLowerCase() ||
        (r.hubName && r.hubName.toLowerCase().includes(currentArea.name.toLowerCase()));
      if (!matchArea) return false;
    }

    return true;
  });

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSubView('CustomerProfile');
  };

  const handleOpenRiderDetail = async (rider: DeliveryPartnerItem) => {
    setSelectedRider(rider);
    setEditForm({
      name: rider.name,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      vehicleNumber: rider.vehicleNumber,
      hubName: rider.hubName,
      status: rider.status,
      isOnline: rider.isOnline,
    });
    setIsEditingRider(false);
    setSaveToast('');
    setIsDetailModalOpen(true);
    setIsLoadingDetail(true);

    try {
      const res = await ApiService.fetchRiderDetail(rider.id);
      const detail = res?.data || res;
      if (detail && (detail.id || detail._id || detail.fullName || detail.name)) {
        const enriched = {
          ...rider,
          ...detail,
          name: detail.fullName || detail.name || rider.name,
          phone: detail.phoneNumber || detail.phone || rider.phone,
          bankAccount: {
            bankName: detail.bankAccount?.bankName || detail.bankName || (rider as any).bankName || 'N/A',
            accountNumber: detail.bankAccount?.accountNumber || detail.bankAccount?.accountNumberFull || detail.accountNumber || (rider as any).accountNumber || 'N/A',
            ifscCode: detail.bankAccount?.ifscCode || detail.bankAccount?.ifsc || detail.ifscCode || (rider as any).ifscCode || 'N/A',
            accountHolderName: detail.bankAccount?.accountHolderName || detail.accountHolderName || detail.fullName || (rider as any).fullName || rider.name || 'N/A',
            branchName: detail.bankAccount?.branchName || detail.bankBranch || (rider as any).bankBranch || '',
            upiId: detail.bankAccount?.upiId || detail.upiId || (rider as any).upiId || '',
            isVerified: detail.bankAccount?.isVerified || detail.verificationStatus === 'VERIFIED' || detail.status === 'APPROVED',
          },
          documents: {
            dlFront: detail.documents?.dlFront || detail.documents?.dlFrontUrl || detail.dlImageUrl || rider.documents?.dlFront || (rider as any).dlImageUrl || null,
            dlFrontUrl: detail.documents?.dlFrontUrl || detail.documents?.dlFront || detail.dlImageUrl || rider.documents?.dlFrontUrl || (rider as any).dlImageUrl || null,
            dlBack: detail.documents?.dlBack || detail.documents?.dlBackUrl || detail.dlBackUrl || rider.documents?.dlBack || null,
            dlBackUrl: detail.documents?.dlBackUrl || detail.documents?.dlBack || detail.dlBackUrl || rider.documents?.dlBackUrl || null,
            dlNumber: detail.documents?.dlNumber || detail.drivingLicense || detail.dlNumber || rider.documents?.dlNumber || (rider as any).drivingLicense || null,
            rcFront: detail.documents?.rcFront || detail.documents?.rcFrontUrl || detail.rcImageUrl || rider.documents?.rcFront || (rider as any).rcImageUrl || null,
            rcFrontUrl: detail.documents?.rcFrontUrl || detail.documents?.rcFront || detail.rcImageUrl || rider.documents?.rcFrontUrl || (rider as any).rcImageUrl || null,
            rcBack: detail.documents?.rcBack || detail.documents?.rcBackUrl || detail.rcBackUrl || rider.documents?.rcBack || null,
            rcBackUrl: detail.documents?.rcBackUrl || detail.documents?.rcBack || detail.rcBackUrl || rider.documents?.rcBackUrl || null,
            rcNumber: detail.documents?.rcNumber || detail.rcNumber || rider.documents?.rcNumber || (rider as any).rcNumber || null,
            insurance: detail.documents?.insurance || detail.documents?.insuranceUrl || detail.vehicleInsuranceUrl || rider.documents?.insurance || (rider as any).vehicleInsuranceUrl || null,
            insuranceUrl: detail.documents?.insuranceUrl || detail.documents?.insurance || detail.vehicleInsuranceUrl || rider.documents?.insuranceUrl || (rider as any).vehicleInsuranceUrl || null,
            aadhaarFront: detail.documents?.aadhaarFront || detail.documents?.aadhaarFrontUrl || detail.aadharFrontUrl || rider.documents?.aadhaarFront || (rider as any).aadharFrontUrl || null,
            aadhaarFrontUrl: detail.documents?.aadhaarFrontUrl || detail.documents?.aadhaarFront || detail.aadharFrontUrl || rider.documents?.aadhaarFrontUrl || (rider as any).aadharFrontUrl || null,
            aadhaarBack: detail.documents?.aadhaarBack || detail.documents?.aadhaarBackUrl || detail.aadharBackUrl || rider.documents?.aadhaarBack || (rider as any).aadharBackUrl || null,
            aadhaarBackUrl: detail.documents?.aadhaarBackUrl || detail.documents?.aadhaarBack || detail.aadharBackUrl || rider.documents?.aadhaarBackUrl || (rider as any).aadharBackUrl || null,
            aadhaarNumber: detail.documents?.aadhaarNumber || detail.aadharNumber || rider.documents?.aadhaarNumber || (rider as any).aadharNumber || null,
            profilePhoto: detail.documents?.profilePhoto || detail.documents?.profilePhotoUrl || detail.profilePhotoUrl || rider.documents?.profilePhoto || null,
            profilePhotoUrl: detail.documents?.profilePhotoUrl || detail.documents?.profilePhoto || detail.profilePhotoUrl || rider.documents?.profilePhotoUrl || null,
          },
        };
        setSelectedRider(enriched);
        setEditForm({
          name: enriched.name,
          phone: enriched.phone,
          vehicleType: enriched.vehicleType,
          vehicleNumber: enriched.vehicleNumber,
          hubName: enriched.hubName,
          status: enriched.status,
          isOnline: enriched.isOnline,
        });
      }
    } catch (e) {
      console.warn('[Admin] Failed to load rider details:', e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSaveRiderChanges = async () => {
    if (!selectedRider) return;
    setIsSavingRider(true);
    setSaveToast('');
    try {
      const success = await updateRider(selectedRider.id, {
        name: editForm.name,
        phone: editForm.phone,
        vehicleType: editForm.vehicleType,
        vehicleNumber: editForm.vehicleNumber,
        hubName: editForm.hubName,
        status: editForm.status,
        isOnline: editForm.isOnline,
      });

      if (success) {
        setSelectedRider((prev) =>
          prev
            ? {
                ...prev,
                name: editForm.name,
                phone: editForm.phone,
                vehicleType: editForm.vehicleType,
                vehicleNumber: editForm.vehicleNumber,
                hubName: editForm.hubName,
                status: editForm.status,
                isOnline: editForm.isOnline,
              }
            : null
        );
        setSaveToast('Partner details updated successfully!');
        setTimeout(() => {
          setIsEditingRider(false);
          setSaveToast('');
        }, 1200);
      } else {
        alert('Failed to update rider details. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating rider');
    } finally {
      setIsSavingRider(false);
    }
  };

  const handleApproveRider = async () => {
    if (!selectedRider) return;
    try {
      setIsSavingRider(true);
      const res = await ApiService.approveRider(selectedRider.id);
      if (res?.success) {
        setSelectedRider((p) => p ? { ...p, status: 'APPROVED', isOnline: true } : null);
        updateRider(selectedRider.id, { status: 'APPROVED', isOnline: true });
        Alert.alert('Rider Approved', 'Rider account has been approved and dispatch has been unlocked.');
      } else {
        Alert.alert('Approval Failed', res?.error || res?.message || 'Could not approve rider');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSavingRider(false);
    }
  };

  const handleRejectRider = async () => {
    if (!selectedRider) return;
    try {
      setIsSavingRider(true);
      const res = await ApiService.rejectRider(selectedRider.id, 'DL/RC documents could not be verified');
      if (res?.success) {
        setSelectedRider((p) => p ? { ...p, status: 'REJECTED', isOnline: false } : null);
        updateRider(selectedRider.id, { status: 'REJECTED', isOnline: false });
        Alert.alert('Rider Rejected', 'Rider registration has been rejected.');
      } else {
        Alert.alert('Rejection Failed', res?.error || res?.message || 'Could not reject rider');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSavingRider(false);
    }
  };

  const [isDeletingRider, setIsDeletingRider] = useState(false);

  const handleDeleteRider = async (riderId?: string, riderName?: string) => {
    const targetId = riderId || selectedRider?.id;
    const targetName = riderName || selectedRider?.name || 'this delivery partner';
    if (!targetId || isDeletingRider) return;

    const confirmed = typeof window !== 'undefined' && window.confirm
      ? window.confirm(`Are you sure you want to permanently delete delivery partner "${targetName}"?\n\nThis will remove their profile, bank accounts, and wallet data from MongoDB. This action cannot be undone.`)
      : true;

    if (!confirmed) return;

    setIsDeletingRider(true);
    try {
      const ok = await deleteRider(targetId);
      if (ok) {
        setIsDetailModalOpen(false);
        setSelectedRider(null);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Delivery partner "${targetName}" has been permanently deleted.`);
        }
      } else {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Failed to delete delivery partner. Please try again.`);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete delivery partner');
    } finally {
      setIsDeletingRider(false);
    }
  };

  const handleDeleteCustomerFromList = async (customerId: string, customerName: string) => {
    const confirmed = typeof window !== 'undefined' && window.confirm
      ? window.confirm(`Are you sure you want to permanently delete customer "${customerName}"?\n\nThis action cannot be undone.`)
      : true;

    if (!confirmed) return;

    const ok = await deleteCustomer(customerId);
    if (ok) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Customer "${customerName}" deleted successfully.`);
      }
    } else {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Failed to delete customer. Please try again.`);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Segmented Navigation: Customers vs Delivery Partners */}
      <View style={styles.modeTabsRow}>
        <TouchableOpacity
          style={[styles.modeTab, activeTabMode === 'CUSTOMERS' && styles.activeModeTab]}
          onPress={() => {
            setActiveTabMode('CUSTOMERS');
            setSearchQuery('');
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.modeTabText, activeTabMode === 'CUSTOMERS' && styles.activeModeTabText]}>
            👥 Customers ({customers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeTabMode === 'RIDERS' && styles.activeModeTab]}
          onPress={() => {
            setActiveTabMode('RIDERS');
            setSearchQuery('');
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.modeTabText, activeTabMode === 'RIDERS' && styles.activeModeTabText]}>
            🛵 Delivery Partners ({riders?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Section */}
      <View style={styles.topSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTabMode === 'CUSTOMERS'
                ? 'Search customer by name, phone or ID...'
                : 'Search rider by name, code, phone or vehicle...'
            }
            placeholderTextColor={COLORS.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Cascading Filter Bar: City + Area */}
        <View style={styles.filtersBar}>
          {/* City Filter */}
          <TouchableOpacity
            style={[styles.filterDropdownBtn, selectedCityId !== 'ALL' && styles.activeFilterDropdown]}
            onPress={() => setShowCityPicker(true)}
            activeOpacity={0.8}
          >
            <MapPin size={13} color={selectedCityId !== 'ALL' ? COLORS.purple : COLORS.textMuted} />
            <Text style={[styles.filterDropdownText, selectedCityId !== 'ALL' && styles.activeDropdownText]} numberOfLines={1}>
              City: {currentCity ? currentCity.name : 'All'}
            </Text>
            <ChevronDown size={14} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Area Filter */}
          <TouchableOpacity
            style={[
              styles.filterDropdownBtn,
              selectedAreaId !== 'ALL' && styles.activeFilterDropdown,
              selectedCityId === 'ALL' && availableAreas.length === 0 && styles.disabledFilterBtn,
            ]}
            onPress={() => {
              if (selectedCityId === 'ALL' && availableAreas.length === 0) return;
              setShowAreaPicker(true);
            }}
            activeOpacity={0.8}
          >
            <Navigation size={13} color={selectedAreaId !== 'ALL' ? COLORS.blue : COLORS.textMuted} />
            <Text style={[styles.filterDropdownText, selectedAreaId !== 'ALL' && styles.activeDropdownText]} numberOfLines={1}>
              Area: {currentArea ? currentArea.name : 'All'}
            </Text>
            <ChevronDown size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        {activeTabMode === 'CUSTOMERS' ? (
          <View style={styles.filterRow}>
            {(['All', 'Active', 'Blocked'] as const).map((filter) => {
              const isSelected = activeCustomerFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                  onPress={() => setActiveCustomerFilter(filter)}
                >
                  <Text style={[styles.filterText, isSelected && styles.activeFilterText]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.filterRow}>
            {(['All', 'Online', 'Approved', 'Pending'] as const).map((filter) => {
              const isSelected = activeRiderFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                  onPress={() => setActiveRiderFilter(filter)}
                >
                  <Text style={[styles.filterText, isSelected && styles.activeFilterText]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Main List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {activeTabMode === 'CUSTOMERS' ? (
          filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No customers found matching criteria</Text>
            </View>
          ) : (
            filteredCustomers.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.customerCard}
                onPress={() => handleSelectCustomer(c)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: c.avatar }} style={styles.avatar} />

                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">{c.name}</Text>
                    {c.type === 'Corporate' && (
                      <View style={styles.corpBadge}>
                        <Text style={styles.corpText}>CORP</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.metaRow}>
                    <Phone size={11} color={COLORS.textMuted} style={{ marginRight: 4, flexShrink: 0 }} />
                    <Text style={styles.phoneText} numberOfLines={1}>{c.phone}</Text>
                  </View>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: c.status === 'Active' ? COLORS.success : COLORS.error },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: c.status === 'Active' ? COLORS.success : COLORS.error },
                      ]}
                    >
                      {c.status}
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.zoneText} numberOfLines={1} ellipsizeMode="tail">
                      🏙️ {resolveCustomerHierarchy(c).cityName} • 📍 {resolveCustomerHierarchy(c).areaName}
                    </Text>
                  </View>
                </View>

                <View style={styles.rightCol}>
                  <Text style={styles.spendAmount}>₹{c.spend.toLocaleString()}</Text>
                  <Text style={styles.orderCount}>{c.totalOrders} orders</Text>
                  <TouchableOpacity
                    style={styles.reviewKycPill}
                    onPress={(e) => {
                      e.stopPropagation();
                      setReviewCustomerId((c as any)._id || c.id);
                    }}
                  >
                    <Text style={styles.reviewKycPillText}>Review KYC</Text>
                  </TouchableOpacity>
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomerFromList(c.id, c.name);
                      }}
                      style={styles.listDeleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Delete Customer"
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                    <ChevronRight size={18} color={COLORS.secondaryText} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (
          filteredRiders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No delivery partners found matching criteria</Text>
            </View>
          ) : (
            filteredRiders.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.riderCard}
                onPress={() => handleOpenRiderDetail(r)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: r.avatar }} style={styles.avatar} />

                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">
                      {r.name}
                    </Text>
                    <View style={styles.partnerCodeBadge}>
                      <Text style={styles.partnerCodeText}>{r.partnerCode}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Phone size={11} color={COLORS.textMuted} style={{ marginRight: 4, flexShrink: 0 }} />
                    <Text style={styles.phoneText} numberOfLines={1}>{r.phone}</Text>
                  </View>

                  {r.email ? (
                    <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
                      {r.email}
                    </Text>
                  ) : null}

                  <View style={styles.riderVehicleRow}>
                    <Bike size={11} color={COLORS.primary} style={{ marginRight: 4, flexShrink: 0 }} />
                    <Text style={styles.vehicleText} numberOfLines={1} ellipsizeMode="tail">
                      {r.vehicleType} • {r.vehicleNumber}
                    </Text>
                  </View>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: r.isOnline ? COLORS.success : COLORS.textMuted },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: r.isOnline ? COLORS.success : COLORS.textMuted },
                      ]}
                    >
                      {r.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.zoneText} numberOfLines={1} ellipsizeMode="tail">
                      📍 {resolveRiderHierarchy(r).areaName || 'Hub'}
                    </Text>
                  </View>
                </View>

                <View style={styles.rightCol}>
                  <View style={styles.ratingBadge}>
                    <Star size={11} color="#FFB800" fill="#FFB800" style={{ marginRight: 3 }} />
                    <Text style={styles.ratingText}>{r.rating.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.deliveriesCount}>{r.completedDeliveries} Deliveries</Text>
                  <View style={[styles.kycBadge, { backgroundColor: r.status === 'APPROVED' ? '#E8F8F0' : '#FFF4E5' }]}>
                    <Text style={[styles.kycText, { color: r.status === 'APPROVED' ? '#0D8A4E' : '#B25E09' }]}>
                      {r.status}
                    </Text>
                  </View>
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteRider(r.id, r.name);
                      }}
                      style={styles.listDeleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Delete Partner"
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                    <ChevronRight size={18} color={COLORS.secondaryText} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>

      {/* Add Customer FAB only when in Customer tab */}
      {activeTabMode === 'CUSTOMERS' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setActiveModal('AddCustomer')}
          activeOpacity={0.9}
        >
          <UserPlus size={22} color={COLORS.white} />
          <Text style={styles.fabText}>Add Customer</Text>
        </TouchableOpacity>
      )}

      {/* ========================================================================= */}
      {/* RIDER DETAIL & EDIT MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        visible={isDetailModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                {isEditingRider ? (
                  <TouchableOpacity
                    onPress={() => setIsEditingRider(false)}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                  >
                    <ArrowLeft size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                ) : (
                  <Bike size={20} color={COLORS.primary} style={{ marginRight: 6, flexShrink: 0 }} />
                )}
                <Text style={styles.modalHeaderTitle} numberOfLines={1} ellipsizeMode="tail">
                  {isEditingRider ? 'Edit Partner Details' : 'Partner Profile'}
                </Text>
                {selectedRider?.partnerCode && !isEditingRider && (
                  <View style={styles.partnerCodeBadgeHeader}>
                    <Text style={styles.partnerCodeTextHeader}>{selectedRider.partnerCode}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setIsDetailModalOpen(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#0F172A" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {isLoadingDetail ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Fetching partner details...</Text>
              </View>
            ) : selectedRider ? (
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                {saveToast ? (
                  <View style={styles.toastBanner}>
                    <CheckCircle2 size={16} color="#0D8A4E" style={{ marginRight: 6 }} />
                    <Text style={styles.toastText}>{saveToast}</Text>
                  </View>
                ) : null}

                {!isEditingRider ? (
                  /* ========================================================= */
                  /* VIEW MODE                                                 */
                  /* ========================================================= */
                  <>
                    {/* Top Identity Card */}
                    <View style={styles.profileTopCard}>
                      <Image source={{ uri: selectedRider.avatar }} style={styles.profileAvatar} />
                      <View style={styles.profileTopInfo}>
                        <View style={styles.profileNameRow}>
                          <Text style={styles.profileFullName}>{selectedRider.name}</Text>
                          <View
                            style={[
                              styles.statusPill,
                              {
                                backgroundColor:
                                  selectedRider.status === 'APPROVED'
                                    ? '#E8F8F0'
                                    : selectedRider.status === 'PENDING'
                                    ? '#FFF4E5'
                                    : '#FEE2E2',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                {
                                  color:
                                    selectedRider.status === 'APPROVED'
                                      ? '#0D8A4E'
                                      : selectedRider.status === 'PENDING'
                                      ? '#B25E09'
                                      : '#DC2626',
                                },
                              ]}
                            >
                              {selectedRider.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.profileMetaLine}>
                          <View
                            style={[
                              styles.onlineIndicatorDot,
                              { backgroundColor: selectedRider.isOnline ? COLORS.success : COLORS.textMuted },
                            ]}
                          />
                          <Text
                            style={[
                              styles.onlineIndicatorText,
                              { color: selectedRider.isOnline ? COLORS.success : COLORS.textMuted },
                            ]}
                          >
                            {selectedRider.isOnline ? 'Active & Online' : 'Offline'}
                          </Text>
                          <Text style={styles.dotSeparator}>•</Text>
                          <Award size={12} color="#FFB800" style={{ marginRight: 3 }} />
                          <Text style={styles.ratingText}>
                            {selectedRider.rating?.toFixed(2) || '5.00'} Rating
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Quick Stats Row */}
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>{selectedRider.completedDeliveries || 0}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>{selectedRider.totalDeliveries || 0}</Text>
                        <Text style={styles.statLabel}>Total Orders</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>{selectedRider.acceptanceRate || 96}%</Text>
                        <Text style={styles.statLabel}>Acceptance</Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>{selectedRider.avgDeliveryMinutes || 18}m</Text>
                        <Text style={styles.statLabel}>Avg Delivery</Text>
                      </View>
                    </View>

                    {/* Contact & Operational Details */}
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionHeader}>Operational Details</Text>

                      <View style={styles.detailRow}>
                        <Phone size={16} color={COLORS.textMuted} style={styles.detailIcon} />
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Phone Number</Text>
                          <Text style={styles.detailValue}>{selectedRider.phone}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Mail size={16} color={COLORS.textMuted} style={styles.detailIcon} />
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Email Address</Text>
                          <Text style={styles.detailValue}>{selectedRider.email || 'Not provided'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Bike size={16} color={COLORS.primary} style={styles.detailIcon} />
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Vehicle & Registration</Text>
                          <Text style={styles.detailValue}>
                            {selectedRider.vehicleType} • {selectedRider.vehicleNumber}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Building size={16} color={COLORS.textMuted} style={styles.detailIcon} />
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Assigned Hub Dark Store</Text>
                          <Text style={styles.detailValue}>
                            {selectedRider.hubName} ({selectedRider.city || 'Ahmedabad'})
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Clock size={16} color={COLORS.textMuted} style={styles.detailIcon} />
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Joined Date</Text>
                          <Text style={styles.detailValue}>
                            {selectedRider.joinedDate || 'Recent'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Bank Account Details Card */}
                    <View style={styles.sectionContainer}>
                      <View style={styles.bankHeaderRow}>
                        <CreditCard size={18} color="#4F46E5" style={{ marginRight: 6 }} />
                        <Text style={styles.sectionHeader}>Bank Account & Payout Details</Text>
                        <View style={styles.kycVerifiedBadge}>
                          <ShieldCheck size={12} color="#0D8A4E" style={{ marginRight: 3 }} />
                          <Text style={styles.kycVerifiedText}>
                            {selectedRider.bankAccount?.isVerified || selectedRider.status === 'APPROVED' ? 'VERIFIED' : 'PENDING'}
                          </Text>
                        </View>
                      </View>

                      {selectedRider.bankAccount && (selectedRider.bankAccount.bankName || selectedRider.bankAccount.accountNumber) ? (
                        <View style={styles.bankDetailsCard}>
                          <View style={styles.bankFieldRow}>
                            <Text style={styles.bankFieldLabel}>Bank Name:</Text>
                            <Text style={styles.bankFieldValue}>
                              {selectedRider.bankAccount.bankName || 'N/A'}
                            </Text>
                          </View>
                          <View style={styles.bankFieldRow}>
                            <Text style={styles.bankFieldLabel}>Account Number:</Text>
                            <Text style={styles.bankFieldValueMono}>
                              {selectedRider.bankAccount.accountNumber || 'N/A'}
                            </Text>
                          </View>
                          <View style={styles.bankFieldRow}>
                            <Text style={styles.bankFieldLabel}>IFSC Code:</Text>
                            <Text style={styles.bankFieldValueMono}>
                              {selectedRider.bankAccount.ifscCode || 'N/A'}
                            </Text>
                          </View>
                          <View style={styles.bankFieldRow}>
                            <Text style={styles.bankFieldLabel}>Beneficiary Name:</Text>
                            <Text style={styles.bankFieldValue}>
                              {selectedRider.bankAccount.accountHolderName || selectedRider.name}
                            </Text>
                          </View>
                          {selectedRider.bankAccount.branchName ? (
                            <View style={styles.bankFieldRow}>
                              <Text style={styles.bankFieldLabel}>Branch:</Text>
                              <Text style={styles.bankFieldValue}>
                                {selectedRider.bankAccount.branchName}
                              </Text>
                            </View>
                          ) : null}
                          {selectedRider.bankAccount.upiId ? (
                            <View style={styles.bankFieldRow}>
                              <Text style={styles.bankFieldLabel}>UPI ID:</Text>
                              <Text style={styles.bankFieldValueMono}>
                                {selectedRider.bankAccount.upiId}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        <View style={styles.noBankCard}>
                          <AlertCircle size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                          <Text style={styles.noBankText}>No specific bank account document linked yet.</Text>
                        </View>
                      )}
                    </View>

                    {/* KYC Documents Inspection Card */}
                    <View style={styles.sectionContainer}>
                      <View style={styles.bankHeaderRow}>
                        <FileText size={18} color="#7C3AED" style={{ marginRight: 6 }} />
                        <Text style={styles.sectionHeader}>KYC & Fleet Legal Documents</Text>
                        <View style={[styles.kycVerifiedBadge, { backgroundColor: selectedRider.status === 'APPROVED' ? '#E8F5E9' : '#FEF3C7' }]}>
                          <ShieldCheck size={12} color={selectedRider.status === 'APPROVED' ? '#0D8A4E' : '#D97706'} style={{ marginRight: 3 }} />
                          <Text style={[styles.kycVerifiedText, { color: selectedRider.status === 'APPROVED' ? '#0D8A4E' : '#D97706' }]}>
                            {selectedRider.status === 'APPROVED' ? 'ALL VERIFIED' : selectedRider.status === 'REJECTED' ? 'REJECTED' : 'UNDER REVIEW'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.docCardsList}>
                        {/* 1. Commercial DL */}
                        <View style={styles.docItemCard}>
                          <View style={styles.docItemHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docItemTitle}>Commercial Driving License (DL)</Text>
                              <Text style={styles.docItemSubtitle}>
                                {selectedRider.documents?.dlNumber || 'License on file'}
                              </Text>
                            </View>
                            <View style={[styles.docBadge, { backgroundColor: (selectedRider.documents?.dlFront || selectedRider.documents?.dlFrontUrl) ? (selectedRider.status === 'APPROVED' ? '#E8F5E9' : '#FEF3C7') : '#FEE2E2' }]}>
                              <Text style={[styles.docBadgeText, { color: (selectedRider.documents?.dlFront || selectedRider.documents?.dlFrontUrl) ? (selectedRider.status === 'APPROVED' ? '#0D8A4E' : '#D97706') : '#DC2626' }]}>
                                {(selectedRider.documents?.dlFront || selectedRider.documents?.dlFrontUrl) ? (selectedRider.status === 'APPROVED' ? 'VERIFIED' : 'PENDING') : 'NOT UPLOADED'}
                              </Text>
                            </View>
                          </View>
                          {(selectedRider.documents?.dlFront || selectedRider.documents?.dlFrontUrl) ? (
                            <View style={styles.docThumbsRow}>
                              <TouchableOpacity
                                style={styles.docThumbContainer}
                                onPress={() => setPreviewDoc({ title: 'Driving License (Front)', url: selectedRider.documents?.dlFront || selectedRider.documents?.dlFrontUrl || '' })}
                                activeOpacity={0.8}
                              >
                                <Image source={{ uri: selectedRider.documents?.dlFront || selectedRider.documents?.dlFrontUrl }} style={styles.docThumbImg} resizeMode="cover" />
                                <View style={styles.docThumbOverlay}>
                                  <Eye size={14} color="#FFF" />
                                  <Text style={styles.docThumbText}>Front</Text>
                                </View>
                              </TouchableOpacity>
                              {(selectedRider.documents?.dlBack || selectedRider.documents?.dlBackUrl) && (
                                <TouchableOpacity
                                  style={styles.docThumbContainer}
                                  onPress={() => setPreviewDoc({ title: 'Driving License (Back)', url: selectedRider.documents?.dlBack || selectedRider.documents?.dlBackUrl || '' })}
                                  activeOpacity={0.8}
                                >
                                  <Image source={{ uri: selectedRider.documents?.dlBack || selectedRider.documents?.dlBackUrl }} style={styles.docThumbImg} resizeMode="cover" />
                                  <View style={styles.docThumbOverlay}>
                                    <Eye size={14} color="#FFF" />
                                    <Text style={styles.docThumbText}>Back</Text>
                                  </View>
                                </TouchableOpacity>
                              )}
                            </View>
                          ) : (
                            <Text style={styles.docEmptyText}>No driving license uploaded yet</Text>
                          )}
                        </View>

                        {/* 2. Vehicle RC */}
                        <View style={styles.docItemCard}>
                          <View style={styles.docItemHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docItemTitle}>Vehicle Registration Certificate (RC)</Text>
                              <Text style={styles.docItemSubtitle}>
                                {selectedRider.documents?.rcNumber || selectedRider.vehicleNumber || 'RC on file'}
                              </Text>
                            </View>
                            <View style={[styles.docBadge, { backgroundColor: (selectedRider.documents?.rcFront || selectedRider.documents?.rcFrontUrl) ? (selectedRider.status === 'APPROVED' ? '#E8F5E9' : '#FEF3C7') : '#FEE2E2' }]}>
                              <Text style={[styles.docBadgeText, { color: (selectedRider.documents?.rcFront || selectedRider.documents?.rcFrontUrl) ? (selectedRider.status === 'APPROVED' ? '#0D8A4E' : '#D97706') : '#DC2626' }]}>
                                {(selectedRider.documents?.rcFront || selectedRider.documents?.rcFrontUrl) ? (selectedRider.status === 'APPROVED' ? 'VERIFIED' : 'PENDING') : 'NOT UPLOADED'}
                              </Text>
                            </View>
                          </View>
                          {(selectedRider.documents?.rcFront || selectedRider.documents?.rcFrontUrl) ? (
                            <View style={styles.docThumbsRow}>
                              <TouchableOpacity
                                style={styles.docThumbContainer}
                                onPress={() => setPreviewDoc({ title: 'Vehicle RC (Front)', url: selectedRider.documents?.rcFront || selectedRider.documents?.rcFrontUrl || '' })}
                                activeOpacity={0.8}
                              >
                                <Image source={{ uri: selectedRider.documents?.rcFront || selectedRider.documents?.rcFrontUrl }} style={styles.docThumbImg} resizeMode="cover" />
                                <View style={styles.docThumbOverlay}>
                                  <Eye size={14} color="#FFF" />
                                  <Text style={styles.docThumbText}>Front</Text>
                                </View>
                              </TouchableOpacity>
                              {(selectedRider.documents?.rcBack || selectedRider.documents?.rcBackUrl) && (
                                <TouchableOpacity
                                  style={styles.docThumbContainer}
                                  onPress={() => setPreviewDoc({ title: 'Vehicle RC (Back)', url: selectedRider.documents?.rcBack || selectedRider.documents?.rcBackUrl || '' })}
                                  activeOpacity={0.8}
                                >
                                  <Image source={{ uri: selectedRider.documents?.rcBack || selectedRider.documents?.rcBackUrl }} style={styles.docThumbImg} resizeMode="cover" />
                                  <View style={styles.docThumbOverlay}>
                                    <Eye size={14} color="#FFF" />
                                    <Text style={styles.docThumbText}>Back</Text>
                                  </View>
                                </TouchableOpacity>
                              )}
                            </View>
                          ) : (
                            <Text style={styles.docEmptyText}>No vehicle RC uploaded yet</Text>
                          )}
                        </View>

                        {/* 3. Insurance */}
                        <View style={styles.docItemCard}>
                          <View style={styles.docItemHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docItemTitle}>Two-Wheeler Insurance Policy</Text>
                              <Text style={styles.docItemSubtitle}>
                                {selectedRider.documents?.insuranceNumber || 'Comprehensive Policy'}
                              </Text>
                            </View>
                            <View style={[styles.docBadge, { backgroundColor: (selectedRider.documents?.insurance || selectedRider.documents?.insuranceUrl) ? (selectedRider.status === 'APPROVED' ? '#E8F5E9' : '#FEF3C7') : '#FEE2E2' }]}>
                              <Text style={[styles.docBadgeText, { color: (selectedRider.documents?.insurance || selectedRider.documents?.insuranceUrl) ? (selectedRider.status === 'APPROVED' ? '#0D8A4E' : '#D97706') : '#DC2626' }]}>
                                {(selectedRider.documents?.insurance || selectedRider.documents?.insuranceUrl) ? (selectedRider.status === 'APPROVED' ? 'VERIFIED' : 'PENDING') : 'NOT UPLOADED'}
                              </Text>
                            </View>
                          </View>
                          {(selectedRider.documents?.insurance || selectedRider.documents?.insuranceUrl) ? (
                            <View style={styles.docThumbsRow}>
                              <TouchableOpacity
                                style={styles.docThumbContainer}
                                onPress={() => setPreviewDoc({ title: 'Insurance Policy', url: selectedRider.documents?.insurance || selectedRider.documents?.insuranceUrl || '' })}
                                activeOpacity={0.8}
                              >
                                <Image source={{ uri: selectedRider.documents?.insurance || selectedRider.documents?.insuranceUrl }} style={styles.docThumbImg} resizeMode="cover" />
                                <View style={styles.docThumbOverlay}>
                                  <Eye size={14} color="#FFF" />
                                  <Text style={styles.docThumbText}>Policy</Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Text style={styles.docEmptyText}>No insurance certificate uploaded yet</Text>
                          )}
                        </View>

                        {/* 4. Aadhaar Card */}
                        <View style={styles.docItemCard}>
                          <View style={styles.docItemHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docItemTitle}>National Identity Proof (Aadhaar)</Text>
                              <Text style={styles.docItemSubtitle}>
                                {selectedRider.documents?.aadhaarNumber ? `UIDAI • ${selectedRider.documents.aadhaarNumber}` : 'Government ID Proof'}
                              </Text>
                            </View>
                            <View style={[styles.docBadge, { backgroundColor: (selectedRider.documents?.aadhaarFront || selectedRider.documents?.aadhaarFrontUrl) ? (selectedRider.status === 'APPROVED' ? '#E8F5E9' : '#FEF3C7') : '#FEE2E2' }]}>
                              <Text style={[styles.docBadgeText, { color: (selectedRider.documents?.aadhaarFront || selectedRider.documents?.aadhaarFrontUrl) ? (selectedRider.status === 'APPROVED' ? '#0D8A4E' : '#D97706') : '#DC2626' }]}>
                                {(selectedRider.documents?.aadhaarFront || selectedRider.documents?.aadhaarFrontUrl) ? (selectedRider.status === 'APPROVED' ? 'VERIFIED' : 'PENDING') : 'NOT UPLOADED'}
                              </Text>
                            </View>
                          </View>
                          {(selectedRider.documents?.aadhaarFront || selectedRider.documents?.aadhaarFrontUrl) ? (
                            <View style={styles.docThumbsRow}>
                              <TouchableOpacity
                                style={styles.docThumbContainer}
                                onPress={() => setPreviewDoc({ title: 'Aadhaar Card (Front)', url: selectedRider.documents?.aadhaarFront || selectedRider.documents?.aadhaarFrontUrl || '' })}
                                activeOpacity={0.8}
                              >
                                <Image source={{ uri: selectedRider.documents?.aadhaarFront || selectedRider.documents?.aadhaarFrontUrl }} style={styles.docThumbImg} resizeMode="cover" />
                                <View style={styles.docThumbOverlay}>
                                  <Eye size={14} color="#FFF" />
                                  <Text style={styles.docThumbText}>Front</Text>
                                </View>
                              </TouchableOpacity>
                              {(selectedRider.documents?.aadhaarBack || selectedRider.documents?.aadhaarBackUrl) && (
                                <TouchableOpacity
                                  style={styles.docThumbContainer}
                                  onPress={() => setPreviewDoc({ title: 'Aadhaar Card (Back)', url: selectedRider.documents?.aadhaarBack || selectedRider.documents?.aadhaarBackUrl || '' })}
                                  activeOpacity={0.8}
                                >
                                  <Image source={{ uri: selectedRider.documents?.aadhaarBack || selectedRider.documents?.aadhaarBackUrl }} style={styles.docThumbImg} resizeMode="cover" />
                                  <View style={styles.docThumbOverlay}>
                                    <Eye size={14} color="#FFF" />
                                    <Text style={styles.docThumbText}>Back</Text>
                                  </View>
                                </TouchableOpacity>
                              )}
                            </View>
                          ) : (
                            <Text style={styles.docEmptyText}>No Aadhaar proof uploaded yet</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons: If Pending, show Approve / Reject */}
                    {selectedRider.status === 'PENDING' && (
                      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                        <TouchableOpacity
                          style={[styles.editActionBtn, { flex: 1, backgroundColor: '#10B981', marginBottom: 0 }]}
                          onPress={handleApproveRider}
                          activeOpacity={0.85}
                        >
                          <Check size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                          <Text style={styles.editActionBtnText}>Approve Rider</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.editActionBtn, { flex: 1, backgroundColor: '#EF4444', marginBottom: 0 }]}
                          onPress={handleRejectRider}
                          activeOpacity={0.85}
                        >
                          <X size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                          <Text style={styles.editActionBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Edit Button */}
                    <TouchableOpacity
                      style={styles.editActionBtn}
                      onPress={() => setIsEditingRider(true)}
                      activeOpacity={0.85}
                    >
                      <Edit3 size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                      <Text style={styles.editActionBtnText}>Edit Partner Details</Text>
                    </TouchableOpacity>

                    {/* Delete Partner Button */}
                    <TouchableOpacity
                      style={[styles.editActionBtn, styles.deletePartnerBtn]}
                      onPress={() => handleDeleteRider()}
                      disabled={isDeletingRider}
                      activeOpacity={0.85}
                    >
                      <Trash2 size={18} color="#DC2626" style={{ marginRight: 8 }} />
                      <Text style={styles.deletePartnerBtnText}>
                        {isDeletingRider ? 'Deleting Partner...' : 'Delete Delivery Partner'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* ========================================================= */
                  /* EDIT MODE FORM                                            */
                  /* ========================================================= */
                  <View style={styles.editFormContainer}>
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Full Name</Text>
                      <TextInput
                        style={styles.formInput}
                        value={editForm.name}
                        onChangeText={(txt) => setEditForm((p) => ({ ...p, name: txt }))}
                        placeholder="Rider full name"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.formInput}
                        value={editForm.phone}
                        onChangeText={(txt) => setEditForm((p) => ({ ...p, phone: txt }))}
                        placeholder="+91 9876543210"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.formRow}>
                      <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>Vehicle Type</Text>
                        <TextInput
                          style={styles.formInput}
                          value={editForm.vehicleType}
                          onChangeText={(txt) => setEditForm((p) => ({ ...p, vehicleType: txt }))}
                          placeholder="e.g. Scooter, EV 2-Wheeler"
                          placeholderTextColor={COLORS.textMuted}
                        />
                      </View>

                      <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Vehicle Number</Text>
                        <TextInput
                          style={styles.formInput}
                          value={editForm.vehicleNumber}
                          onChangeText={(txt) => setEditForm((p) => ({ ...p, vehicleNumber: txt }))}
                          placeholder="GJ-01-AB-1234"
                          placeholderTextColor={COLORS.textMuted}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Hub Dark Store Name</Text>
                      <TextInput
                        style={styles.formInput}
                        value={editForm.hubName}
                        onChangeText={(txt) => setEditForm((p) => ({ ...p, hubName: txt }))}
                        placeholder="e.g. Navrangpura Dark Store"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>

                    {/* Status Selection */}
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Partner Status</Text>
                      <View style={styles.statusOptionsRow}>
                        {(['APPROVED', 'PENDING', 'SUSPENDED'] as const).map((st) => {
                          const isSelected = editForm.status === st;
                          return (
                            <TouchableOpacity
                              key={st}
                              style={[
                                styles.statusOptionPill,
                                isSelected && styles.statusOptionPillActive,
                                isSelected && st === 'APPROVED' && { backgroundColor: '#E8F8F0', borderColor: '#0D8A4E' },
                                isSelected && st === 'PENDING' && { backgroundColor: '#FFF4E5', borderColor: '#B25E09' },
                                isSelected && st === 'SUSPENDED' && { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
                              ]}
                              onPress={() => setEditForm((p) => ({ ...p, status: st }))}
                            >
                              <Text
                                style={[
                                  styles.statusOptionText,
                                  isSelected && {
                                    fontWeight: '700',
                                    color:
                                      st === 'APPROVED' ? '#0D8A4E' : st === 'PENDING' ? '#B25E09' : '#DC2626',
                                  },
                                ]}
                              >
                                {st}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Online Status Toggle */}
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Duty Status</Text>
                      <View style={styles.onlineToggleRow}>
                        <TouchableOpacity
                          style={[
                            styles.dutyToggleBtn,
                            editForm.isOnline && styles.dutyToggleBtnOnline,
                          ]}
                          onPress={() => setEditForm((p) => ({ ...p, isOnline: true }))}
                        >
                          <Power size={14} color={editForm.isOnline ? COLORS.white : COLORS.textMuted} style={{ marginRight: 6 }} />
                          <Text style={[styles.dutyToggleText, editForm.isOnline && styles.dutyToggleTextActive]}>
                            ONLINE / ON DUTY
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.dutyToggleBtn,
                            !editForm.isOnline && styles.dutyToggleBtnOffline,
                          ]}
                          onPress={() => setEditForm((p) => ({ ...p, isOnline: false }))}
                        >
                          <Power size={14} color={!editForm.isOnline ? COLORS.white : COLORS.textMuted} style={{ marginRight: 6 }} />
                          <Text style={[styles.dutyToggleText, !editForm.isOnline && styles.dutyToggleTextActive]}>
                            OFFLINE
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.editActionsRow}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setIsEditingRider(false)}
                        disabled={isSavingRider}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSaveRiderChanges}
                        disabled={isSavingRider}
                      >
                        {isSavingRider ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <>
                            <Save size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Delete Partner Button in Edit Form */}
                    <TouchableOpacity
                      style={[styles.editActionBtn, styles.deletePartnerBtn, { marginTop: 14 }]}
                      onPress={() => handleDeleteRider()}
                      disabled={isDeletingRider || isSavingRider}
                      activeOpacity={0.85}
                    >
                      <Trash2 size={18} color="#DC2626" style={{ marginRight: 8 }} />
                      <Text style={styles.deletePartnerBtnText}>
                        {isDeletingRider ? 'Deleting Partner...' : 'Delete Delivery Partner'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: KYC DOCUMENT PREVIEW ================= */}
      <Modal
        visible={!!previewDoc}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <View style={styles.previewDocBackdrop}>
          <View style={styles.previewDocModal}>
            <View style={styles.previewDocHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <FileText size={18} color={COLORS.purple} style={{ marginRight: 8 }} />
                <Text style={styles.previewDocTitle} numberOfLines={1}>
                  {previewDoc?.title || 'Document Inspection'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPreviewDoc(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.previewDocImageContainer}>
              {previewDoc?.url ? (
                <Image
                  source={{ uri: previewDoc.url }}
                  style={styles.previewDocImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.docEmptyText}>Document image unavailable</Text>
              )}
            </View>
            <View style={styles.previewDocFooter}>
              <TouchableOpacity
                style={styles.previewDocCloseBtn}
                onPress={() => setPreviewDoc(null)}
              >
                <Text style={styles.previewDocCloseText}>Close Inspector</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ================= MODAL: SELECT CITY ================= */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.cityModalBackdrop}>
          <View style={styles.cityModalPanel}>
            <View style={styles.cityModalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MapPin size={20} color={COLORS.purple} />
                <View>
                  <Text style={styles.cityModalTitle}>Filter by City</Text>
                  <Text style={styles.cityModalSubtitle}>Scope users by registered city</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.cityModalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search city by name or code..."
                  placeholderTextColor={COLORS.textMuted}
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
                {citySearch ? (
                  <TouchableOpacity onPress={() => setCitySearch('')}>
                    <X size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.cityModalScroll} showsVerticalScrollIndicator={true}>
                <TouchableOpacity
                  style={[styles.cityModalItem, selectedCityId === 'ALL' && styles.cityModalItemActive]}
                  onPress={() => {
                    setSelectedCityId('ALL');
                    setSelectedAreaId('ALL');
                    setShowCityPicker(false);
                    setCitySearch('');
                  }}
                >
                  <View style={styles.cityModalItemLeft}>
                    <View style={[styles.cityMiniBadge, { backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.cityMiniBadgeText, { color: COLORS.textMuted }]}>ALL</Text>
                    </View>
                    <Text style={[styles.cityModalItemText, selectedCityId === 'ALL' && styles.cityModalItemTextActive]}>
                      All Cities
                    </Text>
                  </View>
                  {selectedCityId === 'ALL' && <Check size={18} color={COLORS.purple} />}
                </TouchableOpacity>

                {activeCities
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
                      c.code.toLowerCase().includes(citySearch.toLowerCase())
                  )
                  .map((city) => {
                    const isSelected = selectedCityId === (city.id || city._id);
                    return (
                      <TouchableOpacity
                        key={city.id || city._id}
                        style={[styles.cityModalItem, isSelected && styles.cityModalItemActive]}
                        onPress={() => {
                          setSelectedCityId(city.id || city._id || '');
                          setSelectedAreaId('ALL');
                          setShowCityPicker(false);
                          setCitySearch('');
                        }}
                      >
                        <View style={styles.cityModalItemLeft}>
                          <View style={styles.cityMiniBadge}>
                            <Text style={styles.cityMiniBadgeText}>{city.code}</Text>
                          </View>
                          <Text style={[styles.cityModalItemText, isSelected && styles.cityModalItemTextActive]}>
                            {city.name}
                          </Text>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.purple} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: SELECT AREA ================= */}
      <Modal
        visible={showAreaPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAreaPicker(false)}
      >
        <View style={styles.cityModalBackdrop}>
          <View style={styles.cityModalPanel}>
            <View style={styles.cityModalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Navigation size={20} color={COLORS.blue} />
                <View>
                  <Text style={styles.cityModalTitle}>
                    Filter by Area {currentCity ? `(${currentCity.name})` : ''}
                  </Text>
                  <Text style={styles.cityModalSubtitle}>Scope users by area / assigned store</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.cityModalBody}>
              <View style={styles.searchInnerRow}>
                <Search size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInnerInput}
                  placeholder="Search area name or code..."
                  placeholderTextColor={COLORS.textMuted}
                  value={areaSearch}
                  onChangeText={setAreaSearch}
                />
                {areaSearch ? (
                  <TouchableOpacity onPress={() => setAreaSearch('')}>
                    <X size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.cityModalScroll} showsVerticalScrollIndicator={true}>
                <TouchableOpacity
                  style={[styles.cityModalItem, selectedAreaId === 'ALL' && styles.cityModalItemActive]}
                  onPress={() => {
                    setSelectedAreaId('ALL');
                    setShowAreaPicker(false);
                    setAreaSearch('');
                  }}
                >
                  <View style={styles.cityModalItemLeft}>
                    <View style={[styles.areaMiniDot, { backgroundColor: COLORS.textMuted }]} />
                    <Text style={[styles.cityModalItemText, selectedAreaId === 'ALL' && styles.cityModalItemTextActive]}>
                      All Areas {currentCity ? `in ${currentCity.name}` : ''}
                    </Text>
                  </View>
                  {selectedAreaId === 'ALL' && <Check size={18} color={COLORS.purple} />}
                </TouchableOpacity>

                {availableAreas
                  .filter(
                    (a) =>
                      a.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
                      (a.code && a.code.toLowerCase().includes(areaSearch.toLowerCase()))
                  )
                  .map((area) => {
                    const isSelected = selectedAreaId === (area.id || area._id);
                    return (
                      <TouchableOpacity
                        key={area.id || area._id}
                        style={[styles.cityModalItem, isSelected && styles.cityModalItemActive]}
                        onPress={() => {
                          setSelectedAreaId(area.id || area._id || '');
                          setShowAreaPicker(false);
                          setAreaSearch('');
                        }}
                      >
                        <View style={styles.cityModalItemLeft}>
                          <View style={styles.areaMiniDot} />
                          <View>
                            <Text style={[styles.cityModalItemText, isSelected && styles.cityModalItemTextActive]}>
                              {area.name}
                            </Text>
                            <Text style={styles.cityModalItemSub}>
                              {area.cityName || currentCity?.name} • {area.darkStore || 'Dark Store Hub'}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.purple} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      <CustomerKycReviewModal
        isOpen={!!reviewCustomerId}
        customerId={reviewCustomerId}
        onClose={() => setReviewCustomerId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  reviewKycPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#059669',
  },
  reviewKycPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  filtersBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    flex: 1,
  },
  activeFilterDropdown: {
    backgroundColor: '#FAF5FF',
    borderColor: COLORS.purple,
  },
  disabledFilterBtn: {
    opacity: 0.6,
  },
  filterDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  activeDropdownText: {
    color: COLORS.purple,
    fontWeight: '700',
  },
  cityModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  cityModalPanel: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  cityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cityModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  cityModalSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  cityModalBody: {
    padding: SPACING.md,
  },
  searchInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchInnerInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    padding: 0,
  },
  cityModalScroll: {
    maxHeight: 280,
  },
  cityModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cityModalItemActive: {
    backgroundColor: '#FAF5FF',
  },
  cityModalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cityMiniBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cityMiniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
  },
  areaMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
  },
  cityModalItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cityModalItemTextActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  cityModalItemSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.sm,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 8,
  },
  activeFilterPill: {
    backgroundColor: COLORS.hotPink,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 110,
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: SPACING.md,
    backgroundColor: COLORS.lightBlueLavender,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 4,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  corpBadge: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  corpText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  phoneText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dotSeparator: {
    marginHorizontal: 4,
    color: COLORS.secondaryText,
    fontSize: 10,
  },
  zoneText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 84,
  },
  spendAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orderCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    elevation: 6,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modeTab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeModeTab: {
    borderBottomColor: COLORS.hotPink,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeModeTabText: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  partnerCodeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  partnerCodeText: {
    color: '#4338CA',
    fontSize: 10,
    fontWeight: '700',
  },
  emailText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  riderVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  vehicleText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  deliveriesCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  kycBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  kycText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* ========================================================================= */
  /* MODAL STYLES                                                              */
  /* ========================================================================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 620,
    maxHeight: '88%',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FAF5FF',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  partnerCodeBadgeHeader: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginLeft: 10,
    flexShrink: 0,
  },
  partnerCodeTextHeader: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginLeft: 8,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  toastText: {
    color: '#065F46',
    fontWeight: '600',
    fontSize: 13,
  },

  /* Profile Top Card */
  profileTopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.md,
    backgroundColor: COLORS.lightBlueLavender,
  },
  profileTopInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  profileFullName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: SPACING.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  /* Section Containers */
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 1,
  },

  /* Bank Section */
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  kycVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: 'auto',
  },
  kycVerifiedText: {
    color: '#0D8A4E',
    fontSize: 10,
    fontWeight: '700',
  },
  bankDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bankFieldLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bankFieldValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bankFieldValueMono: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Courier',
    color: '#1E293B',
  },
  noBankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  noBankText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  /* Edit Action Button */
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    elevation: 2,
    marginTop: 4,
  },
  editActionBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  deletePartnerBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#F87171',
    marginTop: 8,
    elevation: 0,
  },
  deletePartnerBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 8,
  },
  listDeleteBtn: {
    padding: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },

  /* Edit Form Styles */
  editFormContainer: {
    paddingVertical: 4,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  formRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  statusOptionsRow: {
    flexDirection: 'row',
  },
  statusOptionPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  statusOptionPillActive: {
    borderWidth: 1.5,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  onlineToggleRow: {
    flexDirection: 'row',
  },
  dutyToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  dutyToggleBtnOnline: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  dutyToggleBtnOffline: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  dutyToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  dutyToggleTextActive: {
    color: COLORS.white,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  docCardsList: {
    gap: 10,
  },
  docItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  docItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  docItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  docItemSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  docBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  docBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  docThumbsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  docThumbContainer: {
    width: 90,
    height: 65,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  docThumbImg: {
    width: '100%',
    height: '100%',
  },
  docThumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 4,
  },
  docThumbText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  docEmptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  previewDocBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewDocModal: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  previewDocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  previewDocTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  previewDocImageContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    backgroundColor: '#0F172A',
  },
  previewDocImage: {
    width: '100%',
    height: 380,
  },
  previewDocFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  previewDocCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.button,
  },
  previewDocCloseText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
