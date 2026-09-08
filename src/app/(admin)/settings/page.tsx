'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import DiscountFields from '@/components/forms/shared/DiscountFields';
import {
  cartDiscountFormSchema,
  toSiteConfigPayload,
  type CartDiscountFormValues,
} from '@/schemas/site-config.schema';
import { useSiteConfigQuery, useUpdateSiteConfig } from '@/hooks/queries/useSiteConfigQuery';
import { formatINR } from '@/lib/currency';
import { applyDiscount, discountAmount } from '@/schemas/discount.schema';

/** Illustrative cart used by the worked example. Never a real figure. */
const EXAMPLE_SUBTOTAL = 2000;

export default function SettingsPage() {
  const { data: config, isLoading } = useSiteConfigQuery();
  const { mutate: save, isPending } = useUpdateSiteConfig();

  const { control, register, handleSubmit, reset, watch, formState: { errors } } =
    useForm<CartDiscountFormValues>({
      resolver: zodResolver(cartDiscountFormSchema) as any,
      defaultValues: {
        discount_enabled: false,
        discount_type: 'percentage',
        discount_value: 0,
        discount_min_value: 0,
      },
    });

  useEffect(() => {
    if (!config) return;
    reset({
      discount_enabled: config.cart_discount_enabled,
      discount_type: config.cart_discount_type,
      discount_value: config.cart_discount_value,
      discount_min_value: config.cart_discount_min_value,
    });
  }, [config, reset]);

  const enabled = watch('discount_enabled') ?? false;
  const type = watch('discount_type') ?? 'percentage';
  const value = Number(watch('discount_value')) || 0;
  const minValue = Number(watch('discount_min_value')) || 0;

  const preview = { discount_enabled: enabled, discount_type: type, discount_value: value };
  // The example cart must obey the threshold too, or it would promise a saving the shopper
  // would not get (§11.2: below the minimum the discount is enabled but the amount is ₹0).
  const qualifies = EXAMPLE_SUBTOTAL >= minValue;
  const exampleOff = qualifies ? discountAmount(EXAMPLE_SUBTOTAL, preview) : 0;
  const exampleFinal = qualifies ? applyDiscount(EXAMPLE_SUBTOTAL, preview) : EXAMPLE_SUBTOTAL;

  const onSubmit = (values: CartDiscountFormValues) =>
    save(toSiteConfigPayload(values as Parameters<typeof toSiteConfigPayload>[0]));

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Settings" />

      <Card padding="padded">
        <CardHeader>
          <CardTitle>General Cart Discount</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form id="cart-discount-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm text-moon">
                Applies to the whole shop cart, on top of any discount already set on an
                individual product. It does not affect seva bookings, AI readings or donations.
              </p>

              <DiscountFields
                control={control as any}
                register={register as any}
                errors={errors}
                basePrice={EXAMPLE_SUBTOTAL}
                enabled={enabled}
                type={type}
                value={value}
                priceLabel="an example cart"
              />

              {/* Cart-only, so it lives here rather than in the shared DiscountFields block —
                  a minimum has no meaning on a product, book or seva form. */}
              <div className="space-y-1.5">
                <Label htmlFor="discount_min_value">Minimum cart value</Label>
                <Input
                  id="discount_min_value"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  disabled={!enabled}
                  {...register('discount_min_value')}
                />
                <p className="text-xs text-moon">
                  {minValue > 0
                    ? `Carts must reach ${formatINR(minValue)} after item discounts before this applies.`
                    : 'Leave at 0 to apply the discount to every cart, with no minimum.'}
                </p>
                {errors.discount_min_value ? (
                  <p className="text-sm text-danger">
                    {String(errors.discount_min_value.message)}
                  </p>
                ) : null}
              </div>

              {/* The admin thinks in carts, not unit prices, so restate the same maths in
                  the vocabulary of the checkout summary they will see. */}
              {enabled && !qualifies && value > 0 ? (
                <div className="rounded-md border border-line bg-cream px-3 py-2.5 text-sm text-charcoal">
                  A {formatINR(EXAMPLE_SUBTOTAL)} cart would <strong>not</strong> qualify — it is{' '}
                  {formatINR(minValue - EXAMPLE_SUBTOTAL)} short of the {formatINR(minValue)}{' '}
                  minimum. Shoppers see a prompt telling them how much more to add.
                </div>
              ) : null}

              {enabled && exampleOff > 0 ? (
                <div className="space-y-1 rounded-md border border-line bg-cream px-3 py-2.5 text-sm">
                  <div className="flex justify-between text-charcoal">
                    <span>Cart subtotal</span>
                    <span>{formatINR(EXAMPLE_SUBTOTAL)}</span>
                  </div>
                  <div className="flex justify-between text-charcoal">
                    <span>General discount</span>
                    <span>− {formatINR(exampleOff)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1 font-semibold text-charcoal">
                    <span>Final</span>
                    <span>{formatINR(exampleFinal)}</span>
                  </div>
                </div>
              ) : null}
            </form>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" form="cart-discount-form" disabled={isPending || isLoading}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
