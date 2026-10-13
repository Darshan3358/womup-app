import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  Download,
  Printer,
  Share2,
  Sparkles,
  ShieldCheck,
  Store,
  Lightbulb,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';

export const QRCodeDisplayScreen: React.FC = () => {
  const { vendor } = useVendor();

  const handleDownload = () => {
    Alert.alert(
      'QR Downloaded 📥',
      `High-res PNG of ${vendor?.storeName || 'Vendor'} counter QR saved to gallery!`
    );
  };

  const handlePrint = () => {
    Alert.alert(
      'Print Standee 🖨️',
      'Generating A4 printable merchant standee with official Womup border & logo.'
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Counter QR 📲',
      `Sharing UPI & Wormup digital QR payload for ${vendor?.storeName || 'Store'}.`
    );
  };

  const qrDataText = `WOMUP-PAY-${vendor?.vendorCode || 'VND001'}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Store size={22} color={COLORS.rose} />
          <View>
            <Text style={styles.storeName}>{vendor?.storeName || 'Gokul Vegetables'}</Text>
            <Text style={styles.storeSubtitle}>
              Official In-Store Counter QR Code
            </Text>
          </View>
        </View>

        {/* Big Official QR Code Visual */}
        <View style={styles.qrFrame}>
          <QRCode
            value={`womup://vendor/${vendor?.vendorCode || 'VND001'}`}
            size={200}
            backgroundColor="#FFFFFF"
            color="#0F172A"
          />

          <View style={styles.codePill}>
            <Text style={styles.codeText}>{qrDataText}</Text>
          </View>
        </View>

        {/* Cashback offer banner */}
        <View style={styles.cashbackBox}>
          <Sparkles size={16} color="#B45309" />
          <Text style={styles.cashbackText}>
            Customers earn <Text style={{ fontWeight: '900' }}>{vendor?.shoppingCoinPercent || 15}% Shopping Coins</Text> on scanning!
          </Text>
        </View>

        <Text style={styles.scanInstruction}>
          Display this screen on your tablet / phone at the counter, or print the standee below.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
            <Download size={16} color={COLORS.navy} />
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={handlePrint}
          >
            <Printer size={16} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Print Standee</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Share2 size={16} color={COLORS.navy} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Merchant Tips Card */}
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={18} color="#D97706" />
          <Text style={styles.tipsTitle}>Counter Billing Best Practices</Text>
        </View>
        <Text style={styles.tipItem}>
          • Print this QR standee on cardstock or laminate it next to your billing cash register.
        </Text>
        <Text style={styles.tipItem}>
          • When customer arrives, ask them to tap "Scan & Pay" in their WormUp Customer App.
        </Text>
        <Text style={styles.tipItem}>
          • When they submit bill, verify the cash amount collected before tapping "Accept".
        </Text>
        <Text style={styles.tipItem}>
          • Funds from coin redemption settle directly into your merchant wallet!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  storeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  qrFrame: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  codePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cashbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  cashbackText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  scanInstruction: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 14,
    lineHeight: 16,
    maxWidth: 300,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  tipItem: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
});
