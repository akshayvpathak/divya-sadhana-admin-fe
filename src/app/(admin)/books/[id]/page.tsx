'use client';

import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BookForm } from '@/components/forms/BookForm';
import { PageHeader } from '@/components/common/PageHeader';
import { useBook, useUpdateBook } from '@/hooks/useBooks';
import { bookTitle, type BookPayload } from '@/schemas/books.schema';

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: book, isLoading, isError, error } = useBook(id);
  const { mutate: updateBook, isPending } = useUpdateBook();

  function onSubmit(payload: BookPayload) {
    updateBook({ id, payload }, { onSuccess: () => router.push('/books') });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-moon">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="space-y-6">
        <PageHeader backHref="/books" title="Book" />
        <div className="rounded-2xl border border-line bg-surface p-6 text-sm text-danger">
          {error instanceof Error ? error.message : 'Could not load this book.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader backHref="/books" title={bookTitle(book)} />

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        <BookForm book={book} onSubmit={onSubmit} isPending={isPending} submitLabel="Save changes" />
      </div>
    </div>
  );
}
