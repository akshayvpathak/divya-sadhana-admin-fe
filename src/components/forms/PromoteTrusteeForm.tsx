'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, X, Check, Info, Plus, Trash2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsersListQuery } from '@/hooks/queries/useUsersListQuery';
import { useStatesListQuery } from '@/hooks/queries/useTerritoryQuery';
import { usePromoteTrusteeWithTerritoryMutation } from '@/hooks/queries/useTrusteesQuery';
import {
  promoteTrusteeWithTerritorySchema,
  PromoteTrusteeWithTerritoryPayload,
} from '@/schemas/trustees.schema';
import { applyServerFieldErrors } from '@/lib/form-errors';

interface SelectedUser {
  id: string;
  email: string;
  name: string;
}

const DEFAULT_VALUES: PromoteTrusteeWithTerritoryPayload = {
  email: '',
  commission_percent: '15',
  district: '',
  notes: '',
  state_assignments: [{ state_id: '', area_commission_percent: '15' }],
};

export function PromoteTrusteeForm() {
  const router = useRouter();

  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { data: usersData, isLoading: usersLoading } = useUsersListQuery({
    search: debouncedUserSearch,
    paginate: 8,
  });
  const { data: statesData } = useStatesListQuery({ is_active: 'true' });
  const { mutate: promoteTrustee, isPending } = usePromoteTrusteeWithTerritoryMutation();

  const users = useMemo(() => usersData?.data?.results ?? [], [usersData]);
  const states = useMemo(() => statesData?.data?.results ?? [], [statesData]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    control,
    formState: { errors },
  } = useForm<PromoteTrusteeWithTerritoryPayload>({
    resolver: zodResolver(promoteTrusteeWithTerritorySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'state_assignments',
  });

  const stateAssignments = watch('state_assignments');

  const pickUser = (u: { id: string; email: string; first_name: string; last_name: string }) => {
    setSelectedUser({
      id: u.id,
      email: u.email,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email,
    });
    setShowResults(false);
    setUserSearch('');
    setValue('email', u.email, { shouldValidate: true });
  };

  const clearUser = () => {
    setSelectedUser(null);
    setValue('email', '', { shouldValidate: false });
  };

  const onValid = (values: PromoteTrusteeWithTerritoryPayload) => {
    clearErrors('root');
    promoteTrustee(
      {
        email: values.email,
        commission_percent: values.commission_percent,
        district: values.district,
        notes: values.notes || undefined,
        state_assignments: values.state_assignments,
      },
      {
        onSuccess: (result) => {
          if (result?.trustee?.id) {
            router.push(`/trustees/${result.trustee.id}`);
          } else {
            router.push('/trustees');
          }
        },
        onError: (err) => {
          const applied = applyServerFieldErrors(err, setError, [
            'email',
            'commission_percent',
            'district',
            'notes',
          ]);
          // Business-rule 400s (e.g. "state already owned by another active
          // trustee") arrive with no field errors — surface them form-level.
          if (!applied) {
            const message = err instanceof Error ? err.message : 'Failed to promote trustee';
            setError('root', { type: 'server', message });
          }
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-8">
      {/* User */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">User</h2>
          <p className="text-sm text-slate-500">Select an existing account to promote.</p>
        </div>
        <div className="space-y-1.5 max-w-xl">
          <Label htmlFor="promote-user">
            User <span className="text-rose-500">*</span>
          </Label>
          {selectedUser ? (
            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{selectedUser.name}</p>
                <p className="truncate text-xs text-slate-500">{selectedUser.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                onClick={clearUser}
                className="text-slate-400 hover:text-rose-600"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="promote-user"
                placeholder="Search by name or email..."
                className="pl-9 bg-white"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                autoComplete="off"
              />
              {showResults && debouncedUserSearch.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {usersLoading ? (
                    <p className="px-3 py-2 text-sm text-slate-400">Searching...</p>
                  ) : users.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-400">No users found</p>
                  ) : (
                    users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => pickUser(u)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {[u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email}
                          </p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                        </div>
                        <Check className="h-4 w-4 shrink-0 text-transparent" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {errors.email ? (
            <p className="text-sm text-rose-500">{errors.email.message}</p>
          ) : (
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Info className="h-3 w-3" /> Must be an existing account.
            </p>
          )}
        </div>
      </section>

      {/* Trustee defaults */}
      <section className="space-y-4 border-t border-slate-100 pt-8">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Trustee defaults</h2>
          <p className="text-sm text-slate-500">
            Base commission and district. A referral code and wallet are created automatically.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div className="space-y-1.5">
            <Label htmlFor="promote-percent">
              Commission % <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="promote-percent"
              type="number"
              step="0.01"
              placeholder="15"
              min={0}
              className="bg-white"
              {...register('commission_percent')}
            />
            {errors.commission_percent && (
              <p className="text-sm text-rose-500">{errors.commission_percent.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promote-district">
              District <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="promote-district"
              placeholder="e.g. Rajkot"
              className="bg-white"
              {...register('district')}
            />
            {errors.district && (
              <p className="text-sm text-rose-500">{errors.district.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-1.5 max-w-xl">
          <Label htmlFor="promote-notes">Notes</Label>
          <Textarea
            id="promote-notes"
            placeholder="Optional notes..."
            rows={3}
            className="bg-white"
            {...register('notes')}
          />
        </div>
      </section>

      {/* Area coverage */}
      <section className="space-y-4 border-t border-slate-100 pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Area coverage <span className="text-rose-500">*</span>
            </h2>
            <p className="text-sm text-slate-500">
              Assign one or more states. Area % overrides the base commission for that state.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() =>
              append({ state_id: '', area_commission_percent: watch('commission_percent') || '' })
            }
          >
            <Plus className="h-4 w-4" /> Add state
          </Button>
        </div>
        <div className="space-y-3 max-w-2xl">
          {fields.map((field, index) => {
            const currentId = stateAssignments?.[index]?.state_id ?? '';
            const takenIds = (stateAssignments ?? [])
              .map((r, i) => (i === index ? '' : r?.state_id))
              .filter(Boolean) as string[];
            const rowErr = errors.state_assignments?.[index];
            return (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Select
                    value={currentId}
                    onValueChange={(val) =>
                      setValue(`state_assignments.${index}.state_id`, val ?? '', {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select state">
                        {states.find((s) => s.id === currentId)?.name || 'Select state'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.id} value={s.id} disabled={takenIds.includes(s.id)}>
                          {s.name} {s.code ? `(${s.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rowErr?.state_id && (
                    <p className="text-sm text-rose-500">{rowErr.state_id.message}</p>
                  )}
                </div>
                <div className="w-28 space-y-1">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Area %"
                    className="bg-white"
                    aria-label={`Area commission percent for state ${index + 1}`}
                    {...register(`state_assignments.${index}.area_commission_percent`)}
                  />
                  {rowErr?.area_commission_percent && (
                    <p className="text-sm text-rose-500">
                      {rowErr.area_commission_percent.message as string}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="mt-1 text-slate-400 hover:text-rose-600 disabled:opacity-40"
                  title="Remove state"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
        {typeof errors.state_assignments?.message === 'string' && (
          <p className="text-sm text-rose-500">{errors.state_assignments.message}</p>
        )}
      </section>

      {errors.root?.message && (
        <p className="text-sm text-rose-500 border-t border-slate-100 pt-4">{errors.root.message}</p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-6">
        <Link href="/trustees">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isPending ? 'Promoting...' : 'Promote Trustee'}
        </Button>
      </div>
    </form>
  );
}
