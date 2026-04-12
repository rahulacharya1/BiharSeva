export function SectionHero({ eyebrow, title, description, tone = "default" }) {
  const toneClassMap = {
    default: "",
    warning: "warning-hero",
    civic: "civic-hero",
    clean: "clean-hero",
    trust: "trust-hero",
  };

  const heroClass = `hero jumbo ${toneClassMap[tone] || ""}`.trim();

  return (
    <div className={heroClass}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
