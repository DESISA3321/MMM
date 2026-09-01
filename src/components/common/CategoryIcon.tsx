import React from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Home,
  Zap,
  Car,
  ShoppingBag,
  Film,
  Repeat,
  HeartPulse,
  Plane,
  Briefcase,
  Laptop,
  GraduationCap,
  Sparkles,
  CreditCard,
  Wallet,
  Coffee,
  PiggyBank,
  Tag,
  CircleDot,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingCart,
  Home,
  Zap,
  Car,
  ShoppingBag,
  Film,
  Repeat,
  HeartPulse,
  Plane,
  Briefcase,
  Laptop,
  GraduationCap,
  Sparkles,
  CreditCard,
  Wallet,
  Coffee,
  PiggyBank,
  Tag,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', style }) => {
  const IconComponent = ICON_MAP[name] || CircleDot;
  return <IconComponent className={className} style={style} />;
};
