import Image from 'next/image';
import { cn } from '@/lib/utils';
import sealArtwork from '@/assets/divyasadhana-seal.webp';

/**
 * Imported as a module rather than read from `public/`, so the bundler emits it
 * as a content-hashed static file. A dev server started before the artwork
 * existed still resolves it, and there is no public-dir index to go stale.
 *
 * The copies under `public/brand/` remain for the manifest and Open Graph tags,
 * which need stable, externally-fetchable URLs.
 */
export const BRAND_SEAL_SRC = sealArtwork;
export const BRAND_NAME = 'Divya Sadhana Adhyatmik Trust';

/**
 * The trust seal on its own. Transparent PNG-style artwork, so it sits on the
 * royal sidebar and the white sign-in card without a plate behind it.
 */
export function BrandMark({
  size = 32,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={BRAND_SEAL_SRC}
      alt={BRAND_NAME}
      width={size}
      height={size}
      priority={priority}
      // The seal is a 65KB transparent WebP shown at 36-84px. Skipping the
      // optimizer costs little and removes the one step that has to succeed at
      // request time — including its RGBA->JPEG fallback, which would flatten
      // the transparent backing to a black tile on the royal sidebar.
      unoptimized
      // `size` drives the intrinsic hint; the caller's classes drive layout, so
      // width/height are pinned here too rather than left to `h-auto`.
      style={{ width: size, height: size }}
      // `max-w-none` overrides Preflight's `img { max-width: 100% }`, which would
      // otherwise squash the seal to its container: in the 64px collapsed rail
      // that box is 35px, so the mark rendered 35x36 and its centre drifted half
      // a pixel off the icon column — visible as a jitter on every toggle.
      className={cn('max-w-none shrink-0 select-none object-contain', className)}
    />
  );
}

/**
 * Seal plus wordmark. `tone` picks the pair of inks that clear AA on the
 * surface it lands on — royal sidebar (`onDark`) or paper (`onLight`).
 *
 * Dropping only the wordmark (rather than swapping the whole lockup) keeps the
 * seal's <img> mounted at one constant size, so collapsing the sidebar doesn't
 * request a second variant and flash while it loads.
 */
export function BrandLockup({
  size = 32,
  tone = 'onLight',
  showWordmark = true,
  className,
  priority = false,
}: {
  size?: number;
  tone?: 'onDark' | 'onLight';
  showWordmark?: boolean;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn('flex min-w-0 items-center', showWordmark && 'gap-2.5', className)}>
      <BrandMark size={size} priority={priority} />
      {showWordmark && (
        <span
          className={cn(
            'truncate text-lg font-bold tracking-tight',
            tone === 'onDark' ? 'text-white' : 'text-ink'
          )}
        >
          Divya{' '}
          <span className={tone === 'onDark' ? 'text-saffron' : 'text-gold-deep'}>
            Sadhana
          </span>
        </span>
      )}
    </span>
  );
}
