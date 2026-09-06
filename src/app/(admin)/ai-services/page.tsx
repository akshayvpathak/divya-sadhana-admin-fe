'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { ListToolbar } from '@/components/common/ListToolbar';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useAiServicesListQuery,
  useAiServicesInfiniteQuery,
} from '@/hooks/queries/useAiServicesQuery';
import {
  useAiServiceTableColumns,
  toAiServiceRow,
  type AiServiceRow,
} from '@/hooks/tables/useAiServiceTableColumns';

const PAGE_SIZE = 10;

/**
 * Pricing only. AI services are created and configured (prompts, models, input schema)
 * outside this panel, so there is deliberately no create or delete action here — this screen
 * exists so the client can set the unlock price and its discount.
 */
export default function AiServicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const filters = { search: debouncedSearch };
  const { data, isLoading, isError, error, refetch } = useAiServicesListQuery({ ...filters, page });
  const mobile = useAiServicesInfiniteQuery(filters);
  const columns = useAiServiceTableColumns();

  const totalPages = data?.data ? Math.ceil(data.data.count / PAGE_SIZE) : 0;

  const rows: AiServiceRow[] = useMemo(
    () => (data?.data?.results ?? []).map(toAiServiceRow),
    [data],
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="AI Services" />

      <Card>
        <ListToolbar
          search={{
            value: search,
            placeholder: 'Search AI services...',
            onChange: (val) => {
              setSearch(val);
              setPage(1);
            },
          }}
          onClear={() => {
            setSearch('');
            setPage(1);
          }}
          hasActiveFilters={search !== ''}
        />

        <ResponsiveDataView
          columns={columns}
          data={rows}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => void refetch()}
          mobile={mobile}
          emptyMessage="No AI services found"
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
    </div>
  );
}
