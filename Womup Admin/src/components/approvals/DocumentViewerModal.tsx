import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { ApprovalDocument } from '../../services/approvalService';

interface DocumentViewerModalProps {
  visible: boolean;
  documents: ApprovalDocument[];
  initialIndex?: number;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  visible,
  documents,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // Sync index on open
  React.useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomScale(1);
    setRotationDegrees(0);
  }, [initialIndex, visible]);

  if (!visible || !documents || documents.length === 0) return null;

  const currentDoc = documents[currentIndex] || documents[0];

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setRotationDegrees(0);
  };

  const handleRotate = () => {
    setRotationDegrees((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (currentDoc?.url) {
      if (Platform.OS === 'web') {
        window.open(currentDoc.url, '_blank');
      } else {
        Linking.openURL(currentDoc.url);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoomScale(1);
      setRotationDegrees(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoomScale(1);
      setRotationDegrees(0);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{currentDoc.label || 'Document Preview'}</Text>
            <Text style={styles.counterText}>
              {currentIndex + 1} of {documents.length}
            </Text>
          </View>

          {/* Action Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolBtn} onPress={handleZoomOut} accessibilityLabel="Zoom Out">
              <ZoomOut size={18} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleResetZoom} accessibilityLabel="Reset">
              <Text style={styles.scaleText}>{Math.round(zoomScale * 100)}%</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleZoomIn} accessibilityLabel="Zoom In">
              <ZoomIn size={18} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleRotate} accessibilityLabel="Rotate">
              <RotateCw size={18} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleDownload} accessibilityLabel="Download/Open">
              <Download size={18} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toolBtn, styles.closeBtn]} onPress={onClose}>
              <X size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Viewer Canvas */}
        <View style={styles.canvas}>
          {documents.length > 1 && (
            <TouchableOpacity
              style={[styles.navArrow, styles.navLeft, currentIndex === 0 && styles.navDisabled]}
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={28} color={currentIndex === 0 ? '#475569' : COLORS.white} />
            </TouchableOpacity>
          )}

          <ScrollView
            contentContainerStyle={styles.scrollCanvas}
            maximumZoomScale={4}
            minimumZoomScale={0.5}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {currentDoc.type === 'pdf' || (currentDoc.url && currentDoc.url.toLowerCase().endsWith('.pdf')) ? (
              <View style={styles.pdfCard}>
                <FileText size={64} color={COLORS.purple} />
                <Text style={styles.pdfName}>{currentDoc.label}</Text>
                <TouchableOpacity style={styles.openPdfBtn} onPress={handleDownload}>
                  <Text style={styles.openPdfBtnText}>Open PDF in New Tab</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Image
                source={{ uri: currentDoc.url }}
                style={[
                  styles.imagePreview,
                  {
                    transform: [
                      { scale: zoomScale },
                      { rotate: `${rotationDegrees}deg` },
                    ],
                  },
                ]}
                resizeMode="contain"
              />
            )}
          </ScrollView>

          {documents.length > 1 && (
            <TouchableOpacity
              style={[
                styles.navArrow,
                styles.navRight,
                currentIndex === documents.length - 1 && styles.navDisabled,
              ]}
              onPress={handleNext}
              disabled={currentIndex === documents.length - 1}
            >
              <ChevronRight
                size={28}
                color={currentIndex === documents.length - 1 ? '#475569' : COLORS.white}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Thumbnail Strip */}
        {documents.length > 1 && (
          <View style={styles.thumbStrip}>
            {documents.map((doc, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={doc.id || idx}
                  style={[styles.thumbItem, isSelected && styles.thumbItemActive]}
                  onPress={() => {
                    setCurrentIndex(idx);
                    setZoomScale(1);
                    setRotationDegrees(0);
                  }}
                >
                  <Image source={{ uri: doc.url }} style={styles.thumbImage} resizeMode="cover" />
                  <Text style={[styles.thumbLabel, isSelected && styles.thumbLabelActive]} numberOfLines={1}>
                    {doc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  counterText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    padding: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#334155',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  closeBtn: {
    backgroundColor: '#EF4444',
    marginLeft: 6,
  },
  canvas: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollCanvas: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  imagePreview: {
    width: Platform.OS === 'web' ? 700 : 340,
    height: Platform.OS === 'web' ? 520 : 420,
    borderRadius: RADIUS.md,
  },
  pdfCard: {
    backgroundColor: '#1E293B',
    padding: 32,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pdfName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 16,
    marginBottom: 20,
  },
  openPdfBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  openPdfBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navLeft: {
    left: 16,
  },
  navRight: {
    right: 16,
  },
  navDisabled: {
    opacity: 0.3,
  },
  thumbStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  thumbItem: {
    padding: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    width: 80,
  },
  thumbItemActive: {
    borderColor: '#3B82F6',
  },
  thumbImage: {
    width: 72,
    height: 48,
    borderRadius: RADIUS.xs,
    backgroundColor: '#0F172A',
  },
  thumbLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  thumbLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
