import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { resolveImageUrl } from '../../utils/imageUrl';
import { FileText, AlertTriangle, Maximize2, RefreshCw } from 'lucide-react-native';

interface SafeDocImageProps {
  url?: string | null;
  title?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  onPress?: () => void;
  showZoomIcon?: boolean;
}

export const SafeDocImage: React.FC<SafeDocImageProps> = ({
  url,
  title,
  style,
  containerStyle,
  resizeMode = 'cover',
  onPress,
  showZoomIcon = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = url ? resolveImageUrl(url) : '';

  if (!url || !resolvedUrl) {
    return (
      <View style={[styles.placeholderBox, containerStyle]}>
        <FileText size={22} color="#64748B" />
        <Text style={styles.placeholderTitle}>No Document</Text>
        <Text style={styles.placeholderSub}>Not uploaded yet</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.placeholderBox, styles.errorBox, containerStyle]}>
        <AlertTriangle size={22} color="#F59E0B" />
        <Text style={styles.errorTitle}>File Not Found</Text>
        <Text style={styles.errorSub} numberOfLines={2}>
          Storage reset or missing on server
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => setHasError(false)}
          activeOpacity={0.7}
        >
          <RefreshCw size={11} color="#3B82F6" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const content = (
    <View style={[styles.wrapper, containerStyle]}>
      <Image
        source={{ uri: resolvedUrl }}
        style={[styles.image, style]}
        resizeMode={resizeMode}
        onError={() => setHasError(true)}
      />
      {showZoomIcon && (
        <View style={styles.zoomOverlay}>
          <Maximize2 size={13} color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  zoomOverlay: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 4,
    padding: 4,
  },
  placeholderBox: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 4,
  },
  placeholderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  placeholderSub: {
    fontSize: 9,
    color: '#64748B',
  },
  errorBox: {
    borderColor: '#78350F',
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
  },
  errorTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 2,
  },
  errorSub: {
    fontSize: 9,
    color: '#D97706',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  retryText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
});
