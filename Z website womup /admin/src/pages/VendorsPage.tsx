import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Plus,
  Search,
  RefreshCw,
  Coins,
  QrCode,
  ShieldCheck,
  Edit2,
  Trash2,
  Power,
  X,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  Printer,
  Check,
} from 'lucide-react';
import { VendorAdminItem, VendorCategoryItem } from '../types/admin';
import { NEST_API_BASE_URL } from '../services/api';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorAdminItem[]>([]);
  const [categories, setCategories] = useState<VendorCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED' | 'KYC_PENDING'>('ALL');

  // KPI Analytics
  const [analytics, setAnalytics] = useState({
    totalVendors: 0,
    activeVendors: 0,
    kycPending: 0,
    monthlyRevenue: 0,
  });

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorAdminItem | null>(null);
  const [coinModalVendor, setCoinModalVendor] = useState<VendorAdminItem | null>(null);
  const [quickCoinPercent, setQuickCoinPercent] = useState('15');
  const [isUpdatingCoin, setIsUpdatingCoin] = useState(false);
  const [qrModalVendor, setQrModalVendor] = useState<VendorAdminItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    storeName: '',
    vendorCode: '',
    ownerName: '',
    ownerPhone: '',
    categoryName: 'Vegetables',
    address: '',
    city: 'Ahmedabad',
    pincode: '380015',
    latitude: '23.1288',
    longitude: '72.5507',
    shoppingCoinPercent: '15',
    platformCommissionPercent: '2',
    openingTime: '8:00 AM',
    closingTime: '9:00 PM',
    upiId: '',
  });

  const fetchVendorsData = useCallback(async () => {
    try {
      setSyncing(true);
      const [vendorsRes, statsRes] = await Promise.all([
        fetch(`${NEST_API_BASE_URL}/admin/vendors`),
        fetch(`${NEST_API_BASE_URL}/admin/vendors/analytics`),
      ]);

      const vendorsJson = await vendorsRes.json();
      const statsJson = await statsRes.json();

      if (vendorsJson.success && vendorsJson.data) {
        setVendors(vendorsJson.data);
      }
      if (statsJson.success && statsJson.data) {
        setAnalytics(statsJson.data);
      }
    } catch (err) {
      console.error('Failed fetching vendor data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchVendorsData();
  }, [fetchVendorsData]);

  const handleOpenCreateModal = () => {
    setEditingVendor(null);
    setFormData({
      storeName: '',
      vendorCode: `VND${Math.floor(100 + Math.random() * 900)}`,
      ownerName: '',
      ownerPhone: '',
      categoryName: 'Vegetables',
      address: '',
      city: 'Ahmedabad',
      pincode: '380015',
      latitude: '23.1288',
      longitude: '72.5507',
      shoppingCoinPercent: '15',
      platformCommissionPercent: '2',
      openingTime: '8:00 AM',
      closingTime: '9:00 PM',
      upiId: '',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (v: VendorAdminItem) => {
    setEditingVendor(v);
    setFormData({
      storeName: v.storeName,
      vendorCode: v.vendorCode,
      ownerName: v.ownerName || '',
      ownerPhone: v.ownerPhone || '',
      categoryName: v.categoryName || 'Vegetables',
      address: v.address || '',
      city: v.city || 'Ahmedabad',
      pincode: v.pincode || '380015',
      latitude: v.coordinates?.coordinates?.[1]?.toString() || '23.1288',
      longitude: v.coordinates?.coordinates?.[0]?.toString() || '72.5507',
      shoppingCoinPercent: (v.shoppingCoinPercent || 15).toString(),
      platformCommissionPercent: (v.platformCommissionPercent || 2).toString(),
      openingTime: v.openingTime || '8:00 AM',
      closingTime: v.closingTime || '9:00 PM',
      upiId: v.upiId || '',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const coinVal = parseFloat(formData.shoppingCoinPercent);
    if (isNaN(coinVal) || coinVal < 2 || coinVal > 25) {
      alert('Shopping Coin % must be between 2% and 25%.');
      return;
    }

    const payload = {
      storeName: formData.storeName.trim(),
      vendorCode: formData.vendorCode.trim().toUpperCase(),
      ownerName: formData.ownerName.trim(),
      ownerPhone: formData.ownerPhone.trim(),
      categoryName: formData.categoryName.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      pincode: formData.pincode.trim(),
      coordinates: {
        type: 'Point',
        coordinates: [parseFloat(formData.longitude) || 72.5507, parseFloat(formData.latitude) || 23.1288],
      },
      shoppingCoinPercent: coinVal,
      platformCommissionPercent: parseFloat(formData.platformCommissionPercent) || 2,
      openingTime: formData.openingTime.trim(),
      closingTime: formData.closingTime.trim(),
      upiId: formData.upiId.trim() || undefined,
      isActive: true,
      isVerified: true,
    };

    try {
      if (editingVendor) {
        const id = editingVendor.id || editingVendor._id;
        await fetch(`${NEST_API_BASE_URL}/admin/vendors/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${NEST_API_BASE_URL}/admin/vendors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsAddEditModalOpen(false);
      fetchVendorsData();
    } catch (err: any) {
      alert('Failed saving vendor: ' + err.message);
    }
  };

  const handleToggleActive = async (v: VendorAdminItem) => {
    const id = v.id || v._id;
    if (!id) return;
    try {
      await fetch(`${NEST_API_BASE_URL}/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !v.isActive }),
      });
      fetchVendorsData();
    } catch (err) {
      alert('Failed toggling vendor status');
    }
  };

  const handleVerifyKyc = async (v: VendorAdminItem) => {
    const id = v.id || v._id;
    if (!id) return;
    try {
      await fetch(`${NEST_API_BASE_URL}/admin/vendors/${id}/verify-kyc`, {
        method: 'POST',
      });
      fetchVendorsData();
    } catch (err) {
      alert('Failed verifying KYC');
    }
  };

  const handleDeleteVendor = async (v: VendorAdminItem) => {
    const id = v.id || v._id;
    if (!id) return;
    if (window.confirm(`Are you sure you want to remove "${v.storeName}" (${v.vendorCode}) from the vendor network?`)) {
      try {
        await fetch(`${NEST_API_BASE_URL}/admin/vendors/${id}`, {
          method: 'DELETE',
        });
        fetchVendorsData();
      } catch (err) {
        alert('Failed deleting vendor');
      }
    }
  };

  const handleSaveQuickCoin = async () => {
    if (!coinModalVendor) return;
    const id = coinModalVendor.id || coinModalVendor._id;
    const val = parseFloat(quickCoinPercent);
    if (!id || isNaN(val) || val < 2 || val > 25) {
      alert('Validation Error: Shopping Coin % must be between 2% and 25%.');
      return;
    }

    setIsUpdatingCoin(true);
    try {
      await fetch(`${NEST_API_BASE_URL}/admin/vendors/${id}/coin-rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shoppingCoinPercent: val }),
      });
      setCoinModalVendor(null);
      fetchVendorsData();
    } catch (err) {
      alert('Could not update shopping coin rate.');
    } finally {
      setIsUpdatingCoin(false);
    }
  };

  // Filtered list
  const filteredVendors = vendors.filter((v) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.storeName?.toLowerCase().includes(q) ||
      v.vendorCode?.toLowerCase().includes(q) ||
      v.ownerName?.toLowerCase().includes(q) ||
      v.categoryName?.toLowerCase().includes(q) ||
      v.address?.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'ALL' || v.categoryName?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? v.isActive === true
        : statusFilter === 'DISABLED'
        ? v.isActive === false
        : statusFilter === 'KYC_PENDING'
        ? v.isVerified !== true
        : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div>
      {/* 1. Header Bar */}
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
            Local Store Vendors & QR Management
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Manage Kirana, Vegetables, Salons & Medical store partners with Admin-controlled Shopping Coin %
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => fetchVendorsData()}
            className="btn btn-secondary btn-sm"
            title="Refresh vendors"
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="btn btn-pink"
            style={{ padding: '9px 18px', fontSize: '0.86rem' }}
          >
            <Plus size={16} strokeWidth={2.8} />
            <span>+ Add New Local Vendor</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: '22px' }}>
        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px' }}>
              Total Local Vendors
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
              {analytics.totalVendors || vendors.length}
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0' }}>
              Registered merchant network
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
            <Store size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px' }}>
              Active Live Stores
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', margin: 0 }}>
              {analytics.activeVendors || vendors.filter((v) => v.isActive).length}
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, margin: '4px 0 0' }}>
              Visible in Customer App
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
            <Power size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px' }}>
              KYC Pending Verification
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B', margin: 0 }}>
              {analytics.kycPending || vendors.filter((v) => !v.isVerified).length}
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700, margin: '4px 0 0' }}>
              Requires document review
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px' }}>
              Monthly Offline Revenue
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
              ₹{((analytics.monthlyRevenue || 45000) / 1000).toFixed(1)}k
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, margin: '4px 0 0' }}>
              +18.4% growth this month
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#FDF2F8', color: '#EC4899' }}>
            <Coins size={22} />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search store name, code, owner, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {['ALL', 'Vegetables', 'Grocery', 'Medical', 'Salon', 'Garments'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: selectedCategory === cat ? '#071B52' : '#F1F5F9',
                  color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: `All (${vendors.length})` },
            { id: 'ACTIVE', label: `Active (${vendors.filter((v) => v.isActive).length})` },
            { id: 'DISABLED', label: `Disabled (${vendors.filter((v) => !v.isActive).length})` },
            { id: 'KYC_PENDING', label: `KYC Pending (${vendors.filter((v) => !v.isVerified).length})` },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: statusFilter === st.id ? '#071B52' : '#E2E8F0',
                backgroundColor: statusFilter === st.id ? '#071B52' : '#FFFFFF',
                color: statusFilter === st.id ? '#FFFFFF' : '#64748B',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Vendors Directory Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#071B52' }} />
          <p>Loading Local Store Vendors from MongoDB...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px dashed #CBD5E1' }}>
          <Store size={48} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>No Vendors Found</h3>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
            {search ? 'Try clearing your search query or filter.' : 'Click "+ Add New Local Vendor" above to onboard your first partner.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id || vendor._id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                position: 'relative',
              }}
            >
              {/* Header: Store Icon + Title + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4F46E5',
                    }}
                  >
                    <Store size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {vendor.storeName}
                      </h4>
                      <span
                        style={{
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {vendor.vendorCode}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '3px 0 0' }}>
                      {vendor.categoryName} • {vendor.city}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: vendor.isActive ? '#ECFDF5' : '#F1F5F9',
                      color: vendor.isActive ? '#10B981' : '#64748B',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: vendor.isActive ? '#10B981' : '#94A3B8',
                      }}
                    />
                    {vendor.isActive ? 'Active' : 'Disabled'}
                  </span>

                  {vendor.isVerified && (
                    <span
                      style={{
                        padding: '3px 6px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <ShieldCheck size={11} />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* ⭐ Shopping Coin Configuration Banner (Admin Controlled) */}
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={18} style={{ color: '#D97706' }} />
                  <div>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#92400E' }}>
                      Shopping Coin Benefit:{' '}
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#B45309' }}>
                        {vendor.shoppingCoinPercent}%
                      </span>
                    </span>
                    <p style={{ fontSize: '0.72rem', color: '#B45309', margin: '1px 0 0' }}>
                      Customer receives ₹{(1000 * vendor.shoppingCoinPercent) / 100} benefit on ₹1,000 bill (Payable: ₹{1000 - (1000 * vendor.shoppingCoinPercent) / 100})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCoinModalVendor(vendor);
                    setQuickCoinPercent(vendor.shoppingCoinPercent.toString());
                  }}
                  style={{
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Quick Edit Rate"
                >
                  <Edit2 size={11} />
                  <span>Edit Rate</span>
                </button>
              </div>

              {/* Info Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} style={{ color: '#64748B' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {vendor.address}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} style={{ color: '#64748B' }} />
                    <span>{vendor.ownerName || 'Merchant'}: {vendor.ownerPhone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: '#64748B' }} />
                    <span>{vendor.openingTime || '8:00 AM'} - {vendor.closingTime || '9:00 PM'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '12px',
                  marginTop: 'auto',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  Revenue:{' '}
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>
                    ₹{(vendor.monthlyRevenue ?? 0).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setQrModalVendor(vendor)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#071B52',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <QrCode size={12} />
                    <span>Show QR</span>
                  </button>

                  <button
                    onClick={() => handleToggleActive(vendor)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: vendor.isActive ? '#64748B' : '#10B981',
                      cursor: 'pointer',
                    }}
                  >
                    {vendor.isActive ? 'Disable' : 'Enable'}
                  </button>

                  {!vendor.isVerified && (
                    <button
                      onClick={() => handleVerifyKyc(vendor)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid #93C5FD',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        cursor: 'pointer',
                      }}
                    >
                      Verify KYC
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditModal(vendor)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      backgroundColor: '#071B52',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Edit2 size={11} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteVendor(vendor)}
                    style={{
                      padding: '5px 7px',
                      borderRadius: '6px',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color: '#EF4444',
                      cursor: 'pointer',
                    }}
                    title="Delete Vendor"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Quick Coin % Editor Modal */}
      {coinModalVendor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Update Shopping Coin Rate
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                  {coinModalVendor.storeName} ({coinModalVendor.vendorCode})
                </p>
              </div>
              <button
                onClick={() => setCoinModalVendor(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ margin: '16px 0' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Shopping Coin Benefit % (2% - 25%)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '2px solid #D97706',
                  borderRadius: '10px',
                  padding: '6px 14px',
                }}
              >
                <input
                  type="number"
                  min="2"
                  max="25"
                  value={quickCoinPercent}
                  onChange={(e) => setQuickCoinPercent(e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: '#B45309',
                    border: 'none',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                  autoFocus
                />
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#B45309' }}>%</span>
              </div>

              {/* Preset Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', justifyContent: 'center' }}>
                {[2, 5, 8, 10, 12, 15, 18, 20, 25].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickCoinPercent(preset.toString())}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: quickCoinPercent === preset.toString() ? '#D97706' : '#E2E8F0',
                      backgroundColor: quickCoinPercent === preset.toString() ? '#D97706' : '#F1F5F9',
                      color: quickCoinPercent === preset.toString() ? '#FFFFFF' : '#475569',
                    }}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              {/* Live Preview Card */}
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: '10px',
                  padding: '12px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Coins size={18} style={{ color: '#D97706' }} />
                <span style={{ fontSize: '0.82rem', color: '#92400E', fontWeight: 600 }}>
                  On a ₹1,000 bill: Customer receives{' '}
                  <strong style={{ color: '#B45309' }}>
                    ₹{Math.round((1000 * (parseFloat(quickCoinPercent) || 0)) / 100)} benefit
                  </strong>{' '}
                  (Payable: <strong style={{ color: '#047857' }}>₹{Math.max(0, 1000 - Math.round((1000 * (parseFloat(quickCoinPercent) || 0)) / 100))}</strong>)
                </span>
              </div>

              <p style={{ fontSize: '0.74rem', color: '#64748B', textAlign: 'center', marginTop: '10px' }}>
                ⓘ Updates immediately in MongoDB Atlas and is reflected on the customer mobile app.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setCoinModalVendor(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickCoin}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.84rem', backgroundColor: '#D97706', borderColor: '#D97706' }}
                disabled={isUpdatingCoin}
              >
                {isUpdatingCoin ? 'Updating...' : 'Update Rate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. QR Standee Modal */}
      {qrModalVendor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Store Counter QR Standee
              </h3>
              <button
                onClick={() => setQrModalVendor(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Visual Standee Card */}
            <div
              style={{
                backgroundColor: '#071B52',
                borderRadius: '16px',
                padding: '24px 20px',
                color: '#FFFFFF',
                margin: '12px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '1px' }}>WOMUP PAY</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{qrModalVendor.storeName}</div>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Counter Terminal: {qrModalVendor.vendorCode}</div>

              {/* QR Box */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <QrCode size={130} style={{ color: '#071B52' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#071B52' }}>
                  WOMUP-PAY-{qrModalVendor.vendorCode}
                </span>
              </div>

              {/* Reward Banner */}
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  width: '100%',
                }}
              >
                ⭐ Scan with WormUp & Earn {qrModalVendor.shoppingCoinPercent}% Coins
              </div>
            </div>

            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '10px 0 16px' }}>
              Payload: womup://vendor/{qrModalVendor.vendorCode} • UPI: {qrModalVendor.upiId || `${qrModalVendor.vendorCode.toLowerCase()}@okhdfcbank`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button
                onClick={() => setQrModalVendor(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              >
                Close
              </button>
              <button
                onClick={() => alert(`Printing A4 Standee sheet for ${qrModalVendor.storeName} (${qrModalVendor.vendorCode})`)}
                className="btn btn-pink"
                style={{ padding: '8px 18px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={15} />
                <span>Print Standee (A4)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add / Edit Vendor Modal */}
      {isAddEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingVendor ? 'Edit Vendor Details' : 'Add New Local Partner Vendor'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                  Register merchant, location, standee QR code, and Admin-controlled Shopping Coin %
                </p>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Store & Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="e.g. Gokul Vegetables"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Vendor Code * (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vendorCode}
                    onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. VND001"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Owner & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Owner Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    placeholder="e.g. +91 98250 12345"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Category & Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  >
                    {['Vegetables', 'Grocery', 'Medical', 'Salon', 'Garments', 'Bakery', 'Electronics'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Near Nandanvan Society, Mahesana"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* City & Pincode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* ⭐ Shopping Coin Configuration Banner (Admin Controlled) */}
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={18} style={{ color: '#D97706' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E' }}>
                    Shopping Coin Configuration
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>
                      Shopping Coin Benefit % (2% - 25%) *
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="25"
                      required
                      value={formData.shoppingCoinPercent}
                      onChange={(e) => setFormData({ ...formData, shoppingCoinPercent: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D97706',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: '#B45309',
                      }}
                    />
                    <p style={{ fontSize: '0.68rem', color: '#92400E', margin: '3px 0 0' }}>
                      Customer receives {formData.shoppingCoinPercent || 18}% Shopping Coin benefit on purchases.
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>
                      Platform Commission % (Default: 2%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.platformCommissionPercent}
                      onChange={(e) => setFormData({ ...formData, platformCommissionPercent: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D97706',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: '#B45309',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Timings & UPI */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Opens At</label>
                  <input
                    type="text"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Closes At</label>
                  <input
                    type="text"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Counter UPI ID</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="e.g. gokul@okaxis"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  style={{ padding: '8px 20px', fontSize: '0.84rem' }}
                >
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
