import * as React from 'react';

import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
  secondary: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
  destructive: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
  outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
  icon: 'h-9 w-9 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-60',
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
