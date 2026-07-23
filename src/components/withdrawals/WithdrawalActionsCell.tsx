'use client';

import { useState } from 'react';
import { Check, X, IndianRupee, CircleX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { WithdrawalReasonDialog } from './WithdrawalReasonDialog';
import { Withdrawal } from '@/schemas/withdrawals.schema';
import {
  useApproveWithdrawalMutation,
  useMarkWithdrawalFailedMutation,
  useMarkWithdrawalPaidMutation,
  useRejectWithdrawalMutation,
} from '@/hooks/queries/useWithdrawalsQuery';

interface WithdrawalActionsCellProps {
  withdrawal: Withdrawal;
}

type ReasonMode = 'reject' | 'fail' | null;

/**
 * Per-status admin actions:
 *   pending  → Approve / Reject
 *   approved → Mark paid / Mark failed
 *   (terminal states: rejected, paid, failed, cancelled) → no actions
 */
export function WithdrawalActionsCell({ withdrawal }: WithdrawalActionsCellProps) {
  const id = String(withdrawal.id);
  const status = (withdrawal.status ?? '').toLowerCase().trim();

  const [approveOpen, setApproveOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [reasonMode, setReasonMode] = useState<ReasonMode>(null);

  const approve = useApproveWithdrawalMutation();
  const reject = useRejectWithdrawalMutation();
  const markPaid = useMarkWithdrawalPaidMutation();
  const markFailed = useMarkWithdrawalFailedMutation();

  const closeReason = () => setReasonMode(null);

  const handleReasonConfirm = (reason: string) => {
    if (reasonMode === 'reject') {
      reject.mutate({ id, reason }, { onSuccess: closeReason });
    } else if (reasonMode === 'fail') {
      markFailed.mutate({ id, reason }, { onSuccess: closeReason });
    }
  };

  const isPending = status === 'pending';
  const isApproved = status === 'approved';

  if (!isPending && !isApproved) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {isPending && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-700 hover:text-emerald-800"
            onClick={() => setApproveOpen(true)}
            disabled={approve.isPending}
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setReasonMode('reject')}
            disabled={reject.isPending}
          >
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </>
      )}

      {isApproved && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-700 hover:text-emerald-800"
            onClick={() => setPaidOpen(true)}
            disabled={markPaid.isPending}
          >
            <IndianRupee className="h-3.5 w-3.5" /> Mark paid
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setReasonMode('fail')}
            disabled={markFailed.isPending}
          >
            <CircleX className="h-3.5 w-3.5" /> Mark failed
          </Button>
        </>
      )}

      <ConfirmModal
        isOpen={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve withdrawal?"
        description="This marks the request as approved and ready for payout. You can still mark it paid or failed afterwards."
        confirmText="Approve"
        disabled={approve.isPending}
        onConfirm={() =>
          approve.mutate(id, { onSuccess: () => setApproveOpen(false) })
        }
      />

      <ConfirmModal
        isOpen={paidOpen}
        onOpenChange={setPaidOpen}
        title="Mark withdrawal as paid?"
        description="Confirm that the payout has been completed for this request."
        confirmText="Mark paid"
        disabled={markPaid.isPending}
        onConfirm={() =>
          markPaid.mutate(id, { onSuccess: () => setPaidOpen(false) })
        }
      />

      <WithdrawalReasonDialog
        open={reasonMode === 'reject'}
        onOpenChange={(open) => !open && closeReason()}
        title="Reject withdrawal"
        description="Provide a reason for rejecting this request. The trustee may see this note."
        confirmText="Reject"
        isPending={reject.isPending}
        onConfirm={handleReasonConfirm}
      />

      <WithdrawalReasonDialog
        open={reasonMode === 'fail'}
        onOpenChange={(open) => !open && closeReason()}
        title="Mark withdrawal as failed"
        description="Provide a reason the payout failed (e.g. invalid bank details)."
        confirmText="Mark failed"
        isPending={markFailed.isPending}
        onConfirm={handleReasonConfirm}
      />
    </div>
  );
}
