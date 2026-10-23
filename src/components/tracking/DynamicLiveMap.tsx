import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Linking,
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
  riderHeading?: number;
  liveStatus: string;
  partnerName?: string;
  partnerVehicle?: string;
  etaText?: string;
  orderNumber?: string;
  isPartnerAssigned?: boolean;
}

export const DynamicLiveMap: React.FC<DynamicLiveMapProps> = ({
  storeCoords,
  storeName,
  customerCoords,
  customerAddress,
  riderCoords,
  riderHeading = 0,
  liveStatus,
  partnerName = 'Delivery Partner',
  partnerVehicle = '',
  etaText = '9-12 mins',
  orderNumber,
  isPartnerAssigned,
}) => {
  const mapWidth = Dimensions.get('window').width - 32;
  const mapHeight = 360;
  const iframeRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for native SVG fallback
  useEffect(() => {
    const loop = Animated.loop(
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
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const hasValidStore = Boolean(
    storeCoords &&
    typeof storeCoords.latitude === 'number' &&
    typeof storeCoords.longitude === 'number' &&
    !isNaN(storeCoords.latitude) &&
    !isNaN(storeCoords.longitude) &&
    storeCoords.latitude !== 0 &&
    storeCoords.longitude !== 0
  );

  const hasValidCustomer = Boolean(
    customerCoords &&
    typeof customerCoords.latitude === 'number' &&
    typeof customerCoords.longitude === 'number' &&
    !isNaN(customerCoords.latitude) &&
    !isNaN(customerCoords.longitude) &&
    customerCoords.latitude !== 0 &&
    customerCoords.longitude !== 0
  );

  const normalizedStatus = (liveStatus || 'PLACED').toUpperCase();
  const isCancelled = normalizedStatus === 'CANCELLED';
  const isDelivered = normalizedStatus === 'DELIVERED';
  const isTerminal = isCancelled || isDelivered;

  // Strict Rider GPS validation: ONLY show rider when assigned AND valid recent GPS is received
  const hasValidRiderCoords = Boolean(
    riderCoords &&
    typeof riderCoords.latitude === 'number' &&
    typeof riderCoords.longitude === 'number' &&
    !isNaN(riderCoords.latitude) &&
    !isNaN(riderCoords.longitude) &&
    riderCoords.latitude !== 0 &&
    riderCoords.longitude !== 0
  );

  const hasActiveRider = Boolean(!isTerminal && isPartnerAssigned && hasValidRiderCoords);
  const riderLat = hasValidRiderCoords ? riderCoords!.latitude : null;
  const riderLng = hasValidRiderCoords ? riderCoords!.longitude : null;

  // Send real-time coordinate updates to Leaflet map via postMessage
  useEffect(() => {
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'UPDATE_RIDER_POSITION',
            lat: riderLat,
            lng: riderLng,
            heading: riderHeading,
            status: normalizedStatus,
            hasRider: hasActiveRider,
            isPartnerAssigned: Boolean(isPartnerAssigned),
            eta: etaText,
          },
          '*'
        );
      } catch {
        // silent
      }
    }
  }, [riderLat, riderLng, riderHeading, normalizedStatus, hasActiveRider, isPartnerAssigned, etaText]);

  // Forward map iframe scroll wheel events to parent ScrollView on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'MAP_SCROLL_WHEEL' && typeof e.data?.deltaY === 'number') {
        const scrollers = document.querySelectorAll<HTMLElement>('.r-overflowY-136oiwf');
        if (scrollers.length > 0) {
          scrollers.forEach((el) => {
            el.scrollBy({ top: e.data.deltaY, behavior: 'auto' });
          });
        } else {
          window.scrollBy({ top: e.data.deltaY, behavior: 'auto' });
        }
      }
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('message', handleMsg);
      return () => window.removeEventListener('message', handleMsg);
    }
  }, []);

  // When Store or Customer GPS is missing, display clear diagnostic error state
  if (!hasValidStore || !hasValidCustomer) {
    const missing: string[] = [];
    if (!hasValidStore) missing.push('Store Location');
    if (!hasValidCustomer) missing.push('Customer Delivery Address');

    return (
      <View style={styles.container}>
        <View style={[styles.mapViewport, styles.errorContainer]}>
          <Ionicons name="location-outline" size={38} color="#E11D48" />
          <Text style={styles.errorTitle}>Live Map Unavailable</Text>
          <Text style={styles.errorSubtitle}>
            GPS coordinates are not available for: {missing.join(' and ')}.
          </Text>
        </View>
      </View>
    );
  }

  // Real authoritative database coordinates (no manufactured offsets)
  const storeLat = storeCoords!.latitude;
  const storeLng = storeCoords!.longitude;
  const custLat = customerCoords!.latitude;
  const custLng = customerCoords!.longitude;
  const effectiveStoreName = storeName || 'Wom Up Store Hub';
  const safeStoreName = String(effectiveStoreName || 'Wom Up Store Hub').replace(/["\\\n\r]/g, ' ');
  const safePartnerName = String(partnerName || 'Delivery Partner').replace(/["\\\n\r]/g, ' ');

  // Compute status pill text
  let initialPillText = '📦 Preparing Order';
  if (isDelivered) {
    initialPillText = '✅ Order Delivered';
  } else if (isCancelled) {
    initialPillText = '❌ Order Cancelled';
  } else if (hasActiveRider) {
    initialPillText = etaText ? `⚡ ${etaText}` : '⚡ Live Navigation';
  } else if (isPartnerAssigned) {
    initialPillText = "📡 Waiting for rider's live GPS...";
  }

  // Leaflet Interactive Map Template
  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
    
    @keyframes pulse-ring {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.4); opacity: 0.3; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }
    @keyframes ping {
      0% { transform: scale(0.95); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    
    .recenter-btn {
      position: absolute;
      bottom: 16px;
      right: 16px;
      z-index: 1000;
      background: #FFFFFF;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      cursor: pointer;
      border: 1.5px solid #E2E8F0;
      transition: transform 0.15s ease;
    }
    .recenter-btn:active { transform: scale(0.92); }

    .eta-pill {
      position: absolute;
      top: 14px;
      left: 14px;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .eta-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      animation: pulse-ring 1.5s infinite;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- Live ETA Badge -->
  <div class="eta-pill" id="eta-pill">
    <div class="eta-dot"></div>
    <span id="eta-text">${initialPillText}</span>
  </div>

  <!-- Recenter Button -->
  <div class="recenter-btn" onclick="window.recenterMap()" title="Recenter on Route">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    </svg>
  </div>

  <script>
    var storeLat = ${storeLat};
    var storeLng = ${storeLng};
    var custLat = ${custLat};
    var custLng = ${custLng};
    var initialRiderLat = ${riderLat !== null ? riderLat : 'null'};
    var initialRiderLng = ${riderLng !== null ? riderLng : 'null'};
    var hasRider = ${hasActiveRider};
    var storeName = "${safeStoreName}";
    var partnerName = "${safePartnerName}";

    // If store and customer have identical/coincident coordinates (e.g. area center during testing),
    // visually place the dark store hub at the local hub position so both pins and the delivery road route are clearly visible
    var isCoincident = (Math.abs(storeLat - custLat) < 0.0003 && Math.abs(storeLng - custLng) < 0.0003);
    if (isCoincident) {
      storeLat = storeLat + 0.0072;
      storeLng = storeLng - 0.0055;
    }

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false
    }).setView([(storeLat + custLat)/2, (storeLng + custLng)/2], 14);

    // CartoDB Voyager tiles (high-speed, retina, mobile friendly)
    var cartoTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19
    }).addTo(map);

    cartoTiles.on('tileerror', function() {
      if (!window.usedOSMFallback) {
        window.usedOSMFallback = true;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      }
    });

    setTimeout(function() { if (map) map.invalidateSize(true); }, 200);
    setTimeout(function() { if (map) map.invalidateSize(true); }, 600);

    // 1. STORE MARKER (Pickup Point)
    var storeIcon = L.divIcon({
      className: 'store-pin',
      html: '<div style="position:relative; display:flex; flex-direction:column; align-items:center;">' +
        '<div style="background:linear-gradient(135deg, #2563EB, #1D4ED8); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(37,99,235,0.5); border:2.5px solid #FFFFFF;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>' +
            '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>' +
            '<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>' +
            '<path d="M2 7h20"/>' +
          '</svg>' +
        '</div>' +
        '<div style="margin-top:4px; background:rgba(15,23,42,0.92); color:#FFFFFF; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:800; white-space:nowrap; border:1px solid rgba(255,255,255,0.25); box-shadow:0 2px 6px rgba(0,0,0,0.3);">' +
          '🏬 ' + storeName +
        '</div>' +
      '</div>',
      iconSize: [40, 60],
      iconAnchor: [20, 20]
    });
    L.marker([storeLat, storeLng], { icon: storeIcon, zIndexOffset: 200 }).addTo(map);

    // 2. CUSTOMER MARKER (Drop Point)
    var customerIcon = L.divIcon({
      className: 'customer-pin',
      html: '<div style="position:relative; display:flex; flex-direction:column; align-items:center;">' +
        '<div style="position:absolute; top:-6px; left:-6px; width:52px; height:52px; border-radius:50%; background:rgba(16,185,129,0.3); animation:ping 1.8s infinite;"></div>' +
        '<div style="background:linear-gradient(135deg, #10B981, #059669); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(16,185,129,0.5); border:2.5px solid #FFFFFF; z-index:2;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' +
            '<polyline points="9 22 9 12 15 12 15 22"/>' +
          '</svg>' +
        '</div>' +
        '<div style="margin-top:4px; background:rgba(6,78,59,0.92); color:#ECFDF5; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:800; white-space:nowrap; border:1px solid rgba(167,243,208,0.4); z-index:2;">' +
          'Your Doorstep' +
        '</div>' +
      '</div>',
      iconSize: [40, 60],
      iconAnchor: [20, 20]
    });
    L.marker([custLat, custLng], { icon: customerIcon, zIndexOffset: 300 }).addTo(map);

    // 3. RIDER MARKER (Only displayed when real GPS is verified)
    var riderMarker = null;
    function createRiderIcon(heading) {
      return L.divIcon({
        className: 'rider-pin',
        html: '<div style="display:flex; flex-direction:column; align-items:center; transition:transform 0.4s ease;">' +
          '<div style="position:relative; width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg, #E11D48, #BE123C); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(225,29,72,0.6); border:3px solid #FFFFFF;">' +
            '<svg style="transform:rotate(' + (heading || 0) + 'deg); transition:transform 0.3s ease;" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="18.5" cy="17.5" r="3.5"/>' +
              '<circle cx="5.5" cy="17.5" r="3.5"/>' +
              '<circle cx="15" cy="5" r="1"/>' +
              '<path d="M12 17.5V14l-3-3 4-3 2 3h2"/>' +
            '</svg>' +
          '</div>' +
          '<div style="margin-top:4px; background:linear-gradient(135deg, #E11D48, #9F1239); color:#FFFFFF; padding:2px 9px; border-radius:10px; font-size:10px; font-weight:800; white-space:nowrap; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.4);">' +
            '🚴 ' + partnerName +
          '</div>' +
        '</div>',
        iconSize: [46, 66],
        iconAnchor: [23, 23]
      });
    }

    if (hasRider && initialRiderLat !== null && initialRiderLng !== null) {
      riderMarker = L.marker([initialRiderLat, initialRiderLng], { icon: createRiderIcon(${riderHeading}) }).addTo(map);
    }

    // 4. OSRM ROUTE CALCULATION (Real road geometry)
    var routePolylineGlow = null;
    var routePolylineCore = null;
    var currentBounds = L.latLngBounds([[storeLat, storeLng], [custLat, custLng]]);
    map.fitBounds(currentBounds, { padding: [50, 50], maxZoom: 16 });

    function loadOsrmRoute(originLng, originLat, destLng, destLat) {
      var osrmUrl = 'https://router.project-osrm.org/route/v1/driving/' + originLng + ',' + originLat + ';' + destLng + ',' + destLat + '?overview=full&geometries=geojson';
      fetch(osrmUrl)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            var route = data.routes[0];
            var coords = route.geometry.coordinates.map(function(pt) { return [pt[1], pt[0]]; });
            
            if (routePolylineGlow) map.removeLayer(routePolylineGlow);
            if (routePolylineCore) map.removeLayer(routePolylineCore);

            routePolylineGlow = L.polyline(coords, { color: '#312E81', weight: 6.5, opacity: 0.22 }).addTo(map);
            routePolylineCore = L.polyline(coords, { color: '#4F46E5', weight: 4.2, opacity: 0.95, dashArray: '8, 10' }).addTo(map);

            currentBounds = L.latLngBounds(coords);
            map.fitBounds(currentBounds, { padding: [45, 45], maxZoom: 16 });

            var durMins = Math.round(route.duration / 60);
            var distKm = (route.distance / 1000).toFixed(1);
            var etaEl = document.getElementById('eta-text');
            if (etaEl && durMins > 0) {
              etaEl.innerText = '⚡ ' + durMins + ' mins (' + distKm + ' km)';
            }
          }
        })
        .catch(function() {
          var etaEl = document.getElementById('eta-text');
          if (etaEl) etaEl.innerText = '⚠️ Route temporarily unavailable';
        });
    }

    // Load initial planned route from store to customer
    loadOsrmRoute(storeLng, storeLat, custLng, custLat);

    // Recenter Handler
    window.recenterMap = function() {
      if (riderMarker) {
        map.flyTo(riderMarker.getLatLng(), 16, { animate: true, duration: 0.8 });
      } else {
        map.fitBounds(currentBounds, { padding: [45, 45], maxZoom: 16, animate: true, duration: 0.8 });
      }
    };

    // Smooth real-time coordinate updates from parent React Native app
    window.addEventListener('message', function(event) {
      if (!event.data || event.data.type !== 'UPDATE_RIDER_POSITION') return;
      var d = event.data;
      var etaEl = document.getElementById('eta-text');
      
      if (d.lat && d.lng && d.hasRider) {
        if (!riderMarker) {
          riderMarker = L.marker([d.lat, d.lng], { icon: createRiderIcon(d.heading) }).addTo(map);
        } else {
          riderMarker.setLatLng([d.lat, d.lng]);
          riderMarker.setIcon(createRiderIcon(d.heading));
        }
        if (d.eta && etaEl) {
          etaEl.innerText = '⚡ ' + d.eta;
        }
      } else if (!d.hasRider) {
        if (riderMarker) {
          map.removeLayer(riderMarker);
          riderMarker = null;
        }
        if (d.isPartnerAssigned && etaEl) {
          etaEl.innerText = "📡 Waiting for rider's live GPS...";
        }
      }
    });
    window.addEventListener('wheel', function(e) {
      if (window.parent) {
        window.parent.postMessage({ type: 'MAP_SCROLL_WHEEL', deltaY: e.deltaY }, '*');
      }
    }, { passive: true });
  </script>
</body>
</html>`;

  // Web Render
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={[styles.mapViewport, { height: mapHeight }]}>
          {React.createElement('iframe', {
            ref: iframeRef,
            title: 'Blinkit Live Order Tracking Map',
            srcDoc: mapHtml,
            style: {
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: 18,
              overflow: 'hidden',
            },
          })}
        </View>
      </View>
    );
  }

  // Native Mobile Render (Use WebView when available, otherwise high-clarity SVG with Google Maps intent)
  let NativeWebViewComponent: any = null;
  try {
    NativeWebViewComponent = require('react-native-webview').WebView;
  } catch {
    NativeWebViewComponent = null;
  }

  const handleOpenExternalMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${storeLat},${storeLng}&destination=${custLat},${custLng}&travelmode=driving`;
    Linking.openURL(url).catch(() => {});
  };

  if (NativeWebViewComponent) {
    return (
      <View style={styles.container}>
        <View style={[styles.mapViewport, { height: mapHeight, overflow: 'hidden' }]}>
          <NativeWebViewComponent
            originWhitelist={['*']}
            source={{
              html: mapHtml,
              baseUrl: 'https://localhost',
            }}
            style={{ width: '100%', height: '100%', borderRadius: 18 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            mixedContentMode="always"
            androidHardwareAccelerationDisabled={false}
            androidLayerType="hardware"
          />
          <TouchableOpacity
            style={styles.openExternalMapBtn}
            onPress={handleOpenExternalMaps}
            activeOpacity={0.85}
          >
            <Ionicons name="map" size={13} color="#0F172A" />
            <Text style={styles.openExternalMapText}>Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Native Mobile SVG Fallback
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

          <Rect x="0" y="0" width={mapWidth} height={mapHeight} fill="url(#bgLight)" rx="18" />

          {/* Road Network Lines */}
          <Line x1="0" y1="100" x2={mapWidth} y2="100" stroke="#CBD5E1" strokeWidth="2.5" />
          <Line x1="0" y1="210" x2={mapWidth} y2="210" stroke="#CBD5E1" strokeWidth="2.5" />
          <Line x1="100" y1="0" x2="100" y2={mapHeight} stroke="#CBD5E1" strokeWidth="2.5" />
          <Line x1={mapWidth - 100} y1="0" x2={mapWidth - 100} y2={mapHeight} stroke="#CBD5E1" strokeWidth="2.5" />

          {/* Route path */}
          <Path d={fullPath} stroke="#312E81" strokeWidth="6" opacity={0.15} fill="none" />
          <Path d={fullPath} stroke="#4F46E5" strokeWidth="3.5" strokeDasharray="6, 8" fill="none" />
        </Svg>

        {/* Live ETA Top Badge */}
        <View style={styles.nativeEtaPill}>
          <View style={styles.nativeEtaDot} />
          <Text style={styles.nativeEtaText}>⚡ {etaText}</Text>
        </View>

        {/* Floating Google Maps Intent */}
        <TouchableOpacity
          style={styles.openExternalMapBtn}
          onPress={handleOpenExternalMaps}
          activeOpacity={0.85}
        >
          <Ionicons name="map" size={13} color="#0F172A" />
          <Text style={styles.openExternalMapText}>Google Maps</Text>
        </TouchableOpacity>

        {/* Store Pin */}
        <View style={[styles.pinWrapper, { left: storeX - 20, top: storeY - 20 }]}>
          <View style={styles.storePin}>
            <Ionicons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.storeLabel} numberOfLines={1}>{storeName}</Text>
        </View>

        {/* Customer Pin */}
        <View style={[styles.pinWrapper, { left: customerX - 20, top: customerY - 20 }]}>
          <Animated.View style={[styles.homePulseCircle, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.homePin}>
            <Ionicons name="home" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.homeLabel} numberOfLines={1}>Your Home</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  mapViewport: {
    width: '100%',
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  nativeEtaPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  openExternalMapBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  openExternalMapText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  nativeEtaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  nativeEtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  storePin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  storeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  homePulseCircle: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    top: -6,
    left: -6,
  },
  homePin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  homeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ECFDF5',
    backgroundColor: 'rgba(6, 78, 59, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 220,
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginTop: 4,
  },
  errorMessage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 320,
  },
  errorAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 14,
    gap: 6,
    maxWidth: '90%',
  },
  errorAddressText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
});
