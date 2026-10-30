import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LatLng {
  latitude: number;
  longitude: number;
}

export interface StoreDirectionMapModalProps {
  visible: boolean;
  onClose: () => void;
  storeName: string;
  storeAddress?: string;
  storeCoords: LatLng;
  customerCoords?: LatLng;
  customerAddress?: string;
  distanceKm?: number;
}

export const StoreDirectionMapModal: React.FC<StoreDirectionMapModalProps> = ({
  visible,
  onClose,
  storeName,
  storeAddress = 'Ahmedabad',
  storeCoords,
  customerCoords = { latitude: 23.0125, longitude: 72.5082 },
  customerAddress = 'Your Location',
  distanceKm,
}) => {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const custLat = customerCoords.latitude || 23.0125;
  const custLng = customerCoords.longitude || 72.5082;
  const storeLat = storeCoords.latitude || 23.0195;
  const storeLng = storeCoords.longitude || 72.5180;

  // Calculate approximate distance if not provided
  const computedDistanceKm = useMemo(() => {
    if (typeof distanceKm === 'number' && !isNaN(distanceKm) && distanceKm > 0) {
      return distanceKm;
    }
    const R = 6371;
    const dLat = (storeLat - custLat) * (Math.PI / 180);
    const dLon = (storeLng - custLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(custLat * (Math.PI / 180)) *
        Math.cos(storeLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }, [distanceKm, custLat, custLng, storeLat, storeLng]);

  const displayDistance = useMemo(() => {
    if (computedDistanceKm < 1.0) {
      const meters = Math.round(computedDistanceKm * 1000);
      return meters <= 0 ? '50 m' : `${meters} m`;
    }
    return `${computedDistanceKm.toFixed(1)} km`;
  }, [computedDistanceKm]);

  // Estimated driving/biking time (approx 20 km/h in city)
  const estimatedMins = Math.max(3, Math.round((computedDistanceKm / 20) * 60));

  const handleOpenExternalGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${custLat},${custLng}&destination=${storeLat},${storeLng}&travelmode=driving`;
    Linking.openURL(url).catch(() => {});
  };

  // Self-contained Leaflet Map HTML
  const mapHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    .custom-customer-pin {
      background: #2563EB;
      color: #FFFFFF;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45);
      border: 3px solid #FFFFFF;
      font-size: 18px;
    }
    .custom-store-pin {
      background: #E11D48;
      color: #FFFFFF;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(225, 29, 72, 0.45);
      border: 3px solid #FFFFFF;
      font-size: 20px;
    }
    .pin-label {
      background: #0F172A;
      color: #FFFFFF;
      padding: 3px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .recenter-btn {
      position: absolute;
      bottom: 24px;
      right: 18px;
      z-index: 1000;
      background: #FFFFFF;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
      border: 1px solid #E2E8F0;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <button class="recenter-btn" onclick="fitRouteBounds()" title="Recenter Route">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="22" y1="12" x2="18" y2="12"></line>
      <line x1="6" y1="12" x2="2" y2="12"></line>
      <line x1="12" y1="6" x2="12" y2="2"></line>
      <line x1="12" y1="22" x2="12" y2="18"></line>
    </svg>
  </button>

  <script>
    var custCoords = [${custLat}, ${custLng}];
    var storeCoords = [${storeLat}, ${storeLng}];

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Customer Marker (Blue)
    var custIcon = L.divIcon({
      className: '',
      html: '<div style="display:flex; flex-direction:column; align-items:center;">' +
            '  <div class="pin-label">📍 Your Location</div>' +
            '  <div class="custom-customer-pin">👤</div>' +
            '</div>',
      iconSize: [80, 60],
      iconAnchor: [40, 55]
    });
    L.marker(custCoords, { icon: custIcon }).addTo(map);

    // Store Marker (Red)
    var storeIcon = L.divIcon({
      className: '',
      html: '<div style="display:flex; flex-direction:column; align-items:center;">' +
            '  <div class="pin-label" style="background:#E11D48;">🏪 ${storeName.replace(/'/g, "\\'")}</div>' +
            '  <div class="custom-store-pin">🏪</div>' +
            '</div>',
      iconSize: [120, 65],
      iconAnchor: [60, 60]
    });
    L.marker(storeCoords, { icon: storeIcon }).addTo(map);

    // Connecting Route Line (curved or straight polyline)
    var midLat = (custCoords[0] + storeCoords[0]) / 2 + 0.0015;
    var midLng = (custCoords[1] + storeCoords[1]) / 2 - 0.0015;
    var routePoints = [custCoords, [midLat, midLng], storeCoords];

    L.polyline(routePoints, {
      color: '#E11D48',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(map);

    function fitRouteBounds() {
      var bounds = L.latLngBounds([custCoords, storeCoords]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16 });
    }

    fitRouteBounds();
  </script>
</body>
</html>`;
  }, [custLat, custLng, storeLat, storeLng, storeName]);

  // Lazy-load WebView on native mobile
  let NativeWebView: any = null;
  if (Platform.OS !== 'web') {
    try {
      NativeWebView = require('react-native-webview').WebView;
    } catch {
      NativeWebView = null;
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeContainer}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityLabel="Close Map"
          >
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {storeName}
            </Text>
            <Text style={styles.headerSubtitle}>In-App Store Navigation</Text>
          </View>
          <TouchableOpacity
            style={styles.directionsExternalBtn}
            onPress={handleOpenExternalGoogleMaps}
            activeOpacity={0.8}
            accessibilityLabel="Open in Google Maps"
          >
            <Ionicons name="navigate-circle-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Map Viewport */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            React.createElement('iframe', {
              srcDoc: mapHtml,
              style: {
                width: '100%',
                height: '100%',
                border: 'none',
              },
            })
          ) : NativeWebView ? (
            <NativeWebView
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={{ width: '100%', height: '100%' }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={false}
              androidHardwareAccelerationDisabled={false}
            />
          ) : (
            <View style={styles.fallbackCenter}>
              <Ionicons name="map-outline" size={54} color="#94A3B8" />
              <Text style={styles.fallbackTitle}>Interactive Map View</Text>
              <Text style={styles.fallbackSubtitle}>
                {displayDistance} away from your location
              </Text>
              <TouchableOpacity
                style={styles.openExternalMapsFallbackBtn}
                onPress={handleOpenExternalGoogleMaps}
              >
                <Text style={styles.openExternalMapsFallbackText}>
                  Open in Google Maps
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Floating Distance & ETA Badge */}
          <View style={styles.floatingDistancePill}>
            <View style={styles.pillPulseDot} />
            <Text style={styles.pillDistanceText}>{displayDistance}</Text>
            <Text style={styles.pillDivider}>•</Text>
            <Text style={styles.pillEtaText}>{estimatedMins} mins away</Text>
          </View>
        </View>

        {/* Bottom Store Direction Information Sheet */}
        <View style={styles.bottomSheetCard}>
          <View style={styles.dragBar} />

          <View style={styles.sheetTopRow}>
            <View style={styles.storeIconBox}>
              <Ionicons name="storefront" size={24} color="#E11D48" />
            </View>
            <View style={styles.sheetTitleCol}>
              <Text style={styles.sheetStoreName} numberOfLines={1}>
                {storeName}
              </Text>
              <Text style={styles.sheetStoreAddress} numberOfLines={2}>
                {storeAddress}
              </Text>
            </View>
            <View style={styles.distanceBadgeRight}>
              <Text style={styles.distanceBadgeNum}>{displayDistance}</Text>
              <Text style={styles.distanceBadgeLabel}>Approx Distance</Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.sheetActionRow}>
            <TouchableOpacity
              style={styles.googleMapsBtn}
              activeOpacity={0.85}
              onPress={handleOpenExternalGoogleMaps}
            >
              <Ionicons name="navigate" size={17} color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.googleMapsBtnText}>Turn-by-turn Navigation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  directionsExternalBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  floatingDistancePill: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  pillDistanceText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  pillDivider: {
    color: '#94A3B8',
    marginHorizontal: 6,
  },
  pillEtaText: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 12,
  },
  fallbackCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  openExternalMapsFallbackBtn: {
    marginTop: 18,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  openExternalMapsFallbackText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  bottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetTitleCol: {
    flex: 1,
  },
  sheetStoreName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetStoreAddress: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },
  distanceBadgeRight: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distanceBadgeNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E11D48',
  },
  distanceBadgeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  googleMapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  googleMapsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  closeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

