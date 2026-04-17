import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";

const initialForm = { volunteer: "", event: "", hours: 2 };

export function AdminVolunteerHoursPage({ onLogout }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total_records: 0, total_hours: 0 });
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [volunteerFilter, setVolunteerFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [minHours, setMinHours] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [msg, setMsg] = useState("");

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minHours === "" ? null : Number(minHours);

    return records.filter((r) => {
      const matchesText =
        !q ||
        [r.volunteer_name, r.event_title, r.recorded_by]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const matchesVolunteer = volunteerFilter === "all" || String(r.volunteer) === volunteerFilter;
      const matchesEvent = eventFilter === "all" || String(r.event) === eventFilter;
      const matchesMin = min === null || Number(r.hours || 0) >= min;
      return matchesText && matchesVolunteer && matchesEvent && matchesMin;
    });
  }, [records, query, volunteerFilter, eventFilter, minHours]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page]);

  useEffect(() => {
    setPage(1);
  }, [query, volunteerFilter, eventFilter, minHours]);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const load = async () => {
    try {
      const [h, v, e] = await Promise.all([
        adminApi.get("/admin/volunteer-hours/"),
        adminApi.get("/admin/volunteers/"),
        adminApi.get("/admin/events/"),
      ]);
      setRecords(h.data?.records || []);
      setSummary(h.data?.summary || { total_records: 0, total_hours: 0 });
      setVolunteers(v.data || []);
      setEvents(e.data || []);
      if (!form.volunteer && v.data?.length) {
        setForm((prev) => ({ ...prev, volunteer: v.data[0].id }));
      }
      if (!form.event && e.data?.length) {
        setForm((prev) => ({ ...prev, event: e.data[0].id }));
      }
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) return clearSession();
      setMsg("Failed to load hour records");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createRecord = async (e) => {
    e.preventDefault();
    try {
      await adminApi.post("/admin/volunteer-hours/", {
        volunteer: form.volunteer,
        event: form.event,
        hours: Number(form.hours),
      });
      setMsg("Hour record created");
      load();
    } catch (err) {
      const data = err?.response?.data;
      const text = typeof data === "string" ? data : JSON.stringify(data);
      setMsg(text || "Could not create record");
    }
  };

  const removeRecord = async (id) => {
    if (!window.confirm("Delete this hour record?")) return;
    await adminApi.delete(`/admin/volunteer-hours/${id}/`);
    setMsg("Hour record deleted");
    load();
  };

  return (
    <main className="min-h-screen bg-white p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-slate-900">Volunteer Hours</h1>
        <Link to="/college/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-black uppercase tracking-wider">Back</Link>
      </div>

      {msg && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{msg}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <p className="text-xs uppercase text-slate-500 font-black">Total Records</p>
          <p className="text-2xl font-bold text-slate-900">{summary.total_records}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <p className="text-xs uppercase text-slate-500 font-black">Total Hours</p>
          <p className="text-2xl font-bold text-slate-900">{summary.total_hours}</p>
        </div>
      </div>

      <form onSubmit={createRecord} className="grid md:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.volunteer} onChange={(e) => setForm({ ...form, volunteer: e.target.value })} required>
          <option value="">Volunteer</option>
          {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} required>
          <option value="">Event</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <input type="number" step="0.25" min="0.25" className="px-3 py-2 rounded-xl border border-slate-200" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} required />
        <button className="px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider">Add Hours</button>
      </form>

      <div className="grid md:grid-cols-5 gap-3 bg-white border border-slate-100 rounded-2xl p-4">
        <input
          className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200"
          placeholder="Search volunteer or event"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={volunteerFilter} onChange={(e) => setVolunteerFilter(e.target.value)}>
          <option value="all">All Volunteers</option>
          {volunteers.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl border border-slate-200" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
          <option value="all">All Events</option>
          {events.map((e) => <option key={e.id} value={String(e.id)}>{e.title}</option>)}
        </select>
        <input
          type="number"
          min="0"
          step="0.25"
          className="px-3 py-2 rounded-xl border border-slate-200"
          placeholder="Min hours"
          value={minHours}
          onChange={(e) => setMinHours(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Volunteer</th>
              <th className="text-left px-4 py-3">Event</th>
              <th className="text-left px-4 py-3">Hours</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{r.volunteer_name}</td>
                <td className="px-4 py-3">{r.event_title}</td>
                <td className="px-4 py-3 font-semibold">{r.hours}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => removeRecord(r.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-500">Showing {paginatedRecords.length} of {filteredRecords.length} records</p>
        <div className="inline-flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold disabled:opacity-40">Prev</button>
          <span className="text-xs font-black text-slate-600">Page {page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold disabled:opacity-40">Next</button>
        </div>
      </div>
    </main>
  );
}

