import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiAlertCircle, FiClock, FiCheckCircle, FiSliders, FiLock, FiUnlock, 
  FiTrash2, FiMaximize2, FiSearch, FiFilter, FiCompass, FiInfo
} from "react-icons/fi";
import { useSEO } from "../../hooks/useSEO";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";

export function AdminReportsPage() {
  useSEO({ 
    title: "Supervisor Reports Desk", 
    description: "BiharSeva Supervisor Reports Desk. Audit active civic reports, run workload balancing algorithms, or apply overrides.", 
    noIndex: true 
  });

  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [colleges, setColleges] = useState([]);
  
  // Filters for reports list
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [overdueSelect, setOverdueSelect] = useState("all"); 

  // Selection for active report inspection
  const [selectedReport, setSelectedReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [reassignCollegeId, setReassignCollegeId] = useState("");
  const [extendHours, setExtendHours] = useState(12);

  // Fetch Dashboard Stats & Reports
  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsRes, collegesRes] = await Promise.all([
        adminApi.get("/admin/reports/"),
        adminApi.get("/colleges/public/")
      ]);

      setReports(reportsRes.data || []);
      setColleges(collegesRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch audit logs when a report is selected
  const handleSelectReport = async (report) => {
    setSelectedReport(report);
    setAuditLogs([]);
    setReassignCollegeId(report.assigned_college?.id || "");
    try {
      setLoadingLogs(true);
      const res = await adminApi.get(`/admin/reports/${report.id}/audit-logs/`);
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit trail logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Perform Manual Override action
  const handleOverrideAction = async (action, payload = {}) => {
    if (!selectedReport) return;
    try {
      setLoading(true);
      const res = await adminApi.post(`/admin/reports/${selectedReport.id}/assign/`, {
        action,
        ...payload
      });
      toast.success(`Override action '${action.toUpperCase()}' completed successfully.`);
      
      // Refresh current report details and list
      setSelectedReport(res.data);
      // Reload overall page data
      await fetchData();
      
      // Reload audit logs
      const logsRes = await adminApi.get(`/admin/reports/${selectedReport.id}/audit-logs/`);
      setAuditLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Action failed to execute.");
    } finally {
      setLoading(false);
    }
  };

  // Delete report permanently
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to permanently delete this report? This cannot be undone.")) return;
    try {
      setLoading(true);
      await adminApi.delete(`/admin/reports/${reportId}/`);
      toast.success("Report deleted successfully.");
      setSelectedReport(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete report.");
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `BS-R${String(r.id).padStart(6, '0')}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesPriority = !priorityFilter || r.priority === priorityFilter;
    const matchesDistrict = !districtFilter || r.district === districtFilter;
    const matchesOverdue = 
      overdueSelect === "all" || 
      (overdueSelect === "overdue" && r.is_overdue);

    return matchesSearch && matchesStatus && matchesPriority && matchesDistrict && matchesOverdue;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/60 pb-8">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <FiAlertCircle className="text-emerald-500 text-3xl" /> Supervisor Reports Desk
            </h1>
            <p className="mt-2 text-slate-500 font-medium text-sm">
              Audit active civic cleanup requests, run workload balancing algorithms, or apply overrides.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : "Refresh Desk"}
            </button>
          </div>
        </div>

        {loading && reports.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-400">Loading supervisor reports list...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT & CENTER: REPORTS LIST WITH FILTERS */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filters Bar */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-4">
                <div className="relative">
                  <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports by location, reporter name, ID..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-3.5 focus:outline-none focus:border-emerald-500/50 text-xs font-semibold text-slate-900 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="relative">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending Queue</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="cleaned">Cleaned</option>
                      <option value="duplicate">Duplicate</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <FiFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                  </div>

                  {/* Priority Filter */}
                  <div className="relative">
                    <select 
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="emergency">Emergency</option>
                    </select>
                    <FiFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                  </div>

                  {/* District Filter */}
                  <div className="relative">
                    <select 
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="">All Districts</option>
                      {[...new Set([
                        ...reports.map(r => r.district).filter(Boolean),
                        ...colleges.map(c => c.district).filter(Boolean)
                      ])].sort().map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <FiFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                  </div>

                  {/* Overdue Filter */}
                  <div className="relative">
                    <select 
                      value={overdueSelect}
                      onChange={(e) => setOverdueSelect(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="all">SLA: All</option>
                      <option value="overdue">SLA Overdue Only</option>
                    </select>
                    <FiFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div 
                      key={report.id}
                      onClick={() => handleSelectReport(report)}
                      className={`bg-white p-6 rounded-[2rem] border transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        selectedReport?.id === report.id
                          ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/10" 
                          : "border-slate-100 hover:border-slate-300 shadow-[0_15px_40px_rgba(0,0,0,0.01)]"
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            BS-R{String(report.id).padStart(6, '0')}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            report.status === "pending" ? "bg-amber-100 text-amber-700" :
                            report.status === "assigned" ? "bg-blue-100 text-blue-700" :
                            report.status === "in_progress" ? "bg-indigo-100 text-indigo-700" :
                            report.status === "cleaned" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {report.status}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            report.priority === "emergency" ? "bg-red-500 text-white" :
                            report.priority === "high" ? "bg-orange-100 text-orange-700" :
                            report.priority === "medium" ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-500"
                          }`}>
                            {report.priority}
                          </span>
                          {report.is_overdue && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded animate-pulse">
                              Overdue
                            </span>
                          )}
                          {report.is_locked && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-800 text-white px-2 py-0.5 rounded flex items-center gap-1">
                              <FiLock className="text-[8px]" /> Locked
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-slate-950 leading-snug">
                          {report.location}
                        </h4>
                        
                        <p className="text-xs text-slate-500 font-semibold line-clamp-1">
                          {report.description}
                        </p>

                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold pt-1">
                          <span>District: <b className="text-slate-700">{report.district}</b></span>
                          <span>Filed: <b>{new Date(report.created_at).toLocaleDateString()}</b></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {report.assigned_college ? (
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black uppercase text-slate-400">Assigned College</p>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[150px]">{report.assigned_college.name}</p>
                          </div>
                        ) : (
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black uppercase text-amber-500">Unassigned</p>
                            <p className="text-[10px] font-bold text-slate-400">Claim deadline active</p>
                          </div>
                        )}
                        <FiMaximize2 className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white py-16 text-center border border-slate-100 rounded-[3rem] text-slate-400 font-medium space-y-2">
                    <FiAlertCircle className="text-4xl mx-auto text-slate-300" />
                    <p className="text-sm">No reports match your filters.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: SUPERVISOR INSPECTOR & OVERRIDES */}
            <div className="space-y-6">
              {selectedReport ? (
                <div className="bg-white rounded-[3rem] border border-emerald-500 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
                  {/* Header Details */}
                  <div className="p-8 bg-slate-900 text-white space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        BS-R{String(selectedReport.id).padStart(6, '0')}
                      </span>
                      <button 
                        onClick={() => setSelectedReport(null)}
                        className="text-xs text-slate-400 hover:text-white font-bold"
                      >
                        Close Details
                      </button>
                    </div>
                    <h3 className="text-lg font-black leading-snug">{selectedReport.location}</h3>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                      <span className="px-2 py-0.5 bg-white/10 rounded">District: {selectedReport.district}</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded">Status: {selectedReport.status}</span>
                    </div>
                  </div>

                  {/* Report Image */}
                  {selectedReport.photo && (
                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                      <img 
                        src={selectedReport.photo} 
                        alt="Evidence Photo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Main Content Details */}
                  <div className="p-8 space-y-8">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Problem Description</h4>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{selectedReport.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4 text-xs font-semibold">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Reporter</span>
                        <span className="text-slate-900">{selectedReport.reporter_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Assignment Type</span>
                        <span className="text-slate-900 uppercase">{selectedReport.assignment_method || "None"}</span>
                      </div>
                    </div>

                    {/* Claim Deadlines timer info */}
                    {selectedReport.status === "pending" && selectedReport.claim_deadline && (
                      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-3">
                        <FiClock className="text-amber-600 text-lg shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-black text-amber-800">Claim Queue Active</p>
                          <p className="text-amber-700/80 font-bold mt-0.5">
                            Deadline: {new Date(selectedReport.claim_deadline).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Overdue alert */}
                    {selectedReport.is_overdue && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-pulse">
                        <FiAlertCircle className="text-red-600 text-lg shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-black text-red-800">SLA Violation Escalation</p>
                          <p className="text-red-700/80 font-bold mt-0.5">
                            This report has missed active cleanup SLA targets. Intervention required.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* MANUAL SUPERVISOR OVERRIDES CONTROLS */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <FiSliders /> Supervisor Overrides
                      </h4>

                      <div className="space-y-4">
                        {/* Force Auto Assignment scoring engine */}
                        {selectedReport.status === "pending" && (
                          <button
                            onClick={() => handleOverrideAction("auto_assign")}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 font-bold text-xs uppercase tracking-widest text-white rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <FiCompass /> Run Workload Scoring (Auto)
                          </button>
                        )}

                        {/* Reassign to Specific College */}
                        <div className="space-y-2 border border-slate-100 p-4 rounded-2xl">
                          <label className="text-[10px] font-black uppercase text-slate-400 block">Manual College Reassign</label>
                          <div className="flex gap-2">
                            <select 
                              value={reassignCollegeId}
                              onChange={(e) => setReassignCollegeId(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                            >
                              <option value="">Select College...</option>
                              {colleges.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.district})
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => handleOverrideAction("reassign", { assigned_college: reassignCollegeId })}
                              disabled={!reassignCollegeId}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 font-bold text-xs text-slate-950 rounded-lg transition-all"
                            >
                              Reassign
                            </button>
                          </div>
                        </div>

                        {/* Extend Claim Timer */}
                        <div className="space-y-2 border border-slate-100 p-4 rounded-2xl">
                          <label className="text-[10px] font-black uppercase text-slate-400 block">Extend Claim Queue Timer</label>
                          <div className="flex gap-2">
                            <select 
                              value={extendHours}
                              onChange={(e) => setExtendHours(Number(e.target.value))}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                            >
                              <option value="6">+6 hours</option>
                              <option value="12">+12 hours</option>
                              <option value="24">+24 hours</option>
                              <option value="48">+48 hours</option>
                            </select>
                            <button 
                              onClick={() => handleOverrideAction("extend_deadline", { hours: extendHours })}
                              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 font-bold text-xs text-white rounded-lg transition-all"
                            >
                              Extend
                            </button>
                          </div>
                        </div>

                        {/* Upgrade / Downgrade Priority */}
                        <div className="space-y-2 border border-slate-100 p-4 rounded-2xl">
                          <label className="text-[10px] font-black uppercase text-slate-400 block">Override Priority Level</label>
                          <div className="flex gap-2">
                            <select 
                              defaultValue={selectedReport.priority}
                              onChange={(e) => handleOverrideAction("upgrade_priority", { priority: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="low">Low (48 hrs claim)</option>
                              <option value="medium">Medium (24 hrs claim)</option>
                              <option value="high">High (6 hrs claim)</option>
                              <option value="emergency">Emergency (Instant Auto Assign)</option>
                            </select>
                          </div>
                        </div>

                        {/* Toggle Lock / Unlock Report */}
                        <div className="grid grid-cols-2 gap-4">
                          {selectedReport.is_locked ? (
                            <button 
                              onClick={() => handleOverrideAction("unlock")}
                              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200"
                            >
                              Unlock
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleOverrideAction("lock")}
                              className="py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              Lock
                            </button>
                          )}

                          {selectedReport.status !== "duplicate" && (
                            <button 
                              onClick={() => handleOverrideAction("close_duplicate")}
                              className="py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              Duplicate
                            </button>
                          )}
                        </div>

                        {/* Cancel assignment / Revert to Pending */}
                        {selectedReport.status !== "pending" && (
                          <button 
                            onClick={() => handleOverrideAction("cancel")}
                            className="w-full py-2.5 border border-dashed border-red-200 text-red-600 hover:bg-red-50 bg-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            Cancel Assignment (Revert Queue)
                          </button>
                        )}

                        {/* Delete Report permanently */}
                        <button 
                          onClick={() => handleDeleteReport(selectedReport.id)}
                          className="w-full py-2.5 bg-red-100 hover:bg-red-200 text-red-750 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-red-200"
                        >
                          <FiTrash2 /> Delete Report
                        </button>
                      </div>
                    </div>

                    {/* AUDIT TRAIL LOGS TIMELINE */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Audit Trail Lifecycle
                      </h4>
                      
                      {loadingLogs ? (
                        <div className="py-4 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                          <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          Loading audit trail logs...
                        </div>
                      ) : (
                        <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                          {auditLogs.length > 0 ? (
                            auditLogs.map((log) => (
                              <div key={log.id} className="text-xs space-y-1 relative">
                                {/* Dot */}
                                <span className="absolute -left-[14px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 ring-4 ring-white" />
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                  <span className="uppercase text-slate-600">{log.action}</span>
                                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="font-semibold text-slate-800">{log.remarks}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Actor: <b>{log.username}</b></p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 font-medium py-2">No audits recorded yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.01)] text-center py-20 text-slate-400 font-semibold space-y-4">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                    <FiSearch />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-900 font-black">Inspector Panel</p>
                    <p className="text-xs text-slate-500 leading-normal max-w-[200px] mx-auto">
                      Select a civic report from the left desk list to trigger manual overrides, audit trail logs, or assignments.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
