import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ClearFiltersButtonProps {
  /** Callback to reset all filters/searches for the page */
  onClear: () => void;
  /** Optional extra class names */
  className?: string;
}

/**
 * A tiny, reusable button that clears all filter UI state on a page.
 * It uses the same ghost styling as other controls for visual consistency.
 */
export function ClearFiltersButton({ onClear, className = '' }: ClearFiltersButtonProps) {
  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className={`flex items-center gap-1 ${className}`}
      onClick={onClear}
    >
      <X className="h-3 w-3" />
      Clear
    </Button>
  );
}
