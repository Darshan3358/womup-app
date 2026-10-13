import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { TRACKING_WS_URL } from '../services/api';
import { Navigation, ShieldCheck, Clock, Loader2, AlertTriangle } from 'lucide-react';

export interface LocationPoint {
  lat: number;
  lng: number;
}

interface LiveTrackingMapProps {
  orderId: string;
  orderNumber?: string;
  storeLocation?: [number, number];
  customerLocation?: [number, number];
  storeName?: string;
  customerAddress?: string;
  status?: string;
  partnerName?: string;
  isPartnerAssigned?: boolean;
}

// Default Locations in Ahmedabad (Dark Store ~2km away from Customer Home: 23.1288° N, 72.5507° E)
const DEFAULT_STORE: [number, number] = [23.1128, 72.5427]; // Wom Up Chandlodiya Dark Store (2km away)
const DEFAULT_CUSTOMER: [number, number] = [23.1288, 72.5507]; // Customer Delivery Location (Home)

// Custom Modern HTML Marker Icons via L.divIcon
const createStoreIcon = (name: string) =>
  L.divIcon({
    className: 'custom-store-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45); border: 2.5px solid #FFFFFF;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>
        </div>
        <div style="position: absolute; bottom: -6px; width: 8px; height: 8px; background: #1D4ED8; transform: rotate(45deg); border-right: 1.5px solid #FFF; border-bottom: 1.5px solid #FFF;"></div>
        <div style="margin-top: 8px; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(4px); color: #F8FAFC; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15);">
          ${name}
        </div>
      </div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 36],
    popupAnchor: [0, -38],
  });

const createCustomerIcon = () =>
  L.divIcon({
    className: 'custom-customer-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="position: absolute; top: -6px; left: -6px; width: 50px; height: 50px; border-radius: 50%; background: rgba(16, 185, 129, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="background: linear-gradient(135deg, #10B981, #059669); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5); border: 2.5px solid #FFFFFF; z-index: 2;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div style="position: absolute; bottom: -6px; width: 8px; height: 8px; background: #059669; transform: rotate(45deg); border-right: 1.5px solid #FFF; border-bottom: 1.5px solid #FFF; z-index: 2;"></div>
        <div style="margin-top: 8px; background: rgba(6, 78, 59, 0.9); backdrop-filter: blur(4px); color: #ECFDF5; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(167, 243, 208, 0.3); z-index: 2;">
          Your Home
        </div>
      </div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 36],
    popupAnchor: [0, -38],
  });

const createRiderIcon = (partnerName?: string) =>
  L.divIcon({
    className: 'custom-rider-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="position: absolute; top: -8px; left: -8px; width: 60px; height: 60px; border-radius: 50%; background: rgba(124, 58, 237, 0.3); animation: pulse 1.6s ease-in-out infinite;"></div>
        <div style="background: linear-gradient(135deg, #7C3AED, #9333EA); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(124, 58, 237, 0.6); border: 3px solid #FFFFFF; z-index: 2;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
        </div>
        <div style="margin-top: 6px; background: linear-gradient(135deg, #7C3AED, #5B21B6); color: #FFFFFF; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 800; white-space: nowrap; box-shadow: 0 3px 8px rgba(0,0,0,0.35); border: 1.5px solid rgba(255,255,255,0.4); z-index: 2; display: flex; align-items: center; gap: 4px;">
          <span>🚴</span>
          <span>${partnerName || 'Delivery Partner'}</span>
        </div>
      </div>
    `,
    iconSize: [50, 70],
    iconAnchor: [25, 40],
    popupAnchor: [0, -42],
  });

// ==========================================
// 🚗 OSRM Real Road Routing Engine Integration
// Free, Open-Source, No API Key, No Billing
// ==========================================
export interface OsrmRouteResult {
  coordinates: [number, number][]; // Array of [lat, lng] road points
  distanceKm: number;
  durationMins: number;
}

const osrmRouteCache = new Map<string, OsrmRouteResult>();

async function fetchOsrmRoadRoute(
  start: [number, number], // [lat, lng]
  end: [number, number]    // [lat, lng]
): Promise<OsrmRouteResult | null> {
  // Round to 4 decimal places (~11m) to cache efficiently and avoid micro-jitter
  const cacheKey = `${start[0].toFixed(4)},${start[1].toFixed(4)}->${end[0].toFixed(4)},${end[1].toFixed(4)}`;
  if (osrmRouteCache.has(cacheKey)) {
    return osrmRouteCache.get(cacheKey)!;
  }

  try {
    // OSRM expects coordinates in {lng},{lat} order!
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
      const route = data.routes[0];
      // OSRM returns coordinates as [lng, lat] -> Leaflet Polyline requires [lat, lng]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      const distanceKm = Math.max(0.1, parseFloat((route.distance / 1000).toFixed(1)));
      // City delivery scooter speed duration estimate in minutes
      const durationMins = Math.max(3, Math.round(route.duration / 60));

      const result: OsrmRouteResult = { coordinates, distanceKm, durationMins };
      osrmRouteCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('[LiveTrackingMap] OSRM route fetch error, using fallback:', err);
  }
  return null;
}

// Map View Controller component to center and fit bounds smoothly
function MapController({
  riderLoc,
  storeLoc,
  customerLoc,
  recenterTrigger,
  roadPoints,
}: {
  riderLoc: [number, number] | null;
  storeLoc: [number, number];
  customerLoc: [number, number];
  recenterTrigger: number;
  roadPoints?: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const points: [number, number][] = [storeLoc, customerLoc];
    if (riderLoc) points.push(riderLoc);
    if (roadPoints && roadPoints.length > 0) {
      // Include key road points for accurate framing
      const step = Math.max(1, Math.floor(roadPoints.length / 8));
      for (let i = 0; i < roadPoints.length; i += step) {
        points.push(roadPoints[i]);
      }
    }

    try {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    } catch {
      map.setView(customerLoc, 14);
    }
  }, [map, storeLoc, customerLoc, riderLoc, roadPoints]);

  useEffect(() => {
    if (recenterTrigger === 0 || !map) return;
    if (riderLoc) {
      map.flyTo(riderLoc, 16, { animate: true, duration: 1.2 });
    } else {
      map.flyTo(customerLoc, 15, { animate: true, duration: 1.2 });
    }
  }, [recenterTrigger, map, riderLoc, customerLoc]);

  return null;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  orderId,
  orderNumber,
  storeLocation,
  customerLocation,
  storeName = 'Wom Up Dark Store',
  customerAddress = 'Delivery Location',
  status = 'PLACED',
  partnerName = '',
  isPartnerAssigned,
}) => {
  const effectiveStore: [number, number] = storeLocation || DEFAULT_STORE;
  const effectiveCustomer: [number, number] = customerLocation || DEFAULT_CUSTOMER;

  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);
  const [recenterCount, setRecenterCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLocationUnavailable, setIsLocationUnavailable] = useState(false);
  const lastLocationReceivedAt = useRef<number>(Date.now());

  const normalizedStatus = (status || '').toUpperCase();
  const isCancelled = normalizedStatus === 'CANCELLED';
  const isDelivered = normalizedStatus === 'DELIVERED';
  const isTerminal = isCancelled || isDelivered;

  // 1. Determine legitimate partner assignment state
  const isAssigned = !isTerminal && (
    isPartnerAssigned !== undefined
      ? isPartnerAssigned
      : Boolean(
          partnerName &&
          partnerName.trim() !== '' &&
          partnerName.toLowerCase() !== 'delivery partner' &&
          partnerName.toLowerCase() !== 'assigning...' &&
          !partnerName.toLowerCase().includes('rohit')
        )
  );

  const isPartnerStage = !isTerminal && [
    'ACCEPTED',
    'ASSIGNED',
    'GOING_TO_STORE',
    'ARRIVED_AT_STORE',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
  ].includes(normalizedStatus);

  // Rider icon and live marker render ONLY when order is active AND partner is legitimately assigned
  const hasActiveRider = !isTerminal && (isAssigned || isPartnerStage) && (riderLocation !== null || isPartnerStage);

  // Reset rider location if order is cancelled or delivered
  useEffect(() => {
    if (isTerminal) {
      setRiderLocation(null);
    }
  }, [isTerminal, orderId, orderNumber]);

  // 15-second heartbeat check: If rider is active and no GPS packet arrives for >15s, show unavailable message
  useEffect(() => {
    if (!hasActiveRider) {
      setIsLocationUnavailable(false);
      return;
    }

    const heartbeatTimer = setInterval(() => {
      const elapsed = Date.now() - lastLocationReceivedAt.current;
      if (elapsed > 15000) {
        setIsLocationUnavailable(true);
      }
    }, 2000);

    return () => clearInterval(heartbeatTimer);
  }, [hasActiveRider]);

  // 2. Establish Socket.IO real-time connection to NestJS Tracking Gateway
  useEffect(() => {
    if (!orderId && !orderNumber) return;

    let socket: Socket | null = null;
    try {
      socket = io(TRACKING_WS_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 8,
        timeout: 10000,
      });

      socket.on('connect', () => {
        setIsLiveConnected(true);
        const idsToJoin = new Set<string>();
        if (orderId) {
          const s = String(orderId);
          idsToJoin.add(s);
          idsToJoin.add(s.replace(/^#/, ''));
        }
        if (orderNumber) {
          const s = String(orderNumber);
          idsToJoin.add(s);
          idsToJoin.add(s.replace(/^#/, ''));
        }

        // Join customer tracking room for this specific order
        idsToJoin.forEach((id) => {
          socket?.emit('join_order_room', id);
          socket?.emit('join_order', { orderId: id });
        });
      });

      socket.on('disconnect', () => {
        setIsLiveConnected(false);
      });

      const handleLocationPayload = (data: any) => {
        if (isTerminal) return;

        // Ensure GPS payload belongs strictly to this order to avoid cross-order leakage
        const payloadOrderId = String(data?.orderId || data?.orderNumber || data?.cleanOrderId || '').replace(/^#/, '').trim().toLowerCase();
        const currentOrderId = String(orderId || '').replace(/^#/, '').trim().toLowerCase();
        const currentOrderNum = String(orderNumber || '').replace(/^#/, '').trim().toLowerCase();

        if (payloadOrderId) {
          const isMatch =
            (currentOrderId && (payloadOrderId === currentOrderId || currentOrderId.includes(payloadOrderId) || payloadOrderId.includes(currentOrderId))) ||
            (currentOrderNum && (payloadOrderId === currentOrderNum || currentOrderNum.includes(payloadOrderId) || payloadOrderId.includes(currentOrderNum)));

          if (!isMatch) {
            // Ignore telemetry packets meant for other active orders
            return;
          }
        }

        const lat = data?.lat ?? data?.latitude;
        const lng = data?.lng ?? data?.longitude;
        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          // Update Leaflet rider position smoothly
          setRiderLocation([lat, lng]);
          setLastUpdated(new Date());
          lastLocationReceivedAt.current = Date.now();
          setIsLiveConnected(true);
          setIsLocationUnavailable(false);
        }
      };

      // Listen for all location events emitted by backend and rider telemetry every 5s
      socket.on('rider_location_update', handleLocationPayload);
      socket.on('update_delivery_location', handleLocationPayload);
      socket.on('delivery.location.updated', handleLocationPayload);
      socket.on('rider_location', handleLocationPayload);
    } catch (err) {
      console.warn('[LiveTrackingMap] WebSocket initialization error:', err);
    }

    return () => {
      if (socket) {
        const idStr = String(orderId || orderNumber);
        socket.emit('leave_order', { orderId: idStr });
        socket.disconnect();
      }
    };
  }, [orderId, orderNumber]);

  // 3. Current Rider Position: Renders rider pin when assigned or at partner stage
  const currentRiderPos = useMemo<[number, number] | null>(() => {
    if (!hasActiveRider) return null;
    if (riderLocation) return riderLocation;

    // If rider is at store or heading to store, position rider at the dark store
    if (
      normalizedStatus === 'ARRIVED_AT_STORE' ||
      normalizedStatus === 'GOING_TO_STORE' ||
      normalizedStatus === 'ASSIGNED' ||
      normalizedStatus === 'ACCEPTED'
    ) {
      // Place near dark store with slight offset so both store and rider pins are clearly visible
      return [effectiveStore[0] + 0.0006, effectiveStore[1] + 0.0006];
    }

    // Only if rider is assigned and out for delivery without socket GPS packet yet
    const ratio = 0.58;
    const interpLat = effectiveStore[0] + (effectiveCustomer[0] - effectiveStore[0]) * ratio;
    const interpLng = effectiveStore[1] + (effectiveCustomer[1] - effectiveStore[1]) * ratio;
    return [interpLat, interpLng];
  }, [hasActiveRider, riderLocation, effectiveStore, effectiveCustomer, normalizedStatus]);

  // 4. Real Road Routing States (via OSRM Open Source Routing Engine)
  const [roadCoordinates, setRoadCoordinates] = useState<[number, number][]>([]);
  const [riderRoadCoordinates, setRiderRoadCoordinates] = useState<[number, number][]>([]);
  const [storeToRiderCoordinates, setStoreToRiderCoordinates] = useState<[number, number][]>([]);
  const [osrmDistanceKm, setOsrmDistanceKm] = useState<number | null>(null);
  const [osrmDurationMins, setOsrmDurationMins] = useState<number | null>(null);

  // Fetch real road route between Dark Store and Customer Home via OSRM
  useEffect(() => {
    let isMounted = true;
    fetchOsrmRoadRoute(effectiveStore, effectiveCustomer).then((result) => {
      if (!isMounted) return;
      if (result && result.coordinates.length > 0) {
        setRoadCoordinates(result.coordinates);
        if (!hasActiveRider) {
          setOsrmDistanceKm(result.distanceKm);
          setOsrmDurationMins(result.durationMins);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [effectiveStore[0], effectiveStore[1], effectiveCustomer[0], effectiveCustomer[1], hasActiveRider]);

  // Fetch real road route for active rider: (Rider -> Customer) and (Store -> Rider)
  useEffect(() => {
    if (!hasActiveRider || !currentRiderPos) {
      setRiderRoadCoordinates([]);
      setStoreToRiderCoordinates([]);
      return;
    }

    let isMounted = true;

    // Road route from Rider's current GPS position to Customer's home
    fetchOsrmRoadRoute(currentRiderPos, effectiveCustomer).then((result) => {
      if (!isMounted) return;
      if (result && result.coordinates.length > 0) {
        setRiderRoadCoordinates(result.coordinates);
        setOsrmDistanceKm(result.distanceKm);
        setOsrmDurationMins(result.durationMins);
      }
    });

    // Road route already traversed from Store to Rider
    fetchOsrmRoadRoute(effectiveStore, currentRiderPos).then((result) => {
      if (!isMounted) return;
      if (result && result.coordinates.length > 0) {
        setStoreToRiderCoordinates(result.coordinates);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [
    hasActiveRider,
    currentRiderPos?.[0],
    currentRiderPos?.[1],
    effectiveCustomer[0],
    effectiveCustomer[1],
    effectiveStore[0],
    effectiveStore[1],
  ]);

  // 5. Dynamic Distance & ETA Calculations (Prioritizes exact OSRM road distance)
  const { distanceKm, etaMinutes } = useMemo(() => {
    if (osrmDistanceKm !== null && osrmDurationMins !== null) {
      return {
        distanceKm: osrmDistanceKm,
        etaMinutes: osrmDurationMins + (hasActiveRider ? 1 : 2),
      };
    }

    try {
      const from = currentRiderPos
        ? L.latLng(currentRiderPos[0], currentRiderPos[1])
        : L.latLng(effectiveStore[0], effectiveStore[1]);
      const to = L.latLng(effectiveCustomer[0], effectiveCustomer[1]);
      const distMeters = from.distanceTo(to);
      const km = Math.max(0.2, parseFloat((distMeters / 1000).toFixed(1)));
      const mins = Math.max(2, Math.round((km / 22) * 60) + (hasActiveRider ? 2 : 4));
      return { distanceKm: km, etaMinutes: mins };
    } catch {
      return { distanceKm: 2.0, etaMinutes: 8 };
    }
  }, [osrmDistanceKm, osrmDurationMins, currentRiderPos, effectiveStore, effectiveCustomer, hasActiveRider]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '360px',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.18)',
        border: '1.5px solid #E2E8F0',
        background: '#F8FAFC',
      }}
    >
      {/* Real-time Map Container */}
      <MapContainer
        center={currentRiderPos || effectiveCustomer}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <MapController
          riderLoc={currentRiderPos}
          storeLoc={effectiveStore}
          customerLoc={effectiveCustomer}
          recenterTrigger={recenterCount}
          roadPoints={roadCoordinates}
        />

        {/* Free High-Performance OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* 1. Dark Store Marker */}
        <Marker position={effectiveStore} icon={createStoreIcon(storeName)}>
          <Popup>
            <div style={{ padding: '4px', fontSize: '12px' }}>
              <strong style={{ color: '#1E293B' }}>{storeName}</strong>
              <div style={{ color: '#64748B', fontSize: '11px', marginTop: '2px' }}>Order Picked & Packed</div>
            </div>
          </Popup>
        </Marker>

        {/* 2. Customer Home Marker */}
        <Marker position={effectiveCustomer} icon={createCustomerIcon()}>
          <Popup>
            <div style={{ padding: '4px', fontSize: '12px' }}>
              <strong style={{ color: '#065F46' }}>Your Delivery Address</strong>
              <div style={{ color: '#64748B', fontSize: '11px', marginTop: '2px' }}>{customerAddress}</div>
            </div>
          </Popup>
        </Marker>

        {/* 3. Rider Marker - ONLY RENDER IF RIDER IS LEGITIMATELY ASSIGNED */}
        {hasActiveRider && currentRiderPos && (
          <Marker position={currentRiderPos} icon={createRiderIcon(partnerName || 'Delivery Partner')}>
            <Popup>
              <div style={{ padding: '4px', fontSize: '12px' }}>
                <strong style={{ color: '#6D28D9' }}>{partnerName || 'Delivery Partner'}</strong>
                <div style={{ color: '#64748B', fontSize: '11px', marginTop: '2px' }}>
                  {status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' : 'Assigned to order'}
                </div>
                <div style={{ color: '#059669', fontWeight: 700, fontSize: '11px', marginTop: '4px' }}>
                  ETA: ~{etaMinutes} mins ({distanceKm} km)
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 4. REAL ROAD ROUTE POLYLINES (OSRM Routing Engine) */}
        {hasActiveRider && currentRiderPos ? (
          <>
            {/* Traversed Road Portion: Store -> Rider (Solid Purple Road) */}
            {storeToRiderCoordinates.length > 0 ? (
              <>
                <Polyline
                  positions={storeToRiderCoordinates}
                  color="#4C1D95"
                  weight={6}
                  opacity={0.25}
                />
                <Polyline
                  positions={storeToRiderCoordinates}
                  color="#7C3AED"
                  weight={4}
                  opacity={0.85}
                />
              </>
            ) : (
              <Polyline
                positions={[effectiveStore, currentRiderPos]}
                color="#7C3AED"
                weight={4}
                opacity={0.8}
              />
            )}

            {/* In-Transit Road Portion: Rider -> Customer (Vibrant Blue Dashed Road) */}
            {riderRoadCoordinates.length > 0 ? (
              <>
                <Polyline
                  positions={riderRoadCoordinates}
                  color="#1E3A8A"
                  weight={7}
                  opacity={0.22}
                />
                <Polyline
                  positions={riderRoadCoordinates}
                  color="#2563EB"
                  weight={4.5}
                  opacity={0.95}
                  dashArray="8, 10"
                />
              </>
            ) : (
              <Polyline
                positions={[currentRiderPos, effectiveCustomer]}
                color="#2563EB"
                weight={4}
                opacity={0.85}
                dashArray="8, 12"
              />
            )}
          </>
        ) : (
          /* When rider is not assigned yet: Real Road Route directly following Ahmedabad streets */
          roadCoordinates.length > 0 ? (
            <>
              {/* Road Casing Shadow */}
              <Polyline
                positions={roadCoordinates}
                color="#312E81"
                weight={6.5}
                opacity={0.22}
              />
              {/* Street-Following Transit Route */}
              <Polyline
                positions={roadCoordinates}
                color="#4F46E5"
                weight={4.2}
                opacity={0.92}
                dashArray="8, 10"
              />
            </>
          ) : (
            /* Fallback during initial load */
            <Polyline
              positions={[effectiveStore, effectiveCustomer]}
              color="#6366F1"
              weight={3.5}
              opacity={0.7}
              dashArray="6, 10"
            />
          )
        )}
      </MapContainer>

      {/* Top Floating Glassmorphism Status Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: isCancelled
              ? 'rgba(185, 28, 28, 0.92)'
              : 'rgba(15, 23, 42, 0.90)',
            backdropFilter: 'blur(8px)',
            border: isCancelled
              ? '1px solid rgba(254, 202, 202, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.16)',
            padding: '6px 14px',
            borderRadius: '24px',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto',
          }}
        >
          {isCancelled ? (
            <>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#EF4444',
                  boxShadow: '0 0 8px #EF4444',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: '#FEE2E2', letterSpacing: '0.4px', fontWeight: 800 }}>
                ORDER CANCELLED
              </span>
            </>
          ) : isDelivered ? (
            <>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: '#A7F3D0', letterSpacing: '0.4px', fontWeight: 800 }}>
                ORDER DELIVERED
              </span>
            </>
          ) : hasActiveRider ? (
            <>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isLiveConnected ? '#10B981' : '#F59E0B',
                  boxShadow: isLiveConnected
                    ? '0 0 10px #10B981, 0 0 4px #10B981'
                    : '0 0 8px #F59E0B',
                }}
              />
              <span style={{ letterSpacing: '0.4px' }}>
                {normalizedStatus === 'ARRIVED_AT_STORE'
                  ? 'PARTNER AT STORE'
                  : normalizedStatus === 'GOING_TO_STORE'
                  ? 'PARTNER HEADING TO STORE'
                  : isLiveConnected
                  ? 'LIVE GPS TRACKING'
                  : 'PARTNER ASSIGNED'}
              </span>
            </>
          ) : (
            <>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  boxShadow: '0 0 8px #F59E0B',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: '#FCD34D', letterSpacing: '0.4px' }}>
                ASSIGNING DELIVERY PARTNER...
              </span>
            </>
          )}
        </div>

        <div
          style={{
            background: isCancelled
              ? 'rgba(239, 68, 68, 0.92)'
              : isDelivered
              ? 'rgba(16, 185, 129, 0.92)'
              : hasActiveRider
              ? 'rgba(16, 185, 129, 0.92)'
              : 'rgba(99, 102, 241, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '6px 14px',
            borderRadius: '24px',
            color: '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
            pointerEvents: 'auto',
          }}
        >
          {isCancelled ? (
            <span>CANCELLED</span>
          ) : isDelivered ? (
            <span>COMPLETED</span>
          ) : (
            <>
              <Clock size={13} strokeWidth={2.5} />
              <span>{etaMinutes} MINS ({distanceKm} KM)</span>
            </>
          )}
        </div>
      </div>

      {/* Cancelled Status Banner */}
      {isCancelled && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(239, 68, 68, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(254, 202, 202, 0.4)',
            borderRadius: '20px',
            padding: '6px 16px',
            color: '#FFFFFF',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28)',
            pointerEvents: 'none',
          }}
        >
          <AlertTriangle size={13} color="#FCA5A5" />
          <span>Order has been cancelled • Delivery partner cancelled</span>
        </div>
      )}

      {/* 15-Second Fallback Banner: When rider GPS update is unavailable */}
      {!isCancelled && hasActiveRider && isLocationUnavailable && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(239, 68, 68, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(254, 202, 202, 0.4)',
            borderRadius: '20px',
            padding: '6px 16px',
            color: '#FFFFFF',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28)',
            pointerEvents: 'none',
          }}
        >
          <AlertTriangle size={13} color="#FCA5A5" />
          <span>Rider location unavailable • Connecting GPS...</span>
        </div>
      )}

      {/* Partner at Store Banner */}
      {!isCancelled && hasActiveRider && normalizedStatus === 'ARRIVED_AT_STORE' && !isLocationUnavailable && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '6px 16px',
            color: '#D1FAE5',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
          }}
        >
          <span>📦 Delivery partner arrived at store • Collecting your order</span>
        </div>
      )}

      {/* Searching State Banner when rider is not assigned yet */}
      {!isCancelled && !isDelivered && !hasActiveRider && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '20px',
            padding: '6px 16px',
            color: '#FEF3C7',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
          }}
        >
          <Loader2 size={13} className="animate-spin" color="#F59E0B" />
          <span>Assigning nearest delivery partner near store...</span>
        </div>
      )}

      {/* Floating Recenter Button */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => setRecenterCount((c) => c + 1)}
          title={hasActiveRider ? 'Recenter on Delivery Partner' : 'Center on Delivery Location'}
          style={{
            background: '#FFFFFF',
            color: hasActiveRider ? '#7C3AED' : '#2563EB',
            border: '1.5px solid #E2E8F0',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.78rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.16)',
            transition: 'transform 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Navigation size={15} color={hasActiveRider ? '#7C3AED' : '#2563EB'} strokeWidth={2.4} />
          <span>{hasActiveRider ? 'Recenter Rider' : 'Center Location'}</span>
        </button>
      </div>

      {/* Bottom Information Subtitle Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '14px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          padding: '5px 12px',
          borderRadius: '10px',
          fontSize: '0.72rem',
          color: '#475569',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <ShieldCheck size={13} color={isCancelled ? '#EF4444' : isLocationUnavailable ? '#EF4444' : '#16A34A'} />
        <span>
          {isCancelled
            ? 'Order Cancelled • Handover Inactive'
            : isDelivered
            ? 'Order Delivered Successfully'
            : hasActiveRider
            ? isLocationUnavailable
              ? `Partner: ${partnerName || 'Express Rider'} • Rider location unavailable (Reconnecting...)`
              : `Partner: ${partnerName || 'Express Rider'} • Live GPS Stream (${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`
            : `Real Road Navigation via OSRM • Contactless Handover`}
        </span>
      </div>

      {/* Smooth CSS Glide Animation for Leaflet Rider Pin (synced to 1s GPS updates) */}
      <style>{`
        .custom-rider-pin {
          transition: transform 0.95s cubic-bezier(0.2, 0.8, 0.4, 1) !important;
        }
      `}</style>
    </div>
  );
};

export default LiveTrackingMap;
