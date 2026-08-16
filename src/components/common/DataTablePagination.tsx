import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
}: DataTablePaginationProps) {
  // Always show the results summary so short lists don't leave a blank card footer.
  // Page controls only appear when there is more than one page.
  const showControls = totalPages > 1;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);

      // Calculate start and end indices around the current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust to show more numbers if at the boundary
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems <= 0) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-line bg-cream px-5 py-3.5 sm:flex-row">
      <p className="text-sm text-moon">
        Showing <span className="font-semibold tabular-nums text-ink">{startItem}</span> to{' '}
        <span className="font-semibold tabular-nums text-ink">{endItem}</span> of{' '}
        <span className="font-semibold tabular-nums text-ink">{totalItems}</span> results
      </p>
      
      {showControls ? (
      <div className="flex items-center gap-2">
        {/* Jump to First Page */}
        <Button
          variant="outline"
          size="icon"
          className="hidden h-8 w-8 border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press disabled:opacity-40 sm:flex"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press disabled:opacity-40"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="select-none px-2 py-1 text-sm text-moon/60"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            return (
              <Button
                key={`page-${pageNum}`}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-8 min-w-8 px-2 font-semibold tabular-nums',
                  currentPage !== pageNum &&
                    'border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press'
                )}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press disabled:opacity-40"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Jump to Last Page */}
        <Button
          variant="outline"
          size="icon"
          className="hidden h-8 w-8 border-line bg-surface text-charcoal hover:border-gold/40 hover:bg-tint hover:text-gold-press disabled:opacity-40 sm:flex"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
      ) : null}
    </div>
  );
}
