'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDeleteHomepageGalleryMutation,
  useHomepageGalleryQuery,
} from '@/hooks/queries/useHomepageGalleryQuery';

export default function HomepageGalleryPage() {
  const { data = [], isLoading } = useHomepageGalleryQuery();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteHomepageGalleryMutation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <PageHeader
        title="Homepage Gallery"
        actions={
          <Link href="/homepage-gallery/create">
            <Button>
              <Plus className="h-4 w-4" /> Add Image
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="rounded-full bg-cosmos p-4">
            <ImageIcon className="h-7 w-7 text-moon" />
          </div>
          <div>
            <p className="font-semibold text-ink">No homepage images yet</p>
            <p className="mt-1 text-sm text-moon">Add the first image for the homepage carousel.</p>
          </div>
          <Link href="/homepage-gallery/create">
            <Button size="sm">Add Image</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <Card key={item.id} className="overflow-hidden p-0">
              <div className="relative aspect-[16/9] bg-cosmos">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title || 'Homepage gallery image'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-line" />
                  </div>
                )}
                <span className={
                  `absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${
                    item.is_active ? 'bg-success text-white' : 'bg-surface/95 text-moon'
                  }`
                }>
                  {item.is_active ? 'Live' : 'Hidden'}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                  Order {item.display_order}
                </span>
              </div>

              <div className="space-y-4 p-4">
                <div className="min-h-14">
                  <h2 className="font-semibold text-ink">{item.title || 'Untitled image'}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-moon">
                    {item.caption || 'No caption'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-moon">
                    {item.link_type === 'none' ? 'No link' : item.link_type}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.link_url && (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open linked page"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-moon hover:bg-cream hover:text-ink"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Link href={`/homepage-gallery/${item.id}`}>
                      <Button variant="ghost" size="icon" aria-label="Edit gallery item">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete gallery item"
                      onClick={() => setDeleteId(item.id)}
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Homepage Image"
        description="Delete this image from the homepage gallery? The stored image will also be cleaned up."
        onConfirm={() => {
          if (!deleteId) return;
          deleteItem(deleteId, {
            onSuccess: () => setDeleteId(null),
          });
        }}
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        variant="destructive"
      />
    </div>
  );
}
