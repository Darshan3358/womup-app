import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Rect,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface DynamicLiveMapProps {
  storeCoords?: LatLng;
  storeName?: string;
  customerCoords?: LatLng;
  customerAddress?: string;
  riderCoords?: LatLng | null;
  liveStatus: string;
  partnerName: string;
  partnerVehicle: string;
  etaText: string;
  orderNumber?: string;
}

export const DynamicLiveMap: React.FC<DynamicLiveMapProps> = ({
  storeCoords = { latitude: 23.0305, longitude: 72.56 },
  storeName = 'Worm Up Dark Store #01',
  customerCoords = { latitude: 23.0225, longitude: 72.5714 },
  customerAddress = 'Customer Doorstep',
  riderCoords,
  liveStatus,
  partnerName,
  partnerVehicle,
  etaText,
  orderNumber,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCenteredOnRider, setIsCenteredOnRider] = useState(true);

  // Map dimensions
  const mapWidth = Dimensions.get('window').width - 32;
  const mapHeight = 260;

  // Pulse animation for the live rider marker
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(radarAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim, radarAnim]);

  // Status progress ratio: 0.0 at store, 1.0 at customer
  let progressRatio = 0.45;
  if (liveStatus === 'PLACED' || liveStatus === 'PACKING') {
    progressRatio = 0.1;
  } else if (liveStatus === 'GOING_TO_STORE' || liveStatus === 'ARRIVED_AT_STORE') {
    progressRatio = 0.2;
  } else if (liveStatus === 'OUT_FOR_DELIVERY') {
    progressRatio = 0.65;
  } else if (liveStatus === 'ARRIVED_AT_CUSTOMER' || liveStatus === 'DELIVERED') {
    progressRatio = 0.95;
  }

  // Calculate coordinates in pixel space
  const paddingX = 48;
  const storeX = paddingX;
  const storeY = 180;

  const customerX = mapWidth - paddingX;
  const customerY = 60;

  // Mid-point curve control point
  const controlX = (storeX + customerX) / 2 + 10;
  const controlY = Math.min(storeY, customerY) - 30;

  // If live rider GPS coordinates are available, calculate relative position
  let riderX = storeX + (customerX - storeX) * progressRatio;
  let riderY = storeY + (customerY - storeY) * progressRatio;

  if (riderCoords && storeCoords && customerCoords) {
    const latSpan = Math.abs(customerCoords.latitude - storeCoords.latitude) || 0.01;
    const lngSpan = Math.abs(customerCoords.longitude - storeCoords.longitude) || 0.01;

    const latProgress = Math.min(
      Math.max((riderCoords.latitude - storeCoords.latitude) / (customerCoords.latitude - storeCoords.latitude || 1), 0.05),
      0.95
    );
    const lngProgress = Math.min(
      Math.max((riderCoords.longitude - storeCoords.longitude) / (customerCoords.longitude - storeCoords.longitude || 1), 0.05),
      0.95
    );

    const blendedProgress = (Math.abs(latProgress) + Math.abs(lngProgress)) / 2;
    if (!isNaN(blendedProgress) && blendedProgress > 0 && blendedProgress < 1) {
      riderX = storeX + (customerX - storeX) * blendedProgress;
      riderY = storeY + (customerY - storeY) * blendedProgress;
    }
  }

  // Curved path from Store to Rider, and Rider to Customer
  const fullPath = `M ${storeX} ${storeY} Q ${controlX} ${controlY} ${customerX} ${customerY}`;
  const completedPath = `M ${storeX} ${storeY} Q ${(storeX + riderX) / 2} ${(storeY + riderY) / 2 - 15} ${riderX} ${riderY}`;
  const remainingPath = `M ${riderX} ${riderY} Q ${(riderX + customerX) / 2} ${(riderY + customerY) / 2 - 15} ${customerX} ${customerY}`;

  const currentLat = riderCoords?.latitude || (storeCoords.latitude + (customerCoords.latitude - storeCoords.latitude) * progressRatio);
  const currentLng = riderCoords?.longitude || (storeCoords.longitude + (customerCoords.longitude - storeCoords.longitude) * progressRatio);

  return (
    <View style={styles.container}>
      {/* Map Header with Real-Time HUD */}
      <View style={styles.hudHeader}>
        <View style={styles.hudBadge}>
          <View style={styles.livePulseDot} />
          <Text style={styles.hudBadgeText}>GPS LIVE TRACKING</Text>
        </View>

        <View style={styles.etaChip}>
          <Ionicons name="time" size={13} color="#10B981" style={{ marginRight: 4 }} />
          <Text style={styles.etaChipText}>{liveStatus === 'DELIVERED' ? 'Arrived' : etaText}</Text>
        </View>
      </View>

      {/* Map Canvas */}
      <View style={[styles.mapViewport, { height: mapHeight }]}>
        {/* Stylized Street Grid Background */}
        <Svg width={mapWidth} height={mapHeight} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0F172A" />
              <Stop offset="100%" stopColor="#1E293B" />
            </LinearGradient>
            <LinearGradient id="routeDoneGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#3B82F6" />
              <Stop offset="100%" stopColor="#8B5CF6" />
            </LinearGradient>
            <LinearGradient id="routeRemainGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.8" />
            </LinearGradient>
          </Defs>

          {/* Background */}
          <Rect x="0" y="0" width={mapWidth} height={mapHeight} fill="url(#bgGrad)" rx="16" />

          {/* Simulated Street Network */}
          <Line x1="0" y1="80" x2={mapWidth} y2="80" stroke="#334155" strokeWidth="1.5" strokeOpacity="0.6" />
          <Line x1="0" y1="170" x2={mapWidth} y2="170" stroke="#334155" strokeWidth="1.5" strokeOpacity="0.6" />
          <Line x1="90" y1="0" x2="90" y2={mapHeight} stroke="#334155" strokeWidth="1.5" strokeOpacity="0.6" />
          <Line x1={mapWidth - 90} y1="0" x2={mapWidth - 90} y2={mapHeight} stroke="#334155" strokeWidth="1.5" strokeOpacity="0.6" />

          {/* Diagonal Avenue */}
          <Line x1="20" y1="240" x2={mapWidth - 20} y2="20" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
          <Line x1="20" y1="240" x2={mapWidth - 20} y2="20" stroke="#475569" strokeWidth="2" strokeDasharray="6, 6" />

          {/* Planned Delivery Path (Base Glow) */}
          <Path
            d={fullPath}
            stroke="#6366F1"
            strokeWidth="8"
            strokeOpacity="0.2"
            fill="none"
          />

          {/* Remaining Path (Dashed) */}
          <Path
            d={remainingPath}
            stroke="#94A3B8"
            strokeWidth="3.5"
            strokeDasharray="6, 6"
            fill="none"
          />

          {/* Traveled Path (Solid Gradient) */}
          <Path
            d={completedPath}
            stroke="url(#routeDoneGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Halos around pins */}
          <Circle cx={storeX} cy={storeY} r="14" fill="#3B82F6" fillOpacity="0.25" />
          <Circle cx={customerX} cy={customerY} r="14" fill="#EC4899" fillOpacity="0.25" />
        </Svg>

        {/* 1. Dark Store Pin */}
        <View style={[styles.markerAbsolute, { left: storeX - 18, top: storeY - 38 }]}>
          <View style={styles.storePin}>
            <Ionicons name="business" size={15} color="#FFFFFF" />
          </View>
          <View style={styles.markerLabel}>
            <Text style={styles.markerLabelText}>Dark Store</Text>
          </View>
        </View>

        {/* 2. Customer Destination Pin */}
        <View style={[styles.markerAbsolute, { left: customerX - 18, top: customerY - 38 }]}>
          <View style={styles.customerPin}>
            <Ionicons name="home" size={15} color="#FFFFFF" />
          </View>
          <View style={[styles.markerLabel, { backgroundColor: '#BE185D' }]}>
            <Text style={styles.markerLabelText}>You</Text>
          </View>
        </View>

        {/* 3. Live Rider Dynamic Scooter Marker */}
        <View style={[styles.markerAbsolute, { left: riderX - 22, top: riderY - 22 }]}>
          {/* Pulsing Radar Ring */}
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Scooter Icon Circle */}
          <Animated.View
            style={[
              styles.scooterCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons name="bicycle" size={22} color="#FFFFFF" />
          </Animated.View>

          {/* Floating Rider Badge */}
          <View style={styles.riderFloatingBadge}>
            <Text style={styles.riderFloatingName} numberOfLines={1}>
              {partnerName && partnerName !== 'Delivery Partner'
                ? partnerName
                : 'DARSHAN THANKI'}
            </Text>
          </View>
        </View>

        {/* Map Control Buttons: Center on Rider */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={[styles.mapControlBtn, isCenteredOnRider && styles.mapControlBtnActive]}
            activeOpacity={0.8}
            onPress={() => setIsCenteredOnRider(true)}
          >
            <Ionicons
              name="locate"
              size={18}
              color={isCenteredOnRider ? '#6366F1' : '#64748B'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Bottom Telemetry Card */}
      <View style={styles.telemetryFooter}>
        <View style={styles.telemetryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.partnerHeading}>
              {partnerName} • <Text style={styles.vehiclePill}>{partnerVehicle}</Text>
            </Text>
            <Text style={styles.telemetrySub}>
              {liveStatus === 'DELIVERED'
                ? 'Delivered to your address'
                : liveStatus === 'ARRIVED_AT_CUSTOMER'
                ? 'Rider has arrived at your doorstep'
                : 'En route to your location with package'}
            </Text>
          </View>
          <View style={styles.coordsBadge}>
            <Text style={styles.coordsLabel}>TELEMETRY</Text>
            <Text style={styles.coordsVal}>
              {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563EB',
    marginRight: 6,
  },
  hudBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  etaChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  mapViewport: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  markerAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  storePin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  customerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DB2777',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLabel: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  markerLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  radarRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
    top: -8,
    left: -8,
  },
  scooterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  riderFloatingBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  riderFloatingName: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '700',
  },
  mapControls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'column',
    gap: 8,
  },
  mapControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapControlBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6366F1',
  },
  telemetryFooter: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  vehiclePill: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 12,
  },
  telemetrySub: {
    fontSize: 12,
    color: '#64748B',
  },
  coordsBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coordsLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  coordsVal: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#334155',
  },
});
