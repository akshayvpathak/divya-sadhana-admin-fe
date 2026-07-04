'use client';

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { ApiError } from '@/services/auth.service';

/**
 * Surface query failures to the user. Previously every list/detail page ignored
 * `isError`, so a 403/404/500 rendered as an empty "No X found" state. This global
 * handler toasts the error message. 401 is intentionally skipped — the auth layer
 * (AuthContext) already handles it via refresh/logout.
 */
function notifyQueryError(error: unknown) {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === 401) return;
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  toast.error(message);
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: notifyQueryError }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </JotaiProvider>
  );
}
