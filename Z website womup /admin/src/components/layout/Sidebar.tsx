import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Bike,
  Package,
  FolderTree,
  MapPin,
  Coins,
  Receipt,
  Wallet,
  Users,
  Megaphone,
  ShieldCheck,
  ChevronRight,
  Database,
  Radio,
  QrCode,
} from 'lucide-react';
import { useAdmin, AdminTab } from '../../context/AdminContext';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, orders, stores, products, customers, isConnected, isSyncing } = useAdmin();

  const pendingOrdersCount = orders.filter((o) => o.status === 'PLACED' || o.status === 'PACKING').length;
  const activeStoresCount = stores.filter((s) => s.isActive !== false).length;

  const NAV_GROUPS: NavGroup[] = [
    {
      groupTitle: 'OPERATIONS',
      items: [
        { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'ApprovalHub',
          label: 'Approval Hub',
          icon: ShieldCheck,
          badgeColor: '#EF4444',
        },
        {
          id: 'Orders',
          label: 'Live Orders',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: '#FF3B98',
        },
        {
          id: 'Stores',
          label: 'Dark Stores & Hubs',
          icon: Store,
          badge: activeStoresCount,
          badgeColor: '#10B981',
        },
        {
          id: 'Vendors',
          label: 'Local Store Vendors',
          icon: QrCode,
          badge: 'Active',
          badgeColor: '#F59E0B',
        },
        {
          id: 'Staff',
          label: 'Customers & Riders',
          icon: Users,
          badge: customers.length > 0 ? customers.length : undefined,
          badgeColor: '#4F46E5',
        },
      ],
    },
    {
      groupTitle: 'CATALOG & LOGISTICS',
      items: [
        {
          id: 'Inventory',
          label: 'Products & Stock',
          icon: Package,
          badge: products.length > 0 ? products.length : undefined,
        },
        { id: 'Categories', label: 'Categories', icon: FolderTree },
        { id: 'Locations', label: 'Delivery Zones & Areas', icon: MapPin },
        { id: 'Prices', label: 'Area Pricing & Surge', icon: Coins },
        { id: 'PayoutRates', label: 'Rider Payout Rates', icon: Receipt },
      ],
    },
    {
      groupTitle: 'FINANCE & USERS',
      items: [
        { id: 'Wallets', label: 'Wallets & Revenue', icon: Wallet },
        { id: 'Customers', label: 'Customers & Loyalty', icon: Users },
        { id: 'Marketing', label: 'Campaigns & Coupons', icon: Megaphone },
        { id: 'AuditLogs', label: 'System Audit Logs', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: '264px',
        height: '100vh',
        backgroundColor: '#071B52',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF3B98 0%, #7856F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255, 59, 152, 0.4)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '1.25rem',
            }}
          >
            W
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
                WormUp
              </h2>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  background: 'rgba(255, 59, 152, 0.2)',
                  color: '#FF70B8',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 59, 152, 0.3)',
                }}
              >
                ADMIN
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
              Fleet, Stores & Catalog Hub
            </p>
          </div>
        </div>

        {/* Live Database Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '7px 12px',
            marginTop: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10B981' : '#EF4444',
                boxShadow: isConnected ? '0 0 8px #10B981' : 'none',
              }}
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#E2E8F0' }}>
              {isConnected ? 'MongoDB Atlas Live' : 'Reconnecting...'}
            </span>
          </div>

          <span
            style={{
              fontSize: '0.66rem',
              color: isSyncing ? '#FF70B8' : 'rgba(255, 255, 255, 0.45)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {isSyncing ? 'Syncing...' : 'PORT 5001'}
          </span>
        </div>
      </div>

      {/* Nav List with Scrollbar */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: '22px' }}>
            <p
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.4)',
                letterSpacing: '0.08em',
                padding: '0 12px',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              {group.groupTitle}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(255, 59, 152, 0.22) 0%, rgba(120, 86, 246, 0.22) 100%)'
                        : 'transparent',
                      color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.72)',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.86rem',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                      borderLeft: isActive ? '3px solid #FF3B98' : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                      <IconComponent
                        size={17}
                        color={isActive ? '#FF3B98' : 'rgba(255, 255, 255, 0.65)'}
                        strokeWidth={isActive ? 2.4 : 1.9}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        style={{
                          fontSize: '0.70rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: item.badgeColor || 'rgba(255, 255, 255, 0.12)',
                          color: '#FFFFFF',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile Footer */}
      <div
        style={{
          padding: '16px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(4, 16, 51, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.9rem',
          }}
        >
          AD
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '0.84rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Darshan Thanki
          </p>
          <p style={{ fontSize: '0.70rem', color: '#10B981', margin: 0, fontWeight: 700 }}>
            Super Administrator
          </p>
        </div>
      </div>
    </aside>
  );
};
