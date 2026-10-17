import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Bike,
  Store,
  DollarSign,
  UserCheck,
  Package,
  Sliders,
  ChevronRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { NEST_API_BASE_URL } from '../services/api';

export interface ApprovalSummary {
  customerKyc: number;
  riders: number;
  stores: number;
  vendors: number;
  staff: number;
  orders: number;
  withdrawals: number;
  rateChanges: number;
  totalPending: number;
}

export const PendingApprovalsWidget: React.FC = () => {
  const { setActiveTab } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ApprovalSummary>({
    customerKyc: 45,
    riders: 8,
    stores: 3,
    vendors: 12,
    staff: 5,
    orders: 6,
    withdrawals: 15,
    rateChanges: 2,
    totalPending: 96,
  });

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${NEST_API_BASE_URL}/admin/approvals/summary`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          setSummary(json.data);
        }
      }
    } catch (e) {
      // Keep optimistic/initial data
    }
  };

  const approvalCards = [
    {
      id: 'customerKyc',
      title: 'Customer KYC',
      count: summary.customerKyc,
      icon: Users,
      color: '#1D4ED8',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      tab: 'Customers',
      desc: 'Pending Aadhaar Front/Back Verification',
    },
    {
      id: 'riders',
      title: 'Rider Registration',
      count: summary.riders,
      icon: Bike,
      color: '#0D9488',
      bg: '#F0FDFA',
      border: '#99F6E4',
      tab: 'Staff',
      desc: 'Vehicle & Driving License Verification',
    },
    {
      id: 'stores',
      title: 'Dark Stores',
      count: summary.stores,
      icon: Store,
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      tab: 'Stores',
      desc: 'Store Activation & Dispatch Service Area',
    },
    {
      id: 'vendors',
      title: 'Local Vendors',
      count: summary.vendors,
      icon: Store,
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      tab: 'Vendors',
      desc: 'Vendor Shop KYC & Commission Setup',
    },
    {
      id: 'withdrawals',
      title: 'Wallet Withdrawal',
      count: summary.withdrawals,
      icon: DollarSign,
      color: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      tab: 'Wallets',
      desc: 'IMPS/NEFT Rider & Vendor Settlements',
    },
    {
      id: 'orders',
      title: 'Order Cancellations',
      count: summary.orders,
      icon: Package,
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      tab: 'Orders',
      desc: 'Cancel & Refund Requests Awaiting Review',
    },
    {
      id: 'staff',
      title: 'Staff (Pickers)',
      count: summary.staff,
      icon: UserCheck,
      color: '#475569',
      bg: '#F8FAFC',
      border: '#E2E8F0',
      tab: 'Staff',
      desc: 'Store Picker Shift & Duty Allocation',
    },
    {
      id: 'rateChanges',
      title: 'Payout Rate Changes',
      count: summary.rateChanges,
      icon: Sliders,
      color: '#FF3B98',
      bg: '#FFF0F7',
      border: '#FBCFE8',
      tab: 'PayoutRates',
      desc: 'Interactive Rate Overrides & Audit Log',
    },
  ];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '22px 24px',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#071B52' }}>
                Pending Approvals & Verification Queue
              </h3>
              <span
                style={{
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  border: '1px solid #FECACA',
                }}
              >
                {summary.totalPending} Awaiting Action
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
              8 approval types requiring admin sign-off across customers, fleet, stores, and finances
            </p>
          </div>
        </div>

        <button
          onClick={fetchSummary}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem' }}
        >
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 8-CARD GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
        }}
      >
        {approvalCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => setActiveTab(card.tab as any)}
              style={{
                backgroundColor: card.bg,
                border: `1px solid ${card.border}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(7, 27, 82, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Icon size={18} color={card.color} />
                  </div>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      color: card.color,
                      fontFamily: 'monospace',
                    }}
                  >
                    {card.count}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 4px', fontSize: '0.90rem', fontWeight: 800, color: '#071B52' }}>
                  {card.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748B', lineHeight: 1.3 }}>
                  {card.desc}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: `1px solid ${card.border}`,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: card.color,
                }}
              >
                <span>Review Queue</span>
                <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
