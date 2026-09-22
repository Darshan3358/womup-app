import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

export const ST14_ShiftHistoryScreen: React.FC = () => {
  const { setSubScreen } = useStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await StoreApiService.getHistory();
        setHistory(data || []);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSubScreen(null)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Shift History</Text>
          <Text style={styles.subtitle}>Past 7-day fulfillment performance</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderArea}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loaderText}>Loading shift history...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.sessionCard}>
              <View style={styles.dateRow}>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>{item.accuracy}% Accuracy</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Orders Picked</Text>
                  <Text style={styles.statVal}>{item.ordersPicked}</Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Avg Speed</Text>
                  <Text style={[styles.statVal, { color: COLORS.accentCyan }]}>{item.avgTime}</Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Status</Text>
                  <Text style={[styles.statVal, { color: COLORS.primary }]}>COMPLETED</Text>
                </View>
              </View>
            </View>
          )}
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
  sessionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  accuracyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  accuracyText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  statVal: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
});
