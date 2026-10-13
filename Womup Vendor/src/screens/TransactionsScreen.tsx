import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Receipt,
  Search,
  CheckCircle2,
  Coins,
  Banknote,
  QrCode,
  Calendar,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { useVendor } from '../context/VendorAuthContext';

export const TransactionsScreen: React.FC = () => {
  const { transactions } = useVendor();
  const [filterPeriod, setFilterPeriod] = useState<'All' | 'Today' | 'Yesterday'>('All');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((t) => {
    if (filterPeriod !== 'All' && t.date !== filterPeriod) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.orderNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search & Filter Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order # or customer..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Period Chips */}
        <View style={styles.periodRow}>
          {['All', 'Today', 'Yesterday'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodChip,
                filterPeriod === p && styles.periodChipActive,
              ]}
              onPress={() => setFilterPeriod(p as any)}
            >
              <Text
                style={[
                  styles.periodText,
                  filterPeriod === p && styles.periodTextActive,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transaction List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Receipt size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
          </View>
        ) : (
          filtered.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txHeader}>
                <View>
                  <Text style={styles.customerName}>{tx.customerName}</Text>
                  <Text style={styles.orderNumber}>
                    {tx.orderNumber} • {tx.date} {tx.time || ''}
                  </Text>
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.billTotal}>₹{tx.billAmount.toLocaleString()}</Text>
                  <View style={styles.statusPill}>
                    <CheckCircle2 size={11} color="#059669" />
                    <Text style={styles.statusText}>Verified</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Settlement Row */}
              <View style={styles.splitRow}>
                <View style={styles.splitCol}>
                  <Text style={styles.splitLabel}>Coins Used</Text>
                  <Text style={styles.splitVal}>₹{tx.coinsUsed}</Text>
                </View>

                <View style={styles.splitCol}>
                  <Text style={styles.splitLabel}>Cash Collected</Text>
                  <Text style={styles.splitVal}>₹{tx.cashPaid}</Text>
                </View>

                <View style={styles.splitCol}>
                  <Text style={styles.splitLabel}>Platform Fee</Text>
                  <Text style={styles.splitVal}>₹{tx.platformCommission}</Text>
                </View>

                <View style={[styles.splitCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.splitLabel}>Your Payout</Text>
                  <Text style={[styles.splitVal, { color: '#2563EB', fontWeight: '900' }]}>
                    ₹{tx.vendorPayout.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  periodChipActive: {
    backgroundColor: COLORS.navy,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderNumber: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  billTotal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitCol: {
    gap: 2,
  },
  splitLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  splitVal: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
});
