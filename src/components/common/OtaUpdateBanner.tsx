import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOta } from '../../context/OtaContext';
import { COLORS } from '../../theme/colors';

/**
 * Non-intrusive floating pill banner shown when an OTA update has finished
 * downloading and is ready to apply via Updates.reloadAsync().
 */
export const OtaUpdateBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isUpdatePending, isBannerDismissed, applyUpdate, dismissBanner } = useOta();

  if (Platform.OS === 'web' || !isUpdatePending || isBannerDismissed) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 8) + 68 }]}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={16} color={COLORS.hotPink} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            New WOMART update ready
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Tap Restart to apply the latest fixes
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={applyUpdate}
          style={styles.restartBtn}
        >
          <Text style={styles.restartText}>Restart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={dismissBanner}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={15} color="#CBD5E1" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 9000,
    elevation: 16,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(236, 74, 157, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
    marginTop: 1,
  },
  restartBtn: {
    backgroundColor: COLORS.hotPink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  restartText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  closeBtn: {
    padding: 4,
  },
});
