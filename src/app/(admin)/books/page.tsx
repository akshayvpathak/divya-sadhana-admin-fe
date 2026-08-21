'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useBooks, useBooksInfinite, useDeleteBook } from '@/hooks/useBooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { ListToolbar, ToolbarFilter } from '@/components/common/ListToolbar';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { PageHeader } from '@/components/common/PageHeader';
import { useBookTableColumns } from '@/hooks/tables/useBookTableColumns';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { productStatusOptions, productPublishedOptions } from '@/components/ui/badges/badge-status';
import { bookId } from '@/schemas/books.schema';

const PAGE_SIZE = 10;

export default function BooksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('');
  const [status, setStatus] = useState('all');
  const [published, setPublished] = useState('all');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);

  const hasActiveFilters = search !== '' || status !== 'all' || published !== 'all';

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      sort,
      is_active: status === 'all' ? 'all' : status === 'active' ? 'true' : 'false',
      is_published: published === 'all' ? 'all' : published === 'published' ? 'true' : 'false',
    }),
    [debouncedSearch, sort, status, published],
  );

  const isCompact = useIsCompact();
  const { data, isLoading, isError, error, refetch } = useBooks(page, filters, {
    enabled: isCompact === false,
  });
  const mobile = useBooksInfinite(filters, { enabled: isCompact === true });
  const { mutate: removeBook, isPending: isDeleting } = useDeleteBook();

  const columns = useBookTableColumns({
    openDeleteModal: (id) => {
      setBookToDelete(id);
      setIsDeleteModalOpen(true);
    },
  });

  function handleSort(field: string) {
    setSort(field);
    setPage(1);
  }

  function confirmDelete() {
    if (!bookToDelete) return;
    removeBook(bookToDelete, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setBookToDelete(null);
      },
      // A 400 here means customers own it. The toast carries the backend's message; keep the
      // modal open so "unpublish instead" is still one click away.
    });
  }

  const totalPages = data?.data?.count ? Math.ceil(data.data.count / PAGE_SIZE) : 1;

  const toolbarFilters: ToolbarFilter[] = [
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: productStatusOptions,
      placeholder: 'All',
      widthClass: 'w-[140px]',
      onChange: (val) => {
        setStatus(val);
        setPage(1);
      },
    },
    {
      key: 'published',
      label: 'Published',
      value: published,
      options: productPublishedOptions,
      placeholder: 'All',
      widthClass: 'w-[150px]',
      onChange: (val) => {
        setPublished(val);
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Books & eBooks"
        actions={
          <Link href="/books/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Book
            </Button>
          </Link>
        }
      />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search books...',
            onChange: (val) => {
              setSearch(val);
              setPage(1);
            },
          }}
          filters={toolbarFilters}
          onClear={() => {
            setSearch('');
            setStatus('all');
            setPublished('all');
            setPage(1);
          }}
          hasActiveFilters={hasActiveFilters}
          sortColumns={columns}
          sort={sort}
          onSort={handleSort}
        />

        <ResponsiveDataView
          columns={columns}
          data={data?.data?.results || []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
          sort={sort}
          onSort={handleSort}
          mobile={mobile}
          rowKey={(row) => bookId(row)}
          emptyMessage="No books yet"
          emptyHint="Add your first title to make it available on the storefront."
          pagination={
            data?.data ? (
              <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={data.data.count}
                onPageChange={setPage}
              />
            ) : null
          }
        />
      </Card>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete book"
        description="Deleting is blocked once any customer owns this title — ownership is permanent. If you only want it off the storefront, unpublish it instead."
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
      />
    </div>
  );
}
