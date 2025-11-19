import React from 'react';
import { MoreVertical, CheckCircle, XCircle, Trash2, Edit, Copy } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  actions: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
  }[];
}

export const BulkActions: React.FC<BulkActionsProps> = ({ selectedCount, actions }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-brand-light rounded-lg border border-brand-primary border-opacity-20">
      <span className="text-sm font-medium text-brand-dark">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="flex gap-2 ml-auto">
        {actions.map((action, idx) => {
          const Icon = action.icon || MoreVertical;
          const variantClass =
            action.variant === 'danger'
              ? 'btn-brand-secondary text-red-600 hover:bg-red-50'
              : action.variant === 'secondary'
              ? 'btn-brand-secondary'
              : 'btn-brand-primary';
          return (
            <button
              key={idx}
              onClick={action.onClick}
              className={`${variantClass} flex items-center gap-2`}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Common bulk action icons
export const BulkActionIcons = {
  Approve: CheckCircle,
  Reject: XCircle,
  Delete: Trash2,
  Edit: Edit,
  Duplicate: Copy,
};

