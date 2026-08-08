'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Search, X, Check } from 'lucide-react';
import { MultiSelect } from '@/components/common/MultiSelect';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsersListQuery } from '@/hooks/queries/useUsersListQuery';
import { useStatesListQuery } from '@/hooks/queries/useTerritoryQuery';
import {
  usePromoteTrusteeWithTerritoryMutation,
  useUpdateTrusteeWithTerritoryMutation,
  type TerritoryDiff,
} from '@/hooks/queries/useTrusteesQuery';
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

type NetworkRole = PromoteTrusteeWithTerritoryPayload['role'];

/** Existing record the form edits, resolved by the caller before mount. */
export interface TrusteeFormInitial {
  userName: string;
  userEmail: string;
  role: NetworkRole;
  notes: string;
  isActive: boolean;
  /** Current seats, carrying the assignment id so the save can diff them. */
  assignments: { id: string; state_id: string; district_id: string | null }[];
}

interface PromoteTrusteeFormProps {
  mode?: 'create' | 'edit';
  /** Required in edit mode. */
  trusteeId?: string;
  /** Required in edit mode — the form seeds its defaults from this. */
  initial?: TrusteeFormInitial;
}

const ROLE_OPTIONS = [
  { value: 'trustee', label: 'Trustee' },
  { value: 'state_executive', label: 'State Executive' },
  { value: 'district_president', label: 'District President (Jilla President)' },
] as const;

const DEFAULT_VALUES: PromoteTrusteeWithTerritoryPayload = {
  email: '',
  role: 'trustee',
  notes: '',
  assignments: [{ state_id: '', district_id: null }],
};

/** Identity of a seat. Two seats match only if both state and district match. */
const seatKey = (stateId: string, districtId: string | null) =>
  `${stateId}::${districtId ?? ''}`;

export function PromoteTrusteeForm({
  mode = 'create',
  trusteeId,
  initial,
}: PromoteTrusteeFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Not part of the create payload, so this stays outside the zod-resolved form.
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const { data: usersData, isLoading: usersLoading } = useUsersListQuery({
    search: debouncedUserSearch,
    paginate: 8,
  });
  const { data: statesData } = useStatesListQuery({ is_active: 'true' });
  const { mutate: promoteTrustee, isPending: isPromoting } =
    usePromoteTrusteeWithTerritoryMutation();
  const { mutate: updateTrustee, isPending: isSaving } =
    useUpdateTrusteeWithTerritoryMutation();
  const isPending = isPromoting || isSaving;

  const users = useMemo(() => usersData?.data?.results ?? [], [usersData]);
  const states = useMemo(() => statesData?.data?.results ?? [], [statesData]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(promoteTrusteeWithTerritorySchema),
    defaultValues:
      isEdit && initial
        ? {
            email: initial.userEmail,
            role: initial.role,
            notes: initial.notes,
            assignments: initial.assignments.length
              ? initial.assignments.map((a) => ({
                  state_id: a.state_id,
                  district_id: a.district_id,
                }))
              : [{ state_id: '', district_id: null }],
          }
        : DEFAULT_VALUES,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const role = watch('role');
  const assignments = watch('assignments');
  const isDistrictPresident = role === 'district_president';

  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s.id, label: s.name, hint: s.code ?? undefined })),
    [states]
  );

  const selectedStateIds = useMemo(
    () => (assignments ?? []).map((a) => a?.state_id).filter(Boolean) as string[],
    [assignments]
  );

  const writeAssignments = (
    rows: { state_id: string; district_id: string | null }[]
  ) => {
    setValue('assignments', rows, { shouldValidate: false });
    clearErrors('assignments');
  };

  /** Trustee: any of up to three states, order-insensitive. */
  const setStates = (ids: string[]) =>
    writeAssignments(ids.map((id) => ({ state_id: id, district_id: null })));

  /** Single-seat roles. Re-picking the state also drops a stale district. */
  const setSingleState = (ids: string[]) =>
    writeAssignments([{ state_id: ids[0] ?? '', district_id: null }]);

  const setDistrict = (districtId: string) =>
    writeAssignments([
      { state_id: selectedStateIds[0] ?? '', district_id: districtId || null },
    ]);

  // Only wipe the territory when the role genuinely changes — a mount-time
  // reset would clear the seats prefilled in edit mode.
  const prevRole = useRef(role);
  useEffect(() => {
    if (prevRole.current === role) return;
    prevRole.current = role;
    clearErrors('assignments');
    setValue('assignments', [{ state_id: '', district_id: null }], {
      shouldValidate: false,
    });
  }, [role, setValue, clearErrors]);

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

  const handleServerError = (err: unknown, fallback: string) => {
    const applied = applyServerFieldErrors(err, setError, ['email', 'role', 'notes']);
    if (!applied) {
      const message = err instanceof Error ? err.message : fallback;
      setError('root', { type: 'server', message });
    }
  };

  /**
   * Resolve the submitted seats against the ones already on record. Seats are
   * matched on (state, district), so re-pointing a row's state reads as one
   * removal plus one addition — which is all the assignment API can express.
   */
  const buildTerritoryDiff = (values: PromoteTrusteeWithTerritoryPayload): TerritoryDiff => {
    const normalizeDistrict = (districtId: string | null | undefined) =>
      values.role === 'district_president' ? districtId || null : null;

    const finalSeats = values.assignments.map((a) => ({
      state: a.state_id,
      district: normalizeDistrict(a.district_id),
    }));
    const finalKeys = new Set(finalSeats.map((s) => seatKey(s.state, s.district)));

    const existing = new Map(
      (initial?.assignments ?? []).map((a) => [
        seatKey(a.state_id, normalizeDistrict(a.district_id)),
        a.id,
      ])
    );

    return {
      remove: [...existing.entries()].filter(([key]) => !finalKeys.has(key)).map(([, id]) => id),
      create: finalSeats.filter((s) => !existing.has(seatKey(s.state, s.district))),
    };
  };

  const onValid = (values: PromoteTrusteeWithTerritoryPayload) => {
    clearErrors('root');

    if (isEdit && trusteeId) {
      updateTrustee(
        {
          id: trusteeId,
          payload: {
            is_active: isActive,
            notes: values.notes ?? '',
          },
          territory: buildTerritoryDiff(values),
        },
        {
          onSuccess: () => router.push(`/trustees/${trusteeId}`),
          onError: (err) => handleServerError(err, 'Failed to update member'),
        }
      );
      return;
    }

    const payload: PromoteTrusteeWithTerritoryPayload = {
      email: values.email,
      role: values.role,
      notes: values.notes || undefined,
      assignments: values.assignments.map((a) => ({
        state_id: a.state_id,
        district_id: values.role === 'district_president' ? a.district_id || null : null,
      })),
    };
    promoteTrustee(payload, {
      onSuccess: (result) => {
        router.push(result?.trustee?.id ? `/trustees/${result.trustee.id}` : '/trustees');
      },
      onError: (err) => handleServerError(err, 'Failed to appoint member'),
    });
  };

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? 'Member';

  // A single control now stands in for the whole assignments array, so the
  // first row's field errors are the ones to surface against it.
  const rowError = errors.assignments?.[0];
  const stateError = rowError?.state_id?.message;
  const districtError = rowError?.district_id?.message
    ? String(rowError.district_id.message)
    : undefined;

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      {/* Who + which seat — the two required selectors, side by side */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        {/* User */}
        <div className="space-y-2">
          <Label htmlFor="promote-user">
            User {!isEdit && <span className="text-rose-500">*</span>}
          </Label>
          {isEdit ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">
                {initial?.userName || '—'}
              </p>
              <p className="truncate text-xs text-slate-500">{initial?.userEmail}</p>
            </div>
          ) : selectedUser ? (
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
          {errors.email && <p className="text-sm text-rose-500">{errors.email.message}</p>}
        </div>

        {/* Network role */}
        <div className="space-y-2">
          <Label>
            Network role {!isEdit && <span className="text-rose-500">*</span>}
          </Label>
          {isEdit ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {roleLabel}
              </div>
            </>
          ) : (
            <Select
              value={role}
              onValueChange={(val) =>
                setValue('role', (val as NetworkRole) ?? 'trustee', { shouldValidate: false })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role">{roleLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.role && <p className="text-sm text-rose-500">{errors.role.message}</p>}
        </div>
      </div>

      {/* Territory */}
      <div className="space-y-4">
        <div>
          <Label>
            Territory <span className="text-rose-500">*</span>
          </Label>
        </div>

        {/* One control per role: a capped multi-select for trustees, a single
            searchable select otherwise (plus a district for a DP). */}
        {isDistrictPresident ? (
          <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promote-state">State</Label>
              <MultiSelect
                id="promote-state"
                multiple={false}
                options={stateOptions}
                value={selectedStateIds}
                onChange={setSingleState}
                placeholder="Select state"
                searchPlaceholder="Search states..."
                emptyMessage="No states found"
              />
              {stateError && <p className="text-sm text-rose-500">{stateError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="promote-district">District</Label>
              <DistrictInfiniteSelect
                stateId={selectedStateIds[0] ?? ''}
                value={assignments?.[0]?.district_id || ''}
                onChange={setDistrict}
                disabled={!selectedStateIds[0]}
              />
              {districtError && <p className="text-sm text-rose-500">{districtError}</p>}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl space-y-2">
            <Label htmlFor="promote-state">{role === 'trustee' ? 'States' : 'State'}</Label>
            {role === 'trustee' ? (
              <MultiSelect
                id="promote-state"
                options={stateOptions}
                value={selectedStateIds}
                onChange={setStates}
                max={3}
                placeholder="Select states"
                searchPlaceholder="Search states..."
                emptyMessage="No states found"
              />
            ) : (
              <MultiSelect
                id="promote-state"
                multiple={false}
                options={stateOptions}
                value={selectedStateIds}
                onChange={setSingleState}
                placeholder="Select state"
                searchPlaceholder="Search states..."
                emptyMessage="No states found"
              />
            )}
            {stateError && <p className="text-sm text-rose-500">{stateError}</p>}
          </div>
        )}

        {typeof errors.assignments?.message === 'string' && (
          <p className="text-sm text-rose-500">{errors.assignments.message}</p>
        )}
      </div>

      {/* Activation — only meaningful on an existing seat */}
      {isEdit && (
        <div className="max-w-2xl space-y-2">
          <Label htmlFor="promote-active">Status</Label>
          <div className="flex items-center gap-2">
            <Switch id="promote-active" checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm text-slate-600">{isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      )}

      {/* Notes — optional, so it sits last */}
      <div className="space-y-2 max-w-2xl">
        <Label htmlFor="promote-notes">Notes</Label>
        <Textarea
          id="promote-notes"
          placeholder="Optional notes..."
          rows={3}
          {...register('notes')}
        />
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
          {isEdit
            ? isPending
              ? 'Saving...'
              : 'Save changes'
            : isPending
              ? 'Appointing...'
              : `Appoint ${roleLabel}`}
        </Button>
      </div>
    </form>
  );
}
