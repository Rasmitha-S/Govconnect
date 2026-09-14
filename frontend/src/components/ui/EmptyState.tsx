import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button.js';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FolderOpen className="w-8 h-8 text-[#5B667A]" />,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  action,
  className = '',
}) => {
  return (
    <div className={`py-12 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#EBF3FA] border border-[#B9D4EE]/60 text-[#123B6D] flex items-center justify-center mb-4 shadow-gov-sm">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#172033] mb-1.5">{title}</h3>
      <p className="text-xs text-[#5B667A] leading-relaxed mb-6">{description}</p>
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          leftIcon={actionIcon}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};
