import React, { useState } from 'react';
import {
  Store,
  Plus,
  Search,
  MapPin,
  Clock,
  Bike,
  Users,
  Power,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { DarkStoreItem } from '../types/admin';

export const StoresPage: React.FC = () => {
  const {
    stores,
    cities,
    areas,
    toggleStoreShift,
    deleteStore,
    resetStorePassword,
    setShowAddStoreModal,
    refreshData,
    isSyncing,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON_SHIFT' | 'OFFLINE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filterable areas scoped to selected city from database
  const filterableAreas = areas.filter((a) => {
    if (cityFilter === 'ALL') return true;
    const matchedCity = cities.find(
      (c) => c.name.toLowerCase() === cityFilter.toLowerCase() || c.id === cityFilter || c._id === cityFilter
    );
    if (!matchedCity) return true;
    const cId = matchedCity.id || matchedCity._id;
    if (a.cityId && cId && String(a.cityId) === String(cId)) return true;
    if (a.cityName && matchedCity.name && a.cityName.toLowerCase() === matchedCity.name.toLowerCase()) return true;
    return false;
  });

  // Password reset modal state
  const [resetStoreItem, setResetStoreItem] = useState<DarkStoreItem | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Filtered stores using database city and area tables
  const filteredStores = stores.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.areaName && s.areaName.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.cityName && s.cityName.toLowerCase().includes(q));

    // Match City from database table
    let matchesCity = true;
    if (cityFilter !== 'ALL') {
      const matchedCity = cities.find(
        (c) => c.name.toLowerCase() === cityFilter.toLowerCase() || c.id === cityFilter || c._id === cityFilter
      );
      const targetCityName = matchedCity ? matchedCity.name.toLowerCase() : cityFilter.toLowerCase();
      const targetCityId = matchedCity ? String(matchedCity.id || matchedCity._id) : '';
      const storeCity = (s.cityName || s.city || '').toLowerCase();
      const storeCityId = s.cityId ? String(s.cityId) : '';
      matchesCity = (targetCityId && storeCityId === targetCityId) || (storeCity && storeCity === targetCityName);
    }

    // Match Area from database table
    let matchesArea = true;
    if (areaFilter !== 'ALL') {
      const matchedArea = areas.find(
        (a) => a.name.toLowerCase() === areaFilter.toLowerCase() || a.id === areaFilter || a._id === areaFilter
      );
      const targetAreaName = (matchedArea ? matchedArea.name : areaFilter).toLowerCase().trim();
      const targetAreaId = matchedArea ? String(matchedArea.id || matchedArea._id) : '';
      const storeArea = (s.areaName || '').toLowerCase().trim();
      const storeAreaId = s.areaId ? String(s.areaId) : '';
      const storeName = (s.name || '').toLowerCase().trim();
      const storeCode = (s.code || (s as any).hubCode || '').toLowerCase().trim();
      const cleanTargetWords = targetAreaName.replace(/[-_]/g, ' ').split(/\s+/).filter((w) => w.length > 2);

      matchesArea =
        Boolean(targetAreaId && storeAreaId === targetAreaId) ||
        (storeArea && (storeArea === targetAreaName || storeArea.includes(targetAreaName) || targetAreaName.includes(storeArea))) ||
        (storeName && (storeName.includes(targetAreaName) || targetAreaName.includes(storeName))) ||
        cleanTargetWords.some((w) => storeName.includes(w) || storeArea.includes(w) || storeCode.includes(w));
    }

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ON_SHIFT'
        ? s.isOnShift === true
        : s.isOnShift !== true;

    return matchesSearch && matchesCity && matchesArea && matchesStatus;
  });

  const onShiftCount = stores.filter((s) => s.isOnShift === true).length;
  const totalStores = stores.length;

  const handleToggleShift = async (store: DarkStoreItem) => {
    const nextState = !store.isOnShift;
    await toggleStoreShift(store.id || store._id, nextState);
  };

  const handleDelete = async (store: DarkStoreItem) => {
    if (window.confirm(`Are you sure you want to delete ${store.name} (${store.code})? This will update MongoDB Atlas immediately.`)) {
      await deleteStore(store.id || store._id);
    }
  };

  const openResetPassword = (store: DarkStoreItem) => {
    setResetStoreItem(store);
    setNewPasswordValue('Womup@' + Math.floor(100000 + Math.random() * 900000));
    setResetSuccessMessage(null);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetStoreItem) return;
    setResetting(true);
    const res = await resetStorePassword(resetStoreItem.id || resetStoreItem._id, newPasswordValue);
    setResetting(false);
    if (res.success) {
      setResetSuccessMessage(`Password reset successfully for ${resetStoreItem.name}!`);
      setTimeout(() => {
        setResetStoreItem(null);
      }, 2200);
    }
  };

  return (
    <div>
      {/* Top Header & Metrics */}
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
            Stores & Dark Hubs Directory
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Multi-store fulfillment centers powering instant 9-minute lightning delivery
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => refreshData()}
            className="btn btn-secondary btn-sm"
            title="Refresh stores from Atlas"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setShowAddStoreModal(true)}
            className="btn btn-pink"
            style={{ padding: '9px 18px', fontSize: '0.86rem' }}
          >
            <Plus size={16} strokeWidth={2.8} />
            <span>+ Add New Dark Store / Shop</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="kpi-grid" style={{ marginBottom: '22px' }}>
        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px' }}>
              Total Network Hubs
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
              {totalStores}
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0' }}>
              Covering Ahmedabad Metro
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
            <Store size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px' }}>
              Currently On Shift
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981', margin: 0 }}>
              {onShiftCount}
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, margin: '4px 0 0' }}>
              Accepting live orders now
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
            <Power size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px' }}>
              SLA Delivery Target
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FF3B98', margin: 0 }}>
              9 Mins
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '4px 0 0' }}>
              4.5 km average radius
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#FFF0F7', color: '#FF3B98' }}>
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="admin-card"
        style={{
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={15}
              color="#94A3B8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search store name, code, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
            />
          </div>

          {/* City Filter (From Database Table) */}
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setAreaFilter('ALL');
            }}
            className="form-select"
            style={{ width: '160px', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Cities ({cities.length})</option>
            {cities.map((c) => (
              <option key={c.id || c._id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Area Filter (From Database Table, Cascading) */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="form-select"
            style={{ width: '170px', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Areas ({filterableAreas.length})</option>
            {filterableAreas.map((a) => (
              <option key={a.id || a._id || a.name} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-select"
            style={{ width: '150px', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Status</option>
            <option value="ON_SHIFT">On Shift (Active)</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'grid' ? '#071B52' : '#64748B',
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <LayoutGrid size={14} />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'table' ? '#071B52' : '#64748B',
              boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <List size={14} />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Grid Cards View */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredStores.map((store) => (
            <div
              key={store.id || store._id}
              className="admin-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: store.isOnShift ? '1.5px solid #A7F3D0' : '1px solid #E2E8F0',
                position: 'relative',
              }}
            >
              <div>
                {/* Store Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: store.isOnShift ? '#ECFDF5' : '#F1F5F9',
                        color: store.isOnShift ? '#10B981' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Store size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                        {store.name}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.70rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#FF3B98',
                          fontWeight: 700,
                        }}
                      >
                        {store.code}
                      </span>
                    </div>
                  </div>

                  {/* Shift Badge */}
                  <span
                    className={`badge ${store.isOnShift ? 'badge-emerald' : 'badge-navy'}`}
                  >
                    {store.isOnShift ? 'LIVE ON SHIFT' : 'OFFLINE'}
                  </span>
                </div>

                {/* Details */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#FF3B98" />
                    <span>{store.address || 'Address not configured'}</span>
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                    Area: <strong>{store.areaName || store.cityName || 'Ahmedabad Hub'}</strong> • Pincode: <strong>{store.pincode || '380015'}</strong>
                  </p>
                </div>

                {/* Operational Pill Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#94A3B8', fontWeight: 700 }}>STAFF ON DUTY:</span>
                    <p style={{ fontSize: '0.84rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      {store.staffOnShift || 2} / {store.staffTotal || 4} pickers
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#94A3B8', fontWeight: 700 }}>SERVICE RADIUS:</span>
                    <p style={{ fontSize: '0.84rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      {store.serviceRadiusKm || 4.5} km (9 mins)
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                {/* Shift Toggle Button */}
                <button
                  onClick={() => handleToggleShift(store)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: store.isOnShift ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                    backgroundColor: store.isOnShift ? '#ECFDF5' : '#FFFFFF',
                    color: store.isOnShift ? '#065F46' : '#64748B',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Power size={13} color={store.isOnShift ? '#10B981' : '#94A3B8'} />
                  <span>{store.isOnShift ? 'Turn Shift Off' : 'Turn Shift On'}</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Reset Password */}
                  <button
                    onClick={() => openResetPassword(store)}
                    title="Reset Store Credentials"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px' }}
                  >
                    <KeyRound size={13} />
                    <span>Credentials</span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(store)}
                    title="Delete Store"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      padding: '6px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Store / Shop Name</th>
                <th>City & Area</th>
                <th>Address</th>
                <th>Status</th>
                <th>Shift State</th>
                <th>Staff</th>
                <th>Radius</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((store) => (
                <tr key={store.id || store._id}>
                  <td style={{ fontWeight: 800, color: '#FF3B98', fontFamily: 'var(--font-mono)' }}>
                    {store.code}
                  </td>
                  <td style={{ fontWeight: 800, color: '#071B52' }}>
                    {store.name}
                  </td>
                  <td>
                    {store.cityName || store.city || 'Ahmedabad'}
                    <span style={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block' }}>
                      {store.areaName || 'Metro Zone'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px', fontSize: '0.80rem', color: '#64748B' }}>
                    {store.address}
                  </td>
                  <td>
                    <span className={`badge ${store.isActive !== false ? 'badge-emerald' : 'badge-red'}`}>
                      {store.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${store.isOnShift ? 'badge-emerald' : 'badge-navy'}`}>
                      {store.isOnShift ? 'ON SHIFT' : 'OFFLINE'}
                    </span>
                  </td>
                  <td>{store.staffOnShift || 2} / {store.staffTotal || 4}</td>
                  <td>{store.serviceRadiusKm || 4.5} km</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleToggleShift(store)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        {store.isOnShift ? 'Turn Off' : 'Turn On'}
                      </button>
                      <button
                        onClick={() => openResetPassword(store)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => handleDelete(store)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetStoreItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#FF3B98" />
                <h4 style={{ margin: 0, color: '#071B52' }}>Store Credentials Reset</h4>
              </div>
              <button
                onClick={() => setResetStoreItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '16px' }}>
                Generate or assign a new operator login password for <strong>{resetStoreItem.name}</strong>.
              </p>

              {resetSuccessMessage ? (
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    textAlign: 'center',
                  }}
                >
                  {resetSuccessMessage}
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label className="form-label">Store Login ID</label>
                    <input
                      type="text"
                      disabled
                      value={resetStoreItem.loginId || `womup_${resetStoreItem.code.toLowerCase()}`}
                      className="form-input"
                      style={{ background: '#F8FAFC', color: '#64748B' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="text"
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {!resetSuccessMessage && (
              <div className="modal-footer">
                <button
                  onClick={() => setResetStoreItem(null)}
                  className="btn btn-secondary"
                  disabled={resetting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResetPassword}
                  className="btn btn-pink"
                  disabled={resetting}
                >
                  {resetting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
