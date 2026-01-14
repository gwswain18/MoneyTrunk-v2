import * as React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  showLabel = false,
}) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
          className
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-emerald-600 transition-all duration-300',
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
};

export { Progress };
