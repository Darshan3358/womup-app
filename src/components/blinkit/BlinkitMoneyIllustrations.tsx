import React from 'react';
import { View } from 'react-native';
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { COLORS } from '../../theme/colors';

// 1. Authentic 3D-Tilted Worm Up Luxury Wallet with Hot Pink & Purple Brand Gradients
export const Blinkit3DWallet: React.FC<{ size?: number }> = ({ size = 110 }) => {
  return (
    <View style={{ width: size, height: size * 0.95, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size * 0.95} viewBox="0 0 140 130" fill="none">
        <Defs>
          {/* Main leather body gradient (Worm Up Purple to Deep Blue) */}
          <SvgLinearGradient id="walletBody" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#7C3AED" />
            <Stop offset="50%" stopColor="#8364E6" />
            <Stop offset="100%" stopColor="#515FEA" />
          </SvgLinearGradient>

          {/* Top edge / interior depth */}
          <SvgLinearGradient id="walletTopEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#A78BFA" />
            <Stop offset="60%" stopColor="#8364E6" />
            <Stop offset="100%" stopColor="#4338CA" />
          </SvgLinearGradient>

          {/* Front flap gradient (Signature Worm Up Hot Pink to Purple) */}
          <SvgLinearGradient id="walletFlap" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#F562AF" />
            <Stop offset="45%" stopColor="#BF54D0" />
            <Stop offset="100%" stopColor="#8364E6" />
          </SvgLinearGradient>

          {/* Realistic soft drop shadow */}
          <SvgLinearGradient id="walletShadow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(5, 6, 42, 0.4)" />
            <Stop offset="100%" stopColor="rgba(5, 6, 42, 0)" />
          </SvgLinearGradient>
        </Defs>

        {/* Soft ground shadow */}
        <Path
          d="M 28 114 Q 70 126 118 108 Q 70 98 28 114 Z"
          fill="url(#walletShadow)"
        />

        {/* Main 3D Tilted Wallet Group tilted at -9 deg */}
        <G transform="rotate(-9, 70, 60)">
          {/* Back body / interior thickness */}
          <Path
            d="M 32 30 L 102 18 C 114 16, 122 24, 120 36 L 108 86 C 106 96, 96 102, 86 104 L 20 102 C 10 102, 4 92, 6 82 L 18 38 C 20 28, 26 26, 32 30 Z"
            fill="url(#walletBody)"
          />

          {/* Top rim fold / card slot visible depth */}
          <Path
            d="M 30 28 L 104 16 C 112 14, 118 20, 116 28 L 114 34 L 26 44 Z"
            fill="url(#walletTopEdge)"
          />

          {/* Front Leather Flap with signature pink/purple gradient */}
          <Path
            d="M 18 36 C 18 30, 24 26, 32 26 L 98 26 C 106 26, 112 32, 110 40 L 98 84 C 96 92, 88 98, 80 98 L 26 98 C 18 98, 12 92, 14 84 Z"
            fill="url(#walletFlap)"
          />

          {/* Flap bevel / highlight line on top */}
          <Path
            d="M 28 28 L 98 28 C 104 28, 108 32, 106 38"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Crisp Indian Rupee Symbol centered on the front flap */}
          <SvgText
            x="62"
            y="70"
            fill="#FFFFFF"
            fontSize="32"
            fontWeight="bold"
            fontFamily="System, -apple-system, Roboto, sans-serif"
            textAnchor="middle"
          >
            ₹
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};

// 2. Single Tap Payments: Smartphone being tapped by hand (Worm Up lavender/pink)
export const SingleTapIllustration: React.FC<{ size?: number }> = ({ size = 52 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <SvgLinearGradient id="phoneBrandGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FCE1F5" />
          <Stop offset="100%" stopColor="#E2E6F9" />
        </SvgLinearGradient>
      </Defs>

      {/* Phone body */}
      <Rect
        x="12"
        y="6"
        width="28"
        height="50"
        rx="6"
        fill="url(#phoneBrandGrad)"
        stroke="#8364E6"
        strokeWidth="2"
      />
      {/* Screen speaker */}
      <Rect x="21" y="10" width="10" height="2" rx="1" fill="#8364E6" />
      {/* Home line */}
      <Rect x="22" y="50" width="8" height="2" rx="1" fill="#8364E6" />

      {/* Ripple circle on tap point */}
      <Circle cx="26" cy="30" r="10" stroke="#F562AF" strokeWidth="1.5" strokeDasharray="3 2" />
      <Circle cx="26" cy="30" r="5" fill="#FCE1F5" stroke="#F562AF" strokeWidth="1" />

      {/* Hand / finger tapping screen */}
      <Path
        d="M 26 29 L 26 24 C 26 22 28 20 30 20 C 32 20 34 22 34 24 L 34 32 L 36 32 C 38 32 40 33 40 35 L 40 40 C 40 46 36 52 30 52 L 26 52"
        fill="#FFFFFF"
        stroke="#333450"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Finger joint details */}
      <Path d="M 34 26 L 36 26" stroke="#8364E6" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
};

// 3. Zero Failures: Smartphone with contactless / wave radiation (Worm Up blue/purple)
export const ZeroFailuresIllustration: React.FC<{ size?: number }> = ({ size = 52 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Phone body */}
      <Rect
        x="10"
        y="8"
        width="26"
        height="48"
        rx="6"
        fill="#E2E6F9"
        stroke="#515FEA"
        strokeWidth="2"
      />
      <Rect x="18" y="12" width="10" height="2" rx="1" fill="#515FEA" />

      {/* Contactless waves on screen in brand hot pink / purple */}
      <Path
        d="M 18 36 A 8 8 0 0 1 28 36"
        stroke="#F562AF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M 15 32 A 12 12 0 0 1 31 32"
        stroke="#BF54D0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M 12 28 A 16 16 0 0 1 34 28"
        stroke="#8364E6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Hand holding phone on the side */}
      <Path
        d="M 36 28 C 40 28 44 31 44 35 L 44 48 C 44 54 39 58 33 58 L 26 58"
        fill="#FFFFFF"
        stroke="#333450"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 36 34 L 38 34"
        stroke="#8364E6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// 4. Real-time Refunds: Hand holding cash / banknote (Worm Up pink/purple)
export const RealTimeRefundsIllustration: React.FC<{ size?: number }> = ({ size = 52 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Cash / Banknote tilted */}
      <G transform="rotate(-15, 28, 30)">
        <Rect
          x="12"
          y="18"
          width="32"
          height="22"
          rx="4"
          fill="#FCE1F5"
          stroke="#BF54D0"
          strokeWidth="2"
        />
        <Circle cx="28" cy="29" r="5" fill="#F562AF" />
        <SvgText
          x="28"
          y="32.5"
          fill="#FFFFFF"
          fontSize="8"
          fontWeight="bold"
          textAnchor="middle"
        >
          ₹
        </SvgText>
      </G>

      {/* Hand grasping the note */}
      <Path
        d="M 28 42 C 34 40 40 42 42 46 L 42 54 C 42 58 38 60 34 60 L 26 60"
        fill="#FFFFFF"
        stroke="#333450"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 30 36 C 32 36 34 38 34 40 L 34 44"
        stroke="#333450"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// 5. 3D Gift Box with Worm Up Pink and Purple Ribbon
export const GiftBoxIllustration: React.FC<{ size?: number }> = ({ size = 42 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <SvgLinearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FAF5FF" />
          <Stop offset="100%" stopColor="#E2E6F9" />
        </SvgLinearGradient>
        <SvgLinearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#F562AF" />
          <Stop offset="100%" stopColor="#BF54D0" />
        </SvgLinearGradient>
      </Defs>

      {/* Gift box base */}
      <Rect
        x="8"
        y="18"
        width="32"
        height="22"
        rx="4"
        fill="url(#boxGrad)"
        stroke="#8364E6"
        strokeWidth="1.5"
      />

      {/* Gift box lid */}
      <Rect
        x="6"
        y="14"
        width="36"
        height="7"
        rx="2"
        fill="#EDE9FE"
        stroke="#8364E6"
        strokeWidth="1.5"
      />

      {/* Vertical Ribbon */}
      <Rect x="21" y="14" width="6" height="26" fill="url(#ribbonGrad)" />

      {/* Ribbon Bow on top */}
      <Path
        d="M 21 14 C 17 8 13 12 21 14 Z"
        fill="url(#ribbonGrad)"
      />
      <Path
        d="M 27 14 C 31 8 35 12 27 14 Z"
        fill="url(#ribbonGrad)"
      />
      <Circle cx="24" cy="14" r="2.5" fill="#8364E6" />
    </Svg>
  );
};

