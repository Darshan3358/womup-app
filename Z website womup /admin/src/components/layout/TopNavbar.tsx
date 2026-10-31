import React, { useState } from 'react';
import { NEST_API_BASE_URL } from '../../services/api';
import {
  Search,
  RefreshCw,
  Plus,
  Store,
  Package,
  FolderTree,
  Bell,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export const TopNavbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedStoreFilter,
    setSelectedStoreFilter,
    searchQuery,
    setSearchQuery,
    stores,
    refreshData,
    isSyncing,
    lastSyncTime,
    setShowAddStoreModal,
    setShowAddProductModal,
    setShowAddCategoryModal,
  } = useAdmin();

  const [showQuickAddDropdown, setShowQuickAddDropdown] = useState(false);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [approvalsCount, setApprovalsCount] = useState({
    customerKyc: 45,
    riders: 8,
    stores: 3,
    vendors: 12,
    withdrawals: 15,
    staff: 5,
    orders: 6,
    rateChanges: 2,
    total: 96,
  });

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${NEST_API_BASE_URL}/admin/approvals/summary`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setApprovalsCount({
              customerKyc: json.data.customerKyc,
              riders: json.data.riders,
              stores: json.data.stores,
              vendors: json.data.vendors,
              withdrawals: json.data.withdrawals,
              staff: json.data.staff,
              orders: json.data.orders,
              rateChanges: json.data.rateChanges,
              total: json.data.totalPending,
            });
          }
        }
      } catch (e) {
        // keep defaults
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Connecting...';
    return lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Left Title & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Portal</span>
            <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>/</span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#071B52', margin: 0, whiteSpace: 'nowrap' }}>
              {activeTab === 'Prices'
                ? 'Area Pricing & Surge'
                : activeTab === 'Stores'
                ? 'Dark Stores & Hubs'
                : activeTab === 'Locations'
                ? 'Delivery Zones & Areas'
                : activeTab === 'PayoutRates'
                ? 'Rider Payout Rates'
                : activeTab === 'Wallets'
                ? 'Wallets & Revenue'
                : activeTab}
            </h1>
          </div>
        </div>

        {/* Store Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedStoreFilter}
            onChange={(e) => setSelectedStoreFilter(e.target.value)}
            style={{
              padding: '7px 28px 7px 12px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#071B52',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="ALL">🏪 All Dark Stores & Shops ({stores.length})</option>
            {stores.map((s) => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {s.name} ({s.code}) - {s.cityName || s.city || 'Ahmedabad'}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            color="#64748B"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Right Controls: Search, Sync, Quick Add */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search
            size={15}
            color="#94A3B8"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            placeholder="Search orders, shops, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              fontSize: '0.82rem',
              color: '#0F172A',
              outline: 'none',
            }}
          />
        </div>

        {/* Real-time Sync Status & Manual Refresh Button */}
        <button
          onClick={() => refreshData()}
          disabled={isSyncing}
          title="Instant sync with MongoDB Atlas"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 14px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            fontSize: '0.80rem',
            fontWeight: 700,
            color: '#071B52',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw
            size={14}
            color="#FF3B98"
            style={{
              animation: isSyncing ? 'spin 1s linear infinite' : 'none',
            }}
          />
          <span>{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
            {formatLastSync()}
          </span>
        </button>

        {/* Bell Notification Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowBellDropdown((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: showBellDropdown ? '#EFF6FF' : '#FFFFFF',
              color: '#071B52',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
            title="Pending Approvals Queue"
          >
            <Bell size={18} color={showBellDropdown ? '#1D4ED8' : '#071B52'} />
            {approvalsCount.total > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  border: '2px solid #FFFFFF',
                  minWidth: '18px',
                  textAlign: 'center',
                }}
              >
                {approvalsCount.total}
              </span>
            )}
          </button>

          {showBellDropdown && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '310px',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 16px 36px rgba(7, 27, 82, 0.15)',
                padding: '12px',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  borderBottom: '1px solid #E2E8F0',
                }}
              >
                <button
                  onClick={() => {
                    setActiveTab('ApprovalHub');
                    setShowBellDropdown(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#071B52',
                    textDecoration: 'underline',
                  }}
                >
                  🔔 Open Approval Hub ({approvalsCount.total})
                </button>
                <span style={{ fontSize: '0.70rem', color: '#10B981', fontWeight: 700 }}>
                  Live Real-Time
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => {
                    setActiveTab('Customers');
                    setShowBellDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#071B52',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>👥 Customer KYC</span>
                  <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem' }}>
                    {approvalsCount.customerKyc} pending
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('Staff');
                    setShowBellDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#071B52',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>🛵 Rider Applications</span>
                  <span style={{ background: '#F0FDFA', color: '#0D9488', padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem' }}>
                    {approvalsCount.riders} pending
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('Stores');
                    setShowBellDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#071B52',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>🏪 Dark Stores</span>
                  <span style={{ background: '#FFFBEB', color: '#D97706', padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem' }}>
                    {approvalsCount.stores} pending
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('Vendors');
                    setShowBellDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#071B52',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>🏪 Local Vendors</span>
                  <span style={{ background: '#F5F3FF', color: '#7C3AED', padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem' }}>
                    {approvalsCount.vendors} pending
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('Wallets');
                    setShowBellDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#071B52',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>💰 Wallet Withdrawals</span>
                  <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem' }}>
                    {approvalsCount.withdrawals} pending
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('Orders');
                    setShowBellDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#071B52',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>📦 Order Cancellations</span>
                  <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem' }}>
                    {approvalsCount.orders} pending
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('PayoutRates');
                    setShowBellDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#071B52',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>📢 Payout Rate Changes</span>
                  <span style={{ background: '#FFF0F7', color: '#FF3B98', padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem' }}>
                    {approvalsCount.rateChanges} pending
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowQuickAddDropdown((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #FF3B98 0%, #E91E63 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 59, 152, 0.35)',
            }}
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>New Action</span>
            <ChevronDown size={14} />
          </button>

          {showQuickAddDropdown && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '210px',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 16px 36px rgba(7, 27, 82, 0.15)',
                padding: '6px',
                zIndex: 100,
              }}
            >
              <button
                onClick={() => {
                  setShowAddStoreModal(true);
                  setShowQuickAddDropdown(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#071B52',
                }}
              >
                <Store size={16} color="#10B981" />
                <span>+ Add Dark Store / Shop</span>
              </button>

              <button
                onClick={() => {
                  setShowAddProductModal(true);
                  setShowQuickAddDropdown(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#071B52',
                }}
              >
                <Package size={16} color="#3B82F6" />
                <span>+ Add Product Item</span>
              </button>

              <button
                onClick={() => {
                  setShowAddCategoryModal(true);
                  setShowQuickAddDropdown(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#071B52',
                }}
              >
                <FolderTree size={16} color="#7856F6" />
                <span>+ Add Category</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};
