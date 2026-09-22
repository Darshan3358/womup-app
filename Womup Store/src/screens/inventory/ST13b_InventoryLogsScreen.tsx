import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { InventoryLogItem } from '../../types/store.types';
import { COLORS } from '../../theme/colors';

export const ST13b_InventoryLogsScreen: React.FC = () => {
  const { setSubScreen } = useStore();
  const [logs, setLogs] = useState<InventoryLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await StoreApiService.getInventoryLogs();
        setLogs(data || []);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'RESTOCK':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: COLORS.primary };
      case 'DAMAGE':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: COLORS.danger };
      case 'PICK':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: COLORS.accentCyan };
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', text: COLORS.warning };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSubScreen(null)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Inventory Audit Logs</Text>
          <Text style={styles.subtitle}>Audit trail of dark store stock changes</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loaderText}>Loading audit logs...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const badge = getBadgeStyle(item.changeType);
            const isPositive = item.delta > 0;
            return (
              <View style={styles.logCard}>
                <View style={styles.logTopRow}>
                  <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.typeText, { color: badge.text }]}>
                      {item.changeType}
                    </Text>
                  </View>
                  <Text style={[styles.deltaText, { color: isPositive ? COLORS.primary : COLORS.danger }]}>
                    {isPositive ? `+${item.delta}` : item.delta} units
                  </Text>
                </View>

                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.reasonText}>Reason: {item.reason}</Text>

                <View style={styles.logBottomRow}>
                  <Text style={styles.metaInfo}>
                    Stock: {item.beforeQty} → {item.afterQty} • By: {item.staffName}
                  </Text>
                  <Text style={styles.timeInfo}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyArea}>
              <Ionicons name="receipt-outline" size={42} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No logs recorded yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  loaderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  logCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  deltaText: {
    fontSize: 14,
    fontWeight: '800',
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  reasonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  logBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 10,
  },
  metaInfo: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  timeInfo: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  emptyArea: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
});
