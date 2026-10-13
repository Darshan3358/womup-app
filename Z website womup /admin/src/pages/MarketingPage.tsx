import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Calendar,
  Users,
  Send,
  Coins,
  ShieldCheck,
  ChevronRight,
  Power,
  Search,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { MarketingCampaign } from '../types/admin';

export const MarketingPage: React.FC = () => {
  const { campaigns, createCampaign, toggleCampaign, setActiveTab, refreshData } = useAdmin();

  const [activeTab, setActiveTabState] = useState<'Scheduled' | 'Completed'>('Scheduled');
  const [search, setSearch] = useState('');

  // Create Campaign Modal
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [campName, setCampName] = useState('');
  const [campAudience, setCampAudience] = useState('All Active Users');
  const [campSubject, setCampSubject] = useState('');
  const [campDiscountCode, setCampDiscountCode] = useState('WOMUP50');
  const [campDiscountPercent, setCampDiscountPercent] = useState('20');
  const [campScheduledAt, setCampScheduledAt] = useState('Today at 08:00 PM');
  const [submittingCamp, setSubmittingCamp] = useState(false);

  const filteredCampaigns = campaigns.filter((c) => {
    const isCompleted = c.status === 'COMPLETED' || c.status === 'Completed';
    if (activeTab === 'Scheduled' && isCompleted) return false;
    if (activeTab === 'Completed' && !isCompleted) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = (c.title || c.name || '').toLowerCase().includes(q);
      const matchAud = (c.targetAudience || '').toLowerCase().includes(q);
      const matchCode = (c.discountCode || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAud && !matchCode) return false;
    }

    return true;
  });

  const scheduledCount = campaigns.filter((c) => c.status !== 'COMPLETED' && c.status !== 'Completed').length;
  const completedCount = campaigns.filter((c) => c.status === 'COMPLETED' || c.status === 'Completed').length;

  const handleToggle = async (camp: MarketingCampaign) => {
    const currentStatus = camp.status === 'ACTIVE' || camp.isEnabled !== false;
    await toggleCampaign(camp.id || camp._id || '', !currentStatus);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCamp(true);
    await createCampaign({
      title: campName,
      name: campName,
      targetAudience: campAudience,
      subject: campSubject,
      discountCode: campDiscountCode,
      discountPercent: parseInt(campDiscountPercent, 10) || 0,
      scheduledAt: campScheduledAt,
      status: 'ACTIVE',
      isEnabled: true,
    });
    setSubmittingCamp(false);
    setShowBuilderModal(false);
    setCampName('');
    setCampSubject('');
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
            Marketing Campaigns & Growth
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
            Push notifications, targeted SMS/Email flash drops, and loyalty coupon triggers
          </p>
        </div>

        <button
          onClick={() => setShowBuilderModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>+ Create Campaign</span>
        </button>
      </div>

      {/* Tabs: Scheduled vs Completed */}
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
          onClick={() => setActiveTabState('Scheduled')}
          style={{
            padding: '8px 20px',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'Scheduled' ? '#071B52' : 'transparent',
            color: activeTab === 'Scheduled' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ⏰ Scheduled ({scheduledCount})
        </button>

        <button
          onClick={() => setActiveTabState('Completed')}
          style={{
            padding: '8px 20px',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'Completed' ? '#071B52' : 'transparent',
            color: activeTab === 'Completed' ? '#FFFFFF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ✅ Completed ({completedCount})
        </button>
      </div>

      {/* Search Toolbar */}
      <div
        className="admin-card"
        style={{
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Search size={15} color="#94A3B8" />
        <input
          type="text"
          placeholder="Search campaign by name, audience, or promo code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ border: 'none', background: 'transparent', padding: 0 }}
        />
      </div>

      {/* Campaigns Table / Cards */}
      <div className="admin-table-container" style={{ marginBottom: '24px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Campaign Name & Header</th>
              <th>Target Audience</th>
              <th>Promo Code & Benefit</th>
              <th>Schedule Broadcast</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Active Switch</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                  No marketing campaigns found in this view.
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((c) => {
                const isActive = c.status === 'ACTIVE' || c.isEnabled !== false;
                return (
                  <tr key={c.id || c._id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.90rem', color: '#071B52', display: 'block' }}>
                          {c.title || c.name}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#64748B', fontStyle: 'italic' }}>
                          "{c.subject || c.title || 'Special discount announcement'}"
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className="badge badge-navy"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Users size={12} />
                        <span>{c.targetAudience || 'All Users'}</span>
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: '#FF3B98',
                            fontFamily: 'var(--font-mono)',
                            background: '#FFF0F7',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                          }}
                        >
                          {c.discountCode || 'WOMUP100'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                          {c.discountPercent ? `${c.discountPercent}% OFF` : 'Free Delivery'}
                        </span>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.80rem', color: '#64748B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} color="#64748B" />
                        <span>{c.scheduledAt || 'Today at 08:00 PM'}</span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${isActive ? 'badge-emerald' : 'badge-navy'}`}>
                        {isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggle(c)}
                        className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                      >
                        {isActive ? 'Pause' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Extended Control Modules (100% Mobile App Parity) */}
      <h4 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#071B52' }}>
        Extended Growth & Audit Engines
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div
          onClick={() => setActiveTab('Customers')}
          className="admin-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
              }}
            >
              <Coins size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '0.94rem', color: '#071B52', display: 'block' }}>
                Shopping Coins Ledger
              </strong>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Rules, customer reward balances, and manual credit adjustments
              </span>
            </div>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>

        <div
          onClick={() => setActiveTab('AuditLogs')}
          className="admin-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F46E5',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '0.94rem', color: '#071B52', display: 'block' }}>
                Security & Audit Logs
              </strong>
              <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                Detailed history of admin price changes, store creation, and actions
              </span>
            </div>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CAMPAIGN BUILDER MODAL (100% App Parity)                                  */}
      {/* ========================================================================= */}
      {showBuilderModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={20} color="#FF3B98" />
                <h4 style={{ margin: 0, color: '#071B52' }}>Create Marketing Campaign</h4>
              </div>
              <button
                onClick={() => setShowBuilderModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹100 Off Monsoon Flash Sale"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Audience *</label>
                  <select
                    value={campAudience}
                    onChange={(e) => setCampAudience(e.target.value)}
                    className="form-select"
                  >
                    <option value="All Active Users">All Active Users</option>
                    <option value="New Customers (0 Orders)">New Customers (0 Orders)</option>
                    <option value="Cart Abandoners (Last 24h)">Cart Abandoners (Last 24h)</option>
                    <option value="Ahmedabad North Zones">Ahmedabad North Zones</option>
                    <option value="Frequent Shoppers (5+ Orders)">Frequent Shoppers (5+ Orders)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notification Message Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ⚡ Order your fresh groceries in 9 mins with flat ₹100 off!"
                    value={campSubject}
                    onChange={(e) => setCampSubject(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Promo Discount Code</label>
                    <input
                      type="text"
                      value={campDiscountCode}
                      onChange={(e) => setCampDiscountCode(e.target.value.toUpperCase())}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={campDiscountPercent}
                      onChange={(e) => setCampDiscountPercent(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Broadcast Schedule</label>
                  <input
                    type="text"
                    value={campScheduledAt}
                    onChange={(e) => setCampScheduledAt(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="btn btn-secondary"
                  disabled={submittingCamp}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-pink"
                  disabled={submittingCamp}
                >
                  {submittingCamp ? 'Scheduling...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
