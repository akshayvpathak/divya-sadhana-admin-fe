'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, Save, Grid2x2, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useProduct,
  useCreateOptionGroup,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from '@/hooks/useProducts';
import type { ProductOptionGroup, ProductVariant } from '@/schemas/products.schema';

interface ProductVariantsEditorProps {
  productId: string;
  readOnly?: boolean;
}

type DraftValue = { label: string; value: string };
type VariantDraft = {
  sku: string;
  price: string;
  stock_quantity: string;
  is_active: boolean;
};

function slugifyCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/** "flavor" → "Flavor", "net_weight" → "Net Weight". */
function humanizeCode(code: string): string {
  return code
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Admin-facing name for an option group. Prefers the English `code` because
 * `name` is what customers see and is often stored in Hindi (फ्लेवर / वजन).
 */
function groupLabel(g: ProductOptionGroup): string {
  // 'option' is the fallback slugifyCode produces for a name with no Latin
  // characters, so it identifies nothing — prefer the stored name over it.
  if (g.code && g.code !== 'option') return humanizeCode(g.code);
  return g.name || 'Option';
}

function optionValueLabel(g: ProductOptionGroup, valueId: string): string {
  const match = (g.values || []).find((v) => v.id === valueId);
  if (!match) return '';
  return match.label || match.value || '';
}

function variantOptionIds(v: ProductVariant): string[] {
  if (v.option_value_ids?.length) return v.option_value_ids;
  if (v.option_values?.length) return v.option_values;
  return [];
}

function sortedIdKey(ids: string[]): string {
  return [...ids].sort().join('|');
}

function formatVariantLabel(
  v: ProductVariant,
  valueLabelById: Map<string, string>
): string {
  if (v.options && Object.keys(v.options).length > 0) {
    return Object.values(v.options).join(' · ');
  }
  return (
    variantOptionIds(v)
      .map((id) => valueLabelById.get(id) || id.slice(0, 8))
      .join(' · ') || '—'
  );
}

/** Cartesian product of one value from each option group. */
function allCombinations(
  groups: ProductOptionGroup[]
): { option_value_ids: string[]; labels: string[]; valueCodes: string[] }[] {
  if (groups.length === 0) return [];
  let combos: { option_value_ids: string[]; labels: string[]; valueCodes: string[] }[] = [
    { option_value_ids: [], labels: [], valueCodes: [] },
  ];
  for (const g of groups) {
    const values = g.values || [];
    if (values.length === 0) return [];
    const next: typeof combos = [];
    for (const c of combos) {
      for (const v of values) {
        next.push({
          option_value_ids: [...c.option_value_ids, v.id],
          labels: [...c.labels, v.label || v.value || v.id],
          valueCodes: [...c.valueCodes, v.value || slugifyCode(v.label || v.id)],
        });
      }
    }
    combos = next;
  }
  return combos;
}

export default function ProductVariantsEditor({
  productId,
  readOnly = false,
}: ProductVariantsEditorProps) {
  const { data: product, isLoading } = useProduct(productId);
  const createGroup = useCreateOptionGroup(productId);
  const createVariant = useCreateVariant(productId);
  const updateVariant = useUpdateVariant(productId);
  const deleteVariant = useDeleteVariant(productId);

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groupValues, setGroupValues] = useState<DraftValue[]>([
    { label: '', value: '' },
  ]);
  const [codeTouched, setCodeTouched] = useState(false);

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string>>(
    {}
  );
  const [variantSku, setVariantSku] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('50');
  const [variantActive, setVariantActive] = useState(true);
  const [skuTouched, setSkuTouched] = useState(false);

  const [defaultPrice, setDefaultPrice] = useState('');
  const [defaultStock, setDefaultStock] = useState('50');
  const [generating, setGenerating] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, VariantDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const optionGroups = product?.option_groups ?? [];
  const variants = product?.variants ?? [];
  const hasVariants = Boolean(product?.has_variants) || variants.length > 0;
  const baseSku = (product?.sku || product?.slug || 'product').trim();

  const valueLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of optionGroups) {
      for (const v of g.values || []) {
        map.set(v.id, v.label || v.value || v.id);
      }
    }
    return map;
  }, [optionGroups]);

  const existingKeys = useMemo(() => {
    const set = new Set<string>();
    for (const v of variants) {
      const ids = variantOptionIds(v);
      if (ids.length) set.add(sortedIdKey(ids));
    }
    return set;
  }, [variants]);

  const missingCombos = useMemo(() => {
    return allCombinations(optionGroups).filter(
      (c) => !existingKeys.has(sortedIdKey(c.option_value_ids))
    );
  }, [optionGroups, existingKeys]);

  const getDraft = (v: ProductVariant): VariantDraft =>
    drafts[v.id] ?? {
      sku: v.sku || '',
      price: String(v.price ?? 0),
      stock_quantity: String(v.stock_quantity ?? 0),
      is_active: v.is_active ?? true,
    };

  const isDirty = (v: ProductVariant) => {
    const d = drafts[v.id];
    if (!d) return false;
    return (
      d.sku !== (v.sku || '') ||
      d.price !== String(v.price ?? 0) ||
      d.stock_quantity !== String(v.stock_quantity ?? 0) ||
      d.is_active !== (v.is_active ?? true)
    );
  };

  const dirtyVariants = variants.filter(isDirty);

  const setDraftField = (
    id: string,
    field: keyof VariantDraft,
    value: string | boolean
  ) => {
    const current = variants.find((row) => row.id === id);
    if (!current) return;
    const base = getDraft(current);
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...base, [field]: value },
    }));
  };

  const suggestSku = (valueCodes: string[]) =>
    [baseSku, ...valueCodes.filter(Boolean)].join('-').replace(/_+/g, '-');

  // Auto-suggest SKU when picking options for a new variant
  const updateSelection = (groupId: string, valueId: string) => {
    const next = { ...selectedByGroup, [groupId]: valueId };
    setSelectedByGroup(next);
    if (!skuTouched) {
      const codes = optionGroups.map((g) => {
        const id = next[g.id];
        const val = (g.values || []).find((x) => x.id === id);
        return val?.value || slugifyCode(val?.label || '');
      });
      if (codes.every(Boolean)) setVariantSku(suggestSku(codes));
    }
  };

  const resetGroupForm = () => {
    setGroupName('');
    setGroupCode('');
    setGroupValues([{ label: '', value: '' }]);
    setCodeTouched(false);
    setShowGroupForm(false);
  };

  const resetVariantForm = () => {
    setSelectedByGroup({});
    setVariantSku('');
    setVariantPrice('');
    setVariantStock(defaultStock || '50');
    setVariantActive(true);
    setSkuTouched(false);
    setShowVariantForm(false);
  };

  const handleCreateGroup = async () => {
    const values = groupValues
      .map((v, i) => ({
        label: v.label.trim(),
        value: (v.value.trim() || slugifyCode(v.label)).trim(),
        position: i,
      }))
      .filter((v) => v.label && v.value);

    if (!groupName.trim() || !groupCode.trim()) {
      toast.error('Group name and code are required');
      return;
    }
    if (values.length === 0) {
      toast.error('Add at least one option value (include English value code for Hindi labels)');
      return;
    }

    try {
      await createGroup.mutateAsync({
        name: groupName.trim(),
        code: groupCode.trim(),
        position: optionGroups.length,
        values,
      });
      resetGroupForm();
    } catch {
      /* toast in hook */
    }
  };

  const handleCreateVariant = async () => {
    const option_value_ids = optionGroups
      .map((g) => selectedByGroup[g.id])
      .filter(Boolean) as string[];

    if (option_value_ids.length !== optionGroups.length) {
      toast.error('Select one value from each option group');
      return;
    }
    if (!variantSku.trim()) {
      toast.error('SKU is required');
      return;
    }
    const price = parseFloat(variantPrice);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a price for this variant (₹)');
      return;
    }
    const stock = parseInt(variantStock, 10);
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error('Enter a valid stock quantity');
      return;
    }

    try {
      await createVariant.mutateAsync({
        sku: variantSku.trim(),
        price: String(price),
        stock_quantity: stock,
        is_active: variantActive,
        position: variants.length,
        option_value_ids,
      });
      resetVariantForm();
    } catch {
      /* toast in hook */
    }
  };

  const handleGenerateMissing = async () => {
    if (missingCombos.length === 0) {
      toast.info('All combinations already have variants');
      return;
    }
    const price = parseFloat(defaultPrice);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Set a default price (₹) first — you can edit each row after');
      return;
    }
    const stock = parseInt(defaultStock, 10);
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error('Set a default stock quantity');
      return;
    }

    setGenerating(true);
    let ok = 0;
    let fail = 0;
    try {
      for (let i = 0; i < missingCombos.length; i++) {
        const combo = missingCombos[i];
        try {
          await createVariant.mutateAsync({
            sku: suggestSku(combo.valueCodes),
            price: String(price),
            stock_quantity: stock,
            is_active: true,
            position: variants.length + i,
            option_value_ids: combo.option_value_ids,
          });
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      if (ok) toast.success(`Created ${ok} variant${ok === 1 ? '' : 's'} — edit prices in the table`);
      if (fail) toast.error(`${fail} variant${fail === 1 ? '' : 's'} failed`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveVariant = async (id: string) => {
    const v = variants.find((row) => row.id === id);
    if (!v) return;
    const draft = getDraft(v);
    const price = parseFloat(draft.price);
    const stock = parseInt(draft.stock_quantity, 10);
    if (!draft.sku.trim()) {
      toast.error('SKU is required');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid price (₹)');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error('Enter a valid stock quantity');
      return;
    }

    setSavingId(id);
    try {
      await updateVariant.mutateAsync({
        variantId: id,
        data: {
          sku: draft.sku.trim(),
          price: String(price),
          stock_quantity: stock,
          is_active: draft.is_active,
        },
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      /* toast in hook */
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAllPrices = async () => {
    if (dirtyVariants.length === 0) {
      toast.info('No price/stock changes to save');
      return;
    }
    setSavingAll(true);
    let ok = 0;
    let fail = 0;
    try {
      for (const v of dirtyVariants) {
        const draft = getDraft(v);
        const price = parseFloat(draft.price);
        const stock = parseInt(draft.stock_quantity, 10);
        if (!draft.sku.trim() || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
          fail += 1;
          continue;
        }
        try {
          await updateVariant.mutateAsync({
            variantId: v.id,
            data: {
              sku: draft.sku.trim(),
              price: String(price),
              stock_quantity: stock,
              is_active: draft.is_active,
            },
          });
          ok += 1;
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[v.id];
            return next;
          });
        } catch {
          fail += 1;
        }
      }
      if (ok) toast.success(`Saved ${ok} variant price${ok === 1 ? '' : 's'}`);
      if (fail) toast.error(`${fail} row${fail === 1 ? '' : 's'} failed`);
    } finally {
      setSavingAll(false);
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (!window.confirm('Delete this variant? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteVariant.mutateAsync(id);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      /* toast in hook */
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || !product) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading variants…
      </div>
    );
  }

  const priceRange =
    hasVariants && product.min_price != null
      ? product.max_price != null && product.max_price !== product.min_price
        ? `₹${product.min_price} – ₹${product.max_price}`
        : `From ₹${product.min_price}`
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Variant pricing
          </h3>
        </div>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGroupForm((v) => !v)}
          >
            <Plus className="h-4 w-4" /> Add option group
          </Button>
        )}
      </div>

      {optionGroups.length > 0 && (
        <div className="space-y-2">
          {optionGroups.map((g) => (
            <div
              key={g.id}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-slate-800">
                  {g.name || g.code}
                </span>
                <span className="text-xs text-slate-400 font-mono">{g.code}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {(g.values || []).map((v) => v.label || v.value).join(' · ') ||
                  'No values'}
              </p>
            </div>
          ))}
        </div>
      )}

      {!readOnly && showGroupForm && (
        <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white">
          <p className="text-sm font-medium text-slate-700">New option group</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                placeholder="फ्लेवर"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  if (!codeTouched) setGroupCode(slugifyCode(e.target.value) || 'option');
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Code</Label>
              <Input
                placeholder="flavor"
                value={groupCode}
                onChange={(e) => {
                  setCodeTouched(true);
                  setGroupCode(slugifyCode(e.target.value));
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Values</Label>
            {groupValues.map((row, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Input
                  placeholder="Label (e.g. गुलाब)"
                  value={row.label}
                  onChange={(e) => {
                    const next = [...groupValues];
                    const label = e.target.value;
                    const auto = slugifyCode(label);
                    next[i] = {
                      label,
                      value:
                        row.value && row.value !== slugifyCode(row.label)
                          ? row.value
                          : auto,
                    };
                    setGroupValues(next);
                  }}
                />
                <Input
                  placeholder="value (e.g. gulab)"
                  value={row.value}
                  onChange={(e) => {
                    const next = [...groupValues];
                    next[i] = { ...next[i], value: slugifyCode(e.target.value) };
                    setGroupValues(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-rose-500 shrink-0"
                  disabled={groupValues.length <= 1}
                  onClick={() =>
                    setGroupValues(groupValues.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setGroupValues([...groupValues, { label: '', value: '' }])
              }
            >
              <Plus className="h-4 w-4" /> Add value
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={createGroup.isPending}
              onClick={handleCreateGroup}
            >
              {createGroup.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create group
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetGroupForm}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {optionGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Sellable variants — set price per row ({variants.length})</Label>
            <div className="flex flex-wrap gap-2">
              {!readOnly && dirtyVariants.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  disabled={savingAll}
                  onClick={handleSaveAllPrices}
                >
                  {savingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save all prices ({dirtyVariants.length})
                </Button>
              )}
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVariantForm((v) => !v)}
                >
                  <Plus className="h-4 w-4" /> Add one variant
                </Button>
              )}
            </div>
          </div>

          {!readOnly && showVariantForm && (
            <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white">
              <p className="text-sm font-medium text-slate-700">
                New variant with its own price
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {optionGroups.map((g) => {
                  const label = groupLabel(g);
                  const placeholder = `Select ${label}`;
                  const selectedId = selectedByGroup[g.id] ?? null;
                  return (
                    <div key={g.id} className="space-y-1">
                      <Label>{label}</Label>
                      <Select
                        // `null`, not `undefined` — undefined leaves the Select
                        // uncontrolled, and picking a value would then flip it to
                        // controlled, which base-ui logs as an error.
                        value={selectedId}
                        onValueChange={(val) => {
                          if (!val) return;
                          updateSelection(g.id, val);
                        }}
                      >
                        <SelectTrigger>
                          {/* Without children, SelectValue renders the raw value —
                              i.e. the option-value UUID. */}
                          <SelectValue placeholder={placeholder}>
                            {selectedId ? optionValueLabel(g, selectedId) || placeholder : placeholder}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(g.values || []).map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.label || v.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
                <div className="space-y-1">
                  <Label>SKU</Label>
                  <Input
                    placeholder="product-flavor-size"
                    value={variantSku}
                    onChange={(e) => {
                      setSkuTouched(true);
                      setVariantSku(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Price (₹) <span className="text-rose-500">*</span></Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="200"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    min={0}
                    value={variantStock}
                    onChange={(e) => setVariantStock(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={variantActive}
                    onCheckedChange={setVariantActive}
                  />
                  <Label>Active (sellable)</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={createVariant.isPending}
                  onClick={handleCreateVariant}
                >
                  {createVariant.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create variant
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetVariantForm}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {variants.length === 0 ? (
            <p className="text-sm text-slate-500">
              No variants yet. Use <strong>Generate all combinations</strong> with a default price, or add one variant at a time.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Options</th>
                    <th className="px-3 py-2 font-semibold">SKU</th>
                    <th className="px-3 py-2 font-semibold">Price (₹)</th>
                    <th className="px-3 py-2 font-semibold">Stock</th>
                    <th className="px-3 py-2 font-semibold">Active</th>
                    {!readOnly && (
                      <th className="px-3 py-2 font-semibold w-[100px]">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variants.map((v) => {
                    const draft = getDraft(v);
                    const dirty = isDirty(v);
                    return (
                      <tr
                        key={v.id}
                        className={dirty ? 'bg-amber-50/60' : 'bg-white'}
                      >
                        <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                          {formatVariantLabel(v, valueLabelById)}
                        </td>
                        <td className="px-3 py-2">
                          {readOnly ? (
                            <span className="font-mono text-xs">{v.sku}</span>
                          ) : (
                            <Input
                              className="h-8 min-w-[140px] font-mono text-xs"
                              value={draft.sku}
                              onChange={(e) =>
                                setDraftField(v.id, 'sku', e.target.value)
                              }
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {readOnly ? (
                            <span className="font-medium">₹{v.price}</span>
                          ) : (
                            <div className="relative w-28">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                ₹
                              </span>
                              <Input
                                className="h-8 pl-5 font-medium"
                                type="number"
                                min={0}
                                step="0.01"
                                value={draft.price}
                                onChange={(e) =>
                                  setDraftField(v.id, 'price', e.target.value)
                                }
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {readOnly ? (
                            <span>{v.stock_quantity}</span>
                          ) : (
                            <Input
                              className="h-8 w-20"
                              type="number"
                              min={0}
                              value={draft.stock_quantity}
                              onChange={(e) =>
                                setDraftField(
                                  v.id,
                                  'stock_quantity',
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {readOnly ? (
                            <span
                              className={
                                v.is_active
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                              }
                            >
                              {v.is_active ? 'Yes' : 'No'}
                            </span>
                          ) : (
                            <Switch
                              checked={draft.is_active}
                              onCheckedChange={(val) =>
                                setDraftField(v.id, 'is_active', val)
                              }
                            />
                          )}
                        </td>
                        {!readOnly && (
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={savingId === v.id || !dirty}
                                onClick={() => handleSaveVariant(v.id)}
                                title="Save this row"
                              >
                                {savingId === v.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500"
                                disabled={deletingId === v.id}
                                onClick={() => handleDeleteVariant(v.id)}
                                title="Delete"
                              >
                                {deletingId === v.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {optionGroups.length === 0 && !showGroupForm && (
        <p className="text-sm text-slate-500">
          {readOnly
            ? 'This product has no variants — price is on the product itself.'
            : 'Start by adding an option group (Weight / Flavor), then generate variants and set each price.'}
        </p>
      )}
    </div>
  );
}
