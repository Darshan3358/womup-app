import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Clock,
  MapPin,
  Bike,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Ban,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

const CANCELLATION_REASONS = [
  'Customer Request',
  'Out of Stock',
  'Operational Issue',
  'Payment Issue',
  'Address Problem',
  'Other',
];

export const OrderDetailsModal: React.FC = () => {
  const { selectedOrderForModal, setSelectedOrderForModal, updateOrderStatus, cancelOrder } = useAdmin();
  const [updating, setUpdating] = useState(false);

  // Cancellation Submodal State (100% App Parity with OrderCancelRefundModal)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [cancelNotes, setCancelNotes] = useState('');
  const [issueRefund, setIssueRefund] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  if (!selectedOrderForModal) return null;

  const o = selectedOrderForModal;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      setShowCancelModal(true);
      return;
    }
    setUpdating(true);
    await updateOrderStatus(o.orderNumber, newStatus);
    setUpdating(false);
    setSelectedOrderForModal({ ...o, status: newStatus as any });
  };

  const handleConfirmCancellation = async () => {
    setCancelling(true);
    const finalReason = cancelNotes.trim() ? `${cancelReason} - ${cancelNotes.trim()}` : cancelReason;
    const refundAmount = issueRefund ? o.totalAmount : undefined;

    await cancelOrder(o.orderNumber || o.id, {
      reason: finalReason,
      refundAmount,
    });

    setCancelling(false);
    setShowCancelModal(false);
    setSelectedOrderForModal({
      ...o,
      status: 'CANCELLED' as any,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FFF0F7',
                color: '#FF3B98',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#071B52', margin: 0, fontWeight: 800 }}>
                Order #{o.orderNumber}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                Placed on {new Date(o.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              title="Print Order Receipt"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              onClick={() => {
                setShowCancelModal(false);
                setSelectedOrderForModal(null);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Status Quick Changer Bar */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>CURRENT STATUS:</span>
              <div style={{ marginTop: '2px' }}>
                <span
                  className={`badge ${
                    o.status === 'DELIVERED'
                      ? 'badge-emerald'
                      : o.status === 'OUT_FOR_DELIVERY'
                      ? 'badge-blue'
                      : o.status === 'PACKING'
                      ? 'badge-amber'
                      : o.status === 'CANCELLED'
                      ? 'badge-red'
                      : 'badge-pink'
                  }`}
                >
                  {o.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#071B52', fontWeight: 700 }}>Update:</span>
              <select
                disabled={updating || o.status === 'CANCELLED'}
                value={o.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.80rem',
                  color: '#071B52',
                  cursor: 'pointer',
                }}
              >
                <option value="PLACED">PLACED</option>
                <option value="PACKING">PACKING</option>
                <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Cancellation Banner if Cancelled */}
          {o.status === 'CANCELLED' && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px',
                color: '#B91C1C',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Ban size={16} />
              <span>This order has been cancelled and auto-refunded to customer.</span>
            </div>
          )}

          {/* Customer & Address Details */}
          <div className="form-grid-2" style={{ marginBottom: '20px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
              <h5 style={{ fontSize: '0.82rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                Customer Information
              </h5>
              <p style={{ fontWeight: 800, color: '#071B52', margin: '0 0 2px' }}>{o.customerName || 'Customer'}</p>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 2px' }}>{o.customerPhone || 'N/A'}</p>
              <p style={{ fontSize: '0.80rem', color: '#94A3B8', margin: 0 }}>{o.customerEmail || 'No email'}</p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
              <h5 style={{ fontSize: '0.82rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                Delivery Address & Store
              </h5>
              <p style={{ fontSize: '0.84rem', color: '#071B52', margin: '0 0 6px', display: 'flex', gap: '6px' }}>
                <MapPin size={15} color="#FF3B98" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{o.deliveryAddress || 'Ahmedabad Hub Zone'}</span>
              </p>
              <p style={{ fontSize: '0.80rem', color: '#64748B', margin: 0 }}>
                Store: <strong>{o.storeName || 'Chandlodiya Dark Store'}</strong>
              </p>
            </div>
          </div>

          {/* Ordered Items Table */}
          <h5 style={{ fontSize: '0.82rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
            Order Items ({o.items?.length || 0})
          </h5>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748B' }}>Item</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', color: '#64748B' }}>Qty</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B' }}>Price</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {o.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', color: '#071B52', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748B' }}>
                      ₹{item.price}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#071B52' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFC' }}>
                  <td colSpan={3} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#071B52' }}>
                    Total Bill Amount:
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#FF3B98', fontSize: '1.05rem' }}>
                    ₹{o.totalAmount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {o.status !== 'CANCELLED' ? (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: '#DC2626', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Ban size={14} />
              <span>Cancel & Refund Order</span>
            </button>
          ) : (
            <span style={{ fontSize: '0.80rem', color: '#DC2626', fontWeight: 700 }}>
              Cancelled
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setShowCancelModal(false);
              setSelectedOrderForModal(null);
            }}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CANCEL & REFUND SUB-MODAL (100% App Parity with OrderCancelRefundModal)     */}
      {/* ========================================================================= */}
      {showCancelModal && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 10000,
            background: 'rgba(7, 27, 82, 0.75)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={20} color="#DC2626" />
                <h4 style={{ margin: 0, color: '#071B52' }}>Cancel Order #{o.orderNumber}</h4>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#FEF2F2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#991B1B' }}>Order Bill Amount:</span>
                <strong style={{ fontSize: '1rem', color: '#DC2626' }}>₹{o.totalAmount}</strong>
              </div>

              {/* Cancellation Reasons */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Select Cancellation Reason *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {CANCELLATION_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCancelReason(r)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: cancelReason === r ? '2px solid #FF3B98' : '1px solid #CBD5E1',
                        background: cancelReason === r ? '#FFF0F7' : '#FFFFFF',
                        color: cancelReason === r ? '#E11D48' : '#64748B',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operational Notes */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Additional Operational Notes</label>
                <textarea
                  rows={2}
                  placeholder="Provide detailed explanation for audit log..."
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Issue Refund Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={issueRefund}
                  onChange={(e) => setIssueRefund(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#10B981' }}
                />
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#071B52', display: 'block' }}>
                    Issue Automatic Refund (₹{o.totalAmount})
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Refund will be credited to customer's original payment method or wallet
                  </span>
                </div>
              </label>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="btn btn-secondary"
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="btn btn-pink"
                disabled={cancelling}
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
