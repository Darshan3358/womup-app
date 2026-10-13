import React, { useState } from 'react';
import {
  Users,
  Search,
  MapPin,
  Navigation,
  Warehouse,
  Bike,
  Package,
  Star,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Edit2,
  RefreshCw,
  Power,
  X,
  Coins,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Check,
  PackageCheck,
  Eye,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Customer, DeliveryPartnerItem } from '../types/admin';

export const StaffPage: React.FC = () => {
  const {
    customers,
    riders,
    stores,
    cities,
    areas,
    orders,
    updateCustomer,
    updateRider,
    toggleCustomerBlock,
    adjustCoins,
    refreshData,
  } = useAdmin();

  // Role Tabs: Customers vs Riders
  const [activeTab, setActiveTab] = useState<'Customers' | 'Riders'>('Customers');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [riderDutyFilter, setRiderDutyFilter] = useState<'All' | 'On Duty' | 'Off Duty'>('All');

  // Selected rider for orders inspection modal
  const [selectedRiderForOrders, setSelectedRiderForOrders] = useState<DeliveryPartnerItem | null>(null);

  // Cascading Filters
  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // ---------------------------------------------------------------------------
  // Customer Edit Modal State
  // ---------------------------------------------------------------------------
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustZone, setEditCustZone] = useState('');
  const [editCustStatus, setEditCustStatus] = useState<'Active' | 'Blocked'>('Active');
  const [isSubmittingCustEdit, setIsSubmittingCustEdit] = useState(false);

  // ---------------------------------------------------------------------------
  // Rider Edit Modal State
  // ---------------------------------------------------------------------------
  const [riderToEdit, setRiderToEdit] = useState<DeliveryPartnerItem | null>(null);
  const [editRiderName, setEditRiderName] = useState('');
  const [editRiderPhone, setEditRiderPhone] = useState('');
  const [editRiderVehicleType, setEditRiderVehicleType] = useState('BIKE');
  const [editRiderVehicleNumber, setEditRiderVehicleNumber] = useState('');
  const [editRiderHubId, setEditRiderHubId] = useState('');
  const [editRiderCity, setEditRiderCity] = useState('');
  const [editRiderStatus, setEditRiderStatus] = useState<'APPROVED' | 'PENDING' | 'SUSPENDED' | 'REJECTED'>('APPROVED');
  const [editRiderIsOnline, setEditRiderIsOnline] = useState(true);
  const [isSubmittingRiderEdit, setIsSubmittingRiderEdit] = useState(false);

  // ---------------------------------------------------------------------------
  // Coins Modal State
  // ---------------------------------------------------------------------------
  const [userForCoins, setUserForCoins] = useState<Customer | null>(null);
  const [coinAmount, setCoinAmount] = useState('50');
  const [coinType, setCoinType] = useState<'Credit' | 'Debit'>('Credit');
  const [coinReason, setCoinReason] = useState('Admin loyalty reward');
  const [isSubmittingCoins, setIsSubmittingCoins] = useState(false);

  // ---------------------------------------------------------------------------
  // Quick Hub Reassign Modal State (for Riders)
  // ---------------------------------------------------------------------------
  const [riderToReassign, setRiderToReassign] = useState<DeliveryPartnerItem | null>(null);
  const [targetStoreId, setTargetStoreId] = useState<string>('');
  const [targetDutyStatus, setTargetDutyStatus] = useState<boolean>(true);
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  // Cascading area options
  const availableAreas = areas.filter((a) => {
    if (selectedCityId === 'ALL') return true;
    const city = cities.find((c) => c.id === selectedCityId || c._id === selectedCityId || c.name === selectedCityId);
    if (!city) return true;
    return a.cityName?.toLowerCase() === city.name.toLowerCase() || a.cityId === city.id;
  });

  // ---------------------------------------------------------------------------
  // Filter Customers
  // ---------------------------------------------------------------------------
  const filteredCustomers = customers.filter((c) => {
    // Status filter
    if (customerStatusFilter === 'Active' && c.status === 'Blocked') return false;
    if (customerStatusFilter === 'Blocked' && c.status !== 'Blocked') return false;

    // Search query
    const q = search.toLowerCase();
    const matchSearch =
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.zoneName && c.zoneName.toLowerCase().includes(q));

    if (!matchSearch) return false;

    // City & Area filter
    if (selectedCityId !== 'ALL') {
      const city = cities.find((ct) => ct.id === selectedCityId || ct._id === selectedCityId || ct.name === selectedCityId);
      if (city) {
        const matchesCity = (c.address && c.address.toLowerCase().includes(city.name.toLowerCase())) ||
          (c.zoneName && c.zoneName.toLowerCase().includes(city.name.toLowerCase()));
        if (!matchesCity && city.name.toLowerCase() !== 'ahmedabad') return false;
      }
    }

    if (selectedAreaId !== 'ALL') {
      const area = areas.find((a) => a.id === selectedAreaId || a._id === selectedAreaId || a.name === selectedAreaId);
      if (area) {
        const matchesArea = (c.address && c.address.toLowerCase().includes(area.name.toLowerCase())) ||
          (c.zoneName && c.zoneName.toLowerCase().includes(area.name.toLowerCase()));
        if (!matchesArea) return false;
      }
    }

    return true;
  });

  // ---------------------------------------------------------------------------
  // Filter Riders
  // ---------------------------------------------------------------------------
  const filteredRiders = riders.filter((r) => {
    // Duty filter
    if (riderDutyFilter === 'On Duty' && !r.isOnline) return false;
    if (riderDutyFilter === 'Off Duty' && r.isOnline) return false;

    // Search query
    const q = search.toLowerCase();
    const matchSearch =
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.partnerCode && r.partnerCode.toLowerCase().includes(q)) ||
      (r.hubName && r.hubName.toLowerCase().includes(q)) ||
      (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(q));

    if (!matchSearch) return false;

    // City filter
    if (selectedCityId !== 'ALL') {
      const city = cities.find((c) => c.id === selectedCityId || c._id === selectedCityId || c.name === selectedCityId);
      if (city && (r.city || 'Ahmedabad').toLowerCase() !== city.name.toLowerCase()) return false;
    }

    // Area filter
    if (selectedAreaId !== 'ALL') {
      const area = areas.find((a) => a.id === selectedAreaId || a._id === selectedAreaId || a.name === selectedAreaId);
      if (area && r.hubName && !r.hubName.toLowerCase().includes(area.name.toLowerCase())) return false;
    }

    return true;
  });

  // ---------------------------------------------------------------------------
  // Modal Open Handlers
  // ---------------------------------------------------------------------------
  const openEditCustomerModal = (c: Customer) => {
    setCustomerToEdit(c);
    setEditCustName(c.name || '');
    setEditCustPhone(c.phone || '');
    setEditCustEmail(c.email || '');
    setEditCustAddress(c.address || '');
    setEditCustZone(c.zoneName || 'Chandlodiya - Tragad');
    setEditCustStatus(c.status === 'Blocked' ? 'Blocked' : 'Active');
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit) return;
    if (!editCustName.trim() || !editCustPhone.trim()) {
      alert('Name and Phone are required.');
      return;
    }

    setIsSubmittingCustEdit(true);
    await updateCustomer(customerToEdit.id || customerToEdit._id || '', {
      name: editCustName.trim(),
      phone: editCustPhone.trim(),
      email: editCustEmail.trim(),
      address: editCustAddress.trim(),
      zoneName: editCustZone.trim(),
      status: editCustStatus,
    });
    setIsSubmittingCustEdit(false);
    setCustomerToEdit(null);
  };

  const openEditRiderModal = (r: DeliveryPartnerItem) => {
    setRiderToEdit(r);
    setEditRiderName(r.name || '');
    setEditRiderPhone(r.phone || '');
    setEditRiderVehicleType(r.vehicleType || 'BIKE');
    setEditRiderVehicleNumber(r.vehicleNumber || '');
    setEditRiderHubId(r.hubId || stores[0]?.id || stores[0]?._id || '');
    setEditRiderCity(r.city || 'Ahmedabad');
    setEditRiderStatus(r.status || 'APPROVED');
    setEditRiderIsOnline(r.isOnline !== false);
  };

  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderToEdit) return;
    if (!editRiderName.trim() || !editRiderPhone.trim()) {
      alert('Rider Name and Phone are required.');
      return;
    }

    setIsSubmittingRiderEdit(true);
    const chosenStore = stores.find((st) => (st.id || st._id) === editRiderHubId);

    await updateRider(riderToEdit.id || riderToEdit._id || '', {
      fullName: editRiderName.trim(),
      name: editRiderName.trim(),
      phoneNumber: editRiderPhone.trim(),
      phone: editRiderPhone.trim(),
      vehicleType: editRiderVehicleType,
      vehicleNumber: editRiderVehicleNumber.trim(),
      hubId: editRiderHubId,
      hubName: chosenStore?.name || riderToEdit.hubName,
      city: editRiderCity,
      status: editRiderStatus,
      isOnline: editRiderIsOnline,
    });
    setIsSubmittingRiderEdit(false);
    setRiderToEdit(null);
  };

  const handleAdjustCoinsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForCoins) return;
    const num = parseInt(coinAmount, 10);
    if (isNaN(num) || num <= 0) return;

    setIsSubmittingCoins(true);
    await adjustCoins({
      userId: userForCoins.id || userForCoins._id || '',
      amount: num,
      type: coinType,
      reason: coinReason,
    });
    setIsSubmittingCoins(false);
    setUserForCoins(null);
  };

  const openReassignModal = (r: DeliveryPartnerItem) => {
    setRiderToReassign(r);
    setTargetStoreId(r.hubId || stores[0]?.id || stores[0]?._id || '');
    setTargetDutyStatus(r.isOnline !== false);
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderToReassign) return;
    setIsSubmittingReassign(true);
    const chosenStore = stores.find((st) => (st.id || st._id) === targetStoreId);

    await updateRider(riderToReassign.id || riderToReassign._id || '', {
      hubId: targetStoreId,
      hubName: chosenStore?.name || riderToReassign.hubName,
      isOnline: targetDutyStatus,
    });

    setIsSubmittingReassign(false);
    setRiderToReassign(null);
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
            Customers & Fleet Operations
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Manage registered customers, account details, and delivery fleet riders
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={13} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Navigation Tabs: All Customers vs Express Fleet Riders */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          background: '#F1F5F9',
          padding: '4px',
          borderRadius: '12px',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => {
            setActiveTab('Customers');
            setSearch('');
          }}
          style={{
            padding: '8px 22px',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'Customers' ? '#071B52' : 'transparent',
            color: activeTab === 'Customers' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} />
          <span>All Customers ({customers.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('Riders');
            setSearch('');
          }}
          style={{
            padding: '8px 22px',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'Riders' ? '#071B52' : 'transparent',
            color: activeTab === 'Riders' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Bike size={16} />
          <span>Express Fleet Riders ({riders.length})</span>
        </button>
      </div>

      {/* Cascading Filter Bar */}
      <div
        className="admin-card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search
              size={15}
              color="#94A3B8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder={
                activeTab === 'Customers'
                  ? 'Search customer by name, phone, email, address, zone...'
                  : 'Search rider by name, phone, partner code, hub, vehicle...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
            />
          </div>

          {/* City Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#4F46E5" />
            <select
              value={selectedCityId}
              onChange={(e) => {
                setSelectedCityId(e.target.value);
                setSelectedAreaId('ALL');
              }}
              className="form-select"
              style={{ width: '160px', fontSize: '0.82rem' }}
            >
              <option value="ALL">City: All ({cities.length})</option>
              {cities.map((c) => (
                <option key={c.id || c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Navigation size={14} color="#0D9488" />
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="form-select"
              style={{ width: '180px', fontSize: '0.82rem' }}
            >
              <option value="ALL">Area: All ({availableAreas.length})</option>
              {availableAreas.map((a) => (
                <option key={a.id || a._id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            {activeTab === 'Customers' ? 'Customer Status:' : 'Duty Status:'}
          </span>

          {activeTab === 'Customers' ? (
            (['All', 'Active', 'Blocked'] as const).map((st) => {
              const isSelected = customerStatusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setCustomerStatusFilter(st)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '16px',
                    border: isSelected ? '1px solid #071B52' : '1px solid #E2E8F0',
                    background: isSelected ? '#071B52' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              );
            })
          ) : (
            (['All', 'On Duty', 'Off Duty'] as const).map((d) => {
              const isSelected = riderDutyFilter === d;
              return (
                <button
                  key={d}
                  onClick={() => setRiderDutyFilter(d)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '16px',
                    border: isSelected ? '1px solid #071B52' : '1px solid #E2E8F0',
                    background: isSelected ? '#071B52' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {d}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CUSTOMERS TABLE VIEW                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'Customers' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>Delivery Address & Zone</th>
                <th>Wallet & Coins</th>
                <th>Orders & Spend</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No customers match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isBlocked = cust.status === 'Blocked';
                  return (
                    <tr key={cust.id || cust._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              border: '1px solid #DBEAFE',
                            }}
                          >
                            {(cust.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#071B52', display: 'block' }}>
                              {cust.name || 'WormUp User'}
                            </strong>
                            <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
                              {cust.type || 'Individual Customer'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#071B52', fontSize: '0.82rem' }}>
                            {cust.phone || '—'}
                          </span>
                          {cust.email && (
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {cust.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} color="#FF3B98" />
                          <div>
                            <strong style={{ fontSize: '0.82rem', color: '#071B52', display: 'block' }}>
                              {cust.zoneName || 'Chandlodiya - Tragad'}
                            </strong>
                            <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
                              {cust.address || 'Ahmedabad, Gujarat'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '0.82rem' }}>
                            🪙 {cust.shoppingCoinBalance ?? (cust as any).shoppingCoins ?? 50} Coins
                          </span>
                          <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.75rem' }}>
                            ₹{cust.walletBalance || 0} Cash
                          </span>
                        </div>
                      </td>

                      <td>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#071B52', display: 'block' }}>
                            {cust.totalOrders || 0} Orders
                          </strong>
                          <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
                            ₹{cust.spend || (cust as any).totalSpend || 0} Spent
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${isBlocked ? 'badge-rose' : 'badge-emerald'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isBlocked ? '#E11D48' : '#10B981',
                            }}
                          />
                          <span>{isBlocked ? 'BLOCKED' : 'ACTIVE'}</span>
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => openEditCustomerModal(cust)}
                            className="btn btn-primary btn-sm"
                            style={{ background: '#071B52', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Customer Details"
                          >
                            <Edit2 size={12} />
                            <span>Edit Customer</span>
                          </button>

                          <button
                            onClick={() => {
                              setUserForCoins(cust);
                              setCoinAmount('50');
                              setCoinType('Credit');
                              setCoinReason('Admin loyalty reward');
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Adjust Loyalty Coins"
                            style={{ color: '#D97706', borderColor: '#FDE68A' }}
                          >
                            <Coins size={12} />
                            <span>Coins</span>
                          </button>

                          <button
                            onClick={() => toggleCustomerBlock(cust.id || cust._id || '', !isBlocked)}
                            className="btn btn-secondary btn-sm"
                            title={isBlocked ? 'Unblock Customer' : 'Block Customer'}
                            style={{ color: isBlocked ? '#10B981' : '#E11D48' }}
                          >
                            {isBlocked ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
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
      )}

      {/* ========================================================================= */}
      {/* 2. RIDERS TABLE VIEW                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'Riders' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rider Member</th>
                <th>Rider Code</th>
                <th>Contact Phone</th>
                <th>Assigned Dark Store Hub</th>
                <th>Vehicle & City</th>
                <th>Shift & Status</th>
                <th style={{ minWidth: '175px' }}>Orders Completed</th>
                <th>Rating</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No delivery riders match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRiders.map((rider) => {
                  const pId = (rider.id || rider._id)?.toString();
                  const riderOrders = (orders || []).filter((o) => {
                    const oPartnerId = (typeof (o as any).deliveryPartnerId === 'object' ? (o as any).deliveryPartnerId?._id : (o as any).deliveryPartnerId)?.toString();
                    const oRiderId = (typeof (o as any).riderId === 'object' ? (o as any).riderId?._id : (o as any).riderId)?.toString();
                    return (
                      (pId && (oPartnerId === pId || oRiderId === pId)) ||
                      (rider.partnerCode && ((o as any).deliveryPartnerCode === rider.partnerCode || (o as any).riderCode === rider.partnerCode))
                    );
                  });

                  const deliveredCount = riderOrders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
                  const activeCount = riderOrders.filter((o) => ['OUT_FOR_DELIVERY', 'PICKED_UP', 'REACHED_STORE', 'ASSIGNED'].includes(o.status)).length;

                  const totalCompleted = Math.max(deliveredCount, rider.completedDeliveries ?? rider.totalDeliveries ?? 0);
                  const inTransitCount = Math.max(activeCount, rider.activeDeliveries ?? 0);

                  return (
                    <tr key={rider.id || rider._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: '#FFF0F7',
                              color: '#FF3B98',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              border: '1px solid #FCE7F3',
                            }}
                          >
                            <Bike size={18} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#071B52', display: 'block' }}>
                              {rider.name}
                            </strong>
                            <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
                              Express Delivery Partner
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            color: '#FF3B98',
                            fontSize: '0.80rem',
                          }}
                        >
                          {rider.partnerCode || 'RDR-001'}
                        </span>
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#071B52' }}>
                        {rider.phone}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Warehouse size={13} color="#4F46E5" />
                          <strong style={{ fontSize: '0.82rem', color: '#071B52' }}>
                            {rider.hubName || 'Central Dark Store'}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#071B52', display: 'block' }}>
                            {rider.vehicleType || 'BIKE'} ({rider.vehicleNumber || 'GJ-01-AB-1234'})
                          </strong>
                          <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
                            {rider.city || 'Ahmedabad'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span
                            className={`badge ${rider.isOnline ? 'badge-emerald' : 'badge-navy'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: rider.isOnline ? '#10B981' : '#94A3B8',
                              }}
                            />
                            <span>{rider.isOnline ? 'ON DUTY' : 'OFF DUTY'}</span>
                          </span>

                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: rider.status === 'APPROVED' ? '#10B981' : '#F59E0B' }}>
                            {rider.status || 'APPROVED'}
                          </span>
                        </div>
                      </td>

                      {/* COMPLETED ORDERS METRIC COLUMN */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 11px',
                              borderRadius: '8px',
                              backgroundColor: totalCompleted > 0 ? '#ECFDF5' : '#F8FAFC',
                              border: `1.5px solid ${totalCompleted > 0 ? '#A7F3D0' : '#E2E8F0'}`,
                              color: totalCompleted > 0 ? '#065F46' : '#64748B',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              width: 'fit-content',
                              boxShadow: totalCompleted > 0 ? '0 1px 2px rgba(16, 185, 129, 0.12)' : 'none',
                            }}
                          >
                            <PackageCheck size={16} color={totalCompleted > 0 ? '#059669' : '#94A3B8'} />
                            <span>
                              {totalCompleted} {totalCompleted === 1 ? 'Order' : 'Orders'} Completed
                            </span>
                          </div>

                          {inTransitCount > 0 ? (
                            <span
                              style={{
                                fontSize: '0.70rem',
                                color: '#D97706',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Clock size={11} /> {inTransitCount} in transit right now
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                              {totalCompleted > 0 ? 'All assigned orders fulfilled' : 'No deliveries assigned yet'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* RATING COLUMN */}
                      <td>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            width: 'fit-content',
                          }}
                        >
                          <Star size={13} color="#F59E0B" fill="#F59E0B" />
                          <strong style={{ fontSize: '0.84rem', color: '#B45309' }}>
                            {(rider.rating || 5.0).toFixed(1)}
                          </strong>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedRiderForOrders(rider)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                            title="View Orders Delivered by this Rider"
                          >
                            <Eye size={12} />
                            <span>Orders ({totalCompleted})</span>
                          </button>

                          <button
                            onClick={() => openEditRiderModal(rider)}
                            className="btn btn-primary btn-sm"
                            style={{ background: '#071B52', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Rider Details"
                          >
                            <Edit2 size={12} />
                            <span>Edit Rider</span>
                          </button>

                          <button
                            onClick={() => openReassignModal(rider)}
                            className="btn btn-secondary btn-sm"
                            title="Reassign Store Hub"
                          >
                            <span>Reassign</span>
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
      )}

      {/* ========================================================================= */}
      {/* EDIT CUSTOMER MODAL                                                       */}
      {/* ========================================================================= */}
      {customerToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#071B52" />
                <h4 style={{ margin: 0, color: '#071B52', fontWeight: 800 }}>Edit Customer Profile</h4>
              </div>
              <button
                onClick={() => setCustomerToEdit(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editCustName}
                    onChange={(e) => setEditCustName(e.target.value)}
                    className="form-input"
                    placeholder="Enter full name"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editCustPhone}
                      onChange={(e) => setEditCustPhone(e.target.value)}
                      className="form-input"
                      placeholder="+91..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={editCustEmail}
                      onChange={(e) => setEditCustEmail(e.target.value)}
                      className="form-input"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Street Address</label>
                  <textarea
                    rows={2}
                    value={editCustAddress}
                    onChange={(e) => setEditCustAddress(e.target.value)}
                    className="form-input"
                    placeholder="House / Flat, Street, Landmark"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Area / Zone</label>
                    <input
                      type="text"
                      value={editCustZone}
                      onChange={(e) => setEditCustZone(e.target.value)}
                      className="form-input"
                      placeholder="e.g. Chandlodiya - Tragad"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <select
                      value={editCustStatus}
                      onChange={(e) => setEditCustStatus(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="Active">Active (Permitted)</option>
                      <option value="Blocked">Blocked (Restricted)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setCustomerToEdit(null)}
                  className="btn btn-secondary"
                  disabled={isSubmittingCustEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={isSubmittingCustEdit}
                  style={{ background: '#071B52', borderColor: '#071B52', color: '#fff' }}
                >
                  {isSubmittingCustEdit ? 'Saving...' : 'Save Customer Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT RIDER MODAL                                                          */}
      {/* ========================================================================= */}
      {riderToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bike size={20} color="#FF3B98" />
                <h4 style={{ margin: 0, color: '#071B52', fontWeight: 800 }}>Edit Delivery Rider</h4>
              </div>
              <button
                onClick={() => setRiderToEdit(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRider}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Rider Performance Stats Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Orders Completed</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
                      {riderToEdit.completedDeliveries ?? riderToEdit.totalDeliveries ?? 0}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #CBD5E1', borderRight: '1px solid #CBD5E1' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>In Transit</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
                      {riderToEdit.activeDeliveries || 0}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Rating</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#B45309', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" />
                      {(riderToEdit.rating || 5.0).toFixed(1)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Rider Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editRiderName}
                      onChange={(e) => setEditRiderName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editRiderPhone}
                      onChange={(e) => setEditRiderPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type</label>
                    <select
                      value={editRiderVehicleType}
                      onChange={(e) => setEditRiderVehicleType(e.target.value)}
                      className="form-select"
                    >
                      <option value="BIKE">Motorcycle / Bike</option>
                      <option value="EV_SCOOTER">Electric Scooter (EV)</option>
                      <option value="SCOOTER">Petrol Scooter</option>
                      <option value="BICYCLE">Bicycle</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle Registration No.</label>
                    <input
                      type="text"
                      value={editRiderVehicleNumber}
                      onChange={(e) => setEditRiderVehicleNumber(e.target.value)}
                      className="form-input"
                      placeholder="GJ-01-AB-1234"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Dark Store Hub *</label>
                  <select
                    value={editRiderHubId}
                    onChange={(e) => setEditRiderHubId(e.target.value)}
                    className="form-select"
                  >
                    {stores.map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.name} ({s.code}) - {s.cityName || s.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Operational City</label>
                    <select
                      value={editRiderCity}
                      onChange={(e) => setEditRiderCity(e.target.value)}
                      className="form-select"
                    >
                      {cities.map((c) => (
                        <option key={c.id || c._id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Verification Status</label>
                    <select
                      value={editRiderStatus}
                      onChange={(e) => setEditRiderStatus(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Shift Duty Status</label>
                  <select
                    value={editRiderIsOnline ? 'true' : 'false'}
                    onChange={(e) => setEditRiderIsOnline(e.target.value === 'true')}
                    className="form-select"
                  >
                    <option value="true">ON DUTY (Active for fulfillment & dispatch)</option>
                    <option value="false">OFF DUTY (Shift completed)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setRiderToEdit(null)}
                  className="btn btn-secondary"
                  disabled={isSubmittingRiderEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={isSubmittingRiderEdit}
                  style={{ background: '#FF3B98', borderColor: '#FF3B98', color: '#fff' }}
                >
                  {isSubmittingRiderEdit ? 'Saving...' : 'Save Rider Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADJUST COINS MODAL                                                        */}
      {/* ========================================================================= */}
      {userForCoins && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} color="#F59E0B" />
                <h4 style={{ margin: 0, color: '#071B52', fontWeight: 800 }}>Adjust Shopping Coins</h4>
              </div>
              <button
                onClick={() => setUserForCoins(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustCoinsSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
                  Adjusting coins balance for <strong>{userForCoins.name}</strong> ({userForCoins.phone}).
                </p>

                <div className="form-group">
                  <label className="form-label">Action Type</label>
                  <select
                    value={coinType}
                    onChange={(e) => setCoinType(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="Credit">Credit (+) Add Coins to Wallet</option>
                    <option value="Debit">Debit (-) Deduct Coins from Wallet</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Coin Amount *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <input
                    type="text"
                    value={coinReason}
                    onChange={(e) => setCoinReason(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Order compensation, Loyalty reward"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setUserForCoins(null)}
                  className="btn btn-secondary"
                  disabled={isSubmittingCoins}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={isSubmittingCoins}
                  style={{ background: '#F59E0B', borderColor: '#F59E0B', color: '#fff' }}
                >
                  {isSubmittingCoins ? 'Processing...' : 'Apply Coin Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK REASSIGN STORE HUB MODAL                                            */}
      {/* ========================================================================= */}
      {riderToReassign && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Warehouse size={20} color="#4F46E5" />
                <h4 style={{ margin: 0, color: '#071B52' }}>Reassign Store Hub</h4>
              </div>
              <button
                onClick={() => setRiderToReassign(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
                  Reassigning rider <strong>{riderToReassign.name}</strong> ({riderToReassign.partnerCode}) to a different dark store warehouse.
                </p>

                <div className="form-group">
                  <label className="form-label">Target Dark Store Hub *</label>
                  <select
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value)}
                    className="form-select"
                  >
                    {stores.map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.name} ({s.code}) - {s.cityName || s.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Shift Duty Status</label>
                  <select
                    value={targetDutyStatus ? 'true' : 'false'}
                    onChange={(e) => setTargetDutyStatus(e.target.value === 'true')}
                    className="form-select"
                  >
                    <option value="true">ON DUTY (Active for dispatch)</option>
                    <option value="false">OFF DUTY (Shift ended)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setRiderToReassign(null)}
                  className="btn btn-secondary"
                  disabled={isSubmittingReassign}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={isSubmittingReassign}
                >
                  {isSubmittingReassign ? 'Updating...' : 'Commit Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VIEW ORDERS DELIVERED BY RIDER MODAL                                  */}
      {/* ========================================================================= */}
      {selectedRiderForOrders && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                  }}
                >
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#071B52', fontWeight: 800 }}>
                    Orders Delivered: {selectedRiderForOrders.name}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    Rider Code: <strong style={{ color: '#FF3B98' }}>{selectedRiderForOrders.partnerCode}</strong> • Hub: {selectedRiderForOrders.hubName || 'Store'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRiderForOrders(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <span style={{ fontSize: '0.70rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Completed
                  </span>
                  <h3 style={{ margin: '4px 0 0', color: '#14532D', fontSize: '1.4rem', fontWeight: 800 }}>
                    {selectedRiderForOrders.completedDeliveries ?? selectedRiderForOrders.totalDeliveries ?? 0}
                  </h3>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <span style={{ fontSize: '0.70rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>
                    Customer Rating
                  </span>
                  <h3 style={{ margin: '4px 0 0', color: '#78350F', fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={18} fill="#F59E0B" color="#F59E0B" />
                    {(selectedRiderForOrders.rating || 5.0).toFixed(1)}
                  </h3>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <span style={{ fontSize: '0.70rem', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase' }}>
                    Active In Transit
                  </span>
                  <h3 style={{ margin: '4px 0 0', color: '#1E3A8A', fontSize: '1.4rem', fontWeight: 800 }}>
                    {selectedRiderForOrders.activeDeliveries || 0}
                  </h3>
                </div>
              </div>

              {/* Order List */}
              <div style={{ marginTop: '4px' }}>
                <h5 style={{ margin: '0 0 10px', color: '#071B52', fontWeight: 700, fontSize: '0.88rem' }}>
                  Matched Live Order Details
                </h5>

                {(() => {
                  const pId = (selectedRiderForOrders.id || selectedRiderForOrders._id)?.toString();
                  const matchedOrders = (orders || []).filter((o) => {
                    const oPartnerId = (typeof (o as any).deliveryPartnerId === 'object' ? (o as any).deliveryPartnerId?._id : (o as any).deliveryPartnerId)?.toString();
                    const oRiderId = (typeof (o as any).riderId === 'object' ? (o as any).riderId?._id : (o as any).riderId)?.toString();
                    return (
                      (pId && (oPartnerId === pId || oRiderId === pId)) ||
                      (selectedRiderForOrders.partnerCode && ((o as any).deliveryPartnerCode === selectedRiderForOrders.partnerCode || (o as any).riderCode === selectedRiderForOrders.partnerCode))
                    );
                  });

                  if (matchedOrders.length === 0) {
                    return (
                      <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.82rem' }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#071B52' }}>
                          {selectedRiderForOrders.completedDeliveries ?? selectedRiderForOrders.totalDeliveries ?? 0} Completed Deliveries Logged
                        </p>
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                          Lifetime fulfillment recorded in rider profile. Real-time active orders display automatically when dispatch starts.
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {matchedOrders.map((o) => (
                        <div
                          key={o.id || o._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.84rem', color: '#071B52', fontFamily: 'var(--font-mono)' }}>
                              {o.orderNumber}
                            </strong>
                            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                              {o.customerName || 'Customer'} • ₹{o.finalAmount || o.totalAmount || 0}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: o.status === 'DELIVERED' ? '#ECFDF5' : '#FEF3C7',
                                color: o.status === 'DELIVERED' ? '#059669' : '#D97706',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                              }}
                            >
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setSelectedRiderForOrders(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
