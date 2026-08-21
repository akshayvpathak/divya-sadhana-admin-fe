import Link from 'next/link';
import { BookOpen, FileText, Package } from 'lucide-react';
import { RowActions } from '@/components/common/RowActions';
import { ColumnConfig } from '@/components/common/DataTable/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { DateTimeCell } from '@/components/common/DateTimeCell';
import { formatINR } from '@/lib/currency';
import { bookId, bookTitle, type AdminBook } from '@/schemas/books.schema';

function FormatChips({ book }: { book: AdminBook }) {
  const formats = book.formats ?? [];
  if (formats.length === 0) {
    return <span className="text-xs text-moon">No active format</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {formats.includes('EBOOK') ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-tint px-2 py-0.5 text-xs font-medium text-ink">
          <FileText className="h-3 w-3 text-saffron" /> eBook
        </span>
      ) : null}
      {formats.includes('PHYSICAL') ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-tint px-2 py-0.5 text-xs font-medium text-ink">
          <Package className="h-3 w-3 text-saffron" /> Printed
        </span>
      ) : null}
    </div>
  );
}

/** "₹199" when one format remains, "₹199 – ₹499" when the two differ. */
function priceRange(book: AdminBook): string {
  const min = book.min_price;
  const max = book.max_price;
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) {
    return `${formatINR(min)} – ${formatINR(max)}`;
  }
  return formatINR((min ?? max) as number);
}

export const useBookTableColumns = ({
  openDeleteModal,
}: {
  openDeleteModal: (id: string) => void;
}): ColumnConfig<AdminBook>[] => {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Title',
      sortable: true,
      mobile: 'title',
      renderCell: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-tint text-saffron">
            {row.primary_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.primary_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <Link href={`/books/${bookId(row)}`} className="truncate font-medium hover:underline">
              {bookTitle(row)}
            </Link>
            {row.book?.author ? (
              <span className="truncate text-xs text-moon">{row.book.author}</span>
            ) : null}
          </span>
        </div>
      ),
      renderMobile: (row) => (
        <span className="block">
          <span className="block break-words">{bookTitle(row)}</span>
          {row.book?.author ? (
            <span className="mt-0.5 block text-xs font-normal text-moon">{row.book.author}</span>
          ) : null}
        </span>
      ),
    },
    {
      id: 'formats',
      header: 'Formats',
      mobile: 'field',
      renderCell: (row) => <FormatChips book={row} />,
    },
    {
      id: 'min_price',
      accessorKey: 'min_price',
      header: 'Price',
      sortable: true,
      cellClassName: 'font-medium text-ink whitespace-nowrap',
      mobile: 'field',
      renderCell: (row) => priceRange(row),
    },
    {
      id: 'category_name',
      accessorKey: 'category_name',
      header: 'Category',
      mobile: 'detail',
      renderCell: (row) => row.category_name || null,
    },
    {
      id: 'is_published',
      accessorKey: 'is_published',
      header: 'Status',
      sortable: true,
      headerAlign: 'center',
      cellAlign: 'center',
      mobile: 'status',
      renderCell: (row) => (
        <StatusBadge
          status={row.is_published ? 'published' : 'draft'}
          type="published"
        />
      ),
    },
    {
      id: 'updated_at',
      accessorKey: 'updated_at',
      header: 'Updated',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      mobile: 'detail',
      renderCell: (row) => <DateTimeCell value={row.updated_at} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      mobile: 'actions',
      headerAlign: 'center',
      cellAlign: 'center',
      renderCell: (row) => (
        <RowActions
          actions={[
            { kind: 'edit', href: `/books/${bookId(row)}` },
            // Refused with a 400 once anyone owns the title; the message says to unpublish.
            { kind: 'delete', onClick: () => openDeleteModal(bookId(row)) },
          ]}
        />
      ),
    },
  ];
};
