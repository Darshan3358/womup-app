import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ShieldCheck, Clock, UserCheck } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const AuditLogsScreen: React.FC = () => {
  const { auditLogs } = useAdminState();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <ShieldCheck size={24} color={COLORS.purple} style={{ marginRight: 8 }} />
        <View>
          <Text style={styles.title}>System Security & Audit Log</Text>
          <Text style={styles.subtitle}>Immutable operational record of administrative actions</Text>
        </View>
      </View>

      {auditLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No security or audit logs recorded yet</Text>
        </View>
      ) : (
        auditLogs.map((log) => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.actionName}>{log.action}</Text>
              <View style={styles.timeTag}>
                <Clock size={11} color={COLORS.secondaryText} style={{ marginRight: 3 }} />
                <Text style={styles.timeText}>{log.timestamp}</Text>
              </View>
            </View>

            <View style={styles.adminRow}>
              <UserCheck size={12} color={COLORS.purple} style={{ marginRight: 4 }} />
              <Text style={styles.adminName}>{log.adminName}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.targetText}>{log.target}</Text>
            </View>

            <Text style={styles.detailsText}>{log.details}</Text>
          </View>
        ))
      )}
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
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  logCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: COLORS.secondaryText,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  adminName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.purple,
  },
  dot: {
    marginHorizontal: 4,
    color: COLORS.secondaryText,
  },
  targetText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  detailsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
