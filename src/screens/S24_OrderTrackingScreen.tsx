import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
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

export const S24_OrderTrackingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { currentOrder, setActiveScreen, goBack, user, addToCart } = useApp();

  const order = currentOrder;
  const orderNum = order?.orderNumber || (order as any)?.orderId || '';
  const orderId = (order as any)?._id || order?.id || (orderNum ? orderNum.replace(/^#/, '') : '');

  // Real-time tracking state
  const [liveStatus, setLiveStatus] = useState<string>((order?.status || 'PLACED').toUpperCase());
  const [deliveryPin, setDeliveryPin] = useState<string>((order as any)?.deliveryOtp || '4821');

  const rawPartnerName =
    order?.deliveryPartner?.name ||
    order?.deliveryPartnerId?.fullName ||
    (order as any)?.partnerName ||
    '';
  const initialPartnerName =
    rawPartnerName.toLowerCase().includes('rohit') || rawPartnerName.toLowerCase() === 'delivery partner'
      ? ''
      : rawPartnerName.replace(/\s*\(Worm Up Express\)/gi, '').trim();

  const initialPartnerPhone =
    order?.deliveryPartner?.phone ||
    order?.deliveryPartnerId?.phoneNumber ||
    (order as any)?.partnerPhone ||
    '';
  const initialVehicleNumber =
    order?.deliveryPartner?.vehicleNumber ||
    order?.deliveryPartnerId?.vehicleNumber ||
    (order as any)?.vehicleNumber ||
    '';

  const [partner, setPartner] = useState({
    name: initialPartnerName,
    phone: initialPartnerPhone,
    vehicleNumber: initialVehicleNumber,
  });
  const [riderCoords, setRiderCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [etaText, setEtaText] = useState('9-12 minutes');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Sync real-time updates whenever currentOrder changes in AppContext
  useEffect(() => {
    if (order) {
      if (order.status) {
        setLiveStatus(order.status.toUpperCase());
      }
      if (order.deliveryOtp) {
        setDeliveryPin(order.deliveryOtp);
      }
      const p = order.deliveryPartner || order.deliveryPartnerId;
      if (p) {
        const raw = (p as any).name || (p as any).fullName || '';
        if (raw && !raw.toLowerCase().includes('rohit') && raw.toLowerCase() !== 'delivery partner') {
          setPartner((prev) => ({
            name: raw.replace(/\s*\(Worm Up Express\)/gi, '').trim(),
            phone: (p as any).phone || (p as any).phoneNumber || prev.phone,
            vehicleNumber: (p as any).vehicleNumber || prev.vehicleNumber,
          }));
        }
      }
    }
  }, [order]);

  const isPartnerAssigned = Boolean(
    partner.name &&
    partner.name.trim() !== '' &&
    partner.name.toLowerCase() !== 'delivery partner' &&
    partner.name.toLowerCase() !== 'assigning...' &&
    !partner.name.toLowerCase().includes('rohit') &&
    liveStatus !== 'PLACED'
  );

  const handleCallPartner = async () => {
    if (!isPartnerAssigned || !partner.phone) {
      Alert.alert(
        'Delivery Partner',
        'Your delivery partner is currently being allotted. You can call once they accept the order.'
      );
      return;
    }
    const clean = partner.phone.replace(/[^0-9+]/g, '');
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

  // Connect to WebSocket Gateway
  useEffect(() => {
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

    socket.on('order_status', (data: any) => {
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
        }
      }

      if (data.partnerName || data.partnerId || data.phoneNumber || data.partnerPhone) {
        const rawName = data.partnerName || '';
        const cleanName = rawName.replace(/\s*\(Worm Up Express\)/gi, '').trim();
        if (cleanName && !cleanName.toLowerCase().includes('rohit') && cleanName.toLowerCase() !== 'delivery partner') {
          setPartner((prev) => ({
            ...prev,
            name: cleanName,
            phone: data.partnerPhone || data.phoneNumber || prev.phone,
            vehicleNumber: data.vehicleNumber || prev.vehicleNumber,
          }));
        }
      }

      if (data.deliveryOtp) {
        setDeliveryPin(data.deliveryOtp);
      }
    });

    socket.on('update_delivery_location', (data: any) => {
      if (!data) return;
      const eventOrderId = data.orderId?.toString();
      if (eventOrderId && orderId && eventOrderId !== orderId && eventOrderId !== orderNum) return;
      if (data.latitude && data.longitude) {
        setRiderCoords({ latitude: data.latitude, longitude: data.longitude });
      }
    });

    // Helper to refresh order data with self-healing REST fallback
    const refreshOrderData = async () => {
      if (liveStatusRef.current === 'DELIVERED') return;
      const targetQuery = orderId || orderNum.replace(/^#/, '') || orderNum;
      if (!targetQuery || targetQuery === 'W12345678') return;

      try {
        const res = await fetch(`http://localhost:5050/api/v1/orders/${encodeURIComponent(targetQuery)}`);
        if (res.ok) {
          const json = await res.json();
          const fresh = json.data || json;
          const rawStatus = fresh?.status || fresh?.orderStatus || '';
          const targetStatus = rawStatus.toUpperCase();
          if (targetStatus) {
            setLiveStatus(targetStatus);
            if (targetStatus === 'OUT_FOR_DELIVERY') {
              setEtaText('5-7 minutes');
            } else if (targetStatus === 'ARRIVED_AT_CUSTOMER') {
              setEtaText('Arrived at Doorstep');
            } else if (targetStatus === 'DELIVERED') {
              setEtaText('Delivered');
            }
          }
          if (fresh?.deliveryOtp) setDeliveryPin(fresh.deliveryOtp);
          const pObj = fresh?.deliveryPartner || fresh?.deliveryPartnerId;
          if (pObj) {
            const raw = pObj.name || pObj.fullName || '';
            const clean = raw.replace(/\s*\(Worm Up Express\)/gi, '').trim();
            if (clean && !clean.toLowerCase().includes('rohit') && clean.toLowerCase() !== 'delivery partner') {
              setPartner((prev) => ({
                ...prev,
                name: clean,
                phone: pObj.phone || pObj.phoneNumber || prev.phone,
                vehicleNumber: pObj.vehicleNumber || prev.vehicleNumber,
              }));
            }
            if (pObj.currentLocation && pObj.currentLocation.latitude && pObj.currentLocation.longitude) {
              setRiderCoords({
                latitude: pObj.currentLocation.latitude,
                longitude: pObj.currentLocation.longitude,
              });
            }
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    // Initial immediate fetch to populate assigned partner details & catch latest status
    refreshOrderData();

    // Fallback polling every 5s
    const pollInterval = setInterval(refreshOrderData, 5000);

    return () => {
      clearInterval(pollInterval);
      if (orderId) {
        socket.emit('leave_order', { orderId });
      }
      if (orderNum) {
        socket.emit('leave_order', { orderId: orderNum });
      }
      socket.off('connect');
      socket.off('disconnect');
      socket.off('order_status');
      socket.off('update_delivery_location');
      socket.disconnect();
    };
  }, [orderId, orderNum]);

  const isDelivered = liveStatus === 'DELIVERED';
  const isOutForDelivery = liveStatus === 'OUT_FOR_DELIVERY' || liveStatus === 'ARRIVED_AT_CUSTOMER' || isDelivered;
  const isPacked = ['GOING_TO_STORE', 'ARRIVED_AT_STORE', 'PACKING', 'PACKED', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED'].includes(liveStatus);

  // Stepper steps based on real-time authoritative status
  const steps = [
    {
      title: 'Order Confirmed',
      time: order?.date ? order.date.split(',')[1] || 'Just now' : 'Just now',
      status: 'completed',
    },
    {
      title: 'Packed & Dispatched',
      time: isPacked ? 'Completed' : 'In 3 mins',
      status: isPacked ? 'completed' : 'active',
    },
    {
      title: 'Out for Delivery',
      time: isOutForDelivery ? (liveStatus === 'ARRIVED_AT_CUSTOMER' ? 'At Doorstep' : 'In progress') : 'In 6 mins',
      status: isDelivered ? 'completed' : (isOutForDelivery ? 'active' : 'pending'),
    },
    {
      title: isDelivered ? 'Delivered' : 'Delivering in 9 mins',
      time: isDelivered ? 'Verified & Delivered' : etaText,
      status: isDelivered ? 'completed' : (liveStatus === 'ARRIVED_AT_CUSTOMER' ? 'active' : 'pending'),
    },
  ];

  // Scooter position calculation
  let scooterLeft = '52%';
  if (liveStatus === 'PLACED' || liveStatus === 'PACKING') scooterLeft = '22%';
  else if (liveStatus === 'GOING_TO_STORE' || liveStatus === 'ARRIVED_AT_STORE') scooterLeft = '35%';
  else if (liveStatus === 'OUT_FOR_DELIVERY') scooterLeft = '60%';
  else if (liveStatus === 'ARRIVED_AT_CUSTOMER' || liveStatus === 'DELIVERED') scooterLeft = '80%';

  const pinDigits = (deliveryPin || '4821').slice(0, 4).split('');

  const handleRepeatOrder = () => {
    if (order?.items && order.items.length > 0) {
      order.items.forEach((it) => {
        addToCart({
          id: it.productId || `prod_${Date.now()}`,
          name: it.name,
          brand: 'Worm Up',
          categoryId: 'cooking',
          sellingPrice: it.price,
          mrp: Math.round(it.price * 1.15),
          discountPercent: 12,
          shoppingCoins: 10,
          rating: 4.8,
          reviewCount: 30,
          stock: 100,
          deliveryMinutes: 9,
          description: '',
          quantityLabel: `${it.quantity} unit`,
        });
      });
      setActiveScreen('C19_Cart');
    } else {
      Alert.alert('Notice', 'No items found in this order.');
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <Header
        title="Live Order Tracking"
        onBack={goBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Connection Status Banner */}
        <View style={styles.connectionBar}>
          <View style={[styles.statusDot, isConnected ? styles.dotConnected : styles.dotDisconnected]} />
          <Text style={styles.connectionText}>
            {isConnected ? 'Live WebSocket Telemetry Connected' : 'Connecting to live tracking...'}
          </Text>
        </View>

        {/* Order Info & Status Header */}
        <View style={styles.orderInfoCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumberTitle}>{orderNum}</Text>
            <Text style={styles.orderDateSubtitle}>Placed on {order?.date || 'Today'}</Text>
          </View>
          <View style={[styles.statusPill, isDelivered ? styles.statusPillDelivered : styles.statusPillActive]}>
            <Text style={[styles.statusPillText, isDelivered ? styles.statusTextDelivered : styles.statusTextActive]}>
              {liveStatus}
            </Text>
          </View>
        </View>

        {/* ANTI-FRAUD DELIVERY PIN CARD */}
        {!isDelivered ? (
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
        ) : (
          <View style={styles.deliveredSuccessCard}>
            <LinearGradient
              colors={['#065F46', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.deliveredGradient}
            >
              <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.deliveredTitle}>Order Delivered & Verified!</Text>
                <Text style={styles.deliveredSubtitle}>
                  Handover PIN verified. 10% Shopping Coins credited to your wallet!
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Dynamic Real-Time Live Map Tracker */}
        <DynamicLiveMap
          storeCoords={{
            latitude: (order as any)?.storeId?.location?.coordinates?.[1] || 23.0305,
            longitude: (order as any)?.storeId?.location?.coordinates?.[0] || 72.56,
          }}
          storeName={(order as any)?.storeId?.name || 'Worm Up Dark Store #01'}
          customerCoords={{
            latitude: (order as any)?.deliveryAddress?.coordinates?.[1] || 23.0225,
            longitude: (order as any)?.deliveryAddress?.coordinates?.[0] || 72.5714,
          }}
          customerAddress={
            order?.deliveryAddress?.houseFlat
              ? `${order.deliveryAddress.houseFlat}, ${order.deliveryAddress.areaLandmark || ''}`
              : 'Customer Doorstep'
          }
          riderCoords={riderCoords}
          liveStatus={liveStatus}
          partnerName={partner.name}
          partnerVehicle={partner.vehicleNumber}
          etaText={etaText}
          orderNumber={orderNum}
        />

        {/* Timeline Progress */}
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

        {/* Ordered Items Breakdown Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="cart-outline" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>
              Items in this Order ({order?.items?.length || 0})
            </Text>
          </View>

          {order?.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemBullet} />
                <View style={styles.itemInfoCol}>
                  <Text style={styles.itemNameText}>{item.name}</Text>
                  <Text style={styles.itemQtyText}>Quantity: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPriceText}>₹{item.price * item.quantity}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>Order items details not available</Text>
          )}
        </View>

        {/* Delivery Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.hotPink} style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>Delivery Address</Text>
          </View>
          <Text style={styles.recipientName}>
            {order?.deliveryAddress?.fullName || user?.fullName || 'Worm Up Customer'} ({order?.deliveryAddress?.type || 'Home'})
          </Text>
          <Text style={styles.addressLine}>
            {order?.deliveryAddress?.houseFlat ? `${order.deliveryAddress.houseFlat}, ` : ''}
            {order?.deliveryAddress?.areaLandmark || 'Current Delivery Location'}
            {order?.deliveryAddress?.city ? `, ${order.deliveryAddress.city}` : ''}
            {order?.deliveryAddress?.pincode ? ` - ${order.deliveryAddress.pincode}` : ''}
          </Text>
        </View>

        {/* Bill Summary Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="receipt-outline" size={18} color={COLORS.purple} style={{ marginRight: 8 }} />
            <Text style={styles.sectionHeading}>Bill & Payment Summary</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Subtotal</Text>
            <Text style={styles.billValue}>₹{order?.subtotal || order?.totalAmount || 0}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, { color: '#059669' }]}>FREE</Text>
          </View>

          {order?.discount && order.discount > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Discount</Text>
              <Text style={[styles.billValue, { color: COLORS.hotPink }]}>-₹{order.discount}</Text>
            </View>
          ) : null}

          <View style={styles.dividerLine} />

          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Total Amount Paid</Text>
            <Text style={styles.billTotalValue}>₹{order?.totalAmount || 0}</Text>
          </View>

          <View style={styles.paymentMethodRow}>
            <Ionicons name="card-outline" size={14} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.paymentMethodText}>
              Paid via {order?.paymentMethod || 'Online / Cash on Delivery'}
            </Text>
          </View>
        </View>

        {/* Delivery Partner Section */}
        {!isPartnerAssigned ? (
          <View style={styles.assigningPartnerCard}>
            <View style={styles.assigningBeacon}>
              <View style={styles.assigningDot} />
              <Ionicons name="bicycle" size={24} color={COLORS.hotPink} />
            </View>

            <View style={styles.assigningInfo}>
              <Text style={styles.assigningTitle}>Assigning delivery partner...</Text>
              <Text style={styles.assigningSub}>Locating nearest rider at dark store</Text>
            </View>

            <ActivityIndicator size="small" color={COLORS.hotPink} />
          </View>
        ) : (
          <View style={styles.partnerCard}>
            <View style={styles.partnerAvatar}>
              <Ionicons name="person" size={24} color={COLORS.purple} />
            </View>

            <View style={styles.partnerInfo}>
              <Text style={styles.partnerRole}>Delivery Partner</Text>
              <Text style={styles.partnerName}>{partner.name.replace(/\s*\(Worm Up Express\)/gi, '').trim()}</Text>
              <Text style={styles.partnerVehicle}>{partner.vehicleNumber || 'Electric Scooter'}</Text>
            </View>

            <View style={styles.partnerActions}>
              <TouchableOpacity
                onPress={handleCallPartner}
                style={styles.circleActionButton}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={18} color={COLORS.hotPink} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsChatModalOpen(true)}
                style={styles.circleActionButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.blue} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons: Repeat Order and Help */}
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
          onPress={() => Alert.alert('Worm Up Support', `For assistance with order ${orderNum}, call 1800-WORM-UP or email support@wormup.in`)}
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
        customerName={user?.fullName || 'Worm Up Customer'}
        liveStatus={liveStatus}
        socket={socketRef.current}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
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
  deliveredSuccessCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  deliveredGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deliveredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deliveredSubtitle: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 2,
    lineHeight: 16,
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
});
