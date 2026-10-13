import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  G,
  Line,
} from 'react-native-svg';
import { COLORS } from '../../theme/colors';

interface IconProps {
  size?: number;
  color?: string;
  isActive?: boolean;
}

// 1. Home Icon matching Blinkit: Chubby cottage with chimney & arched doorway in brand colors
export const BlinkitHomeIcon: React.FC<IconProps> = ({
  size = 24,
  isActive = true,
  color,
}) => {
  const fillColor = isActive ? COLORS.hotPink : 'none';
  const strokeColor = isActive ? COLORS.hotPink : (color || COLORS.textMuted);
  const doorColor = isActive ? COLORS.white : (color || COLORS.textMuted);

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Chimney on roof */}
      <Path
        d="M19 8.5V4.5H22V11.5"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* House body & roof */}
      <Path
        d="M14 3.5L4.5 11.5C3.8 12.1 3.5 13 3.5 14V22C3.5 23.4 4.6 24.5 6 24.5H22C23.4 24.5 24.5 23.4 24.5 22V14C24.5 13 24.2 12.1 23.5 11.5L14 3.5Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arched Doorway */}
      <Path
        d="M11.5 24.5V17C11.5 15.6 12.6 14.5 14 14.5C15.4 14.5 16.5 15.6 16.5 17V24.5"
        fill={doorColor}
        stroke={doorColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// 2. Order Again Icon matching Blinkit: Shopping basket with dual arched handles in brand colors
export const BlinkitOrderAgainIcon: React.FC<IconProps> = ({
  size = 24,
  isActive = false,
  color,
}) => {
  const strokeColor = color || (isActive ? COLORS.hotPink : COLORS.textMuted);

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Dual loop handles */}
      <Path
        d="M9 11V7C9 4.8 10.8 3 13 3H15C17.2 3 19 4.8 19 7V11"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Basket upper rim */}
      <Path
        d="M4.5 11H23.5"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Basket bucket body */}
      <Path
        d="M6 11L7.8 21.5C8 22.9 9.2 24 10.6 24H17.4C18.8 24 20 22.9 20.2 21.5L22 11"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Subtle basket handle accent line */}
      <Line
        x1="11"
        y1="16"
        x2="17"
        y2="16"
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity={0.4}
      />
    </Svg>
  );
};

// 3. Categories Icon matching Blinkit: 4 circular bubbles in brand colors
export const BlinkitCategoriesIcon: React.FC<IconProps> = ({
  size = 24,
  isActive = false,
  color,
}) => {
  const strokeColor = color || (isActive ? COLORS.hotPink : COLORS.textMuted);
  const bubbleFill = isActive ? COLORS.lightPink : COLORS.cardBackground;

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="8" cy="8" r="4.5" fill={bubbleFill} stroke={strokeColor} strokeWidth="2.2" />
      <Circle cx="20" cy="8" r="4.5" fill={bubbleFill} stroke={strokeColor} strokeWidth="2.2" />
      <Circle cx="8" cy="20" r="4.5" fill={bubbleFill} stroke={strokeColor} strokeWidth="2.2" />
      <Circle cx="20" cy="20" r="4.5" fill={bubbleFill} stroke={strokeColor} strokeWidth="2.2" />
    </Svg>
  );
};

// 4. Print Icon matching Blinkit: Desktop printer with feeder paper sheet & output slot
export const BlinkitPrintIcon: React.FC<IconProps> = ({
  size = 24,
  isActive = false,
  color,
}) => {
  const strokeColor = color || (isActive ? COLORS.hotPink : COLORS.textMuted);

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Top paper feeder */}
      <Path
        d="M8 10V4.5C8 3.7 8.7 3 9.5 3H18.5C19.3 3 20 3.7 20 4.5V10"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Printer main body */}
      <Rect
        x="4"
        y="10"
        width="20"
        height="12"
        rx="4"
        stroke={strokeColor}
        strokeWidth="2.2"
        fill="none"
      />
      {/* Front paper output tray & slot */}
      <Path
        d="M8 18H20V24C20 24.6 19.6 25 19 25H9C8.4 25 8 24.6 8 24V18Z"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
        fill="#FFFFFF"
      />
      {/* Power LED dot */}
      <Circle cx="19.5" cy="13.5" r="1.2" fill={strokeColor} />
    </Svg>
  );
};

// Profile Icon matching Blinkit: Rounded user head & shoulders
export const BlinkitProfileIcon: React.FC<IconProps> = ({
  size = 24,
  isActive = false,
  color,
}) => {
  const fillColor = isActive ? COLORS.hotPink : 'none';
  const strokeColor = color || (isActive ? COLORS.hotPink : COLORS.textMuted);

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Head */}
      <Circle
        cx="14"
        cy="9"
        r="4.5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.2"
      />
      {/* Torso/Shoulders */}
      <Path
        d="M6 23C6 19.134 9.134 16 13 16H15C18.866 16 22 19.134 22 23"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// 5. Header: 'All' Categories Tab Icon matching Blinkit (Tote bag / crate with groceries)
export const BlinkitAllHeaderIcon: React.FC<IconProps> = ({
  size = 24,
  color = COLORS.white,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Bottles/produce sticking out */}
      <Path
        d="M8.5 12V6.5C8.5 5.7 9.2 5 10 5C10.8 5 11.5 5.7 11.5 6.5V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M16 12V4.5C16 3.7 16.7 3 17.5 3C18.3 3 19 3.7 19 4.5V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Solid tote / basket base */}
      <Path
        d="M4.5 12H23.5L21.5 24C21.3 24.6 20.8 25 20.2 25H7.8C7.2 25 6.7 24.6 6.5 24L4.5 12Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// 6. Header: 'Ganeshotsav' Tab Icon matching Blinkit (Lord Ganesha silhouette line art)
export const BlinkitGaneshaHeaderIcon: React.FC<IconProps> = ({
  size = 24,
  color = COLORS.white,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Sacred crown on top */}
      <Path
        d="M11 6.5H17L14.5 3.5L14 2L13.5 3.5L11 6.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Crown base band */}
      <Line x1="10" y1="6.5" x2="18" y2="6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Head line */}
      <Path
        d="M10 6.5C8 7.5 6 9 6 12C6 15 8 16.5 9.5 16.5"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <Path
        d="M18 6.5C20 7.5 22 9 22 12C22 15 20 16.5 18.5 16.5"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {/* Ganesha trunk curving right and upward */}
      <Path
        d="M14 8V16C14 18.5 12.5 21 15 21.5C17.5 22 18 19.5 16.5 18.5C15 17.5 14 19 14.8 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// 7. Header: 'Electronics' Tab Icon matching Blinkit (Over-ear headphones)
export const BlinkitHeadphonesHeaderIcon: React.FC<IconProps> = ({
  size = 24,
  color = COLORS.white,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Headband arch */}
      <Path
        d="M5 14C5 9.03 9.03 5 14 5C18.97 5 23 9.03 23 14"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Left earcup */}
      <Rect
        x="4"
        y="13"
        width="4.5"
        height="10"
        rx="2.2"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Right earcup */}
      <Rect
        x="19.5"
        y="13"
        width="4.5"
        height="10"
        rx="2.2"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
      />
    </Svg>
  );
};

// 8. Header: 'Beauty' Tab Icon matching Blinkit (Lipstick + makeup brush)
export const BlinkitBeautyHeaderIcon: React.FC<IconProps> = ({
  size = 24,
  color = COLORS.white,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Lipstick base tube */}
      <Rect
        x="5"
        y="14"
        width="6"
        height="10"
        rx="1"
        stroke={color}
        strokeWidth="2"
      />
      {/* Lipstick collar */}
      <Rect
        x="6"
        y="11"
        width="4"
        height="3"
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Lipstick angled bullet */}
      <Path
        d="M6 11V7L10 9V11H6Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Makeup brush handle */}
      <Path
        d="M20 16V24"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Brush ferrule */}
      <Rect
        x="18"
        y="13"
        width="4"
        height="3"
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Flared brush bristles */}
      <Path
        d="M17 5C17 5 16 8 18 13H22C24 8 23 5 20 4C18.5 4.5 17 5 17 5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
