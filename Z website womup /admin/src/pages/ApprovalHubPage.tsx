import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Users,
  Bike,
  Store,
  QrCode,
  CreditCard,
  PackageX,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  DollarSign,
  Building2,
} from 'lucide-react';
import { AdminApiService } from '../services/api';

export type ApprovalCategoryKey =
  | 'customer-kyc'
  | 'riders'
  | 'dark-stores'
  | 'vendors'
  | 'withdrawals'
  | 'cancellations';

interface CategoryConfig {
  key: ApprovalCategoryKey;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: 'customer-kyc',
    title: 'Customer KYC & Aadhaar',
    subtitle: 'Identity verification for 7-level MLM team income unlock',
    icon: Users,
    color: '#4F46E5',
    bgLight: '#EEF2FF',
  },
  {
    key: 'riders',
    title: 'Delivery Riders',
    subtitle: 'Driver licenses, RC books, vehicle verification',
    icon: Bike,
    color: '#0284C7',
    bgLight: '#F0F9FF',
  },
  {
    key: 'dark-stores',
    title: 'Dark Stores & Hubs',
    subtitle: 'Store location, geofence, and operations clearance',
    icon: Store,
    color: '#059669',
    bgLight: '#ECFDF5',
  },
  {
    key: 'vendors',
    title: 'Local Store Vendors',
    subtitle: 'FSSAI license, GST certificate, bank account approval',
    icon: QrCode,
    color: '#D97706',
    bgLight: '#FFFBEB',
  },
  {
    key: 'withdrawals',
    title: 'Wallet Withdrawals',
    subtitle: 'Rider & Store earnings UPI payout requests',
    icon: CreditCard,
    color: '#7C3AED',
    bgLight: '#F5F3FF',
  },
  {
    key: 'cancellations',
    title: 'Order Cancellations',
    subtitle: 'Customer dispute resolution and refund authorizations',
    icon: PackageX,
    color: '#DC2626',
    bgLight: '#FEF2F2',
  },
];

export const ApprovalHubPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ApprovalCategoryKey | null>(null);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await AdminApiService.getApprovalSummary();
      if (res?.success && res.data) {
        setSummary(res.data);
      }
    } catch (e) {
      console.error('Error fetching approval summary:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const loadQueue = async (cat: ApprovalCategoryKey) => {
    setActiveCategory(cat);
    setLoadingQueue(true);
    setActionMessage(null);
    try {
      const res = await AdminApiService.getApprovalQueue(cat);
      if (res?.success && Array.isArray(res.items)) {
        setQueueItems(res.items);
      } else {
        setQueueItems([]);
      }
    } catch (err) {
      console.error('Failed fetching queue items:', err);
      setQueueItems([]);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleApprove = async (id: string, customPayload: any = {}) => {
    if (!activeCategory) return;
    setActionLoadingId(id);
    try {
      const res = await AdminApiService.approveApprovalItem(activeCategory, id, customPayload);
      if (res?.success) {
        setActionMessage({ text: 'Item approved successfully!', type: 'success' });
        setQueueItems((prev) => prev.filter((item) => (item.id || item._id) !== id));
        fetchSummary();
      } else {
        setActionMessage({ text: res?.message || res?.error || 'Approval failed', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Approval error', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string, reason: string = 'Verification documents invalid') => {
    if (!activeCategory) return;
    setActionLoadingId(id);
    try {
      const res = await AdminApiService.rejectApprovalItem(activeCategory, id, { reason });
      if (res?.success) {
        setActionMessage({ text: 'Item rejected.', type: 'success' });
        setQueueItems((prev) => prev.filter((item) => (item.id || item._id) !== id));
        fetchSummary();
      } else {
        setActionMessage({ text: res?.message || res?.error || 'Rejection failed', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Rejection error', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getCategoryCount = (key: ApprovalCategoryKey): number => {
    if (!summary) return 0;
    switch (key) {
      case 'customer-kyc':
        return summary.customerKyc ?? 0;
      case 'riders':
        return summary.riders ?? 0;
      case 'dark-stores':
        return summary.stores ?? 0;
      case 'vendors':
        return summary.vendors ?? 0;
      case 'withdrawals':
        return summary.withdrawals ?? 0;
      case 'cancellations':
        return summary.orders ?? 0;
      default:
        return 0;
    }
  };

  const totalPending = summary?.totalPending ?? CATEGORY_CONFIGS.reduce((sum, c) => sum + getCategoryCount(c.key), 0);

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #071B52, #1E3A8A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color="#38BDF8" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                Operations Approval Hub
              </h1>
              <p style={{ fontSize: '0.86rem', color: '#64748B', margin: '2px 0 0' }}>
                Centralized clearance portal for KYC, payouts, dark stores, and cancellations
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', padding: '8px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>Total Pending:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: '12px' }}>
              {totalPending}
            </span>
          </div>

          <button
            onClick={() => {
              fetchSummary();
              if (activeCategory) loadQueue(activeCategory);
            }}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#071B52',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '20px',
            borderRadius: '10px',
            backgroundColor: actionMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${actionMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: actionMessage.type === 'success' ? '#065F46' : '#991B1B',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ── If Viewing Category Queue Detail ── */}
      {activeCategory ? (
        <div>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to All Categories</span>
          </button>

          {(() => {
            const currentCfg = CATEGORY_CONFIGS.find((c) => c.key === activeCategory)!;
            const Icon = currentCfg.icon;

            return (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '18px', marginBottom: '20px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: currentCfg.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color={currentCfg.color} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      {currentCfg.title} Queue
                    </h2>
                    <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '2px 0 0' }}>
                      {currentCfg.subtitle}
                    </p>
                  </div>
                </div>

                {loadingQueue ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748B' }}>
                    <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading pending items...</p>
                  </div>
                ) : queueItems.length === 0 ? (
                  <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <CheckCircle2 size={44} color="#10B981" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      No Pending Items
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '6px' }}>
                      All requests in this category have been processed and cleared!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                    {queueItems.map((item) => {
                      const itemId = item.id || item._id;
                      const isAction = actionLoadingId === itemId;

                      return (
                        <div
                          key={itemId}
                          style={{
                            padding: '18px',
                            borderRadius: '12px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <div>
                                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  {item.name || item.fullName || item.storeName || item.vendorName || `ID: #${itemId.slice(-6)}`}
                                </h4>
                                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                                  {item.phone || item.mobileNumber || item.email || item.orderNumber || ''}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#FEF3C7', color: '#B45309' }}>
                                PENDING
                              </span>
                            </div>

                            {/* Additional metadata tags */}
                            <div style={{ fontSize: '0.82rem', color: '#334155', background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #F1F5F9', marginBottom: '14px' }}>
                              {item.city && <div><strong>City:</strong> {item.city}</div>}
                              {item.amount !== undefined && <div><strong>Amount:</strong> ₹{item.amount}</div>}
                              {item.pincode && <div><strong>Pincode:</strong> {item.pincode}</div>}
                              {item.aadhaarNumber && <div><strong>Aadhaar:</strong> XXXX-XXXX-{item.aadhaarNumber.slice(-4)}</div>}
                              {item.reason && <div><strong>Reason:</strong> {item.reason}</div>}
                              {item.createdAt && <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '4px' }}>Requested: {new Date(item.createdAt).toLocaleDateString()}</div>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                            <button
                              onClick={() => handleReject(itemId)}
                              disabled={isAction}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #FCA5A5',
                                backgroundColor: '#FFF',
                                color: '#DC2626',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(itemId)}
                              disabled={isAction}
                              style={{
                                flex: 2,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#10B981',
                                color: '#FFF',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {isAction ? 'Processing...' : 'Approve & Clear'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        /* ── Category Cards Grid ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {CATEGORY_CONFIGS.map((cfg) => {
            const count = getCategoryCount(cfg.key);
            const Icon = cfg.icon;

            return (
              <div
                key={cfg.key}
                onClick={() => loadQueue(cfg.key)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '22px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cfg.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(7, 27, 82, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: cfg.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={26} color={cfg.color} />
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        backgroundColor: count > 0 ? '#FEE2E2' : '#F1F5F9',
                        color: count > 0 ? '#DC2626' : '#64748B',
                      }}
                    >
                      {count} Pending
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#071B52', margin: '0 0 6px' }}>
                    {cfg.title}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                    {cfg.subtitle}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: cfg.color }}>
                    Review Queue
                  </span>
                  <ChevronRight size={18} color={cfg.color} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
