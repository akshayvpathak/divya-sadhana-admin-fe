'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/currency';
import {
  useServiceBookingQuery,
  useUpdateServiceBookingMutation,
} from '@/hooks/queries/useServiceBookingsQuery';
import { useAllSadhanaServicesQuery } from '@/hooks/queries/useSadhanaServicesQuery';
import { useServiceBatchesByServiceQuery } from '@/hooks/queries/useServiceBatchesQuery';
import { serviceBookingStatusMap } from '@/components/ui/badges/badge-status';
import { UpdateServiceBookingPayload, ServiceBookingStatus } from '@/schemas/service-bookings.schema';

const STATUS_KEYS = Object.keys(serviceBookingStatusMap);

function renderAnswer(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return v == null ? '—' : String(v);
}

export default function ServiceBookingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: booking, isLoading } = useServiceBookingQuery(id);
  const { data: services } = useAllSadhanaServicesQuery();
  const { mutate: updateBooking, isPending } = useUpdateServiceBookingMutation();

  const service = useMemo(
    () => (services ?? []).find((s) => s.slug === booking?.service_slug),
    [services, booking],
  );
  const { data: batches } = useServiceBatchesByServiceQuery(service?.id ?? null);
  const schema = service?.input_schema ?? [];
  const labelFor = (key: string) =>
    (schema.find((f) => f.key === key)?.label as string) ?? key;

  const [status, setStatus] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [batchId, setBatchId] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [subStart, setSubStart] = useState('');
  const [subEnd, setSubEnd] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);

  useEffect(() => {
    if (!booking) return;
    setStatus(booking.status);
    setScheduledAt(booking.scheduled_at ? dayjs(booking.scheduled_at).format('YYYY-MM-DDTHH:mm') : '');
    setBatchId(booking.batch ?? '');
    setAdminNotes(booking.admin_notes ?? '');
    setSubStart(booking.subscription_start ? dayjs(booking.subscription_start).format('YYYY-MM-DD') : '');
    setSubEnd(booking.subscription_end ? dayjs(booking.subscription_end).format('YYYY-MM-DD') : '');
  }, [booking]);

  const quickStatus = (s: ServiceBookingStatus) => {
    updateBooking({ bookingId: id, payload: { status: s } }, { onSuccess: () => toast.success('Booking updated') });
  };

  const handleSave = () => {
    if (!booking) return;
    const payload: UpdateServiceBookingPayload = {};

    if (status && status !== booking.status) payload.status = status as ServiceBookingStatus;

    const newSched = scheduledAt ? dayjs(scheduledAt).toISOString() : null;
    const oldSched = booking.scheduled_at ?? null;
    const schedChanged = !!newSched !== !!oldSched || (!!newSched && !!oldSched && !dayjs(newSched).isSame(oldSched));
    if (schedChanged) payload.scheduled_at = newSched;

    if ((batchId || null) !== (booking.batch ?? null)) payload.batch_id = batchId || null;
    if ((adminNotes || '') !== (booking.admin_notes ?? '')) payload.admin_notes = adminNotes;
    if ((subStart || null) !== (booking.subscription_start ?? null)) payload.subscription_start = subStart || null;
    if ((subEnd || null) !== (booking.subscription_end ?? null)) payload.subscription_end = subEnd || null;

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save');
      return;
    }
    updateBooking({ bookingId: id, payload }, { onSuccess: () => toast.success('Booking updated') });
  };

  const answerEntries = Object.entries(booking?.answers ?? {});
  const imageUrl = booking?.input_image_url ?? '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/service-bookings">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isLoading ? <Skeleton className="h-9 w-64" /> : 'Booking Details'}
          </h1>
          <p className="mt-1 text-slate-500">Review and manage this service booking</p>
        </div>
      </div>

      {isLoading || !booking ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: booking info */}
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{booking.service_name ?? '—'}</h2>
                  <code className="text-xs text-slate-500">{booking.booking_number}</code>
                </div>
                <StatusBadge status={booking.status} type="service_booking_status" />
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase text-slate-400">Amount</dt>
                  <dd className="font-semibold text-slate-900">{formatINR(booking.amount)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Option</dt>
                  <dd className="text-slate-700">{booking.selected_option_key || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Booker</dt>
                  <dd className="text-slate-700">{booking.booker_name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Contact</dt>
                  <dd className="text-slate-700">{booking.contact_phone || booking.booker_email || '—'}</dd>
                </div>
                {booking.paid_at && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Paid At</dt>
                    <dd className="text-slate-700">{dayjs(booking.paid_at).format('MMM D, YYYY h:mm A')}</dd>
                  </div>
                )}
                {booking.subscription_start && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Subscription</dt>
                    <dd className="text-slate-700">
                      {dayjs(booking.subscription_start).format('MMM D, YYYY')} –{' '}
                      {booking.subscription_end ? dayjs(booking.subscription_end).format('MMM D, YYYY') : '—'}
                    </dd>
                  </div>
                )}
              </dl>

              {answerEntries.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Submitted Details</h3>
                  <dl className="space-y-2 text-sm">
                    {answerEntries.map(([key, val]) => (
                      <div key={key} className="flex gap-2">
                        <dt className="min-w-[40%] text-slate-500">{labelFor(key)}</dt>
                        <dd className="text-slate-800">{renderAnswer(val)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {imageUrl && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Uploaded Photo</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="uploaded" className="max-h-56 rounded-lg object-cover" />
                </div>
              )}

              {booking.payments && booking.payments.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Payments</h3>
                  <ul className="space-y-1.5 text-sm">
                    {booking.payments.map((p, i) => (
                      <li key={p.internal_payment_ref ?? i} className="flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-500">
                          {p.provider_payment_id ?? p.internal_payment_ref ?? '—'}
                        </span>
                        <span className="flex items-center gap-2">
                          {p.amount != null && <span>{formatINR(Number(p.amount))}</span>}
                          {p.status && <StatusBadge status={p.status} type="transaction_status" />}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right: admin action panel */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Manage Booking</h3>

            {booking.status === 'application_review' && (
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={isPending} onClick={() => quickStatus('pending')}>
                  Approve
                </Button>
                <Button variant="outline" className="flex-1" disabled={isPending} onClick={() => setRejectOpen(true)}>
                  Reject
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? '')}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {serviceBookingStatusMap[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Muhurat / Schedule</Label>
              <Input id="scheduled_at" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>

            {service?.category === 'class' && (
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={batchId || 'none'} onValueChange={(v) => setBatchId(v && v !== 'none' ? v : '')}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Assign batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No batch</SelectItem>
                    {(batches ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {service?.category === 'subscription' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="sub_start">Sub. start</Label>
                  <Input id="sub_start" type="date" value={subStart} onChange={(e) => setSubStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_end">Sub. end</Label>
                  <Input id="sub_end" type="date" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin_notes">Admin notes</Label>
              <Textarea id="admin_notes" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>

            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending} onClick={handleSave}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Application"
        description="This will cancel the booking. This action cannot be undone."
        onConfirm={() => {
          quickStatus('cancelled');
          setRejectOpen(false);
        }}
        confirmText="Reject"
        variant="destructive"
      />
    </div>
  );
}
