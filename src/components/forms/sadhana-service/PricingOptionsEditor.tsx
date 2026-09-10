'use client';

import { useFieldArray, Controller, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Ctrl = Control<any>;
type Reg = UseFormRegister<any>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p data-slot="form-error" className="text-xs text-danger">{message}</p>;
}

interface EditorProps {
  control: Ctrl;
  register: Reg;
  errors?: FieldErrors;
  readOnly?: boolean;
}

/**
 * Per-row messages. Without these, a blank key or a key with a capital in it failed
 * validation invisibly and the Save button simply did nothing — the error existed in
 * `formState` but nothing on the page rendered it.
 */
type RowErrors = Record<string, { message?: string } | undefined>;

export default function PricingOptionsEditor({ control, register, errors, readOnly }: EditorProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'pricing_options' });
  const arrayError = errors?.pricing_options as
    | ({ root?: { message?: string }; message?: string } & RowErrors[])
    | undefined;
  const rootError = arrayError as { root?: { message?: string }; message?: string } | undefined;
  const rowError = (index: number, field: string): string | undefined =>
    (arrayError?.[index] as RowErrors | undefined)?.[field]?.message;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Pricing Options <span className="text-danger">*</span>
        </Label>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ key: '', label: '', amount: 0, currency: 'INR', note: '', travel_extra: false, duration_days: null })
            }
          >
            <Plus className="h-4 w-4" /> Add option
          </Button>
        )}
      </div>

      {(rootError?.root?.message || rootError?.message) && (
        <p data-slot="form-error" className="text-sm text-danger">{rootError.root?.message || rootError.message}</p>
      )}

      {fields.map((f, index) => (
        <div key={f.id} className="space-y-3 rounded-lg border border-line bg-cream p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moon">Option {index + 1}</span>
            {!readOnly && (
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-danger">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Label <span className="text-danger">*</span></Label>
              <Input placeholder="ट्रस्ट के स्थान पर" {...register(`pricing_options.${index}.label`)} disabled={readOnly} />
              <FieldError message={rowError(index, 'label')} />
            </div>
            <div className="space-y-1">
              <Label>Key <span className="text-danger">*</span></Label>
              <Input placeholder="trust" {...register(`pricing_options.${index}.key`)} disabled={readOnly} />
              <FieldError message={rowError(index, 'key')} />
            </div>
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input type="number" min={0} {...register(`pricing_options.${index}.amount`)} disabled={readOnly} />
              <FieldError message={rowError(index, 'amount')} />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Input {...register(`pricing_options.${index}.currency`)} disabled={readOnly} />
              <FieldError message={rowError(index, 'currency')} />
            </div>
            <div className="space-y-1">
              <Label>Note</Label>
              <Input placeholder="optional (e.g. यात्रा व्यय अलग)" {...register(`pricing_options.${index}.note`)} disabled={readOnly} />
              <FieldError message={rowError(index, 'note')} />
            </div>
            <div className="space-y-1">
              <Label>Duration (days)</Label>
              <Input
                type="number"
                min={0}
                placeholder="subscription only"
                {...register(`pricing_options.${index}.duration_days`)}
                disabled={readOnly}
              />
              <FieldError message={rowError(index, 'duration_days')} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={`pricing_options.${index}.travel_extra`}
              render={({ field }) => (
                <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={readOnly} />
              )}
            />
            <Label className="cursor-pointer">Travel extra (collected offline, not charged online)</Label>
          </div>
        </div>
      ))}
    </div>
  );
}
