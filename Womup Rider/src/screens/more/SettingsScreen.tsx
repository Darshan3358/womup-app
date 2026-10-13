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
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSubScreen('None')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#071B52" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Settings</Text>
          <Text style={styles.screenSubtitle}>Delivering Smiles • Fast · Safe · Together</Text>
        </View>
      </View>

      {/* 1. Notifications & Dispatch Alerts */}
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
            trackColor={{ false: '#E2E8F0', true: '#FF3B98' }}
            thumbColor="#FFFFFF"
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
            trackColor={{ false: '#E2E8F0', true: '#FF3B98' }}
            thumbColor="#FFFFFF"
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
            trackColor={{ false: '#E2E8F0', true: '#FF3B98' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* 2. Navigation Engine */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="navigate-circle-outline" size={20} color="#071B52" />
                  <Text style={styles.navName}>{app}</Text>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
              {idx < NAV_APPS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* 3. Location & Telemetry Accuracy */}
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
            trackColor={{ false: '#E2E8F0', true: '#FF3B98' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* 4. Diagnostics & Cache */}
      <TouchableOpacity style={styles.clearBtn} onPress={handleClearCache} activeOpacity={0.8}>
        <Ionicons name="trash-outline" size={16} color="#071B52" style={{ marginRight: 6 }} />
        <Text style={styles.clearBtnText}>Clear Local App Cache & Temp Logs</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#071B52',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
    color: '#071B52',
  },
  rowSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
    color: '#071B52',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#FF3B98',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B98',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#071B52',
  },
  bottomSpacer: {
    height: 36,
  },
});
