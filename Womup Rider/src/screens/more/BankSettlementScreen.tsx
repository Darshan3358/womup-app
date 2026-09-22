import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { COLORS } from '../../theme/colors';

export const BankSettlementScreen: React.FC = () => {
  const { bankAccount, updateBankAccount, setSubScreen, settlementSummary, requestPayout } = useRider();

  const [bankName, setBankName] = useState(bankAccount?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(bankAccount?.accountNumberFull || '');
  const [confirmAccount, setConfirmAccount] = useState(bankAccount?.accountNumberFull || '');
  const [ifsc, setIfsc] = useState(bankAccount?.ifscCode || '');
  const [holderName, setHolderName] = useState(bankAccount?.accountHolderName || '');
  const [upi, setUpi] = useState(bankAccount?.upiId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bankAccount) {
      setBankName(bankAccount.bankName);
      setAccountNumber(bankAccount.accountNumberFull || '');
      setConfirmAccount(bankAccount.accountNumberFull || '');
      setIfsc(bankAccount.ifscCode);
      setHolderName(bankAccount.accountHolderName);
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
    } catch {
      Alert.alert('Error', 'Failed to update bank details.');
    } finally {
      setSaving(false);
    }
  };

  const handleInstantPayout = async () => {
    const pending = settlementSummary?.pendingTransfer || 0;
    if (pending <= 0) {
      Alert.alert('No Pending Balance', 'You do not have any pending earnings available for instant transfer right now.');
      return;
    }

    if (!bankAccount) {
      Alert.alert('No Bank Account', 'Please add and verify your bank account details before requesting an IMPS transfer.');
      setIsEditing(true);
      return;
    }

    Alert.alert(
      'Confirm Instant Transfer',
      `Transfer ₹${pending} immediately to ${bankAccount.bankName} (${bankAccount.accountNumberMasked})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer Now',
          onPress: async () => {
            const res = await requestPayout(pending);
            Alert.alert('Transfer Initiated', res.message);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={[styles.backRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => setSubScreen('None')}>
        <Ionicons name="arrow-back" size={16} color={COLORS.hotPink} />
        <Text style={styles.backArrow}>Back to Menu</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Bank Account & Payouts</Text>
      <Text style={styles.screenSubtitle}>
        Direct IMPS / NEFT settlement destination for your daily delivery earnings.
      </Text>

      {/* Available Balance & Payout CTA */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>AVAILABLE FOR TRANSFER</Text>
        <Text style={styles.balanceAmount}>₹{settlementSummary?.pendingTransfer || 0}</Text>
        <Text style={styles.balanceSub}>Daily automatic batch settlement at 11:59 PM</Text>

        <TouchableOpacity
          style={styles.transferBtn}
          onPress={handleInstantPayout}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Ionicons name="flash" size={16} color={COLORS.white} />
            <Text style={styles.transferBtnText}>REQUEST INSTANT IMPS TRANSFER</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bank Account Section */}
      {!isEditing && !bankAccount ? (
        <View style={styles.verifiedCard}>
          <View style={styles.verifiedHeader}>
            <View style={styles.bankLeft}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="business-outline" size={22} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.bankTitle}>No Bank Account Linked</Text>
                <Text style={styles.accountMasked}>
                  Add your bank details to receive instant payouts
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.changeBankBtn}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.changeBankText}>Link Bank Account</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : !isEditing && bankAccount ? (
        <View style={styles.verifiedCard}>
          <View style={styles.verifiedHeader}>
            <View style={styles.bankLeft}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="business-outline" size={22} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.bankTitle}>{bankAccount.bankName}</Text>
                <Text style={styles.accountMasked}>
                  A/C: {bankAccount.accountNumberMasked}
                </Text>
              </View>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>IFSC CODE</Text>
              <Text style={styles.detailVal}>{bankAccount.ifscCode}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ACCOUNT HOLDER</Text>
              <Text style={styles.detailVal}>{bankAccount.accountHolderName}</Text>
            </View>
            {bankAccount.upiId ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>UPI VPA</Text>
                <Text style={styles.detailVal}>{bankAccount.upiId}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.changeBankBtn}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={styles.changeBankText}>Change Payout Bank Account</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        /* Edit Form */
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Update Bank Account Details</Text>

          <Text style={styles.fieldLabel}>BANK NAME</Text>
          <TextInput
            style={styles.input}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g. State Bank of India, HDFC Bank"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.fieldLabel}>ACCOUNT HOLDER NAME (AS PER PASSBOOK)</Text>
          <TextInput
            style={styles.input}
            value={holderName}
            onChangeText={setHolderName}
            placeholder="Full legal name"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.fieldLabel}>BANK ACCOUNT NUMBER</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Enter account number"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>CONFIRM ACCOUNT NUMBER</Text>
          <TextInput
            style={styles.input}
            value={confirmAccount}
            onChangeText={setConfirmAccount}
            placeholder="Re-enter account number"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>IFSC CODE (11 CHARACTERS)</Text>
          <TextInput
            style={styles.input}
            value={ifsc}
            onChangeText={setIfsc}
            placeholder="e.g. HDFC0000182"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
          />

          <Text style={styles.fieldLabel}>UPI ID (OPTIONAL FOR INSTANT VPA PAYOUTS)</Text>
          <TextInput
            style={styles.input}
            value={upi}
            onChangeText={setUpi}
            placeholder="e.g. yourname@okhdfcbank"
            placeholderTextColor={COLORS.textMuted}
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

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  backRow: {
    marginBottom: 12,
  },
  backArrow: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  balanceCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    color: COLORS.secondaryText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 6,
  },
  balanceSub: {
    color: COLORS.hotPink,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  transferBtn: {
    backgroundColor: COLORS.onlineGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  transferBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  verifiedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIcon: {
    fontSize: 26,
  },
  bankTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  accountMasked: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: COLORS.onlineGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: COLORS.onlineGreenDark,
    fontSize: 10,
    fontWeight: '800',
  },
  detailsGrid: {
    backgroundColor: COLORS.cardBackground,
    padding: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  changeBankBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  changeBankText: {
    color: COLORS.blue,
    fontWeight: '700',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondaryText,
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.hotPink,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13,
  },
  bottomSpacer: {
    height: 30,
  },
});
