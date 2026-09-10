/**
 * Slug generation for every admin form that writes a `slug` to the API.
 *
 * The catalogue is written in Hindi — services, products and campaigns all carry
 * Devanagari names — while the backend's slug field is ASCII-only
 * (`^[-a-zA-Z0-9_]+$`). The forms used to build the slug with
 * `name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`, which deletes the entire
 * name when it is Devanagari and leaves the field empty, so no service could be
 * created without the admin hand-typing a slug — and the auto-fill wiped that
 * again on the next keystroke in the name field.
 *
 * So Devanagari is transliterated to Latin first. The output is a starting point
 * the admin is expected to edit, not a canonical romanisation; it aims to land
 * close to the slugs already live (`अथर्वशीर्ष` → `atharvashirsha`,
 * `ज्योतिष` → `jyotish`).
 */

/** The backend's slug rule, shared by every model that has one. */
export const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;

/** Message shown when a slug fails {@link SLUG_PATTERN}. */
export const SLUG_PATTERN_MESSAGE =
  'Letters, digits, hyphens and underscores only';

const INDEPENDENT_VOWELS: Record<string, string> = {
  अ: 'a', आ: 'a', इ: 'i', ई: 'i', उ: 'u', ऊ: 'u',
  ऋ: 'ri', ॠ: 'ri', ऌ: 'li', ॡ: 'li',
  ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au',
  ऍ: 'e', ऎ: 'e', ऑ: 'o', ऒ: 'o',
};

/** Dependent vowel signs (matras); these replace a consonant's inherent "a". */
const VOWEL_SIGNS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
  'ृ': 'ri', 'ॄ': 'ri', 'ॢ': 'li', 'ॣ': 'li',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ॅ': 'e', 'ॆ': 'e', 'ॉ': 'o', 'ॊ': 'o',
};

const CONSONANTS: Record<string, string> = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'n',
  च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'n',
  ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n',
  त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n', 'ऩ': 'n',
  प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm',
  य: 'y', र: 'r', 'ऱ': 'r', ल: 'l', ळ: 'l', 'ऴ': 'l', व: 'v',
  श: 'sh', ष: 'sh', स: 's', ह: 'h',
  // Nukta forms, reached after the NFC pass below composes base + U+093C.
  'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z',
  'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f', 'य़': 'y',
};

const DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

const VIRAMA = '्';
const ANUSVARA = 'ं';
const CHANDRABINDU = 'ँ';
const VISARGA = 'ः';

/** Marks that carry no sound of their own and must not disturb the parser state. */
const IGNORED = new Set([
  '़', // bare nukta left over when no precomposed form exists
  '‌', // ZWNJ
  '‍', // ZWJ
  'ऽ', // avagraha
]);

/**
 * Devanagari → Latin.
 *
 * A consonant carries an inherent "a" unless a matra or a virama follows, so the
 * pending vowel is resolved one character late. At a word boundary that inherent
 * "a" is dropped the way Hindi drops it (`ज्योतिष` → `jyotish`) — except when the
 * consonant closes a conjunct, where dropping it would leave an unpronounceable
 * cluster (`अथर्वशीर्ष` → `atharvashirsha`, not `atharvashirsh`).
 */
function transliterateDevanagari(input: string): string {
  const chars = Array.from(input.normalize('NFC'));
  const out: string[] = [];

  let pendingSchwa = false;
  let schwaInConjunct = false;
  let afterVirama = false;

  const flushSchwa = (atWordEnd: boolean) => {
    if (!pendingSchwa) return;
    pendingSchwa = false;
    if (atWordEnd && !schwaInConjunct) return;
    out.push('a');
  };

  for (const char of chars) {
    if (IGNORED.has(char)) continue;

    const consonant = CONSONANTS[char];
    if (consonant) {
      flushSchwa(false);
      out.push(consonant);
      pendingSchwa = true;
      schwaInConjunct = afterVirama;
      afterVirama = false;
      continue;
    }

    if (char === VIRAMA) {
      pendingSchwa = false;
      afterVirama = true;
      continue;
    }

    const sign = VOWEL_SIGNS[char];
    if (sign) {
      pendingSchwa = false;
      out.push(sign);
      afterVirama = false;
      continue;
    }

    // The nasal/aspirate marks attach to the syllable's vowel, so the inherent
    // "a" is sounded before them: स + ं → "san", not "sn".
    if (char === ANUSVARA || char === CHANDRABINDU) {
      flushSchwa(false);
      out.push('n');
      afterVirama = false;
      continue;
    }
    if (char === VISARGA) {
      flushSchwa(false);
      out.push('h');
      afterVirama = false;
      continue;
    }

    const vowel = INDEPENDENT_VOWELS[char];
    if (vowel) {
      flushSchwa(false);
      out.push(vowel);
      afterVirama = false;
      continue;
    }

    const digit = DIGITS[char];
    if (digit) {
      flushSchwa(false);
      out.push(digit);
      afterVirama = false;
      continue;
    }

    if (char === 'ॐ') {
      flushSchwa(false);
      out.push('om');
      afterVirama = false;
      continue;
    }

    // Anything else (Latin, spaces, punctuation, danda) ends the Devanagari word.
    flushSchwa(true);
    afterVirama = false;
    out.push(char === '।' || char === '॥' ? ' ' : char);
  }

  flushSchwa(true);
  return out.join('');
}

export interface SlugifyOptions {
  /** Word separator. Hyphen for slugs, underscore for variant/option keys. */
  separator?: string;
  /** Hard cap; the backend's own limit varies per model (140–160). */
  maxLength?: number;
}

/**
 * Build an API-safe slug from a human name in Devanagari, Latin or a mix.
 *
 * Returns `""` only when the input has nothing sluggable in it at all, so a
 * caller can tell "nothing to suggest" from a real value.
 */
export function slugify(input: string, options: SlugifyOptions = {}): string {
  const { separator = '-', maxLength = 160 } = options;

  const ascii = transliterateDevanagari(input ?? '')
    // Strip Latin diacritics (é → e) once the script is Latin.
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  // Drops leading/trailing separators, including one left behind by the length cap.
  const TRIM = /^[^a-z0-9]+|[^a-z0-9]+$/g;

  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(TRIM, '')
    .slice(0, maxLength)
    .replace(TRIM, '');
}
