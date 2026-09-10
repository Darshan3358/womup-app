import React from 'react';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import {
  BlinkitHomeIcon,
  BlinkitOrderAgainIcon,
  BlinkitCategoriesIcon,
  BlinkitPrintIcon,
  BlinkitAllHeaderIcon,
  BlinkitGaneshaHeaderIcon,
  BlinkitHeadphonesHeaderIcon,
  BlinkitBeautyHeaderIcon,
} from './BlinkitIcons';

export type IconName =
  | 'home'
  | 'search'
  | 'mic'
  | 'heart'
  | 'heart-filled'
  | 'share-2'
  | 'user'
  | 'user-circle'
  | 'wallet'
  | 'shopping-bag'
  | 'shopping-basket'
  | 'grid'
  | 'printer'
  | 'headphones'
  | 'beauty'
  | 'ganesh'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'star'
  | 'plus'
  | 'minus'
  | 'settings'
  | 'sun'
  | 'eye-off'
  | 'eye'
  | 'gift'
  | 'bell'
  | 'lock'
  | 'log-out'
  | 'clock'
  | 'upload'
  | 'arrow-left'
  | 'check'
  | 'shield'
  | 'zap'
  | 'tag'
  | 'message-circle'
  | 'file-text'
  | 'x'
  | 'help-circle'
  | 'sparkles'
  | 'map-pin'
  | 'credit-card'
  | 'trash'
  | 'check-circle';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  isActive?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 24,
  color = COLORS.textPrimary,
  isActive = false,
}) => {
  switch (name) {
    case 'home':
      return <BlinkitHomeIcon size={size} isActive={isActive} color={color} />;
    case 'shopping-basket':
      return <BlinkitOrderAgainIcon size={size} isActive={isActive} color={color} />;
    case 'grid':
      return <BlinkitCategoriesIcon size={size} isActive={isActive} color={color} />;
    case 'printer':
      return <BlinkitPrintIcon size={size} isActive={isActive} color={color} />;
    case 'shopping-bag':
      return <BlinkitAllHeaderIcon size={size} color={color} />;
    case 'ganesh':
      return <BlinkitGaneshaHeaderIcon size={size} color={color} />;
    case 'headphones':
      return <BlinkitHeadphonesHeaderIcon size={size} color={color} />;
    case 'beauty':
      return <BlinkitBeautyHeaderIcon size={size} color={color} />;
    case 'wallet':
      return <Ionicons name="wallet-outline" size={size} color={color} />;
    case 'heart-filled':
      return <Ionicons name="heart" size={size} color={COLORS.error} />;
    case 'star':
      return <Ionicons name="star" size={size} color={COLORS.warning} />;
    case 'search':
      return <Feather name="search" size={size} color={color} />;
    case 'mic':
      return <Feather name="mic" size={size} color={color} />;
    case 'heart':
      return <Feather name="heart" size={size} color={color} />;
    case 'share-2':
      return <Feather name="share-2" size={size} color={color} />;
    case 'user':
      return <Feather name="user" size={size} color={color} />;
    case 'user-circle':
      return <Feather name="user-check" size={size} color={color} />;
    case 'shopping-bag':
      return <Feather name="shopping-bag" size={size} color={color} />;
    case 'grid':
      return <Feather name="grid" size={size} color={color} />;
    case 'printer':
      return <Feather name="printer" size={size} color={color} />;
    case 'chevron-down':
      return <Feather name="chevron-down" size={size} color={color} />;
    case 'chevron-right':
      return <Feather name="chevron-right" size={size} color={color} />;
    case 'chevron-left':
      return <Feather name="chevron-left" size={size} color={color} />;
    case 'plus':
      return <Feather name="plus" size={size} color={color} />;
    case 'minus':
      return <Feather name="minus" size={size} color={color} />;
    case 'settings':
      return <Feather name="settings" size={size} color={color} />;
    case 'sun':
      return <Feather name="sun" size={size} color={color} />;
    case 'eye-off':
      return <Feather name="eye-off" size={size} color={color} />;
    case 'eye':
      return <Feather name="eye" size={size} color={color} />;
    case 'gift':
      return <Feather name="gift" size={size} color={color} />;
    case 'bell':
      return <Feather name="bell" size={size} color={color} />;
    case 'lock':
      return <Feather name="lock" size={size} color={color} />;
    case 'log-out':
      return <Feather name="log-out" size={size} color={color} />;
    case 'clock':
      return <Feather name="clock" size={size} color={color} />;
    case 'upload':
      return <Feather name="upload" size={size} color={color} />;
    case 'arrow-left':
      return <Feather name="arrow-left" size={size} color={color} />;
    case 'check':
      return <Feather name="check" size={size} color={color} />;
    case 'shield':
      return <Feather name="shield" size={size} color={color} />;
    case 'zap':
      return <Feather name="zap" size={size} color={color} />;
    case 'tag':
      return <Feather name="tag" size={size} color={color} />;
    case 'message-circle':
      return <Feather name="message-circle" size={size} color={color} />;
    case 'file-text':
      return <Feather name="file-text" size={size} color={color} />;
    case 'x':
      return <Feather name="x" size={size} color={color} />;
    case 'help-circle':
      return <Feather name="help-circle" size={size} color={color} />;
    case 'sparkles':
      return <Ionicons name="sparkles-outline" size={size} color={color} />;
    case 'map-pin':
      return <Feather name="map-pin" size={size} color={color} />;
    case 'credit-card':
      return <Feather name="credit-card" size={size} color={color} />;
    case 'trash':
      return <Feather name="trash-2" size={size} color={color} />;
    case 'check-circle':
      return <Feather name="check-circle" size={size} color={color} />;
    default:
      return <Feather name="circle" size={size} color={color} />;
  }
};
