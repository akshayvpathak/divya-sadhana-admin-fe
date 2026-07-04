import { redirect } from 'next/navigation';

/**
 * The standalone Territory page was merged into the Trustees page as the
 * "Coverage" tab. Keep this route working by redirecting any old links/bookmarks.
 */
export default function TerritoryPage() {
  redirect('/trustees?tab=coverage');
}
