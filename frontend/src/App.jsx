import { Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/public/HomePage";
import { AboutPage } from "./pages/public/AboutPage";
import { ServicesPage } from "./pages/public/ServicesPage";
import { ContactPage } from "./pages/public/ContactPage";
import { PrivacyPage } from "./pages/public/PrivacyPage";
import { VolunteersPage } from "./pages/public/VolunteersPage";
import { LeaderboardPage } from "./pages/public/LeaderboardPage";
import { ReportIssuePage } from "./pages/reports/ReportIssuePage";
import { ReportGalleryPage } from "./pages/reports/ReportGalleryPage";
import { TrackReportPage } from "./pages/reports/TrackReportPage";
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
import { NotFoundPage } from "./pages/NotFoundPage";
import { PageTransition } from "./components/PageTransition";
import { Footer } from "./app/Footer";
import { Header } from "./app/Header";

function Layout({ children, pathname }) {
  const { volunteer, adminUser } = useAuth();
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
  const {
    volunteer,
    adminUser,
    loading,
    handleVolunteerLogin,
    handleVolunteerLogout,
    handleAdminLogin,
    handleAdminLogout,
  } = useAuth();

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
    <ErrorBoundary>
      <Layout pathname={location.pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/report-issue" element={<ReportIssuePage />} />
          <Route path="/report-gallery" element={<ReportGalleryPage />} />
          <Route path="/track-report" element={<TrackReportPage />} />
          <Route path="/volunteers" element={<VolunteersPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/volunteer/register" element={<VolunteerRegisterPage />} />
          <Route path="/volunteer/login" element={<VolunteerLoginPage onLogin={handleVolunteerLogin} />} />
          <Route path="/volunteer/profile" element={<VolunteerProfilePage />} />
          <Route path="/volunteer/request-otp" element={<VolunteerRequestOtpPage />} />
          <Route path="/volunteer/verify-otp" element={<VolunteerVerifyOtpPage />} />
          <Route path="/dashboard" element={<DashboardPage volunteer={volunteer} onLogout={handleVolunteerLogout} />} />
          <Route path="/events" element={<EventsPage volunteer={volunteer} />} />
          <Route path="/certificates" element={<CertificatesPage volunteer={volunteer} />} />
          <Route path="/admin/login" element={<AdminLoginPage onLogin={handleAdminLogin} />} />
          <Route path="/admin/request-otp" element={<AdminRequestOtpPage />} />
          <Route path="/admin/verify-otp" element={<AdminVerifyOtpPage />} />
          <Route path="/admin/panel" element={<AdminPanelPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
          <Route path="/admin/colleges" element={<AdminCollegesPage adminUser={adminUser} onLogout={handleAdminLogout} />} />

          <Route path="/college/dashboard" element={<CollegeDashboardPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
          <Route path="/college/reports" element={<AdminReportsPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
          <Route path="/college/events" element={<AdminEventsPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
          <Route path="/college/volunteers" element={<AdminVolunteersPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
          <Route path="/college/certificates" element={<AdminCertificatesPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
          <Route path="/college/nss-units" element={<AdminNssUnitsPage onLogout={handleAdminLogout} />} />
          <Route path="/college/program-officers" element={<AdminProgramOfficersPage onLogout={handleAdminLogout} />} />
          <Route path="/college/activity-proposals" element={<AdminActivityProposalsPage onLogout={handleAdminLogout} />} />
          <Route path="/college/volunteer-hours" element={<AdminVolunteerHoursPage onLogout={handleAdminLogout} />} />
          <Route path="/college/badges" element={<AdminBadgesPage onLogout={handleAdminLogout} />} />
          <Route path="/college/coordinator-dashboard" element={<CoordinatorDashboardPage onLogout={handleAdminLogout} />} />
          <Route path="/college/impact-analytics" element={<ImpactAnalyticsPage onLogout={handleAdminLogout} />} />
          <Route path="/college/profile" element={<CollegeProfilePage onLogout={handleAdminLogout} />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}
