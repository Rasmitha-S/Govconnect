import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost' | 'teal' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Strict GovTech Design System Button Hierarchy
  const variantStyles = {
    // 1. PRIMARY: Deep Government Blue (#123B6D) -> Dark Navy Hover (#0B2A4A)
    primary: 'bg-[#123B6D] hover:bg-[#0B2A4A] active:bg-[#081F38] text-white shadow-sm border border-transparent focus:ring-2 focus:ring-[#123B6D]/40 font-semibold',
    
    // 2. SECONDARY: Crisp White Surface + 2px Deep Blue Border + Deep Blue Text -> Light Sky Blue Hover
    secondary: 'bg-white hover:bg-[#EBF3FA] active:bg-[#D9EAF7] text-[#123B6D] border-2 border-[#123B6D] shadow-sm focus:ring-2 focus:ring-[#123B6D]/30 font-semibold',
    
    // 3. OUTLINE / TERTIARY: Neutral border for low-priority/supporting actions
    outline: 'bg-white hover:bg-[#F5F7FA] active:bg-[#EAEFF5] text-[#172033] border border-[#DDE3EA] shadow-gov-sm focus:ring-2 focus:ring-[#DDE3EA] font-medium',
    
    // 4. GHOST: Minimal text button
    ghost: 'bg-transparent hover:bg-slate-100/80 active:bg-slate-200 text-[#172033] focus:ring-2 focus:ring-slate-300 font-medium',
    
    // 5. SUCCESS: Semantic Green (#198754)
    success: 'bg-[#198754] hover:bg-[#146C43] active:bg-[#0F5333] text-white shadow-sm border border-transparent focus:ring-2 focus:ring-[#198754]/40 font-semibold',
    
    // 6. DANGER / DESTRUCTIVE: Semantic Red (#C0392B)
    danger: 'bg-[#C0392B] hover:bg-[#962D22] active:bg-[#78231B] text-white shadow-sm border border-transparent focus:ring-2 focus:ring-[#C0392B]/40 font-semibold',
    
    // 7. TEAL: Secondary Brand (#087F8C)
    teal: 'bg-[#087F8C] hover:bg-[#066570] active:bg-[#054E57] text-white shadow-sm border border-transparent focus:ring-2 focus:ring-[#087F8C]/40 font-semibold',
    
    // 8. ACCENT: Warm Saffron (#F4A340)
    accent: 'bg-[#F4A340] hover:bg-[#E29026] active:bg-[#C97915] text-[#172033] shadow-sm border border-transparent focus:ring-2 focus:ring-[#F4A340]/40 font-semibold',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-2.5 text-base rounded-xl gap-2.5',
  };

  return (
    <button
      className={`inline-flex items-center justify-center select-none transition-all duration-150 focus:outline-none focus:ring-offset-1 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      ) : (
        leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
};
