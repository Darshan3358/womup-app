import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Bike,
  Printer,
  ChevronRight,
  RefreshCw,
  MapPin,
  Navigation,
  Calendar,
  Warehouse,
  AlertTriangle,
  X,
  CreditCard,
  User,
  Package,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Order } from '../types/admin';

export const OrdersPage: React.FC = () => {
  const {
    orders,
    cities,
    areas,
    stores,
    updateOrderStatus,
    refreshData,
    isSyncing,
  } = useAdmin();

  // Top Tabs: Live Orders vs Order History (100% App Parity)
  const [topTab, setTopTab] = useState<'Live Orders' | 'Order History'>('Live Orders');

  // Filters
  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'This Week'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Customer requested cancellation');
  const [cancellingOrder, setCancellingOrder] = useState<boolean>(false);

  // Cascading area options
  const availableAreas = areas.filter((a) => {
    if (selectedCityId === 'ALL') return true;
    const city = cities.find((c) => c.id === selectedCityId || c._id === selectedCityId || c.name === selectedCityId);
    if (!city) return true;
    return a.cityName?.toLowerCase() === city.name.toLowerCase() || a.cityId === city.id;
  });

  // Resolve hierarchy helper
  const resolveOrderHierarchy = (order: Order) => {
    let matchedArea = areas.find((a) => {
      if (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(a.name.toLowerCase())) return true;
      return false;
    });
    const areaName = matchedArea ? matchedArea.name : 'Prahlad Nagar';
    const cityName = matchedArea?.cityName || 'Ahmedabad';
    const storeName = order.storeName || 'Ahmedabad Central Dark Store';
    return { cityName, areaName, storeName };
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const isCompleted = o.status === 'DELIVERED' || o.status === 'CANCELLED';
    if (topTab === 'Live Orders' && isCompleted) return false;
    if (topTab === 'Order History' && !isCompleted) return false;

    // Status filter
    if (statusFilter !== 'ALL' && o.status !== statusFilter) {
      return false;
    }

    // Store filter
    if (selectedStoreId !== 'ALL' && o.storeId && o.storeId !== selectedStoreId) {
      return false;
    }

    const hier = resolveOrderHierarchy(o);
    // City filter
    if (selectedCityId !== 'ALL') {
      const city = cities.find((c) => c.id === selectedCityId || c._id === selectedCityId || c.name === selectedCityId);
      if (city && hier.cityName.toLowerCase() !== city.name.toLowerCase()) return false;
    }

    // Area filter
    if (selectedAreaId !== 'ALL') {
      const area = areas.find((a) => a.id === selectedAreaId || a._id === selectedAreaId || a.name === selectedAreaId);
      if (area && hier.areaName.toLowerCase() !== area.name.toLowerCase()) return false;
    }

    // Date filter
    if (dateFilter === 'Today') {
      const oDate = new Date(o.createdAt || Date.now());
      const now = new Date();
      if (oDate.toDateString() !== now.toDateString()) return false;
    } else if (dateFilter === 'This Week') {
      const oTime = new Date(o.createdAt || Date.now()).getTime();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (oTime < oneWeekAgo) return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = o.orderNumber && o.orderNumber.toLowerCase().includes(q);
      const matchCustomer = o.customerName && o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone && o.customerPhone.includes(q);
      if (!matchNumber && !matchCustomer && !matchPhone) return false;
    }

    return true;
  });

  const liveOrdersCount = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const historyOrdersCount = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED').length;

  const handleQuickStatusChange = async (orderNumber: string, nextStatus: string) => {
    await updateOrderStatus(orderNumber, nextStatus);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancellingOrder(true);
    await updateOrderStatus(orderToCancel.orderNumber, 'CANCELLED');
    setCancellingOrder(false);
    setOrderToCancel(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="badge badge-emerald">DELIVERED</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="badge badge-blue">OUT FOR DELIVERY</span>;
      case 'PACKING':
        return <span className="badge badge-amber">PACKING</span>;
      case 'CANCELLED':
        return <span className="badge badge-red">CANCELLED</span>;
      default:
        return <span className="badge badge-pink">PLACED</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
            Orders Pipeline
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Live dark store fulfillment pipeline, rider dispatching, and order audit history
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          className="btn btn-secondary btn-sm"
          title="Refresh orders"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top Segmented Navigation: Live Orders vs Order History */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          background: '#F1F5F9',
          padding: '4px',
          borderRadius: '12px',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => {
            setTopTab('Live Orders');
            setStatusFilter('ALL');
          }}
          style={{
            padding: '8px 20px',
            borderRadius: '9px',
            border: 'none',
            background: topTab === 'Live Orders' ? '#071B52' : 'transparent',
            color: topTab === 'Live Orders' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ⚡ Live Orders ({liveOrdersCount})
        </button>

        <button
          onClick={() => {
            setTopTab('Order History');
            setStatusFilter('ALL');
          }}
          style={{
            padding: '8px 20px',
            borderRadius: '9px',
            border: 'none',
            background: topTab === 'Order History' ? '#071B52' : 'transparent',
            color: topTab === 'Order History' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          📦 Order History ({historyOrdersCount})
        </button>
      </div>

      {/* Cascading Filter Bar */}
      <div
        className="admin-card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search
              size={15}
              color="#94A3B8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search order #, customer name, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
            />
          </div>

          {/* City Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#4F46E5" />
            <select
              value={selectedCityId}
              onChange={(e) => {
                setSelectedCityId(e.target.value);
                setSelectedAreaId('ALL');
              }}
              className="form-select"
              style={{ width: '150px', fontSize: '0.82rem' }}
            >
              <option value="ALL">City: All ({cities.length})</option>
              {cities.map((c) => (
                <option key={c.id || c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Navigation size={14} color="#0D9488" />
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="form-select"
              style={{ width: '160px', fontSize: '0.82rem' }}
            >
              <option value="ALL">Area: All ({availableAreas.length})</option>
              {availableAreas.map((a) => (
                <option key={a.id || a._id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dark Store Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Warehouse size={14} color="#FF3B98" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="form-select"
              style={{ width: '180px', fontSize: '0.82rem' }}
            >
              <option value="ALL">Store: All Hubs ({stores.length})</option>
              {stores.map((s) => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="#64748B" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="form-select"
              style={{ width: '130px', fontSize: '0.82rem' }}
            >
              <option value="All">Date: All</option>
              <option value="Today">Date: Today</option>
              <option value="This Week">Date: This Week</option>
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingTop: '4px' }}>
          {(topTab === 'Live Orders'
            ? (['ALL', 'PLACED', 'PACKING', 'OUT_FOR_DELIVERY'] as const)
            : (['ALL', 'DELIVERED', 'CANCELLED'] as const)
          ).map((st) => {
            const isSelected = statusFilter === st;
            const count =
              st === 'ALL'
                ? filteredOrders.length
                : orders.filter((o) => o.status === st).length;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: isSelected ? '1px solid #071B52' : '1px solid #E2E8F0',
                  background: isSelected ? '#071B52' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{st.replace(/_/g, ' ')}</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#071B52',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID & Details</th>
              <th>Customer</th>
              <th>Assigned Hub</th>
              <th>Items & Value</th>
              <th>Payment</th>
              <th>Live Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                  No orders match current filter parameters.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const hier = resolveOrderHierarchy(o);
                return (
                  <tr key={o.id || o._id}>
                    <td>
                      <div>
                        <strong
                          style={{
                            color: '#071B52',
                            fontSize: '0.88rem',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {o.orderNumber}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8' }}>
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong style={{ fontSize: '0.84rem', color: '#071B52', display: 'block' }}>
                          {o.customerName || 'Customer'}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                          {o.customerPhone || '9879432010'}
                        </span>
                        <div style={{ fontSize: '0.70rem', color: '#94A3B8', marginTop: '2px' }} title={o.deliveryAddress}>
                          📍 {o.deliveryAddress?.slice(0, 32)}...
                        </div>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.80rem', color: '#475569' }}>
                      <strong style={{ display: 'block', color: '#071B52' }}>{hier.storeName}</strong>
                      <span style={{ fontSize: '0.70rem', color: '#94A3B8' }}>
                        {hier.areaName} • {hier.cityName}
                      </span>
                    </td>

                    <td>
                      <div>
                        <strong style={{ fontSize: '0.90rem', color: '#071B52' }}>
                          ₹{(o.totalAmount || 0).toLocaleString()}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B' }}>
                          {o.items?.length || 1} items ({o.items?.map((it) => it.name).slice(0, 2).join(', ')})
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          o.paymentStatus === 'PAID' ? 'badge-emerald' : 'badge-amber'
                        }`}
                      >
                        {o.paymentMethod || 'ONLINE'} • {o.paymentStatus || 'PAID'}
                      </span>
                    </td>

                    <td>{getStatusBadge(o.status)}</td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setInspectedOrder(o)}
                          className="btn btn-secondary btn-sm"
                          title="Inspect Order Details"
                        >
                          <span>Inspect</span>
                        </button>

                        {/* Fast Workflow Buttons */}
                        {o.status === 'PLACED' && (
                          <button
                            onClick={() => handleQuickStatusChange(o.orderNumber, 'PACKING')}
                            className="btn btn-sm"
                            style={{ background: '#F59E0B', color: '#fff', border: 'none' }}
                            title="Mark as Packing"
                          >
                            Pack
                          </button>
                        )}
                        {o.status === 'PACKING' && (
                          <button
                            onClick={() => handleQuickStatusChange(o.orderNumber, 'OUT_FOR_DELIVERY')}
                            className="btn btn-sm"
                            style={{ background: '#3B82F6', color: '#fff', border: 'none' }}
                            title="Dispatch Rider"
                          >
                            Dispatch
                          </button>
                        )}
                        {o.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleQuickStatusChange(o.orderNumber, 'DELIVERED')}
                            className="btn btn-sm"
                            style={{ background: '#10B981', color: '#fff', border: 'none' }}
                            title="Confirm Delivered"
                          >
                            Deliver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* ORDER INSPECTOR MODAL (100% App Parity)                                  */}
      {/* ========================================================================= */}
      {inspectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="#FF3B98" />
                <h4 style={{ margin: 0, color: '#071B52' }}>
                  Order Inspector: {inspectedOrder.orderNumber}
                </h4>
              </div>
              <button
                onClick={() => setInspectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Customer & Delivery Card */}
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block' }}>CUSTOMER</span>
                    <strong style={{ fontSize: '0.86rem', color: '#071B52' }}>{inspectedOrder.customerName}</strong>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{inspectedOrder.customerPhone}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block' }}>FULFILLMENT HUB</span>
                    <strong style={{ fontSize: '0.86rem', color: '#071B52' }}>
                      {inspectedOrder.storeName || 'Ahmedabad Central Dark Store'}
                    </strong>
                    <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>⚡ 9-Min Express SLA</div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.70rem', color: '#64748B', display: 'block' }}>DELIVERY ADDRESS</span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.80rem', color: '#334155' }}>
                    📍 {inspectedOrder.deliveryAddress}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <h5 style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#071B52', textTransform: 'uppercase' }}>
                Order Items ({inspectedOrder.items?.length || 0})
              </h5>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '8px 12px' }}>Item</th>
                      <th style={{ padding: '8px 12px' }}>Qty</th>
                      <th style={{ padding: '8px 12px' }}>Price</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inspectedOrder.items || []).map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#071B52' }}>
                          {it.name}
                        </td>
                        <td style={{ padding: '8px 12px' }}>{it.quantity}x</td>
                        <td style={{ padding: '8px 12px' }}>₹{it.price}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800 }}>
                          ₹{it.price * it.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div style={{ background: '#FFF0F7', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#FF3B98', fontWeight: 700, textTransform: 'uppercase' }}>
                    Final Invoice Amount
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#071B52', fontWeight: 900 }}>
                    ₹{(inspectedOrder.totalAmount || 0).toLocaleString()}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${inspectedOrder.paymentStatus === 'PAID' ? 'badge-emerald' : 'badge-amber'}`}>
                    {inspectedOrder.paymentMethod} • {inspectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* SLA & Timeline */}
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Fulfillment Status Flow
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusBadge(inspectedOrder.status)}
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Assigned Rider: <strong>{inspectedOrder.riderName || 'Express Fleet Rider'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <div>
                {inspectedOrder.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrderToCancel(inspectedOrder);
                      setInspectedOrder(null);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                  >
                    Cancel & Refund
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedOrder(null)}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER CANCEL & REFUND MODAL (100% App Parity)                             */}
      {/* ========================================================================= */}
      {orderToCancel && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h4 style={{ margin: 0, color: '#DC2626' }}>Cancel Order & Trigger Refund</h4>
              </div>
              <button
                onClick={() => setOrderToCancel(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '14px' }}>
                Cancelling order <strong style={{ color: '#071B52' }}>{orderToCancel.orderNumber}</strong>. If payment was completed, an instant refund of{' '}
                <strong style={{ color: '#071B52' }}>₹{orderToCancel.totalAmount}</strong> will be initiated to the customer's original payment method or WormUp Wallet.
              </p>

              <div className="form-group">
                <label className="form-label">Cancellation Reason *</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="form-select"
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Item out of stock at hub">Item out of stock at hub</option>
                  <option value="Address unreachable / Incorrect">Address unreachable / Incorrect</option>
                  <option value="Rider unavailable / Delivery timeout">Rider unavailable / Delivery timeout</option>
                  <option value="Other Operational Reason">Other Operational Reason</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="btn btn-secondary"
                disabled={cancellingOrder}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="btn btn-sm"
                style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 18px', fontWeight: 800, borderRadius: '8px' }}
                disabled={cancellingOrder}
              >
                {cancellingOrder ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
