import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { PlusCircle, Calendar, Users, Send, Settings, Coins, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { useAdminState } from '../context/AdminStateContext';

export const MarketingScreen: React.FC = () => {
  const { campaigns, createOrUpdateCampaign, setActiveModal, setSubView } = useAdminState();

  const [activeTab, setActiveTab] = useState<'Scheduled' | 'Completed'>('Scheduled');

  const filteredCampaigns = campaigns.filter((c) =>
    activeTab === 'Scheduled' ? c.status === 'Scheduled' : c.status === 'Completed'
  );

  const handleToggleCampaign = (id: string, currentVal: boolean) => {
    createOrUpdateCampaign({ id, isEnabled: !currentVal });
  };

  return (
    <View style={styles.container}>
      {/* Top Segmented Tabs */}
      <View style={styles.topSection}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Scheduled' && styles.activeTab]}
            onPress={() => setActiveTab('Scheduled')}
          >
            <Text style={[styles.tabText, activeTab === 'Scheduled' && styles.activeTabText]}>
              Scheduled ({campaigns.filter((c) => c.status === 'Scheduled').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Campaign CTA Button */}
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setActiveModal('CampaignBuilder')}
          activeOpacity={0.85}
        >
          <PlusCircle size={18} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.createBtnText}>+ Create Campaign</Text>
        </TouchableOpacity>
      </View>

      {/* Campaigns List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Text style={styles.sectionTitle}>Active Email & Push Campaigns</Text>

        {filteredCampaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No campaigns found</Text>
          </View>
        ) : (
          filteredCampaigns.map((camp) => (
            <View key={camp.id} style={styles.campaignCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.campaignTitle}>{camp.name}</Text>
                  <View style={styles.metaRow}>
                    <Calendar size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                    <Text style={styles.metaText}>{camp.scheduledAt}</Text>
                  </View>
                </View>

                <Switch
                  value={camp.isEnabled}
                  onValueChange={() => handleToggleCampaign(camp.id, camp.isEnabled)}
                  trackColor={{ false: COLORS.border, true: COLORS.softPinkGradient }}
                  thumbColor={camp.isEnabled ? COLORS.hotPink : COLORS.secondaryText}
                />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.audienceTag}>
                  <Users size={12} color={COLORS.purple} style={{ marginRight: 4 }} />
                  <Text style={styles.audienceText}>{camp.targetAudience}</Text>
                </View>

                <Text style={styles.subjectText} numberOfLines={1}>
                  "{camp.subject}"
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Extended Admin Navigation Section */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>Extended Control Modules</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setSubView('ShoppingCoin')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FCE1F5' }]}>
            <Coins size={18} color={COLORS.hotPink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Shopping Coin Ledger</Text>
            <Text style={styles.menuSub}>Rules, rewards, user balances & adjustments</Text>
          </View>
          <ChevronRight size={18} color={COLORS.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setSubView('AuditLogs')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#E2E6F9' }]}>
            <ShieldCheck size={18} color={COLORS.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Security & Audit Logs</Text>
            <Text style={styles.menuSub}>Detailed history of admin price changes & actions</Text>
          </View>
          <ChevronRight size={18} color={COLORS.secondaryText} />
        </TouchableOpacity>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.pill,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  activeTab: {
    backgroundColor: COLORS.purple,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.hotPink,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
  },
  createBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  campaignCard: {
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
  },
  audienceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlueLavender,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginBottom: 6,
  },
  audienceText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.purple,
  },
  subjectText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
