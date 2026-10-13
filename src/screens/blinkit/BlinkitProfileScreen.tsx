import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { AppIcon, IconName } from '../../components/common/AppIcon';
import { useApp } from '../../context/AppContext';
import { Address, BlinkitProduct, UserProfile } from '../../types';
import { StorageService } from '../../services/storageService';
import { api } from '../../services/api';
import { AddressService } from '../../services/addressService';
import { AuthService } from '../../services/authService';
import { SettingsService } from '../../services/settingsService';


export const BlinkitProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    user,
    setUser,
    logout,
    walletBalance,
    addWalletBalance,
    hideSensitiveItems,
    setHideSensitiveItems,
    appearance,
    setAppearance,
    setActiveScreen,
    selectedAddress,
    setSelectedAddress,
    wishlist,
    updateBlinkitQty,
    goBack,
  } = useApp();

  // Sync live profile and settings data directly from MongoDB Atlas when Profile screen opens
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (api.getToken()) {
          const liveProfile = await AuthService.getProfile();
          if (liveProfile && isMounted) {
            const updatedUser: UserProfile = {
              ...user,
              ...liveProfile,
              savedAddresses:
                user.savedAddresses && user.savedAddresses.length > 0
                  ? user.savedAddresses
                  : liveProfile.savedAddresses,
            };
            setUser(updatedUser);
            await StorageService.saveItem(StorageService.KEYS.USER, updatedUser);
          }
        }

        const [sRes, pmRes, rwRes] = await Promise.allSettled([
          SettingsService.getSettings(),
          SettingsService.getPaymentMethods(),
          SettingsService.getRewards(),
        ]);

        if (isMounted) {
          if (sRes.status === 'fulfilled' && sRes.value) {
            const s = sRes.value;
            setPrivacyPersonalizedAds(s.personalizedFeeds ?? true);
            setPrivacyAnalytics(s.anonymousAnalytics ?? false);
            if (s.hideSensitiveItems !== undefined) {
              setHideSensitiveItems(s.hideSensitiveItems);
            }
            if (s.notificationPrefs) {
              setNotifOrderUpdates(s.notificationPrefs.liveOrderTracking ?? true);
              setNotifWhatsApp(s.notificationPrefs.whatsappInvoices ?? true);
              setNotifOffers(s.notificationPrefs.exclusiveOffers ?? true);
            }
          }
          if (pmRes.status === 'fulfilled' && pmRes.value) {
            const pm = pmRes.value;
            const defUpi = pm.methods?.find((m: any) => m.isDefault);
            if (defUpi?.upiId) setSavedUpiId(defUpi.upiId);
            if (pm.codEnabled !== undefined) setIsCodEnabled(pm.codEnabled);
          }
          if (rwRes.status === 'fulfilled' && rwRes.value) {
            const rw = rwRes.value;
            setHasScratchedReward(!rw.scratchCardAvailable);
            if (typeof rw.shoppingCoins === 'number') {
              setUser((prev) => ({ ...prev, shoppingCoins: rw.shoppingCoins }));
            }
          }
          const freshProfile = await AuthService.getProfile();
          if (freshProfile && isMounted) {
            setUser((prev) => ({
              ...prev,
              ...freshProfile,
              shoppingCoins: freshProfile.shoppingCoins ?? prev.shoppingCoins ?? 2000,
              verificationStatus: freshProfile.verificationStatus || (freshProfile.aadhaarVerified ? 'VERIFIED' : 'NON_VERIFIED'),
            }));
          }
        }
      } catch (err) {
        console.warn('[BlinkitProfileScreen] Live data sync error:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
  // --- Modal Visibility States ---
  const [isAppearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isBirthdayModalVisible, setBirthdayModalVisible] = useState(false);
  const [isAddressBookModalVisible, setAddressBookModalVisible] = useState(false);
  const [isRecipesModalVisible, setRecipesModalVisible] = useState(false);
  const [isGstModalVisible, setGstModalVisible] = useState(false);
  const [isGiftCardsModalVisible, setGiftCardsModalVisible] = useState(false);
  const [isPrescriptionsModalVisible, setPrescriptionsModalVisible] = useState(false);
  const [isPaymentSettingsModalVisible, setPaymentSettingsModalVisible] = useState(false);
  const [isClaimGiftCardModalVisible, setClaimGiftCardModalVisible] = useState(false);
  const [isRewardsModalVisible, setRewardsModalVisible] = useState(false);
  const [isFeedingIndiaModalVisible, setFeedingIndiaModalVisible] = useState(false);
  const [isDonationReceiptModalVisible, setDonationReceiptModalVisible] = useState(false);
  const [isAboutUsModalVisible, setAboutUsModalVisible] = useState(false);
  const [isPartnerModalVisible, setPartnerModalVisible] = useState(false);
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isNotificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);
  const [isSensitiveInfoModalVisible, setSensitiveInfoModalVisible] = useState(false);

  // --- Functional Interactive Form States ---
  // Birthday — initialized from MongoDB via user.birthday (survives refresh)
  const [birthdayDay, setBirthdayDay] = useState(() => {
    if (user.birthday) {
      const parts = user.birthday.split(' ');
      return parts[0] || '';
    }
    return '';
  });
  const [birthdayMonth, setBirthdayMonth] = useState(() => {
    if (user.birthday) {
      const parts = user.birthday.split(' ');
      return parts[1] || '';
    }
    return '';
  });
  const [birthdayYear, setBirthdayYear] = useState(() => {
    if (user.birthday) {
      const parts = user.birthday.split(' ');
      return parts[2] || '';
    }
    return '';
  });
  // Derive display value directly from user.birthday — always in sync after save
  const savedBirthday = user.birthday || null;

  // GST Details
  const [gstin, setGstin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [savedGst, setSavedGst] = useState<{ gstin: string; businessName: string } | null>(null);

  // Gift Card Claiming & Purchase
  const [claimVoucherCode, setClaimVoucherCode] = useState('');
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [selectedGiftAmount, setSelectedGiftAmount] = useState<number>(500);
  const [giftRecipientPhone, setGiftRecipientPhone] = useState('');
  const [giftCardBalance, setGiftCardBalance] = useState<number>(0);

  // Prescriptions
  const [prescriptionsList, setPrescriptionsList] = useState<Array<{ id: string; name: string; date: string; status: string }>>([
    { id: 'rx_1', name: 'Dr. Mehta Clinic - Wellness Rx.pdf', date: '04 Sep 2026', status: 'Verified' },
  ]);

  // Payment Settings
  const [savedUpiId, setSavedUpiId] = useState('thankiayushi@okhdfcbank');
  const [newUpiInput, setNewUpiInput] = useState('');
  const [isCodEnabled, setIsCodEnabled] = useState(true);

  // Scratch card in Rewards
  const [hasScratchedReward, setHasScratchedReward] = useState(false);
  const [rewardScratchMessage, setRewardScratchMessage] = useState<string | null>(null);

  // Feeding India
  const [isRoundUpForCharity, setIsRoundUpForCharity] = useState(true);

  // Merchant Partner Form
  const [partnerStoreName, setPartnerStoreName] = useState('');
  const [partnerCategory, setPartnerCategory] = useState('Grocery & Essentials');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);

  // Privacy Settings Toggles
  const [privacyPersonalizedAds, setPrivacyPersonalizedAds] = useState(true);
  const [privacyAnalytics, setPrivacyAnalytics] = useState(false);

  // Notification Preferences Toggles
  const [notifOrderUpdates, setNotifOrderUpdates] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);

  // FAQ Accordion
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // --- Handlers ---
  const handleSaveBirthday = async () => {
    if (!birthdayDay || !birthdayMonth || !birthdayYear) {
      Alert.alert('Incomplete Date', 'Please enter your birth day, month, and year.');
      return;
    }
    const day = birthdayDay.trim().padStart(2, '0');
    const month = birthdayMonth.trim();
    const year = birthdayYear.trim();
    const formatted = `${day} ${month} ${year}`; // e.g. "07 August 2005"

    try {
      const res = await SettingsService.updateBirthday(formatted);
      const newCoins = res.newCoinBalance ?? (user.shoppingCoins + (res.coinsAwarded || 0));
      const updatedUser = { ...user, birthday: formatted, shoppingCoins: newCoins };
      setUser(updatedUser);
      StorageService.saveItem(StorageService.KEYS.USER, updatedUser);

      setBirthdayModalVisible(false);
      Alert.alert('Birthday Saved! 🎂', res.message || `Your birthday is set to ${formatted}.`);
    } catch (e: any) {
      // Optimistic fallback
      const updatedUser = { ...user, birthday: formatted };
      setUser(updatedUser);
      StorageService.saveItem(StorageService.KEYS.USER, updatedUser);
      setBirthdayModalVisible(false);
      Alert.alert('Birthday Saved! 🎂', `Your birthday has been updated to ${formatted}.`);
    }
  };

  const handleSaveGst = () => {
    if (gstin.trim().length < 15) {
      Alert.alert('Invalid GSTIN', 'Please enter a valid 15-character GSTIN (e.g. 24AAAAA0000A1Z5).');
      return;
    }
    setSavedGst({ gstin: gstin.toUpperCase(), businessName: businessName || 'Registered Enterprise' });
    setGstModalVisible(false);
    Alert.alert('GST Verified ✓', `GSTIN ${gstin.toUpperCase()} has been saved to your billing profile.`);
  };

  const handleClaimGiftCard = async () => {
    const code = claimVoucherCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Code Required', 'Please enter a gift card code or promo voucher.');
      return;
    }
    try {
      const res = await SettingsService.redeemGiftCard(code);
      if (res.success) {
        addWalletBalance(res.amount);
        setClaimSuccessMessage(res.message);
        setClaimVoucherCode('');
        Alert.alert('Gift Card Claimed! 🎉', res.message);
      }
    } catch (err: any) {
      Alert.alert('Redemption Failed', err.message || 'Invalid or expired gift card code');
    }
  };

  const handlePurchaseGiftCard = () => {
    if (!giftRecipientPhone || giftRecipientPhone.trim().length < 10) {
      Alert.alert('Recipient Required', 'Please enter a valid 10-digit mobile number or email for the recipient.');
      return;
    }
    const generatedCode = `WU-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setGiftCardBalance((prev) => prev + selectedGiftAmount);
    Alert.alert(
      'e-Gift Card Generated! 🎁',
      `Card Value: ₹${selectedGiftAmount}\nGift Code: ${generatedCode}\nSent to: ${giftRecipientPhone}\n\nThe recipient can claim this code under "Claim Gift Card".`,
      [{ text: 'Great!', onPress: () => setGiftCardsModalVisible(false) }]
    );
  };

  const handleUploadPrescriptionSimulated = () => {
    const newRx = {
      id: `rx_${Date.now()}`,
      name: `Prescription_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.png`,
      date: 'Today',
      status: 'Verified',
    };
    setPrescriptionsList((prev) => [newRx, ...prev]);
    Alert.alert('Prescription Uploaded! 📋', 'Your doctor prescription has been uploaded and verified. You can now order prescribed medicines.');
  };

  const handleAddRecipeToCart = (recipeName: string, items: BlinkitProduct[]) => {
    items.forEach((item) => {
      updateBlinkitQty(item, 1);
    });
    Alert.alert('Ingredients Added! 🛒', `All ingredients for "${recipeName}" have been added to your cart.`);
  };

  const handleScratchReward = async () => {
    if (hasScratchedReward) return;
    try {
      const res = await SettingsService.scratchCard();
      setHasScratchedReward(true);
      if (typeof res.newTotal === 'number') {
        setUser((prev) => ({ ...prev, shoppingCoins: res.newTotal }));
      }
      setRewardScratchMessage(res.message);
      Alert.alert('Congratulations! 🎉', res.message);
    } catch (err: any) {
      Alert.alert('Daily Scratch Card', err.message || 'You have already scratched today!');
    }
  };

  // Privacy handlers
  const handleTogglePersonalizedFeeds = async (val: boolean) => {
    setPrivacyPersonalizedAds(val);
    await SettingsService.updatePrivacy({ personalizedFeeds: val }).catch(() => {});
  };

  const handleToggleAnalytics = async (val: boolean) => {
    setPrivacyAnalytics(val);
    await SettingsService.updatePrivacy({ anonymousAnalytics: val }).catch(() => {});
  };

  const handleClearHistory = async () => {
    try {
      const res = await SettingsService.clearHistory();
      Alert.alert('Search History Cleared', res.message);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to clear search history');
    }
  };

  const handleDownloadData = async () => {
    try {
      const res = await SettingsService.downloadDataArchive();
      Alert.alert('Archive Requested 📦', res.message);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to request archive');
    }
  };

  // Notification handlers
  const handleToggleOrderUpdates = async (val: boolean) => {
    setNotifOrderUpdates(val);
    await SettingsService.updateNotifications({ liveOrderTracking: val, orderUpdates: val }).catch(() => {});
  };

  const handleToggleWhatsApp = async (val: boolean) => {
    setNotifWhatsApp(val);
    await SettingsService.updateNotifications({ whatsappInvoices: val }).catch(() => {});
  };

  const handleToggleOffers = async (val: boolean) => {
    setNotifOffers(val);
    await SettingsService.updateNotifications({ exclusiveOffers: val }).catch(() => {});
  };

  // Payment handlers
  const handleVerifyAndAddUpi = async () => {
    const clean = newUpiInput.trim();
    if (!clean || !clean.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid VPA with @ (e.g. name@okhdfcbank)');
      return;
    }
    try {
      const verified = await SettingsService.verifyUpi(clean);
      await SettingsService.addPaymentMethod({
        type: 'UPI',
        upiId: verified.upiId,
        label: `${verified.accountHolder} (${verified.bank})`,
        isDefault: true,
      });
      setSavedUpiId(verified.upiId);
      setNewUpiInput('');
      Alert.alert('UPI Verified ✓', `${verified.accountHolder}'s UPI ID (${verified.bank}) verified via NPCI and set as default.`);
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message || 'Could not verify UPI ID');
    }
  };

  const handleToggleCod = async (val: boolean) => {
    setIsCodEnabled(val);
    await SettingsService.toggleCod(val).catch(() => {});
  };

  const handleShareApp = async () => {
    const shareMessage = `Hey! I get fresh groceries, snacks and prints delivered in 9 minutes with Worm Up! 🚀\nUse my referral code ${user.referralCode || 'WORMUP50'} to get ₹50 off your first order.\nDownload now: https://wormup.app/invite`;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert('Referral Copied! 📋', 'Referral code & download link copied to clipboard. Share with your friends!');
        } else {
          Alert.alert('Referral Code', `Your referral code is: ${user.referralCode || 'WORMUP50'}\nShare with friends to earn coins!`);
        }
      } else {
        await Share.share({ message: shareMessage });
      }
    } catch (e) {
      Alert.alert('Share Worm Up', shareMessage);
    }
  };

  const copyCouponCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    Alert.alert('Code Copied! ✂️', `Coupon code "${code}" copied to clipboard. Paste at checkout!`);
  };

  const handleDeleteSavedAddress = (targetAddr: Address) => {
    const targetId = targetAddr.id || (targetAddr as any)._id || '';
    const label = targetAddr.type || 'Saved Address';
    const message = `Are you sure you want to remove "${label}" from your saved addresses?`;

    const performDelete = async () => {
      try {
        const currentList = user.savedAddresses || [];
        const updated = currentList.filter((a) => {
          const aId = a.id || (a as any)._id;
          if (targetId) return aId !== targetId;
          return a.houseFlat !== targetAddr.houseFlat || a.city !== targetAddr.city;
        });
        const updatedProfile = { ...user, savedAddresses: updated };
        setUser(updatedProfile);
        await StorageService.saveItem(StorageService.KEYS.USER, updatedProfile);

        if (selectedAddress?.id === targetId || (selectedAddress as any)?._id === targetId) {
          if (updated.length > 0) {
            setSelectedAddress(updated[0]);
          } else {
            setSelectedAddress(null as any);
          }
        }

        if (targetId && !targetId.startsWith('current_')) {
          try {
            await AddressService.deleteAddress(targetId);
          } catch (e) {
            console.warn('[BlinkitProfileScreen] Backend delete address notice:', e);
          }
        }
      } catch (e) {
        console.error('[BlinkitProfileScreen] Delete address error:', e);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        performDelete();
      }
    } else {
      Alert.alert('Remove Address', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  // Recipe sample data with ingredients for 1-click cart addition
  const SAMPLE_RECIPES = [
    {
      title: 'Paneer Butter Masala (10 Mins)',
      time: '10 mins',
      difficulty: 'Easy',
      ingredientsCount: 3,
      items: [
        {
          id: 'rec_p1',
          name: 'Amul Fresh Malai Paneer',
          brand: 'Amul',
          category: 'Dairy',
          packSize: '200 g',
          sellingPrice: 85,
          mrp: 90,
          deliveryMinutes: 9,
          rating: 4.8,
          reviewCount: 420,
          stock: 50,
          imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&q=80',
        },
        {
          id: 'rec_p2',
          name: 'Mother Dairy Fresh Cream',
          brand: 'Mother Dairy',
          category: 'Dairy',
          packSize: '250 ml',
          sellingPrice: 65,
          mrp: 70,
          deliveryMinutes: 9,
          rating: 4.7,
          reviewCount: 210,
          stock: 40,
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80',
        },
        {
          id: 'rec_p3',
          name: 'Everest Shahi Paneer Masala',
          brand: 'Everest',
          category: 'Masala',
          packSize: '100 g',
          sellingPrice: 42,
          mrp: 45,
          deliveryMinutes: 9,
          rating: 4.9,
          reviewCount: 650,
          stock: 60,
          imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=80',
        },
      ],
    },
    {
      title: 'Healthy Avocado Toast & Coffee',
      time: '5 mins',
      difficulty: 'Super Fast',
      ingredientsCount: 2,
      items: [
        {
          id: 'rec_a1',
          name: 'Fresh Hass Avocado (Imported)',
          brand: 'Farm Fresh',
          category: 'Fruits',
          packSize: '1 pc (180-220g)',
          sellingPrice: 110,
          mrp: 140,
          deliveryMinutes: 9,
          rating: 4.6,
          reviewCount: 150,
          stock: 30,
          imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&q=80',
        },
        {
          id: 'rec_a2',
          name: 'The Health Factory Zero Maida Bread',
          brand: 'The Health Factory',
          category: 'Bakery',
          packSize: '350 g',
          sellingPrice: 60,
          mrp: 65,
          deliveryMinutes: 9,
          rating: 4.9,
          reviewCount: 380,
          stock: 45,
          imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80',
        },
      ],
    },
  ];

  const renderSectionCard = (
    title: string,
    rows: { icon: IconName; label: string; badge?: string; isDestructive?: boolean; onPress?: () => void }[]
  ) => (
    <View style={styles.sectionGroup}>
      <Text style={[TYPOGRAPHY.sectionTitle, styles.sectionHeaderTitle]}>{title}</Text>
      <View style={styles.cardBlock}>
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1;
          return (
            <TouchableOpacity
              key={row.label}
              activeOpacity={0.7}
              onPress={row.onPress}
              style={[styles.listRow, !isLast && styles.listRowBorder]}
            >
              <View style={styles.rowLeft}>
                <AppIcon
                  name={row.icon}
                  size={18}
                  color={row.isDestructive ? COLORS.error : COLORS.textPrimary}
                />
                <Text
                  style={[
                    TYPOGRAPHY.bodyMd,
                    styles.rowLabel,
                    row.isDestructive && { color: COLORS.error, fontWeight: '600' },
                  ]}
                >
                  {row.label}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {row.badge ? (
                  <View style={styles.rowBadge}>
                    <Text style={styles.rowBadgeText}>{row.badge}</Text>
                  </View>
                ) : null}
                <AppIcon name="chevron-right" size={18} color={COLORS.secondaryText} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compact Navy Header with Circular Back Button */}
        <LinearGradient
          colors={GRADIENTS.navyHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.topHeaderGradient, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={goBack}
            style={styles.backButtonCircle}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow-left" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Centered Avatar and User Header */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <AppIcon name="user" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.accountHeading}>{user.fullName || 'Ayushi Thanki'}</Text>
            {user.email ? (
              <Text style={styles.emailText}>{user.email}</Text>
            ) : null}
            <Text style={styles.phoneNumberText}>
              {user.phoneNumber ? `+91 ${user.phoneNumber}` : '+91 98765 43210'}
            </Text>

            {/* SRS Verification Status & Sponsor Pill */}
            <View style={styles.profileBadgeRow}>
              <View
                style={[
                  styles.verificationPill,
                  (user.verificationStatus === 'VERIFIED' || user.aadhaarVerified)
                    ? styles.pillVerified
                    : styles.pillUnverified,
                ]}
              >
                <Ionicons
                  name={
                    user.verificationStatus === 'VERIFIED' || user.aadhaarVerified
                      ? 'shield-checkmark'
                      : 'shield-outline'
                  }
                  size={12}
                  color={
                    user.verificationStatus === 'VERIFIED' || user.aadhaarVerified
                      ? '#15803D'
                      : '#D97706'
                  }
                />
                <Text
                  style={[
                    styles.pillText,
                    user.verificationStatus === 'VERIFIED' || user.aadhaarVerified
                      ? styles.pillTextVerified
                      : styles.pillTextUnverified,
                  ]}
                >
                  {user.verificationStatus === 'VERIFIED' || user.aadhaarVerified
                    ? 'Aadhaar Verified'
                    : 'Non-Verified Member'}
                </Text>
              </View>

              {user.sponsorCode ? (
                <View style={styles.sponsorPill}>
                  <Text style={styles.sponsorPillText}>Sponsor: {user.sponsorCode}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.bodyContent}>
          {/* Birthday Banner */}
          <View style={styles.birthdayCard}>
            <View style={styles.birthdayLeft}>
              <Text style={styles.birthdayTitle}>
                {savedBirthday ? `Birthday: ${savedBirthday} 🎂` : 'Add your birthday'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setBirthdayModalVisible(true)}
                style={styles.birthdayLinkBtn}
              >
                <Text style={styles.birthdayLinkText}>
                  {savedBirthday ? 'Update details ▸' : 'Enter details & get 50 coins ▸'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.birthdayCakeEmoji}>🎂</Text>
          </View>

          {/* Quick Actions Row: 3 Equal Cards */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveScreen('Blinkit_OrderAgain')}
              style={styles.quickActionCard}
            >
              <AppIcon name="shopping-basket" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionLabel}>Your orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveScreen('Blinkit_Money')}
              style={styles.quickActionCard}
            >
              <AppIcon name="wallet" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionLabel}>Worm Up Money</Text>
              <Text style={styles.quickActionSubLabel}>🪙 {user.shoppingCoins ?? 2000} Coins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setHelpModalVisible(true)}
              style={styles.quickActionCard}
            >
              <AppIcon name="message-circle" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionLabel}>Need help?</Text>
            </TouchableOpacity>
          </View>

          {/* Hide Sensitive Items Row */}
          <View style={styles.cardBlockStandalone}>
            <View style={styles.sensitiveRow}>
              <View style={styles.sensitiveLeftIcon}>
                <AppIcon name="eye-off" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.sensitiveCenterText}>
                <Text style={[TYPOGRAPHY.bodyMdMedium, styles.sensitiveTitle]}>
                  Hide sensitive items
                </Text>
                <Text style={[TYPOGRAPHY.caption, styles.sensitiveDesc]}>
                  Sexual wellness, nicotine products and other sensitive items will be hidden
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSensitiveInfoModalVisible(true)}
                >
                  <Text style={styles.knowMoreText}>Know more</Text>
                </TouchableOpacity>
              </View>
              <Switch
                value={hideSensitiveItems}
                onValueChange={setHideSensitiveItems}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* Section 1: Your Information */}
          {renderSectionCard('Your information', [
            {
              icon: 'map-pin',
              label: 'Address book',
              badge: `${user.savedAddresses?.length || 2} saved`,
              onPress: () => setAddressBookModalVisible(true),
            },
            {
              icon: 'heart',
              label: 'Your wishlist',
              badge: wishlist.length > 0 ? `${wishlist.length}` : undefined,
              onPress: () => setActiveScreen('Blinkit_Wishlist'),
            },
          ])}

          {/* Section 2: Payment and coupons */}
          {renderSectionCard('Payment and coupons', [
            {
              icon: 'wallet',
              label: 'Worm Up Money',
              badge: `₹${walletBalance}`,
              onPress: () => setActiveScreen('Blinkit_Money'),
            },
            {
              icon: 'credit-card',
              label: 'Payment settings',
              onPress: () => setPaymentSettingsModalVisible(true),
            },
            {
              icon: 'gift',
              label: 'Claim Gift card',
              onPress: () => setClaimGiftCardModalVisible(true),
            },
            {
              icon: 'tag',
              label: 'Your collected rewards',
              badge: `${user.shoppingCoins} Coins`,
              onPress: () => setRewardsModalVisible(true),
            },
          ])}

          {/* Section 3: Eternal Foundation */}
          {renderSectionCard('Eternal Foundation', [
            {
              icon: 'heart',
              label: 'Feeding India impact',
              badge: '8 meals funded',
              onPress: () => setFeedingIndiaModalVisible(true),
            },
          ])}

          {/* Section 4: Other Information */}
          {renderSectionCard('Other Information', [
            {
              icon: 'share-2',
              label: 'Share the app',
              badge: 'Earn ₹50',
              onPress: handleShareApp,
            },
            {
              icon: 'help-circle',
              label: 'About us',
              onPress: () => setAboutUsModalVisible(true),
            },
            {
              icon: 'lock',
              label: 'Account privacy',
              onPress: () => setPrivacyModalVisible(true),
            },
            {
              icon: 'bell',
              label: 'Notification preferences',
              onPress: () => setNotificationsModalVisible(true),
            },
            {
              icon: 'log-out',
              label: 'Log out',
              isDestructive: true,
              onPress: () => setLogoutModalVisible(true),
            },
          ])}

          {/* Footer Wordmark and Version */}
          <View style={styles.footerSection}>
            <View style={styles.footerBrandRow}>
              <View style={styles.footerDot} />
              <Text style={styles.footerWordmark}>worm up</Text>
            </View>
            <Text style={styles.footerTagline}>Groceries & Documents in 9 Minutes</Text>
            <Text style={styles.footerVersion}>v2.4.0 (Build 2026.09)</Text>
          </View>
        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────
          1. BIRTHDAY MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isBirthdayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBirthdayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>
                {savedBirthday ? 'Update Birthday 🎂' : 'Add your Birthday 🎂'}
              </Text>
              <TouchableOpacity onPress={() => setBirthdayModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              {savedBirthday
                ? `Current: ${savedBirthday}. Update below to change.`
                : 'Celebrate your special day with exclusive discounts and 50 bonus Shopping Coins!'}
            </Text>

            {/* 3-field date input: Day | Month | Year */}
            <View style={styles.bdayInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputFieldLabel}>Day</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="07"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={birthdayDay}
                  onChangeText={setBirthdayDay}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={styles.inputFieldLabel}>Month</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="August"
                  placeholderTextColor={COLORS.textMuted}
                  value={birthdayMonth}
                  onChangeText={setBirthdayMonth}
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputFieldLabel}>Year</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="2005"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={birthdayYear}
                  onChangeText={setBirthdayYear}
                />
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.88} onPress={handleSaveBirthday} style={styles.primaryGradBtn}>
              <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
                <Text style={styles.gradBtnText}>
                  {savedBirthday ? 'Update Birthday' : 'Save Birthday & Get 50 Coins'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          2. ADDRESS BOOK MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isAddressBookModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Saved Addresses 📍</Text>
              <TouchableOpacity onPress={() => setAddressBookModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {user.savedAddresses?.map((addr, idx) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id || idx}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedAddress(addr);
                      Alert.alert('Address Selected', `Delivering to: ${addr.type} (${addr.areaLandmark || addr.city})`);
                    }}
                    style={[styles.addressItemCard, isSelected && styles.addressItemCardActive]}
                  >
                    <View style={styles.addressItemLeft}>
                      <View style={[styles.addrTypePill, isSelected && { backgroundColor: COLORS.primary }]}>
                        <Text style={[styles.addrTypePillText, isSelected && { color: COLORS.white }]}>
                          {addr.type}
                        </Text>
                      </View>
                      <Text style={styles.addrFullText} numberOfLines={2}>
                      {addr.houseFlat}, {addr.areaLandmark}, {addr.city}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={isSelected ? COLORS.primary : COLORS.secondaryText}
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        onPress={(e: any) => {
                          e?.stopPropagation?.();
                          handleDeleteSavedAddress(addr);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: '#FEF2F2',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        accessibilityLabel="Delete address"
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setAddressBookModalVisible(false);
                setActiveScreen('C11_AddAddress');
              }}
              style={styles.outlineActionBtn}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.outlineActionBtnText}>Add New Delivery Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          3. BOOKMARKED RECIPES MODAL (Chef Specials)
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isRecipesModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheetCard, { maxHeight: '85%' }]}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.sheetTitle}>Bookmarked Recipes 🍳</Text>
                <Text style={styles.sheetSub}>Quick 10-minute chef meals with 1-click grocery ordering</Text>
              </View>
              <TouchableOpacity onPress={() => setRecipesModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {SAMPLE_RECIPES.map((recipe, idx) => {
                const totalCost = recipe.items.reduce((s, i) => s + i.sellingPrice, 0);
                return (
                  <View key={idx} style={styles.recipeCard}>
                    <View style={styles.recipeHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recipeTitle}>{recipe.title}</Text>
                        <View style={styles.recipeMetaRow}>
                          <Text style={styles.recipeMetaPill}>⏱️ {recipe.time}</Text>
                          <Text style={styles.recipeMetaPill}>⭐ {recipe.difficulty}</Text>
                          <Text style={styles.recipeMetaPill}>🛒 {recipe.ingredientsCount} items</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.recipeItemsList}>
                      {recipe.items.map((item) => (
                        <View key={item.id} style={styles.recipeItemRow}>
                          <Text style={styles.recipeItemName} numberOfLines={1}>• {item.name} ({item.packSize})</Text>
                          <Text style={styles.recipeItemPrice}>₹{item.sellingPrice}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleAddRecipeToCart(recipe.title, recipe.items)}
                      style={styles.addIngredientsBtn}
                    >
                      <Ionicons name="cart-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                      <Text style={styles.addIngredientsBtnText}>Add All Ingredients to Cart (₹{totalCost})</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          4. GST DETAILS MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isGstModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Business GST Details 📑</Text>
              <TouchableOpacity onPress={() => setGstModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              Add your GSTIN to receive automatic GST tax invoices for business expense claims.
            </Text>

            <Text style={styles.inputFieldLabel}>15-Digit GSTIN</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. 24AAAAA0000A1Z5"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              maxLength={15}
              value={gstin}
              onChangeText={setGstin}
            />

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Legal Business Name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Apex Technologies Pvt Ltd"
              placeholderTextColor={COLORS.textMuted}
              value={businessName}
              onChangeText={setBusinessName}
            />

            <TouchableOpacity activeOpacity={0.88} onPress={handleSaveGst} style={styles.primaryGradBtn}>
              <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
                <Text style={styles.gradBtnText}>Save & Verify GSTIN</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          5. E-GIFT CARDS MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isGiftCardsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Worm Up e-Gift Cards 🎁</Text>
              <TouchableOpacity onPress={() => setGiftCardsModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>Send instant instant grocery & snack cards to friends & family.</Text>

            <Text style={styles.inputFieldLabel}>Select Denomination</Text>
            <View style={styles.amountPillsRow}>
              {[250, 500, 1000, 2000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setSelectedGiftAmount(amt)}
                  style={[styles.amountPill, selectedGiftAmount === amt && styles.amountPillActive]}
                >
                  <Text style={[styles.amountPillText, selectedGiftAmount === amt && styles.amountPillTextActive]}>
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputFieldLabel, { marginTop: 14 }]}>Recipient Mobile / WhatsApp</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. 9876543210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={giftRecipientPhone}
              onChangeText={setGiftRecipientPhone}
            />

            <TouchableOpacity activeOpacity={0.88} onPress={handlePurchaseGiftCard} style={styles.primaryGradBtn}>
              <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
                <Text style={styles.gradBtnText}>Generate Gift Card (₹{selectedGiftAmount})</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          6. PRESCRIPTIONS MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isPrescriptionsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Medical Prescriptions 🩺</Text>
              <TouchableOpacity onPress={() => setPrescriptionsModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              Uploaded doctor prescriptions for verified pharmacy order fulfillment in 10 minutes.
            </Text>

            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {prescriptionsList.map((rx) => (
                <View key={rx.id} style={styles.rxCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxName}>{rx.name}</Text>
                    <Text style={styles.rxMeta}>Uploaded: {rx.date} • {rx.status}</Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-done" size={16} color={COLORS.success} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity activeOpacity={0.85} onPress={handleUploadPrescriptionSimulated} style={styles.outlineActionBtn}>
              <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.outlineActionBtnText}>Upload New Prescription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          7. PAYMENT SETTINGS MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isPaymentSettingsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Payment Settings 💳</Text>
              <TouchableOpacity onPress={() => setPaymentSettingsModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputFieldLabel}>Linked UPI ID</Text>
            <View style={styles.upiCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upiText}>{savedUpiId}</Text>
                <Text style={styles.upiDefaultPill}>Default for 1-click checkout</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputFieldLabel}>Add New UPI VPA</Text>
              <View style={styles.inputWithBtnRow}>
                <TextInput
                  style={[styles.sheetInput, { flex: 1 }]}
                  placeholder="e.g. mobile@paytm"
                  placeholderTextColor={COLORS.textMuted}
                  value={newUpiInput}
                  onChangeText={setNewUpiInput}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleVerifyAndAddUpi}
                  style={styles.verifyUpiBtn}
                >
                  <Text style={styles.verifyUpiBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.preferenceRow, { paddingHorizontal: 0, marginTop: 14 }]}>
              <View>
                <Text style={styles.inputFieldLabel}>Cash on Delivery (COD)</Text>
                <Text style={styles.sheetSub}>Allow paying via cash upon doorstep delivery</Text>
              </View>
              <Switch
                value={isCodEnabled}
                onValueChange={handleToggleCod}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          8. CLAIM GIFT CARD MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isClaimGiftCardModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Claim Gift Card or Voucher 🎟️</Text>
              <TouchableOpacity onPress={() => setClaimGiftCardModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              Enter your 16-character gift card code or promo voucher to instantly credit your wallet.
            </Text>

            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. WELCOME50 or WORMUP100"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              value={claimVoucherCode}
              onChangeText={(t) => {
                setClaimVoucherCode(t);
                setClaimSuccessMessage(null);
              }}
            />

            {claimSuccessMessage ? (
              <View style={styles.claimSuccessBox}>
                <Ionicons name="gift" size={20} color={COLORS.success} />
                <Text style={styles.claimSuccessText}>{claimSuccessMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity activeOpacity={0.88} onPress={handleClaimGiftCard} style={styles.primaryGradBtn}>
              <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
                <Text style={styles.gradBtnText}>Claim to Worm Up Money</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          9. REWARDS & COINS HUB MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isRewardsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheetCard, { maxHeight: '85%' }]}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.sheetTitle}>Rewards & Shopping Coins 🪙</Text>
                <Text style={styles.sheetSub}>Earn coins on every grocery and print order</Text>
              </View>
              <TouchableOpacity onPress={() => setRewardsModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            {/* Big Coins Balance Banner */}
            <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.coinsBanner}>
              <Text style={styles.coinsBannerTitle}>Total Balance</Text>
              <Text style={styles.coinsBannerNumber}>{user.shoppingCoins} Coins</Text>
              <Text style={styles.coinsBannerSub}>1 Coin = ₹1 Discount at Checkout</Text>
            </LinearGradient>

            {/* Interactive Scratch Card */}
            <Text style={[styles.inputFieldLabel, { marginTop: 14 }]}>Daily Scratch Card</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleScratchReward}
              style={[styles.scratchCardContainer, hasScratchedReward && styles.scratchCardOpened]}
            >
              {hasScratchedReward ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 36 }}>🎉</Text>
                  <Text style={styles.scratchWonText}>+75 Shopping Coins</Text>
                  <Text style={styles.scratchWonSub}>Credited to your balance</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={32} color={COLORS.primary} />
                  <Text style={styles.scratchPromptText}>Tap to scratch & reveal coins!</Text>
                  <Text style={styles.scratchPromptSub}>Guaranteed up to 100 coins</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Active Coupon Codes */}
            <Text style={[styles.inputFieldLabel, { marginTop: 16 }]}>Active Promo Coupons</Text>
            {[
              { code: 'FLAT50', title: '₹50 Flat Off', desc: 'On orders above ₹299' },
              { code: 'FREEDEL', title: 'Free 9-Min Delivery', desc: 'On any grocery order' },
              { code: 'PRINT10', title: 'Free 3 Print Pages', desc: 'On first print store job' },
            ].map((coupon) => (
              <View key={coupon.code} style={styles.couponRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.couponCodeText}>{coupon.code}</Text>
                  <Text style={styles.couponDescText}>{coupon.title} • {coupon.desc}</Text>
                </View>
                <TouchableOpacity onPress={() => copyCouponCode(coupon.code)} style={styles.copyBtn}>
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          10. FEEDING INDIA IMPACT MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isFeedingIndiaModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Feeding India & Worm Up Cares 🥣</Text>
              <TouchableOpacity onPress={() => setFeedingIndiaModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.impactStatsRow}>
              <View style={styles.impactStatBox}>
                <Text style={styles.impactStatNumber}>1.2M+</Text>
                <Text style={styles.impactStatLabel}>Meals Served</Text>
              </View>
              <View style={styles.impactStatBox}>
                <Text style={styles.impactStatNumber}>8 Meals</Text>
                <Text style={styles.impactStatLabel}>From Your Orders</Text>
              </View>
            </View>

            <Text style={[styles.sheetSub, { marginTop: 14 }]}>
              Every 10 orders placed on Worm Up helps fund 1 warm nutritional meal for underprivileged children across India.
            </Text>

            <View style={[styles.preferenceRow, { paddingHorizontal: 0, marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputFieldLabel}>Round up change for charity</Text>
                <Text style={styles.sheetSub}>Round up bill to nearest ₹10 for Feeding India</Text>
              </View>
              <Switch
                value={isRoundUpForCharity}
                onValueChange={setIsRoundUpForCharity}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          11. DONATION RECEIPT MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isDonationReceiptModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>80G Tax Exemption Receipts 📑</Text>
              <TouchableOpacity onPress={() => setDonationReceiptModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptCard}>
              <Text style={styles.receiptPeriod}>Financial Year: 2025 - 2026</Text>
              <Text style={styles.receiptAmount}>Total Donated: ₹180.00</Text>
              <Text style={styles.receiptSub}>Eligible for 50% deduction under Section 80G of Income Tax Act.</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => Alert.alert('Receipt Downloaded! 📥', '80G Certificate for FY 2025-26 downloaded as PDF.')}
              style={styles.outlineActionBtn}
            >
              <Ionicons name="download-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.outlineActionBtnText}>Download 80G Certificate (PDF)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => Alert.alert('Email Sent! ✉️', `80G Tax exemption receipt dispatched to ${user.email || 'your registered email'}.`)}
              style={[styles.primaryGradBtn, { marginTop: 10 }]}
            >
              <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
                <Text style={styles.gradBtnText}>Email Tax Receipt to {user.email || 'Me'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          12. ABOUT US MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isAboutUsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>About Worm Up 🚀</Text>
              <TouchableOpacity onPress={() => setAboutUsModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <Text style={styles.aboutStoryText}>
              Worm Up is India's fastest hyperlocal grocery & print store network. We combine state-of-the-art dark stores, electric delivery fleet, and 10-minute instant document printing to bring essential everyday items straight to your doorstep.
            </Text>

            <View style={styles.aboutPillsGrid}>
              <View style={styles.aboutPill}><Text style={styles.aboutPillText}>⚡ 9-Min Delivery</Text></View>
              <View style={styles.aboutPill}><Text style={styles.aboutPillText}>🌱 100% Electric Fleet</Text></View>
              <View style={styles.aboutPill}><Text style={styles.aboutPillText}>🖨️ 300 DPI Print Store</Text></View>
              <View style={styles.aboutPill}><Text style={styles.aboutPillText}>🔒 TLS Encrypted</Text></View>
            </View>

            <Text style={styles.aboutContactText}>Support: support@wormup.in • Helpline: +91 80000 12345</Text>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          13. SELL ON WORM UP (Partner Modal)
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isPartnerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Partner & Sell on Worm Up 🏪</Text>
              <TouchableOpacity onPress={() => setPartnerModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              Reach 10,000+ local customers in your neighborhood within a 3km radius.
            </Text>

            <Text style={styles.inputFieldLabel}>Store or Brand Name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Shivalik Gourmet Bakers"
              placeholderTextColor={COLORS.textMuted}
              value={partnerStoreName}
              onChangeText={setPartnerStoreName}
            />

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Category</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Bakery, Dairy, Gourmet"
              placeholderTextColor={COLORS.textMuted}
              value={partnerCategory}
              onChangeText={setPartnerCategory}
            />

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Owner Contact Number</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. 9876543210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={partnerPhone}
              onChangeText={setPartnerPhone}
            />

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                if (!partnerStoreName || !partnerPhone) {
                  Alert.alert('Incomplete Form', 'Please provide store name and contact phone.');
                  return;
                }
                setPartnerSubmitted(true);
                Alert.alert(
                  'Partner Application Submitted! 🤝',
                  'Our merchant onboarding lead will call you within 24 hours to schedule a catalog review.',
                  [{ text: 'Done', onPress: () => setPartnerModalVisible(false) }]
                );
              }}
              style={styles.primaryGradBtn}
            >
              <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
                <Text style={styles.gradBtnText}>Submit Merchant Application</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          14. ACCOUNT PRIVACY MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isPrivacyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Account Privacy & Security 🔒</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputFieldLabel}>Personalized Product Feeds</Text>
                <Text style={styles.sheetSub}>Recommend items based on your past orders</Text>
              </View>
              <Switch
                value={privacyPersonalizedAds}
                onValueChange={handleTogglePersonalizedFeeds}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputFieldLabel}>Anonymous Usage Analytics</Text>
                <Text style={styles.sheetSub}>Help improve app performance & speed</Text>
              </View>
              <Switch
                value={privacyAnalytics}
                onValueChange={handleToggleAnalytics}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleClearHistory}
              style={styles.outlineActionBtn}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.error} style={{ marginRight: 6 }} />
              <Text style={[styles.outlineActionBtnText, { color: COLORS.error }]}>Clear Search & Browsing History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDownloadData}
              style={[styles.outlineActionBtn, { marginTop: 10 }]}
            >
              <Ionicons name="download-outline" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.outlineActionBtnText}>Download Personal Data Archive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          15. NOTIFICATION PREFERENCES MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isNotificationsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>Notification Preferences 🔔</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputFieldLabel}>Live Order & Rider Tracking</Text>
                <Text style={styles.sheetSub}>Real-time updates when rider departs dark store</Text>
              </View>
              <Switch
                value={notifOrderUpdates}
                onValueChange={handleToggleOrderUpdates}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputFieldLabel}>WhatsApp Order Invoices</Text>
                <Text style={styles.sheetSub}>Receive digital bills directly on WhatsApp</Text>
              </View>
              <Switch
                value={notifWhatsApp}
                onValueChange={handleToggleWhatsApp}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputFieldLabel}>Exclusive Offers & Festive Discounts</Text>
                <Text style={styles.sheetSub}>Flash sales, cashbacks and coupon codes</Text>
              </View>
              <Switch
                value={notifOffers}
                onValueChange={handleToggleOffers}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          16. 24x7 CUSTOMER SUPPORT & FAQ MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isHelpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheetCard, { maxHeight: '85%' }]}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.sheetTitle}>24x7 Customer Support 🎧</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>We're here to help you 24 hours a day, 7 days a week.</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { q: 'How fast is delivery?', a: 'Grocery and everyday items arrive in 9-10 minutes from our nearest micro-fulfillment center.' },
                { q: 'How does document printing work?', a: 'Upload PDF or photos under Print store. Documents are printed at 300 DPI, sealed in a tamper-proof envelope, and purged after delivery for complete privacy.' },
                { q: 'What is the refund policy for damaged goods?', a: 'Instant 100% refund to your Worm Up Money wallet or original payment source within 2 hours of raising an issue.' },
                { q: 'Can I change my delivery address after ordering?', a: 'Since orders are packed within 60 seconds, address changes should be communicated directly to your rider via the live tracking call button.' },
              ].map((faq, index) => {
                const isExpanded = expandedFaqIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                    style={styles.faqCard}
                  >
                    <View style={styles.faqHeaderRow}>
                      <Text style={styles.faqQuestionText}>{faq.q}</Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textPrimary} />
                    </View>
                    {isExpanded ? <Text style={styles.faqAnswerText}>{faq.a}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => Alert.alert('Connecting Live Support Agent 💬', 'Agent Vikram from Worm Up Ahmedabad team is connecting...')}
              style={styles.primaryGradBtn}
            >
              <LinearGradient colors={GRADIENTS.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradBtnInner}>
                <Ionicons name="chatbubbles-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.gradBtnText}>Start Live Chat with Support</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          17. SENSITIVE ITEMS INFO MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isSensitiveInfoModalVisible} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setSensitiveInfoModalVisible(false)} style={styles.modalOverlay}>
          <View style={styles.alertContentBox}>
            <View style={styles.alertIconCircle}>
              <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.alertHeading}>Sensitive Items Protection</Text>
            <Text style={styles.alertSub}>
              When this toggle is turned ON, wellness items, tobacco products, and other sensitive categories are completely hidden from the catalog and search results.
            </Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setSensitiveInfoModalVisible(false)} style={styles.alertBtn}>
              <Text style={styles.alertBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          18. APPEARANCE MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isAppearanceModalVisible} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setAppearanceModalVisible(false)} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[TYPOGRAPHY.headingMd, styles.modalTitle]}>Choose Appearance</Text>
            {(['LIGHT', 'DARK', 'SYSTEM'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                activeOpacity={0.7}
                onPress={() => {
                  setAppearance(mode);
                  setAppearanceModalVisible(false);
                }}
                style={styles.modalOption}
              >
                <Text style={[TYPOGRAPHY.bodyMd, appearance === mode && { color: COLORS.primary, fontWeight: '700' }]}>
                  {mode}
                </Text>
                {appearance === mode && <AppIcon name="check" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          19. LOGOUT CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal visible={isLogoutModalVisible} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setLogoutModalVisible(false)} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 }]}>
            <View style={styles.logoutIconWrapper}>
              <AppIcon name="log-out" size={28} color={COLORS.error} />
            </View>
            <Text style={[TYPOGRAPHY.headingMd, { color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' }]}>
              Log Out of Worm Up?
            </Text>
            <Text style={[TYPOGRAPHY.bodySm, { color: COLORS.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }]}>
              Are you sure you want to log out? You will need to verify your email to access your account again.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLogoutModalVisible(false)}
                style={styles.logoutCancelBtn}
              >
                <Text style={styles.logoutCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  setLogoutModalVisible(false);
                  await logout();
                }}
                style={styles.logoutConfirmBtn}
              >
                <Text style={styles.logoutConfirmBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topHeaderGradient: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.lightBlueLavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  accountHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  emailText: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
    fontWeight: '500',
  },
  phoneNumberText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.85,
    marginTop: 2,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  verificationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pillVerified: {
    backgroundColor: '#DCFCE7',
  },
  pillUnverified: {
    backgroundColor: '#FEF3C7',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextVerified: {
    color: '#15803D',
  },
  pillTextUnverified: {
    color: '#B45309',
  },
  sponsorPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  sponsorPillText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  birthdayCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  birthdayLeft: {
    flex: 1,
  },
  birthdayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  birthdayLinkBtn: {
    marginTop: 4,
  },
  birthdayLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  birthdayCakeEmoji: {
    fontSize: 34,
    marginLeft: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  quickActionSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardBlockStandalone: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    color: COLORS.textPrimary,
  },
  rowBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rowBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  appearanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appearanceValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sensitiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  sensitiveLeftIcon: {
    marginTop: 2,
  },
  sensitiveCenterText: {
    flex: 1,
  },
  sensitiveTitle: {
    color: COLORS.textPrimary,
  },
  sensitiveDesc: {
    color: COLORS.textMuted,
    marginVertical: 4,
    lineHeight: 16,
  },
  knowMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  sectionGroup: {
    marginBottom: 18,
  },
  sectionHeaderTitle: {
    color: COLORS.textPrimary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  cardBlock: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.hotPink,
  },
  footerWordmark: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -0.5,
  },
  footerTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },

  // Modal Overlays & Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  sheetSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  bdayInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryGradBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
  },
  gradBtnInner: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  gradBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginTop: 14,
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Address items in modal
  addressItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  addressItemCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FDF2F8',
  },
  addressItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  addrTypePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  addrTypePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },
  addrFullText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },

  // Recipe Cards
  recipeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  recipeMetaPill: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  recipeItemsList: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  recipeItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  recipeItemName: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
  },
  recipeItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  addIngredientsBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addIngredientsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Denominations
  amountPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  amountPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountPillActive: {
    backgroundColor: '#FDF2F8',
    borderColor: COLORS.primary,
  },
  amountPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  amountPillTextActive: {
    color: COLORS.primary,
  },

  // Prescriptions
  rxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rxName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  rxMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Payment settings
  upiCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  upiText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  upiDefaultPill: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 2,
  },
  inputWithBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  verifyUpiBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyUpiBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Claim Voucher
  claimSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  claimSuccessText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
    flex: 1,
  },

  // Rewards Coins Banner
  coinsBanner: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  coinsBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
  coinsBannerNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginVertical: 4,
  },
  coinsBannerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.95,
  },
  scratchCardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scratchCardOpened: {
    backgroundColor: '#FDF2F8',
    borderColor: COLORS.primary,
    borderStyle: 'solid',
  },
  scratchWonText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  scratchWonSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  scratchPromptText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 6,
  },
  scratchPromptSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  couponCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  couponDescText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Feeding India
  impactStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  impactStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  impactStatNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  impactStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 2,
  },
  receiptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  receiptPeriod: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
    marginVertical: 4,
  },
  receiptSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },

  // About us
  aboutStoryText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  aboutPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  aboutPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aboutPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  aboutContactText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },

  // FAQ
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    flex: 1,
    marginRight: 8,
  },
  faqAnswerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },

  // Alert Content Box
  alertContentBox: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  alertIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  alertBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
  },
  alertBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Appearance & Logout modal
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  modalTitle: {
    marginBottom: 16,
    color: COLORS.textPrimary,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoutIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutCancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logoutConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  logoutConfirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
