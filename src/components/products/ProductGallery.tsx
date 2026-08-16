'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Primary image with a thumbnail strip. Click or arrow-key to swap. An empty
 * gallery renders a placeholder tile rather than a broken <img>.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [selected, setSelected] = useState(0);

  // A product edit can shrink the gallery. Clamping on read rather than in an
  // effect avoids a second render pass (and the cascading-render lint).
  const active = selected < images.length ? selected : 0;

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-line bg-cosmos text-moon">
        <div className="flex flex-col items-center gap-2">
          <Package className="h-8 w-8" />
          <span className="text-xs font-medium">No image</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-cosmos">
        <Image
          src={images[active]}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 380px"
          className="object-contain"
          unoptimized
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border bg-cosmos transition-all',
                i === active
                  ? 'border-gold ring-2 ring-saffron/40'
                  : 'border-line hover:border-gold/40'
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
