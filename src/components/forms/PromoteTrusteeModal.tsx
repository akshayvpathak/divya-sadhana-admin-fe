'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Search, X, Check, Info } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsersListQuery } from '@/hooks/queries/useUsersListQuery';
import { useStatesListQuery, useCreateAssignmentMutation } from '@/hooks/queries/useTerritoryQuery';
import { usePromoteTrusteeMutation } from '@/hooks/queries/useTrusteesQuery';

interface PromoteTrusteeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedUser {
  id: string;
  email: string;
  name: string;
}

export function PromoteTrusteeModal({ open, onOpenChange }: PromoteTrusteeModalProps) {
  const router = useRouter();

  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [commissionPercent, setCommissionPercent] = useState('15');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { data: usersData, isLoading: usersLoading } = useUsersListQuery({
    search: debouncedUserSearch,
    paginate: 8,
  });
  const { data: statesData } = useStatesListQuery({ is_active: 'true' });
  const { mutate: promoteTrustee, isPending } = usePromoteTrusteeMutation();
  const { mutateAsync: createAssignment } = useCreateAssignmentMutation();

  const users = useMemo(() => usersData?.data?.results ?? [], [usersData]);
  const states = useMemo(() => statesData?.data?.results ?? [], [statesData]);

  // Reset on open.
  useEffect(() => {
    if (open) {
      setUserSearch('');
      setSelectedUser(null);
      setShowResults(false);
      setCommissionPercent('15');
      setState('');
      setDistrict('');
      setNotes('');
      setError('');
    }
  }, [open]);

  const pickUser = (u: { id: string; email: string; first_name: string; last_name: string }) => {
    setSelectedUser({
      id: u.id,
      email: u.email,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email,
    });
    setShowResults(false);
    setUserSearch('');
    setError('');
  };

  const handleSubmit = () => {
    if (!selectedUser) {
      setError('Please select an existing user to promote.');
      return;
    }
    if (!commissionPercent) {
      setError('Commission % is required.');
      return;
    }
    setError('');

    promoteTrustee(
      {
        email: selectedUser.email,
        commission_percent: commissionPercent,
        state: state || undefined,
        district: district || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: async (trustee) => {
          // Also create the Territory Assignment so the trustee actually earns
          // AREA commission for the chosen state. Promotion only sets the
          // descriptive trustee.state; the commission engine keys off assignments.
          // Best-effort — the promotion itself already succeeded.
          const stateId = states.find((s) => s.name === state)?.id;
          if (trustee?.id && stateId) {
            try {
              await createAssignment({
                trustee: trustee.id,
                state: stateId,
                area_commission_percent: commissionPercent || undefined,
                is_active: true,
              });
            } catch {
              /* e.g. state already assigned to another trustee — hook toasts it */
            }
          }
          onOpenChange(false);
          if (trustee?.id) {
            router.push(`/trustees/${trustee.id}`);
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promote User to Trustee</DialogTitle>
          <DialogDescription>
            A referral code + wallet are auto-created. Choosing a state also assigns it for
            area commission; you can add more states later from the trustee page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User search / autocomplete */}
          <div className="space-y-1.5">
            <Label htmlFor="promote-user">User <span className="text-rose-500">*</span></Label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{selectedUser.name}</p>
                  <p className="truncate text-xs text-slate-500">{selectedUser.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedUser(null)}
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
                  placeholder="User"
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
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Info className="h-3 w-3" /> Must be an existing account.
            </p>
          </div>

          {/* Commission % */}
          <div className="space-y-1.5">
            <Label htmlFor="promote-percent">Commission % <span className="text-rose-500">*</span></Label>
            <Input
              id="promote-percent"
              type="number"
              step="0.01"
              placeholder="15"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              min={0}
              className="bg-white"
            />
          </div>

          {/* State + District */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="promote-state">State</Label>
              <Select value={state} onValueChange={(val) => setState(val ?? '')}>
                <SelectTrigger id="promote-state" className="bg-white">
                  <SelectValue placeholder="Select state">{state || 'Select state'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promote-district">District</Label>
              <Input
                id="promote-district"
                placeholder="e.g. Rajkot"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="promote-notes">Notes</Label>
            <Textarea
              id="promote-notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-white"
            />
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? 'Promoting...' : 'Promote Trustee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
