"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0c0a09] text-[#fafaf9] min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-serif italic text-[#f59e0b] mb-4">Something went wrong</h1>
          <p className="text-sm text-[#a8a29e] mb-8">{error.message}</p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-[#f59e0b] text-black text-xs font-mono uppercase tracking-widest hover:bg-white transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
