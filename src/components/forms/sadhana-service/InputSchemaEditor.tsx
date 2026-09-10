'use client';

import {
  useFieldArray,
  useWatch,
  Controller,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form';
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

/**
 * Row/option messages. Every field here is validated (key must be `[a-z0-9_]`, label is
 * required, choice types must carry options) but none of it used to be rendered, so an
 * invalid row made Save do nothing at all with no visible cause.
 */
type ErrLike = { message?: string } | undefined;

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

function OptionsEditor({
  control,
  register,
  parentName,
  errors,
  readOnly,
}: {
  control: Ctrl;
  register: Reg;
  parentName: string;
  errors?: Record<string, unknown> & { message?: string; root?: { message?: string } };
  readOnly?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: parentName });
  const optionError = (i: number, field: string) =>
    ((errors?.[i] as Record<string, ErrLike> | undefined)?.[field])?.message;
  return (
    <div className="space-y-2 rounded-md border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Options</Label>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '', label: '' })}>
            <Plus className="h-3 w-3" /> Add option
          </Button>
        )}
      </div>
      {fields.length === 0 && <p className="text-xs text-moon">No options yet.</p>}
      <FieldError message={errors?.root?.message || errors?.message} />
      {fields.map((f, i) => (
        <div key={f.id} className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <Input placeholder="value" {...register(`${parentName}.${i}.value`)} disabled={readOnly} />
            <FieldError message={optionError(i, 'value')} />
          </div>
          <div className="flex-1 space-y-1">
            <Input placeholder="label" {...register(`${parentName}.${i}.label`)} disabled={readOnly} />
            <FieldError message={optionError(i, 'label')} />
          </div>
          {!readOnly && (
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="text-danger shrink-0">
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
  errors,
  readOnly,
}: {
  control: Ctrl;
  register: Reg;
  index: number;
  total: number;
  remove: (i: number) => void;
  move: (from: number, to: number) => void;
  errors?: Record<string, unknown>;
  readOnly?: boolean;
}) {
  const type = useWatch({ control, name: `input_schema.${index}.type` });
  const showOptions = CHOICE_TYPES.includes(type);
  const fieldError = (field: string) => (errors?.[field] as ErrLike)?.message;

  return (
    <div className="space-y-3 rounded-lg border border-line bg-cream p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-moon">Field {index + 1}</span>
        {!readOnly && (
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} onClick={() => move(index, index + 1)}>
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
          <Label>Key <span className="text-danger">*</span></Label>
          <Input placeholder="full_name" {...register(`input_schema.${index}.key`)} disabled={readOnly} />
          <FieldError message={fieldError('key')} />
        </div>
        <div className="space-y-1">
          <Label>Label <span className="text-danger">*</span></Label>
          <Input placeholder="पूरा नाम" {...register(`input_schema.${index}.label`)} disabled={readOnly} />
          <FieldError message={fieldError('label')} />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Controller
            control={control}
            name={`input_schema.${index}.type`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                <SelectTrigger className="bg-surface">
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
          <FieldError message={fieldError('placeholder')} />
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
          errors={errors?.options as Record<string, unknown> & { message?: string }}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

export default function InputSchemaEditor({ control, register, errors, readOnly }: EditorProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'input_schema' });
  const arrayError = errors?.input_schema as
    | (Record<number, Record<string, unknown>> & { root?: { message?: string }; message?: string })
    | undefined;
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
      {fields.length === 0 && <p className="text-sm text-moon">No fields yet.</p>}
      <FieldError message={arrayError?.root?.message || arrayError?.message} />
      {fields.map((f, index) => (
        <InputSchemaRow
          key={f.id}
          control={control}
          register={register}
          index={index}
          total={fields.length}
          remove={remove}
          move={move}
          errors={arrayError?.[index]}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
