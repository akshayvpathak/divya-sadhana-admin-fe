'use client';

import { useFieldArray, useWatch, Controller, type Control, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inputFieldTypeEnum } from '@/schemas/sadhana-services.schema';

const FIELD_TYPES = inputFieldTypeEnum.options;
const CHOICE_TYPES = ['select', 'radio', 'multiselect'];

// Loose control typing avoids RHF deep-path friction (form uses `as any` resolver).
type Ctrl = Control<any>;
type Reg = UseFormRegister<any>;

interface EditorProps {
  control: Ctrl;
  register: Reg;
  readOnly?: boolean;
}

function OptionsEditor({
  control,
  register,
  parentName,
  readOnly,
}: {
  control: Ctrl;
  register: Reg;
  parentName: string;
  readOnly?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: parentName });
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Options</Label>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '', label: '' })}>
            <Plus className="h-3 w-3" /> Add option
          </Button>
        )}
      </div>
      {fields.length === 0 && <p className="text-xs text-slate-400">No options yet.</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="flex items-center gap-2">
          <Input placeholder="value" {...register(`${parentName}.${i}.value`)} disabled={readOnly} />
          <Input placeholder="label" {...register(`${parentName}.${i}.label`)} disabled={readOnly} />
          {!readOnly && (
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="text-rose-500 shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function InputSchemaRow({
  control,
  register,
  index,
  total,
  remove,
  move,
  readOnly,
}: {
  control: Ctrl;
  register: Reg;
  index: number;
  total: number;
  remove: (i: number) => void;
  move: (from: number, to: number) => void;
  readOnly?: boolean;
}) {
  const type = useWatch({ control, name: `input_schema.${index}.type` });
  const showOptions = CHOICE_TYPES.includes(type);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Field {index + 1}</span>
        {!readOnly && (
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} onClick={() => move(index, index + 1)}>
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
          <Label>Key</Label>
          <Input placeholder="full_name" {...register(`input_schema.${index}.key`)} disabled={readOnly} />
        </div>
        <div className="space-y-1">
          <Label>Label</Label>
          <Input placeholder="पूरा नाम" {...register(`input_schema.${index}.label`)} disabled={readOnly} />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Controller
            control={control}
            name={`input_schema.${index}.type`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1">
          <Label>Placeholder</Label>
          <Input {...register(`input_schema.${index}.placeholder`)} disabled={readOnly} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name={`input_schema.${index}.required`}
          render={({ field }) => (
            <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={readOnly} />
          )}
        />
        <Label className="cursor-pointer">Required</Label>
      </div>

      {showOptions && (
        <OptionsEditor
          control={control}
          register={register}
          parentName={`input_schema.${index}.options`}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

export default function InputSchemaEditor({ control, register, readOnly }: EditorProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'input_schema' });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Form Fields (input schema)</Label>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ key: '', label: '', type: 'text', required: false, placeholder: '', help_text: '', options: [] })
            }
          >
            <Plus className="h-4 w-4" /> Add field
          </Button>
        )}
      </div>
      {fields.length === 0 && <p className="text-sm text-slate-400">No fields yet.</p>}
      {fields.map((f, index) => (
        <InputSchemaRow
          key={f.id}
          control={control}
          register={register}
          index={index}
          total={fields.length}
          remove={remove}
          move={move}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
