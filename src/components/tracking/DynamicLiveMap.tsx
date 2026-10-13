import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
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

export interface DynamicLiveMapProps {
  storeCoords?: LatLng;
  storeName?: string;
  customerCoords?: LatLng;
  customerAddress?: string;
  riderCoords?: LatLng | null;
  liveStatus: string;
  partnerName?: string;
  partnerVehicle?: string;
  etaText?: string;
  orderNumber?: string;
  isPartnerAssigned?: boolean;
}

// Default Locations in Ahmedabad (Chandlodiya Dark Store -> Tragad / Thaltej Delivery Location)
const DEFAULT_STORE: LatLng = { latitude: 23.1128, longitude: 72.5427 };
const DEFAULT_CUSTOMER: LatLng = { latitude: 23.1288, longitude: 72.5507 };

export const DynamicLiveMap: React.FC<DynamicLiveMapProps> = ({
  storeCoords = DEFAULT_STORE,
  storeName = 'Wom Up Chandlodiya - Tragad Dark Store',
  customerCoords = DEFAULT_CUSTOMER,
  customerAddress = 'Customer Doorstep',
  riderCoords,
  liveStatus,
  partnerName = '',
  partnerVehicle = 'EV Scooter',
  etaText = '7 MINS (2.6 KM)',
  orderNumber,
  isPartnerAssigned,
}) => {
  const mapWidth = Dimensions.get('window').width - 32;
  const mapHeight = 350;

  const normalizedStatus = (liveStatus || 'PLACED').toUpperCase();
  const isCancelled = normalizedStatus === 'CANCELLED';
  const isDelivered = normalizedStatus === 'DELIVERED';
  const isTerminal = isCancelled || isDelivered;

  // Determine legitimate partner assignment state
  const isAssigned =
    !isTerminal &&
    (isPartnerAssigned !== undefined
      ? isPartnerAssigned
      : Boolean(
          !['PLACED', 'CONFIRMED'].includes(normalizedStatus) &&
          partnerName &&
          partnerName.trim() !== '' &&
          partnerName.toLowerCase() !== 'delivery partner' &&
          partnerName.toLowerCase() !== 'assigning...' &&
          !partnerName.toLowerCase().includes('rohit')
        ));

  const isPartnerStage =
    !isTerminal &&
    [
      'ACCEPTED',
      'ASSIGNED',
      'GOING_TO_STORE',
      'ARRIVED_AT_STORE',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
    ].includes(normalizedStatus);

  const hasActiveRider =
    !isTerminal && (isAssigned || isPartnerStage) && (riderCoords != null || isPartnerStage);

  const effectiveStoreLat = storeCoords.latitude || DEFAULT_STORE.latitude;
  const effectiveStoreLng = storeCoords.longitude || DEFAULT_STORE.longitude;
  const effectiveCustLat = customerCoords.latitude || DEFAULT_CUSTOMER.latitude;
  const effectiveCustLng = customerCoords.longitude || DEFAULT_CUSTOMER.longitude;

  const effectiveRiderLat =
    riderCoords?.latitude ||
    effectiveStoreLat + (effectiveCustLat - effectiveStoreLat) * 0.45;
  const effectiveRiderLng =
    riderCoords?.longitude ||
    effectiveStoreLng + (effectiveCustLng - effectiveStoreLng) * 0.45;

  // Pulse animation for native SVG fallback
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
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
  }, [pulseAnim]);

  // Leaflet OpenStreetMap HTML bundle for web platform
  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Live Order Tracking</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #E2E8F0; }
    #map { width: 100%; height: 100%; }
    .custom-store-pin, .custom-customer-pin, .custom-rider-pin { background: none; border: none; }
    @keyframes ping {
      0% { transform: scale(0.9); opacity: 0.8; }
      80%, 100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.3); opacity: 0.2; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .leaflet-control-zoom {
      border: 1px solid rgba(0,0,0,0.1) !important;
      border-radius: 8px !important;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
      margin-top: 10px !important;
      margin-left: 10px !important;
    }
    .leaflet-control-zoom a {
      background: #FFFFFF !important;
      color: #334155 !important;
      width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
      font-size: 14px !important;
      font-weight: 700 !important;
    }
    .leaflet-bottom.leaflet-right {
      margin-bottom: 2px;
      margin-right: 4px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- Top Floating HUD -->
  <div style="position: absolute; top: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; pointer-events: none; z-index: 1000;">
    <div style="background: rgba(15, 23, 42, 0.90); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.16); padding: 6px 14px; border-radius: 24px; color: ${hasActiveRider ? '#FFFFFF' : '#FCD34D'}; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3); pointer-events: auto;">
      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${hasActiveRider ? '#10B981' : '#F59E0B'}; box-shadow: 0 0 8px ${hasActiveRider ? '#10B981' : '#F59E0B'}; display: inline-block;"></span>
      <span>${hasActiveRider ? (normalizedStatus === 'ARRIVED_AT_STORE' ? 'PARTNER AT STORE' : normalizedStatus === 'GOING_TO_STORE' ? 'PARTNER HEADING TO STORE' : 'LIVE GPS TRACKING') : 'ASSIGNING DELIVERY PARTNER...'}</span>
    </div>

    <div style="background: ${hasActiveRider ? 'rgba(16, 185, 129, 0.92)' : 'rgba(99, 102, 241, 0.92)'}; backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.25); padding: 6px 14px; border-radius: 24px; color: #FFFFFF; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25); pointer-events: auto;">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span id="eta-badge">${etaText || '7 MINS (2.6 KM)'}</span>
    </div>
  </div>

  ${!hasActiveRider && !isDelivered && !isCancelled ? `
  <!-- Searching Center Overlay -->
  <div style="position: absolute; top: 54px; left: 50%; transform: translateX(-50%); z-index: 1000; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(8px); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 20px; padding: 6px 16px; color: #FEF3C7; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); pointer-events: none; white-space: nowrap;">
    <svg style="animation: spin 1.2s linear infinite;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    <span>Assigning nearest delivery partner near store...</span>
  </div>` : ''}

  <!-- Bottom Left Information Bar -->
  <div style="position: absolute; bottom: 12px; left: 12px; z-index: 1000; background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(6px); border: 1px solid rgba(226, 232, 240, 0.9); padding: 5px 12px; border-radius: 10px; font-size: 11px; color: #475569; font-weight: 700; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
    <span>Real Road Navigation via OSRM • Contactless Handover</span>
  </div>

  <!-- Bottom Right Recenter Button -->
  <div style="position: absolute; bottom: 12px; right: 12px; z-index: 1000;">
    <button onclick="window.recenterMap()" style="background: #FFFFFF; color: ${hasActiveRider ? '#7C3AED' : '#2563EB'}; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 7px 12px; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.16);">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${hasActiveRider ? '#7C3AED' : '#2563EB'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
      <span>Center Location</span>
    </button>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var storeLat = ${effectiveStoreLat};
    var storeLng = ${effectiveStoreLng};
    var custLat = ${effectiveCustLat};
    var custLng = ${effectiveCustLng};
    var hasRider = ${hasActiveRider ? 'true' : 'false'};
    var riderLat = ${effectiveRiderLat};
    var riderLng = ${effectiveRiderLng};
    var storeName = ${JSON.stringify(storeName)};
    var partnerName = ${JSON.stringify(partnerName || 'Delivery Partner')};

    var map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([custLat, custLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Store Icon
    var storeIcon = L.divIcon({
      className: 'custom-store-pin',
      html: '<div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">' +
        '<div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45); border: 2.5px solid #FFFFFF;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>' +
            '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>' +
            '<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>' +
            '<path d="M2 7h20"/>' +
          '</svg>' +
        '</div>' +
        '<div style="position: absolute; bottom: -6px; width: 8px; height: 8px; background: #1D4ED8; transform: rotate(45deg); border-right: 1.5px solid #FFF; border-bottom: 1.5px solid #FFF;"></div>' +
        '<div style="margin-top: 8px; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(4px); color: #F8FAFC; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15);">' +
          storeName +
        '</div>' +
      '</div>',
      iconSize: [40, 60],
      iconAnchor: [20, 36]
    });
    L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);

    // Customer Icon
    var customerIcon = L.divIcon({
      className: 'custom-customer-pin',
      html: '<div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">' +
        '<div style="position: absolute; top: -6px; left: -6px; width: 50px; height: 50px; border-radius: 50%; background: rgba(16, 185, 129, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' +
        '<div style="background: linear-gradient(135deg, #10B981, #059669); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5); border: 2.5px solid #FFFFFF; z-index: 2;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' +
            '<polyline points="9 22 9 12 15 12 15 22"/>' +
          '</svg>' +
        '</div>' +
        '<div style="position: absolute; bottom: -6px; width: 8px; height: 8px; background: #059669; transform: rotate(45deg); border-right: 1.5px solid #FFF; border-bottom: 1.5px solid #FFF; z-index: 2;"></div>' +
        '<div style="margin-top: 8px; background: rgba(6, 78, 59, 0.9); backdrop-filter: blur(4px); color: #ECFDF5; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(167, 243, 208, 0.3); z-index: 2;">' +
          'Your Home' +
        '</div>' +
      '</div>',
      iconSize: [40, 60],
      iconAnchor: [20, 36]
    });
    L.marker([custLat, custLng], { icon: customerIcon }).addTo(map);

    // Rider Icon (if active)
    var riderMarker = null;
    if (hasRider) {
      var riderIcon = L.divIcon({
        className: 'custom-rider-pin',
        html: '<div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">' +
          '<div style="position: absolute; top: -8px; left: -8px; width: 60px; height: 60px; border-radius: 50%; background: rgba(124, 58, 237, 0.3); animation: pulse 1.6s ease-in-out infinite;"></div>' +
          '<div style="background: linear-gradient(135deg, #7C3AED, #9333EA); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(124, 58, 237, 0.6); border: 3px solid #FFFFFF; z-index: 2;">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="18.5" cy="17.5" r="3.5"/>' +
              '<circle cx="5.5" cy="17.5" r="3.5"/>' +
              '<circle cx="15" cy="5" r="1"/>' +
              '<path d="M12 17.5V14l-3-3 4-3 2 3h2"/>' +
            '</svg>' +
          '</div>' +
          '<div style="margin-top: 6px; background: linear-gradient(135deg, #7C3AED, #5B21B6); color: #FFFFFF; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; white-space: nowrap; box-shadow: 0 3px 8px rgba(0,0,0,0.35); border: 1.5px solid rgba(255,255,255,0.4); z-index: 2; display: flex; align-items: center; gap: 4px;">' +
            '<span>🚴</span>' +
            '<span>' + partnerName + '</span>' +
          '</div>' +
        '</div>',
        iconSize: [50, 70],
        iconAnchor: [25, 40]
      });
      riderMarker = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);
    }

    var routeBounds = L.latLngBounds([[storeLat, storeLng], [custLat, custLng]]);
    map.fitBounds(routeBounds, { padding: [50, 50], maxZoom: 16 });

    // OSRM Route Fetch
    var osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + storeLng + ',' + storeLat + ';' + custLng + ',' + custLat + '?overview=full&geometries=geojson';
    fetch(osrmUrl)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          var route = data.routes[0];
          var coords = route.geometry.coordinates.map(function(pt) { return [pt[1], pt[0]]; });
          
          L.polyline(coords, { color: '#312E81', weight: 6.5, opacity: 0.22 }).addTo(map);
          L.polyline(coords, { color: '#4F46E5', weight: 4.2, opacity: 0.92, dashArray: '8, 10' }).addTo(map);

          var km = (route.distance / 1000).toFixed(1);
          var mins = Math.max(3, Math.round(route.duration / 60));
          var etaEl = document.getElementById('eta-badge');
          if (etaEl) {
            etaEl.innerText = mins + ' MINS (' + km + ' KM)';
          }

          routeBounds = L.latLngBounds(coords);
          map.fitBounds(routeBounds, { padding: [45, 45], maxZoom: 16 });
        } else {
          L.polyline([[storeLat, storeLng], [custLat, custLng]], { color: '#6366F1', weight: 4, opacity: 0.75, dashArray: '6, 10' }).addTo(map);
        }
      })
      .catch(function() {
        L.polyline([[storeLat, storeLng], [custLat, custLng]], { color: '#6366F1', weight: 4, opacity: 0.75, dashArray: '6, 10' }).addTo(map);
      });

    window.recenterMap = function() {
      if (hasRider && riderMarker) {
        map.flyTo([riderLat, riderLng], 16, { animate: true, duration: 1.0 });
      } else {
        map.fitBounds(routeBounds, { padding: [45, 45], maxZoom: 16, animate: true, duration: 1.0 });
      }
    };
  </script>
</body>
</html>`;

  // On Web platform: Render full interactive Leaflet map matching website
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={[styles.mapViewport, { height: mapHeight }]}>
          {React.createElement('iframe', {
            title: 'Live Order Tracking Map',
            srcDoc: mapHtml,
            style: {
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 16,
              overflow: 'hidden',
            },
          })}
        </View>
      </View>
    );
  }

  // Native Mobile Fallback: Light OpenStreetMap styled view matching the website aesthetics
  const paddingX = 48;
  const storeX = paddingX;
  const storeY = 240;
  const customerX = mapWidth - paddingX;
  const customerY = 80;
  const controlX = (storeX + customerX) / 2 + 10;
  const controlY = Math.min(storeY, customerY) - 20;

  const fullPath = `M ${storeX} ${storeY} Q ${controlX} ${controlY} ${customerX} ${customerY}`;

  return (
    <View style={styles.container}>
      <View style={[styles.mapViewport, { height: mapHeight, backgroundColor: '#F8FAFC' }]}>
        <Svg width={mapWidth} height={mapHeight} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="bgLight" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#F8FAFC" />
              <Stop offset="100%" stopColor="#F1F5F9" />
            </LinearGradient>
          </Defs>

          <Rect x="0" y="0" width={mapWidth} height={mapHeight} fill="url(#bgLight)" rx="16" />

          {/* Road Network Lines */}
          <Line x1="0" y1="100" x2={mapWidth} y2="100" stroke="#CBD5E1" strokeWidth="2.5" />
          <Line x1="0" y1="210" x2={mapWidth} y2="210" stroke="#CBD5E1" strokeWidth="2.5" />
          <Line x1="100" y1="0" x2="100" y2={mapHeight} stroke="#CBD5E1" strokeWidth="2.5" />
          <Line x1={mapWidth - 100} y1="0" x2={mapWidth - 100} y2={mapHeight} stroke="#CBD5E1" strokeWidth="2.5" />

          {/* Route path */}
          <Path d={fullPath} stroke="#312E81" strokeWidth="6" opacity={0.15} fill="none" />
          <Path d={fullPath} stroke="#4F46E5" strokeWidth="3.5" strokeDasharray="6, 8" fill="none" />
        </Svg>

        {/* Top Badges */}
        <View style={styles.nativeHudRow}>
          <View style={styles.hudBadge}>
            <View style={[styles.livePulseDot, { backgroundColor: hasActiveRider ? '#10B981' : '#F59E0B' }]} />
            <Text style={[styles.hudBadgeText, { color: hasActiveRider ? '#FFFFFF' : '#FCD34D' }]}>
              {hasActiveRider ? 'LIVE GPS TRACKING' : 'ASSIGNING DELIVERY PARTNER...'}
            </Text>
          </View>

          <View style={[styles.etaChip, { backgroundColor: hasActiveRider ? '#10B981' : '#6366F1' }]}>
            <Ionicons name="time" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={[styles.etaChipText, { color: '#FFFFFF' }]}>{etaText}</Text>
          </View>
        </View>

        {/* Searching Overlay */}
        {!hasActiveRider && (
          <View style={styles.nativeCenterPill}>
            <Ionicons name="sync" size={13} color="#F59E0B" style={{ marginRight: 6 }} />
            <Text style={styles.nativeCenterText}>Assigning nearest delivery partner near store...</Text>
          </View>
        )}

        {/* Dark Store Pin */}
        <View style={[styles.markerAbsolute, { left: storeX - 20, top: storeY - 38 }]}>
          <View style={styles.storePin}>
            <Ionicons name="business" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.markerLabel}>
            <Text style={styles.markerLabelText} numberOfLines={1}>{storeName}</Text>
          </View>
        </View>

        {/* Customer Pin */}
        <View style={[styles.markerAbsolute, { left: customerX - 20, top: customerY - 38 }]}>
          <View style={styles.customerPin}>
            <Ionicons name="home" size={18} color="#FFFFFF" />
          </View>
          <View style={[styles.markerLabel, { backgroundColor: 'rgba(6, 78, 59, 0.9)' }]}>
            <Text style={styles.markerLabelText}>Your Home</Text>
          </View>
        </View>

        {/* Bottom Banner */}
        <View style={styles.nativeBottomInfo}>
          <Ionicons name="shield-checkmark" size={13} color="#16A34A" style={{ marginRight: 4 }} />
          <Text style={styles.nativeBottomText}>Real Road Navigation via OSRM • Contactless Handover</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mapViewport: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  nativeHudRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  hudBadgeText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  etaChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  nativeCenterPill: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    zIndex: 10,
  },
  nativeCenterText: {
    color: '#FEF3C7',
    fontSize: 11,
    fontWeight: '700',
  },
  nativeBottomInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    zIndex: 10,
  },
  nativeBottomText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  markerAbsolute: {
    position: 'absolute',
    alignItems: 'center',
  },
  storePin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  customerPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  markerLabel: {
    marginTop: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 160,
  },
  markerLabelText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
