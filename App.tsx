import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// Lock web viewport to 100vw and prevent any horizontal scroll overflow
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'womup-viewport-lock';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      html, body, #root {
        width: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        position: relative !important;
      }
      * {
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function App() {
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', '/');
      } catch (e) {}
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </AppProvider>
    </SafeAreaProvider>
  );
}

