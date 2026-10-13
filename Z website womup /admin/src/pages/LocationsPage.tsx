import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Plus,
  ShieldCheck,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Lock,
  Layers,
  Clock,
  X,
  Zap,
  Store,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { CityItem, AreaItem } from '../types/admin';

export const LocationsPage: React.FC = () => {
  const {
    cities,
    areas,
    stores,
    createCity,
    updateCity,
    deleteCity,
    createArea,
    updateArea,
    deleteArea,
    refreshData,
    isSyncing,
    setActiveTab,
    setShowAddStoreModal,
  } = useAdmin();

  // Sub-tabs: 'Cities' vs 'Areas' (Matching screenshot)
  const [activeSubTab, setActiveSubTab] = useState<'Cities' | 'Areas'>('Areas');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('All');
  const [storeStatusFilter, setStoreStatusFilter] = useState<'All' | 'Assigned' | 'Available'>('All');

  // City Modal State
  const [showCityModal, setShowCityModal] = useState(false);
  const [editingCity, setEditingCity] = useState<CityItem | null>(null);
  const [cityName, setCityName] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [cityState, setCityState] = useState('Gujarat');
  const [cityStatus, setCityStatus] = useState<'Active' | 'Inactive'>('Active');
  const [citySubmitting, setCitySubmitting] = useState(false);

  // Area Modal State
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaItem | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [areaCityName, setAreaCityName] = useState('Ahmedabad');
  const [areaSla, setAreaSla] = useState('9');
  const [areaRadius, setAreaRadius] = useState('3.5');
  const [areaLat, setAreaLat] = useState('23.0225');
  const [areaLng, setAreaLng] = useState('72.5714');
  const [areaPincodes, setAreaPincodes] = useState('380015');
  const [areaMaxStores, setAreaMaxStores] = useState('1');
  const [areaRoutingStrategy, setAreaRoutingStrategy] = useState('NEAREST');
  const [areaSubmitting, setAreaSubmitting] = useState(false);

  // KPIs Metrics Calculation
  const totalCities = cities.length;
  const activeCitiesCount = cities.filter((c) => c.isActive !== false).length;
  const totalAreas = areas.length;
  const totalStoreCapacity = areas.reduce((sum, a) => sum + (Number(a.maxStores) || 1), 0);
  const activeDarkStores = stores.filter((s) => s.isActive !== false).length;
  const totalConfiguredStores = stores.length;
  const availableSlots = Math.max(0, totalStoreCapacity - totalConfiguredStores);

  // Filtered Cities
  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
      );
    });
  }, [cities, search]);

  // Filtered Areas
  const filteredAreas = useMemo(() => {
    return areas.filter((a) => {
      const aId = a.id || a._id;
      const matchingStores = stores.filter((s) => {
        if (s.areaId && aId && String(s.areaId) === String(aId)) return true;
        if (s.areaName && a.name && s.areaName.toLowerCase() === a.name.toLowerCase()) return true;
        return false;
      });

      const currentCount = matchingStores.length;
      const isAssigned = currentCount > 0;

      // 1. City Filter
      if (selectedCityFilter !== 'All') {
        const matchesCityName =
          (a.cityName || '').toLowerCase() === selectedCityFilter.toLowerCase();
        const matchesCityId =
          a.cityId && String(a.cityId) === String(selectedCityFilter);
        if (!matchesCityName && !matchesCityId) return false;
      }

      // 2. Store Status Filter
      if (storeStatusFilter === 'Assigned' && !isAssigned) return false;
      if (storeStatusFilter === 'Available' && isAssigned) return false;

      // 3. Search Query
      const q = search.toLowerCase().trim();
      if (q) {
        const nameMatch = a.name.toLowerCase().includes(q);
        const codeMatch = (a.code || '').toLowerCase().includes(q);
        const cityMatch = (a.cityName || '').toLowerCase().includes(q);
        const storeMatch = matchingStores.some((s) =>
          s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))
        );
        const pincodeMatch = (a.pincodes || []).some((pin) => pin.includes(q));
        if (!nameMatch && !codeMatch && !cityMatch && !storeMatch && !pincodeMatch) return false;
      }

      return true;
    });
  }, [areas, stores, selectedCityFilter, storeStatusFilter, search]);

  // City Handlers
  const openAddCity = () => {
    setEditingCity(null);
    setCityName('');
    setCityCode('');
    setCityState('Gujarat');
    setCityStatus('Active');
    setShowCityModal(true);
  };

  const openEditCity = (c: CityItem) => {
    setEditingCity(c);
    setCityName(c.name);
    setCityCode(c.code || '');
    setCityState(c.state || 'Gujarat');
    setCityStatus(c.isActive !== false ? 'Active' : 'Inactive');
    setShowCityModal(true);
  };

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) {
      alert('Please enter city name');
      return;
    }
    setCitySubmitting(true);
    const cleanCode = cityCode.trim().toUpperCase() || cityName.trim().substring(0, 3).toUpperCase();

    try {
      if (editingCity) {
        await updateCity(editingCity.id || editingCity._id || '', {
          name: cityName.trim(),
          code: cleanCode,
          state: cityState.trim(),
          status: cityStatus,
        });
      } else {
        await createCity({
          name: cityName.trim(),
          code: cleanCode,
          state: cityState.trim(),
          status: cityStatus,
        });
      }
      setShowCityModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save city');
    } finally {
      setCitySubmitting(false);
    }
  };

  const handleDeleteCity = async (c: CityItem) => {
    const cityId = c.id || c._id || '';
    const linkedAreas = areas.filter(
      (a) =>
        (a.cityId && String(a.cityId) === String(cityId)) ||
        (a.cityName && a.cityName.toLowerCase() === c.name.toLowerCase())
    );

    if (linkedAreas.length > 0) {
      alert(`Cannot delete "${c.name}" because ${linkedAreas.length} area(s) are linked to it. Delete or reassign those areas first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete city "${c.name}"?`)) {
      await deleteCity(cityId);
    }
  };

  // Area Handlers
  const openAddArea = () => {
    setEditingArea(null);
    setAreaName('');
    setAreaCode('');
    const defaultCity = cities.find((c) => c.name === selectedCityFilter) || cities[0];
    setAreaCityName(defaultCity?.name || 'Ahmedabad');
    setAreaSla('9');
    setAreaRadius('3.5');
    setAreaLat('23.0225');
    setAreaLng('72.5714');
    setAreaPincodes('380015');
    setAreaMaxStores('1');
    setAreaRoutingStrategy('NEAREST');
    setShowAreaModal(true);
  };

  const openEditArea = (a: AreaItem) => {
    setEditingArea(a);
    setAreaName(a.name);
    setAreaCode(a.code || '');
    setAreaCityName(a.cityName || 'Ahmedabad');
    setAreaSla(String(a.defaultDeliveryMinutes || 9));
    setAreaRadius(String(a.radiusKm || 3.5));
    setAreaLat(String((a as any).latitude || '23.0225'));
    setAreaLng(String((a as any).longitude || '72.5714'));
    setAreaPincodes((a.pincodes || []).join(', '));
    setAreaMaxStores(String(a.maxStores || 1));
    setAreaRoutingStrategy((a as any).routingStrategy || 'NEAREST');
    setShowAreaModal(true);
  };

  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) {
      alert('Please enter area name');
      return;
    }
    setAreaSubmitting(true);
    const pins = areaPincodes.split(',').map((p) => p.trim()).filter(Boolean);
    const selectedCityObj = cities.find(
      (c) => c.name.toLowerCase() === areaCityName.toLowerCase()
    );

    const payload: any = {
      name: areaName.trim(),
      code: areaCode.trim().toUpperCase() || areaName.trim().toUpperCase().replace(/\s+/g, '_'),
      cityName: areaCityName,
      cityId: selectedCityObj?.id || selectedCityObj?._id,
      defaultDeliveryMinutes: parseInt(areaSla, 10) || 9,
      radiusKm: parseFloat(areaRadius) || 3.5,
      latitude: parseFloat(areaLat) || 23.0225,
      longitude: parseFloat(areaLng) || 72.5714,
      pincodes: pins.length > 0 ? pins : ['380015'],
      maxStores: parseInt(areaMaxStores, 10) || 1,
      routingStrategy: areaRoutingStrategy,
    };

    try {
      if (editingArea) {
        await updateArea(editingArea.id || editingArea._id || '', payload);
      } else {
        await createArea(payload);
      }
      setShowAreaModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save area');
    } finally {
      setAreaSubmitting(false);
    }
  };

  const handleDeleteArea = async (a: AreaItem) => {
    const aId = a.id || a._id;
    const matchingStores = stores.filter((s) => {
      if (s.areaId && aId && String(s.areaId) === String(aId)) return true;
      if (s.areaName && a.name && s.areaName.toLowerCase() === a.name.toLowerCase()) return true;
      return false;
    });

    if (matchingStores.length > 0) {
      alert(
        `Cannot delete area "${a.name}" because active store "${matchingStores[0].name}" is assigned to it. Reassign or delete the store first.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete area "${a.name}"? This action cannot be undone.`)) {
      await deleteArea(a.id || a._id || '');
    }
  };

  const handleViewCityAreas = (cityName: string) => {
    setSelectedCityFilter(cityName);
    setActiveSubTab('Areas');
  };

  return (
    <div style={{ padding: '0 0 40px 0', maxWidth: '100%' }}>
      {/* ================= 1. TOP HEADER BANNER (SCREENSHOT MATCH) ================= */}
      <div
        style={{
          background: 'linear-gradient(135deg, #060B24 0%, #0E1A40 50%, #151F4D 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: '20px',
          boxShadow: '0 10px 25px -5px rgba(6, 11, 36, 0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, rgba(139,92,246,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            {/* Top Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  color: '#E0E7FF',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#EC4899',
                    boxShadow: '0 0 8px #EC4899',
                  }}
                />
                MULTI-CITY ARCHITECTURE
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#34D399',
                }}
              >
                <ShieldCheck size={12} color="#34D399" />
                Multi-Store Capacity Architecture
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Location Management
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
              City [Admin] → Area (Multi-Store Capacity) → Dark Stores Pool
            </p>
          </div>

          {/* Sync DB Button */}
          <button
            onClick={() => refreshData()}
            disabled={isSyncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              color: '#F472B6',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin-icon' : ''} color="#F472B6" />
            <span>{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
          </button>
        </div>

        {/* 4 KPI CARDS GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
              {totalCities}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
              CITIES MASTER
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
              {totalAreas}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
              TOTAL AREAS
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#C084FC', lineHeight: 1.1 }}>
              {activeDarkStores}/{totalStoreCapacity}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
              STORES ACTIVE
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34D399', lineHeight: 1.1 }}>
              {availableSlots}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
              SLOTS AVAILABLE
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. SUB-TABS NAVIGATION & PRIMARY ACTION ================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        {/* Sub-tab pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <button
            onClick={() => {
              setActiveSubTab('Cities');
              setSearch('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeSubTab === 'Cities' ? '#060B24' : 'transparent',
              color: activeSubTab === 'Cities' ? '#FFFFFF' : '#64748B',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={16} />
            <span>Cities Master ({cities.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('Areas');
              setSearch('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '9px',
              border: 'none',
              background: activeSubTab === 'Areas' ? '#060B24' : 'transparent',
              color: activeSubTab === 'Areas' ? '#FFFFFF' : '#64748B',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MapPin size={16} />
            <span>Areas & Store Allocations ({areas.length})</span>
          </button>
        </div>

        {/* Big Action Button (Matching purple gradient button in screenshot) */}
        <button
          onClick={activeSubTab === 'Cities' ? openAddCity : openAddArea}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #A855F7 0%, #C026D3 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
        >
          <Plus size={18} strokeWidth={3} />
          <span>{activeSubTab === 'Cities' ? '+ Add City' : '+ Add Area'}</span>
        </button>
      </div>

      {/* ================= 3. SEARCH & FILTER CHIPS ================= */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '14px 16px',
          marginBottom: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        {/* Search input with icon */}
        <div style={{ position: 'relative', marginBottom: activeSubTab === 'Areas' ? '12px' : 0 }}>
          <Search
            size={16}
            color="#94A3B8"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder={
              activeSubTab === 'Cities'
                ? 'Search cities by name, code, or state...'
                : 'Search areas by name, code, pincode, or store...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 38px 10px 40px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              fontSize: '0.86rem',
              color: '#0F172A',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                padding: '4px',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Chips (Areas mode only) */}
        {activeSubTab === 'Areas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* City filter chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', flexShrink: 0 }}>
                City:
              </span>
              <button
                onClick={() => setSelectedCityFilter('All')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedCityFilter === 'All' ? '#060B24' : '#F1F5F9',
                  color: selectedCityFilter === 'All' ? '#FFFFFF' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                All
              </button>
              {cities.map((c) => {
                const isSelected = selectedCityFilter.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.id || c._id || c.name}
                    onClick={() => setSelectedCityFilter(c.name)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      border: 'none',
                      background: isSelected ? '#060B24' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {/* Store status filter chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', flexShrink: 0 }}>
                Store:
              </span>
              {(['All', 'Assigned', 'Available'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStoreStatusFilter(status)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    background: storeStatusFilter === status ? '#060B24' : '#F1F5F9',
                    color: storeStatusFilter === status ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. SECTION HEADING ================= */}
      {activeSubTab === 'Areas' ? (
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>
            Operational Areas ({filteredAreas.length})
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
            Strict 1-Store-Per-Area rule guarantees instant 9-minute SLA fulfillment without inventory collision.
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>
            Configured Cities ({filteredCities.length})
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
            Master Cities list. Dark stores & vendor registrations select from this list.
          </p>
        </div>
      )}

      {/* ================= 5. MAIN CONTENT CARDS ================= */}

      {/* 5A. AREAS CARDS (MATCHING SCREENSHOT 1) */}
      {activeSubTab === 'Areas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAreas.length === 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                border: '1px solid #E2E8F0',
                color: '#94A3B8',
              }}
            >
              <MapPin size={42} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334155' }}>No Areas Found</div>
              <div style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                Try adjusting your search query or city filters.
              </div>
            </div>
          ) : (
            filteredAreas.map((area) => {
              const aId = area.id || area._id;
              const matchingStores = stores.filter((s) => {
                if (s.areaId && aId && String(s.areaId) === String(aId)) return true;
                if (s.areaName && area.name && s.areaName.toLowerCase() === area.name.toLowerCase()) return true;
                return false;
              });

              const maxStores = Number(area.maxStores) || 1;
              const currentCount = matchingStores.length;
              const availableSlots = Math.max(0, maxStores - currentCount);
              const isFull = currentCount >= maxStores;
              const percent = Math.min(100, Math.round((currentCount / maxStores) * 100));

              return (
                <div
                  key={aId || area.name}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Top Row: Icon, Name, City, Capacity Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: isFull
                            ? '#FEE2E2'
                            : currentCount > 0
                            ? '#FEF3C7'
                            : '#D1FAE5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <MapPin
                          size={20}
                          color={isFull ? '#DC2626' : currentCount > 0 ? '#D97706' : '#10B981'}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                          {area.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Building2 size={12} color="#94A3B8" />
                          <span>{area.cityName || 'Ahmedabad'}</span>
                          <span>·</span>
                          <span style={{ fontWeight: 600, color: '#475569' }}>{area.code}</span>
                        </div>
                      </div>
                    </div>

                    {/* Capacity Pill Badge */}
                    {isFull ? (
                      <div
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                        }}
                      >
                        <Lock size={11} />
                        <span>{currentCount}/{maxStores} FULL</span>
                      </div>
                    ) : currentCount > 0 ? (
                      <div
                        style={{
                          background: '#FEF3C7',
                          color: '#D97706',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                        }}
                      >
                        <Store size={11} />
                        <span>
                          {currentCount}/{maxStores} STORES ({availableSlots} SLOT{availableSlots > 1 ? 'S' : ''})
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: '#D1FAE5',
                          color: '#059669',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={11} />
                        <span>0/{maxStores} AVAILABLE</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity Progress Bar Section */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px' }}>
                      <span style={{ color: '#475569' }}>
                        Capacity: {currentCount} of {maxStores} stores
                      </span>
                      <span style={{ color: isFull ? '#DC2626' : '#10B981' }}>
                        {isFull ? 'No slots left' : `${availableSlots} slot${availableSlots > 1 ? 's' : ''} available`}
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '5px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.max(percent, currentCount > 0 ? 15 : 0)}%`,
                          height: '100%',
                          background: isFull ? '#DC2626' : currentCount > 0 ? '#F59E0B' : '#10B981',
                          borderRadius: '10px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Stores In Area Box */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                    }}
                  >
                    {matchingStores.length > 0 ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            STORES IN AREA ({matchingStores.length})
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6366F1' }}>
                            Routing: {(area as any).routingStrategy || 'NEAREST'}
                          </span>
                        </div>

                        {matchingStores.map((st) => (
                          <div
                            key={st.id || st._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '6px 0',
                              borderBottom: matchingStores.length > 1 ? '1px dashed #E2E8F0' : 'none',
                            }}
                          >
                            <Store size={15} color="#8B5CF6" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {st.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span>Code: {st.code || st.loginId}</span>
                                <span>•</span>
                                <span style={{ color: '#4F46E5', fontWeight: 600 }}>
                                  📍 {st.coordinates ? `${st.coordinates[1]?.toFixed(4)}, ${st.coordinates[0]?.toFixed(4)}` : (st as any).latitude ? `${(st as any).latitude}, ${(st as any).longitude}` : 'Physical GPS set'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {!isFull && (
                          <button
                            onClick={() => setShowAddStoreModal(true)}
                            style={{
                              marginTop: '8px',
                              background: 'transparent',
                              border: 'none',
                              color: '#2563EB',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            + + Add Store ({availableSlots} slot{availableSlots > 1 ? 's' : ''} left)
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.78rem', fontWeight: 600 }}>
                        <CheckCircle2 size={15} color="#10B981" />
                        <span>Ready for store allocation. Up to {maxStores} store{maxStores > 1 ? 's' : ''} can operate in this area.</span>
                      </div>
                    )}
                  </div>

                  {/* Metrics Row: SLA, Radius, Pincode */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '0.78rem',
                      color: '#64748B',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} color="#64748B" />
                      <span>{area.defaultDeliveryMinutes || 9} min SLA</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Zap size={14} color="#64748B" />
                      <span>{area.radiusKm || 3.5} km radius</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Layers size={14} color="#64748B" />
                      <span>{area.pincodes && area.pincodes.length > 0 ? area.pincodes[0] : '380015'}</span>
                    </div>
                  </div>

                  {/* Footer Actions: Edit Zone & Delete */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid #F1F5F9',
                    }}
                  >
                    <button
                      onClick={() => openEditArea(area)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    >
                      <Edit2 size={13} color="#0F172A" />
                      <span>Edit Zone</span>
                    </button>

                    <button
                      onClick={() => handleDeleteArea(area)}
                      disabled={currentCount > 0}
                      title={currentCount > 0 ? 'Cannot delete area with assigned store' : 'Delete area'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: currentCount > 0 ? '#CBD5E1' : '#EF4444',
                        cursor: currentCount > 0 ? 'not-allowed' : 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5B. CITIES CARDS (MATCHING SCREENSHOT 2) */}
      {activeSubTab === 'Cities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCities.length === 0 ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                border: '1px solid #E2E8F0',
                color: '#94A3B8',
              }}
            >
              <Building2 size={42} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334155' }}>No Cities Found</div>
              <div style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                Try adjusting your search query or click "+ Add City" above.
              </div>
            </div>
          ) : (
            filteredCities.map((city) => {
              const cityIdStr = city.id || city._id || '';
              const cityAreas = areas.filter((a) => {
                if (a.cityId && cityIdStr && String(a.cityId) === String(cityIdStr)) return true;
                if (a.cityName && city.name && a.cityName.toLowerCase() === city.name.toLowerCase()) return true;
                return false;
              });

              const cityStores = stores.filter((s) => {
                if (s.cityId && cityIdStr && String(s.cityId) === String(cityIdStr)) return true;
                if (s.cityName && city.name && s.cityName.toLowerCase() === city.name.toLowerCase()) return true;
                return false;
              });

              const onlineStores = cityStores.filter((s) => s.isActive !== false);

              return (
                <div
                  key={cityIdStr || city.name}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Top Row: Name, Code, Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: '#EEF2FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={20} color="#6366F1" />
                      </div>

                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                          {city.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                          {city.state || 'Gujarat'} · Code: {city.code}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <div
                      style={{
                        background: city.isActive !== false ? '#D1FAE5' : '#F1F5F9',
                        color: city.isActive !== false ? '#059669' : '#64748B',
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: city.isActive !== false ? '#10B981' : '#94A3B8',
                        }}
                      />
                      <span>{city.isActive !== false ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  {/* Middle Row: Stats Grid (AREAS, DARK STORES, ONLINE) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>
                        {cityAreas.length}
                      </div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                        AREAS
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>
                        {cityStores.length}
                      </div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                        DARK STORES
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
                        {onlineStores.length}
                      </div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                        ONLINE
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Actions (Manage Areas link & Edit/Delete) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid #F1F5F9',
                    }}
                  >
                    <button
                      onClick={() => handleViewCityAreas(city.name)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6366F1',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Manage Areas ({cityAreas.length})</span>
                      <ArrowRight size={14} color="#6366F1" />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => openEditCity(city)}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: '#0F172A',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteCity(city)}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          color: '#EF4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= 6. MODAL: EDIT / ADD CITY (SCREENSHOT 3 MATCH) ================= */}
      {showCityModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 11, 36, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#FCE7F3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={20} color="#EC4899" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingCity ? `Edit City: ${editingCity.name}` : 'Add New City'}
                </h3>
              </div>

              <button
                onClick={() => setShowCityModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  City Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Surat, Vadodara, Rajkot"
                  value={cityName}
                  onChange={(e) => {
                    setCityName(e.target.value);
                    if (!editingCity && !cityCode) {
                      setCityCode(e.target.value.substring(0, 3).toUpperCase());
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  City Code * (Short unique code)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUR, BDQ, RAJ"
                  value={cityCode}
                  onChange={(e) => setCityCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  State
                </label>
                <input
                  type="text"
                  placeholder="Gujarat"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCityStatus('Active')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: cityStatus === 'Active' ? '2px solid #10B981' : '1px solid #CBD5E1',
                      background: cityStatus === 'Active' ? '#D1FAE5' : '#FFFFFF',
                      color: cityStatus === 'Active' ? '#065F46' : '#64748B',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    Active
                  </button>

                  <button
                    type="button"
                    onClick={() => setCityStatus('Inactive')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: cityStatus === 'Inactive' ? '2px solid #64748B' : '1px solid #CBD5E1',
                      background: cityStatus === 'Inactive' ? '#F1F5F9' : '#FFFFFF',
                      color: cityStatus === 'Inactive' ? '#0F172A' : '#64748B',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCityModal(false)}
                  style={{
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={citySubmitting}
                  style={{
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#060B24',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: citySubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {citySubmitting ? 'Saving...' : editingCity ? 'Save Changes' : 'Create City'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 7. MODAL: EDIT / ADD AREA (SCREENSHOT 4 MATCH) ================= */}
      {showAreaModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 11, 36, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={20} color="#6366F1" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
                    {editingArea ? `Edit Area: ${editingArea.name}` : 'Add New Operational Area'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                    Configurable Multi-Store Capacity Architecture
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAreaModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAreaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Belongs to City Chips */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Belongs to City *
                </label>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {cities.map((c) => {
                    const isSelected = areaCityName.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.id || c._id || c.name}
                        type="button"
                        onClick={() => setAreaCityName(c.name)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #6366F1' : '1px solid #CBD5E1',
                          background: isSelected ? '#EEF2FF' : '#FFFFFF',
                          color: isSelected ? '#4338CA' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Area / Micro-Hub Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bopal, Satellite, Thaltej"
                  value={areaName}
                  onChange={(e) => {
                    setAreaName(e.target.value);
                    if (!editingArea && !areaCode) {
                      setAreaCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                    }
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Area Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. BOPAL, SATELLITE"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value.toUpperCase())}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Max Stores in Area (Multi-Store Capacity) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                    Max Stores in Area *
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#EC4899', fontWeight: 800 }}>
                    Multi-Store Capacity
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="1"
                  min="1"
                  max="10"
                  value={areaMaxStores}
                  onChange={(e) => setAreaMaxStores(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px', lineHeight: 1.3 }}>
                  ⓘ Allow up to {areaMaxStores || '1'} dark stores to operate in this area. Customer orders are intelligently routed to the best store.
                </div>
              </div>

              {/* 2 Columns: SLA & Radius */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Delivery SLA (Mins)
                  </label>
                  <input
                    type="number"
                    placeholder="9"
                    value={areaSla}
                    onChange={(e) => setAreaSla(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Service Radius (Km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="3.5"
                    value={areaRadius}
                    onChange={(e) => setAreaRadius(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* 2 Columns: Latitude & Longitude */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Latitude
                  </label>
                  <input
                    type="text"
                    placeholder="23.0225"
                    value={areaLat}
                    onChange={(e) => setAreaLat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Longitude
                  </label>
                  <input
                    type="text"
                    placeholder="72.5714"
                    value={areaLng}
                    onChange={(e) => setAreaLng(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Pincodes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Pincodes (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="380015, 380054, 380058"
                  value={areaPincodes}
                  onChange={(e) => setAreaPincodes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAreaModal(false)}
                  style={{
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={areaSubmitting}
                  style={{
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#060B24',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: areaSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {areaSubmitting ? 'Saving...' : editingArea ? 'Save Area' : 'Create Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
