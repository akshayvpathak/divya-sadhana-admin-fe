'use client';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `h-dvh`, not `h-screen`: on mobile Safari/Chrome `100vh` is the *expanded*
    // viewport, so the last row of every page sat under the browser chrome.
    <div className="flex h-dvh overflow-hidden bg-page">
      <Sidebar />
      {/* min-w-0 — without it the flex child adopts the table's intrinsic width
          and the whole shell scrolls sideways instead of the table alone. */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="mx-auto h-full w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
