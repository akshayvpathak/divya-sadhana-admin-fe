import { z } from "zod";

/**
 * Books & eBooks.
 *
 * A book is a Product with `product_type = "BOOK"`; its editions are ordinary variants
 * carrying `variant_type`. There is no Book table. The admin books endpoint writes the
 * product, the BookDetail, the "Format" option group and one variant per format in a
 * single transaction, so this module models the *form*, not four separate resources.
 */

export const variantTypeEnum = z.enum(["EBOOK", "PHYSICAL"]);
export type VariantType = z.infer<typeof variantTypeEnum>;

/** Labels are chosen once by the API and echoed back; never localise them per title. */
export const VARIANT_TYPE_LABEL: Record<VariantType, string> = {
  EBOOK: "eBook",
  PHYSICAL: "Printed",
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

const moneyToNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") return 0;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : 0;
};

const nullableMoney = z
  .union([z.number(), z.string()])
  .nullable()
  .optional()
  .transform((val) =>
    val === null || val === undefined || val === "" ? null : moneyToNumber(val)
  );

export const digitalAssetSchema = z.object({
  id: z.string(),
  file_name: z.string().nullable().optional().default(""),
  mime_type: z.string().nullable().optional().default("application/pdf"),
  size_bytes: z.number().nullable().optional(),
  /**
   * Measured server-side from the uploaded object, not from anything the browser reported.
   * Show it back to the admin: a 400-page title reading "1 page" means the upload failed,
   * and that is far cheaper to catch on the form than in a support ticket.
   */
  page_count: z.number().nullable().optional(),
  version: z.number().nullable().optional().default(1),
  object_key: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const bookVariantSchema = z.object({
  id: z.string(),
  sku: z.string().nullable().optional().default(""),
  price: z.union([z.number(), z.string()]).nullable().optional().transform(moneyToNumber),
  /** NULL for an eBook. A stored 0 is exactly what would make it read as sold out. */
  stock_quantity: z.number().nullable().optional().default(null),
  is_active: z.boolean().nullable().optional().transform((v) => v ?? true),
  variant_type: variantTypeEnum.nullable().optional().transform((v) => v ?? "PHYSICAL"),
  option_label: z.string().nullable().optional().default(""),
  variant_label: z.string().nullable().optional().default(""),
  requires_shipping: z.boolean().nullable().optional(),
  max_quantity: z.number().nullable().optional(),
  digital_asset: digitalAssetSchema.nullable().optional(),
  digital_asset_id: z.string().nullable().optional(),
});

/** The 1:1 BookDetail block; present only when product_type is BOOK. */
export const bookDetailSchema = z.object({
  author: z.string().nullable().optional().default(""),
  language: z.string().nullable().optional().default(""),
  publisher: z.string().nullable().optional().default(""),
  isbn: z.string().nullable().optional().default(""),
  edition: z.string().nullable().optional().default(""),
  page_count: z.number().nullable().optional(),
  publication_year: z.number().nullable().optional(),
});

/**
 * Deliberately lenient: the create/patch endpoints return "the full product detail payload",
 * and the generated OpenAPI schema for these operations is the generic product serializer,
 * so unknown or renamed fields must never break the screen.
 */
export const adminBookSchema = z.object({
  id: z.string().nullable().optional().default(""),
  /** POST /api/admin/books/ answers with product_id rather than id. */
  product_id: z.string().nullable().optional(),
  name: z.string().nullable().optional().default(""),
  title: z.string().nullable().optional(),
  slug: z.string().nullable().optional().default(""),
  description: z.string().nullable().optional().default(""),
  product_type: z.string().nullable().optional().default("BOOK"),
  category: z.string().nullable().optional().default(""),
  category_name: z.string().nullable().optional().default(""),
  primary_image_key: z.string().nullable().optional().default(""),
  primary_image_url: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional().transform((v) => v ?? true),
  is_published: z.boolean().nullable().optional().transform((v) => v ?? false),
  min_price: nullableMoney,
  max_price: nullableMoney,
  formats: z.array(variantTypeEnum).nullable().optional().default([]),
  active_variant_count: z.number().nullable().optional().default(0),
  requires_shipping: z.boolean().nullable().optional(),
  book: bookDetailSchema.nullable().optional(),
  variants: z.array(bookVariantSchema).nullable().optional().default([]),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const adminBooksListSchema = z.object({
  message: z.string().optional(),
  data: z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(adminBookSchema),
  }),
});

export type DigitalAsset = z.infer<typeof digitalAssetSchema>;
export type BookVariant = z.infer<typeof bookVariantSchema>;
export type BookDetail = z.infer<typeof bookDetailSchema>;
export type AdminBook = z.infer<typeof adminBookSchema>;
export type AdminBooksList = z.infer<typeof adminBooksListSchema>;

/** `id` on a list row, `product_id` on a create response. */
export function bookId(book: AdminBook): string {
  return book.id || book.product_id || "";
}

export function bookTitle(book: AdminBook): string {
  return book.title || book.name || "Untitled";
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** One entry of the `formats` array sent to POST/PATCH /api/admin/books/. */
export type BookFormatPayload = {
  type: VariantType;
  price: string;
  digital_asset_id?: string;
  sku?: string;
  stock_quantity?: number;
};

export type BookPayload = {
  title: string;
  category_id: string;
  author?: string;
  language?: string;
  publisher?: string;
  isbn?: string;
  edition?: string;
  publication_year?: number;
  description?: string;
  cover_image_key?: string;
  is_active: boolean;
  is_published: boolean;
  formats: BookFormatPayload[];
};

const priceField = z
  .string()
  .trim()
  .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) > 0), {
    message: "Enter a price greater than 0",
  });

/**
 * Form model, not wire model. The eBook branch has no SKU and no stock field *at all* —
 * the API rejects them rather than silently storing zero, and a disabled-and-zero input
 * would just teach the admin that an eBook has zero stock.
 */
export const bookFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    category_id: z.string().uuid("Choose a category"),
    author: z.string().trim().default(""),
    language: z.string().trim().default(""),
    publisher: z.string().trim().default(""),
    isbn: z.string().trim().default(""),
    edition: z.string().trim().default(""),
    publication_year: z.string().trim().default(""),
    description: z.string().default(""),
    cover_image_key: z.string().default(""),
    is_active: z.boolean().default(true),
    is_published: z.boolean().default(false),

    ebook_enabled: z.boolean().default(false),
    ebook_price: priceField.default(""),
    ebook_digital_asset_id: z.string().default(""),

    printed_enabled: z.boolean().default(false),
    printed_price: priceField.default(""),
    printed_sku: z.string().trim().default(""),
    printed_stock: z.string().trim().default(""),
  })
  .superRefine((values, ctx) => {
    // Either format alone is a perfectly normal book — eBook-only and print-only both ship.
    if (!values.ebook_enabled && !values.printed_enabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ebook_enabled"],
        message: "A book needs at least one format — eBook, printed, or both.",
      });
    }

    if (values.ebook_enabled) {
      if (!values.ebook_price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ebook_price"],
          message: "The eBook format needs a price.",
        });
      }
      if (!values.ebook_digital_asset_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ebook_digital_asset_id"],
          message: "The eBook format needs an uploaded PDF.",
        });
      }
    }

    if (values.printed_enabled) {
      if (!values.printed_price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["printed_price"],
          message: "The printed format needs a price.",
        });
      }
      if (!values.printed_sku) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["printed_sku"],
          message: "The printed format needs a SKU.",
        });
      }
      const stock = Number(values.printed_stock);
      if (values.printed_stock === "" || !Number.isFinite(stock) || stock < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["printed_stock"],
          message: "The printed format needs a stock quantity.",
        });
      }
    }

    if (values.publication_year) {
      const year = Number(values.publication_year);
      if (!Number.isInteger(year) || year < 1000 || year > new Date().getFullYear() + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publication_year"],
          message: "Enter a 4-digit year",
        });
      }
    }
  });

export type BookFormValues = z.input<typeof bookFormSchema>;

export const emptyBookForm: BookFormValues = {
  title: "",
  category_id: "",
  author: "",
  language: "",
  publisher: "",
  isbn: "",
  edition: "",
  publication_year: "",
  description: "",
  cover_image_key: "",
  is_active: true,
  is_published: false,
  ebook_enabled: false,
  ebook_price: "",
  ebook_digital_asset_id: "",
  printed_enabled: true,
  printed_price: "",
  printed_sku: "",
  printed_stock: "",
};

/**
 * A rich-text editor never returns "" — an emptied field comes back as
 * "<p><br></p>". Left alone that is truthy, so an untouched description would be
 * stored as markup that renders as a stray blank line on the storefront.
 */
function blankRichText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim() === "";
}

/** Form → wire. Money stays a string end-to-end; blanks are omitted, never sent as "". */
export function toBookPayload(values: BookFormValues): BookPayload {
  const formats: BookFormatPayload[] = [];

  if (values.ebook_enabled) {
    // No sku, no stock_quantity: the API rejects them on a digital format.
    formats.push({
      type: "EBOOK",
      price: String(values.ebook_price ?? "").trim(),
      digital_asset_id: values.ebook_digital_asset_id,
    });
  }

  if (values.printed_enabled) {
    formats.push({
      type: "PHYSICAL",
      price: String(values.printed_price ?? "").trim(),
      sku: (values.printed_sku ?? "").trim(),
      stock_quantity: Number(values.printed_stock),
    });
  }

  const payload: BookPayload = {
    title: (values.title ?? "").trim(),
    category_id: values.category_id ?? "",
    is_active: values.is_active ?? true,
    is_published: values.is_published ?? false,
    formats,
  };

  const description = blankRichText(values.description ?? "") ? "" : values.description;

  const optional: [keyof BookPayload, string | undefined][] = [
    ["author", values.author],
    ["language", values.language],
    ["publisher", values.publisher],
    ["isbn", values.isbn],
    ["edition", values.edition],
    ["description", description],
    ["cover_image_key", values.cover_image_key],
  ];
  for (const [key, raw] of optional) {
    const trimmed = (raw ?? "").trim();
    if (trimmed) (payload as Record<string, unknown>)[key] = trimmed;
  }

  if (values.publication_year) {
    payload.publication_year = Number(values.publication_year);
  }

  return payload;
}

/** Wire → form, for the edit screen. */
export function toBookFormValues(book: AdminBook): BookFormValues {
  const ebook = (book.variants ?? []).find((v) => v.variant_type === "EBOOK");
  const printed = (book.variants ?? []).find((v) => v.variant_type === "PHYSICAL");
  const detail = book.book;

  return {
    title: bookTitle(book),
    category_id: book.category || "",
    author: detail?.author || "",
    language: detail?.language || "",
    publisher: detail?.publisher || "",
    isbn: detail?.isbn || "",
    edition: detail?.edition || "",
    publication_year: detail?.publication_year ? String(detail.publication_year) : "",
    description: book.description || "",
    cover_image_key: book.primary_image_key || "",
    is_active: book.is_active,
    is_published: book.is_published,
    ebook_enabled: Boolean(ebook?.is_active),
    ebook_price: ebook ? String(ebook.price) : "",
    ebook_digital_asset_id: ebook?.digital_asset?.id || ebook?.digital_asset_id || "",
    printed_enabled: Boolean(printed?.is_active),
    printed_price: printed ? String(printed.price) : "",
    printed_sku: printed?.sku || "",
    printed_stock: printed?.stock_quantity != null ? String(printed.stock_quantity) : "",
  };
}
