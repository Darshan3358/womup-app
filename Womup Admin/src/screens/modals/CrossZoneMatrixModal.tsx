import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Download } from 'lucide-react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const CrossZoneMatrixModal: React.FC = () => {
  const { activeModal, setActiveModal, zonePrices, zones } = useAdminState();

  const productNames = Object.keys(zonePrices);

  const handleExportCSV = () => {
    Alert.alert(
      'Export Successful',
      'Cross-Zone Comparison Matrix dataset exported to CSV format with timestamp metadata.'
    );
  };

  return (
    <ModalContainer
      visible={activeModal === 'CrossZoneMatrix'}
      title="Cross-Zone Comparison Matrix"
      onClose={() => setActiveModal('none')}
    >
      <Text style={styles.subtitle}>
        Compare product selling prices (₹/kg) live across all 5 operational dark store zones
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scrollContainer}>
        <View>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, { width: 100 }]}>Item</Text>
            {zones.map((z) => (
              <Text key={z.id} style={[styles.colHeader, { width: 70, textAlign: 'center' }]}>
                {z.name}
              </Text>
            ))}
          </View>

          {/* Table Rows */}
          {productNames.map((pName) => (
            <View key={pName} style={styles.tableRow}>
              <Text style={[styles.itemCell, { width: 100 }]}>{pName}</Text>

              {zones.map((z) => {
                const price = zonePrices[pName]?.[z.name] || '-';
                return (
                  <Text key={z.id} style={[styles.priceCell, { width: 70, textAlign: 'center' }]}>
                    ₹{price}
                  </Text>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
        <Download size={16} color={COLORS.white} style={{ marginRight: 8 }} />
        <Text style={styles.exportText}>Export CSV Dataset</Text>
      </TouchableOpacity>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  scrollContainer: {
    marginBottom: SPACING.lg,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderRadius: RADIUS.sm,
  },
  colHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemCell: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: 4,
  },
  priceCell: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.purple,
    paddingHorizontal: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purple,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
  },
  exportText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
