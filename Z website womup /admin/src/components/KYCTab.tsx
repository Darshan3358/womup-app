import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  CreditCard,
  Building,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  X,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { Customer } from '../types/admin';
import { CustomerService } from '../services/customerService';

interface KYCTabProps {
  customer: Customer;
  onStatusChange?: (newStatus: 'Verified' | 'Pending' | 'Rejected') => void;
}

const QUICK_REJECT_REASONS = [
  'Aadhaar image not clear',
  'Name mismatch with bank account',
  'Aadhaar number illegible',
  'Back image missing or blur',
  'Suspicious document',
];

export const KYCTab: React.FC<KYCTabProps> = ({ customer, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [kycData, setKycData] = useState<any>(null);

  // Rejection handling
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Aadhaar image not clear');

  // Image zoom modal
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    loadKycDetails();
  }, [customer.id, customer._id]);

  const loadKycDetails = async () => {
    try {
      setLoading(true);
      const custId = customer.id || customer._id || '';
      const res = await CustomerService.getCustomerKyc(custId);
      if (res && res.success && res.data) {
        setKycData(res.data);
      } else {
        // Fallback to customer object props
        setKycData({
          kycStatus: customer.kycStatus === 'Verified' ? 2 : (customer.kycStatus === 'Rejected' ? 3 : 1),
          statusLabel: customer.kycStatus || 'Pending',
          submittedAt: customer.kycSubmittedAt || customer.createdAt || 'Recently',
          aadhaarNumber: customer.aadhaarNumber
            ? `XXXX XXXX ${customer.aadhaarNumber.slice(-4)}`
            : 'XXXX XXXX 1234',
          aadhaarFrontUrl: customer.customer_image_aadhar_front || customer.aadhaarFrontImage || '',
          aadhaarBackUrl: customer.customer_image_aadhar_back || customer.aadhaarBackImage || '',
          bankDetails: {
            bankName: customer.bankName || 'HDFC Bank',
            branchName: customer.branchName || 'SG Highway',
            accountHolderName: customer.accountHolderName || customer.name,
            accountNumber: customer.accountNumber
              ? `XXXX ${customer.accountNumber.slice(-4)}`
              : 'XXXX 9182',
            ifscCode: customer.ifscCode || 'HDFC0000123',
            upiId: customer.upiId || 'ayushi@okhdfcbank',
          },
          personalInfo: {
            firstName: customer.firstName || (customer.name ? customer.name.split(' ')[0] : 'Ayushi'),
            surname: customer.surname || (customer.name ? customer.name.split(' ').slice(1).join(' ') : 'Thanki'),
            fatherHusbandName: customer.fatherHusbandName || 'Mukesh Thanki',
            gender: customer.gender || 'Female',
            birthdate: customer.birthdate || customer.birthDate || '15 Aug 1995',
          },
          kycRejectReason: customer.kycRejectReason || '',
        });
      }
    } catch (err) {
      console.error('Failed to load KYC details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm(`Are you sure you want to approve KYC for ${customer.name}? This will verify the customer and credit ₹20 referral to sponsor.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const custId = customer.id || customer._id || '';
      const res = await CustomerService.approveCustomerKyc(custId);
      if (res && (res.success || res.status === 'success')) {
        alert('KYC Approved Successfully! Customer verified & sponsor credited ₹20.');
        setKycData((prev: any) => ({
          ...prev,
          kycStatus: 2,
          statusLabel: 'Verified',
        }));
        if (onStatusChange) onStatusChange('Verified');
      } else {
        alert(res?.error || res?.message || 'Failed to approve KYC');
      }
    } catch (err: any) {
      alert(`Error approving KYC: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason so the customer can fix their documents.');
      return;
    }

    try {
      setActionLoading(true);
      const custId = customer.id || customer._id || '';
      const res = await CustomerService.rejectCustomerKyc(custId, rejectionReason.trim());
      if (res && (res.success || res.status === 'success')) {
        alert(`KYC Rejected. Reason sent to customer: "${rejectionReason}"`);
        setShowRejectBox(false);
        setKycData((prev: any) => ({
          ...prev,
          kycStatus: 3,
          statusLabel: 'Rejected',
          kycRejectReason: rejectionReason,
        }));
        if (onStatusChange) onStatusChange('Rejected');
      } else {
        alert(res?.error || res?.message || 'Failed to reject KYC');
      }
    } catch (err: any) {
      alert(`Error rejecting KYC: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    if (!url) {
      alert('Image URL not available');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        <RotateCcw className="animate-spin" size={24} style={{ display: 'inline-block', marginBottom: '8px' }} />
        <p style={{ margin: 0, fontSize: '0.88rem' }}>Loading KYC verification details...</p>
      </div>
    );
  }

  const status = kycData?.statusLabel || customer.kycStatus || 'Pending';
  const isVerified = status === 'Verified' || kycData?.kycStatus === 2;
  const isRejected = status === 'Rejected' || kycData?.kycStatus === 3;
  const isPending = !isVerified && !isRejected;

  const frontUrl =
    kycData?.aadhaarFrontUrl ||
    customer.customer_image_aadhar_front ||
    customer.aadhaarFrontImage ||
    '';

  const backUrl =
    kycData?.aadhaarBackUrl ||
    customer.customer_image_aadhar_back ||
    customer.aadhaarBackImage ||
    '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. STATUS BANNER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderRadius: '12px',
          background: isVerified
            ? '#ECFDF5'
            : isRejected
            ? '#FEF2F2'
            : '#FFFBEB',
          border: `1px solid ${
            isVerified ? '#A7F3D0' : isRejected ? '#FECACA' : '#FDE68A'
          }`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isVerified ? (
            <ShieldCheck size={28} color="#059669" />
          ) : isRejected ? (
            <ShieldAlert size={28} color="#DC2626" />
          ) : (
            <Clock size={28} color="#D97706" />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: isVerified ? '#047857' : isRejected ? '#B91C1C' : '#B45309',
                }}
              >
                Verification Status:
              </span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  color: isVerified ? '#065F46' : isRejected ? '#991B1B' : '#92400E',
                }}
              >
                {isVerified ? '✅ VERIFIED' : isRejected ? '❌ REJECTED' : '⏳ PENDING REVIEW'}
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
              Submitted: {kycData?.submittedAt ? new Date(kycData.submittedAt).toLocaleString() : '2 hours ago'}
            </p>
          </div>
        </div>

        {isRejected && kycData?.kycRejectReason && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#FEE2E2',
              color: '#991B1B',
              fontSize: '0.78rem',
              fontWeight: 600,
              maxWidth: '300px',
            }}
          >
            Reason: {kycData.kycRejectReason}
          </div>
        )}
      </div>

      {/* 2. AADHAAR INFORMATION & PERSONAL INFO */}
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <FileCheck2 size={18} color="#1D4ED8" />
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#071B52' }}>
            Aadhaar Information
          </h4>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Aadhaar Number</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#071B52', fontFamily: 'monospace' }}>
              {kycData?.aadhaarNumber || 'XXXX XXXX 1234'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Full Name (As on Aadhaar)</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#071B52' }}>
              {kycData?.personalInfo?.firstName || 'Ayushi'} {kycData?.personalInfo?.surname || 'Thanki'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Father / Husband Name</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#071B52' }}>
              {kycData?.personalInfo?.fatherHusbandName || customer.fatherHusbandName || 'Mukesh Thanki'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Date of Birth</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#071B52' }}>
              {kycData?.personalInfo?.birthdate || '15 Aug 1995'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Gender</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#071B52' }}>
              {kycData?.personalInfo?.gender || customer.gender || 'Female'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. AADHAAR DOCUMENTS (FRONT & BACK WITH PREVIEW & ZOOM) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} color="#0D9488" />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#071B52' }}>
              Aadhaar Documents (Front & Back)
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Click preview or "View Full" for high-resolution inspection
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          {/* AADHAAR FRONT */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#071B52' }}>
                📄 Aadhaar Card (Front)
              </span>
              {frontUrl ? (
                <span style={{ fontSize: '0.70rem', color: '#10B981', fontWeight: 700, background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
                  JPG / PNG
                </span>
              ) : (
                <span style={{ fontSize: '0.70rem', color: '#DC2626', fontWeight: 700, background: '#FEF2F2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FECACA' }}>
                  NOT UPLOADED
                </span>
              )}
            </div>

            {frontUrl ? (
              <div
                onClick={() => setZoomImage({ url: frontUrl, title: 'Aadhaar Card - Front Side' })}
                style={{
                  height: '180px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#F1F5F9',
                  position: 'relative',
                  cursor: 'pointer',
                  border: '1px solid #CBD5E1',
                }}
              >
                <img
                  src={frontUrl}
                  alt="Aadhaar Front"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(7, 27, 82, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: '#FFFFFF',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <Maximize2 size={18} />
                  <span style={{ fontSize: '0.80rem', fontWeight: 700 }}>Click to Zoom</span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: '180px',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '2px dashed #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <AlertCircle size={32} color="#94A3B8" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569' }}>
                  Document Not Uploaded
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Customer has not uploaded Aadhaar front copy
                </span>
              </div>
            )}

            {frontUrl ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setZoomImage({ url: frontUrl, title: 'Aadhaar Card - Front Side' })}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={14} />
                  <span>View Full</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(frontUrl, `aadhaar_front_${customer.id || 'cust'}.jpg`)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: '#F1F5F9',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#94A3B8',
                  }}
                >
                  <span>No Image Attached</span>
                </div>
              </div>
            )}
          </div>

          {/* AADHAAR BACK */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#071B52' }}>
                📄 Aadhaar Card (Back)
              </span>
              {backUrl ? (
                <span style={{ fontSize: '0.70rem', color: '#10B981', fontWeight: 700, background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
                  JPG / PNG
                </span>
              ) : (
                <span style={{ fontSize: '0.70rem', color: '#DC2626', fontWeight: 700, background: '#FEF2F2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FECACA' }}>
                  NOT UPLOADED
                </span>
              )}
            </div>

            {backUrl ? (
              <div
                onClick={() => setZoomImage({ url: backUrl, title: 'Aadhaar Card - Back Side' })}
                style={{
                  height: '180px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#F1F5F9',
                  position: 'relative',
                  cursor: 'pointer',
                  border: '1px solid #CBD5E1',
                }}
              >
                <img
                  src={backUrl}
                  alt="Aadhaar Back"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(7, 27, 82, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: '#FFFFFF',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <Maximize2 size={18} />
                  <span style={{ fontSize: '0.80rem', fontWeight: 700 }}>Click to Zoom</span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: '180px',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '2px dashed #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <AlertCircle size={32} color="#94A3B8" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569' }}>
                  Document Not Uploaded
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Customer has not uploaded Aadhaar back copy
                </span>
              </div>
            )}

            {backUrl ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setZoomImage({ url: backUrl, title: 'Aadhaar Card - Back Side' })}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={14} />
                  <span>View Full</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(backUrl, `aadhaar_back_${customer.id || 'cust'}.jpg`)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: '#F1F5F9',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#94A3B8',
                  }}
                >
                  <span>No Image Attached</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. BANK DETAILS (FOR WITHDRAWAL) */}
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Building size={18} color="#D97706" />
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#071B52' }}>
            Bank Details (For Commission & Withdrawal)
          </h4>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Bank Name</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#071B52' }}>
              {kycData?.bankDetails?.bankName || customer.bankName || 'HDFC Bank'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Branch</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#071B52' }}>
              {kycData?.bankDetails?.branchName || customer.branchName || 'SG Highway'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Account Holder</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#071B52' }}>
              {kycData?.bankDetails?.accountHolderName || customer.accountHolderName || customer.name}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Account Number</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#071B52', fontFamily: 'monospace' }}>
              {kycData?.bankDetails?.accountNumber ||
                (customer.accountNumber ? `XXXX ${customer.accountNumber.slice(-4)}` : 'XXXX 9182')}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>IFSC Code</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#071B52', fontFamily: 'monospace' }}>
              {kycData?.bankDetails?.ifscCode || customer.ifscCode || 'HDFC0000123'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>UPI ID</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#4F46E5' }}>
              {kycData?.bankDetails?.upiId || customer.upiId || 'ayushi@okhdfcbank'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. ADMIN ACTIONS: APPROVE / REJECT */}
      <div
        style={{
          borderTop: '1px solid #E2E8F0',
          paddingTop: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.90rem', fontWeight: 800, color: '#071B52' }}>
              Admin Verification Decision
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
              Approving automatically unlocks the customer and credits ₹20 to the sponsor account.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              disabled={actionLoading || isVerified}
              onClick={handleApprove}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: isVerified ? '#94A3B8' : '#10B981',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: isVerified ? 'not-allowed' : 'pointer',
                boxShadow: isVerified ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{isVerified ? 'KYC Approved' : '✅ Approve KYC'}</span>
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setShowRejectBox(!showRejectBox)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: showRejectBox ? '#991B1B' : '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
              }}
            >
              <AlertCircle size={16} />
              <span>{showRejectBox ? 'Close Rejection' : '❌ Reject KYC'}</span>
            </button>
          </div>
        </div>

        {/* REJECTION REASON DRAWER */}
        {showRejectBox && (
          <div
            style={{
              background: '#FEF2F2',
              borderRadius: '10px',
              border: '1px solid #FECACA',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="#DC2626" />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991B1B' }}>
                Select or Type Rejection Reason:
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_REJECT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: rejectionReason === reason ? '1px solid #DC2626' : '1px solid #FCA5A5',
                    background: rejectionReason === reason ? '#DC2626' : '#FFFFFF',
                    color: rejectionReason === reason ? '#FFFFFF' : '#991B1B',
                    cursor: 'pointer',
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter custom rejection reason here..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #FCA5A5',
                fontSize: '0.82rem',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowRejectBox(false)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#64748B',
                  fontWeight: 700,
                  fontSize: '0.80rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.80rem',
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. IMAGE ZOOM MODAL */}
      {zoomImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(7, 27, 82, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setZoomImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '850px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #E2E8F0',
                background: '#F8FAFC',
              }}
            >
              <span style={{ fontWeight: 800, color: '#071B52', fontSize: '0.92rem' }}>
                {zoomImage.title}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => downloadFile(zoomImage.url, `${zoomImage.title}.jpg`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomImage(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              style={{
                maxHeight: '75vh',
                overflow: 'auto',
                padding: '12px',
                background: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={zoomImage.url}
                alt="Zoomed document"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '6px',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
