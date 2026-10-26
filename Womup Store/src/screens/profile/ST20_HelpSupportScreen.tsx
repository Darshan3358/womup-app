import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { COLORS } from '../../theme/colors';

export const ST20_HelpSupportScreen: React.FC = () => {
  const { setSubScreen, store } = useStore();

  const handleCallSupport = () => {
    Linking.openURL('tel:18008899668').catch(() => {
      Alert.alert('Phone Call', 'Toll-free number: 1800-889-9668');
    });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello Wom Up Operations Support, I need assistance for Dark Store: ${store?.name || 'Chandlodiya - Tragad'} (${store?.code || 'STORE-01'}).`
    );
    Linking.openURL(`https://wa.me/917984940855?text=${text}`).catch(() => {
      Alert.alert('WhatsApp', 'WhatsApp number: +91 79849 40855');
    });
  };

  const handleEmailSupport = () => {
    const subject = encodeURIComponent(`[Dark Store Query] ${store?.name || 'Store'} (${store?.code || ''})`);
    Linking.openURL(`mailto:storeops@womup.in?subject=${subject}`).catch(() => {
      Alert.alert('Email Support', 'Contact us at: storeops@womup.in');
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSubScreen(null)}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>Dark Store Operations Assistance</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="headset" size={28} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>24/7 Operations Desk</Text>
            <Text style={styles.bannerDesc}>
              Instant assistance for dispatch delays, inventory audits, rider handovers, or technical terminal issues.
            </Text>
          </View>
        </View>

        {/* Quick Action Cards */}
        <Text style={styles.sectionTitle}>Direct Contacts</Text>

        {/* Call Helpline */}
        <TouchableOpacity style={styles.actionCard} onPress={handleCallSupport} activeOpacity={0.8}>
          <View style={[styles.cardIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="call" size={22} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Toll-Free Helpline</Text>
            <Text style={styles.cardSubtitle}>1800-889-9668 · Tap to call operations</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* WhatsApp Support */}
        <TouchableOpacity style={styles.actionCard} onPress={handleWhatsApp} activeOpacity={0.8}>
          <View style={[styles.cardIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>WhatsApp Support</Text>
            <Text style={styles.cardSubtitle}>+91 79849 40855 · Chat with hub coordinator</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Email Support */}
        <TouchableOpacity style={styles.actionCard} onPress={handleEmailSupport} activeOpacity={0.8}>
          <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="mail" size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Email Operations</Text>
            <Text style={styles.cardSubtitle}>storeops@womup.in · Formal tickets & audits</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Operational FAQs */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Common Dark Store FAQs</Text>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>📦 What if an item is out of stock during picking?</Text>
          <Text style={styles.faqAnswer}>
            Click the "Out of Stock" button on the item card during picking. The system will prompt you to select an approved substitute or update available inventory.
          </Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>🛵 What if the assigned delivery rider doesn't arrive?</Text>
          <Text style={styles.faqAnswer}>
            The system auto-notifies dispatch after 3 minutes. If urgent, tap the Handover counter screen and call dispatch through the helpline above.
          </Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>🔒 How do I update store terminal login credentials?</Text>
          <Text style={styles.faqAnswer}>
            Go to Settings &gt; Change Password. Enter your current password and set a new 6+ character password.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  faqCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
