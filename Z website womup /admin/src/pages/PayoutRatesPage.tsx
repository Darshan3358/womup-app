import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  MapPin,
  Building2,
  Globe,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  Calculator,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { PayoutRateItem } from '../types/admin';
import { AdminApiService } from '../services/api';

export const PayoutRatesPage: React.FC = () => {
  const {
    cities,
    areas,
    savePayoutRate,
    deletePayoutRate,
    simulatePayout,
    refreshData,
  } = useAdmin();

  // Primary list state
  const [rates, setRates] = useState<any[]>([
    {
      id: 'global_default',
      scope: 'GLOBAL',
      ratePerKm: 12,
      minimumPayout: 35,
      maximumPayout: 160,
      isActive: true,
      description: 'Universal fallback payout rate for all standard deliveries',
    },
    {
      id: 'city_amd',
      scope: 'CITY',
      cityName: 'Ahmedabad',
      ratePerKm: 14,
      minimumPayout: 40,
      maximumPayout: 180,
      isActive: true,
      description: 'Metropolitan express rate for Ahmedabad city limits',
    },
    {
      id: 'area_prahlad',
      scope: 'AREA',
      cityName: 'Ahmedabad',
      areaName: 'Prahlad Nagar',
      ratePerKm: 16,
      minimumPayout: 45,
      maximumPayout: 200,
      isActive: true,
      description: 'High-density premium delivery incentive zone',
    },
  ]);

  // Global Rate Inline Editing
  const [globalRateInput, setGlobalRateInput] = useState<string>('12');
  const [globalMinInput, setGlobalMinInput] = useState<string>('35');
  const [globalMaxInput, setGlobalMaxInput] = useState<string>('160');
  const [isEditingGlobal, setIsEditingGlobal] = useState<boolean>(false);
  const [savingGlobal, setSavingGlobal] = useState<boolean>(false);

  // Filters
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'CITY' | 'AREA'>('ALL');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [modalScope, setModalScope] = useState<'CITY' | 'AREA'>('AREA');
  const [modalCityName, setModalCityName] = useState<string>('Ahmedabad');
  const [modalAreaName, setModalAreaName] = useState<string>('Prahlad Nagar');
  const [modalRatePerKm, setModalRatePerKm] = useState<string>('15');
  const [modalMinPayout, setModalMinPayout] = useState<string>('40');
  const [modalMaxPayout, setModalMaxPayout] = useState<string>('180');
  const [modalDescription, setModalDescription] = useState<string>('');
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);

  // Delivery Simulator
  const [simCityName, setSimCityName] = useState<string>('Ahmedabad');
  const [simAreaName, setSimAreaName] = useState<string>('Prahlad Nagar');
  const [simDistanceKm, setSimDistanceKm] = useState<string>('4.5');
  const [simResult, setSimResult] = useState<any>(null);

  // Filtered rates
  const filteredRates = rates.filter((r) => {
    if (scopeFilter !== 'ALL' && r.scope !== scopeFilter) return false;
    if (selectedCityFilter !== 'ALL' && r.cityName && r.cityName.toLowerCase() !== selectedCityFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchScope = r.scope.toLowerCase().includes(q);
      const matchCity = r.cityName && r.cityName.toLowerCase().includes(q);
      const matchArea = r.areaName && r.areaName.toLowerCase().includes(q);
      const matchDesc = r.description && r.description.toLowerCase().includes(q);
      if (!matchScope && !matchCity && !matchArea && !matchDesc) return false;
    }
    return true;
  });

  // Live backend rates loader
  const loadRates = async () => {
    try {
      const res = await AdminApiService.fetchPayoutRates();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setRates(res.data);
        const globalDoc = res.globalRate || res.data.find((r: any) => r.scope === 'GLOBAL');
        if (globalDoc) {
          setGlobalRateInput(String(globalDoc.ratePerKm || 12));
          setGlobalMinInput(String(globalDoc.minimumPayout || 35));
          setGlobalMaxInput(String(globalDoc.maximumPayout || 160));
        }
      }
    } catch (e) {
      console.warn('Could not load rates from backend:', e);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  // Simulator calculation
  const runSimulation = () => {
    const dist = parseFloat(simDistanceKm) || 4.5;
    // Find area override
    const areaMatch = rates.find((r) => r.scope === 'AREA' && r.areaName?.toLowerCase() === simAreaName.toLowerCase() && r.isActive);
    const cityMatch = rates.find((r) => r.scope === 'CITY' && r.cityName?.toLowerCase() === simCityName.toLowerCase() && r.isActive);
    const globalMatch = rates.find((r) => r.scope === 'GLOBAL') || { ratePerKm: 12, minimumPayout: 35, maximumPayout: 160 };

    const effective = areaMatch || cityMatch || globalMatch;
    const rawEarning = dist * effective.ratePerKm;
    const capped = Math.max(effective.minimumPayout, Math.min(effective.maximumPayout, rawEarning));

    setSimResult({
      scope: effective.scope,
      ratePerKm: effective.ratePerKm,
      distance: dist,
      baseEarning: Math.round(rawEarning),
      finalPayout: Math.round(capped),
      minCap: effective.minimumPayout,
      maxCap: effective.maximumPayout,
    });
  };

  useEffect(() => {
    runSimulation();
  }, [simCityName, simAreaName, simDistanceKm, rates]);

  // Global rate save
  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    const updated = {
      id: 'global_default',
      scope: 'GLOBAL',
      ratePerKm: parseFloat(globalRateInput) || 12,
      minimumPayout: parseFloat(globalMinInput) || 35,
      maximumPayout: parseFloat(globalMaxInput) || 160,
      isActive: true,
      description: 'Universal fallback payout rate for all standard deliveries',
    };
    await savePayoutRate(updated);
    await loadRates();
    setSavingGlobal(false);
    setIsEditingGlobal(false);
  };

  // Add / Edit Modal Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    const payload = {
      id: editingItem ? editingItem.id : `pr_${Date.now()}`,
      scope: modalScope,
      cityName: modalCityName,
      areaName: modalScope === 'AREA' ? modalAreaName : undefined,
      ratePerKm: parseFloat(modalRatePerKm) || 15,
      minimumPayout: parseFloat(modalMinPayout) || 40,
      maximumPayout: parseFloat(modalMaxPayout) || 180,
      description: modalDescription || `${modalScope} override rate`,
      isActive: true,
    };

    await savePayoutRate(payload);
    await loadRates();
    setModalSubmitting(false);
    setShowModal(false);
  };

  const handleDelete = async (rateId: string) => {
    if (window.confirm('Delete this payout rate override? Delivery calculations will fallback to city or global rate.')) {
      await deletePayoutRate(rateId);
      await loadRates();
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setModalScope('AREA');
    setModalCityName(cities[0]?.name || 'Ahmedabad');
    setModalAreaName(areas[0]?.name || 'Prahlad Nagar');
    setModalRatePerKm('15');
    setModalMinPayout('40');
    setModalMaxPayout('180');
    setModalDescription('');
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setModalScope(item.scope);
    setModalCityName(item.cityName || 'Ahmedabad');
    setModalAreaName(item.areaName || 'Prahlad Nagar');
    setModalRatePerKm(String(item.ratePerKm));
    setModalMinPayout(String(item.minimumPayout));
    setModalMaxPayout(String(item.maximumPayout));
    setModalDescription(item.description || '');
    setShowModal(true);
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
            Rider Payout Rates & Earnings Engine
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Base per-km rates, min/max guarantees, regional surge incentives, and live simulator
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} />
          <span>+ Add Payout Override</span>
        </button>
      </div>

      {/* Global Fallback Rate Card */}
      <div
        className="admin-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          borderLeft: '4px solid #4F46E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4F46E5',
            }}
          >
            <Globe size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '1.05rem', color: '#071B52' }}>
                Universal Global Fallback Payout
              </strong>
              <span className="badge badge-emerald">ACTIVE DEFAULT</span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.80rem', color: '#64748B' }}>
              Applies across all cities & zones when no specific local override is present
            </p>
          </div>
        </div>

        {!isEditingGlobal ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.70rem', color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                PER KM RATE
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#071B52' }}>₹{globalRateInput} / km</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.70rem', color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                MIN - MAX GUARANTEE
              </span>
              <strong style={{ fontSize: '1.05rem', color: '#059669' }}>
                ₹{globalMinInput} - ₹{globalMaxInput}
              </strong>
            </div>
            <button
              onClick={() => setIsEditingGlobal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit2 size={13} />
              <span>Edit Global Rate</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>₹/KM</span>
              <input
                type="number"
                value={globalRateInput}
                onChange={(e) => setGlobalRateInput(e.target.value)}
                style={{ width: '60px', padding: '4px', fontSize: '0.82rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>MIN (₹)</span>
              <input
                type="number"
                value={globalMinInput}
                onChange={(e) => setGlobalMinInput(e.target.value)}
                style={{ width: '60px', padding: '4px', fontSize: '0.82rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>MAX (₹)</span>
              <input
                type="number"
                value={globalMaxInput}
                onChange={(e) => setGlobalMaxInput(e.target.value)}
                style={{ width: '60px', padding: '4px', fontSize: '0.82rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
              />
            </div>
            <button
              onClick={handleSaveGlobal}
              disabled={savingGlobal}
              className="btn btn-primary btn-sm"
            >
              {savingGlobal ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditingGlobal(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Delivery Payout Simulator Box (100% App Parity) */}
      <div
        className="admin-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #FDF4FF 0%, #FAF5FF 100%)',
          border: '1px solid #F5D0FE',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Calculator size={18} color="#C026D3" />
          <h4 style={{ margin: 0, color: '#701A75', fontSize: '0.96rem' }}>
            Interactive Delivery Payout Simulator
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#701A75', textTransform: 'uppercase' }}>
              Select City
            </label>
            <select
              value={simCityName}
              onChange={(e) => setSimCityName(e.target.value)}
              className="form-select"
              style={{ marginTop: '4px', fontSize: '0.82rem' }}
            >
              {cities.map((c) => (
                <option key={c.id || c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#701A75', textTransform: 'uppercase' }}>
              Select Service Area
            </label>
            <select
              value={simAreaName}
              onChange={(e) => setSimAreaName(e.target.value)}
              className="form-select"
              style={{ marginTop: '4px', fontSize: '0.82rem' }}
            >
              {areas.map((a) => (
                <option key={a.id || a._id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#701A75', textTransform: 'uppercase' }}>
              Delivery Trip Distance (Km)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={simDistanceKm}
              onChange={(e) => setSimDistanceKm(e.target.value)}
              className="form-input"
              style={{ marginTop: '4px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Simulated Result Box */}
          {simResult && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E879F9',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.68rem', color: '#701A75', fontWeight: 700, textTransform: 'uppercase' }}>
                  Applied Rule: <strong style={{ color: '#C026D3' }}>{simResult.scope} OVERRIDE</strong>
                </span>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  {simResult.distance} km × ₹{simResult.ratePerKm}/km
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '1.25rem', color: '#071B52', fontWeight: 900 }}>
                  ₹{simResult.finalPayout}
                </strong>
                <span style={{ fontSize: '0.68rem', color: '#059669', display: 'block' }}>
                  Guaranteed Payout
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div
        className="admin-card"
        style={{
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={15}
            color="#94A3B8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search rate overrides by scope, city, or territory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            Scope:
          </span>
          {(['ALL', 'CITY', 'AREA'] as const).map((sc) => (
            <button
              key={sc}
              onClick={() => setScopeFilter(sc)}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: scopeFilter === sc ? '1px solid #071B52' : '1px solid #E2E8F0',
                background: scopeFilter === sc ? '#071B52' : '#F8FAFC',
                color: scopeFilter === sc ? '#FFFFFF' : '#64748B',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {sc}
            </button>
          ))}
        </div>
      </div>

      {/* Payout Rates Master Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Scope Tier</th>
              <th>Territory / Coverage</th>
              <th>Rate / Km</th>
              <th>Min Payout</th>
              <th>Max Payout</th>
              <th>Description / Notes</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRates.map((r) => (
              <tr key={r.id}>
                <td>
                  <span
                    className={`badge ${
                      r.scope === 'GLOBAL'
                        ? 'badge-navy'
                        : r.scope === 'CITY'
                        ? 'badge-blue'
                        : 'badge-pink'
                    }`}
                  >
                    {r.scope} RULE
                  </span>
                </td>

                <td style={{ fontWeight: 800, color: '#071B52' }}>
                  {r.scope === 'GLOBAL'
                    ? 'Universal Platform Fallback'
                    : r.scope === 'CITY'
                    ? `${r.cityName} Metro Region`
                    : `${r.areaName}, ${r.cityName}`}
                </td>

                <td>
                  <strong style={{ fontSize: '0.90rem', color: '#071B52' }}>
                    ₹{r.ratePerKm} / km
                  </strong>
                </td>

                <td style={{ fontWeight: 700, color: '#059669' }}>₹{r.minimumPayout}</td>
                <td style={{ fontWeight: 700, color: '#6D28D9' }}>₹{r.maximumPayout}</td>

                <td style={{ fontSize: '0.80rem', color: '#64748B', maxWidth: '240px' }}>
                  {r.description || 'Standard compensation schedule'}
                </td>

                <td>
                  <span className="badge badge-emerald">ACTIVE RULE</span>
                </td>

                <td style={{ textAlign: 'right' }}>
                  {r.scope !== 'GLOBAL' && (
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => openEditModal(r)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Rate"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#DC2626' }}
                        title="Delete Rate Override"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT PAYOUT OVERRIDE MODAL                                          */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} color="#FF3B98" />
                <h4 style={{ margin: 0, color: '#071B52' }}>
                  {editingItem ? 'Edit Payout Override' : 'New Payout Rate Override'}
                </h4>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Override Scope *</label>
                  <select
                    value={modalScope}
                    onChange={(e) => setModalScope(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="AREA">AREA (Specific Service Zone)</option>
                    <option value="CITY">CITY (All Zones in City)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target City Market *</label>
                  <select
                    value={modalCityName}
                    onChange={(e) => setModalCityName(e.target.value)}
                    className="form-select"
                  >
                    {cities.map((c) => (
                      <option key={c.id || c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {modalScope === 'AREA' && (
                  <div className="form-group">
                    <label className="form-label">Target Service Area *</label>
                    <select
                      value={modalAreaName}
                      onChange={(e) => setModalAreaName(e.target.value)}
                      className="form-select"
                    >
                      {areas.map((a) => (
                        <option key={a.id || a._id} value={a.name}>
                          {a.name} ({a.cityName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label">Rate / Km (₹)</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="100"
                      value={modalRatePerKm}
                      onChange={(e) => setModalRatePerKm(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Pay (₹)</label>
                    <input
                      type="number"
                      required
                      min="10"
                      value={modalMinPayout}
                      onChange={(e) => setModalMinPayout(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Pay (₹)</label>
                    <input
                      type="number"
                      required
                      min="50"
                      value={modalMaxPayout}
                      onChange={(e) => setModalMaxPayout(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Internal Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Monsoon surge compensation in Prahlad Nagar"
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={modalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? 'Saving...' : 'Commit Rate Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
