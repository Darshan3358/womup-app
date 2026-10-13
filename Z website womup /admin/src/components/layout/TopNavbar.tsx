import React, { useState } from 'react';
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
