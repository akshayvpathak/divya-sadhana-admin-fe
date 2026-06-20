'use client';

import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { DataTablePagination } from '@/components/common/DataTablePagination';
import {
  useAssignmentsListQuery,
  useStatesListQuery,
  useDeleteAssignmentMutation,
} from '@/hooks/queries/useTerritoryQuery';
import { useTrusteesListQuery } from '@/hooks/queries/useTrusteesQuery';
import { useAssignmentTableColumns } from '@/hooks/tables/useAssignmentTableColumns';
import { trusteeDisplayName } from '@/hooks/tables/useTrusteeTableColumns';
import { AssignStateModal } from '@/components/forms/AssignStateModal';
import { Assignment } from '@/schemas/territory.schema';

export default function TerritoryPage() {
  const [page, setPage] = useState(1);
  const [trusteeFilter, setTrusteeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const { data: statesData } = useStatesListQuery({ is_active: 'true' });
  const { data: trusteesData } = useTrusteesListQuery({ page_size: 200 });

  const { data, isLoading } = useAssignmentsListQuery({
    page,
    trustee: trusteeFilter === 'all' ? undefined : trusteeFilter,
    state: stateFilter === 'all' ? undefined : stateFilter,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 'true' : 'false',
  });

  const { mutate: deleteAssignment, isPending: isDeleting } = useDeleteAssignmentMutation();

  const states = statesData?.data?.results ?? [];
  const trustees = trusteesData?.data?.results ?? [];
  const rows = data?.data?.results ?? [];
  const totalPages = data?.data?.count ? Math.ceil(data.data.count / 10) : 1;

  const openCreate = () => {
    setEditing(null);
    setIsAssignOpen(true);
  };
  const openEdit = (a: Assignment) => {
    setEditing(a);
    setIsAssignOpen(true);
  };
  const openDelete = (id: string) => {
    setToDelete(id);
    setIsDeleteOpen(true);
  };
  const confirmDelete = () => {
    if (toDelete) {
      deleteAssignment(toDelete, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setToDelete(null);
        },
      });
    }
  };

  const columns = useAssignmentTableColumns({ openEditModal: openEdit, openDeleteModal: openDelete });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Territory</h1>
          <p className="text-slate-500 mt-1">Area-trustee assignments — who owns which state (15% layer)</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Assign State
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <Select
            value={trusteeFilter}
            onValueChange={(val) => {
              setTrusteeFilter(val || 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-white w-[180px]">
              <SelectValue placeholder="All Trustees">
                {trusteeFilter === 'all'
                  ? 'All Trustees'
                  : (() => {
                      const t = trustees.find((x) => x.id === trusteeFilter);
                      return t ? trusteeDisplayName(t) : 'Trustee';
                    })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trustees</SelectItem>
              {trustees.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {trusteeDisplayName(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stateFilter}
            onValueChange={(val) => {
              setStateFilter(val || 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-white w-[160px]">
              <SelectValue placeholder="All States">
                {stateFilter === 'all'
                  ? 'All States'
                  : states.find((s) => s.id === stateFilter)?.name || 'State'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val || 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="bg-white w-[140px]">
              <SelectValue placeholder="All Statuses">
                {statusFilter === 'active' ? 'Active' : statusFilter === 'inactive' ? 'Inactive' : 'All Statuses'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          emptyMessage="No assignments found"
        />

        {data?.data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.data.count ?? rows.length}
            onPageChange={setPage}
          />
        )}
      </div>

      <AssignStateModal open={isAssignOpen} onOpenChange={setIsAssignOpen} assignment={editing} />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Remove Assignment"
        description="Are you sure you want to remove this area-trustee assignment?"
        onConfirm={confirmDelete}
        confirmText={isDeleting ? 'Removing...' : 'Remove'}
        variant="destructive"
        disabled={isDeleting}
      />
    </div>
  );
}
