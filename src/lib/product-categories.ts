/**
 * Books are not ordinary products. They are created under Books & eBooks, which
 * writes a product with `product_type = "BOOK"` plus a BookDetail row, a
 * "Format" option group and one variant per format. Filing a plain product under
 * the books category produces something that looks like a book to the storefront
 * but has no author, no formats and no digital asset — a listing that cannot be
 * bought as an eBook and cannot be fixed from the product form.
 *
 * Matching on the name is a compromise. The category API exposes no type flag —
 * a category is only `{ id, name, description, is_active }` — so there is
 * nothing else to key on. If a flag is ever added server-side, read that here
 * and delete the patterns.
 */
const BOOKS_CATEGORY_PATTERNS: RegExp[] = [
  /पुस्तक/, // पुस्तक / पुस्तकें
  /\be-?books?\b/i,
  /\bbooks?\b/i,
  /\bpustak(en|e)?\b/i,
];

/** True when a category is the one Books & eBooks owns. */
export function isBooksCategory(name: string | null | undefined): boolean {
  const value = (name ?? '').trim();
  if (!value) return false;
  return BOOKS_CATEGORY_PATTERNS.some((pattern) => pattern.test(value));
}

