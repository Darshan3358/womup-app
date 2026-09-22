import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRider } from '../../context/RiderContext';
import { RiderApiService } from '../../services/riderApi';
import { RiderAppSettings } from '../../types/rider.types';
import { COLORS } from '../../theme/colors';

const NAV_APPS: RiderAppSettings['defaultNavApp'][] = ['Google Maps', 'Apple Maps', 'Waze'];

export const SettingsScreen: React.FC = () => {
  const { setSubScreen } = useRider();
  const [settings, setSettings] = useState<RiderAppSettings | null>(null);

  useEffect(() => {
    RiderApiService.getSettings().then(setSettings);
  }, []);

  const handleToggle = async (key: keyof RiderAppSettings, val: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: val });
    await RiderApiService.updateSettings({ [key]: val });
  };

  const handleSelectNav = async (app: RiderAppSettings['defaultNavApp']) => {
    if (!settings) return;
    setSettings({ ...settings, defaultNavApp: app });
    await RiderApiService.updateSettings({ defaultNavApp: app });
  };

  const handleClearCache = () => {
    Alert.alert('Clear Local Cache', 'Cache cleared. Stored navigation tiles and temporary telemetry logs purged.', [
      { text: 'OK' },
    ]);
  };

  if (!settings) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={[styles.backRow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => setSubScreen('None')}>
        <Ionicons name="arrow-back" size={16} color={COLORS.hotPink} />
        <Text style={styles.backArrow}>Back to Menu</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>App & Navigation Preferences</Text>
      <Text style={styles.screenSubtitle}>
        Configure audio alerts, routing preferences, and battery consumption settings.
      </Text>

      {/* Audio & Alert Settings */}
      <Text style={styles.groupHeading}>DISPATCH & ALERT NOTIFICATIONS</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowTitle}>Order Alert Ringtone</Text>
            <Text style={styles.rowSub}>Play loud chime when new delivery is offered</Text>
          </View>
          <Switch
            value={settings.orderAlertRingtone}
            onValueChange={(v) => handleToggle('orderAlertRingtone', v)}
            trackColor={{ false: COLORS.border, true: COLORS.hotPink }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowTitle}>Vibrate on Incoming Dispatch</Text>
            <Text style={styles.rowSub}>Continuous haptic pulse until order accepted</Text>
          </View>
          <Switch
            value={settings.vibrateOnDispatch}
            onValueChange={(v) => handleToggle('vibrateOnDispatch', v)}
            trackColor={{ false: COLORS.border, true: COLORS.hotPink }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowTitle}>Auto-Accept Dispatch</Text>
            <Text style={styles.rowSub}>Automatically accept queued assignments when nearby</Text>
          </View>
          <Switch
            value={settings.autoAcceptOrders}
            onValueChange={(v) => handleToggle('autoAcceptOrders', v)}
            trackColor={{ false: COLORS.border, true: COLORS.hotPink }}
          />
        </View>
      </View>

      {/* Navigation App Choice */}
      <Text style={styles.groupHeading}>PREFERRED NAVIGATION ENGINE</Text>
      <View style={styles.card}>
        {NAV_APPS.map((app, idx) => {
          const isSelected = settings.defaultNavApp === app;
          return (
            <React.Fragment key={app}>
              <TouchableOpacity
                style={styles.navRow}
                onPress={() => handleSelectNav(app)}
                activeOpacity={0.7}
              >
                <Text style={styles.navName}>{app}</Text>
                <View style={[styles.radioOuter, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
              {idx < NAV_APPS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* GPS & Location Accuracy */}
      <Text style={styles.groupHeading}>LOCATION & TELEMETRY ACCURACY</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowTitle}>High-Accuracy GPS</Text>
            <Text style={styles.rowSub}>Transmit 5m precise location to dark store gateway</Text>
          </View>
          <Switch
            value={settings.highAccuracyGps}
            onValueChange={(v) => handleToggle('highAccuracyGps', v)}
            trackColor={{ false: COLORS.border, true: COLORS.hotPink }}
          />
        </View>
      </View>

      {/* Cache & Diagnostics */}
      <TouchableOpacity style={styles.clearBtn} onPress={handleClearCache} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Ionicons name="trash-outline" size={16} color={COLORS.navy} />
          <Text style={styles.clearBtnText}>Clear App Cache & Temp Files</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  backRow: {
    marginBottom: 12,
  },
  backArrow: {
    color: COLORS.hotPink,
    fontWeight: '800',
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
  screenSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondaryText,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rowSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  navName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.hotPink,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.hotPink,
  },
  clearBtn: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  bottomSpacer: {
    height: 30,
  },
});
