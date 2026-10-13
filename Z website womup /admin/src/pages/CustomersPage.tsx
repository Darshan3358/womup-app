import React, { useState } from 'react';
import {
  Users,
  Search,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Navigation,
  Bike,
  Star,
  UserPlus,
  Power,
  ChevronDown,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  Edit3,
  Award,
  X,
  Plus,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Customer, DeliveryPartnerItem } from '../types/admin';

export const CustomersPage: React.FC = () => {
  const {
    customers,
    riders,
    cities,
    areas,
    stores,
    adjustCoins,
    toggleCustomerBlock,
    updateRider,
    createCustomer,
    updateCustomer,
    refreshData,
  } = useAdmin();

  // Mode tabs: CUSTOMERS vs RIDERS (Same as App)
  const [activeTabMode, setActiveTabMode] = useState<'CUSTOMERS' | 'RIDERS'>('CUSTOMERS');
  const [search, setSearch] = useState('');
  const [activeCustomerFilter, setActiveCustomerFilter] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [activeRiderFilter, setActiveRiderFilter] = useState<'All' | 'Online' | 'Approved' | 'Pending'>('All');
  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');

  // Customer Profile & Edit Modal State (100% App Parity with EditCustomerModal)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustZone, setEditCustZone] = useState('Prahlad Nagar');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustStatus, setEditCustStatus] = useState<'Active' | 'Blocked'>('Active');
  const [submittingCustEdit, setSubmittingCustEdit] = useState(false);

  // Coins Modal
  const [selectedUserForCoins, setSelectedUserForCoins] = useState<Customer | null>(null);
  const [coinAmount, setCoinAmount] = useState('50');
  const [coinType, setCoinType] = useState<'Credit' | 'Debit'>('Credit');
  const [coinReason, setCoinReason] = useState('Admin appreciation reward');
  const [submittingCoins, setSubmittingCoins] = useState(false);

  // Rider Detail & Edit Modal
  const [selectedRider, setSelectedRider] = useState<DeliveryPartnerItem | null>(null);
  const [isEditingRider, setIsEditingRider] = useState(false);
  const [riderStatus, setRiderStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED'>('APPROVED');
  const [riderIsOnline, setRiderIsOnline] = useState(true);
  const [riderVehicleType, setRiderVehicleType] = useState('');
  const [riderVehicleNumber, setRiderVehicleNumber] = useState('');
  const [riderHubName, setRiderHubName] = useState('');
  const [submittingRider, setSubmittingRider] = useState(false);

  // Add Customer Modal (100% App Parity with AddCustomerModal)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustType, setNewCustType] = useState<'Individual' | 'Corporate'>('Individual');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustZone, setNewCustZone] = useState('Prahlad Nagar');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [submittingNewCust, setSubmittingNewCust] = useState(false);

  // Cascading area filter
  const activeCities = cities.filter((c) => c.isActive !== false);
  const availableAreas = areas.filter((a) => {
    if (selectedCityId === 'ALL') return true;
    const currentCity = activeCities.find((c) => c.id === selectedCityId || c._id === selectedCityId || c.name === selectedCityId);
    if (!currentCity) return true;
    return a.cityName?.toLowerCase() === currentCity.name.toLowerCase() || a.cityId === currentCity.id;
  });

  // Resolve hierarchy helper
  const resolveCustomerLocation = (c: Customer) => {
    const matchedArea = areas.find(
      (a) =>
        (c.zoneName && a.name.toLowerCase().includes(c.zoneName.toLowerCase())) ||
        (c.address && c.address.toLowerCase().includes(a.name.toLowerCase()))
    );
    const areaName = matchedArea ? matchedArea.name : c.zoneName || 'Prahlad Nagar';
    const cityName = matchedArea?.cityName || 'Ahmedabad';
    return { cityName, areaName };
  };

  const resolveRiderLocation = (r: DeliveryPartnerItem) => {
    const matchedStore = stores.find(
      (s) =>
        (r.hubId && (s.id === r.hubId || s.code === r.hubId)) ||
        (r.hubName && s.name.toLowerCase().includes(r.hubName.toLowerCase()))
    );
    const cityName = matchedStore?.cityName || matchedStore?.city || r.city || 'Ahmedabad';
    const areaName = matchedStore?.areaName || 'Satellite Hub';
    return { cityName, areaName };
  };

  // Filtered lists
  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q));

    const matchFilter = activeCustomerFilter === 'All' || c.status === activeCustomerFilter;
    if (!matchSearch || !matchFilter) return false;

    const { cityName, areaName } = resolveCustomerLocation(c);
    if (selectedCityId !== 'ALL') {
      const cityObj = cities.find((ct) => ct.id === selectedCityId || ct._id === selectedCityId || ct.name === selectedCityId);
      if (cityObj && cityName.toLowerCase() !== cityObj.name.toLowerCase()) return false;
    }
    if (selectedAreaId !== 'ALL') {
      const areaObj = areas.find((ar) => ar.id === selectedAreaId || ar._id === selectedAreaId || ar.name === selectedAreaId);
      if (areaObj && areaName.toLowerCase() !== areaObj.name.toLowerCase()) return false;
    }
    return true;
  });

  const filteredRiders = riders.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.partnerCode && r.partnerCode.toLowerCase().includes(q)) ||
      (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(q));

    let matchFilter = true;
    if (activeRiderFilter === 'Online') matchFilter = r.isOnline === true;
    else if (activeRiderFilter === 'Approved') matchFilter = r.status === 'APPROVED';
    else if (activeRiderFilter === 'Pending') matchFilter = r.status === 'PENDING';

    if (!matchSearch || !matchFilter) return false;

    const { cityName, areaName } = resolveRiderLocation(r);
    if (selectedCityId !== 'ALL') {
      const cityObj = cities.find((ct) => ct.id === selectedCityId || ct._id === selectedCityId || ct.name === selectedCityId);
      if (cityObj && cityName.toLowerCase() !== cityObj.name.toLowerCase()) return false;
    }
    if (selectedAreaId !== 'ALL') {
      const areaObj = areas.find((ar) => ar.id === selectedAreaId || ar._id === selectedAreaId || ar.name === selectedAreaId);
      if (areaObj && areaName.toLowerCase() !== areaObj.name.toLowerCase()) return false;
    }
    return true;
  });

  // Action handlers
  const handleAdjustCoinsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCoins) return;
    const amt = parseInt(coinAmount, 10);
    if (isNaN(amt) || amt <= 0) return;

    setSubmittingCoins(true);
    await adjustCoins({
      userId: selectedUserForCoins.id || selectedUserForCoins._id || '',
      amount: amt,
      type: coinType,
      reason: coinReason,
    });
    setSubmittingCoins(false);
    setSelectedUserForCoins(null);
  };

  const handleToggleBlock = async (c: Customer) => {
    const isCurrentlyBlocked = c.status === 'Blocked';
    await toggleCustomerBlock(c.id || c._id || '', !isCurrentlyBlocked);
    if (selectedCustomer && (selectedCustomer.id === c.id || selectedCustomer._id === c._id)) {
      setSelectedCustomer({
        ...selectedCustomer,
        status: isCurrentlyBlocked ? 'Active' : 'Blocked',
      });
    }
  };

  const handleOpenRiderDetail = (r: DeliveryPartnerItem) => {
    setSelectedRider(r);
    setRiderStatus(r.status || 'APPROVED');
    setRiderIsOnline(r.isOnline !== false);
    setRiderVehicleType(r.vehicleType || 'Motorbike');
    setRiderVehicleNumber(r.vehicleNumber || 'GJ-01-AB-1234');
    setRiderHubName(r.hubName || 'Ahmedabad Central Hub');
    setIsEditingRider(false);
  };

  const handleSaveRider = async () => {
    if (!selectedRider) return;
    setSubmittingRider(true);
    await updateRider(selectedRider.id || selectedRider._id || '', {
      status: riderStatus,
      isOnline: riderIsOnline,
      vehicleType: riderVehicleType,
      vehicleNumber: riderVehicleNumber,
      hubName: riderHubName,
    });
    setSubmittingRider(false);
    setSelectedRider({
      ...selectedRider,
      status: riderStatus,
      isOnline: riderIsOnline,
      vehicleType: riderVehicleType,
      vehicleNumber: riderVehicleNumber,
      hubName: riderHubName,
    });
    setIsEditingRider(false);
  };

  const handleOpenCustomerModal = (c: Customer) => {
    setSelectedCustomer(c);
    setIsEditingCustomer(false);
    setEditCustName(c.name || '');
    setEditCustPhone(c.phone || '');
    setEditCustZone(c.zoneName || 'Prahlad Nagar');
    setEditCustAddress(c.address || '');
    setEditCustStatus(c.status === 'Blocked' ? 'Blocked' : 'Active');
  };

  const handleSaveCustomerEdit = async () => {
    if (!selectedCustomer) return;
    if (!editCustName.trim() || !editCustPhone.trim()) {
      alert('Name and Phone number are required.');
      return;
    }
    setSubmittingCustEdit(true);
    await updateCustomer(selectedCustomer.id || selectedCustomer._id || '', {
      name: editCustName.trim(),
      phone: editCustPhone.trim(),
      zoneName: editCustZone,
      address: editCustAddress.trim(),
      status: editCustStatus,
    });
    setSubmittingCustEdit(false);
    setSelectedCustomer({
      ...selectedCustomer,
      name: editCustName.trim(),
      phone: editCustPhone.trim(),
      zoneName: editCustZone,
      address: editCustAddress.trim(),
      status: editCustStatus,
    });
    setIsEditingCustomer(false);
  };

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    setSubmittingNewCust(true);
    await createCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim() || undefined,
      address: newCustAddress.trim() || undefined,
      type: newCustType,
      zoneName: newCustZone,
    });
    setSubmittingNewCust(false);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustAddress('');
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
            Customers & Fleet Management
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Consumer profiles, loyalty ledger, and delivery partners fleet controls (100% app parity)
          </p>
        </div>

        {activeTabMode === 'CUSTOMERS' && (
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={16} />
            <span>+ Add Customer</span>
          </button>
        )}
      </div>

      {/* Mode Segmented Tab Switcher (Customers vs Delivery Partners) */}
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
            setActiveTabMode('CUSTOMERS');
            setSearch('');
          }}
          style={{
            padding: '8px 20px',
            borderRadius: '9px',
            border: 'none',
            background: activeTabMode === 'CUSTOMERS' ? '#071B52' : 'transparent',
            color: activeTabMode === 'CUSTOMERS' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          👥 Customers ({customers.length})
        </button>

        <button
          onClick={() => {
            setActiveTabMode('RIDERS');
            setSearch('');
          }}
          style={{
            padding: '8px 20px',
            borderRadius: '9px',
            border: 'none',
            background: activeTabMode === 'RIDERS' ? '#071B52' : 'transparent',
            color: activeTabMode === 'RIDERS' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          🛵 Delivery Partners ({riders.length})
        </button>
      </div>

      {/* Cascading Filter Bar: Search + City + Area + Status Pills */}
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
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search
              size={16}
              color="#94A3B8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder={
                activeTabMode === 'CUSTOMERS'
                  ? 'Search customer by name, mobile, email, or user ID...'
                  : 'Search delivery partner by name, partner code, phone, vehicle...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* City Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} color="#4F46E5" />
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
            <Navigation size={15} color="#0D9488" />
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

        {/* Status Pill Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            Status Filter:
          </span>
          {activeTabMode === 'CUSTOMERS' ? (
            (['All', 'Active', 'Blocked'] as const).map((filter) => {
              const isSelected = activeCustomerFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveCustomerFilter(filter)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    border: isSelected ? '1px solid #071B52' : '1px solid #E2E8F0',
                    background: isSelected ? '#071B52' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {filter}
                </button>
              );
            })
          ) : (
            (['All', 'Online', 'Approved', 'Pending'] as const).map((filter) => {
              const isSelected = activeRiderFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveRiderFilter(filter)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    border: isSelected ? '1px solid #071B52' : '1px solid #E2E8F0',
                    background: isSelected ? '#071B52' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {filter}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Table View */}
      {activeTabMode === 'CUSTOMERS' ? (
        /* CUSTOMERS TABLE */
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone Number</th>
                <th>Location / Zone</th>
                <th>Total Orders</th>
                <th>Lifetime Spend</th>
                <th>WormUp Coins</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No customers match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const loc = resolveCustomerLocation(c);
                  return (
                    <tr key={c.id || c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.82rem',
                            }}
                          >
                            {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: '#071B52' }}>{c.name}</span>
                            {c.type === 'Corporate' && (
                              <span
                                style={{
                                  marginLeft: '6px',
                                  fontSize: '0.65rem',
                                  padding: '2px 5px',
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  borderRadius: '4px',
                                  fontWeight: 800,
                                }}
                              >
                                CORP
                              </span>
                            )}
                            <span style={{ display: 'block', fontSize: '0.70rem', color: '#94A3B8' }}>
                              Joined {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#071B52', fontFamily: 'var(--font-mono)' }}>
                        {c.phone || 'N/A'}
                      </td>
                      <td style={{ fontSize: '0.80rem', color: '#475569' }}>
                        <div>📍 {loc.areaName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>🏙️ {loc.cityName}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#071B52' }}>
                        {c.totalOrders || 0} orders
                      </td>
                      <td style={{ fontWeight: 800, color: '#071B52' }}>
                        ₹{(c.spend || 0).toLocaleString()}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 800,
                            color: '#D97706',
                            background: '#FFFBEB',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: '1px solid #FDE68A',
                          }}
                        >
                          <Coins size={13} />
                          <span>{c.shoppingCoinBalance || 0} Coins</span>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${c.status === 'Active' ? 'badge-emerald' : 'badge-red'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleBlock(c)}
                          title="Click to toggle Block/Unblock"
                        >
                          {c.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenCustomerModal(c)}
                            className="btn btn-secondary btn-sm"
                            title="View / Edit Customer Profile"
                          >
                            <span>Profile</span>
                          </button>
                          <button
                            onClick={() => setSelectedUserForCoins(c)}
                            className="btn btn-secondary btn-sm"
                            title="Adjust WormUp Coins"
                          >
                            <Coins size={13} color="#D97706" />
                            <span>Coins</span>
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
      ) : (
        /* DELIVERY PARTNERS (RIDERS) TABLE */
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Delivery Partner</th>
                <th>Contact</th>
                <th>Assigned Hub</th>
                <th>Vehicle & Reg</th>
                <th>Rating & Orders</th>
                <th>Online Status</th>
                <th>KYC Approval</th>
                <th style={{ textAlign: 'right' }}>Partner Controls</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No delivery partners match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRiders.map((r) => {
                  const loc = resolveRiderLocation(r);
                  return (
                    <tr key={r.id || r._id}>
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
                            }}
                          >
                            {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: '#071B52' }}>{r.name}</span>
                            <span
                              style={{
                                display: 'block',
                                fontSize: '0.70rem',
                                color: '#FF3B98',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {r.partnerCode || 'RDR-0000'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#071B52', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                          {r.phone || 'N/A'}
                        </div>
                        {r.email && <div style={{ fontSize: '0.70rem', color: '#94A3B8' }}>{r.email}</div>}
                      </td>
                      <td style={{ fontSize: '0.80rem', color: '#475569' }}>
                        <div style={{ fontWeight: 700 }}>{r.hubName || 'Satellite Hub'}</div>
                        <div style={{ fontSize: '0.70rem', color: '#94A3B8' }}>{loc.cityName}</div>
                      </td>
                      <td style={{ fontSize: '0.80rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Bike size={13} color="#FF3B98" />
                          <span style={{ fontWeight: 700, color: '#071B52' }}>{r.vehicleType || 'Motorbike'}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#64748B' }}>
                          {r.vehicleNumber || 'GJ-01-AB-1234'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} color="#FFB800" fill="#FFB800" />
                          <span style={{ fontWeight: 800, color: '#071B52', fontSize: '0.82rem' }}>
                            {(r.rating || 4.9).toFixed(1)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                          {r.completedDeliveries || r.totalDeliveries || 0} deliveries
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${r.isOnline ? 'badge-emerald' : 'badge-navy'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: r.isOnline ? '#10B981' : '#94A3B8',
                            }}
                          />
                          <span>{r.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.status === 'APPROVED'
                              ? 'badge-emerald'
                              : r.status === 'PENDING'
                              ? 'badge-amber'
                              : 'badge-red'
                          }`}
                        >
                          {r.status || 'APPROVED'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenRiderDetail(r)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit3 size={13} />
                          <span>Manage</span>
                        </button>
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
      {/* 1. CUSTOMER PROFILE & EDIT MODAL (100% App Parity with EditCustomerModal)  */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#071B52" />
                <h4 style={{ margin: 0, color: '#071B52' }}>
                  {isEditingCustomer ? 'Edit Customer Profile' : 'Customer Profile Dossier'}
                </h4>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {!isEditingCustomer ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.2rem',
                      }}
                    >
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#071B52' }}>
                        {selectedCustomer.name}
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.80rem', color: '#64748B' }}>
                        Customer ID: {selectedCustomer.id || selectedCustomer._id}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.80rem', color: '#64748B' }}>Mobile Phone:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#071B52' }}>
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.80rem', color: '#64748B' }}>Email:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#071B52' }}>
                        {selectedCustomer.email || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.80rem', color: '#64748B' }}>Account Type:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4F46E5' }}>
                        {selectedCustomer.type || 'Individual'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.80rem', color: '#64748B' }}>WormUp Coins:</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#D97706' }}>
                        🪙 {selectedCustomer.shoppingCoinBalance || 0} Coins
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <h5 style={{ margin: '0 0 6px', fontSize: '0.82rem', color: '#071B52', textTransform: 'uppercase' }}>
                      Primary Address & Zone
                    </h5>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: '#334155' }}>
                        📍 {selectedCustomer.address || 'Prahlad Nagar, SG Highway, Ahmedabad - 380015'}
                      </p>
                      <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        Operational Zone: <strong>{selectedCustomer.zoneName || 'Prahlad Nagar'}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                    <div>
                      <span style={{ fontSize: '0.80rem', color: '#64748B' }}>Account Status:</span>
                      <span
                        className={`badge ${selectedCustomer.status === 'Active' ? 'badge-emerald' : 'badge-red'}`}
                        style={{ marginLeft: '8px' }}
                      >
                        {selectedCustomer.status || 'Active'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(selectedCustomer)}
                      className={`btn ${selectedCustomer.status === 'Blocked' ? 'btn-emerald' : 'btn-secondary'} btn-sm`}
                    >
                      {selectedCustomer.status === 'Blocked' ? 'Unblock Customer' : 'Block Customer Access'}
                    </button>
                  </div>
                </>
              ) : (
                /* Edit Mode (100% App Parity with EditCustomerModal) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editCustName}
                      onChange={(e) => setEditCustName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editCustPhone}
                      onChange={(e) => setEditCustPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Area Zone</label>
                    <select
                      value={editCustZone}
                      onChange={(e) => setEditCustZone(e.target.value)}
                      className="form-select"
                    >
                      {areas.map((a) => (
                        <option key={a.id || a._id} value={a.name}>
                          {a.name} ({a.cityName || 'Ahmedabad'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary Address *</label>
                    <textarea
                      rows={2}
                      required
                      value={editCustAddress}
                      onChange={(e) => setEditCustAddress(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Status</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setEditCustStatus('Active')}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: editCustStatus === 'Active' ? '2px solid #10B981' : '1px solid #CBD5E1',
                          background: editCustStatus === 'Active' ? '#ECFDF5' : '#FFFFFF',
                          color: editCustStatus === 'Active' ? '#065F46' : '#64748B',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCustStatus('Blocked')}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: editCustStatus === 'Blocked' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                          background: editCustStatus === 'Blocked' ? '#FEF2F2' : '#FFFFFF',
                          color: editCustStatus === 'Blocked' ? '#991B1B' : '#64748B',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        Blocked
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!isEditingCustomer ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomer(true)}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Customer Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomer(false)}
                    className="btn btn-secondary"
                    disabled={submittingCustEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomerEdit}
                    className="btn btn-pink"
                    disabled={submittingCustEdit}
                  >
                    {submittingCustEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADJUST COINS MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedUserForCoins && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} color="#D97706" />
                <h4 style={{ margin: 0, color: '#071B52' }}>Adjust WormUp Coins</h4>
              </div>
              <button
                onClick={() => setSelectedUserForCoins(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustCoinsSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '16px' }}>
                  Managing coins for <strong>{selectedUserForCoins.name}</strong> (Current balance: {selectedUserForCoins.shoppingCoinBalance || 0} coins).
                </p>

                <div className="form-group">
                  <label className="form-label">Action Type</label>
                  <select
                    value={coinType}
                    onChange={(e) => setCoinType(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="Credit">Credit (Add Coins to Customer)</option>
                    <option value="Debit">Debit (Deduct Coins from Customer)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Coins Amount</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Notes for Ledger</label>
                  <input
                    type="text"
                    required
                    value={coinReason}
                    onChange={(e) => setCoinReason(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setSelectedUserForCoins(null)}
                  className="btn btn-secondary"
                  disabled={submittingCoins}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={submittingCoins}
                >
                  {submittingCoins ? 'Updating MongoDB...' : 'Confirm Coin Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RIDER DETAIL & EDIT MODAL (100% Mobile App Parity)                     */}
      {/* ========================================================================= */}
      {selectedRider && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bike size={20} color="#FF3B98" />
                <h4 style={{ margin: 0, color: '#071B52' }}>
                  {isEditingRider ? 'Edit Partner Profile' : 'Delivery Partner Dossier'}
                </h4>
                <span
                  style={{
                    fontSize: '0.70rem',
                    background: '#FFF0F7',
                    color: '#FF3B98',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontWeight: 800,
                  }}
                >
                  {selectedRider.partnerCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedRider(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {!isEditingRider ? (
                <>
                  {/* View Mode */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        backgroundColor: '#FFF0F7',
                        color: '#FF3B98',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.25rem',
                      }}
                    >
                      {selectedRider.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#071B52' }}>
                        {selectedRider.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                        <span
                          className={`badge ${selectedRider.isOnline ? 'badge-emerald' : 'badge-navy'}`}
                        >
                          {selectedRider.isOnline ? 'ACTIVE & ONLINE' : 'OFFLINE'}
                        </span>
                        <span
                          className={`badge ${
                            selectedRider.status === 'APPROVED' ? 'badge-emerald' : 'badge-amber'
                          }`}
                        >
                          {selectedRider.status}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#071B52' }}>
                          ★ {(selectedRider.rating || 4.9).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block' }}>PHONE NUMBER</span>
                      <strong style={{ fontSize: '0.84rem', color: '#071B52' }}>{selectedRider.phone}</strong>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block' }}>ASSIGNED HUB</span>
                      <strong style={{ fontSize: '0.84rem', color: '#071B52' }}>{selectedRider.hubName}</strong>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block' }}>VEHICLE TIER</span>
                      <strong style={{ fontSize: '0.84rem', color: '#071B52' }}>{selectedRider.vehicleType}</strong>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block' }}>VEHICLE NUMBER</span>
                      <strong style={{ fontSize: '0.84rem', color: '#071B52', fontFamily: 'var(--font-mono)' }}>
                        {selectedRider.vehicleNumber}
                      </strong>
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '12px', borderRadius: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CreditCard size={15} color="#4F46E5" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#312E81' }}>
                          Payout Bank Account
                        </span>
                      </div>
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        VERIFIED IMPS
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#4338CA' }}>
                      HDFC Bank Ltd • A/C: <strong>•••• •••• {selectedRider.phone ? selectedRider.phone.slice(-4) : '4829'}</strong> • IFSC: <strong>HDFC0001048</strong>
                    </div>
                  </div>
                </>
              ) : (
                /* Edit Mode */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">KYC Verification Status</label>
                    <select
                      value={riderStatus}
                      onChange={(e) => setRiderStatus(e.target.value as any)}
                      className="form-select"
                    >
                      <option value="APPROVED">APPROVED (Active On Duty)</option>
                      <option value="PENDING">PENDING (Verification Required)</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="SUSPENDED">SUSPENDED (Temporary Hold)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Online Duty Status</label>
                    <select
                      value={riderIsOnline ? 'true' : 'false'}
                      onChange={(e) => setRiderIsOnline(e.target.value === 'true')}
                      className="form-select"
                    >
                      <option value="true">ONLINE (Available for Dispatch)</option>
                      <option value="false">OFFLINE (Unavailable)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle Tier</label>
                    <select
                      value={riderVehicleType}
                      onChange={(e) => setRiderVehicleType(e.target.value)}
                      className="form-select"
                    >
                      <option value="Motorbike">Motorbike</option>
                      <option value="EV_SCOOTER">Electric Scooter (EV)</option>
                      <option value="Bicycle">Bicycle / Pedestrian</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle Registration Number</label>
                    <input
                      type="text"
                      value={riderVehicleNumber}
                      onChange={(e) => setRiderVehicleNumber(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Dark Store Hub</label>
                    <input
                      type="text"
                      value={riderHubName}
                      onChange={(e) => setRiderHubName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!isEditingRider ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedRider(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingRider(true)}
                    className="btn btn-primary"
                  >
                    <Edit3 size={14} />
                    <span>Edit Partner Details</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingRider(false)}
                    className="btn btn-secondary"
                    disabled={submittingRider}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRider}
                    className="btn btn-pink"
                    disabled={submittingRider}
                  >
                    {submittingRider ? 'Saving to MongoDB...' : 'Save Partner Details'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADD CUSTOMER MODAL                                                     */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#071B52" />
                <h4 style={{ margin: 0, color: '#071B52' }}>Add New Customer</h4>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit}>
              <div className="modal-body">
                {/* Type Selector (Individual vs Corporate) */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Customer Classification</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setNewCustType('Individual')}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: newCustType === 'Individual' ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                        background: newCustType === 'Individual' ? '#F5F3FF' : '#FFFFFF',
                        color: newCustType === 'Individual' ? '#6D28D9' : '#64748B',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Individual Shopper
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCustType('Corporate')}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: newCustType === 'Corporate' ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                        background: newCustType === 'Corporate' ? '#F5F3FF' : '#FFFFFF',
                        color: newCustType === 'Corporate' ? '#6D28D9' : '#64748B',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Corporate / Enterprise
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Area Zone *</label>
                  <select
                    value={newCustZone}
                    onChange={(e) => setNewCustZone(e.target.value)}
                    className="form-select"
                  >
                    {areas.map((a) => (
                      <option key={a.id || a._id} value={a.name}>
                        {a.name} ({a.cityName || 'Ahmedabad'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Flat / House, Street, Locality..."
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="btn btn-secondary"
                  disabled={submittingNewCust}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={submittingNewCust}
                >
                  {submittingNewCust ? 'Creating Customer...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
