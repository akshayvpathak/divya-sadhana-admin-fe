'use client';

import { PromoteTrusteeForm } from '@/components/forms/PromoteTrusteeForm';
import { PageHeader } from '@/components/common/PageHeader';

export default function CreateTrusteePage() {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/trustees"
        title="Appoint network member"
      />

      <div className="bg-surface rounded-2xl shadow-card border border-line p-4 sm:p-6">
        <PromoteTrusteeForm />
      </div>
    </div>
  );
}
