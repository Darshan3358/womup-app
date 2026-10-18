import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { COLORS } from '../../theme/colors';

interface WalletTransaction {
  id: string;
  title: string;
  timestamp: string;
  amount: number;
  type: 'EARNING' | 'TIP' | 'INCENTIVE' | 'WITHDRAWAL';
}

export const BankSettlementScreen: React.FC = () => {
  const { bankAccount, updateBankAccount, setSubScreen, settlementSummary, requestPayout, refreshDashboard } = useRider();

  const [bankName, setBankName] = useState(bankAccount?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(bankAccount?.accountNumberFull || '');
  const [confirmAccount, setConfirmAccount] = useState(bankAccount?.accountNumberFull || '');
  const [ifsc, setIfsc] = useState(bankAccount?.ifscCode || '');
  const [holderName, setHolderName] = useState(bankAccount?.accountHolderName || '');
  const [upi, setUpi] = useState(bankAccount?.upiId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number>(settlementSummary?.pendingTransfer ?? 0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = useCallback(async () => {
    try {
      const data = await RiderApiService.getRiderWallet();
      setTransactions(data.transactions || []);
      if (typeof data.balance === 'number') {
        setWalletBalance(data.balance);
      } else if (typeof data.pendingTransfer === 'number') {
        setWalletBalance(data.pendingTransfer);
      } else if (typeof settlementSummary?.pendingTransfer === 'number') {
        setWalletBalance(settlementSummary.pendingTransfer);
      } else {
        setWalletBalance(0);
      }
    } catch (e) {
      console.log('Error fetching wallet data', e);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
      setRefreshing(false);
    }
  }, [settlementSummary?.pendingTransfer]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWalletData(), refreshDashboard()]);
    setRefreshing(false);
  }, [fetchWalletData, refreshDashboard]);

  useEffect(() => {
    if (bankAccount) {
      setBankName(bankAccount.bankName || '');
      const acc = bankAccount.accountNumberFull || '';
      setAccountNumber(acc);
      setConfirmAccount(acc);
      setIfsc(bankAccount.ifscCode || '');
      setHolderName(bankAccount.accountHolderName || '');
      setUpi(bankAccount.upiId || '');
    }
  }, [bankAccount]);

  const handleSaveBank = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !ifsc.trim() || !holderName.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all mandatory bank account fields.');
      return;
    }
    if (accountNumber.trim() !== confirmAccount.trim()) {
      Alert.alert('Mismatch', 'Account numbers do not match. Please verify.');
      return;
    }
    setSaving(true);
    try {
      await updateBankAccount({
        bankName: bankName.trim(),
        accountNumberFull: accountNumber.trim(),
        ifscCode: ifsc.trim().toUpperCase(),
        accountHolderName: holderName.trim(),
        upiId: upi.trim(),
      });
      setIsEditing(false);
      Alert.alert('Bank Account Verified', 'Your payout bank account has been updated and verified for direct transfers.');
      fetchWalletData();
    } catch {
      Alert.alert('Error', 'Failed to update bank details.');
    } finally {
      setSaving(false);
    }
  };

  const handleInstantPayout = async () => {
    const pending = walletBalance;
    if (pending <= 0) {
      Alert.alert('No Available Balance', 'You do not have any pending earnings available for instant transfer right now.');
      return;
    }

    if (!bankAccount) {
      Alert.alert('No Bank Account', 'Please add and verify your bank account details before requesting a withdrawal.');
      setIsEditing(true);
      return;
    }

    if (bankAccount.verificationStatus !== 'VERIFIED') {
      Alert.alert(
        'Bank Account Pending',
        'Your bank account details are currently under review by Admin. Payouts will be enabled once verified.'
      );
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Transfer ₹${pending} immediately to ${bankAccount.bankName} (${bankAccount.accountNumberMasked})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw Now',
          onPress: async () => {
            const res = await requestPayout(pending);
            Alert.alert('Transfer Initiated', res.message);
            fetchWalletData();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF3B98']} tintColor="#FF3B98" />}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSubScreen('None')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#071B52" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Wallet</Text>
          <Text style={styles.screenSubtitle}>Delivering Smiles • Fast · Safe · Together</Text>
        </View>
      </View>

      {/* 1. Available Balance Card (Wireframe Screen 13) */}
      <View style={styles.availableBalanceCard}>
        <View style={styles.balanceTopRow}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <View style={styles.autoTransferPill}>
            <Ionicons name="flash" size={11} color="#13B978" />
            <Text style={styles.autoTransferText}>Instant Transfer</Text>
          </View>
        </View>

        <Text style={styles.balanceAmount}>
          ₹ {walletBalance}
        </Text>
        <Text style={styles.balanceSub}>Daily automatic batch payout at 11:59 PM</Text>

        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={handleInstantPayout}
          activeOpacity={0.85}
        >
          <Text style={styles.withdrawBtnText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Linked Bank Account Card */}
      {!isEditing && !bankAccount ? (
        <View style={styles.bankCard}>
          <View style={styles.bankHeaderRow}>
            <View style={styles.bankLeft}>
              <View style={styles.bankIconCircle}>
                <Ionicons name="business" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.bankTitle}>No Bank Account Linked</Text>
                <Text style={styles.bankSubtitle}>Add bank details to receive payouts</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.linkBankActionBtn}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FF3B98" />
            <Text style={styles.linkBankActionText}>Link Bank Account</Text>
          </TouchableOpacity>
        </View>
      ) : !isEditing && bankAccount ? (
        <View style={styles.bankCard}>
          <View style={styles.bankHeaderRow}>
            <View style={styles.bankLeft}>
              <View style={styles.bankIconCircle}>
                <Ionicons name="business" size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.bankTitle}>{bankAccount.bankName}</Text>
                <Text style={styles.bankSubtitle}>A/C: {bankAccount.accountNumberMasked}</Text>
              </View>
            </View>
            <View
              style={[
                styles.verifiedBadge,
                {
                  backgroundColor:
                    bankAccount.verificationStatus === 'VERIFIED'
                      ? '#DCFCE7'
                      : '#FEF3C7',
                },
              ]}
            >
              <Text
                style={[
                  styles.verifiedBadgeText,
                  {
                    color:
                      bankAccount.verificationStatus === 'VERIFIED'
                        ? '#16A34A'
                        : '#D97706',
                  },
                ]}
              >
                {bankAccount.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
              </Text>
            </View>
          </View>

          <View style={styles.bankDetailsGrid}>
            <View style={styles.bankDetailItem}>
              <Text style={styles.bankDetailLabel}>IFSC CODE</Text>
              <Text style={styles.bankDetailValue}>{bankAccount.ifscCode}</Text>
            </View>
            <View style={styles.bankDetailItem}>
              <Text style={styles.bankDetailLabel}>ACCOUNT HOLDER</Text>
              <Text style={styles.bankDetailValue}>{bankAccount.accountHolderName}</Text>
            </View>
            {bankAccount.upiId ? (
              <View style={styles.bankDetailItem}>
                <Text style={styles.bankDetailLabel}>UPI ID</Text>
                <Text style={styles.bankDetailValue}>{bankAccount.upiId}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.changeBankBtn}
            onPress={() => {
              if (bankAccount) {
                setBankName(bankAccount.bankName || '');
                const acc = bankAccount.accountNumberFull || '';
                setAccountNumber(acc);
                setConfirmAccount(acc);
                setIfsc(bankAccount.ifscCode || '');
                setHolderName(bankAccount.accountHolderName || '');
                setUpi(bankAccount.upiId || '');
              }
              setIsEditing(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.changeBankText}>Change Bank Details</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Edit Bank Form */
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Update Bank Account</Text>

          <Text style={styles.fieldLabel}>BANK NAME</Text>
          <TextInput
            style={styles.input}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g. State Bank of India, HDFC Bank"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.fieldLabel}>ACCOUNT HOLDER NAME</Text>
          <TextInput
            style={styles.input}
            value={holderName}
            onChangeText={setHolderName}
            placeholder="Full legal name"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.fieldLabel}>BANK ACCOUNT NUMBER</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Enter account number"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>CONFIRM ACCOUNT NUMBER</Text>
          <TextInput
            style={styles.input}
            value={confirmAccount}
            onChangeText={setConfirmAccount}
            placeholder="Re-enter account number"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>IFSC CODE (11 CHARACTERS)</Text>
          <TextInput
            style={styles.input}
            value={ifsc}
            onChangeText={setIfsc}
            placeholder="e.g. HDFC0000182"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />

          <Text style={styles.fieldLabel}>UPI ID (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            value={upi}
            onChangeText={setUpi}
            placeholder="e.g. name@okhdfcbank"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
          />

          <View style={styles.formBtnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsEditing(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={handleSaveBank}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Verifying...' : 'Save & Verify'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Transaction History */}
      <View style={styles.txHeaderRow}>
        <Text style={styles.txSectionTitle}>Transaction History</Text>
        <Text style={styles.txFilterLabel}>Recent Activity</Text>
      </View>

      {loadingTransactions ? (
        <View style={styles.emptyStateCard}>
          <ActivityIndicator size="small" color="#FF3B98" />
          <Text style={styles.emptyStateSub}>Loading your transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={32} color="#94A3B8" />
          </View>
          <Text style={styles.emptyStateTitle}>No transactions yet</Text>
          <Text style={styles.emptyStateSub}>
            Your delivery earnings, tips, and payouts will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.txList}>
          {transactions.map((tx) => {
            const isWithdrawal = tx.amount < 0 || tx.type === 'WITHDRAWAL';
            return (
              <View key={tx.id} style={styles.txItemCard}>
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIconCircle,
                      {
                        backgroundColor: isWithdrawal ? '#FEE2E2' : '#DCFCE7',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        tx.type === 'WITHDRAWAL'
                          ? 'arrow-up-circle'
                          : tx.type === 'TIP'
                          ? 'heart'
                          : tx.type === 'INCENTIVE'
                          ? 'trophy'
                          : 'cash'
                      }
                      size={20}
                      color={isWithdrawal ? '#EF4444' : '#13B978'}
                    />
                  </View>
                  <View>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txTime}>{tx.timestamp}</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.txAmount,
                    { color: isWithdrawal ? '#EF4444' : '#13B978' },
                  ]}
                >
                  {isWithdrawal ? `-₹${Math.abs(tx.amount)}` : `+₹${tx.amount}`}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  availableBalanceCard: {
    backgroundColor: '#071B52',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#071B52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  autoTransferPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 185, 120, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  autoTransferText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#13B978',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  balanceSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF3B98',
    marginTop: 4,
    marginBottom: 18,
  },
  withdrawBtn: {
    backgroundColor: '#FF3B98',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#FF3B98',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  bankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bankIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
  },
  bankSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#13B978',
  },
  bankDetailsGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  bankDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  bankDetailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#071B52',
  },
  changeBankBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  changeBankText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  linkBankActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 152, 0.25)',
  },
  linkBankActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF3B98',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#071B52',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#FF3B98',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  txSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#071B52',
  },
  txFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  txList: {
    gap: 10,
  },
  txItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#071B52',
  },
  txTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  bottomSpacer: {
    height: 36,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#071B52',
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
