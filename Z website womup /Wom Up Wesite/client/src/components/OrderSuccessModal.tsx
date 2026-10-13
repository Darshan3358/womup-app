import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Package, Bike, Home, Sparkles } from 'lucide-react';
import type { Order } from '../types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose }) => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!order) return;
    setStep(1);

    // Simulate real-time order lifecycle progression
    const timer1 = setTimeout(() => setStep(2), 2500);
    const timer2 = setTimeout(() => setStep(3), 6000);
    const timer3 = setTimeout(() => setStep(4), 10000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [order]);

  if (!order) return null;

  const steps = [
    { id: 1, title: 'Order Confirmed', desc: 'Store received your order', icon: CheckCircle },
    { id: 2, title: 'Packing Items', desc: 'Fresh items being packed carefully', icon: Package },
    { id: 3, title: 'Rider Out for Delivery', desc: 'Rider is on the way (12-18 min)', icon: Bike },
    { id: 4, title: 'Delivered', desc: 'Package arrived at your doorstep', icon: Home },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(10, 135, 84, 0.2)', padding: '8px', borderRadius: '50%', color: '#34D399' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Order Live Tracking</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Order #{order.orderNumber}
              </p>
            </div>
          </div>
          <button id="close-success-modal-btn" className="cart-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Status card */}
        <div
          style={{
            margin: '20px 0',
            background: 'linear-gradient(135deg, rgba(255, 94, 54, 0.1), rgba(10, 135, 84, 0.08))',
            border: '1px solid var(--border-highlight)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡ 🛵</div>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
            Arriving in 15-20 Mins!
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Delivering to: <strong style={{ color: 'var(--text-main)' }}>{order.deliveryAddress}</strong>
          </p>
        </div>

        {/* Live Timeline */}
        <div className="order-tracker-timeline">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCompleted = step > st.id;
            const isCurrent = step === st.id;

            return (
              <div
                key={st.id}
                className={`tracker-step ${isCompleted ? 'completed' : isCurrent ? 'active' : ''}`}
              >
                <div className="tracker-icon-circle">
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--color-primary)' : 'var(--text-main)' }}>
                    {st.title} {isCurrent && '●'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {st.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Items Summary */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Items ordered:</span>
            <span style={{ fontWeight: 700 }}>{order.items.length} items</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment:</span>
            <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>
              {order.paymentMethod.replace(/_/g, ' ')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontWeight: 700 }}>Total Paid / Due:</span>
            <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>₹{order.total}</span>
          </div>
        </div>

        <button
          id="continue-shopping-btn"
          className="checkout-btn"
          style={{ width: '100%', marginTop: '20px' }}
          onClick={onClose}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
