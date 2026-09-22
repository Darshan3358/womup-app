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
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { Customer, DeliveryPartnerItem } from '../types/admin';
import { ApiService } from '../services/api';

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
  const { customers, riders, setSelectedCustomer, setSubView, setActiveModal, updateRider } = useAdminState();

  const [activeTabMode, setActiveTabMode] = useState<'CUSTOMERS' | 'RIDERS'>('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCustomerFilter, setActiveCustomerFilter] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [activeRiderFilter, setActiveRiderFilter] = useState<'All' | 'Online' | 'Approved' | 'Pending'>('All');

  // Rider Detail & Edit Modal State
  const [selectedRider, setSelectedRider] = useState<(DeliveryPartnerItem & { email?: string; bankAccount?: any }) | null>(null);
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
    return matchesSearch && matchesFilter;
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

    return matchesSearch && matchesFilter;
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
      if (res && res.success && res.data) {
        const enriched = {
          ...rider,
          ...res.data,
          name: res.data.fullName || res.data.name || rider.name,
          phone: res.data.phoneNumber || res.data.phone || rider.phone,
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
                    <Text style={styles.customerName}>{c.name}</Text>
                    {c.type === 'Corporate' && (
                      <View style={styles.corpBadge}>
                        <Text style={styles.corpText}>CORP</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.metaRow}>
                    <Phone size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                    <Text style={styles.phoneText}>{c.phone}</Text>
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
                    <Text style={styles.zoneText}>{c.zoneName}</Text>
                  </View>
                </View>

                <View style={styles.rightCol}>
                  <Text style={styles.spendAmount}>₹{c.spend.toLocaleString()}</Text>
                  <Text style={styles.orderCount}>{c.totalOrders} orders</Text>
                  <ChevronRight size={18} color={COLORS.secondaryText} style={{ marginTop: 4 }} />
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
                    <Text style={styles.customerName}>{r.name}</Text>
                    <View style={styles.partnerCodeBadge}>
                      <Text style={styles.partnerCodeText}>{r.partnerCode}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Phone size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                    <Text style={styles.phoneText}>{r.phone}</Text>
                    {r.email ? <Text style={styles.emailText}> • {r.email}</Text> : null}
                  </View>

                  <View style={styles.riderVehicleRow}>
                    <Bike size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.vehicleText}>
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
                    <Text style={styles.zoneText}>{r.hubName}</Text>
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
                  <ChevronRight size={18} color={COLORS.secondaryText} style={{ marginTop: 6 }} />
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
                    <ArrowLeft size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                ) : (
                  <Bike size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
                )}
                <Text style={styles.modalHeaderTitle}>
                  {isEditingRider ? 'Edit Partner Details' : 'Delivery Partner Profile'}
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
              >
                <X size={20} color={COLORS.textMuted} />
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
                            {selectedRider.bankAccount?.isVerified ? 'VERIFIED' : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>

                      {selectedRider.bankAccount ? (
                        <View style={styles.bankDetailsCard}>
                          <View style={styles.bankFieldRow}>
                            <Text style={styles.bankFieldLabel}>Bank Name:</Text>
                            <Text style={styles.bankFieldValue}>
                              {selectedRider.bankAccount.bankName || 'HDFC Bank'}
                            </Text>
                          </View>
                          <View style={styles.bankFieldRow}>
                            <Text style={styles.bankFieldLabel}>Account Number:</Text>
                            <Text style={styles.bankFieldValueMono}>
                              {selectedRider.bankAccount.accountNumber || '•••• •••• 4920'}
                            </Text>
                          </View>
                          <View style={styles.bankFieldRow}>
                            <Text style={styles.bankFieldLabel}>IFSC Code:</Text>
                            <Text style={styles.bankFieldValueMono}>
                              {selectedRider.bankAccount.ifscCode || 'HDFC0001048'}
                            </Text>
                          </View>
                          <View style={styles.bankFieldRow}>
                            <Text style={styles.bankFieldLabel}>Beneficiary Name:</Text>
                            <Text style={styles.bankFieldValue}>
                              {selectedRider.bankAccount.accountHolderName || selectedRider.name}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.noBankCard}>
                          <AlertCircle size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                          <Text style={styles.noBankText}>No specific bank account document linked yet.</Text>
                        </View>
                      )}
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity
                      style={styles.editActionBtn}
                      onPress={() => setIsEditingRider(true)}
                      activeOpacity={0.85}
                    >
                      <Edit3 size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                      <Text style={styles.editActionBtnText}>Edit Partner Details</Text>
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
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 80,
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
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 6,
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
    marginVertical: 2,
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
  },
  rightCol: {
    alignItems: 'flex-end',
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
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 17,
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
  },
  partnerCodeTextHeader: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
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
});
