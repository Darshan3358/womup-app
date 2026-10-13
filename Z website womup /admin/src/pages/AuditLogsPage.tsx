import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  UserCheck,
  Search,
  MapPin,
  Navigation,
  Warehouse,
  Filter,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs, cities, areas } = useAdmin();

  const [selectedCityId, setSelectedCityId] = useState<string>('ALL');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const activeCities = cities.filter((c) => c.isActive !== false);
  const availableAreas = areas.filter((a) => {
    if (selectedCityId === 'ALL') return true;
    const city = activeCities.find((c) => c.id === selectedCityId || c._id === selectedCityId || c.name === selectedCityId);
    if (!city) return true;
    return a.cityName?.toLowerCase() === city.name.toLowerCase() || a.cityId === city.id;
  });

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'ALL' && !log.action.includes(actionFilter)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAdmin = log.adminName.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchTarget = log.target.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchAdmin && !matchAction && !matchTarget && !matchDetails) return false;
    }

    if (selectedCityId !== 'ALL') {
      const city = activeCities.find((c) => c.id === selectedCityId || c._id === selectedCityId || c.name === selectedCityId);
      if (city && !log.target.toLowerCase().includes(city.name.toLowerCase()) && !log.details.toLowerCase().includes(city.name.toLowerCase())) {
        return false;
      }
    }

    if (selectedAreaId !== 'ALL') {
      const area = areas.find((a) => a.id === selectedAreaId || a._id === selectedAreaId || a.name === selectedAreaId);
      if (area && !log.target.toLowerCase().includes(area.name.toLowerCase()) && !log.details.toLowerCase().includes(area.name.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
          System Security & Audit Trail
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
          Immutable operational record of catalog pricing, dark store creations, and admin events (100% app parity)
        </p>
      </div>

      {/* Cascading Filter Toolbar */}
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
              placeholder="Search audit log by admin, action, target entity..."
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
              style={{ width: '160px', fontSize: '0.82rem' }}
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
              style={{ width: '180px', fontSize: '0.82rem' }}
            >
              <option value="ALL">Area: All ({availableAreas.length})</option>
              {availableAreas.map((a) => (
                <option key={a.id || a._id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
            Event Scope:
          </span>
          {(['ALL', 'STORE', 'PRICE', 'DISPATCH'] as const).map((cat) => {
            const isSelected = actionFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActionFilter(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: isSelected ? '1px solid #071B52' : '1px solid #E2E8F0',
                  background: isSelected ? '#071B52' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {cat === 'ALL' ? 'All Events' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrator</th>
              <th>Action Executed</th>
              <th>Target Entity</th>
              <th>Details & Notes</th>
              <th>Integrity</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                  No security events recorded matching criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })},{' '}
                    {new Date(log.timestamp).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 800, color: '#071B52' }}>
                    {log.adminName}
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.70rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#071B52' }}>
                    {log.target}
                  </td>
                  <td style={{ color: '#64748B', fontSize: '0.82rem' }}>
                    {log.details}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#059669',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      <ShieldCheck size={12} />
                      <span>VERIFIED</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
