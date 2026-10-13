import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Coins,
  Banknote,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Phone,
  Wallet,
} from 'lucide-react-native';
import { COLORS, GRADIENTS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';
import { CollectionRequest } from '../types/vendor';

export const VerificationRequestModal: React.FC = () => {
  const {
    activeModalRequest,
    setActiveModalRequest,
    verifyCollectionRequest,
    rejectCollectionRequest,
  } = useVendor();

  if (!activeModalRequest) return null;

  const req = activeModalRequest;

  const handleAccept = () => {
    verifyCollectionRequest(req.id);
    Alert.alert(
      'Payment Verified! 🎉',
      `₹${req.cashToCollect} Cash recorded • ₹${req.vendorPayout} credited to your Womup Wallet.`
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Request?',
      'Are you sure you want to decline this customer payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => rejectCollectionRequest(req.id, 'Declined by merchant'),
        },
      ]
    );
  };

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Banner */}
          <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.headerBanner}>
            <View style={styles.bellCircle}>
              <Bell size={22} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>New Collection Request</Text>
              <Text style={styles.bannerSub}>Customer waiting at billing counter</Text>
            </View>
          </LinearGradient>

          <View style={styles.contentBody}>
            {/* Customer Details */}
            <View style={styles.customerBox}>
              <View style={styles.rowBetween}>
                <View style={styles.rowCenter}>
                  <User size={16} color="#64748B" />
                  <Text style={styles.customerName}>{req.customerName}</Text>
                </View>
                <View style={styles.rowCenter}>
                  <Phone size={14} color="#64748B" />
                  <Text style={styles.customerPhone}>{req.customerPhone}</Text>
                </View>
              </View>
            </View>

            {/* Bill Amount Big Callout */}
            <View style={styles.billBox}>
              <Text style={styles.billLabel}>Total Counter Bill</Text>
              <Text style={styles.billAmount}>₹{req.billAmount.toLocaleString()}</Text>
            </View>

            {/* Split Breakdown */}
            <View style={styles.breakdownCard}>
              {/* Shopping Coin Benefit */}
              {req.coinsUsed > 0 && (
                <View style={styles.breakdownRow}>
                  <View style={styles.rowCenter}>
                    <Coins size={16} color="#D97706" />
                    <Text style={styles.breakdownLabel}>Shopping Coin Benefit:</Text>
                  </View>
                  <Text style={styles.breakdownCoins}>- ₹{req.coinsUsed}</Text>
                </View>
              )}

              {/* If App Download Wallet was used */}
              {(req.paymentMethod === 'WALLET' || (req.walletUsed && req.walletUsed > 0)) && (
                <View style={styles.breakdownRow}>
                  <View style={styles.rowCenter}>
                    <Wallet size={16} color="#4F46E5" />
                    <Text style={styles.breakdownLabel}>App Download Wallet:</Text>
                  </View>
                  <Text style={[styles.breakdownCoins, { color: '#4F46E5' }]}>
                    - ₹{req.walletUsed || req.billAmount}
                  </Text>
                </View>
              )}

              {/* If UPI was used */}
              {req.paymentMethod === 'UPI' && (
                <View style={styles.breakdownRow}>
                  <View style={styles.rowCenter}>
                    <CheckCircle2 size={16} color="#059669" />
                    <Text style={styles.breakdownLabel}>Paid via Digital UPI:</Text>
                  </View>
                  <Text style={[styles.breakdownCoins, { color: '#059669' }]}>
                    ₹{req.upiAmount || req.billAmount}
                  </Text>
                </View>
              )}

              {/* Cash to collect at counter */}
              <View style={[styles.breakdownRow, styles.cashRow]}>
                <View style={styles.rowCenter}>
                  <Banknote size={18} color="#059669" />
                  <Text style={styles.cashLabel}>CASH TO COLLECT:</Text>
                </View>
                <Text style={styles.cashAmount}>₹{req.cashToCollect}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Platform Commission (2%):</Text>
                <Text style={styles.payoutSub}>₹{req.platformCommission}</Text>
              </View>

              <View style={styles.payoutRow}>
                <Text style={styles.payoutGrandLabel}>Your Total Settlement Payout:</Text>
                <Text style={styles.payoutGrandVal}>₹{req.vendorPayout.toLocaleString()}</Text>
              </View>
            </View>

            {/* Cash Collection Instruction */}
            {req.cashToCollect > 0 ? (
              <View style={styles.warningNote}>
                <Text style={styles.warningText}>
                  ⚠️ Please collect <Text style={{ fontWeight: '800' }}>₹{req.cashToCollect} in physical cash</Text> from customer before tapping verify!
                </Text>
              </View>
            ) : req.paymentMethod === 'UPI' ? (
              <View style={[styles.warningNote, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Text style={[styles.warningText, { color: '#065F46' }]}>
                  ✅ 100% Paid Digitally via Counter UPI. Zero cash to collect.
                </Text>
              </View>
            ) : (
              <View style={[styles.warningNote, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                <Text style={[styles.warningText, { color: '#3730A3' }]}>
                  ✅ 100% Paid via Customer App Download Wallet. Zero cash to collect from customer.
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={handleReject}
                activeOpacity={0.8}
              >
                <XCircle size={18} color="#EF4444" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAccept}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.acceptBtnText}>
                  {req.cashToCollect > 0 ? `COLLECT & VERIFY (₹${req.cashToCollect})` : 'COLLECT & VERIFY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  bellCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  bannerSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  contentBody: {
    padding: 18,
    gap: 12,
  },
  customerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  customerPhone: {
    fontSize: 12,
    color: '#64748B',
  },
  billBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  billLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  billAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  breakdownCoins: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  cashRow: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cashLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  cashAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#047857',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  payoutSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  payoutGrandLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  payoutGrandVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2563EB',
  },
  warningNote: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10B981',
    gap: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
