'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromoteTrusteeForm } from '@/components/forms/PromoteTrusteeForm';

export default function CreateTrusteePage() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Link href="/trustees">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Promote User to Trustee</h1>
          <p className="text-slate-500 mt-1">
            A referral code and wallet are auto-created. Assign states in one step.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <PromoteTrusteeForm />
      </div>
    </div>
  );
}
