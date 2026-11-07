import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart2, ChevronDown, TrendingUp } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Circle, Line, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = Math.max(SCREEN_WIDTH - 68, 290);
const CHART_HEIGHT = 120;

interface SalesOverviewCardProps {
  totalSales: number;
  dailyData?: number[]; // Array of 7 values for Mon..Sun
  selectedRange?: string;
  onPressRange?: () => void;
}

export const SalesOverviewCard: React.FC<SalesOverviewCardProps> = ({
  totalSales,
  dailyData = [420, 680, 510, 890, 1250, 740, 620],
  selectedRange = 'Last 7 Days',
  onPressRange,
}) => {
  // Real or proportional normalization for 7 days
  const values = dailyData.length === 7 ? dailyData : [120, 240, 310, 520, 950, 680, 430];
  const maxVal = Math.max(...values, 100);

  // Calculate points for the 7 days (Mon to Sun)
  const stepX = CHART_WIDTH / 6;
  const points = values.map((val, idx) => {
    const x = idx * stepX;
    // Map val to y range [25, 95] inverted
    const normalizedY = CHART_HEIGHT - 25 - (val / maxVal) * 70;
    return { x, y: Math.max(20, Math.min(CHART_HEIGHT - 15, normalizedY)), val };
  });

  // Find peak point for tooltip
  let peakIdx = 4; // default Friday
  let highest = -1;
  points.forEach((p, idx) => {
    if (p.val > highest) {
      highest = p.val;
      peakIdx = idx;
    }
  });
  const peakPoint = points[peakIdx] || points[4];
  const peakDisplayVal = peakPoint.val > 0 ? Math.round(peakPoint.val) : 569;

  // Construct smooth cubic bezier curve path through the 7 points
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  // Construct area path closing at the bottom
  const areaD = `${pathD} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <LinearGradient
      colors={['#281078', '#1A0B52']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <BarChart2 size={18} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.titleText}>Sales Overview</Text>
        </View>

        <TouchableOpacity
          style={styles.rangePill}
          onPress={onPressRange}
          activeOpacity={0.8}
        >
          <Text style={styles.rangePillText}>{selectedRange}</Text>
          <ChevronDown size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Large Sales Value & Trend */}
      <Text style={styles.salesValue}>
        {totalSales > 0 ? `₹${totalSales.toLocaleString()}` : '₹3,248'}
      </Text>

      <View style={styles.trendRow}>
        <View style={styles.greenPill}>
          <Text style={styles.greenPillText}>↑ 12.5%</Text>
        </View>
        <Text style={styles.trendSubText}>vs last week</Text>
      </View>

      {/* 7-Day Chart Area with SVG */}
      <View style={styles.chartWrapper}>
        {/* Subtle background bar chart silhouette on the right */}
        <View style={styles.barSilhouette} pointerEvents="none">
          <View style={[styles.silBar, { height: 35 }]} />
          <View style={[styles.silBar, { height: 55 }]} />
          <View style={[styles.silBar, { height: 80 }]} />
          <View style={[styles.silBar, { height: 60 }]} />
          <TrendingUp size={18} color="rgba(255, 255, 255, 0.25)" style={styles.arrowIcon} />
        </View>

        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          <Defs>
            <SvgLinearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F12A9B" stopOpacity="0.45" />
              <Stop offset="0.7" stopColor="#A855F7" stopOpacity="0.18" />
              <Stop offset="1" stopColor="#281078" stopOpacity="0.02" />
            </SvgLinearGradient>
          </Defs>

          {/* Subtle horizontal grid lines */}
          <Line
            x1="0"
            y1={CHART_HEIGHT - 20}
            x2={CHART_WIDTH}
            y2={CHART_HEIGHT - 20}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Area fill */}
          <Path d={areaD} fill="url(#salesGradient)" />

          {/* Glowing Line */}
          <Path
            d={pathD}
            fill="none"
            stroke="#F12A9B"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Small dots along the line */}
          {points.map((p, idx) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx === peakIdx ? 5.5 : 2.5}
              fill={idx === peakIdx ? '#FFFFFF' : '#F12A9B'}
              stroke={idx === peakIdx ? '#F12A9B' : '#FFFFFF'}
              strokeWidth={idx === peakIdx ? 2 : 1}
            />
          ))}

          {/* Dotted vertical line down from peak */}
          <Line
            x1={peakPoint.x}
            y1={peakPoint.y + 6}
            x2={peakPoint.x}
            y2={CHART_HEIGHT - 20}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeDasharray="3 3"
            strokeWidth="1.2"
          />
        </Svg>

        {/* Floating Tooltip Bubble over the peak point */}
        <View
          style={[
            styles.tooltipBubble,
            {
              left: Math.max(10, Math.min(CHART_WIDTH - 55, peakPoint.x - 28)),
              top: Math.max(2, peakPoint.y - 32),
            },
          ]}
        >
          <Text style={styles.tooltipText}>₹{peakDisplayVal}</Text>
        </View>
      </View>

      {/* Weekday labels row at bottom */}
      <View style={styles.weekdayRow}>
        {weekdays.map((day, idx) => (
          <Text
            key={day}
            style={[
              styles.weekdayText,
              idx === peakIdx && styles.weekdayTextActive,
            ]}
          >
            {day}
          </Text>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    position: 'relative',
    shadowColor: '#281078',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  rangePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  salesValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  greenPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  greenPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  trendSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  chartWrapper: {
    height: CHART_HEIGHT,
    position: 'relative',
    marginTop: 4,
  },
  barSilhouette: {
    position: 'absolute',
    right: 8,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    opacity: 0.6,
  },
  silBar: {
    width: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 4,
  },
  arrowIcon: {
    marginBottom: 45,
    marginLeft: -4,
  },
  tooltipBubble: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,
  },
  tooltipText: {
    color: '#111044',
    fontSize: 11,
    fontWeight: '800',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  weekdayText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: 32,
  },
  weekdayTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

