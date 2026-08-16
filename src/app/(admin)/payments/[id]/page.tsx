'use client';

import { usePaymentQuery } from '@/hooks/queries/usePaymentsQuery';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  Clock,
  Hash,
  Heart,
  Landmark,
  ReceiptText,
  ShoppingBag,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableAvatar } from '@/components/common/TableAvatar';
import { formatINR } from '@/lib/currency';
import { formatStamp } from '@/lib/datetime';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Field,
  MonoValue,
  NAValue,
  SectionHeading,
} from '@/components/common/DetailCard';
import { Card } from '@/components/ui/card';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ViewPaymentPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: payment, isLoading } = usePaymentQuery(id);

  const orderObj = (payment as any)?.order;
  const donationObj = (payment as any)?.donation;

  const userName =
    typeof payment?.user === 'string'
      ? payment.user
      : `${payment?.user?.first_name ?? ''} ${payment?.user?.last_name ?? ''}`.trim();
  const userEmail = typeof payment?.user === 'object' ? payment?.user?.email : '';

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/payments"
        title="Payment Details"
        description="Transaction reference and processing information"
      />

      {isLoading ? (
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      ) : payment ? (
        // One card with divided sections — the old two-column layout left the
        // right side short and the left side stacked with near-empty cards.
        <Card divided>
          <div className="h-1 shrink-0 bg-gradient-to-r from-saffron via-gold to-gold-deep" />

          {/* Hero: the amount is what this page is about. Royal rather than
              gold — a gold amount on a gold band has no figure/ground. */}
          <div className="bg-gradient-to-br from-royal via-royal-soft to-royal-deep px-6 py-7 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                  Total Amount
                </p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter">
                    {formatINR(payment.amount)}
                  </span>
                  <span className="text-sm font-bold uppercase text-white/60">
                    {payment.currency}
                  </span>
                </p>
              </div>
              <StatusBadge status={payment.status || ''} type="transaction_status" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/15 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">
                  Provider
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold uppercase">
                  <Landmark className="h-3.5 w-3.5 text-white/60" />
                  {payment.provider || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">
                  Initiated
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  {formatStamp(payment.created_at) ?? (
                    <span className="text-white/60">Unknown</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* References + who paid */}
          <div className="grid grid-cols-1 gap-x-10 gap-y-6 px-6 py-5 lg:grid-cols-2">
            <div className="space-y-4">
              <SectionHeading icon={<ReceiptText className="h-3.5 w-3.5" />}>
                Transaction Info
              </SectionHeading>
              <Field label="Internal Reference">
                {payment.internal_payment_ref ? (
                  <MonoValue tone="gold">{payment.internal_payment_ref}</MonoValue>
                ) : null}
              </Field>
              <Field label="Gateway ID">
                {payment.provider_payment_id ? (
                  <MonoValue>{payment.provider_payment_id}</MonoValue>
                ) : null}
              </Field>
            </div>

            <div className="space-y-4">
              <SectionHeading icon={<User className="h-3.5 w-3.5" />}>
                User Details
              </SectionHeading>
              {userName || userEmail ? (
                <div className="flex items-center gap-3">
                  <TableAvatar name={userName || userEmail || '?'} className="h-11 w-11 text-sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {userName || <NAValue />}
                    </p>
                    <p className="truncate text-xs text-moon">{userEmail}</p>
                  </div>
                </div>
              ) : (
                <NAValue />
              )}
            </div>
          </div>

          {/* What the payment is for */}
          {(orderObj || donationObj) && (
            <div className="grid grid-cols-1 gap-x-10 gap-y-6 px-6 py-5 lg:grid-cols-2">
              {orderObj && (
                <div className="space-y-4">
                  <SectionHeading icon={<ShoppingBag className="h-3.5 w-3.5" />}>
                    Associated Order
                  </SectionHeading>
                  {typeof orderObj === 'object' ? (
                    <div className="space-y-3">
                      {orderObj.order_number && (
                        <Field label="Order Number">
                          <Link
                            href={`/orders/${orderObj.id}`}
                            className="font-bold text-gold-press hover:underline"
                          >
                            #{orderObj.order_number}
                          </Link>
                        </Field>
                      )}
                      {orderObj.status && (
                        <Field label="Order Status">
                          <span className="capitalize text-charcoal">{orderObj.status}</span>
                        </Field>
                      )}
                    </div>
                  ) : (
                    <Field label="Order Details">
                      <Link
                        href={`/orders/${orderObj}`}
                        className="font-bold text-gold-press hover:underline"
                      >
                        View Order Details
                      </Link>
                    </Field>
                  )}
                </div>
              )}

              {donationObj && (
                <div className="space-y-4">
                  <SectionHeading icon={<Heart className="h-3.5 w-3.5" />}>
                    Associated Donation
                  </SectionHeading>
                  {typeof donationObj === 'object' ? (
                    <div className="space-y-3">
                      {donationObj.donation_number && (
                        <Field label="Donation Number">
                          <span className="font-mono font-bold text-ink">
                            {donationObj.donation_number}
                          </span>
                        </Field>
                      )}
                      {donationObj.donor_name && (
                        <Field label="Donor">
                          <span className="font-bold text-ink">
                            {donationObj.donor_name}
                          </span>
                          {donationObj.donor_email && (
                            <span className="block text-xs text-moon">
                              {donationObj.donor_email}
                            </span>
                          )}
                        </Field>
                      )}
                      {donationObj.campaign_title && (
                        <Field label="Campaign">
                          <span className="text-charcoal">{donationObj.campaign_title}</span>
                        </Field>
                      )}
                    </div>
                  ) : (
                    <Field label="Donation ID">
                      <span className="flex items-center gap-1.5 font-mono text-ink">
                        <Hash className="h-3.5 w-3.5 text-moon" />
                        {donationObj}
                      </span>
                    </Field>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-cream px-6 py-5">
            <SectionHeading icon={<Clock className="h-3.5 w-3.5" />}>Timeline</SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Created At">
                {formatStamp(payment.created_at) && (
                  <span className="font-semibold text-ink">
                    {formatStamp(payment.created_at)}
                  </span>
                )}
              </Field>
              <Field label="Captured At">
                {formatStamp(payment.captured_at) && (
                  <span className="font-semibold text-ink">
                    {formatStamp(payment.captured_at)}
                  </span>
                )}
              </Field>
              <Field label="Processed">
                {payment.captured_at ? (
                  <span className="font-semibold text-success">Successfully</span>
                ) : (
                  <span className="font-semibold text-warning-ink">Awaiting capture</span>
                )}
              </Field>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
