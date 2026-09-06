'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatINR } from '@/lib/currency';
import {
  DISCOUNT_TYPE_LABEL,
  applyDiscount,
  discountAmount,
  discountTypeEnum,
  type DiscountType,
} from '@/schemas/discount.schema';
import { cn } from '@/lib/utils';

/**
 * The pricing/discount block. One component for every screen that sets a price — products,
 * books, sadhana services, AI services — so the wording, the validation and the preview can
 * never disagree between them.
 *
 * Reads the three `discount_*` fields from the surrounding form. `basePrice` is passed in
 * rather than watched, because each screen keeps its price somewhere different (a `price`
 * field, the cheapest book format, the cheapest pricing option).
 */

const TYPES = discountTypeEnum.options;

/**
 * `any` rather than a generic: this block is embedded in four unrelated form models, and
 * react-hook-form's Control is invariant in its field type, so Control<ProductFormData> is not
 * assignable to Control<FieldValues>. PricingOptionsEditor takes the same escape hatch.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface DiscountFieldsProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  /** Current base price, for the live preview. 0/undefined simply hides the preview. */
  basePrice?: number;
  enabled: boolean;
  type: DiscountType;
  value: number;
  /** Names the price the preview is calculated from, e.g. "the printed edition". */
  priceLabel?: string;
  readOnly?: boolean;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function DiscountFields({
  control,
  register,
  errors,
  basePrice,
  enabled,
  type,
  value,
  priceLabel,
  readOnly,
}: DiscountFieldsProps) {
  const base = Number(basePrice) || 0;
  const values = { discount_enabled: enabled, discount_type: type, discount_value: Number(value) || 0 };
  const saved = discountAmount(base, values);
  const final = applyDiscount(base, values);

  const valueError = (errors?.discount_value as { message?: string } | undefined)?.message;
  // A fixed discount at or above the price is legal — it is how you give something away — but
  // it is almost never what someone meant to type, so say so without blocking the save.
  const makesItFree = enabled && base > 0 && final === 0;

  return (
    <div className="space-y-3 rounded-lg border border-line bg-cream p-4">
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="discount_enabled"
          render={({ field }) => (
            <Switch
              id="discount_enabled"
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={readOnly}
            />
          )}
        />
        <Label htmlFor="discount_enabled" className="cursor-pointer">
          Discount enabled
        </Label>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-3 sm:grid-cols-2',
          !enabled && 'pointer-events-none opacity-50',
        )}
        aria-hidden={!enabled}
      >
        <div className="space-y-1">
          <Label htmlFor="discount_type">Discount type</Label>
          <Controller
            control={control}
            name="discount_type"
            render={({ field }) => (
              <Select
                value={(field.value as string) || 'percentage'}
                onValueChange={field.onChange}
                disabled={readOnly || !enabled}
              >
                <SelectTrigger id="discount_type" className="bg-surface">
                  {/* base-ui renders the raw value by default, which would show the enum
                      ("percentage") instead of the wording the admin picked from. */}
                  <SelectValue placeholder="Select type">
                    {DISCOUNT_TYPE_LABEL[(field.value as DiscountType) ?? 'percentage']}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {DISCOUNT_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="discount_value">
            {type === 'fixed' ? 'Discount amount (₹)' : 'Discount percentage (%)'}
          </Label>
          <Input
            id="discount_value"
            type="number"
            min={0}
            max={type === 'percentage' ? 100 : undefined}
            step={type === 'percentage' ? 1 : 0.01}
            placeholder={type === 'fixed' ? '100' : '10'}
            {...register('discount_value')}
            disabled={readOnly || !enabled}
          />
          {valueError && <p className="text-sm text-danger">{valueError}</p>}
        </div>
      </div>

      {enabled && base > 0 ? (
        <div className="space-y-1 rounded-md border border-line bg-surface px-3 py-2.5">
          <div className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="text-moon line-through">{formatINR(base)}</span>
            <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-charcoal">
              {type === 'fixed' ? `${formatINR(saved)} OFF` : `${Number(value) || 0}% OFF`}
            </span>
            <span className="text-charcoal">→</span>
            <span className="text-base font-semibold text-charcoal">{formatINR(final)}</span>
          </div>
          <p className="text-xs text-moon">
            Preview{priceLabel ? ` for ${priceLabel}` : ''}. The final price charged is always
            calculated by the server.
          </p>
          {makesItFree && (
            <p className="text-xs font-medium text-danger">
              This discount makes the item free (₹0).
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
