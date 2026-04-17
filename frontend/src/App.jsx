import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { adminApi, api } from "./api";
import { HomePage } from "./pages/public/HomePage";
import { AboutPage } from "./pages/public/AboutPage";
import { CivicSensePage } from "./pages/public/CivicSensePage";
import { TrafficRulesPage } from "./pages/public/TrafficRulesPage";
import { CleanBiharPage } from "./pages/public/CleanBiharPage";
import { ServicesPage } from "./pages/public/ServicesPage";
import { ContactPage } from "./pages/public/ContactPage";
import { PrivacyPage } from "./pages/public/PrivacyPage";
import { VolunteersPage } from "./pages/public/VolunteersPage";
import { ReportIssuePage } from "./pages/reports/ReportIssuePage";
import { ReportGalleryPage } from "./pages/reports/ReportGalleryPage";
import { VolunteerRegisterPage } from "./pages/volunteer/VolunteerRegisterPage";
import { VolunteerLoginPage } from "./pages/volunteer/VolunteerLoginPage";
import { VolunteerProfilePage } from "./pages/volunteer/VolunteerProfilePage";
import { VolunteerRequestOtpPage } from "./pages/volunteer/VolunteerRequestOtpPage";
import { VolunteerVerifyOtpPage } from "./pages/volunteer/VolunteerVerifyOtpPage";
import { DashboardPage } from "./pages/volunteer/DashboardPage";
import { EventsPage } from "./pages/events/EventsPage";
import { CertificatesPage } from "./pages/certificates/CertificatesPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminRequestOtpPage } from "./pages/admin/AdminRequestOtpPage";
import { AdminVerifyOtpPage } from "./pages/admin/AdminVerifyOtpPage";
import { AdminPanelPage } from "./pages/admin/AdminPanelPage";
import { AdminCollegesPage } from "./pages/admin/AdminCollegesPage";
import { CollegeDashboardPage } from "./pages/college/CollegeDashboardPage";
import { AdminReportsPage } from "./pages/college/AdminReportsPage";
import { AdminEventsPage } from "./pages/college/AdminEventsPage";
import { AdminVolunteersPage } from "./pages/college/AdminVolunteersPage";
import { AdminCertificatesPage } from "./pages/college/AdminCertificatesPage";
import { AdminNssUnitsPage } from "./pages/college/AdminNssUnitsPage";
import { AdminProgramOfficersPage } from "./pages/college/AdminProgramOfficersPage";
import { AdminActivityProposalsPage } from "./pages/college/AdminActivityProposalsPage";
import { AdminVolunteerHoursPage } from "./pages/college/AdminVolunteerHoursPage";
import { AdminBadgesPage } from "./pages/college/AdminBadgesPage";
import { CoordinatorDashboardPage } from "./pages/college/CoordinatorDashboardPage";
import { ImpactAnalyticsPage } from "./pages/college/ImpactAnalyticsPage";
import { CollegeProfilePage } from "./pages/college/CollegeProfilePage";
import { PageTransition } from "./components/PageTransition";
import { Footer } from "./app/Footer";
import { Header } from "./app/Header";

function Layout({ children, volunteer, adminUser, pathname }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      <Header
        volunteer={volunteer}
        adminUser={adminUser}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
        onCloseMobile={closeMenu}
      />

      <main>
        <PageTransition pageKey={pathname}>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [volunteer, setVolunteer] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const volunteerToken = localStorage.getItem("volunteer_token");

    const volunteerRequest = volunteerToken
      ? api.get("/volunteers/me/")
          .then((res) => setVolunteer(res.data.volunteer))
          .catch(() => {
            localStorage.removeItem("volunteer_token");
            setVolunteer(null);
          })
      : Promise.resolve(setVolunteer(null));

    if (localStorage.getItem("admin_token")) {
      adminApi
        .get("/admin/auth/me/")
        .then((res) =>
          setAdminUser({
            username: res.data.username,
            admin_role: res.data.admin_role,
            admin_college_id: res.data.admin_college_id,
            admin_college_name: res.data.admin_college_name,
          })
        )
        .catch(() => {
          localStorage.removeItem("admin_token");
          setAdminUser(null);
        });
    }

    Promise.resolve(volunteerRequest).finally(() => setLoading(false));
  }, []);

  const handleVolunteerLogin = (payload) => {
    localStorage.setItem("volunteer_token", payload.token);
    setVolunteer(payload.volunteer);
  };

  const handleVolunteerLogout = () => {
    localStorage.removeItem("volunteer_token");
    setVolunteer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 animate-pulse">
        <div className="h-20 bg-white border-b border-slate-100" />
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <div className="h-10 w-64 bg-slate-200 rounded-xl" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-36 bg-white border border-slate-100 rounded-2xl" />
            <div className="h-36 bg-white border border-slate-100 rounded-2xl" />
            <div className="h-36 bg-white border border-slate-100 rounded-2xl" />
          </div>
          <div className="h-72 bg-white border border-slate-100 rounded-3xl" />
          <div className="h-48 bg-white border border-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <Layout volunteer={volunteer} adminUser={adminUser} pathname={location.pathname}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/civic-sense" element={<CivicSensePage />} />
        <Route path="/traffic-rules" element={<TrafficRulesPage />} />
        <Route path="/clean-bihar" element={<CleanBiharPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/report-issue" element={<ReportIssuePage />} />
        <Route path="/report-gallery" element={<ReportGalleryPage />} />
        <Route path="/volunteers" element={<VolunteersPage />} />
        <Route path="/volunteer/register" element={<VolunteerRegisterPage />} />
        <Route path="/volunteer/login" element={<VolunteerLoginPage onLogin={handleVolunteerLogin} />} />
        <Route path="/volunteer/profile" element={<VolunteerProfilePage />} />
        <Route path="/volunteer/request-otp" element={<VolunteerRequestOtpPage />} />
        <Route path="/volunteer/verify-otp" element={<VolunteerVerifyOtpPage />} />
        <Route path="/dashboard" element={<DashboardPage volunteer={volunteer} onLogout={handleVolunteerLogout} />} />
        <Route path="/events" element={<EventsPage volunteer={volunteer} />} />
        <Route path="/certificates" element={<CertificatesPage volunteer={volunteer} />} />
        <Route path="/admin/login" element={<AdminLoginPage onLogin={setAdminUser} />} />
        <Route path="/admin/request-otp" element={<AdminRequestOtpPage />} />
        <Route path="/admin/verify-otp" element={<AdminVerifyOtpPage />} />
        <Route path="/admin/panel" element={<AdminPanelPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/admin/colleges" element={<AdminCollegesPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />

        <Route path="/college/dashboard" element={<CollegeDashboardPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/reports" element={<AdminReportsPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/events" element={<AdminEventsPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/volunteers" element={<AdminVolunteersPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/certificates" element={<AdminCertificatesPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/nss-units" element={<AdminNssUnitsPage onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/program-officers" element={<AdminProgramOfficersPage onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/activity-proposals" element={<AdminActivityProposalsPage onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/volunteer-hours" element={<AdminVolunteerHoursPage onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/badges" element={<AdminBadgesPage onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/coordinator-dashboard" element={<CoordinatorDashboardPage onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/impact-analytics" element={<ImpactAnalyticsPage onLogout={() => setAdminUser(null)} />} />
        <Route path="/college/profile" element={<CollegeProfilePage onLogout={() => setAdminUser(null)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
