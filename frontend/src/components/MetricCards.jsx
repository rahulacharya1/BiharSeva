export function MetricCards({ items, columns = "grid-4" }) {
  return (
    <div className={columns}>
      {items.map((item) => (
        <article key={item.label} className="card stat">
          <h3>{item.value}</h3>
          <p>{item.label}</p>
        </article>
      ))}
    </div>
  );
}
