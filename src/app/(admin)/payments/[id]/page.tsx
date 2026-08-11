'use client';

import { usePaymentQuery } from '@/hooks/queries/usePaymentsQuery';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import dayjs from 'dayjs';

/* eslint-disable @typescript-eslint/no-explicit-any */

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
      {icon}
      {children}
    </h3>
  );
}

/** Label above value, the page's repeating unit. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  );
}

const NA = <span className="text-slate-300">N/A</span>;

function formatStamp(value?: string | null) {
  return value ? dayjs(value).format('MMM D, YYYY · h:mm:ss A') : null;
}

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
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Details</h1>
          <p className="text-slate-500 mt-1">
            Transaction reference and processing information
          </p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      ) : payment ? (
        // One card with divided sections — the old two-column layout left the
        // right side short and the left side stacked with near-empty cards.
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Hero: the amount is what this page is about */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-7 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                  Total Amount
                </p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter">
                    {formatINR(payment.amount)}
                  </span>
                  <span className="text-sm font-bold uppercase text-indigo-200">
                    {payment.currency}
                  </span>
                </p>
              </div>
              <StatusBadge status={payment.status || ''} type="transaction_status" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-indigo-500/40 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-200">
                  Provider
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold uppercase">
                  <Landmark className="h-3.5 w-3.5 text-indigo-200" />
                  {payment.provider || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-200">
                  Captured At
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  {formatStamp(payment.captured_at) ?? (
                    <span className="text-indigo-200">Not captured yet</span>
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
                <p className="break-all rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 font-mono text-xs font-bold text-indigo-700">
                  {payment.internal_payment_ref || '—'}
                </p>
              </Field>
              <Field label="Gateway ID">
                {payment.provider_payment_id ? (
                  <p className="break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                    {payment.provider_payment_id}
                  </p>
                ) : (
                  NA
                )}
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
                    <p className="truncate text-sm font-bold text-slate-900">
                      {userName || NA}
                    </p>
                    <p className="truncate text-xs text-slate-500">{userEmail}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{NA}</p>
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
                            className="font-bold text-indigo-600 hover:underline"
                          >
                            #{orderObj.order_number}
                          </Link>
                        </Field>
                      )}
                      {orderObj.status && (
                        <Field label="Order Status">
                          <span className="capitalize text-slate-700">{orderObj.status}</span>
                        </Field>
                      )}
                    </div>
                  ) : (
                    <Field label="Order Details">
                      <Link
                        href={`/orders/${orderObj}`}
                        className="font-bold text-indigo-600 hover:underline"
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
                          <span className="font-mono font-bold text-slate-900">
                            {donationObj.donation_number}
                          </span>
                        </Field>
                      )}
                      {donationObj.donor_name && (
                        <Field label="Donor">
                          <span className="font-bold text-slate-900">
                            {donationObj.donor_name}
                          </span>
                          {donationObj.donor_email && (
                            <span className="block text-xs text-slate-500">
                              {donationObj.donor_email}
                            </span>
                          )}
                        </Field>
                      )}
                      {donationObj.campaign_title && (
                        <Field label="Campaign">
                          <span className="text-slate-700">{donationObj.campaign_title}</span>
                        </Field>
                      )}
                    </div>
                  ) : (
                    <Field label="Donation ID">
                      <span className="flex items-center gap-1.5 font-mono text-slate-900">
                        <Hash className="h-3.5 w-3.5 text-slate-400" />
                        {donationObj}
                      </span>
                    </Field>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-slate-50/70 px-6 py-5">
            <SectionHeading icon={<Clock className="h-3.5 w-3.5" />}>Timeline</SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Created At">
                <span className="font-semibold text-slate-900">
                  {formatStamp(payment.created_at) ?? NA}
                </span>
              </Field>
              <Field label="Captured At">
                <span className="font-semibold text-slate-900">
                  {formatStamp(payment.captured_at) ?? NA}
                </span>
              </Field>
              <Field label="Processed">
                {payment.captured_at ? (
                  <span className="font-semibold text-emerald-600">Successfully</span>
                ) : (
                  <span className="font-semibold text-amber-600">Awaiting capture</span>
                )}
              </Field>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
