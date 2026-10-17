import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import {
  MapPin,
  Compass,
  Search,
  CheckCircle2,
  Navigation,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { LocationService } from '../services/locationService';

interface MapPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (coords: { latitude: number; longitude: number; address?: string }) => void;
  confirmLabel?: string;
  pinTitle?: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLatitude = 23.0805,
  initialLongitude = 72.5480,
  onLocationSelect,
  confirmLabel = 'Confirm Delivery Location',
  pinTitle = 'Delivery Point',
}) => {
  const [latitude, setLatitude] = useState<number>(initialLatitude);
  const [longitude, setLongitude] = useState<number>(initialLongitude);
  const [zoom, setZoom] = useState<number>(15);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ label: string; latitude: number; longitude: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');

  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      setLatitude(initialLatitude);
      setLongitude(initialLongitude);
    }
  }, [initialLatitude, initialLongitude]);

  const handleUseCurrentLocation = async () => {
    setGettingLocation(true);
    setConfirmed(false);
    try {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        setLatitude(Number(loc.latitude.toFixed(6)));
        setLongitude(Number(loc.longitude.toFixed(6)));
        setResolvedAddress(loc.readableAddress);
        setZoom(16);
        onLocationSelect({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.readableAddress,
        });
      }
    } catch (e: any) {
      console.warn('Current location error:', e.message);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleQuickAreaSelect = (areaName: string, lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setSearchQuery(areaName);
    setSearchResults([]);
    setConfirmed(false);
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      address: `${areaName}, Ahmedabad`,
    });
  };

  const nudge = (dLat: number, dLng: number) => {
    const newLat = Number((latitude + dLat).toFixed(6));
    const newLng = Number((longitude + dLng).toFixed(6));
    setLatitude(newLat);
    setLongitude(newLng);
    setConfirmed(false);
    onLocationSelect({ latitude: newLat, longitude: newLng });
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onLocationSelect({
      latitude,
      longitude,
      address: resolvedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    });
  };

  const iframeRef = React.useRef<any>(null);

  // Sync external coordinate updates to the embedded Leaflet map
  useEffect(() => {
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'PAN_TO',
            lat: latitude,
            lng: longitude,
            zoom,
          },
          '*'
        );
      } catch {
        // silent
      }
    }
  }, [latitude, longitude, zoom]);

  // Listen for user pin movements or map clicks from Leaflet
  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MAP_PIN_MOVED') {
        const newLat = Number(Number(event.data.latitude).toFixed(6));
        const newLng = Number(Number(event.data.longitude).toFixed(6));
        setLatitude(newLat);
        setLongitude(newLng);
        setConfirmed(false);
        onLocationSelect({ latitude: newLat, longitude: newLng });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMapMessage);
      return () => window.removeEventListener('message', handleMapMessage);
    }
  }, [onLocationSelect]);

  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #F8FAFC; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .custom-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: grab;
      user-select: none;
    }
    .custom-pin:active { cursor: grabbing; }
    .pin-badge {
      background: #111827;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 12px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      margin-bottom: 2px;
      letter-spacing: 0.3px;
    }
    .pin-circle {
      width: 34px;
      height: 34px;
      background: #DC2626;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.45);
      color: white;
    }
    .pin-shadow {
      width: 14px;
      height: 5px;
      background: rgba(0,0,0,0.25);
      border-radius: 50%;
      margin-top: 1px;
    }
    .hint-banner {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(4px);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 20px;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(255,255,255,0.7) !important;
    }
  </style>
</head>
<body>
  <div class="hint-banner">👆 Tap map or drag pin to select exact location</div>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], ${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    var pinIcon = L.divIcon({
      className: 'custom-pin',
      html: '<div class="pin-badge">${pinTitle}</div><div class="pin-circle"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg></div><div class="pin-shadow"></div>',
      iconSize: [120, 64],
      iconAnchor: [60, 60]
    });

    var marker = L.marker([${latitude}, ${longitude}], {
      draggable: true,
      icon: pinIcon
    }).addTo(map);

    function emitCoords(lat, lng) {
      window.parent.postMessage({
        type: 'MAP_PIN_MOVED',
        latitude: lat,
        longitude: lng
      }, '*');
    }

    marker.on('dragend', function() {
      var p = marker.getLatLng();
      emitCoords(p.lat, p.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      emitCoords(e.latlng.lat, e.latlng.lng);
    });

    window.addEventListener('message', function(ev) {
      if (!ev.data) return;
      if (ev.data.type === 'PAN_TO') {
        var nLat = ev.data.lat;
        var nLng = ev.data.lng;
        var nZoom = ev.data.zoom || map.getZoom();
        map.setView([nLat, nLng], nZoom, { animate: true });
        marker.setLatLng([nLat, nLng]);
      }
    });
  </script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search delivery locality or landmark..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleQuickAreaSelect('Thaltej', 23.0623, 72.5106)}
        >
          <Text style={styles.chipText}>📍 Thaltej</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleQuickAreaSelect('Chandlodiya', 23.0805, 72.5480)}
        >
          <Text style={styles.chipText}>📍 Chandlodiya</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleQuickAreaSelect('SG Highway', 23.0525, 72.5110)}
        >
          <Text style={styles.chipText}>📍 SG Highway</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleQuickAreaSelect('Prahlad Nagar', 23.0125, 72.5110)}
        >
          <Text style={styles.chipText}>📍 Prahlad Nagar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleQuickAreaSelect('Gota', 23.0950, 72.5350)}
        >
          <Text style={styles.chipText}>📍 Gota</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chip}
          onPress={() => handleQuickAreaSelect('Bopal', 23.0340, 72.4635)}
        >
          <Text style={styles.chipText}>📍 Bopal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Map Viewport Canvas with OpenStreetMap Leaflet */}
      <View style={styles.mapCanvas}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={mapHtml}
            style={{
              width: '100%',
              height: 320,
              border: 'none',
              borderRadius: 16,
            }}
            title="OpenStreetMap Delivery Pin"
          />
        ) : (
          <View style={styles.gridOverlay}>
            <View style={styles.horizontalLine} />
            <View style={styles.verticalLine} />
            <View style={styles.ring1} />
            <View style={styles.ring2} />
            <View style={styles.pinWrapper} pointerEvents="none">
              <View style={styles.pinBubble}>
                <Text style={styles.pinBubbleText}>{pinTitle}</Text>
              </View>
              <View style={styles.pinIconCircle}>
                <MapPin size={26} color="#DC2626" />
              </View>
              <View style={styles.pinShadow} />
            </View>
          </View>
        )}

        {/* Live Coordinate Badge */}
        <View style={styles.coordsBadge}>
          <Navigation size={12} color="#059669" />
          <Text style={styles.coordsText}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </View>
      </View>

      {/* GPS Auto-detect Button */}
      <TouchableOpacity
        style={styles.gpsButton}
        onPress={handleUseCurrentLocation}
        disabled={gettingLocation}
      >
        {gettingLocation ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Compass size={18} color="#FFFFFF" />
        )}
        <Text style={styles.gpsButtonText}>
          {gettingLocation ? 'Detecting GPS Device Location...' : 'Use My Current Location (GPS Auto-detect)'}
        </Text>
      </TouchableOpacity>

      {/* Manual Lat/Long Input Fields */}
      <View style={styles.manualCoordsRow}>
        <View style={styles.manualInputGroup}>
          <Text style={styles.manualLabel}>Latitude (lat)</Text>
          <TextInput
            style={styles.manualInput}
            value={String(latitude)}
            onChangeText={(txt) => {
              const val = parseFloat(txt);
              if (!isNaN(val)) setLatitude(val);
            }}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.manualInputGroup}>
          <Text style={styles.manualLabel}>Longitude (lng)</Text>
          <TextInput
            style={styles.manualInput}
            value={String(longitude)}
            onChangeText={(txt) => {
              const val = parseFloat(txt);
              if (!isNaN(val)) setLongitude(val);
            }}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmButton, confirmed && styles.confirmedButton]}
        onPress={handleConfirm}
      >
        <CheckCircle2 size={18} color="#FFFFFF" />
        <Text style={styles.confirmButtonText}>
          {confirmed ? 'Location Confirmed ✅' : confirmLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#1F2937',
  },
  chipsScroll: {
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  mapCanvas: {
    height: 320,
    minHeight: 320,
    backgroundColor: '#EEF2F6',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(209, 213, 219, 0.7)',
  },
  verticalLine: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(209, 213, 219, 0.7)',
  },
  ring1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  ring2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.15)',
  },
  pinWrapper: {
    alignItems: 'center',
    zIndex: 10,
  },
  pinBubble: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  pinBubbleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  pinIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinShadow: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 2,
  },
  mapControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  controlBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 10,
    padding: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dpadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpadBtn: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadCenter: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coordsBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coordsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  manualCoordsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  manualInputGroup: {
    flex: 1,
  },
  manualLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  manualInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    fontSize: 12,
    color: '#1F2937',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  confirmedButton: {
    backgroundColor: '#10B981',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
