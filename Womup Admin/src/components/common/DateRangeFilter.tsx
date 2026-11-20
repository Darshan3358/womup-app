import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Calendar, X, Check, ChevronDown } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';

export type DatePreset = 'All Time' | 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Custom';

export interface DateFilterRange {
  preset: DatePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

interface DateRangeFilterProps {
  currentPreset?: DatePreset;
  onFilterChange: (range: DateFilterRange) => void;
  compact?: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  currentPreset = 'All Time',
  onFilterChange,
  compact = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(currentPreset);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const PRESETS: DatePreset[] = ['All Time', 'Today', 'Yesterday', 'This Week', 'This Month', 'Custom'];

  const getRangeForPreset = (preset: DatePreset): DateFilterRange => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'All Time') {
      return { preset: 'All Time' };
    }
    if (preset === 'Today') {
      return { preset: 'Today', startDate: todayStr, endDate: todayStr };
    }
    if (preset === 'Yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { preset: 'Yesterday', startDate: yStr, endDate: yStr };
    }
    if (preset === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      return { preset: 'This Week', startDate: monday.toISOString().split('T')[0], endDate: todayStr };
    }
    if (preset === 'This Month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { preset: 'This Month', startDate: firstDay.toISOString().split('T')[0], endDate: todayStr };
    }
    return { preset: 'Custom', startDate: customStart, endDate: customEnd };
  };

  const handleSelectPreset = (preset: DatePreset) => {
    if (preset === 'Custom') {
      setShowCustomModal(true);
      return;
    }
    setSelectedPreset(preset);
    const range = getRangeForPreset(preset);
    onFilterChange(range);
  };

  const applyCustomDates = () => {
    if (!customStart) return;
    setSelectedPreset('Custom');
    setShowCustomModal(false);
    onFilterChange({
      preset: 'Custom',
      startDate: customStart,
      endDate: customEnd || customStart,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.iconBox}>
          <Calendar size={13} color={COLORS.purple} />
          <Text style={styles.filterLabel}>Period:</Text>
        </View>

        {PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset;
          return (
            <TouchableOpacity
              key={preset}
              style={[
                styles.pill,
                isSelected && styles.pillActive,
                compact && styles.pillCompact,
              ]}
              onPress={() => handleSelectPreset(preset)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {preset === 'Custom' && selectedPreset === 'Custom' && customStart
                  ? `${customStart.slice(5)} to ${(customEnd || customStart).slice(5)}`
                  : preset}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modal for Custom Date Range */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color={COLORS.purple} />
                <Text style={styles.modalTitle}>Custom Date Range</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2026-11-01"
                placeholderTextColor="#9CA3AF"
                value={customStart}
                onChangeText={setCustomStart}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2026-11-20"
                placeholderTextColor="#9CA3AF"
                value={customEnd}
                onChangeText={setCustomEnd}
              />

              <View style={styles.quickDateRow}>
                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    setCustomStart(d.toISOString().split('T')[0]);
                    setCustomEnd(new Date().toISOString().split('T')[0]);
                  }}
                >
                  <Text style={styles.quickDateText}>Last 7 Days</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickDateBtn}
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 30);
                    setCustomStart(d.toISOString().split('T')[0]);
                    setCustomEnd(new Date().toISOString().split('T')[0]);
                  }}
                >
                  <Text style={styles.quickDateText}>Last 30 Days</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={applyCustomDates}>
                <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.applyBtnText}>Apply Date Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  iconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 2,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillCompact: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...Platform.select({
      web: { boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
      default: { elevation: 6 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  modalBody: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    marginTop: 16,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
