import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, required, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#172033]">
            {label} {required && <span className="text-[#C0392B] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-gov-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B667A]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full text-xs text-[#172033] bg-white border ${
              error ? 'border-[#C0392B] focus:ring-[#C0392B]/20 focus:border-[#C0392B]' : 'border-[#DDE3EA] focus:ring-[#123B6D]/20 focus:border-[#123B6D]'
            } rounded-lg py-2.5 ${leftIcon ? 'pl-9' : 'pl-3.5'} ${
              rightIcon ? 'pr-9' : 'pr-3.5'
            } placeholder-[#5B667A]/60 focus:outline-none focus:ring-2 transition-all duration-150 disabled:bg-[#F5F7FA] disabled:text-[#5B667A] ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5B667A]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] font-medium text-[#C0392B] mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[#5B667A] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
