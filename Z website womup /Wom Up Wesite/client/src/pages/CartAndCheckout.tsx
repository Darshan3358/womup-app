import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  ShieldCheck,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Star,
  Wallet,
  Compass,
  Home,
  Check,
  Plus,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigation, AHMEDABAD_AREAS } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { OrderTrackingModal } from '../components/OrderTrackingModal';
import { AddressApi, type SavedAddressItem, resolveLocation } from '../services/api';
import { LocationPickerModal, type SelectedAddressPayload } from '../components/LocationPickerModal';

export const CartAndCheckout: React.FC = () => {
  const {
    cart,
    updateQuantity,
    mrpTotal,
    productDiscount,
    distanceKm,
    ratePerKm,
    deliveryFee,
    platformFee,
    totalSavings,
    couponDiscount,
    appliedCoupon,
    applyCoupon,
    useCoins,
    setUseCoins,
    maxCoinsUsable,
    coinDiscount,
    total,
    totalItems,
    userCoins,
    placeOrder,
    activeTrackingOrder,
    setActiveTrackingOrder,
    isSubmittingOrder,
    cartNotification,
    clearCartNotification,
  } = useCart();

  const { user } = useAuth();
  const {
    navigateTo,
    resolvedLocation,
    selectedAreaName,
    setResolvedLocation,
    checkoutLiveState,
    emitCheckoutChange,
  } = useNavigation();

  // Address selection & mode
  const [selectedAddressType, setSelectedAddressType] = useState<'CURRENT_GPS' | 'SAVED'>('SAVED');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Address sanitization helper to eliminate corrupt/concatenated strings from MongoDB
  const cleanHouseFlat = (raw?: string): string => {
    if (!raw) return '';
    if (
      raw.includes('SG Highway, Ahmedabad, SG Highway') ||
      raw.includes('SG Highway, Thaltej, Ahmedabad, SG Highway') ||
      raw.includes('Near Thaltej Cross Road, SG Highway, Thaltej') ||
      raw.includes('Shivalik Shilp')
    ) {
      return '';
    }
    return raw;
  };

  const [addressSource, setAddressSource] = useState<'gps' | 'saved'>('gps');
  const isManualSelectionRef = useRef(false);

  // Address fields - Default clean GPS values
  const [customerName, setCustomerName] = useState('Darshan Thanki');
  const [customerPhone, setCustomerPhone] = useState('+91 96565 65656');
  const [houseFlat, setHouseFlat] = useState('GPS Location');
  const [street, setStreet] = useState('Chandlodiya - Tragad Area');
  const [areaLandmark, setAreaLandmark] = useState(resolvedLocation.areaName || selectedAreaName || 'Chandlodiya - Tragad');
  const [pincode, setPincode] = useState('382481');

  // GPS Device state
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number }>({ lat: 23.1288, lng: 72.5507 });
  const [gpsAddressName, setGpsAddressName] = useState('Chandlodiya - Tragad');
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number]>([72.5507, 23.1288]); // [lng, lat]

  useEffect(() => {
    if (user?.name) setCustomerName(user.name);
    if (user?.phone) setCustomerPhone(user.phone);

    // 1. Auto-detect browser GPS coordinates
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setGpsCoords({ lat, lng });
          try {
            const loc = await resolveLocation(lat, lng);
            setGpsAddressName(loc.areaName);
          } catch {}
        },
        () => {},
        { timeout: 5000, enableHighAccuracy: true }
      );
    }

    // 2. Load saved addresses from user's account
    loadSavedAddresses();
  }, [user]);

  const loadSavedAddresses = async () => {
    try {
      const addrs = await AddressApi.getAddresses();
      // 🛡️ GUARD: If user already manually selected an address while API was in-flight, do not overwrite!
      if (isManualSelectionRef.current) return;

      const finalAddrs = (addrs && addrs.length > 0)
        ? addrs
            .filter((a) => !JSON.stringify(a).includes('Shivalik Shilp'))
            .map((a) => ({
              ...a,
              houseFlat: cleanHouseFlat(a.houseFlat || a.houseNumber),
            }))
        : [];
      setSavedAddresses(finalAddrs);

      if (finalAddrs.length > 0 && selectedAddressType === 'SAVED') {
        setSelectedAddressId(finalAddrs[0].id);
        setHouseFlat(cleanHouseFlat(finalAddrs[0].houseFlat || finalAddrs[0].houseNumber));
        setStreet(finalAddrs[0].street || '');
        setAreaLandmark(finalAddrs[0].areaLandmark || finalAddrs[0].landmark || 'Ahmedabad');
        setPincode(finalAddrs[0].pincode || '382481');
        const lat = finalAddrs[0].latitude || 23.1288;
        const lng = finalAddrs[0].longitude || 72.5507;
        setDeliveryCoords([lng, lat]);
      } else {
        setSelectedAddressType('CURRENT_GPS');
        setSelectedAddressId('');
      }
    } catch (e) {
      console.warn('Failed to load saved addresses:', e);
      if (!isManualSelectionRef.current) {
        setSelectedAddressType('CURRENT_GPS');
      }
    }
  };

  useEffect(() => {
    // GATE GPS UPDATES: If user has explicitly selected a saved address, do not let GPS listener overwrite it
    if (isManualSelectionRef.current && addressSource === 'saved') {
      return;
    }
    if (!resolvedLocation?.areaName) return;

    if (savedAddresses.length > 0 && addressSource === 'saved') {
      setSelectedAddressType('SAVED');
      setSelectedAddressId(savedAddresses[0].id);
      setHouseFlat(cleanHouseFlat(savedAddresses[0].houseFlat || savedAddresses[0].houseNumber));
      setStreet(savedAddresses[0].street || '');
      setAreaLandmark(savedAddresses[0].areaLandmark || savedAddresses[0].landmark || resolvedLocation.areaName);
      setPincode(savedAddresses[0].pincode || '380054');
      setAreaDetectionStatus({
        isServiceable: true,
        areaName: resolvedLocation.areaName,
        storeName: resolvedLocation.storeName || 'Wom Up Dark Store',
      });
    } else {
      setSelectedAddressType('CURRENT_GPS');
      setSelectedAddressId('');
      setHouseFlat('GPS Location');
      setStreet('Chandlodiya - Tragad Area');
      setAreaLandmark('Chandlodiya - Tragad');
      setPincode('382481');
      setAreaDetectionStatus({
        isServiceable: true,
        areaName: 'Chandlodiya - Tragad',
        storeName: resolvedLocation.storeName || 'Wom Up Chandlodiya - Tragad Dark Store',
      });
    }
  }, [resolvedLocation?.areaName, resolvedLocation?.storeId, savedAddresses, addressSource]);

  const handleChooseGps = async () => {
    setAddressSource('gps');
    isManualSelectionRef.current = false;
    setSelectedAddressType('CURRENT_GPS');
    setSelectedAddressId('');
    setHouseFlat('GPS Location');
    setStreet('Chandlodiya - Tragad Area');
    setAreaLandmark('Chandlodiya - Tragad');
    setPincode('382481');
    setDeliveryCoords([72.5507, 23.1288]);
    setAreaDetectionStatus({
      isServiceable: true,
      areaName: 'Chandlodiya - Tragad',
      storeName: 'Wom Up Chandlodiya - Tragad Dark Store',
    });
    emitCheckoutChange({
      selectedAddressType: 'CURRENT_GPS',
      houseFlat: 'GPS Location',
      street: 'Chandlodiya - Tragad Area',
      areaLandmark: 'Chandlodiya - Tragad',
      pincode: '382481',
      recipientName: customerName,
      phoneNumber: customerPhone,
    });
    try {
      const loc = await resolveLocation(23.1288, 72.5507);
      if (loc) {
        setResolvedLocation(loc);
        setAreaDetectionStatus({
          isServiceable: true,
          areaName: loc.areaName,
          storeName: loc.storeName || 'Wom Up Chandlodiya - Tragad Dark Store',
        });
      }
    } catch {}
  };

  const handleChooseSaved = async (addr: SavedAddressItem) => {
    setAddressSource('saved');
    isManualSelectionRef.current = true;
    setSelectedAddressType('SAVED');
    setSelectedAddressId(addr.id);
    const cleanedH = cleanHouseFlat(addr.houseFlat || addr.houseNumber || '');
    const streetV = addr.street || '';
    const landV = addr.areaLandmark || addr.landmark || 'Ahmedabad';
    const pinV = addr.pincode || '382481';
    setHouseFlat(cleanedH);
    setStreet(streetV);
    setAreaLandmark(landV);
    setPincode(pinV);
    setAreaDetectionStatus({
      isServiceable: true,
      areaName: 'Thaltej',
      storeName: 'Wom Up Thaltej Dark Store',
    });
    emitCheckoutChange({
      selectedAddressType: 'SAVED',
      addressId: addr.id,
      houseFlat: cleanedH,
      street: streetV,
      areaLandmark: landV,
      pincode: pinV,
      recipientName: customerName,
      phoneNumber: customerPhone,
    });
    const lat = addr.latitude || 23.0500;
    const lng = addr.longitude || 72.5160;
    setDeliveryCoords([lng, lat]);
    try {
      const loc = await resolveLocation(lat, lng);
      if (loc) {
        setResolvedLocation(loc);
        setAreaDetectionStatus({
          isServiceable: true,
          areaName: loc.areaName,
          storeName: loc.storeName || 'Wom Up Thaltej Dark Store',
        });
      }
    } catch {}
  };

  const handleAddressFromModal = async (addr: SelectedAddressPayload) => {
    const lat = addr.lat;
    const lng = addr.lng;
    setDeliveryCoords([lng, lat]);
    try {
      const loc = await resolveLocation(lat, lng);
      setResolvedLocation(loc);
    } catch {}

    if (addr.isGps) {
      setAddressSource('gps');
      isManualSelectionRef.current = false;
      setSelectedAddressType('CURRENT_GPS');
      setSelectedAddressId('');
      setHouseFlat(cleanHouseFlat(addr.houseFlat) || 'GPS Location');
      setStreet(addr.street || 'Selected Area');
      setAreaLandmark(addr.landmark || gpsAddressName || 'Selected Area');
      setPincode(addr.pincode || '380054');
    } else {
      setAddressSource('saved');
      isManualSelectionRef.current = true;
      setSelectedAddressType('SAVED');
      setSelectedAddressId(addr.id || '');
      setHouseFlat(cleanHouseFlat(addr.houseFlat));
      setStreet(addr.street || 'SG Highway');
      setAreaLandmark(addr.landmark || 'Thaltej');
      setPincode(addr.pincode || '380054');
    }
  };

  // Visual confirmation state for area auto-detection
  const [areaDetectionStatus, setAreaDetectionStatus] = useState<{
    isServiceable: boolean;
    areaName: string;
    storeName: string;
  } | null>(null);

  // Debounced Area Detection & Geocoding from AHMEDABAD_AREAS (300ms)
  useEffect(() => {
    if (!areaLandmark || areaLandmark.trim().length < 3) {
      setAreaDetectionStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      const lower = areaLandmark.toLowerCase().trim();
      const matched = AHMEDABAD_AREAS.find((a) => {
        const aName = a.name.toLowerCase();
        return lower.includes(aName) || aName.includes(lower);
      });

      if (matched) {
        const AREA_PINCODES: Record<string, string> = {
          'chandlodiya - tragad': '382481',
          'thaltej': '380054',
          'navrangpura': '380009',
          'satellite': '380015',
          'prahlad nagar': '380015',
          'vastrapur': '380015',
          'bopal': '380058',
          'ghatlodia': '380061',
          'sg highway': '380054',
        };

        const matchedPin = AREA_PINCODES[matched.name.toLowerCase()] || '380054';
        setPincode(matchedPin);
        setDeliveryCoords([matched.lng, matched.lat]);
        if (matched.name.toLowerCase().includes('thaltej')) {
          setSelectedAddressType('SAVED');
          if (savedAddresses.length > 0) {
            setSelectedAddressId(savedAddresses[0].id);
          }
        } else if (matched.name.toLowerCase().includes('tragad') || matched.name.toLowerCase().includes('chandlodiya')) {
          setSelectedAddressType('CURRENT_GPS');
          setSelectedAddressId('');
        }

        try {
          const loc = await resolveLocation(matched.lat, matched.lng);
          setResolvedLocation(loc);
          setAreaDetectionStatus({
            isServiceable: true,
            areaName: matched.name,
            storeName: loc.storeName || matched.storeName,
          });
        } catch {
          setAreaDetectionStatus({
            isServiceable: true,
            areaName: matched.name,
            storeName: matched.storeName,
          });
        }
      } else if (lower.length >= 4) {
        setAreaDetectionStatus({
          isServiceable: false,
          areaName: areaLandmark,
          storeName: 'Unknown',
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [areaLandmark]);

  // Checkout preferences
  const deliverySlot = `Instant ${resolvedLocation.deliveryMinutes || 9} Minutes`;
  const [deliveryInstruction, setDeliveryInstruction] = useState('Ring bell & leave at door');
  const [tip, setTip] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD' | 'WALLET'>('UPI');

  // Real-time synchronization with Customer Mobile App
  useEffect(() => {
    if (checkoutLiveState.paymentMethod) {
      setPaymentMethod(checkoutLiveState.paymentMethod);
    }
    if (typeof checkoutLiveState.tip === 'number') {
      setTip(checkoutLiveState.tip);
    }
    if (checkoutLiveState.deliveryInstruction) {
      setDeliveryInstruction(checkoutLiveState.deliveryInstruction);
    }
    if (typeof checkoutLiveState.useCoins === 'boolean') {
      setUseCoins(checkoutLiveState.useCoins);
    }
    if (checkoutLiveState.selectedAddressType) {
      if (checkoutLiveState.selectedAddressType === 'CURRENT_GPS' && selectedAddressType !== 'CURRENT_GPS') {
        setAddressSource('gps');
        isManualSelectionRef.current = false;
        setSelectedAddressType('CURRENT_GPS');
        setSelectedAddressId('');
        setHouseFlat(checkoutLiveState.houseFlat || 'GPS Location');
        setStreet(checkoutLiveState.street || 'Chandlodiya - Tragad Area');
        setAreaLandmark(checkoutLiveState.areaLandmark || 'Chandlodiya - Tragad');
        setPincode(checkoutLiveState.pincode || '382481');
        setDeliveryCoords([72.5507, 23.1288]);
        setAreaDetectionStatus({
          isServiceable: true,
          areaName: 'Chandlodiya - Tragad',
          storeName: 'Wom Up Chandlodiya - Tragad Dark Store',
        });
        resolveLocation(23.1288, 72.5507).then((loc) => {
          if (loc) setResolvedLocation(loc);
        }).catch(() => {});
      } else if (checkoutLiveState.selectedAddressType === 'SAVED' && selectedAddressType !== 'SAVED') {
        setAddressSource('saved');
        isManualSelectionRef.current = true;
        setSelectedAddressType('SAVED');
        const target = savedAddresses.find((a) => a.id === checkoutLiveState.addressId) || savedAddresses[0];
        if (target) {
          setSelectedAddressId(target.id);
          const cleanedH = cleanHouseFlat(target.houseFlat || target.houseNumber || '');
          const streetV = target.street || '';
          const landV = target.areaLandmark || target.landmark || 'Ahmedabad';
          const pinV = target.pincode || '382481';
          setHouseFlat(cleanedH);
          setStreet(streetV);
          setAreaLandmark(landV);
          setPincode(pinV);
          setAreaDetectionStatus({
            isServiceable: true,
            areaName: 'Thaltej',
            storeName: 'Wom Up Thaltej Dark Store',
          });
          const lat = target.latitude || 23.0500;
          const lng = target.longitude || 72.5160;
          setDeliveryCoords([lng, lat]);
          resolveLocation(lat, lng).then((loc) => {
            if (loc) setResolvedLocation(loc);
          }).catch(() => {});
        }
      }
    }
    if (checkoutLiveState.recipientName !== undefined && checkoutLiveState.recipientName !== customerName) {
      setCustomerName(checkoutLiveState.recipientName);
    }
    if (checkoutLiveState.phoneNumber !== undefined && checkoutLiveState.phoneNumber !== customerPhone) {
      setCustomerPhone(checkoutLiveState.phoneNumber);
    }
    if (checkoutLiveState.houseFlat !== undefined && checkoutLiveState.houseFlat !== houseFlat) {
      setHouseFlat(checkoutLiveState.houseFlat);
    }
    if (checkoutLiveState.street !== undefined && checkoutLiveState.street !== street) {
      setStreet(checkoutLiveState.street);
    }
    if (checkoutLiveState.areaLandmark !== undefined && checkoutLiveState.areaLandmark !== areaLandmark) {
      setAreaLandmark(checkoutLiveState.areaLandmark);
    }
    if (checkoutLiveState.pincode !== undefined && checkoutLiveState.pincode !== pincode) {
      setPincode(checkoutLiveState.pincode);
    }
    if (checkoutLiveState.couponCode && checkoutLiveState.couponCode !== appliedCoupon) {
      applyCoupon(checkoutLiveState.couponCode);
    }
  }, [checkoutLiveState]);

  const handleSelectDeliveryInstruction = (inst: string) => {
    setDeliveryInstruction(inst);
    emitCheckoutChange({ deliveryInstruction: inst });
  };

  const handleSelectTip = (amt: number) => {
    setTip(amt);
    emitCheckoutChange({ tip: amt });
  };

  const handleSelectPaymentMethod = (pm: 'UPI' | 'CARD' | 'COD' | 'WALLET') => {
    setPaymentMethod(pm);
    emitCheckoutChange({ paymentMethod: pm });
  };

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput);
    if (ok) {
      setCouponMsg({ text: `Coupon ${couponInput.toUpperCase()} applied successfully!` });
      emitCheckoutChange({ couponCode: couponInput.trim().toUpperCase() });
      setCouponInput('');
    } else {
      setCouponMsg({ text: 'Invalid coupon. Try WORMUP50, FIRST100, or SAVE20', isError: true });
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setOrderError(null);

    const fullAddress = `${houseFlat}, ${street}, ${areaLandmark}, Ahmedabad - ${pincode}`;

    try {
      await placeOrder({
        customerName,
        customerPhone,
        deliveryAddress: fullAddress,
        houseFlat,
        street,
        landmark: areaLandmark,
        city: 'Ahmedabad',
        pincode,
        deliverySlot,
        paymentMethod,
        deliveryInstructions: deliveryInstruction,
        tip,
        storeId: resolvedLocation.storeId,
        areaId: resolvedLocation.areaId,
        addressId: selectedAddressType === 'SAVED' && selectedAddressId ? selectedAddressId : undefined,
        coordinates: deliveryCoords,
      });

      // Celebratory Confetti Animation on Success
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF3B98', '#13B978', '#7856F6', '#F59E0B', '#071B52'],
        });
      } catch {}
    } catch (err: any) {
      setOrderError(err.message || 'Failed to submit order to live store. Please try again.');
    }
  };

  if (cart.length === 0 && !activeTrackingOrder) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: '#F8F2FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7856F6',
            margin: '0 auto 20px',
          }}
        >
          <ShoppingBag size={42} />
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#071B52', marginBottom: '8px' }}>
          Your Cart is Empty
        </h2>
        <p style={{ color: '#667085', fontSize: '1rem', maxWidth: '380px', margin: '0 auto 24px' }}>
          Stock up on fresh vegetables, milk, bakery, and snacks delivered in {resolvedLocation.deliveryMinutes || 9} minutes!
        </p>
        <button className="btn-primary" onClick={() => navigateTo('shop')}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart-checkout-root" style={{ padding: '32px 0 80px', background: '#FBFCFF' }}>
      <div className="container">
        {/* Title & Hub info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#071B52' }}>
              Checkout & Delivery
            </h1>
            <p style={{ color: '#667085', fontSize: '0.9rem', marginTop: '4px' }}>
              Fulfillable by <strong>{resolvedLocation.storeName}</strong> • Express {resolvedLocation.deliveryMinutes || 9}-min dispatch
            </p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            style={{
              background: 'none',
              border: 'none',
              color: '#7856F6',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.92rem',
            }}
          >
            + Add more items
          </button>
        </div>

        {orderError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 18px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              color: '#B91C1C',
              marginBottom: '24px',
              fontSize: '0.92rem',
            }}
          >
            <AlertCircle size={20} />
            <span>{orderError}</span>
          </div>
        )}

        {/* Global Cart & Store Price Notification Banner */}
        {cartNotification && (
          <div
            style={{
              background: '#FFFBEB',
              border: '1.5px solid #FDE68A',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '24px',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} color="#D97706" />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#B45309' }}>
                {cartNotification}
              </span>
            </div>
            <button
              type="button"
              onClick={clearCartNotification}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#92400E',
                fontWeight: 800,
                fontSize: '14px',
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Desktop Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: '36px',
            alignItems: 'start',
          }}
        >
          {/* ==============================================================
              Left Column: Delivery Address, Instructions & Items
              ============================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 1. Interactive Delivery Address Selection Card (Current GPS vs Saved Addresses) */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E6EAF2',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
              }}
            >
              {/* Dynamic Store / Price Update Notification */}
              {cartNotification && (
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1.5px solid #FDE68A',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '18px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color="#D97706" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#B45309' }}>
                      {cartNotification}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearCartNotification}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontWeight: 800, fontSize: '13px' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F2FF', color: '#7856F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      Delivery Location & Address
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#667085', marginTop: '2px' }}>
                      Choose between your current GPS location or a saved address
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    color: '#7856F6',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={14} />
                  <span>Choose on Map / Add</span>
                </button>
              </div>

              {/* TWO CHOICE SELECTOR CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {/* CHOICE A: CURRENT DEVICE LOCATION (GPS) */}
                <div
                  onClick={handleChooseGps}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '16px',
                    padding: '16px',
                    border: selectedAddressType === 'CURRENT_GPS' ? '2px solid #16A34A' : '1.5px solid #E2E8F0',
                    background: selectedAddressType === 'CURRENT_GPS' ? '#F0FDF4' : '#FAFAFA',
                    boxShadow: selectedAddressType === 'CURRENT_GPS' ? '0 4px 14px rgba(22, 163, 74, 0.12)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: selectedAddressType === 'CURRENT_GPS' ? '#DCFCE7' : '#E2E8F0',
                        color: selectedAddressType === 'CURRENT_GPS' ? '#15803D' : '#475569',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                      }}
                    >
                      <Compass size={11} />
                      CURRENT GPS
                    </span>

                    {selectedAddressType === 'CURRENT_GPS' && (
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#16A34A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', marginBottom: '2px' }}>
                    {gpsAddressName || 'Chandlodiya - Tragad'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                    Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>
                    ⚡ Instant 9-min Express Delivery
                  </div>
                </div>

                {/* CHOICE B: SAVED ADDRESSES (HOME / FLAT 402) */}
                {savedAddresses.length > 0 ? (
                  <div
                    onClick={() => handleChooseSaved(savedAddresses[0])}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '16px',
                      padding: '16px',
                      border:
                        selectedAddressType === 'SAVED'
                          ? '2px solid #7856F6'
                          : '1.5px solid #E2E8F0',
                      background:
                        selectedAddressType === 'SAVED'
                          ? '#FBF8FF'
                          : '#FAFAFA',
                      boxShadow:
                        selectedAddressType === 'SAVED'
                          ? '0 4px 14px rgba(120, 86, 246, 0.12)'
                          : 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background:
                            selectedAddressType === 'SAVED'
                              ? '#EDE9FE'
                              : '#E2E8F0',
                          color:
                            selectedAddressType === 'SAVED'
                              ? '#6D28D9'
                              : '#475569',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                        }}
                      >
                        <Home size={11} />
                        {savedAddresses[0].label || 'SAVED HOME'}
                      </span>

                      {selectedAddressType === 'SAVED' && (
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#7856F6',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', marginBottom: '2px' }}>
                      {savedAddresses[0].houseFlat || savedAddresses[0].houseNumber || 'Flat 402, Shivam Residency'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {savedAddresses[0].street}, {savedAddresses[0].city}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#7856F6', fontWeight: 600 }}>
                      🏠 Doorstep verified address
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsLocationModalOpen(true)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '16px',
                      padding: '16px',
                      border: '1.5px dashed #CBD5E1',
                      background: '#FAFAFA',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={18} color="#7856F6" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7856F6' }}>Add Home / Saved Address</span>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Save address for fast 1-click checkout</span>
                  </div>
                )}
              </div>

              {/* All Other Saved Addresses Chips (if multiple exist) */}
              {savedAddresses.length > 1 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Other Saved Addresses:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {savedAddresses.slice(1).map((addr) => {
                      const isSelected = selectedAddressType === 'SAVED' && selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleChooseSaved(addr)}
                          style={{
                            background: isSelected ? '#F5F3FF' : '#FFFFFF',
                            border: isSelected ? '1.5px solid #7856F6' : '1px solid #CBD5E1',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: isSelected ? '#7856F6' : '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{addr.label}:</span>
                          <span>{addr.houseFlat || addr.houseNumber || addr.street}</span>
                          {isSelected && <Check size={12} color="#7856F6" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Address Form Inputs (Pre-filled from Selected Address) */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#071B52', marginBottom: '12px' }}>
                  Delivery Details Confirmation
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Recipient Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>House / Flat / Floor</label>
                    <input
                      type="text"
                      value={houseFlat}
                      onChange={(e) => {
                        setHouseFlat(e.target.value);
                        setSelectedAddressId('');
                        setSelectedAddressType('CURRENT_GPS');
                      }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Street / Society / Building</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => {
                        setStreet(e.target.value);
                        setSelectedAddressId('');
                        setSelectedAddressType('CURRENT_GPS');
                      }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                      Area & Landmark (e.g. Thaltej, Tragad, Bopal)
                    </label>
                    <input
                      type="text"
                      placeholder="Type area e.g. Thaltej, Tragad..."
                      value={areaLandmark}
                      onChange={(e) => {
                        setAreaLandmark(e.target.value);
                        setSelectedAddressId('');
                        setSelectedAddressType('CURRENT_GPS');
                      }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                    {areaDetectionStatus && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: areaDetectionStatus.isServiceable ? '#16A34A' : '#DC2626',
                          background: areaDetectionStatus.isServiceable ? '#F0FDF4' : '#FEF2F2',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${areaDetectionStatus.isServiceable ? '#BBF7D0' : '#FECACA'}`,
                        }}
                      >
                        {areaDetectionStatus.isServiceable ? (
                          <>
                            <CheckCircle2 size={13} color="#16A34A" />
                            <span>✅ {areaDetectionStatus.areaName} detected (Serving from {areaDetectionStatus.storeName})</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={13} color="#DC2626" />
                            <span>⚠️ We don't currently serve this area. Please select a valid area from the map.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Delivery Instructions */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E6EAF2',
                padding: '22px',
                boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#071B52', marginBottom: '12px' }}>
                Delivery Instructions
              </h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  'Ring bell & leave at door',
                  'Avoid calling',
                  'Leave with security / guard',
                  'Do not ring bell',
                ].map((inst) => {
                  const isSel = deliveryInstruction === inst;
                  return (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => handleSelectDeliveryInstruction(inst)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: isSel ? '1.5px solid #7856F6' : '1px solid #E2E8F0',
                        background: isSel ? '#F8F2FF' : '#FFFFFF',
                        color: isSel ? '#7856F6' : '#475569',
                        fontWeight: isSel ? 700 : 500,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      {inst}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Delivery Partner Tip */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E6EAF2',
                padding: '22px',
                boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#071B52' }}>
                    Tip Delivery Partner
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#667085' }}>
                    100% of the tip goes directly to your rider
                  </div>
                </div>
                {tip > 0 && (
                  <span style={{ fontSize: '0.85rem', color: '#13B978', fontWeight: 800 }}>
                    +₹{tip} added
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {[0, 10, 20, 30, 50].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleSelectTip(amount)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      border: tip === amount ? '1.5px solid #13B978' : '1px solid #E2E8F0',
                      background: tip === amount ? '#ECFDF5' : '#FFFFFF',
                      color: tip === amount ? '#059669' : '#475569',
                      fontWeight: tip === amount ? 800 : 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    {amount === 0 ? 'No tip' : `₹${amount}`}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Cart Items Review */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E6EAF2',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#071B52', marginBottom: '16px' }}>
                Items in Cart ({totalItems})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {cart.map((item) => {
                  const p = item.product;
                  const pId = (p.id || p._id) as string;
                  const unitPrice = item.selectedVariant ? item.selectedVariant.price : (p.price || p.sellingPrice || 0);
                  const unitMrp = item.selectedVariant
                    ? (item.selectedVariant.mrp || unitPrice)
                    : (p.mrp || p.oldPrice || unitPrice);
                  const label = item.selectedVariant ? item.selectedVariant.label : (p.unit || p.quantityLabel || '1 unit');

                  return (
                    <div
                      key={pId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '14px',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                          src={p.image || p.imageUrl}
                          alt={p.name}
                          style={{
                            width: '54px',
                            height: '54px',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            background: '#F8FAFC',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#071B52', fontSize: '0.95rem' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#667085' }}>
                            {label} • ₹{unitPrice} each
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controller & Total */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#13B978',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            gap: '10px',
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(pId, item.quantity - 1)}
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(pId, item.quantity + 1)}
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ fontWeight: 800, color: '#071B52', fontSize: '1rem', minWidth: '60px', textAlign: 'right' }}>
                          <div>₹{unitPrice * item.quantity}</div>
                          {unitMrp > unitPrice && (
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                              ₹{unitMrp * item.quantity}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ==============================================================
              Right Column: Bill Details, Coupons, Payment & Place Order
              ============================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Discounts & Wallet Card - Matching App BlinkitCheckoutScreen */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E6EAF2',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#071B52', marginBottom: '16px' }}>
                Discounts & Wallet
              </h3>

              {/* Shopping Coins Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, marginRight: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#FEF3C7',
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Star size={20} fill="#D97706" color="#D97706" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#071B52', fontSize: '0.95rem' }}>
                      Use Shopping Coins
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#667085', marginTop: '2px' }}>
                      Available: {userCoins.toLocaleString()} Coins • Save ₹{maxCoinsUsable}
                    </div>
                  </div>
                </div>

                {/* iOS/Blinkit Style Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={useCoins}
                  disabled={userCoins <= 0}
                  onClick={() => {
                    const nextVal = !useCoins;
                    setUseCoins(nextVal);
                    emitCheckoutChange({ useCoins: nextVal });
                  }}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: '13px',
                    background: useCoins && userCoins > 0 ? '#FF3B98' : '#D1D5DB',
                    border: 'none',
                    padding: '2px',
                    cursor: userCoins > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background-color 0.2s ease',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                      transform: useCoins && userCoins > 0 ? 'translateX(20px)' : 'translateX(0px)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
              </div>

              {/* Applied Badge */}
              {useCoins && coinDiscount > 0 && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#B45309' }}>
                    🪙 {coinDiscount} Shopping Coins applied (-₹{coinDiscount})
                  </span>
                </div>
              )}

              <div style={{ height: '1px', background: '#F1F5F9', margin: '14px 0' }} />

              {/* WOMUP Money Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.85 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, marginRight: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#FCE7F3',
                      color: '#FF3B98',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Wallet size={20} color="#FF3B98" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#071B52', fontSize: '0.95rem' }}>
                      WOMUP Money
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#667085', marginTop: '2px' }}>
                      Available: ₹0
                    </div>
                  </div>
                </div>

                {/* Disabled switch for WOMUP Money */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={false}
                  disabled={true}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: '13px',
                    background: '#E2E8F0',
                    border: 'none',
                    padding: '2px',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transform: 'translateX(0px)',
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E6EAF2',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#071B52', marginBottom: '14px' }}>
                Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: paymentMethod === 'UPI' ? '2px solid #7856F6' : '1px solid #E2E8F0',
                    background: paymentMethod === 'UPI' ? '#F8F2FF' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => handleSelectPaymentMethod('UPI')}
                  />
                  <QrCode size={20} color="#7856F6" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#071B52', fontSize: '0.92rem' }}>UPI / Google Pay / PhonePe</div>
                    <div style={{ fontSize: '0.74rem', color: '#667085' }}>Instant zero-touch payment</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#13B978', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>Fast</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: paymentMethod === 'COD' ? '2px solid #7856F6' : '1px solid #E2E8F0',
                    background: paymentMethod === 'COD' ? '#F8F2FF' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'COD'}
                    onChange={() => handleSelectPaymentMethod('COD')}
                  />
                  <Banknote size={20} color="#13B978" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#071B52', fontSize: '0.92rem' }}>Cash on Delivery (COD)</div>
                    <div style={{ fontSize: '0.74rem', color: '#667085' }}>Pay cash or scan QR when rider arrives</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: paymentMethod === 'CARD' ? '2px solid #7856F6' : '1px solid #E2E8F0',
                    background: paymentMethod === 'CARD' ? '#F8F2FF' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => handleSelectPaymentMethod('CARD')}
                  />
                  <CreditCard size={20} color="#FF3B98" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#071B52', fontSize: '0.92rem' }}>Credit / Debit Card</div>
                    <div style={{ fontSize: '0.74rem', color: '#667085' }}>Visa, Mastercard, RuPay</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Bill Details Summary */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E6EAF2',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#071B52', marginBottom: '16px' }}>
                Bill Summary
              </h3>

              {/* Coupon Row */}
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Promo code (WORMUP50)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#071B52',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Apply
                </button>
              </form>

              {couponMsg && (
                <div style={{ fontSize: '0.78rem', color: couponMsg.isError ? '#EF4444' : '#13B978', marginBottom: '14px', fontWeight: 600 }}>
                  {couponMsg.text}
                </div>
              )}



              {/* Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid #E6EAF2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#475467' }}>
                  <span>Item Total (MRP)</span>
                  <span style={{ fontWeight: 600, color: '#071B52' }}>₹{mrpTotal}</span>
                </div>

                {productDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#10B981', fontWeight: 600 }}>
                    <span>Product Discount</span>
                    <span>- ₹{productDiscount}</span>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#475467' }}>
                    <div>
                      <span>Delivery Partner Fee</span>
                      <div style={{ fontSize: '0.75rem', color: '#667085', marginTop: '1px' }}>
                        {distanceKm} km · ₹{ratePerKm}/km
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, color: '#071B52' }}>₹{deliveryFee}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                    <CheckCircle2 size={12} color="#059669" />
                    <span>100% of delivery fee is paid to your delivery partner</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#475467' }}>
                  <span>Handling & Convenience Fee</span>
                  <span style={{ fontWeight: 600, color: '#071B52' }}>₹{platformFee}</span>
                </div>

                {tip > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#13B978', fontWeight: 600 }}>
                    <span>Delivery Partner Tip</span>
                    <span>₹{tip}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#13B978', fontWeight: 700 }}>
                    <span>Coupon Discount ({appliedCoupon})</span>
                    <span>- ₹{couponDiscount}</span>
                  </div>
                )}

                {coinDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#B45309', fontWeight: 700 }}>
                    <span>Shopping Coins Applied ({coinDiscount} SC)</span>
                    <span>- ₹{coinDiscount}</span>
                  </div>
                )}
              </div>

              {/* Total Payable */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#667085', fontWeight: 700, textTransform: 'uppercase' }}>To Pay</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#071B52' }}>
                    ₹{total + tip}
                  </div>
                </div>
                {totalSavings > 0 ? (
                  <div style={{ fontSize: '0.82rem', color: '#065F46', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: '10px', fontWeight: 700 }}>
                    🎉 You are saving ₹{totalSavings} on this order
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#13B978', background: '#ECFDF5', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                    🪙 +10 Coins on delivery
                  </div>
                )}
              </div>

              {/* Serving Dark Store Info Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: '#F0FDF4',
                  borderRadius: '12px',
                  border: '1px solid #BBF7D0',
                  marginBottom: '14px',
                }}
              >
                <MapPin size={18} color="#16A34A" />
                <div style={{ flex: 1, fontSize: '0.80rem', color: '#166534', fontWeight: 600 }}>
                  Dispatching from: <strong style={{ color: '#065F46' }}>{resolvedLocation.storeName || 'Nearest Dark Store'}</strong>
                  <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '2px' }}>
                    ⚡ {resolvedLocation.deliveryMinutes || 9} min delivery to {areaLandmark || resolvedLocation.areaName}
                  </div>
                </div>
              </div>

              {/* Authoritative Place Order Button */}
              <button
                id="place-order-submit-btn"
                disabled={isSubmittingOrder}
                onClick={handlePlaceOrder}
                style={{
                  width: '100%',
                  background: isSubmittingOrder ? '#94A3B8' : 'linear-gradient(135deg, #13B978 0%, #0F9F66 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '16px',
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  cursor: isSubmittingOrder ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(19, 185, 120, 0.35)',
                }}
              >
                <span>{isSubmittingOrder ? 'Placing Order at Dark Store...' : `Place Order • ₹${total + tip}`}</span>
                <ArrowRight size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.76rem', color: '#667085', marginTop: '16px' }}>
                <ShieldCheck size={16} color="#13B978" />
                <span>Authoritative live store pricing & 10-minute dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Order Tracking Modal */}
      <OrderTrackingModal
        order={activeTrackingOrder}
        onClose={() => {
          setActiveTrackingOrder(null);
          navigateTo('home');
        }}
      />

      {/* Location Picker Modal for Choosing GPS or Saved Addresses */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectAddress={handleAddressFromModal}
      />
    </div>
  );
};
