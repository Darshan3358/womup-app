import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

// Real-time Voice Speech Recognition Service for Worm Up App
// Supports Native Android/iOS via expo-speech-recognition and Web via HTML5 SpeechRecognition

export interface VoiceRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

let activeRecognition: any = null;
let nativeSubscriptions: Array<{ remove: () => void }> = [];

function cleanupNativeListeners() {
  nativeSubscriptions.forEach((sub) => {
    try {
      sub.remove();
    } catch (e) {}
  });
  nativeSubscriptions = [];
}

export const VoiceSearchService = {
  isSupported(): boolean {
    if (Platform.OS !== 'web') {
      try {
        return ExpoSpeechRecognitionModule?.isRecognitionAvailable() ?? true;
      } catch (e) {
        return true;
      }
    }
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  },

  start(callbacks: VoiceRecognitionCallbacks): boolean {
    if (Platform.OS !== 'web') {
      this.startNative(callbacks);
      return true;
    }
    return this.startWeb(callbacks);
  },

  async startNative(callbacks: VoiceRecognitionCallbacks): Promise<boolean> {
    try {
      cleanupNativeListeners();

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        callbacks.onError?.('Microphone permission was denied. Please allow microphone access in device settings.');
        return false;
      }

      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        callbacks.onError?.('Voice search is not available on this device. Please type your search.');
        return false;
      }

      nativeSubscriptions.push(
        ExpoSpeechRecognitionModule.addListener('start', () => {
          callbacks.onStart?.();
        })
      );

      nativeSubscriptions.push(
        ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
          const text = event.results?.[0]?.transcript || '';
          callbacks.onResult?.(text.trim(), event.isFinal ?? false);
        })
      );

      nativeSubscriptions.push(
        ExpoSpeechRecognitionModule.addListener('error', (event: any) => {
          cleanupNativeListeners();
          callbacks.onError?.(event.message || 'Speech recognition error. Please try again.');
        })
      );

      nativeSubscriptions.push(
        ExpoSpeechRecognitionModule.addListener('end', () => {
          cleanupNativeListeners();
          callbacks.onEnd?.();
        })
      );

      ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        maxAlternatives: 1,
      });

      return true;
    } catch (err: any) {
      cleanupNativeListeners();
      callbacks.onError?.(err?.message || 'Could not start voice search.');
      return false;
    }
  },

  startWeb(callbacks: VoiceRecognitionCallbacks): boolean {
    if (typeof window === 'undefined') {
      callbacks.onError?.('Speech recognition is not available in this environment.');
      return false;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      callbacks.onError?.('Speech recognition is not supported in this browser. Please type to search.');
      return false;
    }

    // Stop any previously running instance
    if (activeRecognition) {
      try {
        activeRecognition.abort();
      } catch (e) {}
      activeRecognition = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const userLang = typeof navigator !== 'undefined' ? navigator.language : 'en-IN';
      recognition.lang = userLang?.startsWith('en') ? 'en-IN' : userLang || 'en-IN';

      recognition.onstart = () => {
        callbacks.onStart?.();
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          transcript += item[0].transcript;
          if (item.isFinal) {
            isFinal = true;
          }
        }

        callbacks.onResult?.(transcript.trim(), isFinal);
      };

      recognition.onerror = (event: any) => {
        const error = event.error || 'Speech error';
        if (error === 'no-speech') {
          callbacks.onError?.('No speech detected. Please try again.');
        } else if (error === 'not-allowed') {
          callbacks.onError?.('Microphone permission denied. Please allow microphone access.');
        } else {
          callbacks.onError?.(`Speech recognition error: ${error}`);
        }
      };

      recognition.onend = () => {
        activeRecognition = null;
        callbacks.onEnd?.();
      };

      activeRecognition = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      callbacks.onError?.(err?.message || 'Could not start microphone.');
      return false;
    }
  },

  stop(): void {
    if (Platform.OS !== 'web') {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (e) {}
      cleanupNativeListeners();
    } else if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (e) {}
      activeRecognition = null;
    }
  },

  abort(): void {
    if (Platform.OS !== 'web') {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch (e) {}
      cleanupNativeListeners();
    } else if (activeRecognition) {
      try {
        activeRecognition.abort();
      } catch (e) {}
      activeRecognition = null;
    }
  },
};
