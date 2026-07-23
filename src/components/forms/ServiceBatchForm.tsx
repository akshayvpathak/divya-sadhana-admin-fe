'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { createServiceBatchSchema, CreateServiceBatchPayload } from '@/schemas/service-batches.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useServiceBatchQuery } from '@/hooks/queries/useServiceBatchesQuery';
import { useAllSadhanaServicesQuery } from '@/hooks/queries/useSadhanaServicesQuery';

interface ServiceBatchFormProps {
  batchId?: string;
  onSubmit?: (data: CreateServiceBatchPayload) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export function ServiceBatchForm({ batchId, onSubmit, isPending, readOnly = false }: ServiceBatchFormProps) {
  const { data: fetched } = useServiceBatchQuery(batchId || null);
  const { data: services } = useAllSadhanaServicesQuery();
  const classServices = useMemo(() => (services ?? []).filter((s) => s.category === 'class'), [services]);

  const initialData = useMemo(() => {
    if (!fetched) return undefined;
    return {
      service: fetched.service ?? '',
      title: fetched.title,
      starts_at: fetched.starts_at ? dayjs(fetched.starts_at).format('YYYY-MM-DDTHH:mm') : '',
      ends_at: fetched.ends_at ? dayjs(fetched.ends_at).format('YYYY-MM-DDTHH:mm') : '',
      capacity: fetched.capacity ?? null,
      meet_link: fetched.meet_link ?? '',
      is_open: fetched.is_open ?? true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }, [fetched]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateServiceBatchPayload>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createServiceBatchSchema) as any,
    defaultValues: {
      service: '',
      title: '',
      starts_at: '',
      ends_at: '',
      capacity: null,
      meet_link: '',
      is_open: true,
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const serviceValue = watch('service');
  const isOpen = watch('is_open');

  const submit = (data: CreateServiceBatchPayload) => {
    onSubmit?.({
      ...data,
      starts_at: data.starts_at ? dayjs(data.starts_at).toISOString() : null,
      ends_at: data.ends_at ? dayjs(data.ends_at).toISOString() : null,
    });
  };

  const roClass = readOnly ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-default focus-visible:ring-0' : '';

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="service">Class Service <span className="text-rose-500">*</span></Label>
          <Select value={serviceValue || ''} onValueChange={(v) => setValue('service', v ?? '')} disabled={readOnly}>
            <SelectTrigger id="service" className={readOnly ? 'bg-slate-50 border-slate-200' : 'bg-white'}>
              <SelectValue placeholder="Select class service" />
            </SelectTrigger>
            <SelectContent>
              {classServices.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.service && <p className="text-sm text-rose-500">{errors.service.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title <span className="text-rose-500">*</span></Label>
          <Input id="title" placeholder="Batch title" {...register('title')} disabled={readOnly} className={roClass} />
          {errors.title && <p className="text-sm text-rose-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="starts_at">Starts At</Label>
          <Input id="starts_at" type="datetime-local" {...register('starts_at')} disabled={readOnly} className={roClass} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ends_at">Ends At</Label>
          <Input id="ends_at" type="datetime-local" {...register('ends_at')} disabled={readOnly} className={roClass} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" type="number" min={0} placeholder="optional" {...register('capacity')} disabled={readOnly} className={roClass} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meet_link">Meet Link</Label>
          <Input id="meet_link" placeholder="https://…" {...register('meet_link')} disabled={readOnly} className={roClass} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="is_open" checked={isOpen} onCheckedChange={(v) => setValue('is_open', v)} disabled={readOnly} />
        <Label htmlFor="is_open" className="cursor-pointer">Open for booking</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Link href="/service-batches">
          <Button type="button" variant="outline">
            {readOnly ? 'Back' : 'Cancel'}
          </Button>
        </Link>
        {!readOnly && (
          <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
            {isPending ? 'Processing...' : batchId ? 'Save Batch' : 'Create Batch'}
          </Button>
        )}
      </div>
    </form>
  );
}
