'use client';

import { PromoteTrusteeForm } from '@/components/forms/PromoteTrusteeForm';
import { PageHeader } from '@/components/common/PageHeader';

export default function CreateTrusteePage() {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/trustees"
        title="Appoint network member"
        description="Select a user, role, and territory. Referral code and wallet are created automatically."
      />

      <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
        <PromoteTrusteeForm />
      </div>
    </div>
  );
}
