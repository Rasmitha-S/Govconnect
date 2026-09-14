import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  count = 1,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full w-10 h-10';
      case 'text':
        return 'h-4 w-full rounded-md';
      case 'card':
        return 'h-28 w-full rounded-xl';
      default:
        return 'h-10 w-full rounded-lg';
    }
  };

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`animate-pulse bg-[#E2E8F0] ${getVariantStyles()} ${className}`}
    />
  ));

  return count === 1 ? elements[0] : <div className="space-y-3">{elements}</div>;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-5 rounded-2xl bg-white border border-gov-border shadow-gov space-y-4 animate-pulse ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="w-8 h-8 rounded-lg bg-slate-200" />
      </div>
      <div className="h-8 w-20 bg-slate-200 rounded" />
      <div className="h-3 w-36 bg-slate-200 rounded" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-8 bg-slate-100 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2 border-b border-slate-100">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
