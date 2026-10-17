import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Shield,
  FileText,
  CreditCard,
  Users,
  X,
  Lock,
  CheckCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Customer } from '../../types/admin';
import { CustomerService } from '../../services/customerService';

interface EditCustomerModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedCustomer: Customer) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);

  // Section 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [gender, setGender] = useState('Female');
  const [birthdate, setBirthdate] = useState('');

  // Section 2: Contact Info
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  // Section 3: Address
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [village, setVillage] = useState('');
  const [zoneName, setZoneName] = useState('Bopal');
  const [pincode, setPincode] = useState('');
  const [areaList, setAreaList] = useState<Array<{ id: string; name: string }>>([]);

  // Section 4: Sponsor & Referral (Read-only)
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [userCode, setUserCode] = useState('');

  // Section 5: Bank Details
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Section 6: Status Controls
  const [kycStatus, setKycStatus] = useState<'Pending' | 'Verified' | 'Rejected'>('Pending');
  const [paymentStatus, setPaymentStatus] = useState<1 | 2>(1); // 1 = Enabled, 2 = Disabled
  const [contactStatus, setContactStatus] = useState<'Active' | 'Blocked'>('Active');
  const [isSuspended, setIsSuspended] = useState<0 | 1>(0); // 0 = No, 1 = Yes

  // Section 7: Admin Notes
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (customer && isOpen) {
      const nameParts = (customer.name || '').split(' ');
      setFirstName(customer.firstName || nameParts[0] || '');
      setSurname(customer.surname || nameParts.slice(1).join(' ') || '');
      setFatherHusbandName(customer.fatherHusbandName || '');
      setGender(customer.gender || 'Female');
      setBirthdate(customer.birthdate || customer.birthDate || '1995-08-15');

      setMobile(customer.phone || '');
      setEmail(customer.email || '');

      setAddress(customer.address || '');
      setLandmark(customer.landmark || '');
      setVillage(customer.village || '');
      setZoneName(customer.zoneName || 'Bopal');
      setPincode(customer.pincode || '380015');

      setSponsorId(customer.sponsorId || customer.parentReferralCode || 'WORM5871');
      setSponsorName(customer.sponsorName || 'Darshan T.');
      setReferralCode(customer.referralCode || customer.parentReferralCode || 'WORM5871');
      setUserCode(customer.userCode || customer.myReferralCode || 'WORM1213');

      setBankName(customer.bankName || 'HDFC Bank');
      setBranchName(customer.branchName || 'SG Highway');
      setAccountHolderName(customer.accountHolderName || customer.name || '');
      setAccountNumber(customer.accountNumber || '');
      setIfscCode(customer.ifscCode || 'HDFC0000123');
      setUpiId(customer.upiId || 'ayushi@okhdfcbank');

      setKycStatus(customer.kycStatus || 'Pending');
      setPaymentStatus(customer.paymentStatus === 2 ? 2 : 1);
      setContactStatus(customer.status === 'Blocked' ? 'Blocked' : 'Active');
      setIsSuspended(customer.isSuspended === 1 ? 1 : 0);

      setAdminNotes(customer.adminNotes || '');
    }
  }, [customer, isOpen]);

  useEffect(() => {
    if (isOpen) {
      CustomerService.getAreas().then((list) => {
        if (list && list.length > 0) setAreaList(list);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!firstName.trim()) {
      alert('First Name is required');
      return;
    }
    if (!surname.trim()) {
      alert('Surname is required');
      return;
    }
    if (!mobile.trim()) {
      alert('Mobile Number is required');
      return;
    }
    if (!address.trim()) {
      alert('Full Address is required');
      return;
    }
    if (!pincode.trim()) {
      alert('Pincode is required');
      return;
    }

    try {
      setSaving(true);
      const fullName = `${firstName.trim()} ${surname.trim()}`;
      const custId = customer.id || customer._id || '';

      const updatePayload: Partial<Customer> & Record<string, any> = {
        name: fullName,
        firstName: firstName.trim(),
        surname: surname.trim(),
        fatherHusbandName: fatherHusbandName.trim(),
        gender,
        birthdate,
        birthDate: birthdate,
        phone: mobile.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        address: address.trim(),
        landmark: landmark.trim(),
        village: village.trim(),
        zoneName,
        areaZone: zoneName,
        pincode: pincode.trim(),
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        upiId: upiId.trim(),
        kycStatus,
        customer_kyc_status: kycStatus === 'Verified' ? 2 : kycStatus === 'Rejected' ? 3 : 1,
        customer_is_verify: kycStatus === 'Verified' ? 1 : 0,
        paymentStatus,
        status: contactStatus,
        isBlocked: contactStatus === 'Blocked' ? 1 : 0,
        isSuspended,
        adminNotes: adminNotes.trim(),
      };

      const result = await CustomerService.updateCustomer(custId, updatePayload);

      if (result && result.error) {
        alert(`Failed to save: ${result.error}`);
        return;
      }

      const mergedCustomer: Customer = {
        ...customer,
        ...updatePayload,
      };

      onSaved(mergedCustomer);
      alert('Customer Profile updated successfully!');
      onClose();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(7, 27, 82, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={20} color="#1D4ED8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#071B52' }}>
                Edit Customer Profile
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                ID: {customer.id || customer._id} • Manage personal info, address, bank & controls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE BODY (2-COLUMN GRID) */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* SECTION 1: PERSONAL INFO */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <User size={16} color="#1D4ED8" />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#071B52', textTransform: 'uppercase' }}>
                Personal Info
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Ayushi"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Surname *
                </label>
                <input
                  type="text"
                  required
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Thanki"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Father / Husband Name
                </label>
                <input
                  type="text"
                  value={fatherHusbandName}
                  onChange={(e) => setFatherHusbandName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Mukesh Thanki"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="form-select"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Birthdate *
                </label>
                <input
                  type="date"
                  value={birthdate.includes('/') ? '1995-08-15' : birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTACT INFO */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Phone size={16} color="#0D9488" />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#071B52', textTransform: 'uppercase' }}>
                Contact Info
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="form-input"
                  placeholder="+91 79849 40855"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="ayushi@example.com"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ADDRESS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <MapPin size={16} color="#DC2626" />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#071B52', textTransform: 'uppercase' }}>
                Address Details
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Full Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                  placeholder="Flat 402, Shivam Residency, University Road"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="form-input"
                    placeholder="Near Gujarat University"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    Village / Locality
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="form-input"
                    placeholder="Vejalpur"
                  />
                </div>

                {/* AREA ZONE - COMPACT DROPDOWN NOT CHIPS */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    Area Zone * (Compact Dropdown)
                  </label>
                  <select
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="form-select"
                  >
                    {areaList.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="form-input"
                    placeholder="380015"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: SPONSOR & REFERRAL (READ-ONLY) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Users size={16} color="#7C3AED" />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#071B52', textTransform: 'uppercase' }}>
                Sponsor & Referral (Read-Only)
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8' }}>
                  Sponsor ID
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={sponsorId}
                    className="form-input"
                    style={{ background: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                  />
                  <Lock size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8' }}>
                  Sponsor Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={sponsorName}
                    className="form-input"
                    style={{ background: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                  />
                  <Lock size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8' }}>
                  Referral Code (Used to join)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={referralCode}
                    className="form-input"
                    style={{ background: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                  />
                  <Lock size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8' }}>
                  User's Own Referral Code
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={userCode}
                    className="form-input"
                    style={{ background: '#F8FAFC', color: '#64748B', cursor: 'not-allowed' }}
                  />
                  <Lock size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: BANK DETAILS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <CreditCard size={16} color="#D97706" />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#071B52', textTransform: 'uppercase' }}>
                Bank Details (Withdrawal & Commissions)
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. HDFC Bank"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Branch
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. SG Highway"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Ayushi Thanki"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="form-input"
                  placeholder="123456789012"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="form-input"
                  placeholder="HDFC0000123"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="form-input"
                  placeholder="ayushi@okhdfcbank"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: STATUS CONTROLS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Shield size={16} color="#059669" />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#071B52', textTransform: 'uppercase' }}>
                Account & Status Controls
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* KYC Status Dropdown */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  KYC Status
                </label>
                <select
                  value={kycStatus}
                  onChange={(e) => setKycStatus(e.target.value as any)}
                  className="form-select"
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="Verified">✅ Verified (Confirmed)</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
              </div>

              {/* Payment Status Toggle */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Payment Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus(1)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: paymentStatus === 1 ? '2px solid #10B981' : '1px solid #CBD5E1',
                      background: paymentStatus === 1 ? '#ECFDF5' : '#FFFFFF',
                      color: paymentStatus === 1 ? '#065F46' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      cursor: 'pointer',
                    }}
                  >
                    Enabled
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus(2)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: paymentStatus === 2 ? '2px solid #DC2626' : '1px solid #CBD5E1',
                      background: paymentStatus === 2 ? '#FEF2F2' : '#FFFFFF',
                      color: paymentStatus === 2 ? '#991B1B' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      cursor: 'pointer',
                    }}
                  >
                    Disabled
                  </button>
                </div>
              </div>

              {/* Contact Status Toggle */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Contact Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setContactStatus('Active')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: contactStatus === 'Active' ? '2px solid #10B981' : '1px solid #CBD5E1',
                      background: contactStatus === 'Active' ? '#ECFDF5' : '#FFFFFF',
                      color: contactStatus === 'Active' ? '#065F46' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      cursor: 'pointer',
                    }}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactStatus('Blocked')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: contactStatus === 'Blocked' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                      background: contactStatus === 'Blocked' ? '#FEF2F2' : '#FFFFFF',
                      color: contactStatus === 'Blocked' ? '#991B1B' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      cursor: 'pointer',
                    }}
                  >
                    Blocked
                  </button>
                </div>
              </div>

              {/* Suspend Account Toggle */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Suspend Account
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsSuspended(0)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: isSuspended === 0 ? '2px solid #10B981' : '1px solid #CBD5E1',
                      background: isSuspended === 0 ? '#ECFDF5' : '#FFFFFF',
                      color: isSuspended === 0 ? '#065F46' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      cursor: 'pointer',
                    }}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSuspended(1)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: isSuspended === 1 ? '2px solid #DC2626' : '1px solid #CBD5E1',
                      background: isSuspended === 1 ? '#FEF2F2' : '#FFFFFF',
                      color: isSuspended === 1 ? '#991B1B' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      cursor: 'pointer',
                    }}
                  >
                    Yes (Suspended)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 7: ADMIN NOTES */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileText size={16} color="#475569" />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#071B52', textTransform: 'uppercase' }}>
                Admin Notes (Internal Only)
              </h4>
            </div>

            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="form-input"
              placeholder="Internal notes regarding customer verification, telephone follow-ups, etc. (Not visible to customer)"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
            style={{ minWidth: '130px' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
