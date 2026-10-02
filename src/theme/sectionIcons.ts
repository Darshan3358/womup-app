import {
  Flame,
  Zap,
  Leaf,
  Milk,
  Star,
  Sparkles,
  IndianRupee,
  Award,
  Gift,
  Egg,
  Tag,
  LucideIcon,
} from 'lucide-react-native';

export interface SectionIconConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const SECTION_ICONS: Record<string, SectionIconConfig> = {
  deals: {
    icon: Flame,
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
  },
  fast_delivery: {
    icon: Zap,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  fresh_veggies: {
    icon: Leaf,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  dairy_bread: {
    icon: Milk,
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
  },
  bestsellers: {
    icon: Star,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  new_arrivals: {
    icon: Sparkles,
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
  under_50: {
    icon: IndianRupee,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  brands: {
    icon: Award,
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.12)',
  },
  monthly_benefits: {
    icon: Gift,
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.12)',
  },
};
