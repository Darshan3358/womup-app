import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  RiderProfile,
  DeliveryRequest,
  RiderTabKey,
  RiderSubScreenKey,
  DeliveryStepStatus,
  LocationCoordinates,
  SettlementSummary,
  RiderBankAccount,
  RiderVehicle,
  AuthScreenState,
} from '../types/rider.types';
import { RiderApiService } from '../services/riderApi';
import { LocationTrackerService, HubLocation, AHMEDABAD_HUBS } from '../services/locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

interface RiderContextType {
  // Auth & Onboarding State (R01 - R06)
  authStep: AuthScreenState;
  authPhone: string;
  authEmail: string;
  otpVerificationId: string | null;
  debugOtp: string | null;
  setAuthStep: (step: AuthScreenState) => void;
  checkSession: () => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  verifyOtpCode: (otp: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  registerNewRider: (data: {
    fullName?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    phone?: string;
    city: string;
    vehicleType: 'EV_SCOOTER' | 'BIKE' | 'BICYCLE';
    vehicleNumber: string;
    drivingLicenseNumber?: string;
    address?: string;
  }) => Promise<void>;
  // Rider Operational State (R07 - R29)
  profile: RiderProfile | null;
  isOnline: boolean;
  activeDelivery: DeliveryRequest | null;
  incomingJobOffer: DeliveryRequest | null;
  availableJobs: DeliveryRequest[];
  jobsError: string | null;
  setIncomingJobOffer: (offer: DeliveryRequest | null) => void;
  currentTab: RiderTabKey;
  subScreen: RiderSubScreenKey;
  currentLocation: LocationCoordinates | null;
  detectedHubName: string | null;
  detectedAddress: string | null;
  availableHubs: HubLocation[];
  detectLocation: () => Promise<void>;
  setSimulatedHub: (hub: HubLocation) => Promise<void>;
  clearSelectedHub: () => Promise<void>;
  settlementSummary: SettlementSummary | null;
  bankAccount: RiderBankAccount | null;
  vehicle: RiderVehicle | null;
  unreadCount: number;

  // Modals
  showNewRequestModal: boolean;
  showRejectModal: boolean;
  showOtpModal: boolean;
  showEmergencyModal: boolean;
  showPickupModal: boolean;
  showUnavailableModal: boolean;

  // Actions
  toggleDutyStatus: () => Promise<void>;
  setCurrentTab: (tab: RiderTabKey) => void;
  setSubScreen: (sub: RiderSubScreenKey) => void;
  acceptDelivery: (job?: DeliveryRequest) => Promise<void>;
  rejectDelivery: (reason: string) => Promise<void>;
  dismissJob: (jobId: string) => Promise<void>;
  advanceStep: (step: DeliveryStepStatus) => Promise<void>;
  pickupOrder: (code?: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  refreshDashboard: () => Promise<void>;
  refreshAvailableJobs: () => Promise<void>;
  fetchNewOrder: () => Promise<void>;
  updateProfile: (data: Partial<RiderProfile>) => Promise<void>;
  updateVehicle: (data: Partial<RiderVehicle>) => Promise<void>;
  updateBankAccount: (data: Partial<RiderBankAccount>) => Promise<void>;
  requestPayout: (amount: number) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;

  // Modal Setters
  setShowNewRequestModal: (show: boolean) => void;
  setShowRejectModal: (show: boolean) => void;
  setShowOtpModal: (show: boolean) => void;
  setShowEmergencyModal: (show: boolean) => void;
  setShowPickupModal: (show: boolean) => void;
  setShowUnavailableModal: (show: boolean) => void;
}

const RiderContext = createContext<RiderContextType | undefined>(undefined);

export const RiderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [authStep, setAuthStep] = useState<AuthScreenState>('SPLASH');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [otpVerificationId, setOtpVerificationId] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Operational State
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryRequest | null>(null);
  const [incomingJobOffer, setIncomingJobOffer] = useState<DeliveryRequest | null>(null);
  const [availableJobs, setAvailableJobs] = useState<DeliveryRequest[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<RiderTabKey>('Home');
  const [subScreen, setSubScreen] = useState<RiderSubScreenKey>('None');
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [detectedHubName, setDetectedHubName] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const availableHubs = AHMEDABAD_HUBS;
  const [settlementSummary, setSettlementSummary] = useState<SettlementSummary | null>(null);
  const [bankAccount, setBankAccount] = useState<RiderBankAccount | null>(null);
  const [vehicle, setVehicle] = useState<RiderVehicle | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(2);

  // Modal Visibility
  const [showNewRequestModal, setShowNewRequestModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [showPickupModal, setShowPickupModal] = useState<boolean>(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState<boolean>(false);

  const refreshAvailableJobs = useCallback(async () => {
    try {
      setJobsError(null);
      const jobs = await RiderApiService.fetchAvailableOrdersList();
      setAvailableJobs(jobs);
      if (jobs.length > 0) {
        setIncomingJobOffer(jobs[0]);
      } else {
        setIncomingJobOffer(null);
      }
    } catch (err: any) {
      setJobsError(err?.message || 'Failed to load available jobs. Please pull to refresh.');
    }
  }, []);

  const detectLocation = useCallback(async () => {
    try {
      const coords = await LocationTrackerService.detectRealGps();
      if (coords) {
        setCurrentLocation(coords);
        const nearest = LocationTrackerService.getNearestHub(coords.latitude, coords.longitude);
        setDetectedHubName(`${nearest.hub.name} (${nearest.distanceKm} km away)`);
        const addr = await LocationTrackerService.getAddressForCoords(coords.latitude, coords.longitude);
        setDetectedAddress(addr);
        await AsyncStorage.setItem('@womup_rider_selected_hub', JSON.stringify(nearest.hub));
      }
      await refreshAvailableJobs();
    } catch {
      // non-fatal
    }
  }, [refreshAvailableJobs]);

  const setSimulatedHub = useCallback(async (hub: HubLocation) => {
    try {
      const coords = await LocationTrackerService.setSimulatedLocation(hub.latitude, hub.longitude);
      setCurrentLocation(coords);
      setDetectedHubName(`${hub.name} (0.1 km away)`);
      setDetectedAddress(hub.address);
      await AsyncStorage.setItem('@womup_rider_selected_hub', JSON.stringify(hub));
      await refreshAvailableJobs();
    } catch {
      // non-fatal
    }
  }, [refreshAvailableJobs]);

  const clearSelectedHub = useCallback(async () => {
    try {
      LocationTrackerService.clearLocation();
      await AsyncStorage.removeItem('@womup_rider_selected_hub');
      setCurrentLocation(null);
      setDetectedHubName(null);
      setDetectedAddress(null);
      await refreshAvailableJobs();
    } catch {
      // non-fatal
    }
  }, [refreshAvailableJobs]);

  const refreshDashboard = useCallback(async () => {
    try {
      const userProfile = await RiderApiService.getProfile();
      setProfile(userProfile);
      setIsOnline(userProfile.isOnline);

      const currentOrder = await RiderApiService.getActiveDelivery();
      if (currentOrder && (currentOrder.orderNumber || currentOrder.id)) {
        setActiveDelivery(currentOrder);
      } else {
        await RiderApiService.clearActiveDelivery();
        setActiveDelivery(null);
      }

      const coords = LocationTrackerService.getCurrentCoordinates();
      if (coords) {
        setCurrentLocation(coords);
        const nearest = LocationTrackerService.getNearestHub(coords.latitude, coords.longitude);
        setDetectedHubName(`${nearest.hub.name} (${nearest.distanceKm} km away)`);
        const addr = await LocationTrackerService.getAddressForCoords(coords.latitude, coords.longitude);
        setDetectedAddress(addr);
      } else {
        const savedHubRaw = await AsyncStorage.getItem('@womup_rider_selected_hub');
        if (savedHubRaw) {
          try {
            const savedHub: HubLocation = JSON.parse(savedHubRaw);
            const simCoords = await LocationTrackerService.setSimulatedLocation(savedHub.latitude, savedHub.longitude);
            setCurrentLocation(simCoords);
            setDetectedHubName(`${savedHub.name} (0.1 km away)`);
            setDetectedAddress(savedHub.address);
          } catch {
            setDetectedHubName(null);
            setDetectedAddress(null);
            setCurrentLocation(null);
          }
        } else {
          setDetectedHubName(null);
          setDetectedAddress(null);
          setCurrentLocation(null);
        }
      }

      await refreshAvailableJobs();

      const sum = await RiderApiService.getSettlementSummary();
      setSettlementSummary(sum);

      const bank = await RiderApiService.getBankAccount();
      setBankAccount(bank);

      const veh = await RiderApiService.getVehicle();
      setVehicle(veh);

      const notifs = await RiderApiService.getNotifications();
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    } catch (e: any) {
      if (e?.message === 'NOT_AUTHENTICATED' || e?.message === 'SESSION_EXPIRED') {
        await logout();
      } else {
        console.warn('Failed to refresh dashboard data', e);
      }
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const hasToken = await RiderApiService.hasValidToken();
      if (!hasToken) {
        setAuthStep('LOGIN');
        return;
      }
      const { status, isApproved } = await RiderApiService.checkApprovalStatus();
      if (isApproved) {
        await refreshDashboard();
        setAuthStep('AUTHENTICATED');
      } else if (status === 'UNDER_REVIEW') {
        const userProfile = await RiderApiService.getProfile();
        setProfile(userProfile);
        setAuthStep('APPROVAL_PENDING');
      } else if (status === 'KYC_PENDING' || status === 'REGISTERED') {
        setAuthStep('KYC');
      } else {
        setAuthStep('LOGIN');
      }
    } catch {
      setAuthStep('LOGIN');
    }
  }, [refreshDashboard]);

  const requestOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    setAuthEmail(cleanEmail);
    const res = await RiderApiService.sendOtp(cleanEmail);
    if (res.verificationId) setOtpVerificationId(res.verificationId);
    if (res.debugOtp) setDebugOtp(res.debugOtp);
    setAuthStep('OTP');
  };

  const resendOtp = async () => {
    if (authEmail) {
      const res = await RiderApiService.sendOtp(authEmail);
      if (res.verificationId) setOtpVerificationId(res.verificationId);
      if (res.debugOtp) setDebugOtp(res.debugOtp);
    }
  };

  const verifyOtpCode = async (otp: string) => {
    const res = await RiderApiService.verifyOtp(authEmail, otp, otpVerificationId || undefined);
    if (res.isNewRider) {
      if (res.verificationId) setOtpVerificationId(res.verificationId);
      setAuthStep('REGISTER');
      return;
    }
    if (res.rider) {
      setProfile(res.rider);
      if (res.rider.phone) setAuthPhone(res.rider.phone);
      if (res.rider.status === 'APPROVED' || res.rider.status === 'ACTIVE') {
        await refreshDashboard();
        setAuthStep('AUTHENTICATED');
      } else if (res.rider.status === 'UNDER_REVIEW') {
        setAuthStep('APPROVAL_PENDING');
      } else if (res.rider.status === 'KYC_PENDING' || res.rider.status === 'REGISTERED') {
        setAuthStep('KYC');
      } else {
        await refreshDashboard();
        setAuthStep('AUTHENTICATED');
      }
    }
  };

  const registerNewRider = async (data: {
    fullName?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    phone?: string;
    city: string;
    vehicleType: 'EV_SCOOTER' | 'BIKE' | 'BICYCLE';
    vehicleNumber: string;
    drivingLicenseNumber?: string;
    address?: string;
  }) => {
    if (!otpVerificationId) {
      throw new Error('Verification session expired. Please verify your email again.');
    }
    const finalFullName = (data.fullName || data.name || '').trim();
    const finalPhone = (data.phoneNumber || data.phone || '').trim();

    const res = await RiderApiService.registerRider({
      verificationId: otpVerificationId,
      email: authEmail,
      fullName: finalFullName,
      phoneNumber: finalPhone,
      city: data.city,
      vehicleType: data.vehicleType,
      vehicleNumber: data.vehicleNumber,
      drivingLicenseNumber: data.drivingLicenseNumber,
      address: data.address,
    });

    setProfile(res.rider);
    setAuthPhone(res.rider.phone);
    await refreshDashboard();
    setAuthStep('AUTHENTICATED');
  };

  useEffect(() => {
    // Only check active delivery if authenticated with a real token
    (async () => {
      if (await RiderApiService.hasValidToken()) {
        const active = await RiderApiService.getActiveDelivery();
        if (!active) {
          await RiderApiService.clearActiveDelivery();
          setActiveDelivery(null);
        }
      } else {
        await RiderApiService.clearActiveDelivery();
        setActiveDelivery(null);
      }
    })();
  }, []);

  useEffect(() => {
    // Start GPS Telemetry only when authenticated and online
    if (authStep === 'AUTHENTICATED' && isOnline) {
      LocationTrackerService.startTracking(async (coords) => {
        setCurrentLocation(coords);
        const nearest = LocationTrackerService.getNearestHub(coords.latitude, coords.longitude);
        setDetectedHubName(`${nearest.hub.name} (${nearest.distanceKm} km away)`);
        const addr = await LocationTrackerService.getAddressForCoords(coords.latitude, coords.longitude);
        setDetectedAddress(addr);
      });
    } else {
      LocationTrackerService.stopTracking();
    }

    return () => {
      LocationTrackerService.stopTracking();
    };
  }, [authStep, isOnline]);

  const activeDeliveryRef = React.useRef<DeliveryRequest | null>(null);
  useEffect(() => {
    activeDeliveryRef.current = activeDelivery;
  }, [activeDelivery]);

  useEffect(() => {
    if (authStep !== 'AUTHENTICATED' || !isOnline) return;

    const socket = io('http://localhost:5050/tracking', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      refreshDashboard();
    });

    socket.on('reconnect', async () => {
      try {
        await refreshDashboard();
        const activeJob = await RiderApiService.getActiveDelivery();
        if (activeJob) {
          setActiveDelivery(activeJob);
        }
      } catch {
        // non-fatal
      }
    });

    socket.on('new_order', async () => {
      // Real-time order placed: update available jobs silently without blocking modal fatigue
      try {
        await refreshAvailableJobs();
      } catch {
        // ignore
      }
    });

    socket.on('order_status', async (data: any) => {
      const current = activeDeliveryRef.current;
      if (current && data?.orderId && (data.orderId === current.id || data.orderId === (current as any).orderId)) {
        if (data.status === 'DELIVERED') {
          setActiveDelivery(null);
          setIncomingJobOffer(null);
          await refreshDashboard();
        }
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [authStep, isOnline, refreshDashboard, refreshAvailableJobs]);

  const toggleDutyStatus = async () => {
    const nextStatus = !isOnline;
    await RiderApiService.updateDutyStatus(nextStatus);
    setIsOnline(nextStatus);
    if (profile) {
      setProfile({ ...profile, isOnline: nextStatus });
    }
  };

  const acceptDelivery = async (targetJob?: DeliveryRequest) => {
    const target = targetJob || incomingJobOffer || activeDelivery;
    if (target) {
      const updated = await RiderApiService.acceptDelivery(target.id);
      setActiveDelivery({ ...updated });
      setIncomingJobOffer(null);
      setAvailableJobs((prev) => prev.filter((j) => j.id !== target.id));
      setShowNewRequestModal(false);
      setCurrentTab('Deliveries');
    }
  };

  const rejectDelivery = async (reason: string) => {
    const target = incomingJobOffer || activeDelivery;
    if (target) {
      await RiderApiService.rejectDelivery(target.id, reason);
      setActiveDelivery(null);
      setIncomingJobOffer(null);
      setAvailableJobs((prev) => prev.filter((j) => j.id !== target.id));
      setShowRejectModal(false);
      setShowNewRequestModal(false);
      await refreshAvailableJobs();
    }
  };

  const dismissJob = async (jobId: string) => {
    try {
      await RiderApiService.rejectDelivery(jobId, 'Dismissed from Job Board');
      setAvailableJobs((prev) => prev.filter((j) => j.id !== jobId && (j as any).orderId !== jobId));
      if (incomingJobOffer?.id === jobId || (incomingJobOffer as any)?.orderId === jobId) {
        setIncomingJobOffer(null);
      }
      await refreshAvailableJobs();
    } catch {
      // ignore
    }
  };

  const advanceStep = async (step: DeliveryStepStatus) => {
    if (activeDelivery) {
      const updated = await RiderApiService.updateDeliveryStep(activeDelivery.id, step);
      setActiveDelivery({ ...updated });
    }
  };

  const pickupOrder = async (code?: string) => {
    if (activeDelivery) {
      const updated = await RiderApiService.pickupOrder(activeDelivery.id, code);
      setActiveDelivery({ ...updated });
      setShowPickupModal(false);
    }
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    if (activeDelivery) {
      const success = await RiderApiService.verifyDeliveryOtp(activeDelivery.id, otp);
      if (success) {
        setActiveDelivery(null);
        setShowOtpModal(false);
        if (profile) {
          setProfile({
            ...profile,
            completedDeliveries: profile.completedDeliveries + 1,
          });
        }
        // Refresh settlement metrics
        const sum = await RiderApiService.getSettlementSummary();
        setSettlementSummary(sum);
      }
      return success;
    }
    return false;
  };

  const fetchNewOrder = async () => {
    const newOffer = await RiderApiService.fetchAvailableOrders();
    if (newOffer) {
      setIncomingJobOffer(newOffer);
      setShowNewRequestModal(true);
    } else {
      setIncomingJobOffer(null);
      Alert.alert(
        'No New Order Dispatch',
        'There are currently no real unassigned orders waiting for delivery. When a customer places an order, it will appear here instantly.'
      );
    }
  };

  const updateProfile = async (data: Partial<RiderProfile>) => {
    const updated = await RiderApiService.updateProfile(data);
    setProfile(updated);
  };

  const updateVehicle = async (data: Partial<RiderVehicle>) => {
    const updated = await RiderApiService.updateVehicle(data);
    setVehicle(updated);
    if (profile && data.vehicleNumber) {
      setProfile({ ...profile, vehicleNumber: data.vehicleNumber });
    }
  };

  const updateBankAccount = async (data: Partial<RiderBankAccount>) => {
    const updated = await RiderApiService.updateBankAccount(data);
    setBankAccount(updated);
  };

  const requestPayout = async (amount: number) => {
    const res = await RiderApiService.requestPayout(amount);
    const sum = await RiderApiService.getSettlementSummary();
    setSettlementSummary(sum);
    return res;
  };

  const logout = async () => {
    LocationTrackerService.stopTracking();
    await RiderApiService.logout();
    setProfile(null);
    setActiveDelivery(null);
    setIsOnline(false);
    setCurrentTab('Home');
    setSubScreen('None');
    setAuthStep('LOGIN');
  };

  return (
    <RiderContext.Provider
      value={{
        authStep,
        authPhone,
        authEmail,
        otpVerificationId,
        debugOtp,
        setAuthStep,
        checkSession,
        requestOtp,
        verifyOtpCode,
        resendOtp,
        registerNewRider,
        profile,
        isOnline,
        activeDelivery,
        incomingJobOffer,
        availableJobs,
        jobsError,
        setIncomingJobOffer,
        currentTab,
        subScreen,
        currentLocation,
        detectedHubName,
        detectedAddress,
        availableHubs,
        detectLocation,
        setSimulatedHub,
        clearSelectedHub,
        settlementSummary,
        bankAccount,
        vehicle,
        unreadCount,
        showNewRequestModal,
        showRejectModal,
        showOtpModal,
        showEmergencyModal,
        showPickupModal,
        showUnavailableModal,
        toggleDutyStatus,
        setCurrentTab,
        setSubScreen,
        acceptDelivery,
        rejectDelivery,
        dismissJob,
        advanceStep,
        pickupOrder,
        verifyOtp,
        refreshDashboard,
        refreshAvailableJobs,
        fetchNewOrder,
        updateProfile,
        updateVehicle,
        updateBankAccount,
        requestPayout,
        logout,
        setShowNewRequestModal,
        setShowRejectModal,
        setShowOtpModal,
        setShowEmergencyModal,
        setShowPickupModal,
        setShowUnavailableModal,
      }}
    >
      {children}
    </RiderContext.Provider>
  );
};

export const useRider = (): RiderContextType => {
  const context = useContext(RiderContext);
  if (!context) {
    throw new Error('useRider must be used within a RiderProvider');
  }
  return context;
};
