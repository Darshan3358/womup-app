import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/context/ToastContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// Lock web viewport to 100vw and prevent any horizontal scroll overflow
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'womup-viewport-lock';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      html, body {
        width: 100% !important;
        height: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        position: relative !important;
      }
      #root {
        width: 100% !important;
        height: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
        display: flex !important;
        flex-direction: column !important;
      }
      /* Enable smooth scrolling and prevent scroll locking across all screens */
      .r-overflowY-136oiwf {
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior-y: contain !important;
        touch-action: pan-y !important;
      }
      * {
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
  }
}

import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import * as Updates from 'expo-updates';

export default function App() {
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', '/');
      } catch (e) {}
    } else {
      // On native iOS / Android, check for OTA updates and apply automatically
      (async () => {
        try {
          if (!__DEV__) {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            }
          }
        } catch (e) {
          // Ignore offline / dev mode errors
        }
      })();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <NotificationProvider>
                <RootNavigator />
                <StatusBar style="dark" />
              </NotificationProvider>
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

