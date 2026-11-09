import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, ArrowRight } from 'lucide-react-native';
import Svg, { Circle, G, Path, Rect, Line } from 'react-native-svg';

export interface ZoneShareItem {
  name: string;
  percentage: number;
  color: string;
}

interface ZoneGmvShareCardProps {
  shares?: ZoneShareItem[];
  onViewAll?: () => void;
}

export const ZoneGmvShareCard: React.FC<ZoneGmvShareCardProps> = ({
  shares = [
    { name: 'Ahmedabad', percentage: 0, color: '#762DEB' },
    { name: 'Surat', percentage: 0, color: '#268BFA' },
    { name: 'Vadodara', percentage: 10, color: '#FF922E' },
  ],
  onViewAll,
}) => {
  // Use real data items
  const items = shares.length > 0 ? shares : [
    { name: 'Ahmedabad', percentage: 0, color: '#762DEB' },
    { name: 'Surat', percentage: 0, color: '#268BFA' },
    { name: 'Vadodara', percentage: 0, color: '#FF922E' },
  ];

  const topArea = items[0] || { name: 'Ahmedabad', percentage: 78 };

  // Calculate donut circumference
  const radius = 42;
  const strokeWidth = 13;
  const circumference = 2 * Math.PI * radius;

  // Compute dash arrays for 3 segments
  let accumulatedPercent = 0;
  const segments = items.slice(0, 3).map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={styles.pinIconCircle}>
            <MapPin size={17} color="#762DEB" strokeWidth={2.4} />
          </View>
          <Text style={styles.titleText}>Zone GMV Share</Text>
        </View>

        {onViewAll && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={14} color="#762DEB" strokeWidth={2.4} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Row: Donut Chart on Left, Legend on Right */}
      <View style={styles.bodyRow}>
        {/* Donut Chart */}
        <View style={styles.chartCol}>
          <Svg width={110} height={110} viewBox="0 0 110 110">
            {/* Background circular track */}
            <Circle
              cx="55"
              cy="55"
              r={radius}
              stroke="#F0E9FF"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Rotated group to start from 12 o'clock */}
            <G transform="rotate(-90 55 55)">
              {segments.map((seg, idx) => (
                <Circle
                  key={idx}
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
            </G>
          </Svg>

          {/* Center text inside donut */}
          <View style={styles.donutCenter} pointerEvents="none">
            <Text style={styles.centerPercent}>{topArea.percentage}%</Text>
            <Text style={styles.centerSubText}>Top Area</Text>
          </View>
        </View>

        {/* Legend List */}
        <View style={styles.legendCol}>
          {items.slice(0, 3).map((item, idx) => (
            <View key={idx} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.legendPercent}>{item.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Ahmedabad architectural heritage skyline in bottom-right corner */}
      <View style={styles.skylineWrapper} pointerEvents="none">
        <Image
          source={require('../../../assets/building.png')}
          style={styles.skylineImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: '#E7D9FF',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#762DEB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0E9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    color: '#111044',
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    color: '#762DEB',
    fontSize: 13,
    fontWeight: '700',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  chartCol: {
    width: 110,
    height: 110,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPercent: {
    color: '#111044',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  centerSubText: {
    color: '#565477',
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  legendCol: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 9,
  },
  legendName: {
    flex: 1,
    color: '#111044',
    fontSize: 13,
    fontWeight: '600',
  },
  legendPercent: {
    color: '#111044',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  skylineWrapper: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  skylineImage: {
    width: 170,
    height: 67,
    opacity: 0.9,
  },
});
