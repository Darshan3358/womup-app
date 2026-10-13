import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MapPin,
  Gift,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { useAuth, type CityItem } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeLoginModal,
    sendOtp,
    verifyOtp,
    registerCustomer,
    fetchCities,
    loginWithGoogle,
    pendingCartItem,
  } = useAuth();

  const [step, setStep] = useState<
    'phone' | 'otp' | 'create-account' | 'google-picker' | 'link-phone'
  >('phone');

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP State (6 boxes matching Customer App S07_OtpVerificationScreen)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [verificationId, setVerificationId] = useState('');
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Registration form states (matching Customer App S08_CreateAccountScreen & S09)
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Live Cities Dropdown from MongoDB 'cities' collection
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('Ahmedabad');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Google sign in states
  const [customGmail, setCustomGmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Fetch active cities on mount / modal open
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('phone');
      setIdentifier('');
      setRegPhone('');
      setFullName('');
      setReferralCode('');
      setOtp(['', '', '', '', '', '']);
      setErrorMsg('');
      setCountdown(30);
      setIsLoading(false);
      setCustomGmail('');
      setCustomGoogleName('');

      // Fetch active cities from MongoDB
      fetchCities().then((res) => {
        if (res && res.length > 0) {
          setCities(res);
          setSelectedCityId(res[0]._id || res[0].id || '');
          setSelectedCityName(res[0].name);
        }
      });
    }
  }, [isAuthModalOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isAuthModalOpen) return null;

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      setErrorMsg('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      setErrorMsg('Please enter a valid email address (e.g. name@gmail.com)');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('Please agree to the Terms & Privacy Policy to proceed');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const res = await sendOtp(clean);
    setIsLoading(false);

    if (res.success) {
      setVerificationId(res.verificationId || '');
      setStep('otp');
      setCountdown(30);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } else {
      setErrorMsg(res.message || 'Failed to send OTP. Please try again.');
    }
  };

  // Step 2: Handle OTP Change & Auto-Advance
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 4) {
      setErrorMsg('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const res = await verifyOtp(identifier, otpCode, verificationId);
    setIsLoading(false);

    if (res.success) {
      if (res.isNewUser) {
        // Transition to Step 3: Create Account
        setStep('create-account');
      }
      // If returning user, AuthContext automatically logs in and closes modal
    } else {
      setErrorMsg(res.message || 'Incorrect OTP code. Please try again.');
    }
  };

  // Step 3: Customer Registration Submit (matching /api/v1/auth/register)
  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number for delivery');
      return;
    }
    if (!selectedCityName) {
      setErrorMsg('Please select your delivery city');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const res = await registerCustomer({
      verificationId: verificationId || 'local-verify-' + Date.now(),
      name: fullName.trim(),
      phone: cleanPhone,
      preferredCityId: selectedCityId,
      preferredCityName: selectedCityName,
      referralCode: referralCode.trim() || undefined,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Registration failed. Please check your details.');
    }
  };

  // Google Sign-In Execution
  const executeGoogleLogin = async (selectedEmail: string, selectedName: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await loginWithGoogle({
        email: selectedEmail,
        name: selectedName,
        googleId: 'g_' + selectedEmail.replace(/[^a-zA-Z0-9]/g, '_'),
      });
      setIsLoading(false);

      if (res.success) {
        if (res.requiresPhone) {
          setFullName(selectedName);
          setStep('create-account');
        } else {
          closeLoginModal();
        }
      } else {
        setErrorMsg(res.message || 'Google login failed');
        setStep('phone');
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Google sign-in encountered an error');
      setStep('phone');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 27, 82, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={closeLoginModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(7, 27, 82, 0.25)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Strip */}
        <div
          style={{
            background: 'linear-gradient(135deg, #071B52 0%, #102B68 100%)',
            padding: '24px 28px 20px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <button
            onClick={closeLoginModal}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 59, 152, 0.2)',
              color: '#FF70B8',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              marginBottom: '10px',
            }}
          >
            <Sparkles size={13} />
            <span>WORMUP INSTANT LOGIN</span>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 4px', color: '#FFFFFF' }}>
            {step === 'phone' && 'Login or Sign Up'}
            {step === 'google-picker' && 'Sign in with Google'}
            {step === 'otp' && 'Verify 6-Digit Code'}
            {step === 'create-account' && 'Create Your Account'}
          </h2>

          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.78)', margin: 0 }}>
            {step === 'phone' && 'Access 9-min delivery, 10-min printing & shopping coins'}
            {step === 'google-picker' && 'Choose your Google account to proceed'}
            {step === 'otp' && `Enter the code sent to ${identifier}`}
            {step === 'create-account' && 'Complete your profile to get 50 Shopping Coins'}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '26px 28px' }}>
          {pendingCartItem && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '14px',
                marginBottom: '18px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
              }}
            >
              <img
                src={pendingCartItem.product?.image || pendingCartItem.product?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80'}
                alt={pendingCartItem.product?.name || 'Product'}
                style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #D1FAE5' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>Adding: {pendingCartItem.product?.name}</span>
                  <span style={{ fontSize: '0.74rem', background: '#D1FAE5', color: '#047857', padding: '1px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    {pendingCartItem.variant?.label || pendingCartItem.product?.unit || '1 unit'}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                  ✨ Will be automatically added to your cart immediately upon login!
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Login / Identifier Entry */}
          {step === 'phone' && (
            <div>
              {/* Email Form */}
              <form onSubmit={handleSendOtp}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#071B52',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Email Address
                </label>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '14px',
                    background: '#F8FAFC',
                    marginBottom: '16px',
                    padding: '4px 14px',
                  }}
                >
                  <input
                    type="email"
                    id="identifier-input"
                    placeholder="Enter your email address"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '12px 6px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#071B52',
                      background: 'transparent',
                    }}
                    autoFocus
                  />
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.8rem',
                    color: '#64748B',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#FF3B98', width: '16px', height: '16px' }}
                  />
                  <span>
                    I agree to WormUp's <strong>Terms of Service</strong> & <strong>Privacy Policy</strong>.
                  </span>
                </label>

                <button
                  type="submit"
                  id="send-otp-btn"
                  disabled={isLoading || !identifier.trim()}
                  style={{
                    width: '100%',
                    background: identifier.trim()
                      ? 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)'
                      : '#E2E8F0',
                    color: identifier.trim() ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '15px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: identifier.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: identifier.trim() ? '0 8px 24px rgba(255, 59, 152, 0.35)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{isLoading ? 'Sending Code...' : 'Continue'}</span>
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </form>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '18px',
                  color: '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={14} color="#10B981" />
                <span>🔒 100% Secure & Encrypted Login</span>
              </div>
            </div>
          )}

          {/* STEP 2: 6-Digit OTP Verification (matching Customer App S07) */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Code sent to <strong>{identifier}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7856F6',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </div>

              {/* 6 OTP Boxes */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '22px',
                }}
              >
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '48px',
                      height: '56px',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      color: '#071B52',
                      background: otp[idx] ? '#F0F9FF' : '#F8FAFC',
                      border: otp[idx] ? '2px solid #FF3B98' : '1.5px solid #CBD5E1',
                      borderRadius: '12px',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                id="verify-otp-submit-btn"
                disabled={isLoading || otp.join('').length < 4}
                style={{
                  width: '100%',
                  background:
                    otp.join('').length >= 4
                      ? 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)'
                      : '#E2E8F0',
                  color: otp.join('').length >= 4 ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '15px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: otp.join('').length >= 4 ? 'pointer' : 'not-allowed',
                  boxShadow:
                    otp.join('').length >= 4 ? '0 8px 24px rgba(255, 59, 152, 0.35)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <span>{isLoading ? 'Verifying...' : 'Verify Code'}</span>
                {!isLoading && <ArrowRight size={18} />}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748B' }}>
                {countdown > 0 ? (
                  <span>Resend code in <strong>{countdown}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FF3B98',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: Create Account (Matches Customer App S08_CreateAccountScreen & S09) */}
          {step === 'create-account' && (
            <form onSubmit={handleRegisterSubmit}>
              {/* Welcome Reward Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '18px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Verified! Complete profile to get <strong>50 Shopping Coins</strong>.</span>
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#071B52',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#F8FAFC',
                  }}
                  autoFocus
                />
              </div>

              {/* Mobile Number (+91) */}
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#071B52',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Mobile Number (For Delivery) *
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#F8FAFC',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 12px',
                      background: '#EDF2F7',
                      borderRight: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: '#071B52',
                    }}
                  >
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '12px 14px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      background: 'transparent',
                    }}
                  />
                </div>
              </div>

              {/* City Dropdown (Fetched from MongoDB 'cities' collection!) */}
              <div style={{ marginBottom: '14px', position: 'relative' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#071B52',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Service City (Dropdown from Database) *
                </label>
                <div
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={17} color="#FF3B98" />
                    <span style={{ fontWeight: 700, color: '#071B52', fontSize: '0.95rem' }}>
                      {selectedCityName}
                    </span>
                  </div>
                  <ChevronDown size={18} color="#64748B" />
                </div>

                {/* Dropdown Options Menu */}
                {isCityDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(7, 27, 82, 0.15)',
                      zIndex: 50,
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    {cities.map((city) => (
                      <div
                        key={city._id || city.id || city.code}
                        onClick={() => {
                          setSelectedCityId(city._id || city.id || '');
                          setSelectedCityName(city.name);
                          setIsCityDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          backgroundColor:
                            selectedCityName === city.name ? '#FDF2F8' : 'transparent',
                          color: selectedCityName === city.name ? '#FF3B98' : '#071B52',
                          fontWeight: selectedCityName === city.name ? 800 : 600,
                          fontSize: '0.9rem',
                          borderBottom: '1px solid #F1F5F9',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            selectedCityName === city.name ? '#FDF2F8' : 'transparent')
                        }
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={15} color="#94A3B8" />
                          <span>{city.name}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{city.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Referral Code (Optional) */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#071B52',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Referral Code (Optional)
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    padding: '2px 12px',
                  }}
                >
                  <Gift size={16} color="#7856F6" style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    placeholder="Enter referral code for 50 bonus coins"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '10px 4px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#071B52',
                      background: 'transparent',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="create-account-btn"
                disabled={isLoading || !fullName.trim() || regPhone.length !== 10}
                style={{
                  width: '100%',
                  background:
                    fullName.trim() && regPhone.length === 10
                      ? 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)'
                      : '#E2E8F0',
                  color: fullName.trim() && regPhone.length === 10 ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '15px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor:
                    fullName.trim() && regPhone.length === 10 ? 'pointer' : 'not-allowed',
                  boxShadow:
                    fullName.trim() && regPhone.length === 10
                      ? '0 8px 24px rgba(255, 59, 152, 0.35)'
                      : 'none',
                }}
              >
                <span>{isLoading ? 'Creating Account...' : 'Complete & Start Shopping →'}</span>
              </button>
            </form>
          )}

          {/* STEP: Google Account Selector */}
          {step === 'google-picker' && (
            <div>
              <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '16px', lineHeight: 1.4 }}>
                Select an account to sign in to <strong>WormUp Quick Commerce</strong>:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => executeGoogleLogin('mukesh.thanki@gmail.com', 'Mukesh Thanki')}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    M
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#071B52', fontSize: '0.94rem' }}>
                      Mukesh Thanki
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>mukesh.thanki@gmail.com</div>
                  </div>
                  <ArrowRight size={16} color="#94A3B8" />
                </button>

                <button
                  type="button"
                  onClick={() => executeGoogleLogin('darshan.thanki@gmail.com', 'Darshan Thanki')}
                  disabled={isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FF3B98 0%, #7856F6 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    D
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#071B52', fontSize: '0.94rem' }}>
                      Darshan Thanki
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>darshan.thanki@gmail.com</div>
                  </div>
                  <ArrowRight size={16} color="#94A3B8" />
                </button>
              </div>

              {/* Or enter custom Gmail */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  borderRadius: '14px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Or enter your Gmail address:
                </div>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={customGmail}
                  onChange={(e) => setCustomGmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    marginBottom: '8px',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                />
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    marginBottom: '10px',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                />
                <button
                  type="button"
                  disabled={!customGmail.includes('@') || isLoading}
                  onClick={() => executeGoogleLogin(customGmail.trim(), customGoogleName.trim())}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    background: customGmail.includes('@') ? '#071B52' : '#E2E8F0',
                    color: customGmail.includes('@') ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: customGmail.includes('@') ? 'pointer' : 'not-allowed',
                  }}
                >
                  Continue with this Email
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep('phone')}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                ← Back to Email login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
