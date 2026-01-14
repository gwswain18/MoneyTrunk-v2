import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
          {
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200':
              variant === 'default',
            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200':
              variant === 'secondary',
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
              variant === 'destructive',
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
              variant === 'success',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
              variant === 'warning',
            'border border-slate-200 bg-transparent text-slate-800 dark:border-slate-700 dark:text-slate-200':
              variant === 'outline',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
