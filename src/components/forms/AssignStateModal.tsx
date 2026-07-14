'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useStatesListQuery, useCreateAssignmentMutation, useUpdateAssignmentMutation } from '@/hooks/queries/useTerritoryQuery';
import { useTrusteesListQuery } from '@/hooks/queries/useTrusteesQuery';
import { trusteeDisplayName } from '@/hooks/tables/useTrusteeTableColumns';
import { Assignment } from '@/schemas/territory.schema';

interface AssignStateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fixed trustee (inline use on the trustee detail page). */
  trusteeId?: string;
  trusteeLabel?: string;
  /** When provided, the modal edits an existing assignment (% / active only). */
  assignment?: Assignment | null;
  onSuccess?: () => void;
}

export function AssignStateModal({
  open,
  onOpenChange,
  trusteeId,
  trusteeLabel,
  assignment,
  onSuccess,
}: AssignStateModalProps) {
  const isEdit = !!assignment;
  const trusteeFixed = !!trusteeId || isEdit;

  const [trustee, setTrustee] = useState('');
  const [state, setState] = useState('');
  const [percent, setPercent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: statesData } = useStatesListQuery({ is_active: 'true' });
  const { data: trusteesData } = useTrusteesListQuery({ page_size: 200 });

  const { mutate: createAssignment, isPending: isCreating } = useCreateAssignmentMutation();
  const { mutate: updateAssignment, isPending: isUpdating } = useUpdateAssignmentMutation();
  const isPending = isCreating || isUpdating;

  const states = useMemo(() => statesData?.data?.results ?? [], [statesData]);
  const trustees = useMemo(() => trusteesData?.data?.results ?? [], [trusteesData]);

  // Reset form whenever the modal (re)opens.
  useEffect(() => {
    if (open) {
      setTrustee(assignment?.trustee ?? trusteeId ?? '');
      setState(assignment?.state ?? '');
      setPercent(
        assignment?.area_commission_percent !== null &&
          assignment?.area_commission_percent !== undefined
          ? String(assignment.area_commission_percent)
          : ''
      );
      setIsActive(assignment?.is_active ?? true);
    }
  }, [open, assignment, trusteeId]);

  const selectedStateName =
    assignment?.state_name ||
    states.find((s) => s.id === state)?.name ||
    '';

  const fixedTrusteeMatch = trustees.find((t) => t.id === trustee);
  const fixedTrusteeLabel =
    trusteeLabel ||
    assignment?.trustee_email ||
    (fixedTrusteeMatch ? trusteeDisplayName(fixedTrusteeMatch) : '') ||
    'Selected trustee';

  const canSubmit = isEdit ? true : !!trustee && !!state;

  const handleSubmit = () => {
    if (isEdit && assignment) {
      updateAssignment(
        {
          id: assignment.id,
          payload: {
            area_commission_percent: percent ? percent : undefined,
            is_active: isActive,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        }
      );
      return;
    }

    createAssignment(
      {
        trustee,
        state,
        area_commission_percent: percent ? percent : undefined,
        is_active: isActive,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Assignment' : 'Assign Area State'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the territory % or activation for this assignment.'
              : 'Bind a state to its area trustee (earns the territory commission).'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Trustee */}
          {trusteeFixed ? (
            <div className="space-y-1.5">
              <Label>Trustee</Label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {fixedTrusteeLabel}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="assign-trustee">Trustee <span className="text-rose-500">*</span></Label>
              <Select value={trustee} onValueChange={(val) => setTrustee(val ?? '')}>
                <SelectTrigger id="assign-trustee" className="bg-white">
                  <SelectValue placeholder="Select trustee">
                    {trustee
                      ? (() => {
                          const t = trustees.find((x) => x.id === trustee);
                          return t ? trusteeDisplayName(t) : 'Select trustee';
                        })()
                      : 'Select trustee'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {trustees.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {trusteeDisplayName(t)} {t.referral_code ? `· ${t.referral_code}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* State */}
          {isEdit ? (
            <div className="space-y-1.5">
              <Label>State</Label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {selectedStateName || '—'}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="assign-state">State <span className="text-rose-500">*</span></Label>
              <Select value={state} onValueChange={(val) => setState(val ?? '')}>
                <SelectTrigger id="assign-state" className="bg-white">
                  <SelectValue placeholder="Select state">
                    {selectedStateName || 'Select state'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Percent override */}
          <div className="space-y-1.5">
            <Label htmlFor="assign-percent">Area Commission % (optional)</Label>
            <Input
              id="assign-percent"
              type="number"
              step="0.01"
              placeholder="Leave blank for global default (15%)"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              min={0}
              className="bg-white"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2 pt-1">
            <Switch id="assign-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="assign-active" className="cursor-pointer">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
