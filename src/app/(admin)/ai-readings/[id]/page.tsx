'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Sparkles, Image as ImageIcon, Lock, Unlock, Info, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAiReadingQuery } from '@/hooks/queries/useAiReadingsQuery';
import { ReadingStatusBadge } from '@/hooks/tables/useAiReadingsTableColumns';
import { toast } from 'react-toastify';
import { formatDateTime, formatStamp } from '@/lib/datetime';
import { useMutation } from '@tanstack/react-query';
import { previewService } from '@/services/preview.service';
import { FAILURE_CLASS_META, describeFailure, durationLabel } from '@/lib/reading-failures';
import { PageHeader } from '@/components/common/PageHeader';


export default function AiReadingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: reading, isLoading, error } = useAiReadingQuery(id);
  
  const [activeTab, setActiveTab] = useState<'full' | 'teaser'>('full');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { mutateAsync: fetchPreviewUrlAPI, isPending: isLoadingPreview } = useMutation({
    mutationFn: (payload: { objectKey: string;}) =>
      previewService.generatePreviewUrl(payload.objectKey),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to load image preview.");
    },
  });

  useEffect(() => {
    if (reading?.input_image_key) {
      fetchPreviewUrlAPI({
        objectKey: reading.input_image_key,
      })
        .then((res) => {
          if (res?.data?.url) {
            setPreviewUrl(res.data.url);
            setImageError(false);
          } else {
            setImageError(true);
          }
        })
        .catch(() => {
          // The onError inside useMutation handles the toast automatically!
          setImageError(true);
        });
    }
  }, [reading?.input_image_key, fetchPreviewUrlAPI]);

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

  const handleDownloadImage = async () => {
    if (!reading?.input_image_key) return;
    setIsDownloadingImage(true);
    try {
      const imgUrl = previewUrl;
      if (!imgUrl) throw new Error("Preview URL not available");
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uploaded-reading-image-${reading.request_number || 'image'}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Image file downloaded successfully');
    } catch (err: any) {
      if (previewUrl) {
        window.open(previewUrl, '_blank');
        toast.info('Opening image in a new tab');
      } else {
        toast.error('Image URL is not available');
      }
    } finally {
      setIsDownloadingImage(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center bg-danger-tint rounded-2xl border border-danger/25">
        <h2 className="text-xl font-bold text-danger-ink">Error Loading Reading Details</h2>
        <p className="text-danger mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <Link href="/ai-readings" className="mt-4 inline-block text-gold-press font-medium hover:underline">
          Go back to listing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
        backHref="/ai-readings"
        title={isLoading ? <Skeleton className="h-9 w-64" /> : `Reading Details`}
      />
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
            {/*
              Why it failed, in triage terms. Pre-check rejections are the
              user's photo and are expected; provider errors are ours. The
              duration tells them apart at a glance — a ~2s stop is the
              pre-check, a ~15s one is generation falling over.
            */}
            {reading.status === 'failed' && (() => {
              const meta = describeFailure(reading.failure_code);
              const klass = FAILURE_CLASS_META[meta.klass];
              const took = durationLabel(
                reading.processing_started_at,
                reading.processing_completed_at,
              );
              return (
                <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-moon">
                    <AlertTriangle className="h-4 w-4 text-danger" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Failure Diagnosis
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-lg border px-2 py-1 text-xs font-bold ${klass.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs font-semibold text-moon">{klass.label}</span>
                    <span className="text-line">•</span>
                    <span className="text-xs font-bold text-charcoal">{klass.blame}</span>
                  </div>

                  <p className="mt-3 text-sm text-charcoal">{meta.meaning}</p>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="bg-cream p-3 rounded-xl border border-line">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-moon">
                        Raw code
                      </dt>
                      <dd className="mt-0.5 font-mono text-xs text-ink break-all">
                        {reading.failure_code || '—'}
                      </dd>
                    </div>
                    <div className="bg-cream p-3 rounded-xl border border-line">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-moon">
                        Time to fail
                      </dt>
                      <dd className="mt-0.5 text-xs font-bold text-ink">
                        {took ?? 'Not recorded'}
                      </dd>
                    </div>
                  </dl>

                  {reading.failure_reason && (
                    <div className="mt-3 bg-cream p-3 rounded-xl border border-line">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-moon">
                        Reason shown to the user
                      </p>
                      <p className="mt-1 text-sm text-charcoal">{reading.failure_reason}</p>
                    </div>
                  )}

                  {meta.klass === 'policy' && (
                    <p className="mt-3 text-xs font-semibold text-moon">
                      The storefront intentionally offers no retry for this code.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
              <div className="p-6 border-b border-line bg-cream flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold-press" />
                  <div>
                    <h3 className="font-bold text-ink">Generated Report</h3>
                    <p className="text-xs text-moon mt-0.5">
                      {reading.report ? `Report ID: ${reading.report.id}` : 'No report available'}
                    </p>
                  </div>
                </div>
                
                {reading.report && (
                  <div className="flex items-center gap-3">
                    <div className="flex bg-line p-1 rounded-xl">
                      <button
                        onClick={() => setActiveTab('full')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'full' 
                            ? 'bg-surface text-ink shadow-sm' 
                            : 'text-charcoal hover:text-ink'
                        }`}
                      >
                        Full Report
                      </button>
                      <button
                        onClick={() => setActiveTab('teaser')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeTab === 'teaser' 
                            ? 'bg-surface text-ink shadow-sm' 
                            : 'text-charcoal hover:text-ink'
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
                        className="bg-gold-deep hover:bg-gold-deep text-white flex items-center gap-1.5 text-xs h-9 font-bold rounded-xl"
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
                  <div className="mb-4 bg-danger-tint text-danger-ink p-3 rounded-lg border border-danger/25 text-xs flex gap-2 items-start">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Download Failed</p>
                      <p className="mt-0.5">{downloadError}</p>
                    </div>
                  </div>
                )}

                {!reading.report ? (
                  <div className="text-center py-12">
                    <Info className="h-8 w-8 text-line mx-auto mb-2" />
                    <p className="text-moon font-medium">No report generated</p>
                    <p className="text-xs text-moon mt-1">
                      Current request status is <span className="font-semibold text-gold-press">{reading.status}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Unlock Status / Quick summary info */}
                    <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-cream p-4 rounded-xl border border-line">
                      <div className="flex items-center gap-3">
                        {reading.report.is_unlocked ? (
                          <div className="h-8 w-8 rounded-lg bg-success-tint flex items-center justify-center text-success">
                            <Unlock className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-cosmos flex items-center justify-center text-charcoal">
                            <Lock className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-moon font-bold uppercase block">User Unlock State</span>
                          <span className="text-xs font-bold text-ink">
                            {reading.report.is_unlocked 
                              ? `Unlocked at ${formatDateTime(reading.report.unlocked_at)}`
                              : 'Report Locked (Requires payment)'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right sm:text-left">
                        <span className="text-[10px] text-moon font-bold uppercase block">Report Generation</span>
                        <span className="text-xs font-medium text-charcoal">
                          {formatStamp(reading.report.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    {reading.report.summary && (
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-moon uppercase tracking-wider mb-2">Executive Summary</h4>
                        <blockquote className="border-l-4 border-gold pl-4 py-1.5 text-sm text-charcoal italic bg-tint/30 rounded-r-xl">
                          {reading.report.summary}
                        </blockquote>
                      </div>
                    )}

                    {/* Content Renderers */}
                    {activeTab === 'full' && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold text-moon uppercase tracking-wider">Full HTML Report Content</h4>
                          <span className="bg-warning-tint text-warning-ink text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                            Admin Override: Always Ungated
                          </span>
                        </div>
                        {reading.report.html_full ? (
                          <iframe
                            srcDoc={`
                              <html>
                                <head>
                                  <style>
                                    /* Literal hex, not var(--charcoal): srcDoc is a
                                       separate document, so the app's custom
                                       properties do not cascade in. Keep these in
                                       sync with the ink ramp in globals.css. */
                                    body {
                                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                      line-height: 1.6;
                                      color: #463d52;
                                      padding: 16px;
                                      margin: 0;
                                    }
                                    h1, h2, h3, h4 { color: #1e1526; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; }
                                    h1 { font-size: 1.5rem; border-bottom: 2px solid #e5dced; padding-bottom: 0.5rem; }
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
                            className="w-full min-h-[500px] border border-line rounded-xl bg-surface"
                            title="Full Report Preview"
                          />
                        ) : (
                          <p className="text-sm text-moon italic py-6 text-center bg-cream border border-line rounded-xl">
                            No full HTML payload provided in request response
                          </p>
                        )}
                      </div>
                    )}

                    {activeTab === 'teaser' && (
                      <div>
                        <h4 className="text-xs font-bold text-moon uppercase tracking-wider mb-3">Teaser HTML Report Content</h4>
                        {reading.report.html_teaser ? (
                          <iframe
                            srcDoc={`
                              <html>
                                <head>
                                  <style>
                                    /* Literal hex — see the note on the full-report
                                       iframe above. */
                                    body {
                                      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                      line-height: 1.6;
                                      color: #463d52;
                                      padding: 16px;
                                      margin: 0;
                                    }
                                    h1, h2, h3, h4 { color: #1e1526; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; }
                                    h1 { font-size: 1.25rem; }
                                    p { margin-bottom: 1rem; }
                                  </style>
                                </head>
                                <body>
                                  ${reading.report.html_teaser}
                                </body>
                              </html>
                            `}
                            className="w-full min-h-[350px] border border-line rounded-xl bg-surface"
                            title="Teaser Report Preview"
                          />
                        ) : (
                          <p className="text-sm text-moon italic py-6 text-center bg-cream border border-line rounded-xl">
                            No HTML teaser payload provided in request response
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column / Sidebar: User Inputs & Premium 3:4 Uploaded Image Card */}
          <div className="space-y-6">
            
            {/* User Inputs Card */}
            {reading.input_answers && Object.keys(reading.input_answers).length > 0 && (
              <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-moon">
                  <Sparkles className="h-4 w-4 text-gold-deep" />
                  <span className="text-xs font-bold uppercase tracking-wider">User Inputs</span>
                </div>
                <div className="bg-cream p-4 rounded-xl border border-line text-sm space-y-2">
                  {Object.entries(reading.input_answers).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-line/50 last:border-0 last:pb-0 first:pt-0 flex-col">
                      <span className="text-moon capitalize font-medium">{key}</span>
                      <span className="font-bold text-ink">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actual Uploaded Image Card (Responsive 3:4 frame & download functionality) */}
            <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 text-moon">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Uploaded Image</span>
                </div>

                {reading.input_image_key ? (
                  <div className="space-y-4">
                    <div className="relative group overflow-hidden rounded-2xl border border-line bg-cream aspect-[3/4] shadow-inner flex items-center justify-center">
                      {isLoadingPreview || (!previewUrl && !imageError) ? (
                        <div className="flex flex-col items-center justify-center text-moon w-full h-full p-6 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mb-3 text-gold-deep" />
                          <p className="font-semibold text-charcoal text-sm">Loading Preview...</p>
                        </div>
                      ) : !imageError && previewUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={previewUrl} 
                          alt="User upload"
                          referrerPolicy="no-referrer"
                          onError={() => setImageError(true)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-moon bg-gradient-to-br from-tint/60 via-cream to-tint/40 w-full h-full p-6 text-center">
                          <div className="p-4 bg-tint rounded-full mb-3 text-gold-deep">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                          <p className="font-semibold text-charcoal text-sm">Preview Unavailable</p>
                          <p className="text-xs text-moon max-w-[200px] mt-1">
                            The upload asset is missing or could not be loaded from remote storage.
                          </p>
                        </div>
                      )}
                      
                      {/* Image hover actions overlay */}
                      <div className="absolute inset-0 bg-royal-deep/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                        <a
                          href={previewUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-surface hover:bg-cosmos text-ink px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          Open Full Image
                        </a>
                        <Button
                          size="sm"
                          onClick={handleDownloadImage}
                          disabled={isDownloadingImage}
                          className="bg-gold-deep hover:bg-gold-deep text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
                        >
                          {isDownloadingImage ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          {isDownloadingImage ? 'Downloading...' : 'Download File'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-moon italic">No image provided</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
