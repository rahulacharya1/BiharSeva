import { useEffect, useState } from "react";
import { api } from "../../api";
import { SectionHero } from "../../components/SectionHero";

export function VolunteersPage() {
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    api.get("/volunteers/").then((res) => setVolunteers(res.data)).catch(() => setVolunteers([]));
  }, []);

  return (
    <section className="stack">
      <SectionHero
        eyebrow="Community"
        title="Verified Volunteers"
        description="Public directory of active BiharSeva contributors working across districts."
        tone="clean"
      />
      <div className="grid-3">
        {volunteers.map((v) => (
          <article key={v.id} className="card feature-card">
            <h3>{v.name}</h3>
            <p>{v.college}</p>
            <p>{v.district}</p>
          </article>
        ))}
      </div>
      {volunteers.length === 0 && <article className="card">No verified volunteers to display right now.</article>}
    </section>
  );
}
