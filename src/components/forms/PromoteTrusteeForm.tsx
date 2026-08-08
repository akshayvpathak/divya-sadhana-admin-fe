'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { DistrictInfiniteSelect } from '@/components/forms/DistrictInfiniteSelect';
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

const ROLE_OPTIONS = [
  { value: 'trustee', label: 'Trustee', hint: 'Up to 3 states' },
  { value: 'state_executive', label: 'State Executive', hint: 'Exactly one state' },
  {
    value: 'district_president',
    label: 'District President (Jilla President)',
    hint: 'One state + district',
  },
] as const;

const DEFAULT_VALUES: PromoteTrusteeWithTerritoryPayload = {
  email: '',
  role: 'trustee',
  notes: '',
  assignments: [{ state_id: '', district_id: null }],
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
  } = useForm({
    resolver: zodResolver(promoteTrusteeWithTerritorySchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'assignments',
  });

  const role = watch('role');
  const assignments = watch('assignments');
  const isDistrictPresident = role === 'district_president';
  const canAddState = role === 'trustee' && fields.length < 3;

  const dpStateId = isDistrictPresident ? assignments?.[0]?.state_id || '' : '';

  useEffect(() => {
    // Reset assignment shape when role changes — do not validate yet.
    clearErrors('assignments');
    if (role === 'district_president') {
      replace([{ state_id: '', district_id: null }]);
    } else {
      replace([{ state_id: '', district_id: null }]);
    }
  }, [role, replace, clearErrors]);

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
    const payload: PromoteTrusteeWithTerritoryPayload = {
      email: values.email,
      role: values.role,
      notes: values.notes || undefined,
      assignments: values.assignments.map((a) => ({
        state_id: a.state_id,
        district_id:
          values.role === 'district_president' ? a.district_id || null : null,
      })),
    };
    promoteTrustee(payload, {
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
          'role',
          'notes',
        ]);
        if (!applied) {
          const message = err instanceof Error ? err.message : 'Failed to appoint member';
          setError('root', { type: 'server', message });
        }
      },
    });
  };

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? 'Member';

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      {/* User */}
      <div className="space-y-2 max-w-xl">
        <Label htmlFor="promote-user">
          User <span className="text-rose-500">*</span>
        </Label>
        {selectedUser ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
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
              className="pl-9"
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

      {/* Role + notes */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Network role <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={role}
            onValueChange={(val) =>
              setValue('role', (val as PromoteTrusteeWithTerritoryPayload['role']) ?? 'trustee', {
                shouldValidate: false,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role">{roleLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                  <span className="ml-2 text-xs text-slate-400">{opt.hint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-rose-500">{errors.role.message}</p>}
          <p className="text-xs text-slate-400">
            Rates come from Wallet → Commission Rates, not this form.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promote-notes">Notes</Label>
          <Textarea
            id="promote-notes"
            placeholder="Optional notes..."
            rows={3}
            {...register('notes')}
          />
        </div>
      </div>

      {/* Territory */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label>
              Territory <span className="text-rose-500">*</span>
            </Label>
            <p className="mt-1 text-sm text-slate-500">
              {role === 'district_president'
                ? 'Assign one state and its district.'
                : role === 'state_executive'
                  ? 'Assign exactly one state.'
                  : 'Assign one to three states.'}
            </p>
          </div>
          {canAddState && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => append({ state_id: '', district_id: null })}
            >
              <Plus className="h-4 w-4" /> Add state
            </Button>
          )}
        </div>

        <div className="space-y-3 max-w-2xl">
          {fields.map((field, index) => {
            const currentId = assignments?.[index]?.state_id ?? '';
            const takenIds = (assignments ?? [])
              .map((r, i) => (i === index ? '' : r?.state_id))
              .filter(Boolean) as string[];
            const rowErr = errors.assignments?.[index];
            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={currentId}
                      onValueChange={(val) => {
                        setValue(`assignments.${index}.state_id`, val ?? '', {
                          shouldValidate: false,
                        });
                        if (isDistrictPresident) {
                          setValue(`assignments.${index}.district_id`, null, {
                            shouldValidate: false,
                          });
                          clearErrors(`assignments.${index}.district_id`);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state">
                          {states.find((s) => s.id === currentId)?.name || 'Select state'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
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

                  {isDistrictPresident && (
                    <div className="space-y-2">
                      <Label>District</Label>
                      <DistrictInfiniteSelect
                        stateId={currentId}
                        value={assignments?.[index]?.district_id || ''}
                        onChange={(val) => {
                          setValue(`assignments.${index}.district_id`, val || null, {
                            shouldValidate: false,
                            shouldDirty: true,
                          });
                          clearErrors(`assignments.${index}.district_id`);
                        }}
                        disabled={!currentId}
                      />
                      {rowErr?.district_id && (
                        <p className="text-sm text-rose-500">{String(rowErr.district_id.message)}</p>
                      )}
                    </div>
                  )}
                </div>

                {role === 'trustee' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="justify-self-end text-slate-400 hover:text-rose-600 disabled:opacity-40 sm:mt-8"
                    title="Remove state"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {typeof errors.assignments?.message === 'string' && (
          <p className="text-sm text-rose-500">{errors.assignments.message}</p>
        )}
      </div>

      {errors.root?.message && (
        <p className="text-sm text-rose-500">{errors.root.message}</p>
      )}

      <div className="flex justify-end gap-2 pt-4">
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
          {isPending ? 'Appointing...' : `Appoint ${roleLabel}`}
        </Button>
      </div>
    </form>
  );
}
