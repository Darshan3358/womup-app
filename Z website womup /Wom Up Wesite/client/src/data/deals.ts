import type { Deal } from '../types';

export const deals: Deal[] = [
  {
    id: 'deal-1',
    title: 'Fresh Fruits & Vegetables',
    discountText: 'Up to 40% OFF',
    categorySlug: 'fruits-vegetables',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format&fit=crop&q=80',
    badge: 'SUPER SAVINGS',
    gradient: 'linear-gradient(135deg, rgba(31, 164, 99, 0.15) 0%, rgba(248, 242, 255, 0.8) 100%)',
  },
  {
    id: 'deal-2',
    title: 'Dairy & Essentials',
    discountText: 'Up to 30% OFF',
    categorySlug: 'dairy-eggs',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    badge: 'DAILY FRESH',
    gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(248, 242, 255, 0.8) 100%)',
  },
  {
    id: 'deal-3',
    title: 'Snacks & Beverages',
    discountText: 'Up to 50% OFF',
    categorySlug: 'snacks-beverages',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop&q=80',
    badge: 'MEGA COMBO',
    gradient: 'linear-gradient(135deg, rgba(255, 59, 152, 0.15) 0%, rgba(248, 242, 255, 0.8) 100%)',
  },
  {
    id: 'deal-4',
    title: 'Home & Kitchen',
    discountText: 'Up to 35% OFF',
    categorySlug: 'home-kitchen',
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop&q=80',
    badge: 'HOME ESSENTIALS',
    gradient: 'linear-gradient(135deg, rgba(120, 86, 246, 0.15) 0%, rgba(248, 242, 255, 0.8) 100%)',
  },
];
