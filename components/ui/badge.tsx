import * as React from 'react';

import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className, variant = 'secondary', ...props }: BadgeProps) {
  const styles =
    variant === 'default'
      ? 'bg-blue-600 text-white'
      : variant === 'outline'
        ? 'border border-slate-300 text-slate-700'
        : 'bg-slate-100 text-slate-700';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles,
        className
      )}
      {...props}
    />
  );
}

export default Badge;
