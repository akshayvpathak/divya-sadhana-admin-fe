'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Sparkles, Image as ImageIcon, Lock, Unlock, Info, CreditCard, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAiReadingQuery } from '@/hooks/queries/useAiReadingsQuery';
import { ReadingStatusBadge } from '@/hooks/tables/useAiReadingsTableColumns';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const resolveReadingImageUrl = (urlOrKey: string | null | undefined): string => {
  if (!urlOrKey) return '';
  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    return urlOrKey;
  }
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.divyasadhana.org/api";
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  let path = urlOrKey;
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  if (path.startsWith('media/')) {
    return `${base}/${path}`;
  }
  return `${base}/media/${path}`;
};

export default function AiReadingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: reading, isLoading, error } = useAiReadingQuery(id);
  const [activeTab, setActiveTab] = useState<'full' | 'teaser'>('full');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!reading?.report?.pdf_download_url) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(reading.report.pdf_download_url);
      if (!response.ok) {
        throw new Error(`Failed to download PDF (HTTP ${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reading.request_number || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report PDF downloaded successfully');
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Download failed, trying fallback:', err);
      try {
        window.open(reading.report.pdf_download_url, '_blank');
        toast.info('Opening report PDF in a new tab');
      } catch (fallbackErr) {
        const errMsg = err.message || 'Failed to download report PDF';
        setDownloadError(errMsg);
        toast.error(errMsg);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center bg-rose-50 rounded-2xl border border-rose-200">
        <h2 className="text-xl font-bold text-rose-800">Error Loading Reading Details</h2>
        <p className="text-rose-600 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <Link href="/ai-readings" className="mt-4 inline-block text-indigo-600 font-medium hover:underline">
          Go back to listing
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Navigation / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/ai-readings">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isLoading ? <Skeleton className="h-9 w-64" /> : `Reading Details`}
            </h1>
            <p className="text-slate-500 mt-1">
              {isLoading ? <Skeleton className="h-5 w-48 mt-1" /> : reading?.request_number}
            </p>
          </div>
        </div>
        {!isLoading && reading && (
          <div className="flex items-center gap-2">
            <ReadingStatusBadge status={reading.status} />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      ) : reading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Area: Generated Report (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-slate-900">Generated Report</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {reading.report ? `Report ID: ${reading.report.id}` : 'No report available'}
                    </p>
                  </div>
                </div>
                
                {reading.report && (
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-200/60 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveTab('full')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'full' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Full Report
                      </button>
                      <button
                        onClick={() => setActiveTab('teaser')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'teaser' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Teaser
                      </button>
                    </div>

                    {reading.report.pdf_download_url && (
                      <Button
                        size="sm"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs h-9 font-bold rounded-xl"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {isDownloading ? 'Downloading...' : 'Download PDF'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6">
                {downloadError && (
                  <div className="mb-4 bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 text-xs flex gap-2 items-start">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Download Failed</p>
                      <p className="mt-0.5">{downloadError}</p>
                    </div>
                  </div>
                )}

                {!reading.report ? (
                  <div className="text-center py-12">
                    <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">No report generated</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Current request status is <span className="font-semibold text-indigo-600">{reading.status}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Unlock Status / Quick summary info */}
                    <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <div className="flex items-center gap-3">
                        {reading.report.is_unlocked ? (
                          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                            <Unlock className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            <Lock className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">User Unlock State</span>
                          <span className="text-xs font-bold text-slate-800">
                            {reading.report.is_unlocked 
                              ? `Unlocked at ${dayjs(reading.report.unlocked_at).format('MMM D, YYYY HH:mm')}`
                              : 'Report Locked (Requires payment)'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right sm:text-left">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Report Generation</span>
                        <span className="text-xs font-medium text-slate-700">
                          {dayjs(reading.report.created_at).format('MMM D, YYYY HH:mm:ss')}
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    {reading.report.summary && (
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h4>
                        <blockquote className="border-l-4 border-indigo-500 pl-4 py-1.5 text-sm text-slate-600 italic bg-indigo-50/30 rounded-r-xl">
                          {reading.report.summary}
                        </blockquote>
                      </div>
                    )}

                    {/* Content Renderers */}
                    {activeTab === 'full' && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full HTML Report Content</h4>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                            Admin Override: Always Ungated
                          </span>
                        </div>
                        {reading.report.html_full ? (
                          <iframe
                            srcDoc={`
                              <html>
                                <head>
                                  <style>
                                    body { 
                                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                                      line-height: 1.6; 
                                      color: #334155; 
                                      padding: 16px; 
                                      margin: 0; 
                                    }
                                    h1, h2, h3, h4 { color: #0f172a; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; }
                                    h1 { font-size: 1.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
                                    h2 { font-size: 1.25rem; }
                                    p { margin-bottom: 1rem; }
                                    ul, ol { margin-bottom: 1rem; padding-left: 1.25rem; }
                                    li { margin-bottom: 0.25rem; }
                                  </style>
                                </head>
                                <body>
                                  ${reading.report.html_full}
                                </body>
                              </html>
                            `}
                            className="w-full min-h-[450px] border border-slate-200 rounded-xl bg-white"
                            title="Full Report Preview"
                          />
                        ) : (
                          <p className="text-sm text-slate-400 italic py-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                            No full HTML payload provided in request response
                          </p>
                        )}
                      </div>
                    )}

                    {activeTab === 'teaser' && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Teaser HTML Report Content</h4>
                        {reading.report.html_teaser ? (
                          <iframe
                            srcDoc={`
                              <html>
                                <head>
                                  <style>
                                    body { 
                                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                                      line-height: 1.6; 
                                      color: #334155; 
                                      padding: 16px; 
                                      margin: 0; 
                                    }
                                    h1, h2, h3, h4 { color: #0f172a; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; }
                                    h1 { font-size: 1.25rem; }
                                    p { margin-bottom: 1rem; }
                                  </style>
                                </head>
                                <body>
                                  ${reading.report.html_teaser}
                                </body>
                              </html>
                            `}
                            className="w-full min-h-[350px] border border-slate-200 rounded-xl bg-white"
                            title="Teaser Report Preview"
                          />
                        ) : (
                          <p className="text-sm text-slate-400 italic py-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                            No HTML teaser payload provided in request response
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment unlock logs / ledger */}
            {reading.report?.unlocks && reading.report.unlocks.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-slate-900">Unlock & Payment Ledger</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Razorpay transaction monitoring history</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {reading.report.unlocks.map((unlock) => (
                    <div key={unlock.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {unlock.internal_payment_ref}
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            unlock.status === 'captured' 
                              ? 'bg-green-100 text-green-700' 
                              : unlock.status === 'failed' 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {unlock.status}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {unlock.amount} {unlock.currency}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Order ID</span>
                          <span className="font-mono text-slate-700 break-all">{unlock.provider_order_id || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Payment ID</span>
                          <span className="font-mono text-slate-700 break-all">{unlock.provider_payment_id || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Capture Date</span>
                          <span className="text-slate-700">
                            {unlock.captured_at ? dayjs(unlock.captured_at).format('MMM D, YYYY HH:mm:ss') : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {(unlock.failure_code || unlock.failure_reason) && (
                        <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 text-xs flex gap-2 items-start">
                          <Info className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Transaction Failed: {unlock.failure_code}</p>
                            <p className="mt-0.5">{unlock.failure_reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column / Sidebar: Reading Context & Prominent Image Preview (1/3 width) */}
          <div className="space-y-6">
            
            {/* Reading Context */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Reading Context</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Kind</span>
                    <span className="text-sm font-semibold capitalize text-slate-950">
                      {reading.service_kind.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Price</span>
                    <span className="text-sm font-semibold text-slate-950">
                      {reading.report_unlock_price} {reading.currency}
                    </span>
                  </div>
                </div>

                {/* User Inputs */}
                {reading.input_answers && Object.keys(reading.input_answers).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">User Inputs</span>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-xs">
                      {Object.entries(reading.input_answers).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-0.5">
                          <span className="text-slate-500 capitalize">{key}:</span>
                          <span className="font-semibold text-slate-800">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                <span>Submitted</span>
                <span>{dayjs(reading.created_at).format('MMM D, YYYY HH:mm')}</span>
              </div>
            </div>

            {/* Actual Uploaded Image Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Actual Uploaded Image</span>
                </div>

                {reading.input_image_key ? (
                  <div className="space-y-4">
                    <a
                      href={resolveReadingImageUrl(reading.input_image_key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block group overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={resolveReadingImageUrl(reading.input_image_key)} 
                        alt="User upload"
                        className="w-full h-auto max-h-72 object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        Open Full Image
                      </div>
                    </a>
                    
                    <div className="pt-2 border-t border-slate-150">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Storage Key</span>
                      <span className="text-xs font-mono break-all text-slate-600 block leading-tight mt-1">
                        {reading.input_image_key}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No image provided</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
