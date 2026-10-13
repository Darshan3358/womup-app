import React from 'react';
import { ShoppingCart, Apple, Coffee, Pill, Sparkles, Home, Layers } from 'lucide-react';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES = [
  { id: 'All', label: 'All Items', icon: Layers },
  { id: 'Groceries & Staples', label: 'Groceries & Staples', icon: ShoppingCart },
  { id: 'Fruits & Vegetables', label: 'Fruits & Veggies', icon: Apple },
  { id: 'Bakery & Dairy', label: 'Bakery & Dairy', icon: Coffee },
  { id: 'Pharmacy & Health', label: 'Pharmacy & Care', icon: Pill },
  { id: 'Snacks & Beverages', label: 'Snacks & Drinks', icon: Sparkles },
  { id: 'Household Essentials', label: 'Home Care', icon: Home },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="category-section">
      <div className="container">
        <div className="category-scroll">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-pill-${cat.id.replace(/\s+/g, '-').toLowerCase()}`}
                className={`category-pill ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
