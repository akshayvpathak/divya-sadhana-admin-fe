'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { HoroscopeSeoForm } from "@/components/forms/HoroscopeSeoForm";
import {
  HoroscopeSeoPatchPayload,
  isHoroscopePeriod,
  isZodiacSign,
  PERIOD_LABELS,
  SIGN_LABELS,
} from "@/schemas/horoscope.schema";
import {
  useHoroscopeQuery,
  usePatchHoroscopeSeoMutation,
} from "@/hooks/queries/useHoroscopeQuery";
import { PageHeader } from '@/components/common/PageHeader';

export default function HoroscopeSeoEditPage() {
  const params = useParams();
  const signParam = params.sign as string;
  const periodParam = params.period as string;

  const sign = isZodiacSign(signParam) ? signParam : null;
  const period = isHoroscopePeriod(periodParam) ? periodParam : null;

  const { data: entry, isLoading, error } = useHoroscopeQuery(sign, period);
  const { mutate: patchSeo, isPending } = usePatchHoroscopeSeoMutation();

  const handleSubmit = (payload: HoroscopeSeoPatchPayload) => {
    if (!entry || !sign || !period) return;
    patchSeo({ id: entry.id, sign, period, payload });
  };

  if (!sign || !period) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center bg-danger-tint rounded-2xl border border-danger/25">
        <h2 className="text-xl font-bold text-danger-ink">Invalid horoscope route</h2>
        <p className="text-danger mt-2">
          Sign must be one of the twelve zodiac signs and period must be daily, weekly, or monthly.
        </p>
        <Link href="/horoscope" className="mt-4 inline-block text-gold-press font-medium hover:underline">
          Back to horoscope grid
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center bg-danger-tint rounded-2xl border border-danger/25">
        <h2 className="text-xl font-bold text-danger-ink">Error loading horoscope</h2>
        <p className="text-danger mt-2">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <Link href="/horoscope" className="mt-4 inline-block text-gold-press font-medium hover:underline">
          Back to horoscope grid
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        backHref="/horoscope"
        title={<>{isLoading ? (
              <Skeleton className="h-9 w-72" />
            ) : (
              `${SIGN_LABELS[sign]} · ${PERIOD_LABELS[period]} SEO`
            )}</>}
      />

      <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
        {isLoading || !entry ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <HoroscopeSeoForm
            entry={entry}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}
