'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  CheckCircle2,
  PackageCheck,
  RefreshCcw,
  RotateCcw,
  Save,
  Truck,
  Undo2,
  XCircle,
} from 'lucide-react';
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
import { formatDateTime } from '@/lib/datetime';
import { NAValue } from '@/components/common/DetailCard';
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
        !embedded && 'rounded-2xl border border-line bg-surface p-6 shadow-sm'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-moon">
            <Truck className="h-4 w-4" />
            Fulfillment
          </h3>
          <p className="mt-1 text-xs text-moon">
            Manual courier entry — India Post / Anjani. No Shiprocket sync.
          </p>
        </div>
        <StatusBadge status={order.shipping_status} type="shipping_status" />
      </div>

      {summaryLabel ? (
        <p className="rounded-xl border border-gold/25 bg-tint px-3 py-2 text-xs text-charcoal">
          Customer sees: <span className="font-semibold text-ink">{summaryLabel}</span>
          {order.tracking_summary?.estimated_delivery_max
            ? ` · ETA max ${order.tracking_summary.estimated_delivery_max}`
            : null}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Courier</Label>
          <Select
            value={partner || 'none'}
            onValueChange={(v) => setPartner(v && v !== 'none' ? (v as CourierPartner) : '')}
          >
            <SelectTrigger className="bg-surface">
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

        <div className="space-y-2">
          <Label>Shipping status</Label>
          <Select value={status} onValueChange={(v) => { if (v) setStatus(v as ShippingStatusChoice); }}>
            <SelectTrigger className="bg-surface">
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
      </div>

      {/* Save belongs to the form above it, so it sits directly under it rather
          than below the quick-action tray. Right-aligned at its natural width —
          a full-bleed solid bar read as the loudest thing on the page. */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line/60 pt-4">
        <p className="mr-auto text-xs text-moon">
          Saves the courier, tracking number and status above.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          disabled={isPending}
          onClick={handleSave}
        >
          <Save className="h-3.5 w-3.5" />
          {isPending ? 'Saving…' : 'Save shipping details'}
        </Button>
      </div>

      {/* Quick actions sit in their own tray: progression first, the two
          exception paths after a divider, and the rarely-wanted reset pushed to
          the far end so it can't be hit by accident. Every button is size="sm"
          — mixing sizes here left the row visibly ragged. */}
      <div className="space-y-2.5 rounded-xl border border-line border-l-2 border-l-saffron bg-cream p-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-moon">
            Quick actions
          </p>
          {/* Dispatch is gated on courier + tracking; say so. */}
          {!canDispatch && (
            <p className="text-[11px] text-moon">
              Add a courier and tracking number to dispatch.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 shadow-sm shadow-gold/20"
            disabled={isPending || !canDispatch}
            onClick={handleDispatch}
          >
            <Truck className="h-3.5 w-3.5" />
            Mark dispatched
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-success/30 bg-surface text-success-ink hover:bg-success-tint"
            disabled={isPending}
            onClick={handleMarkDelivered}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark delivered
          </Button>

          <span aria-hidden className="mx-1 hidden h-6 w-px bg-line sm:block" />

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-warning/25 bg-surface text-warning-ink hover:bg-warning-tint"
            disabled={isPending}
            onClick={handleMarkRto}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Mark RTO
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-danger/25 bg-surface text-danger-ink hover:bg-danger-tint"
            disabled={isPending}
            onClick={handleCancelShipment}
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel shipment
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-moon hover:text-ink sm:ml-auto"
            disabled={isPending}
            onClick={handleResetPending}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset to pending
          </Button>
        </div>
      </div>

      {/* Fulfillment milestones as one hairline-divided strip. The old version
          was four label/value pairs floating in a 2-column grid, which at this
          width left a canyon of whitespace between the two halves.
          `gap-px` over a `bg-line` parent draws the 1px rules. */}
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {([
          ['Dispatched at', formatDateTime(order.dispatched_at), Truck],
          ['Delivered at', formatDateTime(order.delivered_at), PackageCheck],
          ['Returned at', formatDateTime(order.returned_at), Undo2],
          [
            'Courier name',
            order.courier_name || PARTNER_LABEL[order.courier_partner || ''] || null,
            Truck,
          ],
        ] as const).map(([label, value, Icon]) => (
          <div key={label} className="bg-surface px-3.5 py-3">
            <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-moon">
              <Icon className="h-3 w-3 shrink-0" aria-hidden />
              {label}
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-ink">
              {value ?? <NAValue />}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
