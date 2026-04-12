import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function AdminEventsPage({ adminUser, onLogout }) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", date: today, location: "", description: "", program_coordinator_name: "" });
  const [message, setMessage] = useState("");
  useAutoDismissMessage(message, setMessage, 2500);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const loadEvents = async () => {
    try {
      const res = await adminApi.get("/admin/events/");
      setEvents(res.data);
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) {
        clearSession();
        return;
      }
      setMessage("Failed to load events");
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      await adminApi.post("/admin/events/", form);
      setForm({ title: "", date: today, location: "", description: "", program_coordinator_name: "" });
      setMessage("Event created");
      loadEvents();
    } catch (err) {
      setMessage(JSON.stringify(err?.response?.data || "Failed to create event"));
    }
  };

  const editEvent = async (event) => {
    const title = window.prompt("Title", event.title);
    if (title === null) return;
    const date = window.prompt("Date (YYYY-MM-DD)", event.date);
    if (date === null) return;
    const location = window.prompt("Location", event.location || "");
    if (location === null) return;
    const description = window.prompt("Description", event.description || "");
    if (description === null) return;
    const program_coordinator_name = window.prompt("Coordinator", event.program_coordinator_name || "");
    if (program_coordinator_name === null) return;
    const is_completed = window.prompt("Completed? yes/no", event.is_completed ? "yes" : "no");
    if (is_completed === null) return;

    try {
      await adminApi.patch(`/admin/events/${event.id}/`, {
        title: title.trim(),
        date: date.trim(),
        location: location.trim(),
        description: description.trim(),
        program_coordinator_name: program_coordinator_name.trim(),
        is_completed: is_completed.trim().toLowerCase() === "yes",
      });
      setMessage("Event updated");
      loadEvents();
    } catch (err) {
      setMessage(JSON.stringify(err?.response?.data || "Failed to update event"));
    }
  };

  const deleteEvent = async (event) => {
    if (!window.confirm(`Delete ${event.title}?`)) return;
    await adminApi.delete(`/admin/events/${event.id}/`);
    loadEvents();
  };

  if (!adminUser && !localStorage.getItem("admin_token")) {
    return <div className="p-8">Unauthorized. <Link to="/admin/login" className="underline">Login</Link></div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Events</h1>
        <div className="flex gap-3">
          <Link to="/admin/panel" className="px-4 py-2 rounded-xl bg-slate-200 text-sm font-bold">Back to Panel</Link>
          <button onClick={clearSession} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">Logout</button>
        </div>
      </div>

      <form onSubmit={createEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-2xl p-4 mb-6">
        <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input type="date" min={today} className="border rounded-lg px-3 py-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <input className="border rounded-lg px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <textarea className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Program Coordinator" value={form.program_coordinator_name} onChange={(e) => setForm({ ...form, program_coordinator_name: e.target.value })} />
        <button className="md:col-span-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold">Create Event</button>
      </form>

      {message && <p className="mb-4 text-sm font-bold text-slate-600">{message}</p>}

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold">{e.title}</p>
              <p className="text-xs text-slate-500">{e.date} | {e.location} | {e.is_completed ? "Completed" : "Active"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => editEvent(e)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">Edit</button>
              <button onClick={() => deleteEvent(e)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
