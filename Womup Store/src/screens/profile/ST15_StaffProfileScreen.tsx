import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

const LANGUAGE_STORAGE_KEY = '@womup_store_language';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English (Default)' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export const ST15_StaffProfileScreen: React.FC = () => {
  const { staff, store, logout, setSubScreen, setCurrentTab } = useStore();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);

  const [earnings, setEarnings] = useState<{
    totalEarnings: number;
    todayEarnings: number;
    pendingSettlement: number;
    availableForWithdrawal: number;
  }>({
    totalEarnings: 0,
    todayEarnings: 0,
    pendingSettlement: 0,
    availableForWithdrawal: 0,
  });
  const [earningsLoading, setEarningsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchEarnings = async () => {
      try {
        const storeId = store?.id || (store as any)?._id;
        const res = await StoreApiService.getEarningsSummary(storeId);
        if (isMounted && res) {
          setEarnings(res);
        }
      } catch (err) {
        // non-fatal: fallback to 0
      } finally {
        if (isMounted) setEarningsLoading(false);
      }
    };

    fetchEarnings();
    return () => {
      isMounted = false;
    };
  }, [store?.id]);

  useEffect(() => {
    const loadLang = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved) {
          const match = LANGUAGES.find((l) => l.code === saved || l.name === saved);
          if (match) setSelectedLanguage(match.name);
        }
      } catch (_) {}
    };
    loadLang();
  }, []);

  const handleSelectLanguage = async (lang: LanguageOption) => {
    setSelectedLanguage(lang.name);
    setIsLangModalOpen(false);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang.code);
    } catch (_) {}
  };

  const handleLogoutConfirm = () => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm(`Are you sure you want to log out of ${store?.name || 'this Dark Store'}?`)
          : true;
      if (confirmed) {
        logout();
      }
      return;
    }

    Alert.alert(
      'Sign Out Terminal',
      `Are you sure you want to log out of ${store?.name || 'this Dark Store'}?\n\nActive picking session will be closed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Logout failed');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>

          <Text style={styles.staffName}>
            {staff?.fullName || `${store?.name || 'Dark Store'} Staff`}
          </Text>
          <Text style={styles.staffRole}>Dark Store Partner</Text>
          <Text style={styles.storeId}>Store ID: {store?.code || 'STORE-01'}</Text>
        </View>

        {/* 0. My Earnings Summary Card */}
        <TouchableOpacity
          style={styles.earningsCard}
          activeOpacity={0.85}
          onPress={() => {
            setSubScreen(null);
            setCurrentTab('History');
          }}
          accessibilityLabel="View My Earnings"
        >
          <View style={styles.earningsLeft}>
            <View style={styles.earningsIconCircle}>
              <Ionicons name="wallet" size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.earningsTitle}>My Earnings</Text>
                <View style={styles.settlementBadge}>
                  <Text style={styles.settlementBadgeText}>Live</Text>
                </View>
              </View>
              <Text style={styles.earningsSubtitle}>
                {earnings.pendingSettlement > 0
                  ? `₹${earnings.pendingSettlement.toLocaleString('en-IN')} pending settlement`
                  : 'Tap to view full earnings & orders'}
              </Text>
            </View>
          </View>

          <View style={styles.earningsRight}>
            {earningsLoading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.earningsAmount}>
                  ₹{(earnings.totalEarnings || earnings.availableForWithdrawal || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.earningsHint}>Lifetime Total ›</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Menu List */}
        <View style={styles.menuCard}>
          {/* 1. Store Information */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setSubScreen('StoreInfo')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="storefront-outline" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.menuLabel}>Store Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 2. Change Password */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setSubScreen('ChangePassword')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.menuLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 3. Language Selector */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setIsLangModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="globe-outline" size={18} color="#059669" />
              </View>
              <Text style={styles.menuLabel}>Language</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.langValue}>{selectedLanguage}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 4. Help & Support */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setSubScreen('HelpSupport')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FDF2F8' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#FF3B98" />
              </View>
              <Text style={styles.menuLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 5. Shift History & Attendance */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setSubScreen('ShiftHistory')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.menuLabel}>Shift History & Attendance</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 6. Logout */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleLogoutConfirm}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.menuLabel, { color: '#EF4444', fontWeight: '600' }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={isLangModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLangModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsLangModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setIsLangModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.name;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langOption, isSelected && styles.langOptionSelected]}
                  onPress={() => handleSelectLanguage(lang)}
                  activeOpacity={0.75}
                >
                  <View>
                    <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                      {lang.name}
                    </Text>
                    <Text style={styles.langNative}>{lang.nativeName}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  staffRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  storeId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  earningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  earningsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  settlementBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  settlementBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  earningsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  earningsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  earningsAmount: {
    fontSize: 19,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.3,
  },
  earningsHint: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  langValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  langName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  langNameSelected: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  langNative: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
