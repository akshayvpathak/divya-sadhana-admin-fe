'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useUpdateTrusteeMutation } from '@/hooks/queries/useTrusteesQuery';

interface EditTrusteeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trusteeId: string;
  initial: { commissionPercent: string; notes: string; isActive: boolean };
}

export function EditTrusteeModal({ open, onOpenChange, trusteeId, initial }: EditTrusteeModalProps) {
  const [commissionPercent, setCommissionPercent] = useState(initial.commissionPercent);
  const [notes, setNotes] = useState(initial.notes);
  const [isActive, setIsActive] = useState(initial.isActive);
  const { mutate: update, isPending } = useUpdateTrusteeMutation();

  useEffect(() => {
    if (open) {
      setCommissionPercent(initial.commissionPercent);
      setNotes(initial.notes);
      setIsActive(initial.isActive);
    }
  }, [open, initial.commissionPercent, initial.notes, initial.isActive]);

  const handleSubmit = () => {
    update(
      { id: trusteeId, payload: { commission_percent: commissionPercent, notes, is_active: isActive } },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Trustee</DialogTitle>
          <DialogDescription>Update the base commission %, active status, and notes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-percent">Commission %</Label>
            <Input
              id="edit-percent"
              type="number"
              step="0.01"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              min={0}
              className="bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="edit-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="edit-active" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-white"
            />
          </div>
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
            {isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
