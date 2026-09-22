import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../context/StoreContext';
import { StoreApiService } from '../../services/storeApi';
import { COLORS } from '../../theme/colors';

export const ST04_StoreSelectionScreen: React.FC = () => {
  const { store, setAuthStep } = useStore();
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const data = await StoreApiService.getAvailableStores();
        setHubs(data || []);
      } catch (e) {
        console.log('Failed loading stores:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHubs();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Fulfillment Dark Store</Text>
        <Text style={styles.subtitle}>
          Choose your assigned dark store hub for today's shift
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching active dark stores...</Text>
        </View>
      ) : hubs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Stores Available</Text>
          <Text style={styles.emptyDesc}>
            No active dark store found. Contact your administrator to configure a store.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {hubs.map((hub) => {
            const isPrimary = hub.id === store?.id || hub.isPrimary;
            return (
              <TouchableOpacity
                key={hub.id}
                style={[styles.hubCard, isPrimary && styles.primaryCard]}
                onPress={() => setAuthStep('AUTHENTICATED')}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.hubIcon}>
                    <Ionicons name="storefront" size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hubName}>{hub.name}</Text>
                    <Text style={styles.hubCode}>{hub.code}</Text>
                  </View>
                  {isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryText}>ASSIGNED</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.hubAddress}>
                  <Ionicons name="location-outline" size={13} color={COLORS.textMuted} /> {hub.address}
                </Text>

                <View style={styles.bottomRow}>
                  <View style={styles.activeOrdersBadge}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.activeOrdersText}>
                      {hub.activeOrdersCount ?? 0} live incoming orders
                    </Text>
                  </View>

                  <View style={styles.enterBtn}>
                    <Text style={styles.enterBtnText}>START SHIFT</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFF" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  hubCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  hubIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  hubCode: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  primaryBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  hubAddress: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  activeOrdersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  activeOrdersText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  enterBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
