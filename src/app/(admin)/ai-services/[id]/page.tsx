'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import DiscountFields from '@/components/forms/shared/DiscountFields';
import {
  aiServicePricingFormSchema,
  toAiServicePricingPayload,
  type AiServicePricingFormValues,
} from '@/schemas/ai-services.schema';
import { useAiServiceQuery, useUpdateAiService } from '@/hooks/queries/useAiServicesQuery';

/**
 * Pricing only. Prompt templates, model ids and input schemas are configured outside this
 * panel, so editing them here is deliberately not possible — this screen exists so the client
 * can set the unlock price and its discount without a developer.
 */
export default function AiServicePricingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: service, isLoading } = useAiServiceQuery(id);
  const { mutate: update, isPending } = useUpdateAiService();

  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<AiServicePricingFormValues>({
      resolver: zodResolver(aiServicePricingFormSchema) as any,
      defaultValues: {
        report_unlock_price: 0,
        is_active: true,
        discount_enabled: false,
        discount_type: 'percentage',
        discount_value: 0,
      },
    });

  useEffect(() => {
    if (!service) return;
    reset({
      report_unlock_price: service.report_unlock_price,
      is_active: service.is_active,
      discount_enabled: service.discount_enabled,
      discount_type: service.discount_type,
      discount_value: service.discount_value,
    });
  }, [service, reset]);

  const isActive = watch('is_active') ?? true;
  const enabled = watch('discount_enabled') ?? false;
  const type = watch('discount_type') ?? 'percentage';
  const value = Number(watch('discount_value')) || 0;
  const basePrice = Number(watch('report_unlock_price')) || 0;

  const onSubmit = (values: AiServicePricingFormValues) =>
    update(
      { id, data: toAiServicePricingPayload(values as Parameters<typeof toAiServicePricingPayload>[0]) },
      { onSuccess: () => router.push('/ai-services') },
    );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        backHref="/ai-services"
        title={service?.name || 'AI Service'}
        currentLabel="Pricing"
        loading={isLoading}
      />

      <Card padding="padded">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <form id="ai-pricing-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report_unlock_price">Unlock price (₹)</Label>
                  <Input
                    id="report_unlock_price"
                    type="number"
                    min={0}
                    step="0.01"
                    {...register('report_unlock_price')}
                  />
                  {errors.report_unlock_price && (
                    <p className="text-sm text-danger">{errors.report_unlock_price.message}</p>
                  )}
                  <p className="text-xs text-moon">
                    Set 0 to give the full report away — the reading unlocks without payment.
                  </p>
                </div>

                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    id="is_active"
                    checked={isActive}
                    onCheckedChange={(v) => setValue('is_active', v, { shouldDirty: true })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>

              <DiscountFields
                control={control as any}
                register={register as any}
                errors={errors}
                basePrice={basePrice}
                enabled={enabled}
                type={type}
                value={value}
                priceLabel="the unlock price"
              />
            </form>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" form="ai-pricing-form" disabled={isPending || isLoading}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save pricing
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
