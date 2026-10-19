import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isScanningLocked, setIsScanningLocked] = useState(false);

  // Expo Camera permission hook (Expo SDK 57 standard)
  const [permission, requestPermission] = useCameraPermissions();

  // Laser beam animation in viewfinder
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isCameraOpen) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      laserAnim.setValue(0);
    }
    return () => {
      animLoop?.stop();
    };
  }, [isCameraOpen, laserAnim]);

  // Request permission & open camera
  const handleOpenCamera = async () => {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Camera access is required to scan product barcodes in dark stores. Please allow camera permissions in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      setIsScanningLocked(false);
      setIsCameraOpen(true);
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Unable to open camera');
    }
  };

  // Process barcode detected by Camera
  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (isScanningLocked || !data) return;
    setIsScanningLocked(true);

    const scannedRaw = String(data).trim();
    // Auto-fill into manual input field
    setManualCode(scannedRaw);
    setIsCameraOpen(false);

    // Validate barcode
    validateAndSubmit(scannedRaw);
  };

  // Validate barcode against expected item
  const validateAndSubmit = (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) return;

    if (
      expectedBarcode &&
      cleanCode.toUpperCase() !== expectedBarcode.trim().toUpperCase()
    ) {
      setErrorFlash(true);
      setErrorMessage(
        `Invalid Barcode! Scanned "${cleanCode}" does not match ordered item (${expectedBarcode}).`
      );
      setTimeout(() => {
        setErrorFlash(false);
      }, 3500);

      Alert.alert(
        'Invalid Barcode! ❌',
        `Scanned barcode "${cleanCode}" does not match required product barcode (${expectedBarcode}). Please check the item label and scan the correct product.`
      );
      return;
    }

    // Success: match confirmed
    setErrorFlash(false);
    setErrorMessage('');
    onScan(cleanCode);
  };

  // Manual code submission
  const handleManualSubmit = () => {
    validateAndSubmit(manualCode);
  };

  // Simulator helper for desktop browser development
  const handleSimulateScan = () => {
    const code =
      expectedBarcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setManualCode(code);
    validateAndSubmit(code);
  };

  // Laser Y interpolation
  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 190],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Mini Viewfinder Preview Box */}
      <View style={[styles.viewfinder, errorFlash && styles.viewfinderError]}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        <View style={styles.laserBeam} />

        <Ionicons
          name="barcode-outline"
          size={54}
          color={errorFlash ? COLORS.danger : COLORS.primary}
        />
        {expectedBarcode ? (
          <Text style={styles.expectedCode}>SKU: {expectedBarcode}</Text>
        ) : null}
      </View>

      {/* Error Alert Display */}
      {errorFlash && (
        <View style={styles.errorAlert}>
          <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>
            {errorMessage || 'Barcode Mismatch! Please scan correct product.'}
          </Text>
        </View>
      )}

      {/* Primary Action: Open Native Camera Barcode Scanner */}
      <TouchableOpacity
        style={styles.cameraScanBtn}
        onPress={handleOpenCamera}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={20} color="#FFF" />
        <Text style={styles.cameraScanText}>OPEN CAMERA SCANNER</Text>
      </TouchableOpacity>

      {/* Secondary Action: Demo / Simulation Fallback */}
      <TouchableOpacity
        style={styles.simulateScanBtn}
        onPress={handleSimulateScan}
        activeOpacity={0.8}
      >
        <Ionicons name="flash-outline" size={15} color={COLORS.primary} />
        <Text style={styles.simulateScanText}>Simulate Scan (Test)</Text>
      </TouchableOpacity>

      {/* Manual Input Fallback */}
      <View style={styles.manualContainer}>
        <Text style={styles.manualLabel}>Barcode damaged? Enter manually:</Text>
        <View style={styles.manualInputRow}>
          <TextInput
            style={[styles.manualInput, errorFlash && styles.manualInputError]}
            value={manualCode}
            onChangeText={(txt) => {
              setManualCode(txt);
              setErrorFlash(false);
              setErrorMessage('');
            }}
            placeholder={expectedBarcode || 'e.g. 8901030383748'}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[
              styles.manualSubmitBtn,
              !manualCode.trim() && styles.disabledBtn,
            ]}
            onPress={handleManualSubmit}
            disabled={!manualCode.trim()}
          >
            <Ionicons name="checkmark" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* FULLSCREEN NATIVE CAMERA SCANNER MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        visible={isCameraOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsCameraOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.cameraContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {/* Real Native Expo Camera View */}
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={isTorchOn}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'ean13',
                'ean8',
                'code128',
                'code39',
                'upc_a',
                'upc_e',
              ],
            }}
            onBarcodeScanned={isScanningLocked ? undefined : handleBarCodeScanned}
          />

          {/* Viewfinder Overlay Mask */}
          <View style={styles.overlayMask}>
            {/* Top Bar with Close, Title & Flashlight */}
            <View style={styles.cameraHeaderBar}>
              <TouchableOpacity
                style={styles.iconCircleBtn}
                onPress={() => setIsCameraOpen(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.cameraHeaderCenter}>
                <Text style={styles.cameraHeaderTitle} numberOfLines={1}>
                  {title}
                </Text>
                {expectedBarcode ? (
                  <Text style={styles.cameraHeaderSku}>SKU: {expectedBarcode}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.iconCircleBtn,
                  isTorchOn && styles.iconCircleBtnActive,
                ]}
                onPress={() => setIsTorchOn((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isTorchOn ? 'flash' : 'flash-off'}
                  size={20}
                  color={isTorchOn ? '#FBBF24' : '#FFF'}
                />
              </TouchableOpacity>
            </View>

            {/* Central Viewfinder Targeting Box */}
            <View style={styles.cameraViewfinderWrap}>
              <View style={styles.cameraTargetBox}>
                {/* 4 Corner Targeting Brackets */}
                <View style={[styles.scannerCorner, styles.scTopLeft]} />
                <View style={[styles.scannerCorner, styles.scTopRight]} />
                <View style={[styles.scannerCorner, styles.scBottomLeft]} />
                <View style={[styles.scannerCorner, styles.scBottomRight]} />

                {/* Animated Laser Scanning Beam */}
                <Animated.View
                  style={[
                    styles.cameraLaserBeam,
                    { transform: [{ translateY: laserTranslateY }] },
                  ]}
                />
              </View>

              <Text style={styles.targetInstruction}>
                Fit packaging barcode inside the frame
              </Text>
            </View>

            {/* Bottom Actions Bar */}
            <View style={styles.cameraBottomBar}>
              <TouchableOpacity
                style={styles.cameraDismissBtn}
                onPress={() => setIsCameraOpen(false)}
              >
                <Text style={styles.cameraDismissText}>Cancel & Enter Manually</Text>
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  cameraScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  cameraScanText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  simulateScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 6,
    gap: 5,
  },
  simulateScanText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  manualContainer: {
    marginTop: 12,
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
    paddingVertical: 9,
    color: COLORS.textPrimary,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  manualInputError: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
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

  // Fullscreen Camera Modal Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
  },
  cameraHeaderBar: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  cameraHeaderCenter: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  cameraHeaderTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cameraHeaderSku: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
  },
  cameraViewfinderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTargetBox: {
    width: 270,
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  scannerCorner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: '#10B981',
  },
  scTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  scTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  scBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  scBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  cameraLaserBeam: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  targetInstruction: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 18,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cameraBottomBar: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingTop: 16,
  },
  cameraDismissBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  cameraDismissText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
