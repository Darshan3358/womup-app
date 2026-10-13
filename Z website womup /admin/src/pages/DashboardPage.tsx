import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Store,
  Bike,
  Package,
  Users,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const DashboardPage: React.FC = () => {
  const { orders, stores, products, customers, riders, setActiveTab, setSelectedOrderForModal } = useAdmin();

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeOrders = orders.filter((o) => o.status === 'PLACED' || o.status === 'PACKING' || o.status === 'OUT_FOR_DELIVERY');
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const activeStores = stores.filter((s) => s.isActive !== false);
  const storesOnShift = stores.filter((s) => s.isOnShift === true);
  const lowStockItems = products.filter((p) => (p.stock || 0) < 15);

  return (
    <div>
      {/* Top Welcome Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
            Live Operations & Analytics
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Real-time fleet pulse, store throughput, and catalog health across Ahmedabad
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}
          >
            <Activity size={14} />
            <span>9-Min Delivery SLA: 98.4% On-Time</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Card 1: Gross Sales */}
        <div className="kpi-card">
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>
              Gross Merchandise Value
            </p>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
              ₹{totalRevenue.toLocaleString()}
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 700, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <TrendingUp size={13} />
              <span>+18.4% vs last week</span>
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="kpi-card" onClick={() => setActiveTab('Orders')} style={{ cursor: 'pointer' }}>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>
              Active Live Orders
            </p>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#FF3B98', margin: 0 }}>
              {activeOrders.length}
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, margin: '6px 0 0' }}>
              {deliveredOrders} delivered today
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#FFF0F7', color: '#FF3B98' }}>
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Card 3: Stores on Shift */}
        <div className="kpi-card" onClick={() => setActiveTab('Stores')} style={{ cursor: 'pointer' }}>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>
              Dark Stores / Shops
            </p>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
              {storesOnShift.length} <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>/ {activeStores.length}</span>
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 700, margin: '6px 0 0' }}>
              {storesOnShift.length} currently On Shift
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
            <Store size={24} />
          </div>
        </div>

        {/* Card 4: Active Fleet */}
        <div className="kpi-card" onClick={() => setActiveTab('Staff')} style={{ cursor: 'pointer' }}>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' }}>
              Delivery Fleet
            </p>
            <h3 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
              {riders.length} <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>riders</span>
            </h3>
            <p style={{ fontSize: '0.74rem', color: '#3B82F6', fontWeight: 700, margin: '6px 0 0' }}>
              4.92 avg fleet rating
            </p>
          </div>
          <div className="kpi-icon-box" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
            <Bike size={24} />
          </div>
        </div>
      </div>

      {/* Two Column Grid: Live Orders & Store Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left Column: Recent Orders */}
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.05rem', color: '#071B52', margin: 0 }}>Recent Orders Radar</h4>
              <p style={{ fontSize: '0.76rem', color: '#64748B', margin: 0 }}>Real-time customer order pipeline</p>
            </div>
            <button
              onClick={() => setActiveTab('Orders')}
              className="btn btn-secondary btn-sm"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id || order._id}>
                  <td style={{ fontWeight: 800, color: '#071B52', fontFamily: 'var(--font-mono)' }}>
                    {order.orderNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#071B52' }}>{order.customerName}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{order.customerPhone}</div>
                  </td>
                  <td>{order.items?.length || 0} items</td>
                  <td style={{ fontWeight: 800, color: '#071B52' }}>₹{order.totalAmount}</td>
                  <td>
                    <span
                      className={`badge ${
                        order.status === 'DELIVERED'
                          ? 'badge-emerald'
                          : order.status === 'OUT_FOR_DELIVERY'
                          ? 'badge-blue'
                          : order.status === 'PACKING'
                          ? 'badge-amber'
                          : 'badge-pink'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedOrderForModal(order)}
                      className="btn btn-secondary btn-sm"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No recent orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: Store Operations Status */}
        <div className="admin-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.05rem', color: '#071B52', margin: 0 }}>Stores & Hubs Pulse</h4>
              <p style={{ fontSize: '0.76rem', color: '#64748B', margin: 0 }}>Operational shifts & staffing</p>
            </div>
            <button
              onClick={() => setActiveTab('Stores')}
              className="btn btn-secondary btn-sm"
            >
              <span>Manage</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stores.slice(0, 4).map((s) => (
              <div
                key={s.id || s._id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      {s.name}
                    </h5>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: s.isOnShift ? '#10B981' : '#CBD5E1',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '2px 0 0' }}>
                    {s.cityName || 'Ahmedabad'} • {s.staffOnShift || 2} staff on shift
                  </p>
                </div>

                <div>
                  <span
                    className={`badge ${s.isOnShift ? 'badge-emerald' : 'badge-navy'}`}
                  >
                    {s.isOnShift ? 'ON SHIFT' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Alert if Low Stock */}
          {lowStockItems.length > 0 && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <ShieldAlert size={18} color="#D97706" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E', margin: 0 }}>
                  Low Inventory Warning
                </p>
                <p style={{ fontSize: '0.72rem', color: '#B45309', margin: 0 }}>
                  {lowStockItems.length} products have fallen below threshold stock.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('Inventory')}
                className="btn btn-sm"
                style={{ backgroundColor: '#F59E0B', color: '#FFFFFF', padding: '4px 10px', fontSize: '0.72rem' }}
              >
                Restock
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
