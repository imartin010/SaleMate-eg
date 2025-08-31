import React from 'react';

interface FastPlaceholderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const FastPlaceholder: React.FC<FastPlaceholderProps> = ({ 
  title, 
  description, 
  icon, 
  action 
}) => (
  <div className="flex items-center justify-center min-h-[300px] p-8">
    <div className="text-center max-w-md">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  </div>
);

// Ultra-fast skeleton for lists
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg shadow-sm border animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

// Ultra-fast card skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);
