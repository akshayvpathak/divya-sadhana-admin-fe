'use client';

import { usePaymentQuery } from '@/hooks/queries/usePaymentsQuery';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import dayjs from 'dayjs';

export default function ViewPaymentPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data, isLoading } = usePaymentQuery(id);
  const payment = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isLoading ? <Skeleton className="h-9 w-48" /> : `Payment Details`}
          </h1>
          <p className="text-slate-500 mt-1">Transaction reference and processing information</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      ) : payment && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Transaction & User */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Transaction Info</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Internal Reference</p>
                    <p className="text-sm font-mono text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100 font-bold">
                      {payment.internal_payment_ref}
                    </p>
                  </div>
                  {payment.provider_payment_id && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Gateway ID</p>
                      <p className="text-sm font-mono text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {payment.provider_payment_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">User Details</h3>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {typeof payment.user === 'string' ? payment.user : `${payment.user?.first_name} ${payment.user?.last_name}`}
                    </p>
                    <p className="text-xs text-slate-500">{typeof payment.user === 'object' && payment.user?.email}</p>
                  </div>
                </div>
              </div>

              {(() => {
                const orderObj = (payment as any).order;
                const donationObj = (payment as any).donation;
                return (
                  <>
                    {orderObj && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Associated Order</h3>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Order Details</span>
                          {typeof orderObj === 'object' ? (
                            <div className="space-y-1 text-sm">
                              {orderObj.order_number && (
                                <p>
                                  Order Number:{' '}
                                  <Link href={`/orders/${orderObj.id}`} className="text-indigo-600 hover:underline font-bold">
                                    #{orderObj.order_number}
                                  </Link>
                                </p>
                              )}
                              {orderObj.status && <p className="text-xs text-slate-500 capitalize">Status: {orderObj.status}</p>}
                            </div>
                          ) : (
                            <Link href={`/orders/${orderObj}`} className="text-indigo-600 hover:underline font-bold text-sm font-mono">
                              View Order Details
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {donationObj && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Associated Donation</h3>
                        <div className="space-y-3 text-sm">
                          {typeof donationObj === 'object' ? (
                            <>
                              {donationObj.donation_number && (
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Donation Number</span>
                                  <span className="font-mono text-slate-900 font-bold">{donationObj.donation_number}</span>
                                </div>
                              )}
                              {donationObj.donor_name && (
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Donor</span>
                                  <span className="text-slate-900 font-bold">{donationObj.donor_name}</span>
                                  {donationObj.donor_email && (
                                    <span className="text-xs text-slate-500 block">{donationObj.donor_email}</span>
                                  )}
                                </div>
                              )}
                              {donationObj.campaign_title && (
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Campaign</span>
                                  <span className="text-slate-900">{donationObj.campaign_title}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Donation ID</span>
                              <span className="font-mono text-slate-900">{donationObj}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Right Column: Financial & Status */}
            <div className="space-y-6">
              <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-100 text-white">
                <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-6">Payment Summary</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-indigo-200 font-bold uppercase mb-1">Total Amount</p>
                      <span className="text-4xl font-black tracking-tighter">{payment.amount}</span>
                      <span className="ml-2 text-sm font-bold text-indigo-200 uppercase">{payment.currency}</span>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg ${
                      payment.status === 'SUCCESS' ? 'bg-green-500 text-white' : 'bg-slate-500/50 text-white'
                    }`}>
                      {payment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-indigo-500/50">
                    <div>
                      <p className="text-[10px] text-indigo-200 font-bold uppercase mb-1">Provider</p>
                      <p className="text-sm font-black uppercase">{payment.provider || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-200 font-bold uppercase mb-1">Captured Date</p>
                      <p className="text-sm font-black">
                        {payment.captured_at ? dayjs(payment.captured_at).format('MMM D, YYYY') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Timeline</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Created At</p>
                    <p className="text-sm font-bold text-slate-900">
                      {payment.created_at ? dayjs(payment.created_at).format('MMMM D, YYYY - HH:mm:ss') : 'N/A'}
                    </p>
                  </div>
                  {payment.captured_at && (
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Processed</p>
                      <p className="text-sm font-bold text-green-600">Successfully</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
