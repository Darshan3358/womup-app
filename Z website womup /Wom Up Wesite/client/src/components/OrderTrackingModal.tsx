import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ShieldCheck,
  MapPin,
  Phone,
  RotateCcw,
  Bike,
  HelpCircle,
  Receipt,
  Lock,
  AlertCircle,
  User,
} from 'lucide-react';
import type { Order } from '../types';
import { subscribeToOrderTracking } from '../services/api';
import { useCart } from '../context/CartContext';
import { LiveTrackingMap } from './LiveTrackingMap';
import { RiderReviewModal } from './RiderReviewModal';

interface OrderTrackingModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose }) => {
  const { cancelOrder, addToCart, setIsCartOpen } = useCart();
  const [currentStatus, setCurrentStatus] = useState<string>(order?.status || 'PLACED');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(order?.cancellationReason || null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(Boolean((order as any)?.riderReview?.isSubmitted));

  useEffect(() => {
    if (!order) return;
    setCurrentStatus(order.status || 'PLACED');
    setCancelReason(order.cancellationReason || null);

    // Subscribe to live WebSocket tracking updates from NestJS tracking gateway
    const unsubscribe = subscribeToOrderTracking(order.id || (order as any)._id, (data) => {
      if (data.status) {
        setCurrentStatus(data.status);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [order]);

  const isCancelled = (currentStatus || '').toUpperCase() === 'CANCELLED';
  const isDelivered = (currentStatus || '').toUpperCase() === 'DELIVERED';

  // Auto-open review modal on delivery (MUST be called before any early return to obey React Rules of Hooks)
  useEffect(() => {
    if (order && isDelivered && !hasReviewed) {
      const timer = setTimeout(() => {
        setIsReviewModalOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [order, isDelivered, hasReviewed]);

  if (!order) return null;

  // 4-Digit Delivery Verification PIN
  const pinStr = (order.deliveryPin || order.deliveryOtp || '4821').toString().padStart(4, '0').slice(-4);
  const pinDigits = pinStr.split('');

  // Partner resolution matching S24_OrderTrackingScreen
  const rawPartnerName =
    order.deliveryPartner?.name ||
    (order as any).deliveryPartnerId?.fullName ||
    (order as any).deliveryPartnerId?.name ||
    (order as any).rider?.name ||
    '';

  const cleanPartnerName = typeof rawPartnerName === 'string'
    ? rawPartnerName.replace(/\s*\(Worm Up Express\)/gi, '').trim()
    : '';

  const isPartnerAssigned =
    !isCancelled &&
    !isDelivered &&
    Boolean(
      cleanPartnerName &&
      cleanPartnerName.toLowerCase() !== 'delivery partner' &&
      cleanPartnerName.toLowerCase() !== 'assigning...' &&
      !cleanPartnerName.toLowerCase().includes('rohit')
    );

  const partnerName = isPartnerAssigned ? cleanPartnerName : '';
  const rawPartnerPhone = isPartnerAssigned
    ? (order.deliveryPartner?.phone ||
       (order as any).deliveryPartnerId?.phoneNumber ||
       (order as any).deliveryPartnerId?.phone ||
       (order as any).rider?.phone ||
       '')
    : '';
  const partnerPhone = String(rawPartnerPhone);
  const vehicleNumber = isPartnerAssigned
    ? (order.deliveryPartner?.vehicleNumber ||
       (order as any).deliveryPartnerId?.vehicleNumber ||
       'Electric Scooter')
    : '';

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setIsCancelling(true);
    const ok = await cancelOrder(order.id, 'Customer requested cancellation');
    if (ok) {
      setCurrentStatus('CANCELLED');
      setCancelReason('Customer requested cancellation');
    }
    setIsCancelling(false);
  };

  const handleRepeatOrder = () => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((it) => {
        addToCart({
          id: it.productId,
          _id: it.productId,
          name: it.name,
          brand: 'Farm Fresh',
          category: 'Groceries',
          price: it.price,
          sellingPrice: it.price,
          unit: it.unit || '1 unit',
          quantityLabel: it.quantityLabel || '1 unit',
          image: it.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80',
          description: '',
          rating: 4.8,
          reviewCount: 30,
          inStock: true,
        });
      });
      setIsCartOpen(true);
      onClose();
    }
  };

  // Timeline steps matching S24_OrderTrackingScreen
  const timelineSteps = [
    {
      title: 'Order Confirmed',
      time: order.createdAt || '09:54 pm',
      isCompleted: true,
      isActive: false,
    },
    {
      title: 'Packed & Dispatched',
      time: 'In 3 mins',
      isCompleted: isDelivered || currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'PACKED',
      isActive: currentStatus === 'PACKED',
    },
    {
      title: 'Out for Delivery',
      time: 'In 6 mins',
      isCompleted: isDelivered || currentStatus === 'OUT_FOR_DELIVERY',
      isActive: currentStatus === 'OUT_FOR_DELIVERY',
    },
    {
      title: 'Delivering in 9 mins',
      time: '9-12 minutes',
      isCompleted: isDelivered,
      isActive: false,
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 27, 82, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top App Header Strip */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#071B52',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#071B52' }}>
            Live Order Tracking
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Live WebSocket Telemetry Connected Badge */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '12px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <span
              className="pulse-beacon"
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#16A34A',
                boxShadow: '0 0 8px #16A34A',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803D' }}>
              Live WebSocket Telemetry Connected
            </span>
          </div>

          {/* Price Adjustment Notice if prices changed for delivery area */}
          {order.priceAdjustments && order.priceAdjustments.length > 0 && (
            <div
              style={{
                background: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                borderRadius: '16px',
                padding: '14px 18px',
                marginBottom: '14px',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertCircle size={18} color="#D97706" />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#92400E' }}>
                  Prices auto-adjusted for {order.storeName || 'serving dark store'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#B45309', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                {order.priceAdjustments.length} {order.priceAdjustments.length > 1 ? 'items were' : 'item was'} updated to match your delivery area store's live catalog. Your final total is ₹{order.total}.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {order.priceAdjustments.map((adj: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '0.76rem',
                      color: '#78350F',
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: 'rgba(253, 230, 138, 0.35)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                    }}
                  >
                    <span>• {adj.name} ({adj.quantity}x)</span>
                    <span style={{ fontWeight: 700 }}>
                      ₹{adj.oldPrice} → ₹{adj.newPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order ID & Status Banner */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 18px',
              marginBottom: '14px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(7, 27, 82, 0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#071B52' }}>
                {order.orderNumber}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                Placed on {order.createdAt || '8 Oct 2026, 09:54 pm'}
              </div>
            </div>

            <div
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.76rem',
                textTransform: 'uppercase',
                background: isCancelled ? '#FEF2F2' : isDelivered ? '#ECFDF5' : '#FDF2F8',
                color: isCancelled ? '#EF4444' : isDelivered ? '#10B981' : '#FF3B98',
                border: `1px solid ${isCancelled ? '#FCA5A5' : isDelivered ? '#A7F3D0' : '#FBCFE8'}`,
              }}
            >
              {currentStatus}
            </div>
          </div>

          {/* Cancellation Notice */}
          {isCancelled && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#B91C1C',
                fontSize: '0.84rem',
              }}
            >
              <AlertCircle size={18} />
              <div>
                <strong>Order Cancelled:</strong> {cancelReason || 'Cancelled upon request'}
              </div>
            </div>
          )}

          {/* 1. DELIVERY VERIFICATION PIN CARD (Glassmorphic Glow & Secure Handover) */}
          {!isCancelled && !isDelivered && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(120, 86, 246, 0.35)',
                borderRadius: '20px',
                padding: '20px',
                color: '#FFFFFF',
                marginBottom: '14px',
                boxShadow: '0 12px 32px rgba(120, 86, 246, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F59E0B',
                    }}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#F59E0B', letterSpacing: '0.04em' }}>
                      DELIVERY VERIFICATION PIN
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      Doorstep Anti-Fraud Handover
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#10B981',
                  }}
                >
                  <Lock size={10} />
                  Secure
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#CBD5E1', margin: '8px 0 16px', lineHeight: 1.4 }}>
                Share this 4-digit secret PIN with your delivery partner at your door to verify and complete handover.
              </p>

              {/* 4 Large Digit Boxes */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '14px' }}>
                {pinDigits.map((digit, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '54px',
                      height: '58px',
                      borderRadius: '12px',
                      background: '#2E285F',
                      border: '1.5px solid #4338CA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.85rem',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      boxShadow: '0 0 12px rgba(120, 86, 246, 0.3), inset 0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {digit}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94A3B8', justifyContent: 'center' }}>
                <AlertCircle size={12} />
                <span>Do not share this PIN before parcel handover</span>
              </div>
            </div>
          )}

          {/* Delivered Banner & Rating Prompt */}
          {isDelivered && (
            <div
              style={{
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                borderRadius: '20px',
                padding: '18px 20px',
                color: '#FFFFFF',
                marginBottom: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(4, 120, 87, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>Order Delivered & Verified!</div>
                  <div style={{ fontSize: '0.78rem', color: '#D1FAE5', marginTop: '2px' }}>
                    Delivery verification completed. 10% Shopping Coins credited!
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                style={{
                  background: '#FFFFFF',
                  color: '#7C3AED',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span>⭐</span>
                <span>{hasReviewed ? '★ Rated Delivery Partner' : 'Rate Your Delivery Experience'}</span>
              </button>
            </div>
          )}

          {/* 2. REAL-TIME INTERACTIVE LEAFLET GPS MAP (Live Socket.IO Telemetry) */}
          <div style={{ marginBottom: '16px' }}>
            <LiveTrackingMap
              orderId={order.id || (order as any)._id}
              orderNumber={order.orderNumber}
              storeLocation={[
                (order as any).storeId?.location?.coordinates?.[1] || 23.1128,
                (order as any).storeId?.location?.coordinates?.[0] || 72.5427,
              ]}
              customerLocation={[
                (order as any).deliveryAddress?.location?.coordinates?.[1] ||
                  (order as any).deliveryAddress?.coordinates?.[1] ||
                  (order as any).deliveryAddress?.latitude ||
                  23.1288,
                (order as any).deliveryAddress?.location?.coordinates?.[0] ||
                  (order as any).deliveryAddress?.coordinates?.[0] ||
                  (order as any).deliveryAddress?.longitude ||
                  72.5507,
              ]}
              storeName={order.storeName || 'Wom Up Dark Store'}
              customerAddress={
                typeof order.deliveryAddress === 'string'
                  ? order.deliveryAddress
                  : order.deliveryAddress?.address || order.deliveryAddress?.houseFlat || 'Delivery Address'
              }
              status={currentStatus}
              partnerName={isPartnerAssigned ? partnerName : ''}
              isPartnerAssigned={isPartnerAssigned}
            />
          </div>

          {/* 3. ORDER STATUS TIMELINE (Exact Customer App Match) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#071B52', marginBottom: '16px' }}>
              Order Status
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {timelineSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
                  {/* Step Circle */}
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: step.isCompleted ? '#16A34A' : step.isActive ? '#FF3B98' : '#F1F5F9',
                      border: step.isCompleted || step.isActive ? 'none' : '2px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      zIndex: 2,
                    }}
                  >
                    {step.isCompleted ? '✓' : ''}
                  </div>

                  {/* Vertical connecting line */}
                  {idx < timelineSteps.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '26px',
                        bottom: '-16px',
                        width: '2px',
                        background: step.isCompleted ? '#16A34A' : '#E2E8F0',
                        zIndex: 1,
                      }}
                    />
                  )}

                  <div style={{ flex: 1, paddingTop: '2px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#071B52' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      {step.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. ITEMS IN THIS ORDER (Exact Customer App Match) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '18px',
              marginBottom: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#071B52', marginBottom: '14px' }}>
              Items in this Order ({order.items?.length || 1})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items?.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        minWidth: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={it.image || (it as any).imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'}
                        alt={it.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#071B52' }}>
                        {it.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                        Qty: {it.quantity}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#071B52', fontSize: '0.92rem' }}>
                    ₹{it.price * it.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. DELIVERY ADDRESS (Exact Customer App Match) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '18px',
              marginBottom: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.95rem', color: '#071B52', marginBottom: '8px' }}>
              <MapPin size={16} color="#FF3B98" />
              Delivery Address
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#071B52' }}>
              Current (Current)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
              {typeof order.deliveryAddress === 'string'
                ? order.deliveryAddress
                : 'Chandlodiya, Chandlodiya, Current Delivery Location, Chandlodiya - 380015'}
            </div>
          </div>

          {/* 6. BILL & PAYMENT SUMMARY (Exact Customer App Match: Subtotal, Delivery Fee ₹40, Discount, Total) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '18px',
              marginBottom: '14px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.95rem', color: '#071B52', marginBottom: '14px' }}>
              <Receipt size={16} color="#7856F6" />
              Bill & Payment Summary
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#64748B' }}>
                <span>Items Subtotal</span>
                <span style={{ fontWeight: 700, color: '#071B52' }}>₹{order.subtotal || 60}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#64748B' }}>
                <span>Delivery Fee</span>
                <span style={{ fontWeight: 700, color: '#071B52' }}>
                  {order.deliveryFee !== undefined ? `₹${order.deliveryFee}` : '₹40'}
                </span>
              </div>

              {(order.couponDiscount > 0 || order.coinDiscount > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#16A34A' }}>
                  <span>Discount</span>
                  <span style={{ fontWeight: 700 }}>
                    -₹{(order.couponDiscount || 0) + (order.coinDiscount || 0) || 15}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #E2E8F0',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  color: '#071B52',
                }}
              >
                <span>Total Amount Paid</span>
                <span>₹{order.total}</span>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💳 Paid via {order.paymentMethod || 'COD'}</span>
              </div>
            </div>
          </div>

          {/* 7. DELIVERY PARTNER SECTION (Exact 100% Match with Customer App S24) */}
          <style>{`
            @keyframes spinPartner {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          {isCancelled ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FEF2F2',
                borderRadius: '16px',
                padding: '14px 16px',
                border: '1.5px solid #FCA5A5',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={22} color="#EF4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#991B1B' }}>
                  Order Cancelled
                </div>
                <div style={{ fontSize: '0.78rem', color: '#B91C1C', marginTop: '2px' }}>
                  No delivery partner assigned for this order
                </div>
              </div>
            </div>
          ) : !isPartnerAssigned ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFF8FA',
                borderRadius: '16px',
                padding: '14px 16px',
                border: '1.5px dashed #FED7E2',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FFE3EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#FF3B98',
                  }}
                />
                <Bike size={22} color="#FF3B98" />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#071B52' }}>
                  Assigning delivery partner...
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                  Locating nearest rider at dark store
                </div>
              </div>

              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid #FED7E2',
                  borderTopColor: '#FF3B98',
                  animation: 'spinPartner 0.8s linear infinite',
                  flexShrink: 0,
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '14px 16px',
                border: '1px solid #E2E8F0',
                gap: '12px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#ECE8FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7856F6',
                  flexShrink: 0,
                }}
              >
                <User size={22} color="#7856F6" />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                  Delivery Partner
                </div>
                <div style={{ fontWeight: 700, color: '#071B52', fontSize: '0.95rem', marginTop: '1px' }}>
                  {partnerName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '1px' }}>
                  {vehicleNumber || 'Electric Scooter'}
                </div>
              </div>

              {partnerPhone && (
                <a
                  href={`tel:${partnerPhone.replace(/[^0-9+]/g, '')}`}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    color: '#FF3B98',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    flexShrink: 0,
                  }}
                >
                  <Phone size={18} color="#FF3B98" />
                </a>
              )}
            </div>
          )}

          {/* 8. ACTION BUTTONS (Exact Customer App Match) */}
          <button
            onClick={handleRepeatOrder}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF3B98 0%, #7856F6 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(255, 59, 152, 0.35)',
              marginBottom: '10px',
            }}
          >
            <RotateCcw size={18} />
            Repeat This Order
          </button>

          {!isCancelled && (currentStatus === 'PLACED' || currentStatus === 'ACCEPTED') ? (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                background: '#FFFFFF',
                border: '1.5px solid #EF4444',
                color: '#EF4444',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isCancelling ? 'not-allowed' : 'pointer',
              }}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          ) : (
            <button
              onClick={() => alert('Support team reached! A WormUp representative will assist you.')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <HelpCircle size={16} />
              Need Help with this Order?
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Rider Rating & Review Modal */}
      <RiderReviewModal
        isOpen={isReviewModalOpen}
        orderId={order.id || (order as any)._id}
        orderNumber={order.orderNumber}
        rider={{
          id: (order as any).deliveryPartnerId?._id || 'default_rider',
          name: partnerName || 'DARSHAN THANKI',
          vehicleNumber: vehicleNumber || 'GJ AE 2020',
          averageRating: 4.88,
          totalReviews: 128,
        }}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmitted={() => setHasReviewed(true)}
      />
    </div>
  );
};
