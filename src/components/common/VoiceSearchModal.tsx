import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { VoiceSearchService } from '../../services/voiceSearchService';

interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onResult: (transcript: string) => void;
  initialQuery?: string;
}

const SAMPLE_VOICE_PROMPTS = ['Amul Milk', 'Fortune Oil', 'Basmati Rice', 'Aashirvaad Atta', 'Maggi Noodles', 'Tea'];

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  visible,
  onClose,
  onResult,
  initialQuery = '',
}) => {
  const [transcript, setTranscript] = useState(initialQuery);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pulse animations for microphone ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(12)).current;
  const wave2 = useRef(new Animated.Value(24)).current;
  const wave3 = useRef(new Animated.Value(18)).current;
  const wave4 = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      setTranscript('');
      setErrorMessage(null);
      startListening();

      // Start looping animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Sound wave bars animation
      const animateWave = (anim: Animated.Value, minH: number, maxH: number, duration: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: maxH,
              duration,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: minH,
              duration,
              useNativeDriver: false,
            }),
          ])
        );
      };

      const w1 = animateWave(wave1, 10, 38, 320);
      const w2 = animateWave(wave2, 14, 46, 280);
      const w3 = animateWave(wave3, 8, 34, 350);
      const w4 = animateWave(wave4, 12, 42, 300);

      w1.start();
      w2.start();
      w3.start();
      w4.start();

      return () => {
        w1.stop();
        w2.stop();
        w3.stop();
        w4.stop();
        VoiceSearchService.abort();
      };
    } else {
      VoiceSearchService.abort();
    }
  }, [visible]);

  const startListening = () => {
    setErrorMessage(null);
    setIsListening(true);

    const started = VoiceSearchService.start({
      onStart: () => {
        setIsListening(true);
        setErrorMessage(null);
      },
      onResult: (spokenText, isFinal) => {
        setTranscript(spokenText);
        // Real-time callback so search results update dynamically!
        onResult(spokenText);

        if (isFinal && spokenText.trim().length > 0) {
          setTimeout(() => {
            onClose();
          }, 700);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setErrorMessage(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started) {
      setIsListening(false);
    }
  };

  const handlePromptSelect = (text: string) => {
    setTranscript(text);
    onResult(text);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Close button top right */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Close voice search"
          >
            <Ionicons name="close" size={22} color={COLORS.navy} />
          </TouchableOpacity>

          {/* Heading */}
          <Text style={[TYPOGRAPHY.headingMd, styles.heading]}>
            {isListening ? 'Listening...' : 'Tap to Speak'}
          </Text>
          <Text style={[TYPOGRAPHY.bodySm, styles.subheading]}>
            {isListening
              ? 'Say a product name, brand, or category'
              : errorMessage || 'Speak clearly into your microphone'}
          </Text>

          {/* Live Transcript Display with Real-time indicator */}
          <View style={styles.transcriptBox}>
            {transcript ? (
              <Text style={styles.transcriptText}>"{transcript}"</Text>
            ) : (
              <Text style={styles.placeholderText}>
                {isListening ? 'Listening for your voice...' : 'Waiting for input'}
              </Text>
            )}
          </View>

          {/* Animated Waveform Visualizer */}
          {isListening && (
            <View style={styles.waveRow}>
              <Animated.View style={[styles.waveBar, { height: wave1 }]} />
              <Animated.View style={[styles.waveBar, { height: wave2 }]} />
              <Animated.View style={[styles.waveBar, { height: wave3 }]} />
              <Animated.View style={[styles.waveBar, { height: wave4 }]} />
              <Animated.View style={[styles.waveBar, { height: wave2 }]} />
              <Animated.View style={[styles.waveBar, { height: wave1 }]} />
            </View>
          )}

          {/* Pulsing Glowing Microphone Button */}
          <View style={styles.micWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: isListening ? 0.35 : 0.1,
                },
              ]}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={isListening ? () => VoiceSearchService.stop() : startListening}
              style={styles.micCircleBtn}
            >
              <LinearGradient
                colors={isListening ? GRADIENTS.primary : [COLORS.navy, '#1E1B4B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.micGradient}
              >
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={38}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick Speak Chips */}
          <Text style={styles.suggestionTitle}>Or tap a popular search:</Text>
          <View style={styles.chipsContainer}>
            {SAMPLE_VOICE_PROMPTS.map((item) => (
              <TouchableOpacity
                key={item}
                activeOpacity={0.75}
                onPress={() => handlePromptSelect(item)}
                style={styles.chip}
              >
                <Ionicons name="sparkles-outline" size={14} color={COLORS.hotPink} style={{ marginRight: 4 }} />
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: COLORS.navy,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheading: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  transcriptBox: {
    minHeight: 52,
    width: '100%',
    backgroundColor: '#F8F6FE',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(131, 100, 230, 0.25)',
    marginBottom: 16,
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.hotPink,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.secondaryText,
    fontStyle: 'italic',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    marginBottom: 12,
  },
  waveBar: {
    width: 5,
    backgroundColor: COLORS.hotPink,
    borderRadius: 3,
  },
  micWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.hotPink,
  },
  micCircleBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: COLORS.hotPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  micGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(131, 100, 230, 0.2)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
  },
});
