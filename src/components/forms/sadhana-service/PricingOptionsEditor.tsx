'use client';

import { useFieldArray, Controller, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Ctrl = Control<any>;
type Reg = UseFormRegister<any>;

interface EditorProps {
  control: Ctrl;
  register: Reg;
  errors?: FieldErrors<any>;
  readOnly?: boolean;
}

export default function PricingOptionsEditor({ control, register, errors, readOnly }: EditorProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'pricing_options' });
  const rootError = errors?.pricing_options as { root?: { message?: string }; message?: string } | undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Pricing Options <span className="text-rose-500">*</span>
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
        <p className="text-sm text-rose-500">{rootError.root?.message || rootError.message}</p>
      )}

      {fields.map((f, index) => (
        <div key={f.id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Option {index + 1}</span>
            {!readOnly && (
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Label</Label>
              <Input placeholder="ट्रस्ट के स्थान पर" {...register(`pricing_options.${index}.label`)} disabled={readOnly} />
            </div>
            <div className="space-y-1">
              <Label>Key</Label>
              <Input placeholder="trust" {...register(`pricing_options.${index}.key`)} disabled={readOnly} />
            </div>
            <div className="space-y-1">
              <Label>Amount (₹)</Label>
              <Input type="number" min={0} {...register(`pricing_options.${index}.amount`)} disabled={readOnly} />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Input {...register(`pricing_options.${index}.currency`)} disabled={readOnly} />
            </div>
            <div className="space-y-1">
              <Label>Note</Label>
              <Input placeholder="optional (e.g. यात्रा व्यय अलग)" {...register(`pricing_options.${index}.note`)} disabled={readOnly} />
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
