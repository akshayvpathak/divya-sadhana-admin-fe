'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div className={cn(
          "peer h-6 w-11 rounded-full bg-cosmos peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-saffron/35 peer-checked:bg-gold-deep peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-line after:bg-white after:transition-all after:content-['']",
          className
        )}></div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
