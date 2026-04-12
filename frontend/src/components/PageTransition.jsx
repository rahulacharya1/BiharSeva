export function PageTransition({ pageKey, children }) {
  return (
    <div key={pageKey} className="page-transition">
      {children}
    </div>
  );
}
