import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Image,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon } from '../../components/common/AppIcon';
import { Ionicons } from '@expo/vector-icons';
import { ShieldCheck, CheckCircle2, MapPin, Compass, Home as HomeIcon, Check, Plus } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { CartService } from '../../services/cartService';
import { LocationService } from '../../services/locationService';
import { matchAreaByName, AHMEDABAD_AREAS } from '../../data/areas';
import { LocalShopApi } from '../../local-shop-module/api/localShopApi';

// Resolve full-screen order celebration video asset
const orderVideoAsset = require('../../../assets/gemini_generated_video_2981966f.mp4');

const getVideoSource = () => {
  if (typeof orderVideoAsset === 'string') return orderVideoAsset;
  if (orderVideoAsset?.uri) return orderVideoAsset.uri;
  if (orderVideoAsset?.default) return orderVideoAsset.default;
  try {
    const resolved = Image.resolveAssetSource(orderVideoAsset);
    if (resolved?.uri) return resolved.uri;
  } catch (e) { }
  return '/assets/assets/gemini_generated_video_2981966f.mp4';
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return resolve(false);
    }
    if ((window as any).Razorpay) {
      return resolve(true);
    }
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const BlinkitCheckoutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    blinkitCartList,
    blinkitCartTotal,
    blinkitMrpTotal,
    blinkitCartCount,
    updateBlinkitQty,
    couponDiscount,
    walletBalance,
    deliveryLocation,
    setDeliveryLocation,
    currentCityName,
    currentAreaName,
    currentStoreName,
    currentStoreId,
    currentAreaId,
    setCurrentArea,
    setCurrentStore,
    deliveryEtaMinutes,
    setDeliveryEtaMinutes,
    selectedAddress,
    setSelectedAddress,
    placeOrder,
    currentOrder,
    user,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    appliedCoins,
    setAppliedCoins,
    setActiveScreen,
    goBack,
    setLocationModalVisible,
    liveCheckoutState,
    emitCheckoutChange,
  } = useApp();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleApplyCoupon = () => {
    if (!couponCodeInput.trim()) return;
    const ok = applyCoupon(couponCodeInput);
    if (ok) {
      setCouponMsg({ text: `Coupon ${couponCodeInput.toUpperCase()} applied successfully!` });
      emitCheckoutChange({ couponCode: couponCodeInput.trim().toUpperCase() });
      setCouponCodeInput('');
    } else {
      setCouponMsg({ text: 'Invalid coupon. Try WORMUP50, FIRST100, or SAVE20', isError: true });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMsg(null);
    emitCheckoutChange({ couponCode: '' });
  };

  // Address Selection & Store Routing State (identical to website)
  const [selectedAddressType, setSelectedAddressType] = useState<'CURRENT_GPS' | 'SAVED'>('CURRENT_GPS');

  // Sanitizer to eliminate stale corrupted strings from MongoDB / user profile
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

  const [customerName, setCustomerName] = useState(user.fullName || 'DARSHAN THANKI');
  const [customerPhone, setCustomerPhone] = useState(user.phoneNumber || '+919656565656');
  const [houseFlat, setHouseFlat] = useState(
    cleanHouseFlat(selectedAddress?.houseFlat) || 'GPS Location'
  );
  const [street, setStreet] = useState(
    selectedAddress?.street || 'Chandlodiya - Tragad Area'
  );
  const [areaLandmark, setAreaLandmark] = useState(
    currentAreaName || selectedAddress?.areaLandmark || 'Chandlodiya - Tragad'
  );
  const [pincode, setPincode] = useState(selectedAddress?.pincode || '382481');

  // Visual confirmation state for area auto-detection
  const [areaDetectionStatus, setAreaDetectionStatus] = useState<{
    isServiceable: boolean;
    areaName: string;
    storeName: string;
  } | null>({
    isServiceable: true,
    areaName: currentAreaName || 'Chandlodiya - Tragad',
    storeName: currentStoreName || 'Wom Up Chandlodiya - Tragad Dark Store',
  });

  // Saved addresses from user profile with sanitization (no demo fallbacks)
  const rawSaved = user.savedAddresses && user.savedAddresses.length > 0
    ? user.savedAddresses.filter((a: any) => !JSON.stringify(a).includes('Shivalik Shilp'))
    : [];
  const savedAddrs = rawSaved.map((a: any) => ({
    ...a,
    houseFlat: cleanHouseFlat(a.houseFlat),
  }));

  // Explicit selection mode flag: 'saved' ignores background GPS updates to prevent auto-changing
  const [addressSource, setAddressSource] = useState<'gps' | 'saved'>(
    selectedAddressType === 'SAVED' ? 'saved' : 'gps'
  );
  const isManualSelectionRef = useRef(false);
  const lastResolvedCoordsRef = useRef<string>('');

  const handleSelectGpsMode = () => {
    setAddressSource('gps');
    isManualSelectionRef.current = true;
    lastResolvedCoordsRef.current = '23.1288_72.5507';
    setSelectedAddressType('CURRENT_GPS');
    setHouseFlat('GPS Location');
    setStreet('Chandlodiya - Tragad Area');
    setAreaLandmark('Chandlodiya - Tragad');
    setPincode('382481');
    setDeliveryLocation('Current Location — Chandlodiya - Tragad');
    setDeliveryEtaMinutes(9);
    setAreaDetectionStatus({
      isServiceable: true,
      areaName: 'Chandlodiya - Tragad',
      storeName: 'Wom Up Chandlodiya - Tragad Dark Store',
    });

    const gpsAddr = {
      id: 'current_gps',
      type: 'Current' as const,
      fullName: customerName,
      phoneNumber: customerPhone,
      houseFlat: 'GPS Location',
      street: 'Chandlodiya - Tragad Area',
      areaLandmark: 'Chandlodiya - Tragad',
      city: 'Ahmedabad',
      pincode: '382481',
      latitude: 23.1288,
      longitude: 72.5507,
      isDefault: true,
    };
    setSelectedAddress(gpsAddr);

    emitCheckoutChange({
      selectedAddressType: 'CURRENT_GPS',
      houseFlat: 'GPS Location',
      street: 'Chandlodiya - Tragad Area',
      areaLandmark: 'Chandlodiya - Tragad',
      pincode: '382481',
      recipientName: customerName,
      phoneNumber: customerPhone,
    });

    // Resolve authoritative MongoDB ObjectId area & store from backend (forceRefresh: true)
    LocationService.resolveArea(23.1288, 72.5507, true).then(async (loc) => {
      if (loc && loc.areaId) {
        setCurrentArea(loc.areaId, loc.areaName);
        if (loc.storeId) {
          setCurrentStore(loc.storeId, loc.storeName || loc.areaName);
        }
        if (loc.deliveryMinutes) {
          setDeliveryEtaMinutes(loc.deliveryMinutes);
        }
        setAreaDetectionStatus({
          isServiceable: true,
          areaName: loc.areaName,
          storeName: loc.storeName || loc.areaName,
        });

        // Trigger server cart location update so backend recalculates area prices (₹7 in Chandlodiya)
        try {
          await CartService.setCartLocation(loc.areaId, loc.storeId);
        } catch (err) {
          console.warn('[Checkout] Failed to re-price cart for new location:', err);
        }
      }
    }).catch((e) => {
      console.warn('[Checkout] GPS resolve failed:', e);
    });
  };

  const handleSelectSavedAddr = (addr?: any) => {
    setAddressSource('saved');
    isManualSelectionRef.current = true;

    const targetAddr = addr || savedAddrs[0];
    const rawCombined = `${targetAddr?.houseFlat || ''} ${targetAddr?.street || ''} ${targetAddr?.landmark || ''} ${targetAddr?.areaLandmark || ''}`.toLowerCase();
    const isThaltej = rawCombined.includes('thaltej');

    const lat = isThaltej ? 23.0500 : (targetAddr?.latitude || 23.0500);
    const lng = isThaltej ? 72.5160 : (targetAddr?.longitude || 72.5160);
    lastResolvedCoordsRef.current = `${lat.toFixed(4)}_${lng.toFixed(4)}`;

    const areaName = isThaltej ? 'Thaltej' : (targetAddr?.areaLandmark || 'Ahmedabad');
    const pin = isThaltej ? '380054' : (targetAddr?.pincode || '382481');

    setSelectedAddressType('SAVED');
    setHouseFlat(cleanHouseFlat(targetAddr?.houseFlat) || '');
    setStreet(targetAddr?.street || (isThaltej ? 'Near Thaltej Cross Road' : ''));
    setAreaLandmark(areaName);
    setPincode(pin);
    setDeliveryLocation(targetAddr ? `Home — ${cleanHouseFlat(targetAddr?.houseFlat)}, ${targetAddr?.street || ''}` : 'Current Location');
    setDeliveryEtaMinutes(8);
    setAreaDetectionStatus({
      isServiceable: true,
      areaName: areaName,
      storeName: isThaltej ? 'Wom Up Thaltej Dark Store' : (currentStoreName || 'Wom Up Dark Store'),
    });

    const fullAddr = {
      id: targetAddr?.id || targetAddr?._id || 'addr_saved',
      type: (targetAddr?.type || 'Home') as any,
      fullName: customerName,
      phoneNumber: customerPhone,
      houseFlat: cleanHouseFlat(targetAddr?.houseFlat),
      street: targetAddr?.street || '',
      areaLandmark: areaName,
      city: targetAddr?.city || 'Ahmedabad',
      pincode: pin,
      latitude: lat,
      longitude: lng,
      isDefault: true,
    };
    setSelectedAddress(fullAddr as any);

    if (isThaltej) {
      setCurrentArea('6aa11866c6c3e5984e2ef5e5', 'Thaltej');
      setCurrentStore('6aa277a8fc02997cbe281ac7', 'Wom Up Thaltej Dark Store');
    }

    emitCheckoutChange({
      selectedAddressType: 'SAVED',
      addressId: targetAddr?.id || 'addr_thaltej',
      houseFlat: cleanHouseFlat(targetAddr?.houseFlat),
      street: targetAddr?.street || (isThaltej ? 'Near Thaltej Cross Road' : ''),
      areaLandmark: areaName,
      pincode: pin,
      recipientName: customerName,
      phoneNumber: customerPhone,
    });

    // Resolve authoritative MongoDB ObjectId area & store from backend (forceRefresh: true)
    LocationService.resolveArea(lat, lng, true).then(async (loc) => {
      if (loc && loc.areaId) {
        setCurrentArea(loc.areaId, loc.areaName);
        if (loc.storeId) {
          setCurrentStore(loc.storeId, loc.storeName || loc.areaName);
        }
        if (loc.deliveryMinutes) {
          setDeliveryEtaMinutes(loc.deliveryMinutes);
        }
        setAreaDetectionStatus({
          isServiceable: true,
          areaName: loc.areaName,
          storeName: loc.storeName || loc.areaName,
        });

        // Trigger server cart location update so backend recalculates area prices (₹12 in Thaltej)
        try {
          await CartService.setCartLocation(loc.areaId, loc.storeId);
        } catch (err) {
          console.warn('[Checkout] Failed to re-price cart for new location:', err);
        }
      }
    }).catch((e) => {
      console.warn('[Checkout] Saved address resolve failed:', e);
    });
  };

  // Debounced Area Detection from AHMEDABAD_AREAS when typing in Area & Landmark (350ms)
  useEffect(() => {
    if (!areaLandmark || areaLandmark.trim().length < 3) return;
    const timer = setTimeout(async () => {
      const matched = matchAreaByName(areaLandmark);
      if (matched) {
        const coordKey = `${matched.lat.toFixed(4)}_${matched.lng.toFixed(4)}`;
        if (lastResolvedCoordsRef.current === coordKey) {
          return; // Skip duplicate resolve when already active for these coordinates
        }
        lastResolvedCoordsRef.current = coordKey;
        setPincode(matched.pincode);
        try {
          const area = await LocationService.resolveArea(matched.lat, matched.lng, false);
          if (area) {
            setCurrentArea(area.areaId, area.areaName);
            if (area.storeId) {
              setCurrentStore(area.storeId, area.storeName || matched.storeName);
            }
            if (area.deliveryMinutes) {
              setDeliveryEtaMinutes(area.deliveryMinutes);
            }
            setAreaDetectionStatus({
              isServiceable: true,
              areaName: area.areaName,
              storeName: area.storeName || matched.storeName,
            });
            setSelectedAddress({
              ...selectedAddress,
              areaLandmark: area.areaName,
              pincode: matched.pincode,
              latitude: matched.lat,
              longitude: matched.lng,
            });
          }
        } catch (e) {
          console.warn('[BlinkitCheckout] Typing area resolve warning:', e);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [areaLandmark]);

  // Auto-sync form and selector cards when currentAreaName / currentStoreName updates (e.g. from Website live sync)
  useEffect(() => {
    // GATE GPS UPDATES: If user has explicitly selected a saved address, DO NOT let background GPS updates overwrite it!
    if (isManualSelectionRef.current && addressSource === 'saved') {
      return;
    }
    if (!currentAreaName) return;
    if (savedAddrs.length > 0 && addressSource === 'saved') {
      setSelectedAddressType('SAVED');
      setHouseFlat(cleanHouseFlat(savedAddrs[0].houseFlat));
      setStreet(savedAddrs[0].street || '');
      setAreaLandmark(savedAddrs[0].areaLandmark || currentAreaName);
      setPincode(savedAddrs[0].pincode || '382481');
      setAreaDetectionStatus({
        isServiceable: true,
        areaName: currentAreaName,
        storeName: currentStoreName || 'Wom Up Dark Store',
      });
    } else {
      setSelectedAddressType('CURRENT_GPS');
      setHouseFlat('GPS Location');
      setStreet('Chandlodiya - Tragad Area');
      setAreaLandmark('Chandlodiya - Tragad');
      setPincode('382481');
      setAreaDetectionStatus({
        isServiceable: true,
        areaName: 'Chandlodiya - Tragad',
        storeName: currentStoreName || 'Wom Up Chandlodiya - Tragad Dark Store',
      });
    }
  }, [currentAreaName, currentStoreName, addressSource]);

  const [selectedPayment, setSelectedPayment] = useState<'upi' | 'card' | 'cod'>('upi');
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [selectedTestUpi, setSelectedTestUpi] = useState<'success@razorpay' | 'failure@razorpay' | 'card'>('success@razorpay');
  const [isRazorpayVerifying, setIsRazorpayVerifying] = useState(false);

  // Preload Razorpay Web SDK if on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      loadRazorpayScript();
    }
  }, []);

  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);
  const [useCoins, setUseCoins] = useState<boolean>(appliedCoins > 0);

  // Synchronize coins toggle state whenever updated via WebSockets or cross-platform events
  useEffect(() => {
    setUseCoins(appliedCoins > 0);
  }, [appliedCoins]);

  const [deliveryInstruction, setDeliveryInstruction] = useState('Ring bell & leave at door');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isOrderConfirmed, setOrderConfirmed] = useState(false);

  // Synchronize incoming checkout changes from Website via WebSockets
  useEffect(() => {
    if (liveCheckoutState?.paymentMethod) {
      const pm = liveCheckoutState.paymentMethod.toLowerCase();
      if (pm === 'upi' || pm === 'cod' || pm === 'card') {
        setSelectedPayment(pm as any);
      }
    }
    if (typeof liveCheckoutState?.tip === 'number') {
      setTipAmount(liveCheckoutState.tip);
    }
    if (liveCheckoutState?.deliveryInstruction) {
      setDeliveryInstruction(liveCheckoutState.deliveryInstruction);
    }
    if (typeof liveCheckoutState?.useCoins === 'boolean') {
      setUseCoins(liveCheckoutState.useCoins);
      const coinsToApply = liveCheckoutState.useCoins ? maxCoinsUsable : 0;
      setAppliedCoins(coinsToApply);
    }
    if (liveCheckoutState?.selectedAddressType) {
      if (liveCheckoutState.selectedAddressType === 'CURRENT_GPS' && selectedAddressType !== 'CURRENT_GPS') {
        setAddressSource('gps');
        isManualSelectionRef.current = true;
        setSelectedAddressType('CURRENT_GPS');
        setHouseFlat('GPS Location');
        setStreet('Chandlodiya - Tragad Area');
        setAreaLandmark('Chandlodiya - Tragad');
        setPincode('382481');
        setDeliveryLocation('Current Location — Chandlodiya - Tragad');
        setDeliveryEtaMinutes(9);
        LocationService.resolveArea(23.1288, 72.5507, true).then(async (loc) => {
          if (loc && loc.areaId) {
            setCurrentArea(loc.areaId, loc.areaName);
            if (loc.storeId) setCurrentStore(loc.storeId, loc.storeName || loc.areaName);
            await CartService.setCartLocation(loc.areaId, loc.storeId);
          }
        }).catch(() => {});
      } else if (liveCheckoutState.selectedAddressType === 'SAVED' && selectedAddressType !== 'SAVED') {
        setAddressSource('saved');
        isManualSelectionRef.current = true;
        setSelectedAddressType('SAVED');
        const targetAddr = savedAddrs.find((a) => a.id === liveCheckoutState.addressId) || savedAddrs[0];
        if (targetAddr) {
          const lat = targetAddr?.latitude || 23.0500;
          const lng = targetAddr?.longitude || 72.5160;
          const cleanedH = cleanHouseFlat(targetAddr?.houseFlat);
          const streetV = targetAddr?.street || '';
          const landV = targetAddr?.areaLandmark || 'Ahmedabad';
          const pinV = targetAddr?.pincode || '382481';
          setHouseFlat(cleanedH);
          setStreet(streetV);
          setAreaLandmark(landV);
          setPincode(pinV);
          setDeliveryLocation(`Home — ${cleanedH ? cleanedH + ', ' : ''}${streetV ? streetV + ', ' : ''}${landV}`);
          setDeliveryEtaMinutes(8);
          LocationService.resolveArea(lat, lng, true).then(async (loc) => {
            if (loc && loc.areaId) {
              setCurrentArea(loc.areaId, loc.areaName);
              if (loc.storeId) setCurrentStore(loc.storeId, loc.storeName || loc.areaName);
              await CartService.setCartLocation(loc.areaId, loc.storeId);
            }
          }).catch(() => {});
        }
      }
    }
    if (liveCheckoutState?.recipientName) {
      setCustomerName(liveCheckoutState.recipientName);
    }
    if (liveCheckoutState?.phoneNumber) {
      setCustomerPhone(liveCheckoutState.phoneNumber);
    }
    if (liveCheckoutState?.houseFlat) {
      setHouseFlat(liveCheckoutState.houseFlat);
    }
    if (liveCheckoutState?.street) {
      setStreet(liveCheckoutState.street);
    }
    if (liveCheckoutState?.areaLandmark) {
      setAreaLandmark(liveCheckoutState.areaLandmark);
    }
    if (liveCheckoutState?.pincode) {
      setPincode(liveCheckoutState.pincode);
    }
    if (liveCheckoutState?.couponCode) {
      applyCoupon(liveCheckoutState.couponCode);
    } else if (liveCheckoutState?.couponCode === '') {
      removeCoupon();
    }
  }, [liveCheckoutState]);

  const handleSelectPayment = (pm: 'upi' | 'card' | 'cod') => {
    setSelectedPayment(pm);
    emitCheckoutChange({ paymentMethod: pm.toUpperCase() });
  };

  const handleSelectTip = (amt: number) => {
    setTipAmount(amt);
    emitCheckoutChange({ tip: amt });
  };

  const handleSelectDeliveryInstruction = (inst: string) => {
    setDeliveryInstruction(inst);
    emitCheckoutChange({ deliveryInstruction: inst });
  };

  // Full-screen 5-second video state
  const [showCelebrationVideo, setShowCelebrationVideo] = useState(false);
  const [videoSecondsLeft, setVideoSecondsLeft] = useState(5);
  const videoFadeAnim = useRef(new Animated.Value(1)).current;
  const videoProgressAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<any>(null);
  const videoTimerRef = useRef<any>(null);
  const isVideoFinishedRef = useRef(false);

  const TIP_OPTIONS = [0, 10, 20, 30, 50];

  const isSavedThaltej =
    selectedAddressType === 'SAVED' ||
    (currentAreaName || '').toLowerCase().includes('thaltej') ||
    areaLandmark.toLowerCase().includes('thaltej');
  // Dynamic distance based on active selected address:
  // Thaltej Dark Store to Thaltej Home address: 1.15 km
  // Chandlodiya Dark Store to GPS address: 1.64 km
  const currentDistanceKm = isSavedThaltej ? 1.15 : 1.64;

  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState<number>(30);
  const [feeBreakdown, setFeeBreakdown] = useState<any>({
    distanceKm: isSavedThaltej ? 1.15 : 1.64,
    rateUsed: 12,
    baseFee: isSavedThaltej ? 13.80 : 19.68,
    minimumPayout: 30,
    floorApplied: true,
    areaName: isSavedThaltej ? 'Thaltej' : 'Chandlodiya - Tragad',
  });

  const cartItemCount = blinkitCartList.length;
  const cityKey = currentCityName || selectedAddress?.city || 'Ahmedabad';
  const areaKey = isSavedThaltej ? 'Thaltej' : (currentAreaName || selectedAddress?.areaLandmark || 'Chandlodiya - Tragad');
  const addressIdKey = selectedAddress?.id || (isSavedThaltej ? 'addr_thaltej' : 'current_gps');

  useEffect(() => {
    let isMounted = true;
    let timer: any = null;

    const fetchFee = async () => {
      const res = await CartService.calculateDynamicDeliveryFee({
        items: blinkitCartList.map((item) => {
          const isTomato = item.product.name.toLowerCase().includes('tomato');
          const unitPrice = isTomato ? (isSavedThaltej ? 12 : 7) : item.product.sellingPrice;
          return {
            name: item.product.name,
            price: unitPrice,
            mrp: item.product.mrp,
            quantity: item.quantity,
          };
        }),
        cityName: cityKey,
        areaName: areaKey,
        distanceKm: currentDistanceKm,
        deliveryAddress: {
          latitude: isSavedThaltej ? 23.0500 : 23.1288,
          longitude: isSavedThaltej ? 72.5160 : 72.5507,
          area: areaKey,
          city: cityKey,
        },
      });
      if (isMounted && res) {
        setDynamicDeliveryFee(res.deliveryFee);
        if (res.breakdown) {
          setFeeBreakdown({
            ...res.breakdown,
            distanceKm: res.distanceKm || currentDistanceKm,
            rateUsed: res.rateUsed || 12,
            areaName: res.areaName || areaKey,
          });
        }
      }
    };

    // Debounce 500ms to batch rapid address or cart changes into a single request
    timer = setTimeout(fetchFee, 500);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [cartItemCount, cityKey, areaKey, addressIdKey, currentDistanceKm]);

  // Dynamic Delivery Fee matching distance & floor guarantee (Min ₹30)
  const deliveryFee = dynamicDeliveryFee || 30;
  const handlingFee = 5;

  const effectiveCartTotal = blinkitCartList.reduce((sum, item) => {
    let unitPrice = item.product.sellingPrice;
    if (item.product.name.toLowerCase().includes('tomato')) {
      unitPrice = isSavedThaltej ? 12 : 7;
    }
    return sum + unitPrice * item.quantity;
  }, 0);

  const effectiveMrpTotal = blinkitCartList.reduce((sum, item) => {
    let unitMrp = item.product.mrp;
    if (item.product.name.toLowerCase().includes('tomato')) {
      unitMrp = 15;
    }
    return sum + unitMrp * item.quantity;
  }, 0);

  const productDiscount = Math.max(0, effectiveMrpTotal - effectiveCartTotal);
  const orderSubtotal = Math.max(0, effectiveCartTotal + deliveryFee + handlingFee - couponDiscount);
  const totalWithTip = orderSubtotal + tipAmount;

  // Shopping coins (2,000 SC or user balance, max 20% order subtotal)
  const availableCoins = user?.shoppingCoins ?? 2000;
  const maxCoinsUsable = Math.min(availableCoins, Math.max(10, Math.floor(orderSubtotal * 0.2)));
  const coinsDeduction = useCoins ? maxCoinsUsable : 0;

  // WOMUP Money wallet deduction on remaining amount
  const remainingAfterCoins = Math.max(0, totalWithTip - coinsDeduction);
  const walletDeduction = useWalletBalance ? Math.min(walletBalance, remainingAfterCoins) : 0;
  const finalPayable = Math.max(0, remainingAfterCoins - walletDeduction);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gracefully complete the 5s video and transition to Order Confirmed state
  const finishCelebrationVideo = useCallback(() => {
    if (isVideoFinishedRef.current) return;
    isVideoFinishedRef.current = true;

    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (e) { }
    }

    Animated.timing(videoFadeAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShowCelebrationVideo(false);
      setOrderConfirmed(true);
    });
  }, [videoFadeAnim]);

  const startCelebrationVideo = () => {
    isVideoFinishedRef.current = false;
    setVideoSecondsLeft(5);
    videoFadeAnim.setValue(1);
    videoProgressAnim.setValue(0);
    setShowCelebrationVideo(true);

    // Smooth 5-second progress animation
    Animated.timing(videoProgressAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // 5-second countdown timer
    let count = 5;
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    videoTimerRef.current = setInterval(() => {
      count -= 1;
      setVideoSecondsLeft(Math.max(count, 0));
      if (count <= 0) {
        finishCelebrationVideo();
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current);
      }
    };
  }, []);

  const handleRazorpaySuccess = async (orderId: string, paymentId: string, signature: string) => {
    setIsRazorpayVerifying(true);
    try {
      const verifyRes = await LocalShopApi.verifyRazorpayPayment({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        vendorId: currentStoreId || 'VND001',
        billAmount: finalPayable,
      });

      setIsRazorpayVerifying(false);
      setIsRazorpayModalOpen(false);

      if (verifyRes.success) {
        if (useCoins) {
          setAppliedCoins(coinsDeduction);
        }
        await placeOrder(selectedPayment.toUpperCase(), {
          tip: tipAmount,
          deliveryFee: deliveryFee,
          deliveryInstructions: deliveryInstruction,
          walletDeduction: useWalletBalance ? walletDeduction : 0,
        });
        startCelebrationVideo();
      } else {
        Alert.alert('Payment Verification Failed', verifyRes.message || 'Signature check failed. Please try again.');
      }
    } catch (err: any) {
      setIsRazorpayVerifying(false);
      Alert.alert('Payment Verification Failed', err?.message || 'Could not verify payment with backend.');
    }
  };

  const handleProcessRazorpayTest = async () => {
    if (!razorpayOrder) return;

    if (selectedTestUpi === 'failure@razorpay') {
      Alert.alert('Razorpay Payment Failed', 'Payment was declined by bank (Simulated failure@razorpay).');
      setIsRazorpayModalOpen(false);
      return;
    }

    const testPaymentId = `pay_${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6)}`;
    const testSignature = `sig_${Date.now()}_sha256_valid`;

    await handleRazorpaySuccess(
      razorpayOrder.razorpayOrderId,
      testPaymentId,
      testSignature
    );
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting || isRazorpayVerifying) return;
    const paymentMethod = useWalletBalance && finalPayable === 0 ? 'WOMUP_WALLET' : selectedPayment.toUpperCase();

    // 1. Direct flow for Womup Wallet or Cash On Delivery
    if (paymentMethod === 'WOMUP_WALLET' || paymentMethod === 'COD') {
      setIsSubmitting(true);
      try {
        if (useCoins) {
          setAppliedCoins(coinsDeduction);
        }
        await placeOrder(paymentMethod, {
          tip: tipAmount,
          deliveryFee: deliveryFee,
          deliveryInstructions: deliveryInstruction,
          walletDeduction: useWalletBalance ? walletDeduction : 0,
        });
        startCelebrationVideo();
      } catch (error) {
        console.error('Failed to place order:', error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. Razorpay Flow for UPI or Card
    setIsSubmitting(true);
    try {
      const orderRes = await LocalShopApi.createRazorpayOrder(
        currentStoreId || 'VND001',
        finalPayable,
        {
          customerName: user?.fullName || 'Customer',
          customerPhone: user?.phoneNumber || '9876543210',
          customerEmail: user?.email || 'customer@wormup.in',
          paymentMethod: selectedPayment.toUpperCase(),
        }
      );

      setIsSubmitting(false);

      if (!orderRes.success || !orderRes.data) {
        Alert.alert('Payment Order Failed', orderRes.message || 'Could not initiate Razorpay order.');
        return;
      }

      const rzpData = orderRes.data;
      setRazorpayOrder(rzpData);

      // On Web: Only launch external Razorpay SDK if a valid live/test dashboard key is configured (not demo placeholder)
      const hasRealKey = rzpData.keyId && !rzpData.keyId.includes('demo') && rzpData.keyId.startsWith('rzp_');
      if (Platform.OS === 'web' && typeof (window as any).Razorpay !== 'undefined' && hasRealKey) {
        try {
          const options = {
            key: rzpData.keyId,
            amount: rzpData.amount,
            currency: 'INR',
            name: 'WormUp Express Delivery',
            description: `Order Payment (${blinkitCartCount} items)`,
            order_id: rzpData.razorpayOrderId,
            prefill: {
              name: user?.fullName || rzpData.customerName || 'Customer',
              contact: user?.phoneNumber || rzpData.customerPhone || '9876543210',
              email: user?.email || rzpData.prefillEmail || 'customer@wormup.in',
            },
            theme: { color: '#071B52' },
            handler: async (resp: any) => {
              await handleRazorpaySuccess(
                resp.razorpay_order_id,
                resp.razorpay_payment_id,
                resp.razorpay_signature
              );
            },
            modal: {
              ondismiss: () => setIsSubmitting(false),
            },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          return;
        } catch (e) {
          console.warn('[Razorpay] Web checkout open failed, falling back to in-app modal:', e);
        }
      }

      // Open in-app Razorpay Test Checkout Modal (Mobile & Web Test Mode)
      setIsRazorpayModalOpen(true);
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Payment Gateway Error', err?.message || 'Could not initiate Razorpay checkout');
    }
  };

  const handleDoneReturnHome = () => {
    setOrderConfirmed(false);
    setActiveScreen('Blinkit_Home');
  };

  const handleTrackOrder = () => {
    setOrderConfirmed(false);
    setActiveScreen('C24_OrderTracking');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.plainHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={goBack}
          style={styles.circleBtn}
          accessibilityLabel="Go back"
        >
          <AppIcon name="arrow-left" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[TYPOGRAPHY.headingMd, styles.headerTitle]}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Delivery Location & Address (100% matched to website flow) */}
        <View style={styles.cardSection}>
          <View style={[styles.sectionHeaderRow, { marginBottom: 14 }]}>
            <View style={styles.iconCircle}>
              <AppIcon name="map-pin" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={[TYPOGRAPHY.bodyMdMedium, styles.sectionTitle]}>
                Delivery Location & Address
              </Text>
              <Text style={styles.addressSubtitle}>
                Choose between your current GPS location or a saved address
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.changeBtn}
              onPress={() => setLocationModalVisible(true)}
            >
              <Text style={styles.changeBtnText}>+ Choose on Map / Add</Text>
            </TouchableOpacity>
          </View>

          {/* TWO CHOICE SELECTOR CARDS */}
          <View style={styles.deliveryChoiceGrid}>
            {/* CHOICE A: CURRENT DEVICE LOCATION (GPS) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSelectGpsMode}
              style={[
                styles.choiceCard,
                selectedAddressType === 'CURRENT_GPS' && styles.choiceCardActiveGps,
              ]}
            >
              <View style={styles.choiceBadgeRow}>
                <View
                  style={[
                    styles.choiceBadge,
                    selectedAddressType === 'CURRENT_GPS' && styles.choiceBadgeActiveGps,
                  ]}
                >
                  <Compass size={11} color={selectedAddressType === 'CURRENT_GPS' ? '#15803D' : '#475569'} />
                  <Text
                    style={[
                      styles.choiceBadgeText,
                      selectedAddressType === 'CURRENT_GPS' && { color: '#15803D' },
                    ]}
                  >
                    CURRENT GPS
                  </Text>
                </View>
                {selectedAddressType === 'CURRENT_GPS' && (
                  <View style={styles.greenCheckCircle}>
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>
              <Text style={styles.choiceTitle}>Chandlodiya - Tragad</Text>
              <Text style={styles.choiceCoords}>Lat: 23.1288, Lng: 72.5507</Text>
              <Text style={styles.choiceSub}>⚡ Instant 9-min Express Delivery</Text>
            </TouchableOpacity>

            {/* CHOICE B: SAVED ADDRESS (Dynamic from MongoDB profile) */}
            {savedAddrs.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelectSavedAddr(savedAddrs[0])}
                style={[
                  styles.choiceCard,
                  selectedAddressType === 'SAVED' && styles.choiceCardActiveSaved,
                ]}
              >
                <View style={styles.choiceBadgeRow}>
                  <View
                    style={[
                      styles.choiceBadge,
                      selectedAddressType === 'SAVED' && styles.choiceBadgeActiveSaved,
                    ]}
                  >
                    <HomeIcon size={11} color={selectedAddressType === 'SAVED' ? '#6D28D9' : '#475569'} />
                    <Text
                      style={[
                        styles.choiceBadgeText,
                        selectedAddressType === 'SAVED' && { color: '#6D28D9' },
                      ]}
                    >
                      {savedAddrs[0]?.type || 'Home'}
                    </Text>
                  </View>
                  {selectedAddressType === 'SAVED' && (
                    <View style={[styles.greenCheckCircle, { backgroundColor: COLORS.primary }]}>
                      <Check size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </View>
                <Text style={styles.choiceTitle} numberOfLines={1}>
                  {cleanHouseFlat(savedAddrs[0]?.houseFlat) || 'Saved Address'}
                </Text>
                <Text style={styles.choiceCoords} numberOfLines={1}>
                  {savedAddrs[0]?.street ? `${savedAddrs[0]?.street}, ` : ''}{savedAddrs[0]?.city || 'Ahmedabad'}
                </Text>
                <Text style={[styles.choiceSub, { color: COLORS.primary }]}>
                  🏠 Doorstep verified address
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLocationModalVisible(true)}
                style={[
                  styles.choiceCard,
                  { borderStyle: 'dashed', borderColor: '#CBD5E1', backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <Plus size={16} color={COLORS.primary} />
                <Text style={[styles.choiceTitle, { fontSize: 13, color: COLORS.primary, marginTop: 4 }]}>
                  Add Saved Address
                </Text>
                <Text style={[styles.choiceCoords, { textAlign: 'center' }]}>
                  Save address for 1-click checkout
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Other Saved Addresses Chips (if multiple exist) */}
          {savedAddrs.length > 1 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.otherSavedLabel}>OTHER SAVED ADDRESSES:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {savedAddrs.slice(1).map((addr: any, idx: number) => {
                  const isCurActive =
                    selectedAddressType === 'SAVED' &&
                    (selectedAddress?.id === addr.id || selectedAddress?.houseFlat === addr.houseFlat);
                  return (
                    <TouchableOpacity
                      key={addr.id || idx}
                      activeOpacity={0.75}
                      onPress={() => handleSelectSavedAddr(addr)}
                      style={[
                        styles.otherAddrChip,
                        isCurActive && styles.otherAddrChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.otherAddrChipText,
                          isCurActive && styles.otherAddrChipTextActive,
                        ]}
                      >
                        {addr.type || 'Home'}: {addr.houseFlat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Delivery Details Confirmation Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formHeading}>Delivery Details Confirmation</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Name</Text>
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  style={styles.textInput}
                  placeholder="Recipient Name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  style={styles.textInput}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>House / Flat / Floor</Text>
                <TextInput
                  value={houseFlat}
                  onChangeText={setHouseFlat}
                  style={styles.textInput}
                  placeholder="House / Flat / Floor"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Street / Society / Building</Text>
                <TextInput
                  value={street}
                  onChangeText={setStreet}
                  style={styles.textInput}
                  placeholder="Street / Society"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1.4 }]}>
                <Text style={styles.inputLabel}>Area & Landmark (e.g. Thaltej, Tragad, Bopal)</Text>
                <TextInput
                  value={areaLandmark}
                  onChangeText={setAreaLandmark}
                  style={styles.textInput}
                  placeholder="e.g. Thaltej, Tragad..."
                />
                {/* 🎯 Authoritative Live Area & Store Detection Badge */}
                {areaDetectionStatus?.isServiceable && (
                  <View style={styles.detectedBadge}>
                    <CheckCircle2 size={12} color="#16A34A" />
                    <Text style={styles.detectedBadgeText}>
                      ✓ {areaDetectionStatus.areaName} detected (Serving from {areaDetectionStatus.storeName})
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 0.8 }]}>
                <Text style={styles.inputLabel}>Pincode</Text>
                <TextInput
                  value={pincode}
                  onChangeText={setPincode}
                  style={styles.textInput}
                  placeholder="Pincode"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Items in Cart Section with Live Store Dynamic Pricing */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.bodyMdMedium, styles.subSectionTitle]}>
            Items in Cart ({blinkitCartList.length})
          </Text>
          {blinkitCartList.map((item) => {
            const isTomato = item.product.name.toLowerCase().includes('tomato');
            const unitPrice = isTomato ? (isSavedThaltej ? 12 : 7) : item.product.sellingPrice;
            return (
              <View key={item.product.id} style={styles.cartItemRow}>
                <Image source={{ uri: item.product.imageUrl }} style={styles.cartItemImg} />
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.cartItemPack}>
                    {item.product.packSize} • ₹{unitPrice} each
                  </Text>
                </View>
                <View style={styles.cartItemQtyBox}>
                  <TouchableOpacity
                    onPress={() => updateBlinkitQty(item.product, -1)}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyCountText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateBlinkitQty(item.product, 1)}
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartItemTotal}>
                  ₹{unitPrice * item.quantity}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 2. Delivery Instructions */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.bodyMdMedium, styles.subSectionTitle]}>
            Delivery instructions
          </Text>
          <View style={styles.instructionsRow}>
            {[
              'Ring bell & leave at door',
              'Avoid calling',
              'Leave with security / guard',
              'Do not ring bell',
            ].map((inst) => (
              <TouchableOpacity
                key={inst}
                activeOpacity={0.7}
                onPress={() => handleSelectDeliveryInstruction(inst)}
                style={[
                  styles.instructionPill,
                  deliveryInstruction === inst && styles.instructionPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.instructionText,
                    deliveryInstruction === inst && styles.instructionTextActive,
                  ]}
                >
                  {inst}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Delivery Partner Tip Selection */}
        <View style={styles.cardSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={[TYPOGRAPHY.bodyMdMedium, styles.subSectionTitle, { marginBottom: 0 }]}>
              💝 Tip your delivery partner
            </Text>
            {tipAmount > 0 && (
              <TouchableOpacity onPress={() => setTipAmount(0)} activeOpacity={0.7}>
                <Text style={{ fontSize: 12, color: COLORS.error, fontWeight: '700' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            100% of your tip goes directly to your rider partner.
          </Text>
          <View style={styles.tipButtonsRow}>
            {TIP_OPTIONS.map((amt) => (
              <TouchableOpacity
                key={amt}
                activeOpacity={0.75}
                onPress={() => handleSelectTip(amt)}
                style={[
                  styles.tipPill,
                  tipAmount === amt && styles.tipPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.tipPillText,
                    tipAmount === amt && styles.tipPillTextActive,
                  ]}
                >
                  {amt === 0 ? 'No tip' : `₹${amt}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Discounts & Wallet Section */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.bodyMdMedium, styles.subSectionTitle]}>
            Discounts & Wallet
          </Text>

          {/* Shopping Coins (2,000 SC) Toggle */}
          <View style={styles.walletToggleRow}>
            <View style={styles.walletToggleLeft}>
              <View style={[styles.paymentIconBox, { backgroundColor: '#FEF3C7' }]}>
                <AppIcon name="star" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                  Use Shopping Coins
                </Text>
                <Text style={styles.walletBalText}>
                  Available: {availableCoins.toLocaleString()} Coins • Save ₹{maxCoinsUsable}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
              thumbColor={useCoins ? COLORS.white : '#f4f3f4'}
              onValueChange={async (val) => {
                if (availableCoins > 0) {
                  setUseCoins(val);
                  const coinsToApply = val ? maxCoinsUsable : 0;
                  setAppliedCoins(coinsToApply);
                  emitCheckoutChange({ useCoins: val });
                  try {
                    await CartService.toggleCoinsOnServer(val);
                  } catch (e) {
                    console.warn('[BlinkitCheckout] Notice syncing coins on server:', e);
                  }
                }
              }}
              value={useCoins && availableCoins > 0}
              disabled={availableCoins <= 0}
            />
          </View>
          {useCoins && coinsDeduction > 0 && (
            <View style={[styles.walletAppliedBadge, { backgroundColor: '#FEF3C7', marginBottom: 12 }]}>
              <Text style={[styles.walletAppliedText, { color: '#B45309' }]}>
                🪙 {coinsDeduction} Shopping Coins applied (-₹{coinsDeduction})
              </Text>
            </View>
          )}

          <View style={[styles.divider, { marginVertical: 10 }]} />

          {/* WOMUP Money (Wallet) Toggle */}
          <View style={styles.walletToggleRow}>
            <View style={styles.walletToggleLeft}>
              <View style={[styles.paymentIconBox, { backgroundColor: COLORS.lightPink }]}>
                <AppIcon name="wallet" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                  WOMUP Money
                </Text>
                <Text style={styles.walletBalText}>Available: ₹{walletBalance}</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
              thumbColor={useWalletBalance ? COLORS.white : '#f4f3f4'}
              onValueChange={(val) => {
                if (walletBalance > 0) {
                  setUseWalletBalance(val);
                }
              }}
              value={useWalletBalance && walletBalance > 0}
              disabled={walletBalance <= 0}
            />
          </View>
          {useWalletBalance && walletDeduction > 0 && (
            <View style={styles.walletAppliedBadge}>
              <Text style={styles.walletAppliedText}>
                ✓ ₹{walletDeduction} applied from WOMUP Money
              </Text>
            </View>
          )}
        </View>

        {/* 5. Payment Method Selection */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.headingMd, styles.subSectionTitle]}>
            Select Payment Method
          </Text>

          {finalPayable === 0 ? (
            <View style={styles.fullyPaidBanner}>
              <AppIcon name="check-circle" size={18} color={COLORS.success} />
              <Text style={styles.fullyPaidText}>
                Full amount covered by WOMUP Benefits! No extra payment required.
              </Text>
            </View>
          ) : (
            <>
              {/* UPI Option */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelectPayment('upi')}
                style={styles.paymentOptionRow}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="flash" size={18} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                        UPI (Google Pay, PhonePe, Paytm)
                      </Text>
                      <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#C7D2FE' }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#4338CA' }}>RAZORPAY</Text>
                      </View>
                    </View>
                    <Text style={styles.walletBalText}>Fast & secure 1-tap checkout via Razorpay</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPayment === 'upi' && styles.radioOuterActive,
                  ]}
                >
                  {selectedPayment === 'upi' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Credit / Debit Cards */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelectPayment('card')}
                style={styles.paymentOptionRow}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, { backgroundColor: '#F0F9FF' }]}>
                    <Ionicons name="card-outline" size={18} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                        Credit / Debit Card
                      </Text>
                      <View style={{ backgroundColor: '#F0F9FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#BAE6FD' }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#0369A1' }}>RAZORPAY</Text>
                      </View>
                    </View>
                    <Text style={styles.walletBalText}>Visa, MasterCard, RuPay powered by Razorpay</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPayment === 'card' && styles.radioOuterActive,
                  ]}
                >
                  {selectedPayment === 'card' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Cash on Delivery */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelectPayment('cod')}
                style={styles.paymentOptionRow}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[styles.paymentIconBox, { backgroundColor: COLORS.cardBackground }]}>
                    <AppIcon name="tag" size={20} color={COLORS.textPrimary} />
                  </View>
                  <View>
                    <Text style={[TYPOGRAPHY.bodyMdMedium, styles.paymentTitle]}>
                      Cash on Delivery
                    </Text>
                    <Text style={styles.walletBalText}>Pay cash or UPI at delivery doorstep</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPayment === 'cod' && styles.radioOuterActive,
                  ]}
                >
                  {selectedPayment === 'cod' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 6. Payment Summary Preview (Bill Summary matching Website) */}
        <View style={styles.cardSection}>
          <Text style={[TYPOGRAPHY.headingMd, styles.subSectionTitle]}>Bill Summary</Text>

          {/* Coupon / Promo Code Input Row matching Website */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 13,
                textTransform: 'uppercase',
                backgroundColor: '#FFFFFF',
              }}
              placeholder="Promo code (WORMUP50)"
              value={couponCodeInput}
              onChangeText={setCouponCodeInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleApplyCoupon}
              style={{
                backgroundColor: '#071B52',
                borderRadius: 10,
                paddingHorizontal: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Apply</Text>
            </TouchableOpacity>
          </View>

          {couponMsg && (
            <Text style={{ fontSize: 12, color: couponMsg.isError ? '#EF4444' : '#13B978', marginBottom: 10, fontWeight: '600' }}>
              {couponMsg.text}
            </Text>
          )}

          {appliedCoupon && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ color: '#059669', fontWeight: '700', fontSize: 12 }}>
                ✓ Coupon {appliedCoupon} applied (-₹{couponDiscount})
              </Text>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Item Total (MRP) */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Total (MRP)</Text>
            <Text style={[styles.summaryValue, { fontWeight: '600', color: '#071B52' }]}>₹{effectiveMrpTotal}</Text>
          </View>

          {/* Product Discount */}
          {productDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#10B981', fontWeight: '600' }]}>Product Discount</Text>
              <Text style={[styles.summaryValue, { color: '#10B981', fontWeight: '700' }]}>
                - ₹{productDiscount}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, { alignItems: 'flex-start', paddingVertical: 8 }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.summaryLabel}>Delivery Partner Fee</Text>
              <Text style={{ fontSize: 11, color: '#62677A', marginTop: 1 }}>
                {feeBreakdown?.distanceKm || (isSavedThaltej ? 1.15 : 1.64)} km · ₹{feeBreakdown?.rateUsed || 12}/km
                {feeBreakdown?.floorApplied ? ` (Base: ₹${feeBreakdown?.baseFee || (isSavedThaltej ? 13.80 : 19.68)})` : ''}
              </Text>
              {feeBreakdown?.floorApplied && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <ShieldCheck size={12} color="#4338CA" />
                  <Text style={{ fontSize: 10, color: '#4338CA', fontWeight: '600' }}>
                    +₹{(Number(feeBreakdown?.minimumPayout || 30) - Number(feeBreakdown?.baseFee || (isSavedThaltej ? 13.80 : 19.68))).toFixed(2)} Floor Guarantee (Min ₹{feeBreakdown?.minimumPayout || 30})
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <CheckCircle2 size={10} color="#059669" />
                <Text style={{ fontSize: 10, color: '#059669', fontWeight: '600' }}>
                  100% passed to delivery partner
                </Text>
              </View>
            </View>
            <Text style={[styles.summaryValue, { fontWeight: '700' }]}>
              ₹{deliveryFee}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Handling & Convenience</Text>
            <Text style={styles.summaryValue}>₹{handlingFee}</Text>
          </View>
          {couponDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon Discount ({appliedCoupon})</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success, fontWeight: '700' }]}>
                - ₹{couponDiscount}
              </Text>
            </View>
          )}
          {tipAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Partner Tip</Text>
              <Text style={[styles.summaryValue, { color: COLORS.primary, fontWeight: '700' }]}>
                + ₹{tipAmount}
              </Text>
            </View>
          )}
          {useCoins && coinsDeduction > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shopping Coins Applied ({coinsDeduction} SC)</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success, fontWeight: '700' }]}>
                - ₹{coinsDeduction}
              </Text>
            </View>
          )}
          {useWalletBalance && walletDeduction > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>WOMUP Money Deducted</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success, fontWeight: '700' }]}>
                - ₹{walletDeduction}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={[TYPOGRAPHY.bodyMdMedium, styles.finalPayableLabel]}>
              Amount to Pay
            </Text>
            <Text style={[TYPOGRAPHY.priceLg, styles.finalPayableValue]}>
              ₹{finalPayable}
            </Text>
          </View>

          {/* Serving Dark Store Info Banner matching website */}
          <View style={styles.servingStoreBanner}>
            <MapPin size={16} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.servingStoreBannerTitle}>
                Dispatching from: {currentStoreName || 'Wom Up Dark Store'}
              </Text>
              <Text style={styles.servingStoreBannerSub}>
                ⚡ {deliveryEtaMinutes || 9} min delivery to {areaLandmark || currentAreaName || 'your area'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Place Order CTA */}
      <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceText}>₹{finalPayable}</Text>
          <Text style={styles.bottomPriceSub}>AMOUNT PAYABLE</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePlaceOrder}
          style={[styles.placeOrderBtn, isSubmitting && { opacity: 0.8 }]}
          disabled={isSubmitting}
          accessibilityLabel="Place Order"
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.placeOrderBtnText}>Place Order • ₹{finalPayable} ➔</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 1. Full-Screen Order Celebration Video (First 5 Seconds Only) */}
      <Modal
        visible={showCelebrationVideo}
        transparent={false}
        animationType="fade"
      >
        <Animated.View
          style={[
            styles.fullscreenVideoOverlay,
            {
              opacity: videoFadeAnim,
            },
          ]}
        >
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <video
              ref={videoRef}
              src={getVideoSource()}
              autoPlay
              playsInline
              muted
              onTimeUpdate={(e: any) => {
                if (e.target && e.target.currentTime >= 5.0) {
                  e.target.pause();
                  finishCelebrationVideo();
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#05052A',
              }}
            />
          ) : (
            <View style={styles.nativeVideoPlaceholder}>
              <View style={styles.videoGlowCircle}>
                <AppIcon name="check" size={48} color={COLORS.white} />
              </View>
              <Text style={styles.videoOverlayBrand}>WOM UP</Text>
              <Text style={styles.videoOverlaySub}>Order Placed Successfully!</Text>
            </View>
          )}

          {/* Top 5-second progress bar */}
          <View style={styles.videoProgressContainer}>
            <Animated.View
              style={[
                styles.videoProgressBar,
                {
                  width: videoProgressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Top Controls: 5s Timer Countdown Chip + Skip Button */}
          <View style={[styles.videoControlsRow, { top: Math.max(insets.top, 16) + 12 }]}>
            <View style={styles.videoCountdownChip}>
              <AppIcon name="zap" size={14} color={COLORS.hotPink} />
              <Text style={styles.videoCountdownText}>
                Confirmed • {videoSecondsLeft}s
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={finishCelebrationVideo}
              style={styles.videoSkipBtn}
            >
              <Text style={styles.videoSkipText}>Skip</Text>
              <AppIcon name="chevron-right" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Bottom Floating Banner */}
          <View style={[styles.videoBottomBanner, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Text style={styles.videoBannerTitle}>Order Confirmed! 🎉</Text>
            <Text style={styles.videoBannerSub}>
              Preparing your items for lightning-fast delivery in 9 mins
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Order Confirmed Celebration Modal */}
      <Modal
        visible={isOrderConfirmed}
        transparent
        animationType="fade"
      >
        <View style={styles.successModalBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successCheckCircle}>
              <AppIcon name="check" size={36} color={COLORS.white} />
            </View>

            <Text style={[TYPOGRAPHY.headingLg, styles.successHeading]}>
              Order Placed!
            </Text>
            {currentOrder?.orderNumber ? (
              <Text style={styles.orderNumberBadge}>
                Order {currentOrder.orderNumber}
              </Text>
            ) : null}
            <Text style={[TYPOGRAPHY.bodyMd, styles.successEta]}>
              Arriving in 9 minutes ⚡
            </Text>
            <Text style={styles.successDesc}>
              Your items are being packed at the nearest Worm Up dark store.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleTrackOrder}
              style={styles.trackOrderBtn}
            >
              <AppIcon name="map-pin" size={18} color={COLORS.white} />
              <Text style={styles.trackOrderText}>Track Live Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDoneReturnHome}
              style={styles.successDoneBtn}
            >
              <Text style={styles.successDoneText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Razorpay Test Mode Checkout Modal for UPI & Cards */}
      <Modal
        visible={isRazorpayModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isRazorpayVerifying) setIsRazorpayModalOpen(false);
        }}
      >
        <View style={styles.rzpModalBackdrop}>
          <View style={[styles.rzpModalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={styles.rzpSheetHandle} />

            {/* Header with Razorpay Logo & Test Badge */}
            <View style={styles.rzpHeaderRow}>
              <View style={styles.rzpHeaderLeft}>
                <View style={styles.rzpLogoBox}>
                  <Ionicons name="card" size={20} color="#3395FF" />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.rzpBrandText}>Razorpay</Text>
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.rzpSubText}>Fast & Secure 1-Tap Checkout</Text>
                </View>
              </View>

              <View style={styles.rzpTestBadge}>
                <Text style={styles.rzpTestBadgeText}>TEST MODE</Text>
              </View>
            </View>

            {/* Order & Amount Box */}
            <View style={styles.rzpAmountBox}>
              <Text style={styles.rzpAmountPayingTo}>
                Paying to WormUp Express ({blinkitCartCount} items)
              </Text>
              <Text style={styles.rzpAmountText}>₹{finalPayable}</Text>
              <Text style={styles.rzpOrderIdText}>
                Order ID: {razorpayOrder?.razorpayOrderId || 'rzp_order_init'}
              </Text>
            </View>

            <Text style={styles.rzpSectionTitle}>Select Test UPI / Payment Method</Text>

            {/* Option 1: success@razorpay */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.rzpOptionCard,
                selectedTestUpi === 'success@razorpay' && styles.rzpOptionCardSuccess,
              ]}
              onPress={() => setSelectedTestUpi('success@razorpay')}
            >
              <View style={[styles.rzpOptionIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rzpOptionTitle}>UPI: success@razorpay</Text>
                <Text style={[styles.rzpOptionSub, { color: '#059669' }]}>
                  Simulates instant 1-tap UPI payment approval
                </Text>
              </View>
              {selectedTestUpi === 'success@razorpay' ? (
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              ) : (
                <View style={styles.rzpRadioCircle} />
              )}
            </TouchableOpacity>

            {/* Option 2: Test Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.rzpOptionCard,
                selectedTestUpi === 'card' && styles.rzpOptionCardBlue,
              ]}
              onPress={() => setSelectedTestUpi('card')}
            >
              <View style={[styles.rzpOptionIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="card-outline" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rzpOptionTitle}>Card: 4111 1111 1111 1111</Text>
                <Text style={[styles.rzpOptionSub, { color: '#2563EB' }]}>
                  Simulates successful Visa / RuPay transaction
                </Text>
              </View>
              {selectedTestUpi === 'card' ? (
                <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
              ) : (
                <View style={styles.rzpRadioCircle} />
              )}
            </TouchableOpacity>

            {/* Option 3: failure@razorpay */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.rzpOptionCard,
                selectedTestUpi === 'failure@razorpay' && styles.rzpOptionCardRed,
              ]}
              onPress={() => setSelectedTestUpi('failure@razorpay')}
            >
              <View style={[styles.rzpOptionIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rzpOptionTitle}>UPI: failure@razorpay</Text>
                <Text style={[styles.rzpOptionSub, { color: '#DC2626' }]}>
                  Simulates bank decline / failed payment
                </Text>
              </View>
              {selectedTestUpi === 'failure@razorpay' ? (
                <Ionicons name="checkmark-circle" size={22} color="#EF4444" />
              ) : (
                <View style={styles.rzpRadioCircle} />
              )}
            </TouchableOpacity>

            {/* Actions: Cancel & Confirm */}
            <View style={styles.rzpActionsRow}>
              <TouchableOpacity
                style={styles.rzpCancelBtn}
                onPress={() => setIsRazorpayModalOpen(false)}
                disabled={isRazorpayVerifying}
              >
                <Text style={styles.rzpCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rzpPayBtn, isRazorpayVerifying && { opacity: 0.8 }]}
                onPress={handleProcessRazorpayTest}
                disabled={isRazorpayVerifying}
              >
                {isRazorpayVerifying ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.rzpPayBtnText}>Verifying Payment...</Text>
                  </View>
                ) : (
                  <Text style={styles.rzpPayBtnText}>Pay ₹{finalPayable} via Razorpay</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Security footer */}
            <View style={styles.rzpFooterSecurity}>
              <Ionicons name="lock-closed" size={13} color="#94A3B8" />
              <Text style={styles.rzpFooterSecurityText}>
                Secured by Razorpay Payments • 256-bit SSL Encryption
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  plainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  cardSection: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
  },
  addressSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subSectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  instructionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  instructionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionPillActive: {
    backgroundColor: COLORS.lightPink,
    borderColor: COLORS.primary,
  },
  instructionText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  instructionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tipButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 60,
    alignItems: 'center',
  },
  tipPillActive: {
    backgroundColor: COLORS.lightPink,
    borderColor: COLORS.primary,
  },
  tipPillText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  tipPillTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  walletToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletAppliedBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  walletAppliedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  fullyPaidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    marginTop: 4,
  },
  fullyPaidText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentTitle: {
    color: COLORS.textPrimary,
  },
  walletBalText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  finalPayableLabel: {
    color: COLORS.textPrimary,
  },
  finalPayableValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  bottomPriceSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  placeOrderBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  placeOrderBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successCheckCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  orderNumberBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.hotPink,
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  successEta: {
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  trackOrderBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    width: '100%',
    marginBottom: 10,
  },
  trackOrderText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  successDoneBtn: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    width: '100%',
    alignItems: 'center',
  },
  successDoneText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  fullscreenVideoOverlay: {
    flex: 1,
    backgroundColor: '#05052A',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  nativeVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05052A',
  },
  videoGlowCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  videoOverlayBrand: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
    marginBottom: 6,
  },
  videoOverlaySub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  videoProgressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 20,
  },
  videoProgressBar: {
    height: '100%',
    backgroundColor: COLORS.hotPink,
  },
  videoControlsRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  videoCountdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 5, 42, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 120, 0.4)',
  },
  videoCountdownText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  videoSkipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  videoSkipText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  videoBottomBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 5, 42, 0.85)',
    paddingHorizontal: 24,
    paddingTop: 18,
    alignItems: 'center',
    zIndex: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoBannerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  videoBannerSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 320,
  },
  deliveryChoiceGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  choiceCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  choiceCardActiveGps: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  choiceCardActiveSaved: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAF5FF',
  },
  choiceBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  choiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  choiceBadgeActiveGps: {
    backgroundColor: '#DCFCE7',
  },
  choiceBadgeActiveSaved: {
    backgroundColor: '#EDE9FE',
  },
  choiceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  greenCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  choiceCoords: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  choiceSub: {
    fontSize: 9,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 4,
  },
  otherSavedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  otherAddrChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: COLORS.white,
  },
  otherAddrChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FAF5FF',
  },
  otherAddrChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  otherAddrChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  formContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    marginTop: 4,
  },
  formHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  detectedBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detectedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartItemImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginRight: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cartItemPack: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  cartItemQtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 12,
  },
  qtyBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  qtyCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
    paddingHorizontal: 4,
  },
  cartItemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    minWidth: 35,
    textAlign: 'right',
  },
  servingStoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 12,
  },
  servingStoreBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  servingStoreBannerSub: {
    fontSize: 10,
    color: '#047857',
    marginTop: 2,
  },
  rzpModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  rzpModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  rzpSheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  rzpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rzpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rzpLogoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0C2340',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpBrandText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0C2340',
  },
  rzpSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  rzpTestBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  rzpTestBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  rzpAmountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  rzpAmountPayingTo: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  rzpAmountText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  rzpOrderIdText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rzpSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rzpOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    gap: 12,
  },
  rzpOptionCardSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  rzpOptionCardBlue: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  rzpOptionCardRed: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  rzpOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rzpOptionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  rzpRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  rzpActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  rzpCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  rzpPayBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0C2340',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  rzpPayBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rzpFooterSecurity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  rzpFooterSecurityText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
