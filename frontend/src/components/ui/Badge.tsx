import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    primary: 'bg-[#EBF3FA] text-[#123B6D] border-[#B9D4EE]',
    secondary: 'bg-[#E6F4F5] text-[#087F8C] border-[#B2E2E6]',
    success: 'bg-[#E8F5E9] text-[#198754] border-[#A3E9B9]',
    warning: 'bg-[#FFF8E6] text-[#B37400] border-[#FFE082]',
    danger: 'bg-[#FDEDEC] text-[#C0392B] border-[#F5B7B1]',
    neutral: 'bg-[#F0F3F7] text-[#5B667A] border-[#DDE3EA]',
    info: 'bg-[#E1F5FE] text-[#0288D1] border-[#B3E5FC]',
    accent: 'bg-[#FEF6E9] text-[#D97706] border-[#FCD34D]',
  };

  const dotStyles = {
    primary: 'bg-[#123B6D]',
    secondary: 'bg-[#087F8C]',
    success: 'bg-[#198754]',
    warning: 'bg-[#D99000]',
    danger: 'bg-[#C0392B]',
    neutral: 'bg-[#5B667A]',
    info: 'bg-[#0288D1]',
    accent: 'bg-[#F4A340]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wide',
    lg: 'px-3 py-1.5 text-xs font-bold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};
