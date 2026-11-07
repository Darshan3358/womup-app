import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SparklineProps {
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  data?: number[];
}

export const Sparkline: React.FC<SparklineProps> = ({
  color,
  width = 64,
  height = 24,
  strokeWidth = 2.2,
  data,
}) => {
  // Generate smooth cubic bezier curve
  // Default aesthetically pleasing organic wave matching reference
  const pathD = `M 2 16 C 16 22, 28 4, 40 14 C 48 20, 54 8, 62 10`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 64 24" fill="none">
        <Path
          d={pathD}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
