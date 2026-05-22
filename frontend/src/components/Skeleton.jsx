/**
 * Reusable loading skeleton components for data-fetching pages.
 * Use these instead of spinners for a smoother perceived loading experience.
 */

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`animate-pulse bg-white rounded-[3rem] border border-slate-100 p-8 space-y-4 ${className}`}>
      <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
      <div className="h-6 bg-slate-100 rounded-xl w-3/4" />
      <div className="h-4 bg-slate-50 rounded-lg w-full" />
      <div className="h-4 bg-slate-50 rounded-lg w-2/3" />
    </div>
  );
}

export function SkeletonRow({ className = "" }) {
  return (
    <div className={`animate-pulse flex items-center gap-4 p-6 bg-slate-50 rounded-2xl ${className}`}>
      <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
        <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
      </div>
      <div className="w-16 h-6 bg-slate-200 rounded-full" />
    </div>
  );
}

export function SkeletonGrid({ count = 6, columns = "md:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <div className={`grid ${columns} gap-8`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="animate-pulse text-center space-y-6 py-20 px-6 max-w-5xl mx-auto">
      <div className="h-8 w-40 bg-slate-100 rounded-full mx-auto" />
      <div className="h-14 w-3/4 bg-slate-100 rounded-2xl mx-auto" />
      <div className="h-6 w-1/2 bg-slate-50 rounded-xl mx-auto" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-4 py-3 border-b border-slate-100">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-slate-200 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-slate-100 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
