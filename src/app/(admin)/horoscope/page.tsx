'use client';

import Link from "next/link";
import {
  HOROSCOPE_PERIODS,
  PERIOD_LABELS,
  SIGN_LABELS,
  SIGN_LABELS_HI,
  ZODIAC_SIGNS,
} from "@/schemas/horoscope.schema";
import { useHoroscopeGridQuery } from "@/hooks/queries/useHoroscopeQuery";
import { Skeleton } from "@/components/ui/skeleton";
import { Moon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type DotTone = "emerald" | "amber" | "slate";

const DOT_TONES: Record<DotTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
};

/**
 * Status marker for a grid cell. Only the dot carries colour — keeping the
 * labels a uniform slate stops three markers from reading as three loud badges.
 */
function StatusDot({ tone, label }: { tone: DotTone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_TONES[tone])} />
      {label}
    </span>
  );
}

export default function HoroscopeAdminPage() {
  const { data: gridItems, isLoading, error } = useHoroscopeGridQuery();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
          <Moon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Horoscope SEO</h1>
          <p className="text-slate-500 mt-1">
            Manage meta tags, indexability, OG images, and FAQ for each sign and period.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error instanceof Error ? error.message : "Failed to load horoscope grid"}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-10 w-[150px] bg-slate-50 px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Sign
                </th>
                {HOROSCOPE_PERIODS.map((period) => (
                  <th
                    key={period}
                    className="border-l border-slate-200 px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    {PERIOD_LABELS[period]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZODIAC_SIGNS.map((sign) => (
                <tr key={sign} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 align-top">
                    <div className="font-semibold leading-tight text-slate-900">
                      {SIGN_LABELS[sign]}
                    </div>
                    <div className="mt-0.5 text-sm leading-tight text-slate-500">
                     ( {SIGN_LABELS_HI[sign]} )
                    </div>
                  </td>
                  {HOROSCOPE_PERIODS.map((period) => {
                    const cell = gridItems?.find(
                      (item) => item.sign === sign && item.period === period
                    );
                    const href = `/horoscope/${sign}/${period}`;
                    const entry = cell?.entry;
                    const hasSeo = Boolean(entry?.meta_title || entry?.meta_description);

                    return (
                      <td key={period} className="border-l border-slate-100 p-0 align-top">
                        {isLoading ? (
                          <div className="px-4 py-3">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="mt-2 h-3 w-full rounded" />
                            <Skeleton className="mt-2 h-3 w-20 rounded" />
                          </div>
                        ) : entry ? (
                          // The whole cell is the hit area — no inner card, so the
                          // table no longer nests a bordered box inside every cell.
                          <Link
                            href={href}
                            className="group flex h-full flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-indigo-50/60"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-medium text-slate-700 group-hover:text-indigo-700">
                                {entry.period_key}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-600" />
                            </div>

                            {entry.summary ? (
                              <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                                {entry.summary}
                              </p>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <StatusDot
                                tone={hasSeo ? "emerald" : "slate"}
                                label={hasSeo ? "SEO set" : "No SEO"}
                              />
                              {entry.stale ? <StatusDot tone="amber" label="Stale" /> : null}
                              {entry.is_indexable === false ? (
                                <StatusDot tone="slate" label="Noindex" />
                              ) : null}
                            </div>
                          </Link>
                        ) : (
                          <Link
                            href={href}
                            className={cn(
                              "flex h-full items-center px-4 py-3 text-xs font-medium transition-colors",
                              cell?.error
                                ? "text-rose-600 hover:bg-rose-50"
                                : "text-slate-400 hover:bg-indigo-50/60 hover:text-indigo-700"
                            )}
                          >
                            {cell?.error ? "Not generated" : "Edit SEO"}
                          </Link>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
