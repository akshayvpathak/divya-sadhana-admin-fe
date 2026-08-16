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
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';

type DotTone = "emerald" | "amber" | "slate";

const DOT_TONES: Record<DotTone, string> = {
  emerald: "bg-success",
  amber: "bg-warning",
  slate: "bg-moon",
};

/**
 * Status marker for a grid cell. Only the dot carries colour — keeping the
 * labels a uniform slate stops three markers from reading as three loud badges.
 */
function StatusDot({ tone, label }: { tone: DotTone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-moon">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_TONES[tone])} />
      {label}
    </span>
  );
}

export default function HoroscopeAdminPage() {
  const { data: gridItems, isLoading, error } = useHoroscopeGridQuery();

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="rounded-xl bg-tint p-2 text-gold-deep">
              <Moon className="h-5 w-5" />
            </span>
            Horoscope SEO
          </span>
        }
        description="Manage meta tags, indexability, OG images, and FAQ for each sign and period."
      />

      {error ? (
        <div className="rounded-xl border border-danger/25 bg-danger-tint p-6 text-danger-ink">
          {error instanceof Error ? error.message : "Failed to load horoscope grid"}
        </div>
      ) : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed border-collapse">
            <thead>
              <tr className="bg-cream">
                <th className="sticky left-0 z-10 w-[150px] bg-cream px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-moon">
                  Sign
                </th>
                {HOROSCOPE_PERIODS.map((period) => (
                  <th
                    key={period}
                    className="border-l border-line px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-moon"
                  >
                    {PERIOD_LABELS[period]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZODIAC_SIGNS.map((sign) => (
                <tr key={sign} className="border-t border-line/60">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-3 align-top">
                    <div className="font-semibold leading-tight text-ink">
                      {SIGN_LABELS[sign]}
                    </div>
                    <div className="mt-0.5 text-sm leading-tight text-moon">
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
                      <td key={period} className="border-l border-line/60 p-0 align-top">
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
                            className="group flex h-full flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-tint/60"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-medium text-charcoal group-hover:text-gold-press">
                                {entry.period_key}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-line transition-colors group-hover:text-gold-press" />
                            </div>

                            {entry.summary ? (
                              <p className="line-clamp-2 text-xs leading-relaxed text-moon">
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
                                ? "text-danger hover:bg-danger-tint"
                                : "text-moon hover:bg-tint/60 hover:text-gold-press"
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
      </Card>
    </div>
  );
}
