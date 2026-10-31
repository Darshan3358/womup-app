import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  Wallet,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Trash2,
  Plus,
  Loader2,
  Home,
  Briefcase,
  Heart,
  CheckCircle2,
  AlertCircle,
  Shield,
  CreditCard,
  Gift,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Download,
  Users,
  ArrowUpRight,
  RefreshCw,
  Share2,
  Layers,
  Award,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigation, AHMEDABAD_AREAS } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { OrderTrackingModal } from '../components/OrderTrackingModal';
import {
  AddressApi,
  type SavedAddressItem,
  TRACKING_WS_URL,
  getCustomerTeamDashboard,
  submitCustomerWithdrawal,
  type CustomerTeamDashboardResponse,
} from '../services/api';
import {
  SettingsApi,
  type UserSettingsData,
  type UserPaymentMethodsData,
  type UserRewardsData,
  type CouponItem,
} from '../services/settingsApi';
import { io } from 'socket.io-client';
import type { Order } from '../types';

export const Account: React.FC = () => {
  const { userCoins, orders, refreshOrders } = useCart();
  const { accountActiveTab, setAccountActiveTab, resolvedLocation, navigateTo } = useNavigation();
  const { totalWishlistItems } = useWishlist();
  const { user, isAuthenticated, openLoginModal, logout, verifyAadhaar } = useAuth();
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);

  const displayName = typeof user?.name === 'string' ? user.name : typeof (user as any)?.fullName === 'string' ? (user as any).fullName : 'Customer';
  const rawPhone = user?.phone ?? (user as any)?.phoneNumber ?? '';
  const cleanPhone = String(rawPhone).replace(/^\+91\s*/, '').replace(/\D/g, '');
  const displayPhone = cleanPhone ? `+91 ${cleanPhone}` : (String(rawPhone) || 'Not logged in');
  const initials = typeof displayName === 'string' && displayName.trim()
    ? displayName
        .trim()
        .split(/\s+/)
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'WU';
  const effectiveCoins = user?.shoppingCoins ?? userCoins;

  // Real saved addresses from backend (matching customer app AddressService)
  const [addresses, setAddresses] = useState<SavedAddressItem[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // New address form state
  const [newLabel, setNewLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newHouse, setNewHouse] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Ahmedabad');
  const [newPincode, setNewPincode] = useState('380015');
  const [newLat, setNewLat] = useState<number>(23.0500);
  const [newLng, setNewLng] = useState<number>(72.5160);
  const [accountAreaDetectionStatus, setAccountAreaDetectionStatus] = useState<{
    isServiceable: boolean;
    areaName: string;
    storeName: string;
  } | null>(null);

  // 6 Settings Features States (Web <-> Mobile Real-time Sync)
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethodsData | null>(null);
  const [rewards, setRewards] = useState<UserRewardsData | null>(null);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [birthdayInput, setBirthdayInput] = useState<string>((user as any)?.birthday || '');
  const [isSavingBirthday, setIsSavingBirthday] = useState<boolean>(false);
  const [claimVoucherCode, setClaimVoucherCode] = useState<string>('');
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isScratching, setIsScratching] = useState<boolean>(false);
  const [newUpiInput, setNewUpiInput] = useState<string>('');
  const [isVerifyingUpi, setIsVerifyingUpi] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Aadhaar Verification Modal States (SRS Flow)
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarNameInput, setAadhaarNameInput] = useState(user?.fullNameAsPerAadhaar || displayName || '');
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);
  const [aadhaarSuccess, setAadhaarSuccess] = useState<string | null>(null);

  // 7-Level MLM Team States
  const [teamDashboard, setTeamDashboard] = useState<CustomerTeamDashboardResponse | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [referralCopied, setReferralCopied] = useState<boolean>(false);

  // Income Withdrawal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawBankInput, setWithdrawBankInput] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState<boolean>(false);

  const loadTeamData = async () => {
    setIsLoadingTeam(true);
    setTeamError(null);
    try {
      const res = await getCustomerTeamDashboard();
      if (res.success && res.data) {
        setTeamDashboard(res.data);
      } else {
        setTeamError(res.message || 'Unable to load downline data.');
      }
    } catch (e: any) {
      setTeamError(e.message || 'Error loading team data');
    } finally {
      setIsLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (accountActiveTab === 'team' && isAuthenticated) {
      loadTeamData();
    }
  }, [accountActiveTab, isAuthenticated]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    const available = Number(user?.availableIncome ?? 0);
    if (isNaN(amt) || amt < 600) {
      setWithdrawError('Minimum withdrawal amount is ₹600 as per policy.');
      return;
    }
    if (amt > available) {
      setWithdrawError(`Insufficient available balance. You have ₹${available.toLocaleString('en-IN')}.`);
      return;
    }
    if (!withdrawBankInput.trim()) {
      setWithdrawError('Please enter a valid Bank Account / IFSC or UPI ID.');
      return;
    }

    setIsSubmittingWithdraw(true);
    setWithdrawError(null);
    try {
      const res = await submitCustomerWithdrawal(amt, { upiId: withdrawBankInput.trim(), notes: 'Customer Web withdrawal' });
      if (res.success) {
        setWithdrawSuccess(res.message || 'Withdrawal request submitted successfully! Admin will review and credit shortly.');
        setTimeout(() => {
          setIsWithdrawModalOpen(false);
          setWithdrawSuccess(null);
          setWithdrawAmount('');
          setWithdrawBankInput('');
        }, 2200);
      } else {
        setWithdrawError(res.message || 'Withdrawal submission failed.');
      }
    } catch (err: any) {
      setWithdrawError(err.message || 'Error submitting withdrawal');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Sync live settings across all 6 features
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [sRes, pmRes, rwRes, cpRes] = await Promise.allSettled([
          SettingsApi.getSettings(),
          SettingsApi.getPaymentMethods(),
          SettingsApi.getRewards(),
          SettingsApi.getCoupons(),
        ]);
        if (isMounted) {
          if (sRes.status === 'fulfilled' && sRes.value) setSettings(sRes.value);
          if (pmRes.status === 'fulfilled' && pmRes.value) setPaymentMethods(pmRes.value);
          if (rwRes.status === 'fulfilled' && rwRes.value) setRewards(rwRes.value);
          if (cpRes.status === 'fulfilled' && cpRes.value) setCoupons(cpRes.value);
        }
      } catch (err) {
        console.warn('Error loading settings:', err);
      }
    })();

    const currentUserId = user?.id || (user as any)?._id || 'guest_user';
    const socket = io(TRACKING_WS_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join_user', { userId: currentUserId });

    socket.on('settings_updated', (payload: any) => {
      if (payload?.settings) setSettings(payload.settings);
    });
    socket.on('payment_methods_updated', (payload: any) => {
      if (payload?.methods) setPaymentMethods(payload.methods);
    });
    socket.on('gift_card_redeemed', (payload: any) => {
      if (payload?.amount) {
        setToastMessage(`₹${payload.amount} added to your wallet! 🎉`);
      }
    });
    socket.on('scratch_result', (payload: any) => {
      if (payload) {
        setRewards((prev) => prev ? { ...prev, scratchCardAvailable: false, shoppingCoins: payload.newTotal } : null);
        setToastMessage(`🪙 +${payload.coinsEarned} Shopping Coins won!`);
      }
    });
    socket.on('profile_updated', (payload: any) => {
      if (payload?.birthday) setBirthdayInput(payload.birthday);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, (user as any)?._id]);

  // Debounced area detection for Account address form (300ms)
  useEffect(() => {
    if (!newStreet || newStreet.trim().length < 3) {
      setAccountAreaDetectionStatus(null);
      return;
    }

    const timer = setTimeout(() => {
      const lower = newStreet.toLowerCase().trim();
      const matched = AHMEDABAD_AREAS.find((a) => {
        const aName = a.name.toLowerCase();
        return lower.includes(aName) || aName.includes(lower);
      });

      if (matched) {
        const AREA_PINCODES: Record<string, string> = {
          'chandlodiya - tragad': '382481',
          'thaltej': '380054',
          'navrangpura': '380009',
          'satellite': '380015',
          'prahlad nagar': '380015',
          'vastrapur': '380015',
          'bopal': '380058',
          'ghatlodia': '380061',
          'sg highway': '380054',
        };
        const pin = AREA_PINCODES[matched.name.toLowerCase()] || '380054';
        setNewPincode(pin);
        setNewLat(matched.lat);
        setNewLng(matched.lng);
        setAccountAreaDetectionStatus({
          isServiceable: true,
          areaName: matched.name,
          storeName: matched.storeName,
        });
      } else if (lower.length >= 4) {
        setAccountAreaDetectionStatus({
          isServiceable: false,
          areaName: newStreet,
          storeName: 'Unknown',
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newStreet]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedAddresses();
    }
  }, [isAuthenticated]);

  const loadSavedAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const list = await AddressApi.getAddresses();
      setAddresses(list);
    } catch (err) {
      console.warn('Error loading addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleDeleteAddress = async (id: string, label: string) => {
    if (!window.confirm(`Are you sure you want to remove "${label}" from your saved addresses?`)) return;
    try {
      await AddressApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Delete address failed:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await AddressApi.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
    } catch (err) {
      console.error('Set default address failed:', err);
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouse.trim() || !newStreet.trim()) return;
    setIsSavingAddress(true);
    try {
      const res = await AddressApi.createAddress({
        label: newLabel,
        houseNumber: newHouse.trim(),
        street: newStreet.trim(),
        city: newCity.trim(),
        pincode: newPincode.trim(),
        latitude: newLat,
        longitude: newLng,
        isDefault: addresses.length === 0,
      });
      if (res.success) {
        setIsAddingAddress(false);
        setNewHouse('');
        setNewStreet('');
        setAccountAreaDetectionStatus(null);
        await loadSavedAddresses();
      }
    } catch (err) {
      console.error('Save address failed:', err);
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <div className="account-page-root" style={{ padding: '32px 0 80px', background: '#FBFCFF' }}>
      <div className="container">
        <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#071B52', marginBottom: '28px' }}>
          My Account & Orders
        </h1>

        {!isAuthenticated ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1.5px solid #E6EAF2',
              boxShadow: '0 8px 30px rgba(7, 27, 82, 0.06)',
              padding: '48px 32px',
              textAlign: 'center',
              maxWidth: '540px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 59, 152, 0.1)',
                color: '#FF3B98',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              <User size={32} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#071B52', marginBottom: '8px' }}>
              Log in to view your account
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Sign in with your mobile number to check past orders, redeem your shopping coins, and manage saved delivery addresses.
            </p>
            <button
              onClick={openLoginModal}
              style={{
                background: 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 36px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255, 59, 152, 0.35)',
              }}
            >
              Login / Sign Up with Mobile OTP
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '36px', alignItems: 'start' }}>
            {/* ==============================================================
                Sidebar: Deep Navy #071B52
                ============================================================== */}
            <aside
              style={{
                background: '#071B52',
                borderRadius: '24px',
                padding: '28px 18px',
                color: '#FFFFFF',
                boxShadow: '0 8px 30px rgba(7, 27, 82, 0.18)',
              }}
            >
              {/* User Mini Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '18px', paddingLeft: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF3B98, #7856F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
                    {displayPhone}
                  </div>
                </div>
              </div>

            {/* Navigation links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'orders', label: 'My Orders', icon: Package, badge: orders.length > 0 ? `${orders.length}` : undefined },
                { id: 'wishlist', label: 'My Wishlist', icon: Heart, badge: totalWishlistItems > 0 ? `${totalWishlistItems}` : undefined, onClick: () => navigateTo('wishlist') },
                { id: 'wallet', label: 'WormUp Coins Wallet', icon: Wallet, badge: `${effectiveCoins} Coins` },
                { id: 'team', label: '7-Level MLM & Team', icon: Users, badge: teamDashboard?.teamSummary?.totalTeamSize !== undefined ? `${teamDashboard.teamSummary.totalTeamSize}` : 'Downline' },
                { id: 'profile', label: 'Profile Information', icon: User },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = accountActiveTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        setAccountActiveTab(item.id as any);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive ? '#FF3B98' : 'transparent',
                      color: '#FFFFFF',
                      fontSize: '0.92rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={18} color={isActive ? '#FFFFFF' : '#FF5BAA'} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span style={{ fontSize: '0.72rem', background: isActive ? '#FFFFFF' : 'rgba(255,59,152,0.2)', color: isActive ? '#FF3B98' : '#FF5BAA', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginTop: '16px',
                }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </nav>
          </aside>

          {/* ==============================================================
              Main Content Area
              ============================================================== */}
          <div>
            {/* TAB: MY ORDERS */}
            {accountActiveTab === 'orders' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52' }}>
                    Past Orders ({orders.length})
                  </h2>
                  <button
                    onClick={refreshOrders}
                    style={{ background: 'none', border: 'none', color: '#7856F6', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                  >
                    ↻ Refresh
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '60px', textAlign: 'center' }}>
                    <Package size={48} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#071B52' }}>No orders placed yet</h3>
                    <p style={{ color: '#667085', marginTop: '4px' }}>Items ordered will appear here with live tracking.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {orders.map((ord) => {
                      const isDelivered = ord.status === 'DELIVERED';
                      const isCancelled = ord.status === 'CANCELLED';

                      return (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrderForTracking(ord)}
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '20px',
                            border: '1px solid #E6EAF2',
                            padding: '24px',
                            boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 800, color: '#071B52', fontSize: '1.1rem' }}>
                                  {ord.orderNumber}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    background: isDelivered ? '#ECFDF5' : isCancelled ? '#FEF2F2' : '#F8F2FF',
                                    color: isDelivered ? '#13B978' : isCancelled ? '#EF4444' : '#7856F6',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {ord.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#667085', marginTop: '4px' }}>
                                Placed on {ord.createdAt} • Fulfilled by {ord.storeName}
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedOrderForTracking(ord)}
                              style={{
                                background: '#F8F2FF',
                                color: '#7856F6',
                                border: '1px solid #EEE6FF',
                                borderRadius: '10px',
                                padding: '8px 16px',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                              }}
                            >
                              Track Live Order
                            </button>
                          </div>

                          {/* Ordered Products with Thumbnails & Details */}
                          <div
                            style={{
                              background: '#F8FAFC',
                              borderRadius: '14px',
                              padding: '12px 16px',
                              marginBottom: '14px',
                              border: '1px solid #EEF2F6',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                            }}
                          >
                            {ord.items?.map((it, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                  {/* Product Thumbnail Container */}
                                  <div
                                    style={{
                                      width: '52px',
                                      height: '52px',
                                      minWidth: '52px',
                                      borderRadius: '10px',
                                      backgroundColor: '#F8FAFC',
                                      border: '1px solid #E2E8F0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      overflow: 'hidden',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    }}
                                  >
                                    <img
                                      src={it.image || (it as any).imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'}
                                      alt={it.name}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';
                                      }}
                                    />
                                  </div>

                                  {/* Product Name & Quantity Details */}
                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: '0.88rem',
                                        color: '#071B52',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {it.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '0.78rem',
                                        color: '#64748B',
                                        marginTop: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <span style={{ fontWeight: 600, color: '#FF3B98' }}>
                                        {it.quantity}x
                                      </span>
                                      {(it.unit || (it as any).quantityLabel) && (
                                        <span>• {it.unit || (it as any).quantityLabel}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {it.price > 0 && (
                                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#071B52', whiteSpace: 'nowrap' }}>
                                    ₹{it.price * it.quantity}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                            <div style={{ color: '#667085' }}>
                              Delivery PIN: <strong>{ord.deliveryPin || ord.deliveryOtp || '4821'}</strong>
                            </div>
                            <div style={{ fontWeight: 800, color: '#071B52', fontSize: '1.1rem' }}>
                              ₹{ord.total}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ADDRESSES */}
            {accountActiveTab === 'addresses' && (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                      Saved Addresses
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0' }}>
                      Manage your delivery locations for 9-minute drops
                    </p>
                  </div>
                  {!isAddingAddress && (
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      style={{
                        backgroundColor: '#FF3B98',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px 18px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(255, 59, 152, 0.25)',
                      }}
                    >
                      <Plus size={16} />
                      <span>Add New Address</span>
                    </button>
                  )}
                </div>

                {/* Inline New Address Form */}
                {isAddingAddress && (
                  <form
                    onSubmit={handleSaveNewAddress}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '16px',
                      border: '1.5px solid #E2E8F0',
                      padding: '20px',
                      marginBottom: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#071B52' }}>
                      Add New Delivery Address
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['Home', 'Work', 'Other'] as const).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewLabel(tag)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '8px',
                            border: newLabel === tag ? '1.5px solid #15803D' : '1px solid #CBD5E1',
                            backgroundColor: newLabel === tag ? '#DCFCE7' : '#FFFFFF',
                            color: newLabel === tag ? '#15803D' : '#64748B',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                          House / Flat / Floor *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Chandlodiya"
                          value={newHouse}
                          onChange={(e) => setNewHouse(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                          Street / Society / Area (e.g. Thaltej, Tragad) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Thaltej, SG Highway, Ahmedabad"
                          value={newStreet}
                          onChange={(e) => setNewStreet(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                        {accountAreaDetectionStatus && (
                          <div
                            style={{
                              marginTop: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: accountAreaDetectionStatus.isServiceable ? '#16A34A' : '#DC2626',
                              background: accountAreaDetectionStatus.isServiceable ? '#F0FDF4' : '#FEF2F2',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: `1px solid ${accountAreaDetectionStatus.isServiceable ? '#BBF7D0' : '#FECACA'}`,
                            }}
                          >
                            {accountAreaDetectionStatus.isServiceable ? (
                              <>
                                <CheckCircle2 size={13} color="#16A34A" />
                                <span>✅ {accountAreaDetectionStatus.areaName} detected (Serving from {accountAreaDetectionStatus.storeName})</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={13} color="#DC2626" />
                                <span>⚠️ We don't currently serve this area. Please select a valid area.</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                          City
                        </label>
                        <input
                          type="text"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={newPincode}
                          onChange={(e) => setNewPincode(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingAddress}
                        style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: '#15803D', color: '#FFFFFF', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        {isSavingAddress ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                )}

                {/* List of saved addresses */}
                {isLoadingAddresses ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading saved delivery addresses...</div>
                  </div>
                ) : addresses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {addresses.map((addr) => {
                      const label = addr.label || addr.type || 'Home';
                      const formatted = addr.houseFlat || `${addr.houseNumber}, ${addr.street}, ${addr.city} - ${addr.pincode}`;

                      return (
                        <div
                          key={addr.id}
                          style={{
                            border: addr.isDefault ? '1.5px solid #15803D' : '1px solid #E2E8F0',
                            borderRadius: '16px',
                            padding: '18px 20px',
                            backgroundColor: addr.isDefault ? '#F0FDF4' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: addr.isDefault ? '#DCFCE7' : '#F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: addr.isDefault ? '#15803D' : '#64748B',
                                flexShrink: 0,
                                marginTop: '2px',
                              }}
                            >
                              {label === 'Home' ? <Home size={20} /> : label === 'Work' ? <Briefcase size={20} /> : <MapPin size={20} />}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: addr.isDefault ? '#15803D' : '#071B52' }}>
                                  {label}
                                </span>
                                {addr.isDefault && (
                                  <span style={{ fontSize: '0.72rem', backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>
                                    Default
                                  </span>
                                )}
                              </div>
                              <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '4px 0 0', lineHeight: 1.4 }}>
                                {formatted}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefault(addr.id)}
                                style={{
                                  background: 'none',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: '#071B52',
                                  cursor: 'pointer',
                                }}
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAddress(addr.id, label)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete Address"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#F8FAFC', borderRadius: '16px' }}>
                    <MapPin size={32} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: 800, color: '#071B52', fontSize: '1rem', marginBottom: '4px' }}>
                      No Saved Addresses Yet
                    </div>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '16px' }}>
                      Add your home or office address for faster 9-minute deliveries.
                    </p>
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      style={{
                        backgroundColor: '#15803D',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 18px',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                      }}
                    >
                      + Add Address Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PROFILE */}
            {accountActiveTab === 'profile' && (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '32px' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', marginBottom: '20px' }}>
                  Profile Information
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Full Name</label>
                    <input type="text" readOnly value={displayName} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '4px', backgroundColor: '#F8FAFC', fontWeight: 600, color: '#071B52' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Phone</label>
                    <input type="text" readOnly value={displayPhone} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '4px', backgroundColor: '#F8FAFC', fontWeight: 600, color: '#071B52' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>City Hub</label>
                    <input type="text" readOnly value={user?.preferredCityName || resolvedLocation.city || 'Ahmedabad, Gujarat'} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '4px', backgroundColor: '#F8FAFC', fontWeight: 600, color: '#071B52' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Assigned Dark Store</label>
                    <input type="text" readOnly value={resolvedLocation.storeName || 'Wom Up Chandlodiya - Tragad Dark Store'} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '4px', backgroundColor: '#F8FAFC', fontWeight: 600, color: '#071B52' }} />
                  </div>
                </div>

                {/* Birthday & Coins Reward Section */}
                <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={20} color="#15803D" />
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#15803D' }}>Birthday & Anniversary Rewards 🎂</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#DCFCE7', color: '#15803D', padding: '4px 10px', borderRadius: '20px' }}>
                      +50 Shopping Coins Bonus
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#166534', margin: '0 0 14px', lineHeight: 1.4 }}>
                    Add your date of birth once to unlock 50 bonus shopping coins instantly and receive exclusive birthday gift coupons every year!
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="e.g. 07 August 2005"
                      value={birthdayInput}
                      onChange={(e) => setBirthdayInput(e.target.value)}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.9rem' }}
                    />
                    <button
                      type="button"
                      disabled={isSavingBirthday || !birthdayInput.trim()}
                      onClick={async () => {
                        setIsSavingBirthday(true);
                        try {
                          const res = await SettingsApi.updateBirthday(birthdayInput.trim());
                          setToastMessage(res.message);
                        } catch (err: any) {
                          alert(err.message || 'Failed to update birthday');
                        } finally {
                          setIsSavingBirthday(false);
                        }
                      }}
                      style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#15803D', color: '#FFFFFF', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      {isSavingBirthday ? 'Saving...' : 'Save Birthday'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: WALLET & COINS (SRS 4-Balance System) */}
            {accountActiveTab === 'wallet' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 4 Balances Grid (SRS Specification) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {/* 1. Shopping Coins */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #071B52 0%, #1A365D 100%)',
                      borderRadius: '20px',
                      padding: '22px',
                      color: '#FFFFFF',
                      boxShadow: '0 8px 24px rgba(7, 27, 82, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase' }}>
                          Shopping Coins
                        </span>
                        <span style={{ fontSize: '1.2rem' }}>🪙</span>
                      </div>
                      <div style={{ fontSize: '2.1rem', fontWeight: 900 }}>
                        {user?.shoppingCoins ?? effectiveCoins ?? 2000}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#FCD34D', marginTop: '10px', fontWeight: 700 }}>
                      Worth ₹{user?.shoppingCoins ?? effectiveCoins ?? 2000} • 1 Coin = ₹1 Discount
                    </div>
                  </div>

                  {/* 2. Today's Income (Pending) */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #FDE68A',
                      borderRadius: '20px',
                      padding: '22px',
                      color: '#071B52',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#D97706', fontWeight: 800, textTransform: 'uppercase' }}>
                          Today's Income
                        </span>
                        <span style={{ fontSize: '1.2rem' }}>⏳</span>
                      </div>
                      <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#B45309' }}>
                        ₹{user?.pendingIncome ?? 0}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#78350F', marginTop: '10px', fontWeight: 600 }}>
                      From downline • Usable tomorrow midnight
                    </div>
                  </div>

                  {/* 3. Available Income */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #A7F3D0',
                      borderRadius: '20px',
                      padding: '22px',
                      color: '#071B52',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase' }}>
                          Available Income
                        </span>
                        <span style={{ fontSize: '1.2rem' }}>✅</span>
                      </div>
                      <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#047857' }}>
                        ₹{user?.availableIncome ?? 0}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 600 }}>
                        Ready to spend or withdraw!
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawAmount('');
                          setWithdrawBankInput('');
                          setWithdrawError(null);
                          setWithdrawSuccess(null);
                          setIsWithdrawModalOpen(true);
                        }}
                        style={{
                          background: Number(user?.availableIncome ?? 0) >= 600 ? '#059669' : '#94A3B8',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: Number(user?.availableIncome ?? 0) >= 600 ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Withdraw (Min ₹600)</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 4. Verification Status Card */}
                  <div
                    style={{
                      background: user?.verificationStatus === 'VERIFIED' ? '#ECFDF5' : '#FFFBEB',
                      border: `1.5px solid ${user?.verificationStatus === 'VERIFIED' ? '#6EE7B7' : '#FCD34D'}`,
                      borderRadius: '20px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            color: user?.verificationStatus === 'VERIFIED' ? '#065F46' : '#92400E',
                            textTransform: 'uppercase',
                          }}
                        >
                          Verification Status
                        </span>
                        <span>{user?.verificationStatus === 'VERIFIED' ? '🛡️' : '⚠️'}</span>
                      </div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: user?.verificationStatus === 'VERIFIED' ? '#047857' : '#B45309',
                        }}
                      >
                        {user?.verificationStatus === 'VERIFIED' ? '✅ Verified' : '🔴 Non-Verified'}
                      </div>
                      <p
                        style={{
                          fontSize: '0.76rem',
                          color: user?.verificationStatus === 'VERIFIED' ? '#065F46' : '#78350F',
                          margin: '6px 0 0',
                          lineHeight: 1.4,
                        }}
                      >
                        {user?.verificationStatus === 'VERIFIED'
                          ? `Aadhaar verified as ${user?.fullNameAsPerAadhaar || displayName}`
                          : 'Verify Aadhaar to unlock referral & app download income benefits'}
                      </p>
                    </div>

                    {user?.verificationStatus !== 'VERIFIED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAadhaarInput('');
                          setAadhaarNameInput(user?.fullNameAsPerAadhaar || displayName || '');
                          setAadhaarError(null);
                          setAadhaarSuccess(null);
                          setIsAadhaarModalOpen(true);
                        }}
                        style={{
                          marginTop: '12px',
                          background: 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(255,59,152,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Verify Aadhaar Now →</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Daily Lucky Scratch Card */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={20} color="#FF3B98" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#071B52', margin: 0 }}>Daily Lucky Scratch Card 🎟️</h3>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Refreshes daily at 12:00 AM</span>
                  </div>

                  <div
                    onClick={async () => {
                      if (!rewards?.scratchCardAvailable || isScratching) return;
                      setIsScratching(true);
                      try {
                        const res = await SettingsApi.scratchCard();
                        setRewards((prev) => prev ? { ...prev, scratchCardAvailable: false, shoppingCoins: res.newTotal } : null);
                        setToastMessage(res.message);
                      } catch (err: any) {
                        alert(err.message || 'Already scratched today');
                      } finally {
                        setIsScratching(false);
                      }
                    }}
                    style={{
                      border: '2px dashed #FF3B98',
                      borderRadius: '16px',
                      padding: '32px 20px',
                      textAlign: 'center',
                      background: rewards?.scratchCardAvailable ? 'linear-gradient(135deg, rgba(255,59,152,0.06), rgba(120,86,246,0.06))' : '#F8FAFC',
                      cursor: rewards?.scratchCardAvailable ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {rewards?.scratchCardAvailable ? (
                      <div>
                        <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>✨</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FF3B98' }}>
                          {isScratching ? 'Revealing coins jackpot...' : 'Click to Scratch & Reveal Free Coins!'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>Guaranteed up to 100 shopping coins</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🎉</div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#071B52' }}>You Scratched Today's Card!</div>
                        <div style={{ fontSize: '0.85rem', color: '#16A34A', marginTop: '4px', fontWeight: 700 }}>
                          Current Streak: {rewards?.scratchStreak || 1} Days 🔥 • Come back tomorrow for more coins!
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claim Gift Card / Voucher Section */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Gift size={20} color="#15803D" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#071B52', margin: 0 }}>Claim Gift Card or Voucher 🎁</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 16px' }}>
                    Have a 16-character Worm Up voucher or gift card code (e.g. WELCOME50, WORMUP100)? Enter below to credit your wallet balance instantly.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME50 or WORMUP100"
                      value={claimVoucherCode}
                      onChange={(e) => {
                        setClaimVoucherCode(e.target.value.toUpperCase());
                        setClaimSuccessMessage(null);
                      }}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem', letterSpacing: '1px', fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      disabled={isClaiming || !claimVoucherCode.trim()}
                      onClick={async () => {
                        setIsClaiming(true);
                        try {
                          const res = await SettingsApi.redeemGiftCard(claimVoucherCode.trim());
                          setClaimSuccessMessage(res.message);
                          setClaimVoucherCode('');
                          setToastMessage(res.message);
                        } catch (err: any) {
                          alert(err.message || 'Invalid or expired gift card code');
                        } finally {
                          setIsClaiming(false);
                        }
                      }}
                      style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #FF3B98 0%, #E62280 100%)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
                    >
                      {isClaiming ? 'Claiming...' : 'Claim to Wallet'}
                    </button>
                  </div>
                  {claimSuccessMessage && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.85rem' }}>
                      {claimSuccessMessage}
                    </div>
                  )}
                </div>

                {/* Active Promo Coupons */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '24px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#071B52', marginBottom: '16px' }}>Active Promo Coupons 🏷️</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                    {coupons.map((coupon) => (
                      <div key={coupon.code} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 900, color: '#071B52', fontSize: '1rem', letterSpacing: '0.5px' }}>{coupon.code}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FF3B98', backgroundColor: 'rgba(255,59,152,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{coupon.tag}</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#15803D' }}>{coupon.title}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>{coupon.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            setCopiedCode(coupon.code);
                            setToastMessage(`Coupon ${coupon.code} copied! Paste at checkout.`);
                            setTimeout(() => setCopiedCode(null), 2000);
                          }}
                          style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, color: '#071B52', cursor: 'pointer' }}
                        >
                          {copiedCode === coupon.code ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
                          <span>{copiedCode === coupon.code ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: 7-LEVEL MLM & TEAM DOWNLINE */}
            {accountActiveTab === 'team' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
                      7-Level Team & MLM Downline 🌳
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '4px 0 0' }}>
                      Monitor your 7-level sponsor tree, vegetable GMV performance, and monthly level commission status.
                    </p>
                  </div>
                  <button
                    onClick={loadTeamData}
                    disabled={isLoadingTeam}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#071B52',
                      cursor: isLoadingTeam ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(7, 27, 82, 0.04)',
                    }}
                  >
                    <RefreshCw size={16} className={isLoadingTeam ? 'animate-spin' : ''} />
                    <span>{isLoadingTeam ? 'Refreshing...' : 'Refresh Team'}</span>
                  </button>
                </div>

                {/* Referral Link & Share Box */}
                {(() => {
                  const refCode = (user as any)?.referralCode || (user as any)?.referralId || (user as any)?.myReferralCode || (user?.phone ? `WOMUP${String(user.phone).slice(-6)}` : 'WOMUP2026');
                  const shareUrl = `https://womup.shop/?ref=${refCode}`;
                  const waText = encodeURIComponent(`Join WormUp Quick Commerce using my code ${refCode} and get 2,000 Free Shopping Coins! 🥬🚀 ${shareUrl}`);

                  const monthlySpend = Number(teamDashboard?.personalStatus?.monthlyPurchaseValue ?? (user as any)?.monthlyPurchaseValue ?? 0);
                  const isSpendQualified = monthlySpend >= 2000;
                  const directActiveCount = Number(teamDashboard?.personalStatus?.direct5ActiveCount ?? (user as any)?.direct5ActiveCount ?? 0);
                  const isDirectQualified = directActiveCount >= 5;
                  const isOverallQualified = Boolean(teamDashboard?.personalStatus?.isQualified ?? (isSpendQualified && isDirectQualified));

                  const teamSummary = teamDashboard?.teamSummary || {
                    totalTeamSize: 0,
                    totalActiveMembers: 0,
                    totalVegGmv: 0,
                    totalOtherGmv: 0,
                    estimatedMonthlyLevelIncome: 0,
                  };

                  const defaultLevels = [
                    { level: 1, percentage: 5.0 },
                    { level: 2, percentage: 3.0 },
                    { level: 3, percentage: 2.0 },
                    { level: 4, percentage: 1.0 },
                    { level: 5, percentage: 1.0 },
                    { level: 6, percentage: 0.5 },
                    { level: 7, percentage: 0.5 },
                  ];

                  const levelRows = teamDashboard?.levelBreakdown && teamDashboard.levelBreakdown.length > 0
                    ? teamDashboard.levelBreakdown
                    : defaultLevels.map((dl) => ({
                        level: dl.level,
                        totalMembers: 0,
                        activeMembers: 0,
                        vegGmv: 0,
                        otherGmv: 0,
                        percentage: dl.percentage,
                        potentialIncome: 0,
                      }));

                  return (
                    <>
                      {/* Hero Referral Card */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #071B52 0%, #172554 100%)',
                          borderRadius: '24px',
                          padding: '28px',
                          color: '#FFFFFF',
                          boxShadow: '0 12px 36px rgba(7, 27, 82, 0.18)',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#93C5FD', letterSpacing: '1px', textTransform: 'uppercase' }}>
                              Your Unique Referral Sponsor Code
                            </span>
                            <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '2px', color: '#FCD34D', margin: '4px 0' }}>
                              {refCode}
                            </div>
                            <p style={{ fontSize: '0.86rem', color: '#CBD5E1', margin: 0, maxWidth: '480px' }}>
                              Share your invite link. When friends sign up and shop fresh vegetables & groceries, they earn ₹2,000 coins and you unlock 7 levels of monthly residual income!
                            </p>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                setReferralCopied(true);
                                setTimeout(() => setReferralCopied(false), 2200);
                              }}
                              style={{
                                background: referralCopied ? '#16A34A' : '#FF3B98',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px 20px',
                                fontSize: '0.92rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 6px 20px rgba(255, 59, 152, 0.35)',
                              }}
                            >
                              {referralCopied ? <Check size={18} /> : <Copy size={18} />}
                              <span>{referralCopied ? 'Link Copied!' : 'Copy Invite Link'}</span>
                            </button>

                            <a
                              href={`https://api.whatsapp.com/send?text=${waText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: '#25D366',
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                borderRadius: '12px',
                                padding: '12px 20px',
                                fontSize: '0.92rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)',
                              }}
                            >
                              <Share2 size={18} />
                              <span>Share on WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Qualification Criteria Cards (2 Core Rules) */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                        {/* Rule 1: Monthly Personal Purchase */}
                        <div
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '20px',
                            border: `1.5px solid ${isSpendQualified ? '#86EFAC' : '#FCD34D'}`,
                            padding: '22px',
                            boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                              Rule 1: Monthly Personal Purchase
                            </span>
                            <span
                              style={{
                                background: isSpendQualified ? '#DCFCE7' : '#FEF3C7',
                                color: isSpendQualified ? '#15803D' : '#B45309',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '20px',
                              }}
                            >
                              {isSpendQualified ? '✅ Qualified' : '❌ Need ₹2,000'}
                            </span>
                          </div>
                          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: isSpendQualified ? '#15803D' : '#071B52' }}>
                            ₹{monthlySpend.toLocaleString('en-IN')} <span style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: 600 }}>/ ₹2,000</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', margin: '12px 0 8px' }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.round((monthlySpend / 2000) * 100))}%`,
                                height: '100%',
                                background: isSpendQualified ? '#16A34A' : '#F59E0B',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                            {isSpendQualified
                              ? 'Your personal grocery/veg orders meet the minimum monthly requirement!'
                              : `Shop for ₹${Math.max(0, 2000 - monthlySpend).toLocaleString('en-IN')} more this month to activate your level income eligibility.`}
                          </p>
                        </div>

                        {/* Rule 2: Minimum 5 Direct Active */}
                        <div
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '20px',
                            border: `1.5px solid ${isDirectQualified ? '#86EFAC' : '#FCD34D'}`,
                            padding: '22px',
                            boxShadow: '0 4px 16px rgba(7, 27, 82, 0.04)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                              Rule 2: Direct Active Downline
                            </span>
                            <span
                              style={{
                                background: isDirectQualified ? '#DCFCE7' : '#FEF3C7',
                                color: isDirectQualified ? '#15803D' : '#B45309',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '20px',
                              }}
                            >
                              {isDirectQualified ? '✅ Qualified' : `❌ ${directActiveCount}/5 Members`}
                            </span>
                          </div>
                          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: isDirectQualified ? '#15803D' : '#071B52' }}>
                            {directActiveCount} <span style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: 600 }}>/ 5 Active Directs</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', margin: '12px 0 8px' }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.round((directActiveCount / 5) * 100))}%`,
                                height: '100%',
                                background: isDirectQualified ? '#16A34A' : '#F59E0B',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                            {isDirectQualified
                              ? 'You have 5 or more active direct team members placing monthly orders!'
                              : `Refer ${Math.max(0, 5 - directActiveCount)} more active friends to unlock all 7 downline commission levels.`}
                          </p>
                        </div>
                      </div>

                      {/* Overall Status Banner */}
                      <div
                        style={{
                          background: isOverallQualified ? '#F0FDF4' : '#FFFBEB',
                          border: `1.5px solid ${isOverallQualified ? '#BBF7D0' : '#FDE68A'}`,
                          borderRadius: '16px',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>{isOverallQualified ? '🏆' : '💡'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isOverallQualified ? '#166534' : '#92400E' }}>
                            {isOverallQualified
                              ? '100% Qualified for Downline Income Payouts!'
                              : 'Level Qualification Notice'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: isOverallQualified ? '#15803D' : '#78350F', marginTop: '2px' }}>
                            {isOverallQualified
                              ? 'Both personal spend (≥ ₹2k) and 5 direct active requirements are fulfilled. Your daily level earnings are credited to your Available Wallet automatically.'
                              : 'To withdraw or spend downline commissions, please ensure your monthly purchases reach ₹2,000 and you have at least 5 active direct referrals.'}
                          </div>
                        </div>
                      </div>

                      {/* KPI Summary Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px' }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Downline Team</div>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#071B52', margin: '6px 0 2px' }}>
                            {(teamSummary.totalTeamSize ?? 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#16A34A', fontWeight: 700 }}>Across 7 Levels</div>
                        </div>

                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px' }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active Members</div>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803D', margin: '6px 0 2px' }}>
                            {(teamSummary.totalActiveMembers ?? 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Shopping this month</div>
                        </div>

                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px' }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Vegetable GMV 🥬</div>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284C7', margin: '6px 0 2px' }}>
                            ₹{(teamSummary.totalVegGmv ?? 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#0284C7', fontWeight: 700 }}>Fresh Produce Turnover</div>
                        </div>

                        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px' }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Est. Monthly Income</div>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7C3AED', margin: '6px 0 2px' }}>
                            ₹{(teamSummary.estimatedMonthlyLevelIncome ?? 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#7C3AED', fontWeight: 700 }}>Calculated from GMV</div>
                        </div>
                      </div>

                      {/* 7-Level Downline Breakdown Table */}
                      <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                              7-Level Hierarchy Breakdown
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                              Level percentages are applied to vegetable GMV and other product turnover
                            </p>
                          </div>
                          <span style={{ fontSize: '0.78rem', background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                            7 Levels Active
                          </span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC', color: '#475569', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th style={{ padding: '14px 20px' }}>Level</th>
                                <th style={{ padding: '14px 16px' }}>Total Members</th>
                                <th style={{ padding: '14px 16px' }}>Active Shoppers</th>
                                <th style={{ padding: '14px 16px' }}>Veg GMV 🥬</th>
                                <th style={{ padding: '14px 16px' }}>Other GMV 🛒</th>
                                <th style={{ padding: '14px 16px' }}>Commission %</th>
                                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Est. Income</th>
                              </tr>
                            </thead>
                            <tbody>
                              {levelRows.map((lvl, idx) => (
                                <tr
                                  key={lvl.level || idx + 1}
                                  style={{
                                    borderBottom: idx === levelRows.length - 1 ? 'none' : '1px solid #F1F5F9',
                                    transition: 'background 0.15s ease',
                                  }}
                                >
                                  <td style={{ padding: '14px 20px', fontWeight: 800, color: '#071B52' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EFF6FF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                                        {lvl.level || idx + 1}
                                      </span>
                                      <span>Level {lvl.level || idx + 1}</span>
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 16px', color: '#1E293B', fontWeight: 700 }}>
                                    {(lvl.totalMembers ?? 0).toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '14px 16px' }}>
                                    <span style={{ color: (lvl.activeMembers ?? 0) > 0 ? '#15803D' : '#94A3B8', fontWeight: 700 }}>
                                      {(lvl.activeMembers ?? 0).toLocaleString('en-IN')}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 16px', color: '#0284C7', fontWeight: 700 }}>
                                    ₹{(lvl.vegGmv ?? 0).toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>
                                    ₹{(lvl.otherGmv ?? 0).toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '14px 16px' }}>
                                    <span style={{ background: '#FDF2F8', color: '#BE185D', padding: '3px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem' }}>
                                      {lvl.percentage ?? (idx === 0 ? 5 : idx === 1 ? 3 : idx === 2 ? 2 : idx < 5 ? 1 : 0.5)}%
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 900, color: (lvl.potentialIncome ?? 0) > 0 ? '#15803D' : '#64748B' }}>
                                    ₹{(lvl.potentialIncome ?? 0).toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Transparent Policy Footer */}
                      <div style={{ background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '18px 22px', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 800, color: '#071B52', marginBottom: '4px' }}>
                          📌 Important SRS Compensation Rules
                        </div>
                        <div>
                          • All level calculations settle daily at midnight based on delivered customer orders.
                        </div>
                        <div>
                          • To receive downline commissions for any calendar month, the customer must maintain at least ₹2,000 in personal monthly spend (including fresh produce) and have 5 direct active customers.
                        </div>
                        <div>
                          • Withdrawals can be requested once your Available Income reaches ₹600 or more.
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {accountActiveTab === 'notifications' && (
              <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Bell size={24} color="#071B52" />
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>Notification Preferences</h2>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '24px' }}>
                  Configure what updates you receive. Changes sync in real-time across your Mobile App and Web sessions.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    {
                      key: 'liveOrderTracking',
                      title: 'Live Order & Rider Tracking',
                      desc: 'Real-time push notifications when rider departs store and arrives at doorstep',
                      checked: settings?.notificationPrefs?.liveOrderTracking ?? true,
                    },
                    {
                      key: 'whatsappInvoices',
                      title: 'WhatsApp Order Invoices',
                      desc: 'Receive digital invoice PDF and order dispatch summaries directly on WhatsApp',
                      checked: settings?.notificationPrefs?.whatsappInvoices ?? true,
                    },
                    {
                      key: 'exclusiveOffers',
                      title: 'Exclusive Offers & Festive Discounts',
                      desc: 'Special flash sale alerts, coupon codes, and coin drop notifications',
                      checked: settings?.notificationPrefs?.exclusiveOffers ?? true,
                    },
                    {
                      key: 'pushNotifications',
                      title: 'Push Notifications',
                      desc: 'System delivery notifications and security reminders in browser',
                      checked: settings?.notificationPrefs?.pushNotifications ?? true,
                    },
                    {
                      key: 'emailMarketing',
                      title: 'Email Newsletters & Seasonal Recaps',
                      desc: 'Weekly savings roundups and fresh recipes sent to your registered email',
                      checked: settings?.notificationPrefs?.emailMarketing ?? false,
                    },
                  ].map((notif) => (
                    <div key={notif.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                      <div style={{ flex: 1, paddingRight: '20px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#071B52' }}>{notif.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>{notif.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notif.checked}
                        onChange={async (e) => {
                          const val = e.target.checked;
                          setSettings((prev) => prev ? {
                            ...prev,
                            notificationPrefs: { ...prev.notificationPrefs, [notif.key]: val },
                          } : null);
                          await SettingsApi.updateNotifications({ [notif.key]: val });
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#15803D' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SETTINGS (PRIVACY & PAYMENT) */}
            {accountActiveTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Privacy & Security */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Shield size={24} color="#071B52" />
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>Account Privacy & Security</h2>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '20px' }}>
                    Manage data collection, catalog visibility, and privacy preferences.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                      <div style={{ flex: 1, paddingRight: '20px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#071B52' }}>Personalized Product Feeds</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Show smart recommendations and reorder shelves based on past orders</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings?.personalizedFeeds ?? true}
                        onChange={async (e) => {
                          const val = e.target.checked;
                          setSettings((prev) => prev ? { ...prev, personalizedFeeds: val } : null);
                          await SettingsApi.updatePrivacy({ personalizedFeeds: val });
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#15803D' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                      <div style={{ flex: 1, paddingRight: '20px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#071B52' }}>Anonymous Usage Analytics</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Help us optimize 9-minute dark store dispatching speed and app UX</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings?.anonymousAnalytics ?? true}
                        onChange={async (e) => {
                          const val = e.target.checked;
                          setSettings((prev) => prev ? { ...prev, anonymousAnalytics: val } : null);
                          await SettingsApi.updatePrivacy({ anonymousAnalytics: val });
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#15803D' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                      <div style={{ flex: 1, paddingRight: '20px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#071B52' }}>Hide Sensitive Items</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Filter out sexual wellness, nicotine, and contraceptives from catalog feeds</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings?.hideSensitiveItems ?? false}
                        onChange={async (e) => {
                          const val = e.target.checked;
                          setSettings((prev) => prev ? { ...prev, hideSensitiveItems: val } : null);
                          await SettingsApi.updatePrivacy({ hideSensitiveItems: val });
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#15803D' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await SettingsApi.clearHistory();
                          setToastMessage(res.message);
                        } catch (err: any) {
                          alert(err.message || 'Failed to clear history');
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                      <span>Clear Search & Browsing History</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await SettingsApi.downloadDataArchive();
                          setToastMessage(res.message);
                        } catch (err: any) {
                          alert(err.message || 'Failed to request archive');
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#071B52', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      <Download size={16} />
                      <span>Download Personal Data Archive</span>
                    </button>
                  </div>
                </div>

                {/* Payment Settings (UPI & COD) */}
                <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E6EAF2', padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <CreditCard size={24} color="#071B52" />
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#071B52', margin: 0 }}>Payment Settings (UPI & COD)</h2>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '20px' }}>
                    Saved UPI payment IDs for 1-click checkout and Cash on Delivery preferences.
                  </p>

                  {/* Saved UPI List */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>Saved Payment Methods</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(paymentMethods?.methods || [{ type: 'UPI', upiId: 'thankiayushi@okhdfcbank', isDefault: true, verified: true, label: 'Primary UPI' }]).map((method: any, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '12px', border: method.isDefault ? '1.5px solid #15803D' : '1px solid #E2E8F0', backgroundColor: method.isDefault ? '#F0FDF4' : '#FFFFFF' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: method.isDefault ? '#DCFCE7' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: method.isDefault ? '#15803D' : '#64748B' }}>
                              <CheckCircle2 size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#071B52' }}>{method.upiId || method.label}</div>
                              <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700 }}>
                                {method.isDefault ? 'Default for 1-Click Checkout ✓' : 'Verified UPI VPA'}
                              </div>
                            </div>
                          </div>
                          {!method.isDefault && method._id && (
                            <button
                              type="button"
                              onClick={async () => {
                                const updated = await SettingsApi.setDefaultPaymentMethod(method._id);
                                setPaymentMethods(updated);
                              }}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Set Default
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add New UPI */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>Add New UPI VPA</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="e.g. mobile@paytm or name@okhdfcbank"
                        value={newUpiInput}
                        onChange={(e) => setNewUpiInput(e.target.value)}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                      />
                      <button
                        type="button"
                        disabled={isVerifyingUpi || !newUpiInput.trim()}
                        onClick={async () => {
                          const clean = newUpiInput.trim();
                          if (!clean || !clean.includes('@')) {
                            alert('Please enter a valid UPI VPA (e.g. name@okhdfcbank)');
                            return;
                          }
                          setIsVerifyingUpi(true);
                          try {
                            const verified = await SettingsApi.verifyUpi(clean);
                            const updated = await SettingsApi.addPaymentMethod({
                              type: 'UPI',
                              upiId: verified.upiId,
                              label: `${verified.accountHolder} (${verified.bank})`,
                              isDefault: true,
                            });
                            setPaymentMethods(updated);
                            setNewUpiInput('');
                            setToastMessage(`UPI ID verified via NPCI (${verified.bank}) & saved!`);
                          } catch (err: any) {
                            alert(err.message || 'Could not verify UPI ID');
                          } finally {
                            setIsVerifyingUpi(false);
                          }
                        }}
                        style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#15803D', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        {isVerifyingUpi ? 'Verifying NPCI...' : 'Verify & Link UPI'}
                      </button>
                    </div>
                  </div>

                  {/* Cash on Delivery (COD) Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#071B52' }}>Cash on Delivery (COD)</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>Enable cash payment option when order is delivered to your doorstep</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentMethods?.codEnabled ?? true}
                      onChange={async (e) => {
                        const val = e.target.checked;
                        setPaymentMethods((prev) => prev ? { ...prev, codEnabled: val } : null);
                        await SettingsApi.toggleCod(val);
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#15803D' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Global Settings Toast */}
            {toastMessage && (
              <div
                style={{
                  position: 'fixed',
                  bottom: '30px',
                  right: '30px',
                  backgroundColor: '#071B52',
                  color: '#FFFFFF',
                  padding: '14px 22px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 30px rgba(7, 27, 82, 0.3)',
                  zIndex: 9999,
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span>{toastMessage}</span>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '1rem', marginLeft: '6px' }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Aadhaar Verification Modal (SRS Specification) */}
      {isAadhaarModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 27, 82, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsAadhaarModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  🛡️
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#071B52', margin: 0 }}>
                    Aadhaar Verification
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                    Unlock referral rewards & app download income
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAadhaarModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            {aadhaarSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803D', margin: '0 0 6px' }}>
                  Aadhaar Verified Successfully!
                </h4>
                <p style={{ color: '#64748B', fontSize: '0.85rem' }}>{aadhaarSuccess}</p>
                <button
                  type="button"
                  onClick={() => setIsAadhaarModalOpen(false)}
                  style={{
                    marginTop: '16px',
                    backgroundColor: '#15803D',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close & View Wallet
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const cleanAadhaar = aadhaarInput.replace(/\D/g, '');
                  if (cleanAadhaar.length !== 12) {
                    setAadhaarError('Please enter a valid 12-digit Aadhaar number');
                    return;
                  }
                  if (!aadhaarNameInput.trim()) {
                    setAadhaarError('Please enter full name exactly as per Aadhaar card');
                    return;
                  }
                  setIsVerifyingAadhaar(true);
                  setAadhaarError(null);
                  try {
                    const res = await verifyAadhaar(cleanAadhaar, aadhaarNameInput.trim());
                    setIsVerifyingAadhaar(false);
                    if (res.success) {
                      setAadhaarSuccess(res.message || 'Your account is now verified! Referral benefits unlocked.');
                    } else {
                      setAadhaarError(res.message || 'Verification failed. Please check details.');
                    }
                  } catch (err: any) {
                    setIsVerifyingAadhaar(false);
                    setAadhaarError(err.message || 'Verification request failed');
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#071B52', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Full Name (As Per Aadhaar) *
                  </label>
                  <input
                    type="text"
                    value={aadhaarNameInput}
                    onChange={(e) => setAadhaarNameInput(e.target.value)}
                    placeholder="e.g. Darshan Kumar Thanki"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#071B52', marginBottom: '6px', textTransform: 'uppercase' }}>
                    12-Digit Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="XXXX XXXX XXXX"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '1rem',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    required
                  />
                  <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px' }}>
                    🔒 256-bit encrypted validation according to UIDAI compliance
                  </div>
                </div>

                {aadhaarError && (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: '0.82rem', fontWeight: 700 }}>
                    {aadhaarError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingAadhaar || aadhaarInput.replace(/\D/g, '').length !== 12 || !aadhaarNameInput.trim()}
                  style={{
                    background:
                      aadhaarInput.replace(/\D/g, '').length === 12 && aadhaarNameInput.trim()
                        ? 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)'
                        : '#E2E8F0',
                    color:
                      aadhaarInput.replace(/\D/g, '').length === 12 && aadhaarNameInput.trim()
                        ? '#FFFFFF'
                        : '#94A3B8',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px',
                    fontWeight: 800,
                    fontSize: '0.96rem',
                    cursor:
                      aadhaarInput.replace(/\D/g, '').length === 12 && aadhaarNameInput.trim()
                        ? 'pointer'
                        : 'not-allowed',
                    boxShadow:
                      aadhaarInput.replace(/\D/g, '').length === 12 && aadhaarNameInput.trim()
                        ? '0 6px 20px rgba(22, 163, 74, 0.3)'
                        : 'none',
                  }}
                >
                  {isVerifyingAadhaar ? 'Verifying with Government Records...' : 'Verify & Unlock Benefits'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Income Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 27, 82, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setIsWithdrawModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} color="#64748B" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#071B52', margin: 0 }}>
                  Withdraw Available Balance
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                  Direct payout to your verified Bank Account or UPI
                </p>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '14px 18px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Available For Withdrawal
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#047857' }}>
                ₹{Number(user?.availableIncome ?? 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                Policy: Minimum payout request is ₹600.
              </div>
            </div>

            {withdrawSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎉</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803D', marginBottom: '6px' }}>
                  Request Submitted Successfully!
                </div>
                <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
                  {withdrawSuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#071B52', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Withdrawal Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="600"
                    max={Number(user?.availableIncome ?? 0)}
                    step="1"
                    placeholder="e.g. 1000 (Min ₹600)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#071B52', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Bank Account / IFSC or UPI ID *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okhdfcbank or 1234567890 (HDFC0001234)"
                    value={withdrawBankInput}
                    onChange={(e) => setWithdrawBankInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                {withdrawError && (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: '0.82rem', fontWeight: 700 }}>
                    {withdrawError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || !withdrawAmount || !withdrawBankInput}
                  style={{
                    background: isSubmittingWithdraw ? '#94A3B8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px',
                    fontWeight: 800,
                    fontSize: '0.96rem',
                    cursor: isSubmittingWithdraw ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmittingWithdraw && <Loader2 size={18} className="animate-spin" />}
                  <span>{isSubmittingWithdraw ? 'Submitting Request...' : 'Submit Withdrawal Request'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Live Order Tracking Modal */}
      <OrderTrackingModal
        order={selectedOrderForTracking}
        onClose={() => setSelectedOrderForTracking(null)}
      />
      </div>
    </div>
  );
};
