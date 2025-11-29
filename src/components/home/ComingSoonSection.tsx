import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonSectionProps {
  title: string;
  description: string;
  launchDate?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const ComingSoonSection: React.FC<ComingSoonSectionProps> = ({
  title,
  description,
  launchDate,
  icon,
  className = '',
}) => {
  const navigate = useNavigate();

  return (
    <div className={`rounded-2xl md:rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 p-6 md:p-8 h-full flex flex-col items-center justify-center text-center ${className}`}>
      {icon && (
        <div className="mb-4 p-4 rounded-full bg-gray-200">
          {icon}
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-gray-500" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-700">Coming Soon</h2>
      </div>
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm md:text-base text-gray-600 mb-4 max-w-md">{description}</p>
      {launchDate && (
        <p className="text-xs md:text-sm text-gray-500 mb-4">Expected launch: {launchDate}</p>
      )}
      <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
        <span>Stay tuned</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );
};

interface ComingSoonCardProps {
  title: string;
  description: string;
  launchDate?: string;
  icon?: React.ReactNode;
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({
  title,
  description,
  launchDate,
  icon,
}) => {
  return (
    <div className="rounded-xl md:rounded-2xl bg-white shadow-sm md:shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 md:p-6 border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="p-3 rounded-xl bg-gray-100 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coming Soon</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          {launchDate && (
            <p className="text-xs text-gray-500">Expected: {launchDate}</p>
          )}
        </div>
      </div>
    </div>
  );
};

