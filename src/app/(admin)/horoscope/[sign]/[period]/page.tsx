'use client';

import { useState } from 'react';
import Link from "next/link";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { HoroscopeSeoForm } from "@/components/forms/HoroscopeSeoForm";
import {
  HOROSCOPE_LOCALES,
  HoroscopeLocale,
  HoroscopeSeoPatchPayload,
  LOCALE_LABELS,
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
import { cn } from '@/lib/utils';

export default function HoroscopeSeoEditPage() {
  const params = useParams();
  const signParam = params.sign as string;
  const periodParam = params.period as string;
  const [locale, setLocale] = useState<HoroscopeLocale>('en-IN');

  const sign = isZodiacSign(signParam) ? signParam : null;
  const period = isHoroscopePeriod(periodParam) ? periodParam : null;

  const { data: entry, isLoading, error } = useHoroscopeQuery(sign, period, locale);
  const { mutate: patchSeo, isPending } = usePatchHoroscopeSeoMutation();

  const handleSubmit = (payload: HoroscopeSeoPatchPayload) => {
    if (!entry || !sign || !period) return;
    patchSeo({ id: entry.id, sign, period, locale, payload });
  };

  if (!sign || !period) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-danger/25 bg-danger-tint p-6 text-center sm:p-8">
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
      <div className="mx-auto max-w-3xl rounded-2xl border border-danger/25 bg-danger-tint p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold text-danger-ink">Error loading horoscope</h2>
        <p className="text-danger mt-2">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <p className="mt-2 text-sm text-moon">
          {locale === 'hi-IN'
            ? 'This Hindi row is missing (404). English is a separate entry — switch tabs to edit that instead.'
            : null}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {locale === 'hi-IN' ? (
            <button
              type="button"
              onClick={() => setLocale('en-IN')}
              className="text-gold-press font-medium hover:underline"
            >
              Edit English SEO
            </button>
          ) : null}
          <Link href="/horoscope" className="text-gold-press font-medium hover:underline">
            Back to horoscope grid
          </Link>
        </div>
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

      <div
        className="inline-flex rounded-full border border-line bg-surface p-0.5"
        role="tablist"
        aria-label="SEO language"
      >
        {HOROSCOPE_LOCALES.map((code) => {
          const active = locale === code;
          return (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setLocale(code)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                active
                  ? 'bg-gold-deep text-white'
                  : 'text-moon hover:text-ink',
              )}
            >
              {LOCALE_LABELS[code]}
            </button>
          );
        })}
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-line p-4 sm:p-6">
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
            locale={locale}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}
