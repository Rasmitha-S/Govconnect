import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#DDE3EA] shadow-gov p-6 ${
        hoverable ? 'hover:shadow-gov-md hover:border-[#B9D4EE] transition-all cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#DDE3EA]/70 mb-5 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2.5 bg-[#EBF3FA] text-[#123B6D] rounded-xl flex items-center justify-center border border-[#B9D4EE]/60">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#172033] leading-snug">{title}</h3>
          {subtitle && <p className="text-xs text-[#5B667A] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
