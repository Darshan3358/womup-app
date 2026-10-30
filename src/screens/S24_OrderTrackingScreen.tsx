import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import io, { Socket } from 'socket.io-client';
import { COLORS, GRADIENTS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { Header } from '../components/common/Header';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { DynamicLiveMap } from '../components/tracking/DynamicLiveMap';
import { S27_ChatModal } from '../components/tracking/S27_ChatModal';
import { RiderReviewModal } from '../components/tracking/RiderReviewModal';
import { api } from '../services/api';

export const S24_OrderTrackingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentOrder, setActiveScreen, goBack, user, addToCart } = useApp();

  const [freshOrder, setFreshOrder] = useState<any>(null);
  const activeOrder = freshOrder || currentOrder || {};
  const orderNum = activeOrder?.orderNumber || (activeOrder as any)?.orderId || '';
  const orderId = (activeOrder as any)?._id || activeOrder?.id || (orderNum ? orderNum.replace(/^#/, '') : '');

  useEffect(() => {
    const targetId = (currentOrder as any)?._id || currentOrder?.id || currentOrder?.orderNumber || orderId || orderNum;
    if (targetId && targetId !== 'W12345678') {
      api.get<any>(`/orders/${targetId}`).then((res) => {
        const found = (res as any)?._id ? res : res?.data;
        if (found) {
          setFreshOrder(found);
          if (found.status) {
            setLiveStatus(found.status.toUpperCase());
          }
          if (found.deliveryOtp) {
            setDeliveryPin(String(found.deliveryOtp));
          }
        }
      }).catch(() => { });
    }
  }, [orderId, orderNum, currentOrder]);

  // Real-time tracking state
  const [liveStatus, setLiveStatus] = useState<string>((activeOrder?.status || 'PLACED').toUpperCase());
  const [deliveryPin, setDeliveryPin] = useState<string>(String(activeOrder?.deliveryOtp || '4821'));

  // Sync state whenever freshOrder or activeOrder status changes
  useEffect(() => {
    if (freshOrder?.status) {
      setLiveStatus(freshOrder.status.toUpperCase());
    } else if (currentOrder?.status) {
      setLiveStatus(currentOrder.status.toUpperCase());
    }
  }, [freshOrder?.status, currentOrder?.status]);

  useEffect(() => {
    if (freshOrder?.deliveryOtp) {
      setDeliveryPin(String(freshOrder.deliveryOtp));
    } else if (currentOrder?.deliveryOtp) {
      setDeliveryPin(String(currentOrder.deliveryOtp));
    }
  }, [freshOrder?.deliveryOtp, currentOrder?.deliveryOtp]);

  const isDelivered = liveStatus === 'DELIVERED';
  const isCancelled = liveStatus === 'CANCELLED';
  const isTerminal = isDelivered || isCancelled;

  const rawPartnerName =
    activeOrder?.deliveryPartner?.name ||
    activeOrder?.deliveryPartnerId?.fullName ||
    (activeOrder as any)?.partnerName ||
    (activeOrder as any)?.riderName ||
    (activeOrder as any)?.rider?.name ||
    '';
  const cleanInitial = String(rawPartnerName || '').replace(/\s*\(Wom(?:r)?\s*Up\s*Express\)/gi, '').trim();
  const initialPartnerName =
    cleanInitial.toLowerCase().includes('rohit') || cleanInitial.toLowerCase() === 'delivery partner'
      ? ''
      : (cleanInitial.toLowerCase() === 'darshanthanki' ? 'DARSHAN THANKI' : cleanInitial);

  const initialPartnerPhone =
    activeOrder?.deliveryPartner?.phone ||
    activeOrder?.deliveryPartnerId?.phoneNumber ||
    (activeOrder as any)?.partnerPhone ||
    (activeOrder as any)?.rider?.phone ||
    '';
  const initialVehicleNumber =
    activeOrder?.deliveryPartner?.vehicleNumber ||
    activeOrder?.deliveryPartnerId?.vehicleNumber ||
    (activeOrder as any)?.vehicleNumber ||
    (activeOrder as any)?.rider?.vehicleNumber ||
    '';

  const [partner, setPartner] = useState({
    name: initialPartnerName,
    phone: initialPartnerPhone,
    vehicleNumber: initialVehicleNumber,
  });
  const [riderCoords, setRiderCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [riderHeading, setRiderHeading] = useState<number>(0);
  const [timelineList, setTimelineList] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [etaText, setEtaText] = useState('9-12 minutes');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(Boolean((activeOrder as any)?.riderReview?.isSubmitted));
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);

  // Authoritative coordinates for map routing and transparent distance fee
  const storeLocation =
    (activeOrder as any)?.store?.location?.coordinates ||
    (activeOrder as any)?.storeId?.location?.coordinates ||
    (activeOrder as any)?.storeLocation?.coordinates;
  const storeLat =
    storeLocation?.[1] ??
    (activeOrder as any)?.store?.location?.latitude ??
    (activeOrder as any)?.storeId?.location?.latitude ??
    (activeOrder as any)?.storeId?.latitude;
  const storeLng =
    storeLocation?.[0] ??
    (activeOrder as any)?.store?.location?.longitude ??
    (activeOrder as any)?.storeId?.location?.longitude ??
    (activeOrder as any)?.storeId?.longitude;

  const custLocation =
    (activeOrder as any)?.customer?.location?.coordinates ||
    (activeOrder as any)?.deliveryAddress?.location?.coordinates ||
    (activeOrder as any)?.deliveryAddress?.coordinates;
  const custLat =
    custLocation?.[1] ??
    (activeOrder as any)?.deliveryAddress?.latitude ??
    (activeOrder as any)?.deliveryAddress?.lat;
  const custLng =
    custLocation?.[0] ??
    (activeOrder as any)?.deliveryAddress?.longitude ??
    (activeOrder as any)?.deliveryAddress?.lng;

  // Dynamic Store Coordinates strictly resolved from the accepting store
  const storeCoords =
    typeof storeLat === 'number' && typeof storeLng === 'number' && !isNaN(storeLat) && !isNaN(storeLng) && storeLat !== 0 && storeLng !== 0
      ? { latitude: storeLat, longitude: storeLng }
      : null;

  const customerCoords =
    typeof custLat === 'number' && typeof custLng === 'number' && !isNaN(custLat) && !isNaN(custLng) && custLat !== 0 && custLng !== 0
      ? { latitude: custLat, longitude: custLng }
      : { latitude: 23.1165, longitude: 72.5460 };

  useEffect(() => {
    if (isTerminal) return;
    const savedDist = Number((activeOrder as any)?.deliveryDistanceKm);
    if (savedDist && savedDist > 0) {
      setRouteDistanceKm(savedDist);
      return;
    }

    if (storeCoords && customerCoords) {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${storeCoords.longitude},${storeCoords.latitude};${customerCoords.longitude},${customerCoords.latitude}?overview=false`;
      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.code === 'Ok' && data.routes && data.routes.length > 0 && typeof data.routes[0].distance === 'number') {
            const km = Number((data.routes[0].distance / 1000).toFixed(1));
            if (km > 0) {
              setRouteDistanceKm(km);
            }
          }
        })
        .catch(() => {});
    }
  }, [
    (activeOrder as any)?.deliveryDistanceKm,
    storeCoords?.latitude,
    storeCoords?.longitude,
    customerCoords?.latitude,
    customerCoords?.longitude,
  ]);

  // Sync real-time updates whenever activeOrder changes
  useEffect(() => {
    if (activeOrder && Object.keys(activeOrder).length > 0) {
      if (activeOrder.status) {
        setLiveStatus(String(activeOrder.status).toUpperCase());
      }
      if (activeOrder.deliveryOtp) {
        setDeliveryPin(String(activeOrder.deliveryOtp));
      }
      const p = activeOrder.deliveryPartner || activeOrder.deliveryPartnerId || (activeOrder as any).rider;
      if (p) {
        const raw = (p as any).name || (p as any).fullName || '';
        const clean = String(raw || '').replace(/\s*\(Wom(?:r)?\s*Up\s*Express\)/gi, '').trim();
        const formatted = clean.toLowerCase() === 'darshanthanki' ? 'DARSHAN THANKI' : clean;
        if (formatted && !formatted.toLowerCase().includes('rohit') && formatted.toLowerCase() !== 'delivery partner') {
          setPartner((prev) => ({
            name: formatted,
            phone: (p as any).phone || (p as any).phoneNumber || prev.phone,
            vehicleNumber: (p as any).vehicleNumber || prev.vehicleNumber,
          }));
        }
      }
    }
  }, [freshOrder, currentOrder]);

  const isPartnerAssigned = Boolean(
    !['PLACED', 'CONFIRMED', 'CANCELLED'].includes(liveStatus) &&
    partner.name &&
    partner.name.trim() !== '' &&
    partner.name.toLowerCase() !== 'delivery partner' &&
    partner.name.toLowerCase() !== 'assigning...' &&
    !partner.name.toLowerCase().includes('rohit')
  );

  const handleCallPartner = async () => {
    if (!isPartnerAssigned || !partner.phone) {
      Alert.alert(
        'Delivery Partner',
        'Your delivery partner is currently being allotted. You can call once they accept the order.'
      );
      return;
    }
    const clean = String(partner.phone || '').replace(/[^0-9+]/g, '');
    const url = `tel:${clean}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`Call ${partner.name}`, `Phone: ${partner.phone}`);
      }
    } catch {
      Alert.alert(`Call ${partner.name}`, `Phone: ${partner.phone}`);
    }
  };

  // Animation for scooter pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const liveStatusRef = useRef(liveStatus);
  useEffect(() => {
    liveStatusRef.current = liveStatus;
  }, [liveStatus]);

  // Connect to WebSocket Gateway (only for active delivery)
  useEffect(() => {
    // If order is terminal (DELIVERED or CANCELLED), stop live telemetry & disconnect socket
    if (isTerminal) {
      if (socketRef.current) {
        try {
          if (orderId) socketRef.current.emit('leave_order', { orderId });
          if (orderNum) socketRef.current.emit('leave_order', { orderId: orderNum });
          socketRef.current.disconnect();
        } catch {}
        socketRef.current = null;
      }
      setIsConnected(false);

      // Single fetch to ensure fresh final order data if not yet loaded
      if (!freshOrder && (orderId || orderNum)) {
        const targetQuery = (activeOrder as any)?._id || (orderNum && orderNum.replace(/^#/, '')) || orderNum || orderId;
        if (targetQuery && targetQuery !== 'W12345678') {
          fetch(`http://localhost:5050/api/v1/orders/${encodeURIComponent(targetQuery)}`)
            .then((res) => res.json())
            .then((json) => {
              const fresh = json.data || json;
              if (fresh) {
                setFreshOrder(fresh);
                if (fresh.statusTimeline && Array.isArray(fresh.statusTimeline)) {
                  setTimelineList(fresh.statusTimeline);
                }
              }
            })
            .catch(() => {});
        }
      }
      return;
    }

    const socket = io('http://localhost:5050/tracking', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (orderId) {
        socket.emit('join_order', { orderId });
      }
      if (orderNum) {
        socket.emit('join_order', { orderId: orderNum });
        socket.emit('join_order', { orderId: orderNum.replace(/^#/, '') });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    const handleStatusUpdate = (data: any) => {
      if (!data) return;
      const eventOrderId = data.orderId?.toString();
      const eventOrderNum = (data.orderNumber || data.orderNum)?.toString();
      const curOrderId = orderId?.toString();
      const curOrderNum = orderNum?.toString();

      const isMatch =
        !eventOrderId ||
        eventOrderId === curOrderId ||
        eventOrderId === curOrderNum ||
        eventOrderNum === curOrderNum ||
        (curOrderNum && eventOrderNum && curOrderNum.replace(/^#/, '') === eventOrderNum.replace(/^#/, '')) ||
        (curOrderId && eventOrderId && curOrderId.replace(/^#/, '') === eventOrderId.replace(/^#/, ''));

      if (!isMatch) return;

      const rawStatus = data.status || data.orderStatus || '';
      const newStatus = rawStatus.toUpperCase();
      if (newStatus) {
        setLiveStatus(newStatus);

        if (newStatus === 'OUT_FOR_DELIVERY') {
          setEtaText('5-7 minutes');
        } else if (newStatus === 'ARRIVED_AT_CUSTOMER') {
          setEtaText('Arrived at Doorstep');
        } else if (newStatus === 'DELIVERED') {
          setEtaText('Delivered');
          setIsConnected(false);
          socket.disconnect();
        } else if (newStatus === 'CANCELLED') {
          setIsConnected(false);
          socket.disconnect();
        }
      }

      const pObj = data.rider || data.partner || data.deliveryPartner;
      const rawName = pObj?.name || pObj?.fullName || data.partnerName || data.riderName || '';
      const cleanName = rawName.replace(/\s*\(Wom(?:r)?\s*Up\s*Express\)/gi, '').trim();
      const finalName = cleanName.toLowerCase() === 'darshanthanki' ? 'DARSHAN THANKI' : cleanName;
      if (finalName && !finalName.toLowerCase().includes('rohit') && finalName.toLowerCase() !== 'delivery partner') {
        setPartner((prev) => ({
          ...prev,
          name: finalName,
          phone: pObj?.phone || pObj?.phoneNumber || data.partnerPhone || data.phoneNumber || prev.phone,
          vehicleNumber: pObj?.vehicleNumber || data.vehicleNumber || prev.vehicleNumber,
        }));
      }

      if (data.deliveryOtp) {
        setDeliveryPin(data.deliveryOtp);
      }
    };

    socket.on('order_status', handleStatusUpdate);
    socket.on('order.status.updated', handleStatusUpdate);
    socket.on('orderStatusUpdated', handleStatusUpdate);
    socket.on('orderUpdate', handleStatusUpdate);
    if (orderId) {
      socket.on(`orderStatusUpdate_${orderId}`, handleStatusUpdate);
    }
    if (orderNum) {
      const clean = orderNum.replace(/^#/, '');
      socket.on(`orderStatusUpdate_${clean}`, handleStatusUpdate);
    }

    socket.on('review_prompt_requested', (data: any) => {
      const eventOrderId = data?.orderId?.toString();
      const eventOrderNum = data?.orderNumber?.toString();
      if (!eventOrderId || eventOrderId === orderId || eventOrderNum === orderNum) {
        setIsReviewModalOpen(true);
      }
    });

    socket.on('order_reviewed', (data: any) => {
      if (data?.orderId === orderId || data?.orderNumber === orderNum) {
        setHasReviewed(true);
      }
    });

    const handleLocationUpdate = (data: any) => {
      if (!data) return;
      const eventOrderId = data.orderId?.toString();
      const cleanEventOrderId = eventOrderId?.replace(/^#/, '');
      const curOrderId = orderId?.toString();
      const cleanCurOrderId = curOrderId?.replace(/^#/, '');
      const curOrderNum = orderNum?.toString();
      const cleanCurOrderNum = curOrderNum?.replace(/^#/, '');

      const isMatch =
        !eventOrderId ||
        eventOrderId === curOrderId ||
        cleanEventOrderId === cleanCurOrderId ||
        eventOrderId === curOrderNum ||
        cleanEventOrderId === cleanCurOrderNum;

      if (!isMatch) return;

      const lat = data.lat ?? data.latitude ?? data.riderLocation?.lat;
      const lng = data.lng ?? data.longitude ?? data.riderLocation?.lng;
      if (lat && lng) {
        setRiderCoords({ latitude: lat, longitude: lng });
        if (data.heading !== undefined) {
          setRiderHeading(data.heading);
        }
        const dist = data.distanceToCustomer ?? data.distanceKm;
        const mins = data.eta ?? data.etaMinutes;
        if (dist !== undefined && dist !== null) {
          const numDist = Number(dist);
          if (numDist > 0) {
            setRouteDistanceKm(numDist);
          }
        }
        if (mins || dist) {
          setEtaText(`Arriving in ${mins ? `${mins} mins` : 'a few mins'}${dist ? ` (${dist} km away)` : ''}`);
        }
      }
    };

    socket.on('location_updated', handleLocationUpdate);
    socket.on('rider_location_update', handleLocationUpdate);
    socket.on('update_delivery_location', handleLocationUpdate);
    socket.on('update_rider_location', handleLocationUpdate);
    socket.on('delivery.location.updated', handleLocationUpdate);

    // Helper to refresh order data with self-healing REST fallback
    const refreshOrderData = async () => {
      if (liveStatusRef.current === 'DELIVERED' || liveStatusRef.current === 'CANCELLED') return;
      const targetQuery = (activeOrder as any)?._id || (orderNum && orderNum.replace(/^#/, '')) || orderNum || orderId;
      if (!targetQuery || targetQuery === 'W12345678') return;

      try {
        const res = await fetch(`http://localhost:5050/api/v1/orders/${encodeURIComponent(targetQuery)}`);
        if (res.ok) {
          const json = await res.json();
          const fresh = json.data || json;
          if (fresh) {
            setFreshOrder(fresh);
          }
          const rawStatus = fresh?.status || fresh?.orderStatus || '';
          const targetStatus = rawStatus.toUpperCase();
          if (targetStatus) {
            setLiveStatus(targetStatus);
            if (targetStatus === 'OUT_FOR_DELIVERY') {
              setEtaText('5-7 minutes');
            } else if (targetStatus === 'ARRIVED_AT_CUSTOMER') {
              setEtaText('Arrived at Doorstep');
            } else if (targetStatus === 'DELIVERED' || targetStatus === 'CANCELLED') {
              setEtaText(targetStatus === 'DELIVERED' ? 'Delivered' : 'Cancelled');
              setIsConnected(false);
              socket.disconnect();
            }
          }
          if (fresh?.deliveryOtp) setDeliveryPin(fresh.deliveryOtp);
          if (fresh?.statusTimeline && Array.isArray(fresh.statusTimeline)) {
            setTimelineList(fresh.statusTimeline);
          }
          const pObj = fresh?.deliveryPartner || fresh?.deliveryPartnerId || fresh?.rider;
          if (pObj && (pObj.name || pObj.fullName)) {
            const raw = pObj.name || pObj.fullName || '';
            const clean = raw.replace(/\s*\(Wom(?:r)?\s*Up\s*Express\)/gi, '').trim();
            const finalName = clean;
            if (finalName && !finalName.toLowerCase().includes('rohit') && finalName.toLowerCase() !== 'delivery partner') {
              setPartner((prev) => ({
                ...prev,
                name: finalName,
                phone: pObj.phone || pObj.phoneNumber || prev.phone,
                vehicleNumber: pObj.vehicleNumber || prev.vehicleNumber,
              }));
            }
            if (
              pObj.currentLocation &&
              typeof pObj.currentLocation.latitude === 'number' &&
              typeof pObj.currentLocation.longitude === 'number' &&
              !isNaN(pObj.currentLocation.latitude) &&
              !isNaN(pObj.currentLocation.longitude) &&
              pObj.currentLocation.latitude !== 0 &&
              pObj.currentLocation.longitude !== 0
            ) {
              setRiderCoords({
                latitude: pObj.currentLocation.latitude,
                longitude: pObj.currentLocation.longitude,
              });
            } else {
              setRiderCoords(null);
            }
          } else {
            setRiderCoords(null);
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    // Initial immediate fetch to populate assigned partner details & catch latest status
    refreshOrderData();

    // Smart fallback polling: ONLY active when WebSocket is disconnected
    // (Eliminates redundant 2-second HTTP polling loop when real-time socket events are active)
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    const startFallbackPoll = () => {
      if (!pollInterval && liveStatusRef.current !== 'DELIVERED' && liveStatusRef.current !== 'CANCELLED') {
        pollInterval = setInterval(refreshOrderData, 20000); // 20s graceful fallback
      }
    };
    const stopFallbackPoll = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    socket.on('connect', () => {
      stopFallbackPoll();
    });
    socket.on('disconnect', () => {
      startFallbackPoll();
    });

    if (!socket.connected) {
      startFallbackPoll();
    }

    return () => {
      stopFallbackPoll();
      if (orderId) {
        socket.emit('leave_order', { orderId });
      }
      if (orderNum) {
        socket.emit('leave_order', { orderId: orderNum });
      }
      socket.off('connect');
      socket.off('disconnect');
      socket.off('order_status');
      socket.off('order.status.updated');
      socket.off('orderStatusUpdated');
      socket.off('orderUpdate');
      socket.off('update_delivery_location');
      socket.disconnect();
    };
  }, [orderId, orderNum, isTerminal]);

  const isOutForDelivery = liveStatus === 'OUT_FOR_DELIVERY' || liveStatus === 'ARRIVED_AT_CUSTOMER' || isDelivered;
  const isPacked = ['GOING_TO_STORE', 'ARRIVED_AT_STORE', 'PACKING', 'PACKED', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED'].includes(liveStatus);

  const formatTime = (ts?: string | Date) => {
    if (!ts) return null;
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return null;
    }
  };

  const formatDeliveredDateTime = (ts?: string | Date) => {
    const raw = ts || (activeOrder as any)?.deliveredAt || (activeOrder as any)?.updatedAt || (activeOrder as any)?.createdAt;
    if (!raw) {
      return (typeof activeOrder?.date === 'string' && activeOrder.date) ? activeOrder.date : 'Today';
    }
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) {
        return (typeof activeOrder?.date === 'string' && activeOrder.date) ? activeOrder.date : 'Today';
      }
      const day = d.getDate();
      const month = d.toLocaleDateString('en-IN', { month: 'short' });
      const year = d.getFullYear();
      const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${day} ${month} ${year}, ${timeStr}`;
    } catch {
      return (typeof activeOrder?.date === 'string' && activeOrder.date) ? activeOrder.date : 'Today';
    }
  };

  const placedEntry = timelineList.find((t) => t.status === 'PLACED');
  const packedEntry = timelineList.find((t) => ['PACKED', 'PACKING', 'ARRIVED_AT_STORE', 'READY_FOR_PICKUP'].includes(t.status));
  const outEntry = timelineList.find((t) => ['OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER'].includes(t.status));
  const deliveredEntry = timelineList.find((t) => t.status === 'DELIVERED');
  const deliveredDateText = formatDeliveredDateTime(deliveredEntry?.timestamp);

  // Stepper steps based on real-time authoritative status
  const steps = [
    {
      title: 'Order Confirmed',
      time:
        formatTime(placedEntry?.timestamp) ||
        (typeof activeOrder?.date === 'string' && activeOrder.date.includes(',')
          ? activeOrder.date.split(',')[1].trim()
          : 'Just now'),
      status: 'completed',
    },
    {
      title: 'Packed & Dispatched',
      time: formatTime(packedEntry?.timestamp) || (isPacked ? 'Completed' : 'In 3 mins'),
      status: isPacked
        ? 'completed'
        : ['PACKING', 'PACKED', 'GOING_TO_STORE', 'ARRIVED_AT_STORE'].includes(liveStatus)
          ? 'active'
          : 'pending',
    },
    {
      title: 'Out for Delivery',
      time:
        formatTime(outEntry?.timestamp) ||
        (isDelivered
          ? 'Completed'
          : isOutForDelivery
            ? liveStatus === 'ARRIVED_AT_CUSTOMER'
              ? 'At Doorstep'
              : 'In progress'
            : 'In 6 mins'),
      status: isDelivered ? 'completed' : isOutForDelivery ? 'active' : 'pending',
    },
    {
      title: isDelivered ? 'Delivered' : 'Delivered',
      time: formatTime(deliveredEntry?.timestamp) || (isDelivered ? 'Verified & Delivered' : etaText),
      status: isDelivered ? 'completed' : liveStatus === 'ARRIVED_AT_CUSTOMER' ? 'active' : 'pending',
    },
  ];

  // Scooter position calculation
  let scooterLeft = '52%';
  if (liveStatus === 'PLACED' || liveStatus === 'PACKING') scooterLeft = '22%';
  else if (liveStatus === 'GOING_TO_STORE' || liveStatus === 'ARRIVED_AT_STORE') scooterLeft = '35%';
  else if (liveStatus === 'OUT_FOR_DELIVERY') scooterLeft = '60%';
  else if (liveStatus === 'ARRIVED_AT_CUSTOMER' || liveStatus === 'DELIVERED') scooterLeft = '80%';

  const pinDigits = String(deliveryPin || activeOrder?.deliveryOtp || '4821')
    .replace(/\D/g, '')
    .padEnd(4, '0')
    .slice(0, 4)
    .split('');

  const handleRepeatOrder = () => {
    const items = activeOrder?.items;
    if (items && items.length > 0) {
      items.forEach((it: any) => {
        addToCart({
          id: it.productId?._id || it.productId || `prod_${Date.now()}`,
          name: it.name,
          brand: 'Womup',
          categoryId: 'cooking',
          sellingPrice: it.price || it.unitPrice || 0,
          mrp: Math.round((it.price || it.unitPrice || 0) * 1.15),
          discountPercent: 12,
          shoppingCoins: 10,
          rating: 4.8,
          reviewCount: 30,
          stock: 100,
          deliveryMinutes: 9,
          description: '',
          quantityLabel: it.quantityLabel || `${it.quantity || 1} unit`,
        });
      });
      setActiveScreen('C19_Cart');
    } else {
      Alert.alert('Notice', 'No items found in this order.');
    }
  };

  if (!orderId && !orderNum) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top, backgroundColor: '#FFFFFF' }]}>
        <Header title="Live Order Tracking" onBack={goBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="receipt-outline" size={64} color="#94A3B8" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 }}>
            No Active Order Selected
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            Please select an order from your Order History to track live delivery.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.navy, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
            onPress={() => setActiveScreen('C25_OrderHistory')}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>View Order History</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title={isDelivered ? 'Order Details' : (isCancelled ? 'Order Details' : 'Live Order Tracking')}
        onBack={goBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Status Banner - Only shown during active live tracking */}
        {!isTerminal && (
          <View style={styles.connectionBar}>
            <View style={[styles.statusDot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Live WebSocket Telemetry Connected' : 'Connecting to live tracking...'}
            </Text>
          </View>
        )}

        {/* 1. If DELIVERED: Show Dedicated Delivery Completion Hero Card */}
        {isDelivered && (
          <View style={styles.deliveredSummaryCard}>
            <View style={styles.deliveredCheckCircle}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.deliveredMainTitle}>Delivered Successfully</Text>
            <Text style={styles.deliveredOrderNumber}>{orderNum || 'Order'}</Text>
            <Text style={styles.deliveredTimestamp}>Delivered on {deliveredDateText}</Text>

            <View style={styles.deliveredDivider} />

            <View style={styles.deliveredBadgesRow}>
              <View style={styles.deliveredBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.deliveredBadgeText}>Delivery completed</Text>
              </View>
              <View style={styles.deliveredBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.deliveredBadgeText}>Handover completed</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.deliveredRateBtn}
              onPress={() => setIsReviewModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.deliveredRateBtnText}>
                {hasReviewed ? '★ Rated Delivery Experience' : 'Rate Delivery Experience'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* If Active or Cancelled (not delivered): Order Info & Status Header */}
        {!isDelivered && (
          <View style={styles.orderInfoCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderNumberTitle}>{orderNum || 'Order Details'}</Text>
              <Text style={styles.orderDateSubtitle}>
                Placed on {activeOrder?.createdAt ? new Date(activeOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : (activeOrder?.date || 'Today')}
              </Text>
            </View>
            <View style={[styles.statusPill, liveStatus === 'CANCELLED' ? styles.statusPillCancelled : styles.statusPillActive]}>
              <Text style={[styles.statusPillText, liveStatus === 'CANCELLED' ? styles.statusTextCancelled : styles.statusTextActive]}>
                {liveStatus}
              </Text>
            </View>
          </View>
        )}

        {/* Cancelled Banner if Order was cancelled */}
        {liveStatus === 'CANCELLED' && (
          <View style={styles.cancelledCard}>
            <View style={styles.cancelledIconWrap}>
              <Ionicons name="close-circle" size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cancelledTitle}>Order Cancelled</Text>
              <Text style={styles.cancelledReason}>
                {activeOrder?.cancellationReason || 'No delivery partner was available within delivery timeframe.'}
              </Text>
              <Text style={styles.cancelledRefund}>
                Any amount charged will be refunded to your original payment method within 2-4 business hours.
              </Text>
            </View>
          </View>
        )}

        {/* 1. Live Interactive Map (Top 40%) - Only during active delivery */}
        {!isTerminal && (() => {
          const customerAddressText =
            activeOrder?.deliveryAddress?.houseFlat
              ? `${activeOrder.deliveryAddress.houseFlat}, ${activeOrder.deliveryAddress.areaLandmark || ''}`.trim()
              : (activeOrder?.deliveryAddress as any)?.street ||
              (activeOrder?.deliveryAddress as any)?.address ||
              (activeOrder?.deliveryAddress as any)?.city ||
              '';

          if (!storeCoords) {
            return (
              <View style={{ height: 260, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <ActivityIndicator size="small" color={COLORS.purple} />
                <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '700', color: '#64748B' }}>
                  Locating Accepting Store...
                </Text>
              </View>
            );
          }

          return (
            <DynamicLiveMap
              storeCoords={storeCoords}
              storeName={
                (activeOrder as any)?.store?.name ||
                (activeOrder as any)?.storeId?.name ||
                (activeOrder as any)?.storeName ||
                'Dark Store'
              }
              customerCoords={customerCoords}
              customerAddress={customerAddressText}
              riderCoords={riderCoords}
              riderHeading={riderHeading}
              liveStatus={liveStatus}
              partnerName={partner.name}
              partnerVehicle={partner.vehicleNumber}
              etaText={etaText}
              orderNumber={orderNum}
              isPartnerAssigned={isPartnerAssigned}
            />
          );
        })()}

        {/* 2. Rider Status Card - Only during active delivery */}
        {!isTerminal && (
          <View style={styles.riderStatusCard}>
            <View style={styles.riderStatusLeft}>
              <View style={styles.bikeIconCircle}>
                <Ionicons name="bicycle" size={22} color="#E11D48" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.riderStatusTitle}>
                  {liveStatus === 'ARRIVED_AT_CUSTOMER'
                    ? 'Rider is at your doorstep'
                    : liveStatus === 'OUT_FOR_DELIVERY'
                      ? 'Rider on the way'
                      : liveStatus === 'ARRIVED_AT_STORE'
                        ? 'Rider arrived at store hub'
                        : 'Preparing & packing your order'}
                </Text>
                <Text style={styles.riderStatusEta}>{etaText}</Text>
              </View>
            </View>

            {isPartnerAssigned && partner.phone ? (
              <TouchableOpacity
                style={styles.callCircleBtn}
                onPress={handleCallPartner}
                activeOpacity={0.8}
                accessibilityLabel="Call Delivery Partner"
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* 3. Rider Details Card (Blinkit-Style) - Only during active delivery */}
        {!isTerminal && (
          isPartnerAssigned ? (
            <View style={styles.blinkitRiderCard}>
              <View style={styles.riderAvatarWrap}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  }}
                  style={styles.blinkitRiderAvatar}
                />
                <View style={styles.riderOnlineDot} />
              </View>

              <View style={styles.riderInfoCol}>
                <Text style={styles.blinkitRiderName} numberOfLines={1}>
                  {String(partner.name || '').replace(/\s*\(Wom(?:r)?\s*Up\s*Express\)/gi, '').trim() || 'DARSHAN THANKI'}
                </Text>
                <View style={styles.riderMetaRow}>
                  <Text style={styles.riderVehicleText}>{partner.vehicleNumber || 'GJ 01 AB 3456'}</Text>
                  <Text style={styles.riderMetaSep}>•</Text>
                  <View style={styles.riderRatingPill}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={styles.riderRatingVal}>4.9 (128+)</Text>
                  </View>
                </View>
              </View>

              <View style={styles.riderActionButtons}>
                <TouchableOpacity
                  onPress={handleCallPartner}
                  style={styles.riderCallPill}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={14} color="#059669" />
                  <Text style={styles.riderCallPillText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsChatModalOpen(true)}
                  style={styles.riderChatIconBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.assigningCard}>
              <View style={styles.assigningPulse}>
                <ActivityIndicator size="small" color="#E11D48" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.assigningTitle}>Assigning delivery partner...</Text>
                <Text style={styles.assigningSub}>Locating nearest available rider at dark store</Text>
              </View>
            </View>
          )
        )}

        {/* 4. ANTI-FRAUD DELIVERY PIN CARD - Only during active delivery */}
        {!isTerminal && (
          <View style={styles.pinCard}>
            <LinearGradient
              colors={['#1E1B4B', '#2E1065']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pinGradient}
            >
              <View style={styles.pinHeaderRow}>
                <View style={styles.pinIconWrap}>
                  <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinHeading}>DELIVERY VERIFICATION PIN</Text>
                  <Text style={styles.pinSubheading}>Doorstep Anti-Fraud Handover</Text>
                </View>
                <View style={styles.secureTag}>
                  <Ionicons name="lock-closed" size={11} color="#10B981" />
                  <Text style={styles.secureTagText}>Secure</Text>
                </View>
              </View>

              <Text style={styles.pinDescription}>
                Share this 4-digit secret PIN with your delivery partner at your door to verify and complete handover.
              </Text>

              {/* 4 Large Digit Display Boxes */}
              <View style={styles.otpBoxesRow}>
                {pinDigits.map((digit, idx) => (
                  <View key={idx} style={styles.otpBox}>
                    <Text style={styles.otpDigitText}>{digit}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.pinFooter}>
                <Ionicons name="alert-circle-outline" size={14} color="#CBD5E1" />
                <Text style={styles.pinFooterText}>Do not share this PIN before parcel handover</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* 5. Timeline Progress - Only during active delivery */}
        {!isTerminal && (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineHeading}>Order Status</Text>

            {steps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';
              const isLast = idx === steps.length - 1;

              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineIconCol}>
                    <View
                      style={[
                        styles.stepCircle,
                        isCompleted && styles.stepCircleCompleted,
                        isActive && styles.stepCircleActive,
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={12} color={COLORS.white} />
                      ) : isActive ? (
                        <View style={styles.activeDot} />
                      ) : (
                        <View style={styles.pendingDot} />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          isCompleted && styles.timelineLineCompleted,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.timelineTextCol}>
                    <Text
                      style={[
                        styles.stepTitle,
                        (isCompleted || isActive) && styles.stepTitleBold,
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={styles.stepTime}>{step.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}


        {/* Ordered Items Breakdown Card */}
        {(() => {
          const items = activeOrder?.items || [];
          const totalUnits = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || activeOrder?.itemCount || 0;
          return (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="cart-outline" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
                <Text style={styles.sectionHeading}>
                  Items in this Order ({totalUnits} {totalUnits === 1 ? 'item' : 'items'})
                </Text>
              </View>

              {items && items.length > 0 ? (
                items.map((item: any, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemBullet} />
                    <View style={styles.itemInfoCol}>
                      <Text style={styles.itemNameText}>{item.name}</Text>
                      <Text style={styles.itemQtyText}>Quantity: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPriceText}>
                      ₹{item.subtotal || ((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noItemsText}>Order items details not available</Text>
              )}
            </View>
          );
        })()}

        {/* Delivery Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.hotPink} style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>Delivery Address</Text>
          </View>
          <Text style={styles.recipientName}>
            {activeOrder?.deliveryAddress?.fullName || user?.fullName || 'Womup Customer'} ({activeOrder?.deliveryAddress?.type || activeOrder?.deliveryAddress?.label || 'Home'})
          </Text>
          <Text style={styles.addressLine}>
            {activeOrder?.deliveryAddress?.houseFlat
              ? `${activeOrder.deliveryAddress.houseFlat}, `
              : activeOrder?.deliveryAddress?.houseNumber
                ? `${activeOrder.deliveryAddress.houseNumber}, `
                : ''}
            {activeOrder?.deliveryAddress?.areaLandmark || activeOrder?.deliveryAddress?.landmark || activeOrder?.deliveryAddress?.street || 'Current Delivery Location'}
            {activeOrder?.deliveryAddress?.city ? `, ${activeOrder.deliveryAddress.city}` : ''}
            {activeOrder?.deliveryAddress?.pincode ? ` - ${activeOrder.deliveryAddress.pincode}` : ''}
          </Text>
        </View>

        {/* Bill Summary Card */}
        {(() => {
          const items = Array.isArray(activeOrder?.items) ? activeOrder.items : [];

          // 1. Authoritative Item MRP & Selling Subtotals
          let calculatedMrpSubtotal = 0;
          let calculatedSellingSubtotal = 0;

          items.forEach((it: any) => {
            const qty = Math.max(1, Number(it.quantity) || 1);
            const unitPrice = typeof it.unitPrice === 'number'
              ? it.unitPrice
              : (typeof it.price === 'number' ? it.price : 0);
            const unitMrp = typeof it.unitMrp === 'number'
              ? it.unitMrp
              : (typeof it.mrp === 'number' ? it.mrp : unitPrice);

            calculatedSellingSubtotal += unitPrice * qty;
            calculatedMrpSubtotal += unitMrp * qty;
          });

          // Fallbacks for legacy/mock orders if item details not expanded
          const itemSellingSubtotal = typeof activeOrder?.itemSubtotal === 'number'
            ? activeOrder.itemSubtotal
            : (calculatedSellingSubtotal > 0 ? calculatedSellingSubtotal : (Number(activeOrder?.subtotal) || 0));

          const itemMrpSubtotal = typeof (activeOrder as any)?.mrpSubtotal === 'number' && (activeOrder as any).mrpSubtotal > 0
            ? (activeOrder as any).mrpSubtotal
            : (calculatedMrpSubtotal > 0 ? calculatedMrpSubtotal : Math.max(itemSellingSubtotal, itemSellingSubtotal + (Number(activeOrder?.discount) || 0)));

          // 2. Product Discount = MRP Subtotal - Selling Subtotal
          const productDiscount = Math.max(0, itemMrpSubtotal - itemSellingSubtotal) || (Number(activeOrder?.discount) || 0);

          // 3. Convenience / Handling Fee (authoritative mapping, single charge)
          const convenienceFee = typeof (activeOrder as any)?.convenienceFee === 'number'
            ? (activeOrder as any).convenienceFee
            : (typeof activeOrder?.handlingFee === 'number' ? activeOrder.handlingFee : 5);

          // 4. Delivery Fee & Rate Info
          const hasDeliveryFee = typeof activeOrder?.deliveryFee === 'number';
          const deliveryFee = hasDeliveryFee ? activeOrder.deliveryFee : null;

          const rawOrder = activeOrder as any;

          const toFiniteNumber = (value: unknown): number | null => {
            if (value === null || value === undefined || value === '') {
              return null;
            }
            const numberValue = Number(value);
            return Number.isFinite(numberValue) ? numberValue : null;
          };

          const distanceKm = toFiniteNumber(rawOrder.deliveryDistanceKm);
          const ratePerKm = toFiniteNumber(rawOrder.deliveryRatePerKm);
          const minFee = toFiniteNumber(rawOrder.deliveryMinFee);
          const maxFee = toFiniteNumber(rawOrder.deliveryMaxFee);
          const rawFee =
            toFiniteNumber(rawOrder.rawDeliveryFee ?? rawOrder.rawFee) ??
            (distanceKm !== null && ratePerKm !== null
              ? distanceKm * ratePerKm
              : null);

          const floorApplied =
            typeof rawOrder.floorApplied === 'boolean'
              ? rawOrder.floorApplied
              : rawOrder.breakdown?.floorApplied;

          const capApplied =
            typeof rawOrder.capApplied === 'boolean'
              ? rawOrder.capApplied
              : rawOrder.breakdown?.capApplied;

          let deliverySublabel: string | null = null;

          if (
            distanceKm !== null &&
            ratePerKm !== null &&
            rawFee !== null
          ) {
            if (floorApplied === true && minFee !== null) {
              deliverySublabel =
                `${distanceKm.toFixed(1)} km × ₹${ratePerKm}/km ` +
                `= ₹${rawFee.toFixed(2)} · ₹${minFee} minimum applied`;
            } else if (capApplied === true && maxFee !== null) {
              deliverySublabel =
                `${distanceKm.toFixed(1)} km × ₹${ratePerKm}/km ` +
                `= ₹${rawFee.toFixed(2)} · ₹${maxFee} maximum cap applied`;
            } else {
              deliverySublabel =
                `${distanceKm.toFixed(1)} km × ₹${ratePerKm}/km ` +
                `= ₹${rawFee.toFixed(2)}` +
                `${rawOrder.roundingPolicy === 'WHOLE_RUPEE' ? ' · Final fee rounded' : ''}`;
            }
          }

          // 5. Discounts & Additional Charges
          const couponDiscount = Number(activeOrder?.couponDiscount) || 0;
          const coinsDiscount = Number(activeOrder?.coinsDiscount) || Number((activeOrder as any)?.coinsUsed) || 0;
          const tip = Number(activeOrder?.tip) || 0;
          const tax = Number((activeOrder as any)?.tax) || 0;

          // 6. Total Amount Paid
          const totalPaid = typeof activeOrder?.totalAmount === 'number'
            ? activeOrder.totalAmount
            : Math.max(0, itemSellingSubtotal + (deliveryFee || 0) + convenienceFee + tip + tax - couponDiscount - coinsDiscount);

          return (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="receipt-outline" size={18} color={COLORS.purple} style={{ marginRight: 8 }} />
                <Text style={styles.sectionHeading}>Bill & Payment Summary</Text>
              </View>

              {/* Items Total (MRP) */}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Items Total (MRP)</Text>
                <Text style={styles.billValue}>₹{itemMrpSubtotal}</Text>
              </View>

              {/* Product Discount (MRP vs Selling Price) */}
              {productDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: '#059669' }]}>Product Discount</Text>
                  <Text style={[styles.billValue, { color: '#059669', fontWeight: '700' }]}>-₹{productDiscount}</Text>
                </View>
              )}

              {/* Items Total After Discount (Selling Subtotal) */}
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { fontWeight: '600', color: COLORS.navy }]}>Items Total After Discount</Text>
                <Text style={[styles.billValue, { fontWeight: '700' }]}>₹{itemSellingSubtotal}</Text>
              </View>

              {/* Delivery Fee with transparent calculation sublabel */}
              <View style={[styles.billRow, { alignItems: 'flex-start', paddingTop: 6 }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  {deliverySublabel && (
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                      {deliverySublabel}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.billValue,
                    {
                      fontWeight: '700',
                      color: deliveryFee === 0 ? '#059669' : (deliveryFee !== null ? COLORS.navy : '#94A3B8'),
                    },
                  ]}
                >
                  {deliveryFee === 0 ? 'FREE' : (deliveryFee !== null ? `₹${deliveryFee}` : 'Unavailable')}
                </Text>
              </View>

              {/* Convenience Fee (Handling Fee) */}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Convenience Fee</Text>
                <Text style={styles.billValue}>₹{convenienceFee}</Text>
              </View>

              {/* Coupon Discount if applied */}
              {couponDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: '#059669' }]}>
                    Coupon Discount {activeOrder?.couponCode ? `(${activeOrder.couponCode})` : ''}
                  </Text>
                  <Text style={[styles.billValue, { color: '#059669', fontWeight: '700' }]}>-₹{couponDiscount}</Text>
                </View>
              )}

              {/* Shopping Coins used if applied */}
              {coinsDiscount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: '#059669' }]}>Shopping Coins Applied</Text>
                  <Text style={[styles.billValue, { color: '#059669', fontWeight: '700' }]}>-₹{coinsDiscount}</Text>
                </View>
              )}

              {/* Delivery Partner Tip if applied */}
              {tip > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Partner Tip</Text>
                  <Text style={[styles.billValue, { color: COLORS.navy, fontWeight: '700' }]}>+₹{tip}</Text>
                </View>
              )}

              {/* Tax if applicable */}
              {tax > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Taxes & Charges</Text>
                  <Text style={[styles.billValue, { color: COLORS.navy }]}>+₹{tax}</Text>
                </View>
              )}

              <View style={styles.dividerLine} />

              {/* Grand Total */}
              <View style={styles.billTotalRow}>
                <Text style={styles.billTotalLabel}>Total Amount Paid</Text>
                <Text style={styles.billTotalValue}>₹{totalPaid}</Text>
              </View>

              <View style={styles.paymentMethodRow}>
                <Ionicons name="card-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                <Text style={styles.paymentMethodText}>
                  Paid via {activeOrder?.paymentMethod || 'Online / Cash on Delivery'}
                </Text>
              </View>
            </View>
          );
        })()}



        {/* Action Buttons: Repeat Order, View Orders, and Help */}
        {isDelivered && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveScreen('C25_OrderHistory')}
            style={styles.viewOrderDetailsBtn}
          >
            <Ionicons name="receipt-outline" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
            <Text style={styles.viewOrderDetailsBtnText}>View All Orders</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleRepeatOrder}
          style={styles.actionBtnWrapper}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Ionicons name="repeat" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Repeat This Order</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => Alert.alert('Womup Support', `For assistance with order ${orderNum}, call 1800-WOMUP or email support@womup.in`)}
          style={styles.supportOutlineBtn}
        >
          <Text style={styles.supportOutlineText}>Need Help with this Order?</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Real-Time Live Order Chat Modal */}
      <S27_ChatModal
        visible={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        orderId={orderId}
        orderNumber={orderNum}
        partnerName={partner.name}
        partnerPhone={partner.phone}
        partnerVehicle={partner.vehicleNumber}
        customerId={(user as any)?.id || (user as any)?._id || 'cust_current'}
        customerName={user?.fullName || 'Womup Customer'}
        liveStatus={liveStatus}
        socket={socketRef.current}
      />

      {/* Real-Time Rider Rating & Review Modal */}
      <RiderReviewModal
        visible={isReviewModalOpen}
        orderId={orderId || orderNum}
        orderNumber={orderNum}
        rider={{
          id: (activeOrder as any)?.deliveryPartnerId?._id || (activeOrder as any)?.deliveryPartner?._id || 'default_rider',
          name: partner.name || '',
          vehicleNumber: partner.vehicleNumber || '',
          averageRating: 4.88,
          totalReviews: 128,
        }}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmitted={() => setHasReviewed(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  connectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotConnected: {
    backgroundColor: '#10B981',
  },
  dotDisconnected: {
    backgroundColor: '#F59E0B',
  },
  connectionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  orderInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderNumberTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  orderDateSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pinCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  pinGradient: {
    padding: 18,
  },
  pinHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pinIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pinHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  pinSubheading: {
    fontSize: 11,
    color: '#94A3B8',
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  secureTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  pinDescription: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    marginBottom: 14,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  otpBox: {
    width: 54,
    height: 58,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FDE68A',
    letterSpacing: 1,
  },
  pinFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  pinFooterText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  deliveredSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  deliveredCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  deliveredMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  deliveredOrderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.hotPink,
    marginBottom: 4,
  },
  deliveredTimestamp: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 16,
  },
  deliveredDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  deliveredBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  deliveredBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  deliveredRateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
    width: '100%',
  },
  deliveredRateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  viewOrderDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  viewOrderDetailsBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  mapCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  mapMockBackground: {
    height: 160,
    backgroundColor: '#E8ECFA',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadLine: {
    position: 'absolute',
    width: '80%',
    height: 4,
    backgroundColor: '#D1D9F0',
    borderRadius: 2,
  },
  dashedRoute: {
    position: 'absolute',
    width: '60%',
    height: 3,
    backgroundColor: COLORS.hotPink,
    left: '20%',
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  storePin: {
    left: '16%',
    backgroundColor: COLORS.navy,
  },
  scooterPin: {
    backgroundColor: COLORS.hotPink,
  },
  homePin: {
    right: '16%',
    backgroundColor: COLORS.blue,
  },
  mapFooter: {
    padding: SPACING.compact,
    backgroundColor: COLORS.white,
  },
  mapEta: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  mapSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gpsCoordsText: {
    fontSize: 10,
    color: '#059669',
    marginTop: 4,
    fontWeight: '600',
  },
  timelineCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
  },
  stepCircleActive: {
    backgroundColor: COLORS.hotPink,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  timelineLine: {
    width: 2,
    height: 36,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  timelineLineCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  stepTitleBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  assigningPartnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8FA',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FED7E2',
    borderStyle: 'dashed',
  },
  assigningBeacon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  assigningDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.hotPink,
  },
  assigningInfo: {
    flex: 1,
  },
  assigningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  assigningSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECE8FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerRole: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 2,
  },
  partnerVehicle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  circleActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: '#FCE1F5',
    borderColor: COLORS.hotPink,
  },
  statusPillDelivered: {
    backgroundColor: '#E6F9F0',
    borderColor: '#059669',
  },
  statusPillCancelled: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: COLORS.hotPink,
  },
  statusTextDelivered: {
    color: '#059669',
  },
  statusTextCancelled: {
    color: '#DC2626',
  },
  cancelledCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  cancelledIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  cancelledReason: {
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
    marginBottom: 6,
  },
  cancelledRefund: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F5',
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.hotPink,
    marginRight: 10,
  },
  itemInfoCol: {
    flex: 1,
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  itemQtyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginLeft: 8,
  },
  noItemsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginVertical: 8,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.hotPink,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F5',
  },
  paymentMethodText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  actionBtnWrapper: {
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 10,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  supportOutlineBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(131, 100, 230, 0.35)',
    backgroundColor: '#F8F6FE',
  },
  supportOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.purple,
  },
  riderStatusCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  riderStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bikeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  riderStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  riderStatusEta: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
    marginTop: 2,
  },
  callCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  blinkitRiderCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  riderAvatarWrap: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  blinkitRiderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  riderOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  riderInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  blinkitRiderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  riderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  riderVehicleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  riderMetaSep: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  riderRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  riderRatingVal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  riderActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riderCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  riderCallPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  riderChatIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  assigningCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  assigningPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
