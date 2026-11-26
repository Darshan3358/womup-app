import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Updates from 'expo-updates';

export type OtaCheckStatus =
  | 'updated'
  | 'up-to-date'
  | 'unsupported'
  | 'error';

export interface OtaContextValue {
  isOtaSupported: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  downloadProgress?: number;
  channel: string;
  runtimeVersion: string;
  updateId: string | null;
  isEmbeddedLaunch: boolean;
  lastCheckedAt: Date | null;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  checkAndDownloadUpdate: (options?: { manual?: boolean }) => Promise<OtaCheckStatus>;
  applyUpdate: () => Promise<void>;
}

const AUTO_CHECK_COOLDOWN_MS = 5 * 60 * 1000;

const OtaContext = createContext<OtaContextValue | undefined>(undefined);

/**
 * Manages Expo Updates (OTA) lifecycle across cold start, foreground AppState resume,
 * and manual update checks for production and preview native builds.
 */
export const OtaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const updates = Updates.useUpdates();
  const [manualChecking, setManualChecking] = useState(false);
  const [manualDownloading, setManualDownloading] = useState(false);
  const [downloadedLocally, setDownloadedLocally] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const inFlightRef = useRef(false);
  const lastCheckTsRef = useRef<number>(0);
  const prevPendingRef = useRef<boolean>(false);

  const isOtaSupported = Platform.OS !== 'web' && !__DEV__ && Updates.isEnabled;
  const isUpdatePending = Boolean(updates.isUpdatePending || downloadedLocally);

  // Re-open the update banner whenever native state transitions to pending
  useEffect(() => {
    if (isUpdatePending && !prevPendingRef.current) {
      setIsBannerDismissed(false);
    }
    prevPendingRef.current = isUpdatePending;
  }, [isUpdatePending]);

  const checkAndDownloadUpdate = useCallback(
    async (options?: { manual?: boolean }): Promise<OtaCheckStatus> => {
      const manual = Boolean(options?.manual);
      if (!isOtaSupported) {
        return 'unsupported';
      }
      if (inFlightRef.current) {
        return 'up-to-date';
      }
      const now = Date.now();
      if (!manual && now - lastCheckTsRef.current < AUTO_CHECK_COOLDOWN_MS) {
        return 'up-to-date';
      }

      inFlightRef.current = true;
      lastCheckTsRef.current = now;
      setLastCheckedAt(new Date(now));
      if (manual) setManualChecking(true);

      try {
        const checkResult = await Updates.checkForUpdateAsync();
        if (!checkResult.isAvailable) {
          return 'up-to-date';
        }

        if (manual) setManualChecking(false);
        setManualDownloading(true);

        const fetchResult = await Updates.fetchUpdateAsync();
        if (fetchResult.isNew) {
          setDownloadedLocally(true);
          setIsBannerDismissed(false);
          return 'updated';
        }
        return 'up-to-date';
      } catch {
        return 'error';
      } finally {
        inFlightRef.current = false;
        setManualChecking(false);
        setManualDownloading(false);
      }
    },
    [isOtaSupported]
  );

  const applyUpdate = useCallback(async () => {
    if (!isOtaSupported) return;
    try {
      await Updates.reloadAsync();
    } catch {
      // Reload errors only happen if the runtime cannot be restarted cleanly
    }
  }, [isOtaSupported]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
  }, []);

  // Cold start + foreground resume OTA checks (throttled by cooldown)
  useEffect(() => {
    if (!isOtaSupported) return;

    checkAndDownloadUpdate({ manual: false });

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkAndDownloadUpdate({ manual: false });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isOtaSupported, checkAndDownloadUpdate]);

  const resolvedChannel =
    updates.currentlyRunning.channel ||
    Updates.channel ||
    (Platform.OS === 'web' ? 'web' : __DEV__ ? 'development' : 'production');
  const resolvedRuntimeVersion =
    updates.currentlyRunning.runtimeVersion || Updates.runtimeVersion || '1.0.0';
  const resolvedUpdateId = updates.currentlyRunning.updateId || Updates.updateId || null;

  const value: OtaContextValue = {
    isOtaSupported,
    isChecking: Boolean(updates.isChecking || manualChecking),
    isDownloading: Boolean(updates.isDownloading || manualDownloading),
    isUpdateAvailable: Boolean(updates.isUpdateAvailable),
    isUpdatePending,
    downloadProgress: updates.downloadProgress,
    channel: resolvedChannel,
    runtimeVersion: resolvedRuntimeVersion,
    updateId: resolvedUpdateId,
    isEmbeddedLaunch: updates.currentlyRunning.isEmbeddedLaunch,
    lastCheckedAt,
    isBannerDismissed,
    dismissBanner,
    checkAndDownloadUpdate,
    applyUpdate,
  };

  return <OtaContext.Provider value={value}>{children}</OtaContext.Provider>;
};

/**
 * Returns live Expo Updates (OTA) state, build metadata, and check/apply actions.
 */
export const useOta = (): OtaContextValue => {
  const ctx = useContext(OtaContext);
  if (!ctx) {
    throw new Error('useOta must be used within an OtaProvider');
  }
  return ctx;
};
