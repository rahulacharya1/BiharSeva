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
import { VolunteerPasswordResetPage } from "./pages/volunteer/VolunteerPasswordResetPage";
import { VolunteerRequestOtpPage } from "./pages/volunteer/VolunteerRequestOtpPage";
import { VolunteerVerifyOtpPage } from "./pages/volunteer/VolunteerVerifyOtpPage";
import { DashboardPage } from "./pages/volunteer/DashboardPage";
import { EventsPage } from "./pages/events/EventsPage";
import { CertificatesPage } from "./pages/certificates/CertificatesPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminPanelPage } from "./pages/admin/AdminPanelPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminEventsPage } from "./pages/admin/AdminEventsPage";
import { AdminVolunteersPage } from "./pages/admin/AdminVolunteersPage";
import { AdminCertificatesPage } from "./pages/admin/AdminCertificatesPage";
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
        .then((res) => setAdminUser({ username: res.data.username }))
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
        <Route path="/volunteer/password-reset" element={<VolunteerPasswordResetPage />} />
        <Route path="/volunteer/request-otp" element={<VolunteerRequestOtpPage />} />
        <Route path="/volunteer/verify-otp" element={<VolunteerVerifyOtpPage />} />
        <Route path="/dashboard" element={<DashboardPage volunteer={volunteer} onLogout={handleVolunteerLogout} />} />
        <Route path="/events" element={<EventsPage volunteer={volunteer} />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/admin/login" element={<AdminLoginPage onLogin={setAdminUser} />} />
        <Route path="/admin/panel" element={<AdminPanelPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/admin/reports" element={<AdminReportsPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/admin/events" element={<AdminEventsPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/admin/volunteers" element={<AdminVolunteersPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="/admin/certificates" element={<AdminCertificatesPage adminUser={adminUser} onLogout={() => setAdminUser(null)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
