'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
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
import type { ProductVariant } from '@/schemas/products.schema';

interface ProductVariantsEditorProps {
  productId: string;
  readOnly?: boolean;
}

type DraftValue = { label: string; value: string };

function slugifyCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function variantOptionIds(v: ProductVariant): string[] {
  if (v.option_value_ids?.length) return v.option_value_ids;
  if (v.option_values?.length) return v.option_values;
  return [];
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
  const [variantStock, setVariantStock] = useState('0');
  const [variantActive, setVariantActive] = useState(true);

  const [drafts, setDrafts] = useState<
    Record<
      string,
      { sku: string; price: string; stock_quantity: string; is_active: boolean }
    >
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const optionGroups = product?.option_groups ?? [];
  const variants = product?.variants ?? [];
  const hasVariants = Boolean(product?.has_variants) || variants.length > 0;

  const valueLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of optionGroups) {
      for (const v of g.values || []) {
        map.set(v.id, v.label || v.value || v.id);
      }
    }
    return map;
  }, [optionGroups]);

  const getDraft = (v: ProductVariant) =>
    drafts[v.id] ?? {
      sku: v.sku || '',
      price: String(v.price ?? 0),
      stock_quantity: String(v.stock_quantity ?? 0),
      is_active: v.is_active ?? true,
    };

  const setDraftField = (
    id: string,
    field: 'sku' | 'price' | 'stock_quantity' | 'is_active',
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
    setVariantStock('0');
    setVariantActive(true);
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
      toast.error('Add at least one option value');
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
      /* toast handled in hook */
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
      toast.error('Enter a valid price');
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
      /* toast handled in hook */
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
      toast.error('Enter a valid price');
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
      /* toast handled in hook */
    } finally {
      setSavingId(null);
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
      /* toast handled in hook */
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
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Variants
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {hasVariants
              ? `Variable product${priceRange ? ` · ${priceRange}` : ''}. Price, SKU, and stock live on each variant.`
              : 'Simple product. Add option groups (e.g. flavor, weight) then create variants.'}
          </p>
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
                  if (!codeTouched) setGroupCode(slugifyCode(e.target.value));
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
          <div className="flex items-center justify-between">
            <Label>Sellable variants ({variants.length})</Label>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVariantForm((v) => !v)}
              >
                <Plus className="h-4 w-4" /> Add variant
              </Button>
            )}
          </div>

          {!readOnly && showVariantForm && (
            <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white">
              <p className="text-sm font-medium text-slate-700">New variant</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {optionGroups.map((g) => (
                  <div key={g.id} className="space-y-1">
                    <Label>{g.name || g.code}</Label>
                    <Select
                      value={selectedByGroup[g.id] || undefined}
                      onValueChange={(val) => {
                        if (!val) return;
                        setSelectedByGroup((prev) => ({ ...prev, [g.id]: val }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${g.name || g.code}`} />
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
                ))}
                <div className="space-y-1">
                  <Label>SKU</Label>
                  <Input
                    placeholder="product-flavor-size"
                    value={variantSku}
                    onChange={(e) => setVariantSku(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
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
                  <Label>Active</Label>
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
              No variants yet. Add one combination of option values with its own
              SKU, price, and stock.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Options</th>
                    <th className="px-3 py-2 font-semibold">SKU</th>
                    <th className="px-3 py-2 font-semibold">Price</th>
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
                    return (
                      <tr key={v.id} className="bg-white">
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
                            <span>₹{v.price}</span>
                          ) : (
                            <Input
                              className="h-8 w-24"
                              type="number"
                              min={0}
                              step="0.01"
                              value={draft.price}
                              onChange={(e) =>
                                setDraftField(v.id, 'price', e.target.value)
                              }
                            />
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
                                disabled={savingId === v.id}
                                onClick={() => handleSaveVariant(v.id)}
                                title="Save"
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
            ? 'This product has no variants.'
            : 'Start by adding an option group (e.g. Weight or Flavor), then create variants for each combination.'}
        </p>
      )}
    </div>
  );
}
