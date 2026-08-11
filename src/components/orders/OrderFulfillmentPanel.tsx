'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, RefreshCcw, RotateCcw, Save, Truck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { useUpdateOrderShippingMutation } from '@/hooks/queries/useOrdersQuery';
import {
  courierPartnerOptions,
  shippingStatusChoices,
  type CourierPartner,
  type Order,
  type ShippingStatusChoice,
  type UpdateOrderShippingPayload,
} from '@/schemas/orders.schema';

const PARTNER_LABEL: Record<string, string> = Object.fromEntries(
  courierPartnerOptions.map((o) => [o.value, o.label]),
);

/** Single source for the status dropdown, so options and trigger can't drift. */
const SHIPPING_STATUS_OPTIONS: { value: ShippingStatusChoice; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'rto', label: 'Returned to Sender' },
  { value: 'cancelled', label: 'Shipment Cancelled' },
];

const SHIPPING_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  SHIPPING_STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

const NO_COURIER_LABEL = 'No courier';

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

type Props = {
  order: Order;
  /** Drop the card chrome when rendered as a section of a larger card. */
  embedded?: boolean;
};

export default function OrderFulfillmentPanel({ order, embedded = false }: Props) {
  const { mutate: updateShipping, isPending } = useUpdateOrderShippingMutation();

  const [status, setStatus] = useState<ShippingStatusChoice>('pending');
  const [partner, setPartner] = useState<CourierPartner | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    const s = (order.shipping_status || 'pending').toLowerCase();
    setStatus(
      (shippingStatusChoices as readonly string[]).includes(s)
        ? (s as ShippingStatusChoice)
        : 'pending',
    );
    const p = (order.courier_partner || '').toLowerCase();
    setPartner(
      p === 'india_post' || p === 'anjani' || p === 'other' ? p : '',
    );
    setTrackingNumber(order.tracking_number || '');
  }, [order]);

  const summaryLabel = order.tracking_summary?.shipping_status_label;

  const canDispatch = useMemo(() => {
    return Boolean(partner && trackingNumber.trim());
  }, [partner, trackingNumber]);

  const applyPayload = (payload: UpdateOrderShippingPayload, okMsg?: string) => {
    updateShipping(
      { orderId: order.id, payload },
      {
        onSuccess: () => {
          if (okMsg) toast.success(okMsg);
        },
      },
    );
  };

  const handleDispatch = () => {
    if (!partner) {
      toast.error('Select a courier');
      return;
    }
    if (!trackingNumber.trim()) {
      toast.error('Enter the tracking / docket number');
      return;
    }
    applyPayload(
      {
        shipping_status: 'shipped',
        courier_partner: partner,
        courier_name: PARTNER_LABEL[partner] ?? partner,
        tracking_number: trackingNumber.trim().replace(/\s+/g, ''),
        dispatched_at: order.dispatched_at || nowIso(),
      },
      'Order marked as dispatched',
    );
  };

  const handleMarkDelivered = () => {
    applyPayload(
      {
        shipping_status: 'delivered',
        delivered_at: order.delivered_at || nowIso(),
        ...(order.dispatched_at ? {} : { dispatched_at: nowIso() }),
      },
      'Order marked as delivered',
    );
  };

  const handleMarkRto = () => {
    applyPayload(
      {
        shipping_status: 'rto',
        is_returned: true,
        returned_at: order.returned_at || nowIso(),
      },
      'Order marked as returned to sender',
    );
  };

  const handleCancelShipment = () => {
    applyPayload({ shipping_status: 'cancelled' }, 'Shipment cancelled');
  };

  const handleResetPending = () => {
    applyPayload(
      {
        shipping_status: 'pending',
        is_returned: false,
        returned_at: null,
        delivered_at: null,
        // Keep courier/tracking so ops can re-dispatch without retyping.
      },
      'Shipping reset to pending',
    );
  };

  const handleSave = () => {
    const payload: UpdateOrderShippingPayload = {};

    if (status !== (order.shipping_status || 'pending')) {
      payload.shipping_status = status;
      if (status === 'shipped' && !order.dispatched_at) payload.dispatched_at = nowIso();
      if (status === 'delivered' && !order.delivered_at) payload.delivered_at = nowIso();
      if (status === 'rto') {
        payload.is_returned = true;
        if (!order.returned_at) payload.returned_at = nowIso();
      }
    }

    const nextPartner = partner || '';
    if (nextPartner !== (order.courier_partner || '')) {
      payload.courier_partner = nextPartner as CourierPartner | '';
      payload.courier_name = nextPartner ? PARTNER_LABEL[nextPartner] ?? nextPartner : null;
    }

    const nextTracking = trackingNumber.trim().replace(/\s+/g, '');
    if (nextTracking !== (order.tracking_number || '')) {
      payload.tracking_number = nextTracking;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save');
      return;
    }

    if (payload.shipping_status === 'shipped' || status === 'shipped') {
      if (!(partner || order.courier_partner)) {
        toast.error('Courier is required when status is Dispatched');
        return;
      }
      if (!(nextTracking || order.tracking_number)) {
        toast.error('Tracking number is required when status is Dispatched');
        return;
      }
    }

    applyPayload(payload, "Shipping details updated");
  };

  return (
    <div
      className={cn(
        'space-y-5',
        !embedded && 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Truck className="h-4 w-4" />
            Fulfillment
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Manual courier entry — India Post / Anjani. No Shiprocket sync.
          </p>
        </div>
        <StatusBadge status={order.shipping_status} type="shipping_status" />
      </div>

      {summaryLabel ? (
        <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Customer sees: <span className="font-semibold text-slate-900">{summaryLabel}</span>
          {order.tracking_summary?.estimated_delivery_max
            ? ` · ETA max ${order.tracking_summary.estimated_delivery_max}`
            : null}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Courier</Label>
          <Select
            value={partner || 'none'}
            onValueChange={(v) => setPartner(v && v !== 'none' ? (v as CourierPartner) : '')}
          >
            <SelectTrigger className="bg-white">
              {/* Without children SelectValue prints the raw value ("other"). */}
              <SelectValue placeholder="Select courier">
                {partner ? PARTNER_LABEL[partner] ?? partner : NO_COURIER_LABEL}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{NO_COURIER_LABEL}</SelectItem>
              {courierPartnerOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tracking_number">Tracking / docket number</Label>
          <Input
            id="tracking_number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. EE123456789IN"
            className="font-mono"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Shipping status</Label>
          <Select value={status} onValueChange={(v) => { if (v) setStatus(v as ShippingStatusChoice); }}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select status">
                {SHIPPING_STATUS_LABEL[status] ?? status}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SHIPPING_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick actions sit in their own tray: progression on the left, the two
          exception paths after a divider, and the rarely-wanted reset pushed to
          the far end so it can't be hit by accident. */}
      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick actions
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
            disabled={isPending || !canDispatch}
            onClick={handleDispatch}
          >
            <Truck className="h-3.5 w-3.5" />
            Mark dispatched
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
            disabled={isPending}
            onClick={handleMarkDelivered}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark delivered
          </Button>

          <span aria-hidden className="mx-0.5 hidden h-6 w-px bg-slate-200 sm:block" />

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
            disabled={isPending}
            onClick={handleMarkRto}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Mark RTO
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
            disabled={isPending}
            onClick={handleCancelShipment}
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel shipment
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-slate-500 hover:text-slate-800 sm:ml-auto"
            disabled={isPending}
            onClick={handleResetPending}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset to pending
          </Button>
        </div>
      </div>

      <Button
        className="w-full gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
        disabled={isPending}
        onClick={handleSave}
      >
        <Save className="h-4 w-4" />
        {isPending ? 'Saving…' : 'Save shipping details'}
      </Button>

      <dl className="grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:grid-cols-2">
        <div>
          <dt className="font-semibold uppercase tracking-wide">Dispatched at</dt>
          <dd className="mt-0.5 text-slate-800">{order.dispatched_at || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide">Delivered at</dt>
          <dd className="mt-0.5 text-slate-800">{order.delivered_at || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide">Returned at</dt>
          <dd className="mt-0.5 text-slate-800">{order.returned_at || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide">Courier name</dt>
          <dd className="mt-0.5 text-slate-800">{order.courier_name || PARTNER_LABEL[order.courier_partner || ''] || '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
