"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-moon py-4">Loading editor...</p>
  ),
});
import { productSchema, ProductFormData } from "@/schemas/product.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useProduct, resolveProductImageUrl } from "@/hooks/useProducts";
import { useAllCategories } from "@/hooks/useCategories";
import { isBooksCategory } from "@/lib/product-categories";
import { cn } from "@/lib/utils";

import { Switch } from "@/components/ui/switch";
import { useUploadImageMutation } from "@/hooks/queries/useImageUploadQuery";
import { Upload, X, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import ProductVariantsEditor from "@/components/forms/product/ProductVariantsEditor";
import DiscountFields from "@/components/forms/shared/DiscountFields";
import { emptyDiscount } from "@/schemas/discount.schema";

interface ProductFormProps {
  productId?: string;
  initialData?: ProductFormData;
  categories?: {
    id: string;
    name: string;
    isActive?: boolean;
    is_active?: boolean;
  }[];
  onSubmit?: (data: ProductFormData) => void;
  isPending?: boolean;
}

export function ProductForm({
  productId,
  initialData: propsInitialData,
  categories: propsCategories,
  onSubmit,
  isPending,
}: ProductFormProps) {
  const { data: fetchedProduct, isLoading: isFetchingProduct } = useProduct(
    productId || "",
  );
  const { data: fetchedCategories, isLoading: isFetchingCategories } =
    useAllCategories();
  const uploadPrimaryMutation = useUploadImageMutation();
  const uploadGalleryMutation = useUploadImageMutation();
  const uploadOgMutation = useUploadImageMutation("product_og");
  const [isDragging, setIsDragging] = useState(false);
  const [isOgDragging, setIsOgDragging] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<
    { id: string; url: string; isUploading: boolean; key?: string }[]
  >([]);
  const [primaryPreviewUrl, setPrimaryPreviewUrl] = useState<string>("");
  const [ogPreviewUrl, setOgPreviewUrl] = useState<string>("");

  const categories = fetchedCategories || propsCategories;
  const isFetching = isFetchingProduct || isFetchingCategories;

  const initialData = useMemo(
    () =>
      fetchedProduct
        ? {
            name: fetchedProduct.name || "",
            price: fetchedProduct.price,
            description: fetchedProduct.description || "",
            categoryId: fetchedProduct.categoryId || "",
            image:
              fetchedProduct.primary_image_key || fetchedProduct.image || "",
            sku: fetchedProduct.sku || "",
            stock_quantity: fetchedProduct.stock || 0,
            is_active: fetchedProduct.is_active ?? true,
            is_published: fetchedProduct.is_published ?? false,
            gallery_image_keys: fetchedProduct.gallery_image_keys || [],
            slug: fetchedProduct.slug || "",
            meta_title: fetchedProduct.meta_title || "",
            meta_description: fetchedProduct.meta_description || "",
            meta_keywords: fetchedProduct.meta_keywords || "",
            og_image_key: fetchedProduct.og_image_key || "",
            is_indexable: fetchedProduct.is_indexable ?? true,
            discount_enabled: fetchedProduct.discount_enabled ?? false,
            discount_type: fetchedProduct.discount_type ?? "percentage",
            discount_value: fetchedProduct.discount_value ?? 0,
          }
        : propsInitialData,
    [fetchedProduct, propsInitialData],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      price: 0,
      description: "",
      categoryId: "",
      image: "",
      sku: "",
      stock_quantity: 0,
      is_active: true,
      is_published: false,
      gallery_image_keys: [],
      slug: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      og_image_key: "",
      is_indexable: true,
      ...emptyDiscount,
      ...initialData,
    },
  });

  const categoryId = watch("categoryId");
  const selectedCategoryName =
    categories?.find((c) => c.id === categoryId)?.name ?? "";
  const nameValue = watch("name");
  const imageKey = watch("image");
  const is_active = watch("is_active");
  const isPublished = watch("is_published");
  const isIndexable = watch("is_indexable");
  const ogImageKey = watch("og_image_key");
  const hasVariants =
    Boolean(fetchedProduct?.has_variants) ||
    (fetchedProduct?.variants?.length ?? 0) > 0;
  const variantPriceHint =
    hasVariants && fetchedProduct?.min_price != null
      ? fetchedProduct.max_price != null &&
        fetchedProduct.max_price !== fetchedProduct.min_price
        ? `₹${fetchedProduct.min_price} – ₹${fetchedProduct.max_price}`
        : `From ₹${fetchedProduct.min_price}`
      : null;
  const galleryImageKeys = watch("gallery_image_keys") || [];
  const discountEnabled = watch("discount_enabled") ?? false;
  const discountType = watch("discount_type") ?? "percentage";
  const discountValue = Number(watch("discount_value")) || 0;
  /**
   * A variable product's `price` is machine-written (the backend keeps it equal to the
   * cheapest active variant), so the form's own price input is a no-op there. Preview the
   * discount against min_price instead, which is the number the shopper actually sees.
   */
  const discountBasePrice = hasVariants
    ? Number(fetchedProduct?.min_price ?? 0)
    : Number(watch("price")) || 0;

  useEffect(() => {
    register("image");
    register("is_active");
    register("is_published");
    register("gallery_image_keys");
    register("og_image_key");
    register("is_indexable");
  }, [register]);

  useEffect(() => {
    if (!productId && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [nameValue, setValue, productId]);

  useEffect(() => {
    if (fetchedProduct?.primary_image_url) {
      setPrimaryPreviewUrl(fetchedProduct.primary_image_url);
    } else if (initialData?.image) {
      setPrimaryPreviewUrl(resolveProductImageUrl(initialData.image));
    } else {
      setPrimaryPreviewUrl("");
    }
  }, [initialData, fetchedProduct]);

  useEffect(() => {
    if (fetchedProduct?.og_image_url) {
      setOgPreviewUrl(fetchedProduct.og_image_url);
    } else if (ogImageKey) {
      setOgPreviewUrl(resolveProductImageUrl(ogImageKey));
    } else {
      setOgPreviewUrl("");
    }
  }, [fetchedProduct, ogImageKey]);

  // Load existing gallery images into local previews on mount/reset
  useEffect(() => {
    if (initialData?.gallery_image_keys?.length) {
      const existingPreviews = initialData.gallery_image_keys.map(
        (key, index) => {
          let url = resolveProductImageUrl(key);
          if (fetchedProduct?.gallery_image_urls?.[index]) {
            url = fetchedProduct.gallery_image_urls[index];
          }
          return {
            id: key,
            url,
            isUploading: false,
            key,
          };
        },
      );
      setLocalPreviews(existingPreviews);
    } else {
      setLocalPreviews([]);
    }
  }, [initialData, fetchedProduct]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: ProductFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPrimaryPreviewUrl(localUrl);

    try {
      const keys = await uploadPrimaryMutation.mutateAsync([file]);
      if (keys && keys.length > 0) {
        setValue("image", keys[0]);
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload image");
      setPrimaryPreviewUrl("");
    }
  };

  const handleGalleryFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create local preview URLs and add them to local state immediately
    const newPreviews = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      isUploading: true,
      file,
    }));

    setLocalPreviews((prev) => [...prev, ...newPreviews]);

    try {
      const keys = await uploadGalleryMutation.mutateAsync(validFiles);
      if (keys && keys.length > 0) {
        // Map returned keys back to the previews
        const currentKeys = watch("gallery_image_keys") || [];
        setValue("gallery_image_keys", [...currentKeys, ...keys], {
          shouldDirty: true,
        });

        setLocalPreviews((prev) => {
          let keyIndex = 0;
          return prev.map((p) => {
            const isNew = newPreviews.some((np) => np.id === p.id);
            if (isNew && keyIndex < keys.length) {
              const assignedKey = keys[keyIndex++];
              return { ...p, isUploading: false, key: assignedKey };
            }
            return p;
          });
        });
        toast.success(`${validFiles.length} image(s) uploaded to gallery`);
      }
    } catch (error) {
      toast.error("Failed to upload gallery images");
      // Remove all newly added previews on failure
      const newIds = newPreviews.map((np) => np.id);
      setLocalPreviews((prev) => prev.filter((p) => !newIds.includes(p.id)));
    }
  };

  const handleOgDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOgDragging(true);
    },
    [],
  );

  const handleOgDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOgDragging(false);
  }, []);

  const handleOgDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsOgDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await handleOgFileUpload(files[0]);
      }
    },
    [],
  );

  const handleOgFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      void handleOgFileUpload(files[0]);
    }
  };

  const handleOgFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setOgPreviewUrl(localUrl);

    try {
      const keys = await uploadOgMutation.mutateAsync([file]);
      if (keys && keys.length > 0) {
        setValue("og_image_key", keys[0], { shouldDirty: true });
        toast.success("OG image uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload OG image");
      if (fetchedProduct?.og_image_url) {
        setOgPreviewUrl(fetchedProduct.og_image_url);
      } else if (ogImageKey) {
        setOgPreviewUrl(resolveProductImageUrl(ogImageKey));
      } else {
        setOgPreviewUrl("");
      }
    }
  };

  const handleRemoveGalleryImage = (
    idToRemove: string,
    keyToRemove?: string,
  ) => {
    setLocalPreviews((prev) => prev.filter((p) => p.id !== idToRemove));
    if (keyToRemove) {
      const currentKeys = watch("gallery_image_keys") || [];
      setValue(
        "gallery_image_keys",
        currentKeys.filter((k) => k !== keyToRemove),
        { shouldDirty: true },
      );
    }
  };

  if (productId && isFetching) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-cosmos animate-pulse rounded" />
              <div className="h-10 w-full bg-cream animate-pulse rounded-lg" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-cosmos animate-pulse rounded" />
          <div className="h-24 w-full bg-cream animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Product Name <span className="text-danger">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Product Name"
            {...register("name")}
                      />
          {errors.name && (
            <p className="text-sm text-danger">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">
            {hasVariants ? "Display price (₹)" : "Price (₹)"}
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="99.99"
            {...register("price")}
            disabled={hasVariants}
            min={0}
            className={
            hasVariants ? "bg-ivory border-line text-charcoal cursor-default focus-visible:ring-0" : ""
            }
          />
          {errors.price && (
            <p className="text-sm text-danger">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">
            {hasVariants ? (
              "Base SKU"
            ) : (
              <>
                SKU <span className="text-danger">*</span>
              </>
            )}
          </Label>
          <Input
            id="sku"
            placeholder="PROD-123"
            {...register("sku")}
            disabled={hasVariants}
            className={
            hasVariants ? "bg-ivory border-line text-charcoal cursor-default focus-visible:ring-0" : ""
            }
          />
          {errors.sku && (
            <p className="text-sm text-danger">{errors.sku.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">
            {hasVariants ? "Parent stock" : "Stock Quantity"}
          </Label>
          <Input
            id="stock_quantity"
            type="number"
            placeholder="100"
            {...register("stock_quantity")}
            disabled={hasVariants}
            min={0}
            className={
            hasVariants ? "bg-ivory border-line text-charcoal cursor-default focus-visible:ring-0" : ""
            }
          />
          {errors.stock_quantity && errors.stock_quantity && (
            <p className="text-sm text-danger">
              {errors.stock_quantity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select
            value={categoryId || ""}
            onValueChange={(val) =>
              setValue("categoryId", (val as string) || "")
            }
          >
            <SelectTrigger
              id="categoryId"
              className="bg-surface"
            >
              <SelectValue placeholder="Select a category">
                {categoryId
                  ? categories?.find((c) => c.id === categoryId)?.name ||
                    categoryId
                  : "Select a category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories
                ?.filter((category) => {
                  const active = category.isActive ?? category.is_active;
                  if (active === false && category.id !== categoryId) return false;
                  // Books are authored in Books & eBooks; offering the category
                  // here would create a book-shaped product with no formats.
                  // Kept only when it is already this product's saved value.
                  return !isBooksCategory(category.name) || category.id === categoryId;
                })
                ?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {/* Books are built in Books & eBooks, which also writes the formats and
              the digital asset. A book filed from here would have neither. */}
          {isBooksCategory(selectedCategoryName) ? (
            <p className="text-sm text-danger">
              This product is filed under a books category. Move it to another
              category — titles belong in{" "}
              <Link href="/books" className="font-medium underline">
                Books &amp; eBooks
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs text-moon">
              Books are not listed here — add them under Books &amp; eBooks.
            </p>
          )}
          {errors.categoryId && (
            <p className="text-sm text-danger">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="flex gap-8 items-center pt-4">
          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={is_active}
              onCheckedChange={(val) => setValue("is_active", val)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="is_published"
              checked={isPublished}
              onCheckedChange={(val) => setValue("is_published", val)}
            />
            <Label htmlFor="is_published" className="cursor-pointer">
              Published
            </Label>
          </div>
        </div>

      <DiscountFields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        control={control as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        register={register as any}
        errors={errors}
        basePrice={discountBasePrice}
        enabled={discountEnabled}
        type={discountType}
        value={discountValue}
        priceLabel={hasVariants ? "the lowest-priced variant" : undefined}
      />

      </div>

      <div className="space-y-2 pb-4">
        <Label htmlFor="description">
          Description <span className="text-danger">*</span>
        </Label>
        <div className="bg-surface rounded-md pb-6">
          <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <ReactQuill
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  className="h-[200px] mb-12"
                />
              )}
            />
        </div>
        {errors.description && (
          <p className="text-sm text-danger">{errors.description.message}</p>
        )}
      </div>

      {productId && (
        <div className="rounded-xl border border-line p-4">
          <ProductVariantsEditor productId={productId} />
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-moon">
          SEO
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="slug">
              Slug <span className="text-danger">*</span>
            </Label>
            <Input
              id="slug"
              placeholder="product-url-slug"
              {...register("slug")}
                          />
            {errors.slug && (
              <p className="text-sm text-danger">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="meta_title">Meta title</Label>
            <Input
              id="meta_title"
              placeholder="Leave empty to use product name"
              maxLength={70}
              {...register("meta_title")}
                          />
            {errors.meta_title && (
              <p className="text-sm text-danger">
                {errors.meta_title.message}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="meta_description">Meta description</Label>
            <Textarea
              id="meta_description"
              placeholder="Leave empty to use product description"
              maxLength={160}
              rows={3}
              {...register("meta_description")}
                          />
            {errors.meta_description && (
              <p className="text-sm text-danger">
                {errors.meta_description.message}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="meta_keywords">Meta keywords</Label>
            <Input
              id="meta_keywords"
              placeholder="Comma-separated keywords"
              maxLength={255}
              {...register("meta_keywords")}
                          />
            {errors.meta_keywords && (
              <p className="text-sm text-danger">
                {errors.meta_keywords.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 md:col-span-2">
            <Switch
              id="is_indexable"
              checked={isIndexable}
              onCheckedChange={(val) => setValue("is_indexable", val)}
            />
            <Label htmlFor="is_indexable" className="cursor-pointer">
              Indexable (include in sitemap)
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>OG image override</Label>
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 text-center",
              isOgDragging
                ? "border-gold bg-tint/50"
                : "border-line",
            )}
            onDragOver={handleOgDragOver}
            onDragLeave={handleOgDragLeave}
            onDrop={handleOgDrop}
            onClick={() =>
              document.getElementById("og-image-upload")?.click()
            }
          >
            {ogPreviewUrl || ogImageKey ? (
              <div className="relative group w-full max-w-[240px] aspect-video rounded-lg overflow-hidden border border-line">
                <img
                  src={ogPreviewUrl || resolveProductImageUrl(ogImageKey || "")}
                  alt="OG preview"
                  className="w-full h-full object-cover"
                />
                <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setValue("og_image_key", "", { shouldDirty: true });
                      setOgPreviewUrl("");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-moon">
                <div className="p-4 bg-cosmos rounded-full">
                  {uploadOgMutation.isPending ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gold-press" />
                  ) : (
                    <Upload className="h-8 w-8 text-moon" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-charcoal">
                    {uploadOgMutation.isPending
                      ? "Uploading..."
                      : "Click or drag to upload OG image"}
                  </p>
                  <p className="text-sm">PNG, JPG or WEBP (max. 5MB)</p>
                </div>
              </div>
            )}
            <input
              id="og-image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleOgFileSelect}
              disabled={uploadOgMutation.isPending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Product Image <span className="text-danger">*</span>
        </Label>
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 text-center",
            isDragging
              ? "border-gold bg-tint/50"
              : "border-line",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            document.getElementById("file-upload")?.click()
          }
        >
          {imageKey ? (
            <div className="relative group w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border border-line">
              <img
                src={primaryPreviewUrl || resolveProductImageUrl(imageKey)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue("image", "");
                    setPrimaryPreviewUrl("");
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-moon">
              <div className="p-4 bg-cosmos rounded-full">
                {uploadPrimaryMutation.isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gold-press" />
                ) : (
                  <Upload className="h-8 w-8 text-moon" />
                )}
              </div>
              <div>
                <p className="font-medium text-charcoal">
                  {uploadPrimaryMutation.isPending
                    ? "Uploading..."
                    : "Click or drag to upload"}
                </p>
                <p className="text-sm">PNG, JPG or WEBP (max. 5MB)</p>
              </div>
            </div>
          )}
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploadPrimaryMutation.isPending}
          />
        </div>
        {errors.image && (
          <p className="text-sm text-danger">{errors.image.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          Product Gallery <span className="text-danger">*</span>
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {localPreviews.map((item) => (
            <div
              key={item.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-line bg-cream flex items-center justify-center"
            >
              <img
                src={item.url}
                alt="Gallery Item"
                className={cn(
                  "w-full h-full object-cover",
                  item.isUploading && "opacity-40",
                )}
              />
              {item.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loader2 className="h-6 w-6 animate-spin text-gold-press" />
                </div>
              )}
              {!item.isUploading && (
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(item.id, item.key)}
                  className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          <div
              className={cn(
                "border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all hover:border-gold hover:bg-cream",
                uploadGalleryMutation.isPending
                  ? "opacity-50 pointer-events-none"
                  : "border-line",
              )}
              onClick={() => document.getElementById("gallery-upload")?.click()}
            >
              {uploadGalleryMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-gold-press" />
              ) : (
                <>
                  <Upload className="h-5 w-5 text-moon" />
                  <span className="text-xs text-moon font-medium px-2">
                    Upload Gallery
                  </span>
                </>
              )}
              <input
                id="gallery-upload"
                type="file"
                multiple
                className="hidden"
                accept="image/*"
                onChange={handleGalleryFileSelect}
                disabled={uploadGalleryMutation.isPending}
              />
            </div>
        </div>
        {errors.gallery_image_keys && (
          <p className="text-sm text-danger mt-2">
            {errors.gallery_image_keys.message}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end [&>a]:w-full sm:[&>a]:w-auto [&_[data-slot=button]]:w-full sm:[&_[data-slot=button]]:w-auto">
        <Link href="/products">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button
            type="submit"
            disabled={
              isPending ||
              uploadPrimaryMutation.isPending ||
              uploadGalleryMutation.isPending ||
              uploadOgMutation.isPending
            }
            className="bg-gold-deep hover:bg-gold-deep min-w-[120px]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : initialData ? (
              "Edit Product"
            ) : (
              "Create Product"
            )}
          </Button>
      </div>
    </form>
  );
}
