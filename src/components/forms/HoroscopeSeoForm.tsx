'use client';

import { useCallback, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  HoroscopeEntry,
  HoroscopeLocale,
  HoroscopeSeoFormData,
  horoscopeSeoFormSchema,
  HoroscopeSeoPatchPayload,
  LOCALE_LABELS,
  PERIOD_LABELS,
  SIGN_LABELS,
} from "@/schemas/horoscope.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUploadImageMutation } from "@/hooks/queries/useImageUploadQuery";
import { resolveProductImageUrl } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "react-toastify";

interface HoroscopeSeoFormProps {
  entry: HoroscopeEntry;
  locale?: HoroscopeLocale;
  onSubmit: (payload: HoroscopeSeoPatchPayload) => void;
  isPending?: boolean;
}


export function HoroscopeSeoForm({
  entry,
  locale = "en-IN",
  onSubmit,
  isPending = false,
}: HoroscopeSeoFormProps) {
  const uploadMutation = useUploadImageMutation("horoscope_og");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<HoroscopeSeoFormData>({
    resolver: zodResolver(horoscopeSeoFormSchema) as any,
    defaultValues: {
      meta_title: entry.meta_title || "",
      meta_description: entry.meta_description || "",
      meta_keywords: entry.meta_keywords || "",
      og_image_key: entry.og_image_key || "",
      is_indexable: entry.is_indexable ?? true,
      faq: entry.faq?.length ? entry.faq : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "faq",
  });

  const isIndexable = watch("is_indexable");
  const ogImageKey = watch("og_image_key");

  useEffect(() => {
    reset({
      meta_title: entry.meta_title || "",
      meta_description: entry.meta_description || "",
      meta_keywords: entry.meta_keywords || "",
      og_image_key: entry.og_image_key || "",
      is_indexable: entry.is_indexable ?? true,
      faq: entry.faq?.length ? entry.faq : [],
    });
  }, [entry, reset]);

  useEffect(() => {
    if (entry.og_image_url) {
      setPreviewUrl(entry.og_image_url);
    } else if (ogImageKey) {
      setPreviewUrl(resolveProductImageUrl(ogImageKey));
    } else {
      setPreviewUrl("");
    }
  }, [entry.og_image_url, ogImageKey]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const keys = await uploadMutation.mutateAsync([file]);
      if (keys && keys.length > 0) {
        setValue("og_image_key", keys[0], { shouldDirty: true });
        toast.success("OG image uploaded");
      }
    } catch {
      toast.error("Failed to upload OG image");
      if (entry.og_image_url) {
        setPreviewUrl(entry.og_image_url);
      } else if (entry.og_image_key) {
        setPreviewUrl(resolveProductImageUrl(entry.og_image_key));
      } else {
        setPreviewUrl("");
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      void handleFileUpload(files[0]);
    }
  };

  const handleFormSubmit = (data: HoroscopeSeoFormData) => {
    const faq = data.faq
      .filter((item) => item.question.trim() && item.answer.trim())
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }));

    onSubmit({
      meta_title: data.meta_title || "",
      meta_description: data.meta_description || "",
      meta_keywords: data.meta_keywords || "",
      og_image_key: data.og_image_key || "",
      is_indexable: data.is_indexable,
      faq,
    });
  };


  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, () => undefined)}
      className="space-y-8"
    >
      <div className="rounded-xl border border-line bg-cream p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-moon">
          Reading (read-only)
        </h3>
        <p className="text-sm text-charcoal">
          Editing <span className="font-semibold text-ink">{LOCALE_LABELS[locale]}</span> SEO
          {locale === "hi-IN"
            ? " — Hindi meta and FAQ only. Body text stays backend-generated."
            : " — English meta and FAQ. Hindi is a separate tab so it cannot overwrite this."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-moon">Sign</Label>
            <p className="font-semibold text-ink capitalize">
              {SIGN_LABELS[entry.zodiac_sign]}
              {entry.rashi_hi ? (
                <span className="text-moon font-normal ml-2">
                  ({entry.rashi_hi})
                </span>
              ) : null}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-moon">Period</Label>
            <p className="font-semibold text-ink">
              {PERIOD_LABELS[entry.period]}
              <span className="text-moon font-normal ml-2">
                · {entry.period_key}
              </span>
            </p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-moon">Slug</Label>
            <p className="font-mono text-sm text-charcoal bg-surface border border-line rounded-md px-3 py-2">
              {entry.slug}
            </p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-moon">Summary</Label>
            <p className="text-sm text-charcoal leading-relaxed bg-surface border border-line rounded-md px-3 py-3">
              {entry.summary || "No summary available"}
            </p>
          </div>
        </div>
        {entry.stale ? (
          <p className="text-xs font-medium text-warning-ink bg-warning-tint border border-warning/25 rounded-md px-3 py-2">
            This reading is marked stale — showing the last known-good period.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-moon">
          SEO metadata
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Meta title</Label>
            <Input
              id="meta_title"
              placeholder="Leave empty to use auto-generated title"
              maxLength={70}
              {...register("meta_title")}
            />
            {errors.meta_title ? (
              <p className="text-sm text-danger">{errors.meta_title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta description</Label>
            <Textarea
              id="meta_description"
              placeholder="Leave empty to truncate summary"
              maxLength={160}
              rows={3}
              {...register("meta_description")}
            />
            {errors.meta_description ? (
              <p className="text-sm text-danger">
                {errors.meta_description.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_keywords">Meta keywords</Label>
            <Input
              id="meta_keywords"
              placeholder="Comma-separated keywords"
              maxLength={255}
              {...register("meta_keywords")}
            />
            {errors.meta_keywords ? (
              <p className="text-sm text-danger">
                {errors.meta_keywords.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 pt-1">
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
      </div>

      <div className="space-y-2">
        <Label>OG image override</Label>
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 text-center",
            isDragging
              ? "border-gold bg-tint/50"
              : "border-line hover:border-gold hover:bg-cream cursor-pointer"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("og-image-upload")?.click()}
        >
          {previewUrl || ogImageKey ? (
            <div className="relative group w-full max-w-[240px] aspect-video rounded-lg overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl || resolveProductImageUrl(ogImageKey || "")}
                alt="OG preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setValue("og_image_key", "", { shouldDirty: true });
                  setPreviewUrl("");
                }}
                className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-moon">
              <div className="p-4 bg-cosmos rounded-full">
                {uploadMutation.isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gold-press" />
                ) : (
                  <Upload className="h-8 w-8 text-moon" />
                )}
              </div>
              <div>
                <p className="font-medium text-charcoal">
                  {uploadMutation.isPending
                    ? "Uploading..."
                    : "Click or drag to upload OG image"}
                </p>
                <p className="text-sm">PNG, JPG or WEBP</p>
              </div>
            </div>
          )}
          <input
            id="og-image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploadMutation.isPending}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-moon">
            FAQ
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ question: "", answer: "" })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Q&amp;A
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-moon italic">
            No FAQ items yet. Add question and answer pairs for structured data.
          </p>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-xl border border-line bg-surface p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-moon">
                    Item {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-danger hover:text-danger hover:bg-danger-tint"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-${index}-question`}>Question</Label>
                  <Input
                    id={`faq-${index}-question`}
                    placeholder="Question"
                    {...register(`faq.${index}.question`)}
                  />
                  {errors.faq?.[index]?.question ? (
                    <p className="text-sm text-danger">
                      {errors.faq[index]?.question?.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`faq-${index}-answer`}>Answer</Label>
                  <Textarea
                    id={`faq-${index}-answer`}
                    placeholder="Answer"
                    rows={2}
                    {...register(`faq.${index}.answer`)}
                  />
                  {errors.faq?.[index]?.answer ? (
                    <p className="text-sm text-danger">
                      {errors.faq[index]?.answer?.message}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end [&>a]:w-full sm:[&>a]:w-auto [&_[data-slot=button]]:w-full sm:[&_[data-slot=button]]:w-auto">
        <Link href="/horoscope">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending || uploadMutation.isPending}
          className="bg-gold-deep hover:bg-gold-deep min-w-[140px]"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save SEO"
          )}
        </Button>
      </div>
    </form>
  );
}
