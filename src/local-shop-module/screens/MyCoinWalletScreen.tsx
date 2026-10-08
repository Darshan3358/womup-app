import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOCK_COIN_LEDGER } from '../data/mockLocalShops';
import { CoinLedgerItem } from '../types/localShop.types';

interface MyCoinWalletScreenProps {
  onGoBack: () => void;
}

export const MyCoinWalletScreen: React.FC<MyCoinWalletScreenProps> = ({ onGoBack }) => {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(2000);
  const [ledger] = useState<CoinLedgerItem[]>(MOCK_COIN_LEDGER);

  const handleRedeem = () => {
    Alert.alert(
      'Redeem Shopping Coins',
      `You have ${balance.toLocaleString('en-IN')} Coins available (worth ₹${balance.toLocaleString('en-IN')}).\n\nCoins apply automatically at checkout for instant cash discounts!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onGoBack} style={styles.circleBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Shopping Coins</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Main Golden Coin Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.coinGraphicWrapper}>
            <View style={styles.outerRing}>
              <View style={styles.innerCoin}>
                <Text style={styles.coinGlyph}>₹</Text>
              </View>
            </View>
          </View>

          <Text style={styles.balanceCoinsText}>{balance.toLocaleString('en-IN')} Coins</Text>
          <Text style={styles.rupeeEquivalent}>Equivalent to ₹{balance.toLocaleString('en-IN')} Cash Value</Text>

          <View style={styles.rulePill}>
            <Ionicons name="shield-checkmark" size={14} color="#059669" />
            <Text style={styles.ruleText}>1 Shopping Coin = ₹1.00 Rupee</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.balanceActionsRow}>
            <TouchableOpacity style={styles.redeemBtn} activeOpacity={0.85} onPress={handleRedeem}>
              <Text style={styles.redeemBtnText}>Redeem Coins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.earnMoreBtn}
              activeOpacity={0.85}
              onPress={onGoBack}
            >
              <Text style={styles.earnMoreBtnText}>Earn More at Shops</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>How to earn & use WOMUP Coins</Text>

          <View style={styles.benefitRow}>
            <View style={[styles.stepCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="storefront" size={16} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Shop at Partner Stores</Text>
              <Text style={styles.stepSub}>
                Visit verified local shops in Mahesana and Ahmedabad.
              </Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <View style={[styles.stepCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="qr-code" size={16} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Scan & Pay at Counter</Text>
              <Text style={styles.stepSub}>
                Pay via UPI or Wallet and get up to 15% instant coin cashback.
              </Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <View style={[styles.stepCircle, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="cart" size={16} color="#DB2777" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Redeem on Next Orders</Text>
              <Text style={styles.stepSub}>
                Use coins on WOMUP 9-Min delivery or any partner store billing.
              </Text>
            </View>
          </View>
        </View>

        {/* Earning & Spending Ledger History */}
        <View style={styles.ledgerHeaderRow}>
          <Text style={styles.ledgerHeading}>Coin Transaction History</Text>
          <Text style={styles.ledgerCount}>{ledger.length} entries</Text>
        </View>

        <View style={styles.ledgerList}>
          {ledger.map((item) => {
            const isEarned = item.type === 'EARNED';

            return (
              <View key={item.id} style={styles.ledgerCard}>
                <View
                  style={[
                    styles.txTypeCircle,
                    { backgroundColor: isEarned ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <Ionicons
                    name={isEarned ? 'arrow-down-outline' : 'arrow-up-outline'}
                    size={18}
                    color={isEarned ? '#059669' : '#DC2626'}
                  />
                </View>

                <View style={styles.txDetails}>
                  <Text style={styles.txVendorName}>{item.vendorName}</Text>
                  <Text style={styles.txDescription}>{item.description}</Text>
                  <Text style={styles.txDate}>{item.date}</Text>
                </View>

                <View style={styles.txAmountCol}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isEarned ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {isEarned ? `+${item.coins}` : `-${item.coins}`}
                  </Text>
                  <Text style={styles.txBalanceSub}>Bal: {item.balanceAfter}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  circleBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  scroll: {
    paddingBottom: 40,
  },
  balanceCard: {
    margin: 14,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  coinGraphicWrapper: {
    marginBottom: 10,
  },
  outerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  innerCoin: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: '#FBBF24',
    borderWidth: 2,
    borderColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinGlyph: {
    fontSize: 22,
    fontWeight: '900',
    color: '#92400E',
  },
  balanceCoinsText: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  rupeeEquivalent: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  rulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    marginTop: 12,
  },
  ruleText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  balanceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  redeemBtn: {
    flex: 1,
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  redeemBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  earnMoreBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  earnMoreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  benefitsCard: {
    marginHorizontal: 14,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  ledgerHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  ledgerCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  ledgerList: {
    paddingHorizontal: 14,
  },
  ledgerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txTypeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  txDetails: {
    flex: 1,
  },
  txVendorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  txDescription: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 3,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  txBalanceSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});
