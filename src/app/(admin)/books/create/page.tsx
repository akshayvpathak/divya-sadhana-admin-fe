'use client';

import { useRouter } from 'next/navigation';
import { BookForm } from '@/components/forms/BookForm';
import { PageHeader } from '@/components/common/PageHeader';
import { useCreateBook } from '@/hooks/useBooks';
import { bookId, type BookPayload } from '@/schemas/books.schema';

export default function CreateBookPage() {
  const router = useRouter();
  const { mutate: createBook, isPending } = useCreateBook();

  function onSubmit(payload: BookPayload) {
    createBook(payload, {
      onSuccess: (book) => {
        const id = bookId(book);
        router.push(id ? `/books/${id}` : '/books');
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader backHref="/books" title="Add Book" />

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
        <BookForm onSubmit={onSubmit} isPending={isPending} submitLabel="Create book" />
      </div>
    </div>
  );
}
