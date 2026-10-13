import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Store,
  MapPin,
  Clock,
  KeyRound,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Building2,
  Navigation,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  Lock,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AreaItem, CityItem } from '../../types/admin';

export const AddStoreModal: React.FC = () => {
  const { showAddStoreModal, setShowAddStoreModal, createStore, areas, cities, stores } = useAdmin();

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  const [address, setAddress] = useState('');
  const [cityName, setCityName] = useState('Ahmedabad');
  const [cityId, setCityId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [areaName, setAreaName] = useState('');

  const [pincode, setPincode] = useState('380015');
  const [radiusKm, setRadiusKm] = useState('4.5');
  const [deliveryMins, setDeliveryMins] = useState('9');
  const [latitude, setLatitude] = useState('23.0300');
  const [longitude, setLongitude] = useState('72.5300');

  // Interactive Area Picker state
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');

  // Submission & Feedback state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    name: string;
    loginId: string;
    plainPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pwdCopied, setPwdCopied] = useState(false);

  // Track modal open transition to prevent resetting during background live syncs
  const prevShowModalRef = useRef(false);

  // Helper to generate a random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = 'Womup@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Reset or initialize ONLY when modal is newly opened (prevents resetting on background live syncs)
  useEffect(() => {
    if (showAddStoreModal && !prevShowModalRef.current) {
      const defaultCity = cities.find(
        (c) => c.name.toLowerCase() === 'ahmedabad' || c.code === 'AHM'
      ) || cities[0];
      const initialCityName = defaultCity ? defaultCity.name : 'Ahmedabad';
      const initialCityId = defaultCity ? (defaultCity.id || defaultCity._id || '') : '';

      setName('');
      setCode('');
      setLoginId('');
      setPassword(generateRandomPassword());
      setAddress('');
      setCityName(initialCityName);
      setCityId(initialCityId);
      setAreaId('');
      setAreaName('');
      setPincode('380015');
      setRadiusKm('4.5');
      setDeliveryMins('9');
      setLatitude('23.0300');
      setLongitude('72.5300');
      setErrorMsg(null);
      setSuccessData(null);
      setShowAreaPicker(false);
      setAreaSearch('');
    }
    prevShowModalRef.current = showAddStoreModal;
  }, [showAddStoreModal]);

  if (!showAddStoreModal) return null;

  // Filtered areas belonging to selected city
  const cityFilteredAreas = areas.filter((a) => {
    if (!cityName) return true;
    if (a.cityName && a.cityName.toLowerCase() === cityName.toLowerCase()) return true;
    if (a.cityId && cityId && String(a.cityId) === String(cityId)) return true;
    return true; // fallback to show areas if no city attached
  });

  // Calculate stores currently active in a specific area
  const getAreaStats = (area: AreaItem) => {
    const aId = area.id || area._id || '';
    const activeStores = stores.filter((s) => {
      return (
        (s.areaId && (String(s.areaId) === String(aId) || String(s.areaId) === String(area.id) || String(s.areaId) === String(area._id))) ||
        (s.areaName && s.areaName.toLowerCase().trim() === area.name.toLowerCase().trim())
      );
    });

    const maxStores = Number(area.maxStores) || 3;
    const currentCount = area.activeStoreCount ?? activeStores.length;
    const isFull = currentCount >= maxStores;
    const availableSlots = Math.max(0, maxStores - currentCount);

    return {
      currentCount,
      maxStores,
      isFull,
      availableSlots,
    };
  };

  // Handle city change
  const handleCityChange = (newCity: string) => {
    setCityName(newCity);
    const matchedCity = cities.find((c) => c.name.toLowerCase() === newCity.toLowerCase());
    setCityId(matchedCity ? (matchedCity.id || matchedCity._id || '') : '');
    // Reset area assignment when city changes
    setAreaId('');
    setAreaName('');
  };

  // Handle selecting an area from smart picker
  const handleSelectArea = (area: AreaItem) => {
    const stats = getAreaStats(area);
    if (stats.isFull) {
      setErrorMsg(
        `Area "${area.name}" is at full capacity (${stats.currentCount}/${stats.maxStores} stores active). Please choose another area or increase max stores.`
      );
      return;
    }

    const aId = area.id || area._id || '';
    setAreaId(aId);
    setAreaName(area.name);
    setShowAreaPicker(false);
    setErrorMsg(null);

    // Auto-populate store details if not already customized
    const cleanAreaName = area.name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    if (!name || name.startsWith('Wom Up')) {
      setName(`Wom Up ${cleanAreaName} Dark Store`);
    }

    const derivedCode = `STORE-${(area.code || cleanAreaName).toUpperCase().replace(/\s+/g, '_')}`;
    setCode(derivedCode);

    if (!loginId || loginId.startsWith('womup')) {
      setLoginId(`womup${cleanAreaName.replace(/\s+/g, '').toLowerCase()}`);
    }

    if (!address || address.startsWith('Dark Store Hub')) {
      setAddress(`Dark Store Hub, ${area.name}, ${cityName}`);
    }

    if (area.pincodes && area.pincodes.length > 0) {
      setPincode(area.pincodes[0]);
    }
    if (area.radiusKm) {
      setRadiusKm(String(area.radiusKm));
    }
    if (area.defaultDeliveryMinutes) {
      setDeliveryMins(String(area.defaultDeliveryMinutes));
    }
  };

  // Auto-sync code and login ID when typing Store Name
  const handleNameChange = (val: string) => {
    setName(val);
    const clean = val.replace(/Wom\s*Up|Dark\s*Store|[^a-zA-Z0-9 ]/gi, '').trim();
    if (!code || code.startsWith('STORE-') || code.startsWith('WUP_')) {
      const genCode = val
        ? `STORE-${val.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 14)}`
        : '';
      setCode(genCode);
    }
    if (!loginId || loginId.startsWith('womup')) {
      const genLogin = clean
        ? `womup${clean.replace(/\s+/g, '').toLowerCase()}`
        : '';
      setLoginId(genLogin);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Store Name is required.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Store Code is required.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Physical Address is required.');
      return;
    }

    // Capacity validation
    if (areaId) {
      const matchedArea = areas.find((a) => (a.id || a._id) === areaId);
      if (matchedArea) {
        const stats = getAreaStats(matchedArea);
        if (stats.isFull) {
          setErrorMsg(
            `This area is at full capacity (${stats.currentCount}/${stats.maxStores} stores active). Please choose another area or increase max stores.`
          );
          return;
        }
      }
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      loginId: loginId.trim() || undefined,
      password: password.trim() || undefined,
      address: address.trim(),
      city: cityName.trim(),
      cityName: cityName.trim(),
      cityId: cityId || undefined,
      areaId: areaId || undefined,
      areaName: areaName || undefined,
      pincode: pincode.trim(),
      latitude: parseFloat(latitude) || 23.03,
      longitude: parseFloat(longitude) || 72.53,
      serviceRadiusKm: parseFloat(radiusKm) || 4.5,
      estimatedDeliveryMinutes: parseInt(deliveryMins, 10) || 9,
    };

    try {
      const res = await createStore(payload);
      if (res.success && res.data) {
        setSuccessData({
          name: res.data.name,
          loginId: res.data.loginId,
          plainPassword: res.data.plainPassword || password || 'Womup@2026',
        });
      } else {
        setErrorMsg(res.error || 'Failed to create dark store.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while creating store.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!successData) return;
    const text = `🏪 WOMUP STORE LOGIN CREDENTIALS\nStore: ${successData.name}\nStore ID: ${successData.loginId}\nPassword: ${successData.plainPassword}\nLogin Portal: http://localhost:8084`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setPwdCopied(true);
    setTimeout(() => setPwdCopied(false), 2000);
  };

  const handleClose = () => {
    setShowAddStoreModal(false);
    setSuccessData(null);
    setErrorMsg(null);
    setShowAreaPicker(false);
  };

  // Selected area object
  const selectedAreaObj = areas.find((a) => (a.id || a._id) === areaId || a.name === areaName);
  const selectedAreaStats = selectedAreaObj ? getAreaStats(selectedAreaObj) : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '92vh' }}>
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#FDF2F8',
                color: '#FF3B98',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(255, 59, 152, 0.15)',
              }}
            >
              <Store size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                Add New Dark Store / Shop
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                City → Area → Store 1:1 Architecture · Real-time MongoDB Atlas Sync
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '22px 26px' }}>
          {successData ? (
            /* ================= PROVISIONED SUCCESS CREDENTIALS VIEW ================= */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#071B52', marginBottom: '6px' }}>
                Dark Store Created Successfully!
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#64748B', marginBottom: '22px' }}>
                Share these store credentials with your dark store staff or warehouse manager tablet.
              </p>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  textAlign: 'left',
                  marginBottom: '22px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #EDF2F7',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    STORE NAME:
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#071B52' }}>
                    {successData.name}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #EDF2F7',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    STORE LOGIN ID:
                  </span>
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#FF3B98',
                      fontFamily: 'monospace',
                      background: '#FFF1F2',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {successData.loginId}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                    STORE PASSWORD:
                  </span>
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#059669',
                      fontFamily: 'monospace',
                      background: '#ECFDF5',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {successData.plainPassword}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  <Copy size={16} />
                  <span>{copied ? '✓ Credentials Copied!' : 'Copy Full Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-pink"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Done & Return to Portal
                </button>
              </div>
            </div>
          ) : (
            /* ================= 4-SECTION FORM ================= */
            <form onSubmit={handleSubmit}>
              {errorMsg && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#B91C1C',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ================= SECTION 1: CITY & AREA ASSIGNMENT ================= */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: '#071B52',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    1
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      CITY & AREA ASSIGNMENT
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                      Assign the dark store to an operational Area with available store capacity slots.
                    </p>
                  </div>
                </div>

                <div className="form-grid-2">
                  {/* City Selector */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} color="#FF3B98" />
                      <span>Select City *</span>
                    </label>
                    <select
                      value={cityName}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="form-select"
                      style={{ fontWeight: 600 }}
                    >
                      {cities.length > 0 ? (
                        cities.map((c) => (
                          <option key={c.id || c._id || c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <option value="Ahmedabad">Ahmedabad</option>
                      )}
                    </select>
                  </div>

                  {/* Area Selector (Interactive Capacity Trigger) */}
                  <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#7C3AED" />
                      <span>Assigned Service Area *</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowAreaPicker(!showAreaPicker)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: selectedAreaStats?.isFull ? '1.5px solid #FCA5A5' : '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {selectedAreaStats ? (
                          <>
                            <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#071B52' }}>
                              {areaName}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '10px',
                                backgroundColor: selectedAreaStats.isFull
                                  ? '#FEE2E2'
                                  : selectedAreaStats.currentCount > 0
                                  ? '#FEF3C7'
                                  : '#D1FAE5',
                                color: selectedAreaStats.isFull
                                  ? '#DC2626'
                                  : selectedAreaStats.currentCount > 0
                                  ? '#D97706'
                                  : '#059669',
                              }}
                            >
                              {selectedAreaStats.isFull
                                ? 'FULL'
                                : `${selectedAreaStats.availableSlots} slot left`}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.86rem' }}>
                            Choose an operational area...
                          </span>
                        )}
                      </div>
                      <ChevronDown size={16} color="#64748B" />
                    </button>

                    {/* Dedicated 'Choose Area for Store' Modal Dialog (100% App Parity) */}
                    {showAreaPicker && (
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(7, 27, 82, 0.45)',
                          backdropFilter: 'blur(3px)',
                          zIndex: 9999,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '20px',
                        }}
                        onClick={() => setShowAreaPicker(false)}
                      >
                        <div
                          style={{
                            backgroundColor: '#FFFFFF',
                            width: '100%',
                            maxWidth: '520px',
                            maxHeight: '80vh',
                            borderRadius: '16px',
                            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: '1.5px solid #E2E8F0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Modal Header */}
                          <div
                            style={{
                              padding: '16px 20px',
                              borderBottom: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#FFFFFF',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '10px',
                                  backgroundColor: '#F3E8FF',
                                  color: '#7C3AED',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <MapPin size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                                  Choose Area for Store
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>
                                  Capacity & Slot Availability ({cityName})
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowAreaPicker(false)}
                              style={{
                                background: '#F1F5F9',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px',
                                cursor: 'pointer',
                                color: '#64748B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Search Header */}
                          <div
                            style={{
                              padding: '12px 18px',
                              borderBottom: '1px solid #F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              backgroundColor: '#F8FAFC',
                            }}
                          >
                            <Search size={16} color="#94A3B8" />
                            <input
                              type="text"
                              placeholder={`Search areas in ${cityName}...`}
                              value={areaSearch}
                              onChange={(e) => setAreaSearch(e.target.value)}
                              style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '0.85rem',
                                width: '100%',
                                color: '#071B52',
                              }}
                              autoFocus
                            />
                            {areaSearch && (
                              <button
                                type="button"
                                onClick={() => setAreaSearch('')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>

                          {/* Scrollable Area Cards */}
                          <div style={{ overflowY: 'auto', padding: '12px 16px', maxHeight: '50vh' }}>
                            {cityFilteredAreas
                              .filter((a) =>
                                !areaSearch.trim() ||
                                a.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
                                a.code.toLowerCase().includes(areaSearch.toLowerCase())
                              )
                              .map((area) => {
                                const stats = getAreaStats(area);
                                const isSelected = (area.id || area._id) === areaId || area.name === areaName;

                                return (
                                  <div
                                    key={area.id || area._id || area.name}
                                    onClick={() => handleSelectArea(area)}
                                    style={{
                                      padding: '12px 14px',
                                      borderRadius: '12px',
                                      marginBottom: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      cursor: stats.isFull ? 'not-allowed' : 'pointer',
                                      backgroundColor: isSelected
                                        ? '#FDF2F8'
                                        : stats.isFull
                                        ? '#FEF2F2'
                                        : '#FFFFFF',
                                      border: isSelected
                                        ? '1.5px solid #FF3B98'
                                        : stats.isFull
                                        ? '1px solid #FCA5A5'
                                        : '1px solid #E2E8F0',
                                      opacity: stats.isFull ? 0.75 : 1,
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div
                                        style={{
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '8px',
                                          backgroundColor: stats.isFull
                                            ? '#FEE2E2'
                                            : stats.currentCount > 0
                                            ? '#FEF3C7'
                                            : '#ECFDF5',
                                          color: stats.isFull
                                            ? '#DC2626'
                                            : stats.currentCount > 0
                                            ? '#D97706'
                                            : '#059669',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {stats.isFull ? (
                                          <Lock size={16} />
                                        ) : stats.currentCount > 0 ? (
                                          <Store size={16} />
                                        ) : (
                                          <CheckCircle2 size={16} />
                                        )}
                                      </div>

                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span
                                            style={{
                                              fontWeight: 800,
                                              fontSize: '0.9rem',
                                              color: stats.isFull ? '#991B1B' : '#071B52',
                                            }}
                                          >
                                            {area.name}
                                          </span>
                                          {area.code && (
                                            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                                              • {area.code}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ fontSize: '0.74rem', color: stats.isFull ? '#DC2626' : '#64748B', marginTop: '2px' }}>
                                          {stats.isFull
                                            ? `⚠️ Capacity full: ${stats.currentCount}/${stats.maxStores} stores assigned`
                                            : stats.currentCount > 0
                                            ? `🟡 ${stats.currentCount}/${stats.maxStores} stores active · ${stats.availableSlots} slot left`
                                            : `🟢 0/${stats.maxStores} stores · Ready for allocation`}
                                        </div>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span
                                        style={{
                                          fontSize: '0.74rem',
                                          fontWeight: 800,
                                          padding: '3px 10px',
                                          borderRadius: '12px',
                                          backgroundColor: stats.isFull
                                            ? '#DC2626'
                                            : stats.currentCount > 0
                                            ? '#FEF3C7'
                                            : '#D1FAE5',
                                          color: stats.isFull
                                            ? '#FFFFFF'
                                            : stats.currentCount > 0
                                            ? '#D97706'
                                            : '#059669',
                                        }}
                                      >
                                        {stats.isFull
                                          ? 'FULL'
                                          : `${stats.availableSlots} slot${stats.availableSlots > 1 ? 's' : ''}`}
                                      </span>
                                      {isSelected && <Check size={18} color="#FF3B98" />}
                                    </div>
                                  </div>
                                );
                              })}

                            {cityFilteredAreas.length === 0 && (
                              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                                No areas configured for {cityName}.
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div
                            style={{
                              padding: '12px 18px',
                              backgroundColor: '#F8FAFC',
                              borderTop: '1px solid #E2E8F0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              Areas with FULL capacity cannot accept new dark stores.
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAreaPicker(false)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* ================= SECTION 2: STORE DETAILS ================= */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: '#071B52',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    2
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      STORE DETAILS
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                      Basic store identity and code prefix for stock and orders.
                    </p>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Store / Shop Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wom Up Satellite Dark Store"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Unique Store Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STORE-SATELLITE"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* ================= SECTION 3: STORE LOGIN CREDENTIALS ================= */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: '#071B52',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    3
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      STORE LOGIN CREDENTIALS
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                      All pickers & tablets at this dark store will use this Store ID and Password.
                    </p>
                  </div>
                </div>

                <div className="form-grid-2">
                  {/* Store Login ID */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Store Login ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. womupsatellite"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value.toLowerCase())}
                      className="form-input"
                    />
                  </div>

                  {/* Store Password with Generate Random button */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Store Password *</label>
                      <button
                        type="button"
                        onClick={() => setPassword(generateRandomPassword())}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#FF3B98',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0,
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Generate Random</span>
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="e.g. Womup@2026"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        style={{ paddingRight: '64px', fontFamily: 'monospace' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          gap: '4px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: pwdCopied ? '#10B981' : '#94A3B8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Copy Password"
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 4: LOCATION & DELIVERY SLA ================= */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: '#071B52',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    4
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      LOCATION & DELIVERY SLA
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>
                      Physical warehouse address, radius coverage, and GPS dispatch coordinates.
                    </p>
                  </div>
                </div>

                {/* Physical Address Text Area */}
                <div className="form-group">
                  <label className="form-label">Physical Address *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Shop No, Building, Road, Area, LandMark"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-textarea"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Pincode & Radius */}
                <div className="form-grid-2" style={{ marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Service Radius (Km)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Est. Delivery */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Est. Delivery (mins)</label>
                  <input
                    type="number"
                    value={deliveryMins}
                    onChange={(e) => setDeliveryMins(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Physical Store GPS Coordinates Callout Banner */}
                <div
                  style={{
                    backgroundColor: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3730A3' }}>
                      📍 Physical Store GPS Coordinates (Unique per Store)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setLatitude(pos.coords.latitude.toFixed(4));
                              setLongitude(pos.coords.longitude.toFixed(4));
                            },
                            () => alert('Unable to retrieve current GPS location')
                          );
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4F46E5',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      ⚡ Auto-detect Current GPS
                    </button>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: '#4338CA', margin: 0, lineHeight: 1.4 }}>
                    Each dark store must have its own physical coordinates (where the warehouse is situated), separate from the Area center. When an area has multiple stores, the system routes orders to the nearest store to the customer.
                  </p>
                </div>

                {/* 2-Column Store Latitude & Longitude */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Store Physical Latitude *</label>
                    <input
                      type="text"
                      placeholder="e.g. 23.0250"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Store Physical Longitude *</label>
                    <input
                      type="text"
                      placeholder="e.g. 72.5780"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary"
                  disabled={submitting}
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={submitting}
                  style={{ padding: '10px 22px' }}
                >
                  {submitting ? 'Creating in MongoDB...' : 'Create Dark Store'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
