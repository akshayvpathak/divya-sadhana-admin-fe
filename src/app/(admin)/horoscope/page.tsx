'use client';

import Link from "next/link";
import {
  HOROSCOPE_PERIODS,
  PERIOD_LABELS,
  SIGN_LABELS,
  ZODIAC_SIGNS,
} from "@/schemas/horoscope.schema";
import { useHoroscopeGridQuery } from "@/hooks/queries/useHoroscopeQuery";
import { Skeleton } from "@/components/ui/skeleton";
import { Moon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HoroscopeAdminPage() {
  const { data: gridItems, isLoading, error } = useHoroscopeGridQuery();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Moon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Horoscope SEO
            </h1>
            <p className="text-slate-500 mt-1">
              Manage meta tags, indexability, OG images, and FAQ for each sign and period.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error instanceof Error ? error.message : "Failed to load horoscope grid"}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Sign
                </th>
                {HOROSCOPE_PERIODS.map((period) => (
                  <th
                    key={period}
                    className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {PERIOD_LABELS[period]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZODIAC_SIGNS.map((sign) => (
                <tr key={sign} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-4 align-top">
                    <div className="font-semibold text-slate-900">
                      {SIGN_LABELS[sign]}
                    </div>
                  </td>
                  {HOROSCOPE_PERIODS.map((period) => {
                    const cell = gridItems?.find(
                      (item) => item.sign === sign && item.period === period
                    );
                    const href = `/horoscope/${sign}/${period}`;

                    return (
                      <td key={period} className="px-4 py-4 align-top">
                        {isLoading ? (
                          <Skeleton className="h-24 w-full rounded-lg" />
                        ) : cell?.entry ? (
                          <Link
                            href={href}
                            className="block rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-xs font-mono text-slate-500">
                                {cell.entry.period_key}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                            </div>
                            <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                              {cell.entry.summary || "No summary"}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {cell.entry.stale ? (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                  Stale
                                </span>
                              ) : null}
                              {cell.entry.is_indexable === false ? (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                  Noindex
                                </span>
                              ) : null}
                              {(cell.entry.meta_title || cell.entry.meta_description) ? (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  SEO set
                                </span>
                              ) : null}
                            </div>
                          </Link>
                        ) : (
                          <Link
                            href={href}
                            className={cn(
                              "block rounded-xl border border-dashed p-3 text-sm transition-colors",
                              cell?.error
                                ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/30"
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
