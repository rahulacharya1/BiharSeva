import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function AdminCertificatesPage({ adminUser, onLogout }) {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  useAutoDismissMessage(message, setMessage, 2500);
  const [createForm, setCreateForm] = useState({ certificate_id: "", volunteer: "", event: "" });

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const loadAll = async () => {
    try {
      const [certRes, volRes, eventRes] = await Promise.all([
        adminApi.get("/admin/certificates/"),
        adminApi.get("/admin/volunteers/"),
        adminApi.get("/admin/events/"),
      ]);
      setCertificates(certRes.data);
      setVolunteers(volRes.data);
      setEvents(eventRes.data);
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) {
        clearSession();
        return;
      }
      setMessage("Failed to load certificates data");
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createCertificate = async (e) => {
    e.preventDefault();
    try {
      await adminApi.post("/admin/certificates/", {
        certificate_id: createForm.certificate_id,
        volunteer: Number(createForm.volunteer),
        event: Number(createForm.event),
      });
      setCreateForm({ certificate_id: "", volunteer: "", event: "" });
      setMessage("Certificate created");
      loadAll();
    } catch (err) {
      setMessage(JSON.stringify(err?.response?.data || "Failed to create certificate"));
    }
  };

  const editCertificate = async (c) => {
    const certificate_id = window.prompt("Certificate ID", c.certificate_id);
    if (certificate_id === null) return;
    try {
      await adminApi.patch(`/admin/certificates/${c.id}/`, { certificate_id: certificate_id.trim() });
      setMessage("Certificate updated");
      loadAll();
    } catch (err) {
      setMessage(JSON.stringify(err?.response?.data || "Failed to update certificate"));
    }
  };

  const deleteCertificate = async (c) => {
    if (!window.confirm(`Delete ${c.certificate_id}?`)) return;
    await adminApi.delete(`/admin/certificates/${c.id}/`);
    loadAll();
  };

  if (!adminUser && !localStorage.getItem("admin_token")) {
    return <div className="p-8">Unauthorized. <Link to="/admin/login" className="underline">Login</Link></div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Certificates</h1>
        <div className="flex gap-3">
          <Link to="/admin/panel" className="px-4 py-2 rounded-xl bg-slate-200 text-sm font-bold">Back to Panel</Link>
          <button onClick={clearSession} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">Logout</button>
        </div>
      </div>

      <form onSubmit={createCertificate} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-2xl p-4 mb-6">
        <input className="border rounded-lg px-3 py-2" placeholder="Certificate ID" value={createForm.certificate_id} onChange={(e) => setCreateForm({ ...createForm, certificate_id: e.target.value })} required />
        <select className="border rounded-lg px-3 py-2" value={createForm.volunteer} onChange={(e) => setCreateForm({ ...createForm, volunteer: e.target.value })} required>
          <option value="">Select volunteer</option>
          {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2" value={createForm.event} onChange={(e) => setCreateForm({ ...createForm, event: e.target.value })} required>
          <option value="">Select event</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold">Create</button>
      </form>

      {message && <p className="mb-4 text-sm font-bold text-slate-600">{message}</p>}

      <div className="space-y-3">
        {certificates.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold">{c.certificate_id}</p>
              <p className="text-xs text-slate-500">{c.volunteer?.name} | {c.event?.title} | {c.issued_date}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => editCertificate(c)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">Edit</button>
              <button onClick={() => deleteCertificate(c)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
