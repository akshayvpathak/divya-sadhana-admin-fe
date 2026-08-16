import type { ProductOptionGroup, ProductVariant } from '@/schemas/products.schema';

/** Variant-labelling helpers, shared by the editor and the read-only view. */

/** "flavor" → "Flavor", "net_weight" → "Net Weight". */
export function humanizeCode(code: string): string {
  return code
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Admin-facing name for an option group. Prefers the English `code` because
 * `name` is what customers see and is often stored in Hindi (फ्लेवर / वजन).
 */
export function groupLabel(g: ProductOptionGroup): string {
  // 'option' is the fallback slugifyCode produces for a name with no Latin
  // characters, so it identifies nothing — prefer the stored name over it.
  if (g.code && g.code !== 'option') return humanizeCode(g.code);
  return g.name || 'Option';
}

export function optionValueLabel(g: ProductOptionGroup, valueId: string): string {
  const match = (g.values || []).find((v) => v.id === valueId);
  if (!match) return '';
  return match.label || match.value || '';
}

export function variantOptionIds(v: ProductVariant): string[] {
  if (v.option_value_ids?.length) return v.option_value_ids;
  if (v.option_values?.length) return v.option_values;
  return [];
}

/** Maps every option-value id in a product to its display label. */
export function buildValueLabelMap(
  groups: ProductOptionGroup[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const g of groups) {
    for (const v of g.values || []) {
      map.set(v.id, v.label || v.value || '');
    }
  }
  return map;
}

/** "Saffron · 250 g". Returns null when the variant carries no options. */
export function formatVariantLabel(
  v: ProductVariant,
  valueLabelById: Map<string, string>
): string | null {
  if (v.options && Object.keys(v.options).length > 0) {
    return Object.values(v.options).join(' · ');
  }
  const label = variantOptionIds(v)
    .map((id) => valueLabelById.get(id) || id.slice(0, 8))
    .join(' · ');
  return label || null;
}
