import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

interface BarcodeScannerProps {
  expectedBarcode?: string;
  onScan: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  expectedBarcode,
  onScan,
  title = 'Scan Product Barcode',
  subtitle = 'Align barcode inside viewfinder frame',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorFlash, setErrorFlash] = useState(false);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;

    if (expectedBarcode && code !== expectedBarcode) {
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 1200);
    }
    onScan(code);
    setManualCode('');
  };

  const handleSimulateScan = () => {
    const code = expectedBarcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    onScan(code);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Viewfinder Frame */}
      <View style={[styles.viewfinder, errorFlash && styles.viewfinderError]}>
        {/* Corner Brackets */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {/* Laser Scanner Beam */}
        <View style={styles.laserBeam} />

        <Ionicons name="barcode-outline" size={54} color={errorFlash ? COLORS.danger : COLORS.primary} />
        {expectedBarcode ? (
          <Text style={styles.expectedCode}>SKU: {expectedBarcode}</Text>
        ) : null}
      </View>

      {errorFlash && (
        <View style={styles.errorAlert}>
          <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>Barcode Mismatch! Please rescan correct item.</Text>
        </View>
      )}

      {/* Quick Camera Action */}
      <TouchableOpacity style={styles.cameraScanBtn} onPress={handleSimulateScan} activeOpacity={0.8}>
        <Ionicons name="camera" size={18} color="#FFF" />
        <Text style={styles.cameraScanText}>SIMULATE BARCODE SCAN</Text>
      </TouchableOpacity>

      {/* Manual Input Fallback */}
      <View style={styles.manualContainer}>
        <Text style={styles.manualLabel}>Barcode damaged? Enter manually:</Text>
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.manualInput}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder={expectedBarcode || "e.g. 8901030383748"}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.manualSubmitBtn, !manualCode.trim() && styles.disabledBtn]}
            onPress={handleManualSubmit}
            disabled={!manualCode.trim()}
          >
            <Ionicons name="checkmark" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  viewfinder: {
    height: 160,
    backgroundColor: '#05070D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  viewfinderError: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  laserBeam: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: COLORS.laserColor,
    shadowColor: COLORS.laserColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  expectedCode: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
  },
  cameraScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  cameraScanText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  manualContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  manualLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  manualSubmitBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: COLORS.surfaceElevated,
    opacity: 0.5,
  },
});
