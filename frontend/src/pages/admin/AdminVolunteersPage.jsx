import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi } from "../../api";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";

export function AdminVolunteersPage({ adminUser, onLogout }) {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [message, setMessage] = useState("");
  useAutoDismissMessage(message, setMessage, 2500);

  const clearSession = () => {
    localStorage.removeItem("admin_token");
    onLogout?.();
    navigate("/admin/login");
  };

  const loadVolunteers = async () => {
    try {
      const res = await adminApi.get("/admin/volunteers/");
      setVolunteers(res.data);
    } catch (err) {
      if ([401, 403].includes(err?.response?.status)) {
        clearSession();
        return;
      }
      setMessage("Failed to load volunteers");
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  const verify = async (id, action) => {
    await adminApi.patch(`/admin/volunteers/${id}/`, { action });
    loadVolunteers();
  };

  const editVolunteer = async (v) => {
    const name = window.prompt("Name", v.name || "");
    if (name === null) return;
    const college = window.prompt("College", v.college || "");
    if (college === null) return;
    const phone = window.prompt("Phone", v.phone || "");
    if (phone === null) return;
    const district = window.prompt("District", v.district || "");
    if (district === null) return;
    const has_participated = window.prompt("Has participated? yes/no", v.has_participated ? "yes" : "no");
    if (has_participated === null) return;

    try {
      await adminApi.patch(`/admin/volunteers/${v.id}/`, {
        name: name.trim(),
        college: college.trim(),
        phone: phone.trim(),
        district: district.trim(),
        has_participated: has_participated.trim().toLowerCase() === "yes",
      });
      setMessage("Volunteer updated");
      loadVolunteers();
    } catch (err) {
      setMessage(JSON.stringify(err?.response?.data || "Failed to update volunteer"));
    }
  };

  const deleteVolunteer = async (v) => {
    if (!window.confirm(`Delete ${v.name}?`)) return;
    await adminApi.delete(`/admin/volunteers/${v.id}/`);
    loadVolunteers();
  };

  if (!adminUser && !localStorage.getItem("admin_token")) {
    return <div className="p-8">Unauthorized. <Link to="/admin/login" className="underline">Login</Link></div>;
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Volunteers</h1>
        <div className="flex gap-3">
          <Link to="/admin/panel" className="px-4 py-2 rounded-xl bg-slate-200 text-sm font-bold">Back to Panel</Link>
          <button onClick={clearSession} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">Logout</button>
        </div>
      </div>

      {message && <p className="mb-4 text-sm font-bold text-slate-600">{message}</p>}

      <div className="space-y-3">
        {volunteers.map((v) => (
          <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold">{v.name}</p>
              <p className="text-xs text-slate-500">{v.email} | {v.phone} | {v.district}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${v.is_verified ? "text-emerald-700" : "text-amber-700"}`}>{v.is_verified ? "Verified" : "Pending"}</span>
              <button onClick={() => verify(v.id, "verify")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${v.is_verified ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-700"}`}>Approve</button>
              <button onClick={() => verify(v.id, "unverify")} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${!v.is_verified ? "bg-amber-700 text-white" : "bg-slate-200 text-slate-600"}`}>Reject</button>
              <button onClick={() => editVolunteer(v)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">Edit</button>
              <button onClick={() => deleteVolunteer(v)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
