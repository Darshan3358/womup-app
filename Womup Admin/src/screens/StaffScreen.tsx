import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { UserCheck, Star, RefreshCw, Phone } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';

export const StaffScreen: React.FC = () => {
  const { staff, setActiveModal } = useAdminState();

  const [activeRole, setActiveRole] = useState<'Picker' | 'Rider'>('Picker');
  const [dutyFilter, setDutyFilter] = useState<'All' | 'On Duty' | 'Off Duty'>('All');

  const filteredStaff = staff.filter((s) => {
    const matchesRole = s.role === activeRole;
    const matchesDuty = dutyFilter === 'All' || s.status === dutyFilter;
    return matchesRole && matchesDuty;
  });

  const onDutyCount = staff.filter((s) => s.status === 'On Duty').length;
  const offDutyCount = staff.filter((s) => s.status === 'Off Duty').length;

  return (
    <View style={styles.container}>
      {/* Top Segmented Controls */}
      <View style={styles.topSection}>
        <View style={styles.roleTabRow}>
          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'Picker' && styles.activeRoleTab]}
            onPress={() => setActiveRole('Picker')}
          >
            <Text
              style={[styles.roleTabText, activeRole === 'Picker' && styles.activeRoleTabText]}
            >
              Pickers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, activeRole === 'Rider' && styles.activeRoleTab]}
            onPress={() => setActiveRole('Rider')}
          >
            <Text
              style={[styles.roleTabText, activeRole === 'Rider' && styles.activeRoleTabText]}
            >
              Riders
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fleet KPI Summary Row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Staff</Text>
            <Text style={styles.kpiValue}>{staff.length}</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#E8F8F0' }]}>
            <Text style={styles.kpiLabel}>On Duty</Text>
            <Text style={[styles.kpiValue, { color: COLORS.success }]}>{onDutyCount}</Text>
          </View>
          <View style={[styles.kpiBox, { backgroundColor: '#FCECEE' }]}>
            <Text style={styles.kpiLabel}>Off Duty</Text>
            <Text style={[styles.kpiValue, { color: COLORS.error }]}>{offDutyCount}</Text>
          </View>
        </View>

        {/* Duty Status Filter Pills */}
        <View style={styles.filterRow}>
          {(['All', 'On Duty', 'Off Duty'] as const).map((filter) => {
            const isSelected = dutyFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                onPress={() => setDutyFilter(filter)}
              >
                <Text style={[styles.filterText, isSelected && styles.activeFilterText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Staff List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredStaff.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No staff members found</Text>
          </View>
        ) : (
          filteredStaff.map((member) => (
            <View key={member.id} style={styles.staffCard}>
              <Image source={{ uri: member.avatar }} style={styles.avatar} />

              <View style={styles.infoCol}>
                <Text style={styles.staffName}>{member.name}</Text>
                <Text style={styles.staffRoleMeta}>
                  {member.role} • {member.zone} ({member.darkStore})
                </Text>

                <View style={styles.phoneRow}>
                  <Phone size={11} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                  <Text style={styles.phoneText}>{member.phone}</Text>
                </View>

                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.dutyDot,
                      { backgroundColor: member.status === 'On Duty' ? COLORS.success : COLORS.error },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dutyStatusText,
                      { color: member.status === 'On Duty' ? COLORS.success : COLORS.error },
                    ]}
                  >
                    {member.status}
                  </Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.workloadText}>{member.activeOrdersCount} active orders</Text>
                </View>
              </View>

              <View style={styles.rightCol}>
                <View style={styles.ratingBadge}>
                  <Star size={11} color="#EAB308" fill="#EAB308" style={{ marginRight: 2 }} />
                  <Text style={styles.ratingText}>{member.rating}</Text>
                </View>

                <TouchableOpacity
                  style={styles.reassignBtn}
                  onPress={() => setActiveModal('StaffReassignment')}
                >
                  <RefreshCw size={12} color={COLORS.purple} />
                  <Text style={styles.reassignText}>Reassign</Text>
                </TouchableOpacity>
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
    backgroundColor: COLORS.background,
  },
  topSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  roleTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  activeRoleTab: {
    backgroundColor: COLORS.purple,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeRoleTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.card,
    padding: SPACING.sm,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  activeFilterPill: {
    backgroundColor: COLORS.hotPink,
  },
  filterText: {
    fontSize: 12,
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
    paddingBottom: 40,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.md,
  },
  infoCol: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  staffRoleMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginVertical: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  phoneText: {
    fontSize: 11,
    color: COLORS.secondaryText,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dutyStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dotSeparator: {
    marginHorizontal: 4,
    color: COLORS.secondaryText,
    fontSize: 10,
  },
  workloadText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  reassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlueLavender,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  reassignText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
    marginLeft: 4,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
