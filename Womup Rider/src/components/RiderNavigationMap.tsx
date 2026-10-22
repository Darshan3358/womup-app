import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routeService, RouteData } from '../services/routeService';

export interface RiderNavigationMapProps {
  mode: 'PICKUP' | 'DELIVERY';
  riderCoords?: { latitude: number; longitude: number } | null;
  riderHeading?: number;
  targetCoords?: { latitude: number; longitude: number } | null;
  targetName: string;
  targetAddress?: string;
  distanceKm?: number;
  durationMinutes?: number;
  height?: number;
}

export const RiderNavigationMap: React.FC<RiderNavigationMapProps> = ({
  mode,
  riderCoords,
  riderHeading = 0,
  targetCoords,
  targetName,
  targetAddress = '',
  distanceKm = 1.2,
  durationMinutes = 6,
  height = 360,
}) => {
  const mapWidth = Dimensions.get('window').width;
  const iframeRef = useRef<any>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const hasValidRider = Boolean(riderCoords && typeof riderCoords.latitude === 'number' && typeof riderCoords.longitude === 'number' && !isNaN(riderCoords.latitude) && !isNaN(riderCoords.longitude));
  const hasValidTarget = Boolean(targetCoords && typeof targetCoords.latitude === 'number' && typeof targetCoords.longitude === 'number' && !isNaN(targetCoords.latitude) && !isNaN(targetCoords.longitude));

  // Fetch real road route geometry
  useEffect(() => {
    if (!hasValidRider || !hasValidTarget) return;

    let isMounted = true;
    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const data = await routeService.getRoute(
          riderCoords!.latitude,
          riderCoords!.longitude,
          targetCoords!.latitude,
          targetCoords!.longitude,
        );
        if (isMounted && data) {
          setRouteData(data);
        }
      } catch {
        // Fallback handled in routeService
      } finally {
        if (isMounted) setIsLoadingRoute(false);
      }
    };

    fetchRoute();
    const interval = setInterval(fetchRoute, 30000); // Refresh every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [
    riderCoords?.latitude,
    riderCoords?.longitude,
    targetCoords?.latitude,
    targetCoords?.longitude,
    hasValidRider,
    hasValidTarget,
  ]);

  // Push live coordinates to map via postMessage without re-rendering iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow && targetCoords) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          type: 'UPDATE_TELEMETRY',
          riderLat: riderCoords?.latitude ?? null,
          riderLng: riderCoords?.longitude ?? null,
          riderHeading,
          targetLat: targetCoords.latitude,
          targetLng: targetCoords.longitude,
          routeCoords: routeData?.coordinates || [],
        }),
        '*'
      );
    }
  }, [riderCoords, riderHeading, targetCoords, routeData]);

  const targetIcon = mode === 'PICKUP' ? '🏪' : '🏠';
  const targetLabel = mode === 'PICKUP' ? 'Dark Store' : 'Customer';
  const targetColor = mode === 'PICKUP' ? '#2563EB' : '#10B981';

  // Standalone Leaflet HTML template
  const mapHtml = useMemo(() => {
    if (!hasValidTarget) return '';

    const tLat = targetCoords!.latitude;
    const tLng = targetCoords!.longitude;
    const rLat = hasValidRider ? riderCoords!.latitude : tLat;
    const rLng = hasValidRider ? riderCoords!.longitude : tLng;
    const routeJson = JSON.stringify(routeData?.coordinates || (hasValidRider ? [[rLat, rLng], [tLat, tLng]] : [[tLat, tLng]]));

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; background:#0F172A; }
    .rider-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: #E11D48;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 14px rgba(225, 29, 72, 0.6);
      transition: transform 0.3s ease;
    }
    .rider-pulse {
      position: absolute;
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: rgba(225, 29, 72, 0.35);
      animation: pulse 1.8s infinite;
      z-index: -1;
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    .target-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 21px;
      background: ${targetColor};
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var targetIcon = L.divIcon({
      className: 'target-wrap',
      html: '<div class="target-marker">${targetIcon}</div>',
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });
    var targetMarker = L.marker([${tLat}, ${tLng}], { icon: targetIcon }).addTo(map);

    var hasRiderMarker = ${hasValidRider};
    var riderMarker = null;

    if (hasRiderMarker) {
      var riderIcon = L.divIcon({
        className: 'rider-wrap',
        html: '<div style="position:relative; display:flex; align-items:center; justify-content:center;">' +
              '<div class="rider-pulse"></div>' +
              '<div id="riderMarker" class="rider-marker" style="transform: rotate(${riderHeading}deg);">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>' +
              '<circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>' +
              '</svg>' +
              '</div></div>',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
      riderMarker = L.marker([${rLat}, ${rLng}], { icon: riderIcon }).addTo(map);
    }

    var initialRoute = ${routeJson};
    var routePolyline = L.polyline(initialRoute, {
      color: '#2563EB',
      weight: 6,
      opacity: 0.85,
      lineJoin: 'round',
      lineCap: 'round',
      dashArray: '8, 4'
    }).addTo(map);

    function fitBounds() {
      if (riderMarker) {
        var bounds = L.latLngBounds([
          riderMarker.getLatLng(),
          targetMarker.getLatLng()
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
      } else {
        map.setView([${tLat}, ${tLng}], 15);
      }
    }

    fitBounds();

    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'UPDATE_TELEMETRY') {
          if (data.riderLat && data.riderLng) {
            if (!riderMarker) {
              var riderIcon = L.divIcon({
                className: 'rider-wrap',
                html: '<div style="position:relative; display:flex; align-items:center; justify-content:center;">' +
                      '<div class="rider-pulse"></div>' +
                      '<div id="riderMarker" class="rider-marker">' +
                      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                      '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>' +
                      '<circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>' +
                      '</svg>' +
                      '</div></div>',
                iconSize: [44, 44],
                iconAnchor: [22, 22]
              });
              riderMarker = L.marker([data.riderLat, data.riderLng], { icon: riderIcon }).addTo(map);
            } else {
              riderMarker.setLatLng([data.riderLat, data.riderLng]);
            }
          }
          if (data.targetLat && data.targetLng) {
            targetMarker.setLatLng([data.targetLat, data.targetLng]);
          }
          if (data.riderHeading !== undefined) {
            var el = document.getElementById('riderMarker');
            if (el) el.style.transform = 'rotate(' + data.riderHeading + 'deg)';
          }
          if (data.routeCoords && data.routeCoords.length > 0) {
            routePolyline.setLatLngs(data.routeCoords);
          }
        } else if (data.type === 'RECENTER') {
          fitBounds();
        }
      } catch(e) {}
    });
  </script>
</body>
</html>`;
  }, [
    riderCoords?.latitude,
    riderCoords?.longitude,
    targetCoords?.latitude,
    targetCoords?.longitude,
    routeData,
    targetColor,
    targetIcon,
    riderHeading,
    hasValidTarget,
    hasValidRider,
  ]);

  if (!hasValidTarget) {
    return (
      <View style={[styles.container, { height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }]}>
        <Ionicons name="location-outline" size={32} color="#DC2626" />
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 8 }}>
          Destination location unavailable
        </Text>
      </View>
    );
  }

  const handleRecenter = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: 'RECENTER' }),
        '*'
      );
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Dynamic Map Iframe (Web & WebView compatible) */}
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 16,
          }}
          title="Rider Navigation Map"
        />
      ) : (
        <View style={styles.nativeFallback}>
          <Text style={styles.nativeFallbackText}>Live Map Telemetry Active</Text>
        </View>
      )}

      {/* Top Floating Mini Status Pill */}
      <View style={styles.topPill}>
        <View style={[styles.modeDot, { backgroundColor: targetColor }]} />
        <Text style={styles.topPillText}>
          {mode === 'PICKUP' ? 'PICKUP ROUTE' : 'DELIVERY ROUTE'}  •  {distanceKm} km ({durationMinutes} mins)
        </Text>
        {isLoadingRoute && (
          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 6 }} />
        )}
      </View>

      {/* Floating Recenter Button */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={handleRecenter}
        activeOpacity={0.8}
        accessibilityLabel="Recenter Map"
      >
        <Ionicons name="locate" size={20} color="#0F172A" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  topPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  topPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  nativeFallbackText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
