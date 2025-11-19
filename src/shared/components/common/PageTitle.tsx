import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'pink' | 'teal' | 'yellow' | 'gray';
  className?: string;
}

const colorVariants = {
  blue: {
    badge: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-700',
    title: 'bg-gradient-to-r from-gray-900 via-blue-800 to-blue-900'
  },
  green: {
    badge: 'bg-gradient-to-r from-green-50 to-green-100 border-green-200',
    icon: 'text-green-600',
    text: 'text-green-700',
    title: 'bg-gradient-to-r from-gray-900 via-green-800 to-green-900'
  },
  purple: {
    badge: 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200',
    icon: 'text-purple-600',
    text: 'text-purple-700',
    title: 'bg-gradient-to-r from-gray-900 via-purple-800 to-purple-900'
  },
  orange: {
    badge: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200',
    icon: 'text-orange-600',
    text: 'text-orange-700',
    title: 'bg-gradient-to-r from-gray-900 via-orange-800 to-orange-900'
  },
  red: {
    badge: 'bg-gradient-to-r from-red-50 to-red-100 border-red-200',
    icon: 'text-red-600',
    text: 'text-red-700',
    title: 'bg-gradient-to-r from-gray-900 via-red-800 to-red-900'
  },
  indigo: {
    badge: 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200',
    icon: 'text-indigo-600',
    text: 'text-indigo-700',
    title: 'bg-gradient-to-r from-gray-900 via-indigo-800 to-indigo-900'
  },
  pink: {
    badge: 'bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200',
    icon: 'text-pink-600',
    text: 'text-pink-700',
    title: 'bg-gradient-to-r from-gray-900 via-pink-800 to-pink-900'
  },
  teal: {
    badge: 'bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200',
    icon: 'text-teal-600',
    text: 'text-teal-700',
    title: 'bg-gradient-to-r from-gray-900 via-teal-800 to-teal-900'
  },
  yellow: {
    badge: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200',
    icon: 'text-yellow-600',
    text: 'text-yellow-700',
    title: 'bg-gradient-to-r from-gray-900 via-yellow-800 to-yellow-900'
  },
  gray: {
    badge: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200',
    icon: 'text-gray-600',
    text: 'text-gray-700',
    title: 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900'
  }
};

export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  subtitle,
  icon: Icon,
  color,
  className
}) => {
  const colors = colorVariants[color];

  return (
    <div className={cn('text-center space-y-4', className)}>
      <div className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full border',
        colors.badge
      )}>
        <Icon className={cn('h-4 w-4', colors.icon)} />
        <span className={cn('text-sm font-medium', colors.text)}>
          {title}
        </span>
      </div>
      {subtitle && (
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};
