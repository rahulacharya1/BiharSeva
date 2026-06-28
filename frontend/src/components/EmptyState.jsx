import React from "react";

export function EmptyState({
  title = "No data found",
  description = "There are no records matching your criteria.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="py-16 px-6 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-5">
      <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100/60 mb-2">
        <svg
          className="w-12 h-12 stroke-current"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-slate-100 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
