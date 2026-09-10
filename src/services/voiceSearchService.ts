// Real-time Voice Speech Recognition Service for Worm Up App
// Powered by HTML5 Web Speech API (window.SpeechRecognition / window.webkitSpeechRecognition)

export interface VoiceRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

let activeRecognition: any = null;

export const VoiceSearchService = {
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  },

  start(callbacks: VoiceRecognitionCallbacks): boolean {
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
      } catch (e) {
        // ignore
      }
      activeRecognition = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true; // Enables REAL-TIME search updates as you speak!
      recognition.maxAlternatives = 1;

      // Prefer Indian English (for grocery products like Atta, Ghee, Paneer, etc.)
      const userLang = typeof navigator !== 'undefined' ? navigator.language : 'en-IN';
      recognition.lang = userLang.startsWith('en') ? 'en-IN' : userLang;

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
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (e) {
        // ignore
      }
      activeRecognition = null;
    }
  },

  abort(): void {
    if (activeRecognition) {
      try {
        activeRecognition.abort();
      } catch (e) {
        // ignore
      }
      activeRecognition = null;
    }
  },
};
