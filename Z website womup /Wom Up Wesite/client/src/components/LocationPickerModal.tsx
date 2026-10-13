import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Compass,
  Check,
  Trash2,
  Plus,
  Sparkles,
  Home,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { AddressApi, resolveLocation, type SavedAddressItem } from '../services/api';
import { useNavigation } from '../context/NavigationContext';

export interface SelectedAddressPayload {
  id?: string;
  label?: string;
  houseFlat?: string;
  street?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  lat: number;
  lng: number;
  isGps: boolean;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress?: (address: SelectedAddressPayload) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
}) => {
  const {
    setSelectedAreaName,
    resolvedLocation,
    setResolvedLocation,
    detectUserLocation,
    isDetectingLocation,
  } = useNavigation();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSavingNew, setIsSavingNew] = useState(false);

  // New address form state
  const [newLabel, setNewLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newHouse, setNewHouse] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Ahmedabad');
  const [newPincode, setNewPincode] = useState('380015');

  // GPS card values matching app (defaulting to live Chandlodiya - Tragad coordinates)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number }>({
    lat: 23.1288,
    lng: 72.5507,
  });
  const [gpsAddressName, setGpsAddressName] = useState('Chandlodiya - Tragad');

  // Load real saved addresses and auto-resolve live GPS location whenever modal opens
  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(4));
            const lng = Number(pos.coords.longitude.toFixed(4));
            setGpsCoords({ lat, lng });
            try {
              const loc = await resolveLocation(lat, lng);
              setResolvedLocation(loc);
              setGpsAddressName(loc.areaName);
            } catch {}
          },
          async () => {
            try {
              const loc = await resolveLocation(23.1288, 72.5507);
              setResolvedLocation(loc);
              setGpsAddressName(loc.areaName);
            } catch {}
          },
          { timeout: 6000, enableHighAccuracy: true }
        );
      }
    }
  }, [isOpen]);

  const loadAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const addrs = await AddressApi.getAddresses();
      setSavedAddresses(addrs);
      const defaultOne = addrs.find((a) => a.isDefault) || addrs[0];
      if (defaultOne) {
        setSelectedAddrId(defaultOne.id);
      }
    } catch (e) {
      console.warn('Failed to load saved addresses:', e);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  if (!isOpen) return null;

  const handleDeliverAtGps = async () => {
    try {
      const loc = await resolveLocation(gpsCoords.lat, gpsCoords.lng);
      setResolvedLocation(loc);
    } catch {
      setSelectedAreaName('Chandlodiya - Tragad');
    }
    setSelectedAddrId('current_gps');
    if (onSelectAddress) {
      onSelectAddress({
        isGps: true,
        label: 'Current Device Location',
        houseFlat: 'GPS Location',
        street: 'Chandlodiya - Tragad Area',
        landmark: gpsAddressName || resolvedLocation.areaName || 'Chandlodiya - Tragad',
        city: 'Ahmedabad',
        pincode: '382481',
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
      });
    }
    onClose();
  };

  const handleSelectSavedAddress = async (addr: SavedAddressItem) => {
    setSelectedAddrId(addr.id);
    const lat = addr.latitude || gpsCoords.lat;
    const lng = addr.longitude || gpsCoords.lng;
    try {
      const loc = await resolveLocation(lat, lng);
      setResolvedLocation(loc);
      await AddressApi.setDefaultAddress(addr.id);
    } catch {
      const areaName = addr.landmark || addr.street || addr.city || 'Chandlodiya - Tragad';
      setSelectedAreaName(areaName);
    }
    if (onSelectAddress) {
      onSelectAddress({
        id: addr.id,
        label: addr.label,
        houseFlat: addr.houseFlat || addr.houseNumber,
        street: addr.street,
        landmark: addr.landmark,
        city: addr.city || 'Ahmedabad',
        pincode: addr.pincode,
        lat,
        lng,
        isGps: false,
      });
    }
    onClose();
  };

  const handleDeleteAddress = async (e: React.MouseEvent, id: string, label: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove "${label}" from your saved addresses?`)) return;
    try {
      await AddressApi.deleteAddress(id);
      setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouse.trim() || !newStreet.trim()) {
      alert('Please enter house number and street');
      return;
    }
    setIsSavingNew(true);
    try {
      const res = await AddressApi.createAddress({
        label: newLabel,
        houseNumber: newHouse.trim(),
        street: newStreet.trim(),
        city: newCity.trim(),
        pincode: newPincode.trim(),
        isDefault: true,
      });
      if (res.success) {
        setIsAddingNew(false);
        setNewHouse('');
        setNewStreet('');
        await loadAddresses();
      } else {
        alert(res.message || 'Failed to save address');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving address');
    } finally {
      setIsSavingNew(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 27, 82, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(7, 27, 82, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Exact Match to Customer App S24/LocationPickerModal) */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Choose delivery location
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '3px 0 0' }}>
              Select your location for 9-minute delivery
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#F1F5F9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* 1. CURRENT DEVICE LOCATION CARD (Exact Match to App Screenshot 1) */}
          <div
            style={{
              backgroundColor: '#F0FDF4',
              borderRadius: '16px',
              border: '1.5px solid #86EFAC',
              padding: '16px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(21, 128, 61, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #BBF7D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#15803D',
                  flexShrink: 0,
                }}
              >
                <MapPin size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14532D' }}>
                    Current Device Location
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#DCFCE7',
                      border: '1px solid #86EFAC',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#15803D',
                    }}
                  >
                    <Compass size={11} />
                    GPS Detected
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                  {resolvedLocation.areaName || gpsAddressName || 'Chandlodiya - Tragad'}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
                  Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}
                </div>

                <div
                  style={{
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    marginTop: '8px',
                    fontSize: '0.74rem',
                    color: '#166534',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={12} color="#15803D" />
                  <span>
                    Serving Hub: {resolvedLocation.storeName || 'Wom Up Chandlodiya - Tragad Dark Store'} - Express 9-minute drop
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '8px' }}>
                  Tap "Deliver Here" below to use this GPS location for delivery.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid #BBF7D0',
              }}
            >
              <button
                onClick={async () => {
                  await detectUserLocation();
                }}
                disabled={isDetectingLocation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#15803D',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                <Sparkles size={14} />
                <span>{isDetectingLocation ? 'Detecting...' : 'Redetect GPS'}</span>
              </button>

              <button
                onClick={handleDeliverAtGps}
                style={{
                  backgroundColor: '#15803D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(21, 128, 61, 0.3)',
                }}
              >
                <span>Deliver Here ✓</span>
              </button>
            </div>
          </div>

          {/* 2. SAVED ADDRESSES SECTION (Exact Match to App Screenshot 1) */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                SAVED ADDRESSES
              </span>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                {savedAddresses.length} {savedAddresses.length === 1 ? 'address' : 'addresses'}
              </span>
            </div>

            {isLoadingAddresses ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
                <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                <span style={{ fontSize: '0.8rem' }}>Loading saved addresses...</span>
              </div>
            ) : savedAddresses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {savedAddresses.map((addr) => {
                  const isSelected = selectedAddrId === addr.id || addr.isDefault;
                  const label = addr.label || addr.type || 'Home';
                  const formatted =
                    addr.houseFlat || `${addr.houseNumber}, ${addr.street}, ${addr.city}`;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: isSelected ? '1.5px solid #15803D' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#DCFCE7' : '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? '#15803D' : '#64748B',
                            flexShrink: 0,
                          }}
                        >
                          {label === 'Home' ? (
                            <Home size={18} />
                          ) : label === 'Work' ? (
                            <Briefcase size={18} />
                          ) : (
                            <MapPin size={18} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              color: isSelected ? '#15803D' : '#0F172A',
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: '0.78rem',
                              color: '#64748B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px',
                            }}
                          >
                            {formatted}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isSelected && (
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: '#15803D',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                            }}
                          >
                            <Check size={14} />
                          </div>
                        )}
                        <button
                          onClick={(e) => handleDeleteAddress(e, addr.id, label)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Delete address"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '0.82rem',
                }}
              >
                No saved addresses found. Add a new address below.
              </div>
            )}
          </div>

          {/* Inline Add Address Form or Button */}
          {!isAddingNew ? (
            <button
              onClick={() => setIsAddingNew(true)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: '1.5px dashed #15803D',
                backgroundColor: 'transparent',
                color: '#15803D',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={18} />
              <span>+ Add New Address</span>
            </button>
          ) : (
            <form
              onSubmit={handleSaveNewAddress}
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                Add New Delivery Address
              </div>

              {/* Tag selector */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['Home', 'Work', 'Other'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewLabel(tag)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '8px',
                      border: newLabel === tag ? '1.5px solid #15803D' : '1px solid #CBD5E1',
                      backgroundColor: newLabel === tag ? '#DCFCE7' : '#FFFFFF',
                      color: newLabel === tag ? '#15803D' : '#64748B',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>
                  House / Flat / Floor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chandlodiya"
                  value={newHouse}
                  onChange={(e) => setNewHouse(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    marginTop: '3px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>
                  Street / Area / Landmark *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chandlodiya, Ahmedabad"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    marginTop: '3px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      marginTop: '3px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>Pincode</label>
                  <input
                    type="text"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      marginTop: '3px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNew}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#15803D',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {isSavingNew ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
