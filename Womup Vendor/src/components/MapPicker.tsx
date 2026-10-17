import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
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
  X,
} from 'lucide-react-native';
import { COLORS } from '../theme';
import { LocationService } from '../services/locationService';

interface MapPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (coords: { latitude: number; longitude: number; address?: string }) => void;
  confirmLabel?: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLatitude = 23.1288,
  initialLongitude = 72.5507,
  onLocationSelect,
  confirmLabel = 'Confirm This Location',
}) => {
  const [latitude, setLatitude] = useState<number>(initialLatitude);
  const [longitude, setLongitude] = useState<number>(initialLongitude);
  const [zoom, setZoom] = useState<number>(15);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ label: string; latitude: number; longitude: number; pincode?: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Sync if initial props change
  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      setLatitude(initialLatitude);
      setLongitude(initialLongitude);
    }
  }, [initialLatitude, initialLongitude]);

  // Handle GPS Auto-detect
  const handleUseCurrentLocation = async () => {
    setGettingLocation(true);
    setConfirmed(false);
    const res = await LocationService.getCurrentPosition();
    setGettingLocation(false);

    if (res.success && res.coords) {
      setLatitude(res.coords.latitude);
      setLongitude(res.coords.longitude);
      setZoom(16);
      onLocationSelect({
        latitude: res.coords.latitude,
        longitude: res.coords.longitude,
      });
    }
  };

  // Handle Address Search
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      setSearching(true);
      const results = await LocationService.searchLocation(text);
      setSearchResults(results);
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  // Handle Select Search Result
  const handleSelectResult = (item: { label: string; latitude: number; longitude: number }) => {
    setLatitude(Number(item.latitude.toFixed(6)));
    setLongitude(Number(item.longitude.toFixed(6)));
    setSearchQuery(item.label);
    setSearchResults([]);
    setConfirmed(false);
    onLocationSelect({
      latitude: item.latitude,
      longitude: item.longitude,
      address: item.label,
    });
  };

  // Handle Map Tap / Click to re-position pin
  const handleMapTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const mapWidth = 360;
    const mapHeight = 220;

    // Small proportional delta shift from center
    const deltaX = (locationX - mapWidth / 2) / mapWidth;
    const deltaY = (locationY - mapHeight / 2) / mapHeight;

    // Scale step by zoom factor
    const scale = 0.015 / Math.pow(2, zoom - 14);
    const newLat = Number((latitude - deltaY * scale).toFixed(6));
    const newLng = Number((longitude + deltaX * scale).toFixed(6));

    setLatitude(newLat);
    setLongitude(newLng);
    setConfirmed(false);
    onLocationSelect({ latitude: newLat, longitude: newLng });
  };

  // Map tile URL generator (CartoDB voyager / OpenStreetMap dark/light tiles)
  const getMapTileUrl = (lat: number, lng: number, z: number) => {
    // Static map preview URL centered at lat,lng
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${z}&size=600x360&maptype=mapnik`;
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onLocationSelect({
      latitude,
      longitude,
    });
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchWrapper}>
        <Search size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shop area, street or landmark..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        ) : null}
        {searching && <ActivityIndicator size="small" color={COLORS.rose} />}
      </View>

      {/* Autocomplete Results Dropdown */}
      {searchResults.length > 0 && (
        <View style={styles.dropdown}>
          {searchResults.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.dropdownItem}
              onPress={() => handleSelectResult(item)}
            >
              <MapPin size={14} color={COLORS.rose} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownLabel}>{item.label}</Text>
                <Text style={styles.dropdownCoords}>
                  Lat: {item.latitude.toFixed(4)}, Lng: {item.longitude.toFixed(4)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Location Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickChipsScroll}>
        {[
          { label: 'Chandlodiya', lat: 23.0815, lng: 72.5441 },
          { label: 'SG Highway', lat: 23.0478, lng: 72.5178 },
          { label: 'Prahlad Nagar', lat: 23.0125, lng: 72.5113 },
          { label: 'Bopal', lat: 23.0338, lng: 72.4641 },
          { label: 'Navrangpura', lat: 23.0365, lng: 72.5611 },
          { label: 'Vastrapur', lat: 23.0354, lng: 72.5258 },
        ].map((area) => (
          <TouchableOpacity
            key={area.label}
            style={styles.quickChip}
            onPress={() => {
              setLatitude(area.lat);
              setLongitude(area.lng);
              setConfirmed(false);
              onLocationSelect({ latitude: area.lat, longitude: area.lng, address: area.label });
            }}
          >
            <Text style={styles.quickChipText}>{area.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Interactive Visual Map Container */}
      <View style={styles.mapContainer}>
        {/* Map Background Tile Imagery */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handleMapTap}
          style={styles.mapTouchArea}
        >
          <Image
            source={{ uri: getMapTileUrl(latitude, longitude, zoom) }}
            style={styles.mapImage}
            resizeMode="cover"
          />

          {/* Map Grid Overlay Texture */}
          <View style={styles.gridOverlay} />

          {/* Center Pin Marker */}
          <View style={styles.pinWrapper} pointerEvents="none">
            <View style={styles.pinBubble}>
              <Text style={styles.pinBubbleText}>Shop Entrance</Text>
            </View>
            <View style={styles.pinMarkerCircle}>
              <MapPin size={24} color="#EF4444" fill="#EF4444" />
            </View>
            <View style={styles.pinPulseShadow} />
          </View>

          {/* Hint Overlay */}
          <View style={styles.tapHintBadge}>
            <Crosshair size={12} color="#FFFFFF" />
            <Text style={styles.tapHintText}>Tap anywhere on map to reposition pin</Text>
          </View>
        </TouchableOpacity>

        {/* Map Control Floating Buttons */}
        <View style={styles.controlsCol}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setZoom((z) => Math.min(18, z + 1))}
            activeOpacity={0.8}
          >
            <ZoomIn size={16} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setZoom((z) => Math.max(12, z - 1))}
            activeOpacity={0.8}
          >
            <ZoomOut size={16} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.gpsFloatingBtn]}
            onPress={handleUseCurrentLocation}
            disabled={gettingLocation}
            activeOpacity={0.8}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Navigation size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* "Use My Current Location" Full Banner */}
      <TouchableOpacity
        style={styles.myLocationBanner}
        onPress={handleUseCurrentLocation}
        disabled={gettingLocation}
        activeOpacity={0.85}
      >
        <Compass size={18} color="#0284C7" />
        <Text style={styles.myLocationText}>
          {gettingLocation ? 'Detecting GPS Device Location...' : 'Use My Current Location (GPS Auto-detect)'}
        </Text>
        {gettingLocation && <ActivityIndicator size="small" color="#0284C7" />}
      </TouchableOpacity>

      {/* Selected Coordinates Banner */}
      <View style={styles.coordsCard}>
        <View style={styles.coordsHeader}>
          <View style={styles.coordsBadge}>
            <MapPin size={14} color="#10B981" />
            <Text style={styles.coordsBadgeText}>PINNED STORE COORDINATES</Text>
          </View>
          {confirmed && (
            <View style={styles.confirmedPill}>
              <CheckCircle2 size={12} color="#10B981" />
              <Text style={styles.confirmedText}>Confirmed</Text>
            </View>
          )}
        </View>

        <View style={styles.coordsRow}>
          <View style={styles.coordCol}>
            <Text style={styles.coordLabel}>Latitude (North)</Text>
            <Text style={styles.coordVal}>{latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.coordDivider} />
          <View style={styles.coordCol}>
            <Text style={styles.coordLabel}>Longitude (East)</Text>
            <Text style={styles.coordVal}>{longitude.toFixed(6)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, confirmed && styles.confirmBtnActive]}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <CheckCircle2 size={16} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>{confirmed ? 'Location Confirmed ✓' : confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dropdown: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: -4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  dropdownLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dropdownCoords: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  quickChipsScroll: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  quickChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  mapContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    backgroundColor: '#0F172A',
  },
  mapTouchArea: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  pinBubble: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pinBubbleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F87171',
  },
  pinMarkerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPulseShadow: {
    width: 14,
    height: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    marginTop: -2,
  },
  tapHintBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tapHintText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  controlsCol: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 6,
  },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsFloatingBtn: {
    backgroundColor: '#0284C7',
    marginTop: 4,
  },
  myLocationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  myLocationText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  coordsCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  coordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confirmedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
  },
  coordCol: {
    flex: 1,
    alignItems: 'center',
  },
  coordLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  coordVal: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  coordDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  confirmBtnActive: {
    backgroundColor: '#10B981',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
