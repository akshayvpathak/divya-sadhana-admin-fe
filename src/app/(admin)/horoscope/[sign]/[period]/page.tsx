'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="max-w-3xl mx-auto p-8 text-center bg-rose-50 rounded-2xl border border-rose-200">
        <h2 className="text-xl font-bold text-rose-800">Invalid horoscope route</h2>
        <p className="text-rose-600 mt-2">
          Sign must be one of the twelve zodiac signs and period must be daily, weekly, or monthly.
        </p>
        <Link href="/horoscope" className="mt-4 inline-block text-indigo-600 font-medium hover:underline">
          Back to horoscope grid
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center bg-rose-50 rounded-2xl border border-rose-200">
        <h2 className="text-xl font-bold text-rose-800">Error loading horoscope</h2>
        <p className="text-rose-600 mt-2">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <Link href="/horoscope" className="mt-4 inline-block text-indigo-600 font-medium hover:underline">
          Back to horoscope grid
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/horoscope">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isLoading ? (
              <Skeleton className="h-9 w-72" />
            ) : (
              `${SIGN_LABELS[sign]} · ${PERIOD_LABELS[period]} SEO`
            )}
          </h1>
          <p className="text-slate-500 mt-1">
            Edit search metadata without changing generated reading content.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
