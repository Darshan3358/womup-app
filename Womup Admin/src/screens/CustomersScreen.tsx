import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Search, UserPlus, ChevronRight, ShieldAlert, Phone } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';
import { Customer } from '../types/admin';

export const CustomersScreen: React.FC = () => {
  const { customers, setSelectedCustomer, setSubView, setActiveModal } = useAdminState();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Blocked'>('All');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || c.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSubView('CustomerProfile');
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.topSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone or ID..."
            placeholderTextColor={COLORS.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['All', 'Active', 'Blocked'] as const).map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.activeFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Customer List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No customers found matching criteria</Text>
          </View>
        ) : (
          filteredCustomers.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.customerCard}
              onPress={() => handleSelectCustomer(c)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: c.avatar }} style={styles.avatar} />

              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  {c.type === 'Corporate' && (
                    <View style={styles.corpBadge}>
                      <Text style={styles.corpText}>CORP</Text>
                    </View>
                  )}
                </View>

                <View style={styles.metaRow}>
                  <Phone size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                  <Text style={styles.phoneText}>{c.phone}</Text>
                </View>

                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: c.status === 'Active' ? COLORS.success : COLORS.error },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: c.status === 'Active' ? COLORS.success : COLORS.error },
                    ]}
                  >
                    {c.status}
                  </Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.zoneText}>{c.zoneName}</Text>
                </View>
              </View>

              <View style={styles.rightCol}>
                <Text style={styles.spendAmount}>₹{c.spend.toLocaleString()}</Text>
                <Text style={styles.orderCount}>{c.totalOrders} orders</Text>
                <ChevronRight size={18} color={COLORS.secondaryText} style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Customer FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setActiveModal('AddCustomer')}
        activeOpacity={0.9}
      >
        <UserPlus size={22} color={COLORS.white} />
        <Text style={styles.fabText}>Add Customer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.sm,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 8,
  },
  activeFilterPill: {
    backgroundColor: COLORS.hotPink,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  emptyState: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: SPACING.md,
    backgroundColor: COLORS.lightBlueLavender,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  corpBadge: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  corpText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  phoneText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dotSeparator: {
    marginHorizontal: 4,
    color: COLORS.secondaryText,
    fontSize: 10,
  },
  zoneText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  spendAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orderCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    elevation: 6,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});
