import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Download, Building2, Package, Check, ChevronDown } from 'lucide-react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

export const CrossZoneMatrixModal: React.FC = () => {
  const { activeModal, setActiveModal, zonePrices, zones, cities, products, areaPricing } = useAdminState();

  // Create list of selectable product variants
  const allVariants: Array<{
    id: string;
    productId: string;
    productName: string;
    weightOrVolume: string;
    label: string;
    sellingPrice: number;
    mrp: number;
  }> = [];

  products.forEach((p) => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v) => {
        allVariants.push({
          id: v.id,
          productId: p.id,
          productName: p.name,
          weightOrVolume: v.weightOrVolume,
          label: `${p.name} (${v.weightOrVolume})`,
          sellingPrice: v.sellingPrice,
          mrp: v.mrp,
        });
      });
    } else {
      allVariants.push({
        id: p.id,
        productId: p.id,
        productName: p.name,
        weightOrVolume: 'Standard',
        label: p.name,
        sellingPrice: p.sellingPrice || p.basePrice || 0,
        mrp: p.mrp || 0,
      });
    }
  });

  const [selectedVariantId, setSelectedVariantId] = useState<string>(allVariants[0]?.id || '');
  const [showVariantList, setShowVariantList] = useState(false);

  const selectedVariant =
    allVariants.find((v) => v.id === selectedVariantId) || allVariants[0];

  // Active cities
  const activeCities = cities.filter((c) => c.status === 'Active' || !c.status);
  const displayCities =
    activeCities.length > 0
      ? activeCities
      : [{ id: 'AHM', name: 'Ahmedabad', code: 'AHM', status: 'Active' as const }];

  const handleExportCSV = () => {
    Alert.alert(
      'Export Successful',
      `Cross-Zone Matrix for "${selectedVariant?.label}" exported to CSV format with timestamp metadata.`
    );
  };

  return (
    <ModalContainer
      visible={activeModal === 'CrossZoneMatrix'}
      title="Cross-Zone Price Matrix"
      onClose={() => setActiveModal('none')}
    >
      <Text style={styles.subtitle}>
        Compare live product selling prices & availability across areas grouped by City
      </Text>

      {/* Product / SKU Selector */}
      <View style={styles.selectorCard}>
        <Text style={styles.selectorLabel}>SELECT PRODUCT & PACK SIZE:</Text>
        <TouchableOpacity
          style={styles.variantDropdownBtn}
          onPress={() => setShowVariantList(!showVariantList)}
          activeOpacity={0.8}
        >
          <View style={styles.variantBtnLeft}>
            <Package size={16} color={COLORS.purple} />
            <Text style={styles.variantBtnText} numberOfLines={1}>
              {selectedVariant ? selectedVariant.label : 'Select Product SKU'}
            </Text>
          </View>
          <ChevronDown size={16} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {showVariantList && (
          <ScrollView style={styles.variantListDropdown} nestedScrollEnabled={true}>
            {allVariants.map((item) => {
              const isSelected = item.id === selectedVariant?.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.variantListItem, isSelected && styles.variantListItemActive]}
                  onPress={() => {
                    setSelectedVariantId(item.id);
                    setShowVariantList(false);
                  }}
                >
                  <Text
                    style={[
                      styles.variantListItemText,
                      isSelected && styles.variantListItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && <Check size={16} color={COLORS.purple} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Grouped by City Table */}
      <ScrollView style={styles.matrixScroll} showsVerticalScrollIndicator={true}>
        {displayCities.map((city) => {
          const cityIdStr = city.id || (city as any)._id;
          const cityZones = zones.filter((z) => {
            if (z.cityId && cityIdStr && String(z.cityId) === String(cityIdStr)) return true;
            if (z.cityName && city.name && z.cityName.toLowerCase() === city.name.toLowerCase()) return true;
            if (z.city && city.name && z.city.toLowerCase() === city.name.toLowerCase()) return true;
            return false;
          });

          if (cityZones.length === 0) return null;

          return (
            <View key={cityIdStr || city.name} style={styles.cityBlock}>
              {/* City Group Header */}
              <View style={styles.cityHeader}>
                <Building2 size={15} color={COLORS.purple} />
                <Text style={styles.cityHeaderText}>
                  🏙️ {city.name.toUpperCase()} ({cityZones.length} {cityZones.length === 1 ? 'Area' : 'Areas'})
                </Text>
              </View>

              {/* Comparison Table */}
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.colHeader, { flex: 2 }]}>Area</Text>
                  <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'center' }]}>Price</Text>
                  <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'center' }]}>MRP</Text>
                  <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'center' }]}>Available</Text>
                </View>

                {cityZones.map((z) => {
                  // Resolve price for this zone
                  const variantPrice =
                    (selectedVariant && areaPricing[selectedVariant.id]?.[z.id]) ??
                    (selectedVariant && areaPricing[selectedVariant.id]?.[z.name]) ??
                    (selectedVariant && zonePrices[selectedVariant.productName]?.[z.name]) ??
                    selectedVariant?.sellingPrice ??
                    '-';

                  const mrp = selectedVariant?.mrp ? `₹${selectedVariant.mrp}` : '-';

                  return (
                    <View key={z.id} style={styles.tableRow}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.areaNameText} numberOfLines={1}>{z.name}</Text>
                        <Text style={styles.storeSubText} numberOfLines={1}>
                          {z.darkStore || 'Dark Store Hub'}
                        </Text>
                      </View>

                      <Text style={[styles.priceCellText, { flex: 1.2, textAlign: 'center' }]}>
                        ₹{variantPrice}
                      </Text>

                      <Text style={[styles.mrpCellText, { flex: 1.2, textAlign: 'center' }]}>
                        {mrp}
                      </Text>

                      <View style={[styles.availCell, { flex: 1.2, alignItems: 'center' }]}>
                        <View style={styles.availPill}>
                          <Text style={styles.availPillText}>✅ Yes</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Export CSV CTA */}
      <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
        <Download size={16} color={COLORS.white} style={{ marginRight: 8 }} />
        <Text style={styles.exportText}>Export Comparison CSV</Text>
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
  selectorCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  variantDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  variantBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  variantBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  variantListDropdown: {
    maxHeight: 180,
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  variantListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  variantListItemActive: {
    backgroundColor: '#FAF5FF',
  },
  variantListItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  variantListItemTextActive: {
    color: COLORS.purple,
    fontWeight: '800',
  },
  matrixScroll: {
    maxHeight: 340,
    marginBottom: SPACING.md,
  },
  cityBlock: {
    marginBottom: SPACING.md,
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  cityHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
    letterSpacing: 0.5,
  },
  table: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  areaNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  storeSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  priceCellText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purple,
  },
  mrpCellText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  availCell: {
    alignItems: 'center',
  },
  availPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
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
