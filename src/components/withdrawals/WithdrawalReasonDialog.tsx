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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WithdrawalReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText: string;
  isPending?: boolean;
  /** Called with the trimmed, non-empty reason. */
  onConfirm: (reason: string) => void;
}

/**
 * Prompt for a free-text reason before a destructive withdrawal action
 * (reject / mark failed). The reason is required; the confirm button stays
 * disabled until something is entered.
 */
export function WithdrawalReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  isPending = false,
  onConfirm,
}: WithdrawalReasonDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const trimmed = reason.trim();

  const handleConfirm = () => {
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          <Label htmlFor="withdrawal-reason">Reason</Label>
          <Textarea
            id="withdrawal-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this request is being actioned…"
            className="bg-white"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !trimmed}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isPending ? 'Saving…' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
