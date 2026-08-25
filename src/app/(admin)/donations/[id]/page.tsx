'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HeartHandshake, User } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Field, NAValue, SectionHeading } from '@/components/common/DetailCard';
import { Card, CardSection } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useDonationQuery } from '@/hooks/queries/useDonationsQuery';
import { formatINR } from '@/lib/currency';
import { formatStamp } from '@/lib/datetime';

export default function DonationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: donation, isLoading, error } = useDonationQuery(id);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 pb-8">
        <PageHeader backHref="/donations" title="Donation" />
        <div className="rounded-2xl border border-danger/25 bg-danger-tint p-6 text-center">
          <h2 className="text-lg font-bold text-danger-ink">Could not load donation</h2>
          <p className="mt-2 text-sm text-danger">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Link
            href="/donations"
            className="mt-4 inline-block font-medium text-gold-press hover:underline"
          >
            Back to donations
          </Link>
        </div>
      </div>
    );
  }

  const campaignTitle =
    donation?.campaign_title ||
    (donation?.campaign && typeof donation.campaign === 'object'
      ? donation.campaign.title
      : null) ||
    (typeof donation?.campaign === 'string' ? donation.campaign : null);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <PageHeader
        backHref="/donations"
        title={
          isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            donation?.donation_number || 'Donation'
          )
        }
      />

      {isLoading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : donation ? (
        <Card divided>
          <div className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-br from-royal via-royal-soft to-royal-deep px-4 py-6 text-white sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Amount
              </p>
              <p className="mt-1 text-4xl font-black tracking-tighter">
                {formatINR(donation.amount)}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase text-white/60">
                {donation.currency || 'INR'}
              </p>
            </div>
            <StatusBadge status={donation.status || ''} type="transaction_status" />
          </div>

          <CardSection>
            <SectionHeading icon={<HeartHandshake className="h-3.5 w-3.5" />}>
              Donation
            </SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Reference">{donation.donation_number || <NAValue />}</Field>
              <Field label="Campaign">{campaignTitle || 'General'}</Field>
              <Field label="Paid at">
                {formatStamp(donation.paid_at) ?? <NAValue />}
              </Field>
              <Field label="Receipt">{donation.receipt_number || <NAValue />}</Field>
              <Field label="State">{donation.state || <NAValue />}</Field>
              <Field label="District">{donation.district || <NAValue />}</Field>
            </div>
          </CardSection>

          <CardSection>
            <SectionHeading icon={<User className="h-3.5 w-3.5" />}>
              Donor
            </SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name">
                {donation.is_anonymous
                  ? 'Anonymous'
                  : donation.donor_name || <NAValue />}
              </Field>
              <Field label="Email">{donation.donor_email || <NAValue />}</Field>
              <Field label="Phone">{donation.donor_phone || <NAValue />}</Field>
              <Field label="Message">{donation.message || <NAValue />}</Field>
            </div>
          </CardSection>
        </Card>
      ) : null}
    </div>
  );
}
