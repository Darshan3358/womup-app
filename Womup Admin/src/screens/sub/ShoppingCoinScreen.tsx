import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Coins, Plus, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const ShoppingCoinScreen: React.FC = () => {
  const { coinLedger, addShoppingCoinAdjustment } = useAdminState();

  const [userName, setUserName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [reason, setReason] = useState('');

  const totalIssued = coinLedger.filter((c) => c.amount > 0).reduce((sum, c) => sum + c.amount, 0);
  const totalRedeemed = Math.abs(coinLedger.filter((c) => c.amount < 0).reduce((sum, c) => sum + c.amount, 0));

  const handleAdjustment = () => {
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || !userName || !reason) {
      Alert.alert('Validation Error', 'Please provide User Name, Amount, and Reason.');
      return;
    }
    addShoppingCoinAdjustment(userName, amount, reason);
    setAmountStr('');
    setReason('');
    Alert.alert('Coins Adjusted', `${amount > 0 ? '+' : ''}${amount} Shopping Coins assigned to ${userName}.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Telemetry */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Coins Issued</Text>
            <Text style={styles.statVal}>{totalIssued.toLocaleString()} SC</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Coins Redeemed</Text>
            <Text style={[styles.statVal, { color: COLORS.hotPink }]}>{totalRedeemed.toLocaleString()} SC</Text>
          </View>
        </View>
      </View>

      {/* Manual Coin Adjustment Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manual Shopping Coin Adjustment</Text>
        <Text style={styles.cardSub}>Issue promotional coins or adjust user balances with full ledger trace</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="e.g. Rahul Sharma"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Coin Adjustment Amount (+ or -)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amountStr}
            onChangeText={setAmountStr}
            placeholder="100 or -50"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason for Adjustment</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Compensation, Promo"
          />
        </View>

        <TouchableOpacity style={styles.adjustBtn} onPress={handleAdjustment}>
          <Plus size={16} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.adjustBtnText}>Confirm Coin Adjustment</Text>
        </TouchableOpacity>
      </View>

      {/* Coin Transaction Ledger */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Shopping Coin Ledger History</Text>
        {coinLedger.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No coin transactions recorded yet</Text>
          </View>
        ) : (
          coinLedger.map((item) => (
            <View key={item.id} style={styles.ledgerRow}>
              <View style={[styles.typeIcon, item.amount >= 0 ? styles.earnedBg : styles.usedBg]}>
                {item.amount >= 0 ? (
                  <ArrowDownRight size={16} color={COLORS.success} />
                ) : (
                  <ArrowUpRight size={16} color={COLORS.error} />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.ledgerUser}>{item.userName}</Text>
                <Text style={styles.ledgerReason}>{item.reason}</Text>
                <Text style={styles.ledgerTime}>{item.timestamp}</Text>
              </View>

              <Text
                style={[
                  styles.ledgerAmount,
                  { color: item.amount >= 0 ? COLORS.success : COLORS.error },
                ]}
              >
                {item.amount >= 0 ? `+${item.amount}` : item.amount} SC
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  statsCard: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.lightPink,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.hotPink,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    marginTop: SPACING.sm,
  },
  adjustBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  earnedBg: {
    backgroundColor: '#E8F8F0',
  },
  usedBg: {
    backgroundColor: '#FCECEE',
  },
  ledgerUser: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ledgerReason: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  ledgerTime: {
    fontSize: 10,
    color: COLORS.secondaryText,
  },
  ledgerAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
