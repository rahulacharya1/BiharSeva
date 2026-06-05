import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import { setupInterceptors } from "./api";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PrivateRoute } from "./components/PrivateRoute";
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
import { AdminAddCollegePage } from "./pages/admin/AdminAddCollegePage";
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
import { AdminLayout } from "./components/AdminLayout";

// Public sections layout shell
function PublicLayout({ children, pathname }) {
  const { volunteer, adminUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell flex flex-col min-h-screen">
      <Header
        volunteer={volunteer}
        adminUser={adminUser}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className="flex-grow">
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

  const toast = useToast();

  useEffect(() => {
    setupInterceptors(toast, handleVolunteerLogout, handleAdminLogout);
  }, [toast, handleVolunteerLogout, handleAdminLogout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isAdminPanelActive = (location.pathname.startsWith("/college/") || location.pathname.startsWith("/admin/")) && 
                             !["/admin/login", "/admin/request-otp", "/admin/verify-otp"].includes(location.pathname);

  return (
    <ErrorBoundary>
      {isAdminPanelActive ? (
        <Routes>
          <Route element={<PrivateRoute role="admin"><AdminLayout /></PrivateRoute>}>
            {/* PLATFORM ADMIN CHANNELS */}
            <Route path="/admin/panel" element={<AdminPanelPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
            <Route path="/admin/colleges/add" element={<AdminAddCollegePage />} />
            <Route path="/admin/colleges" element={<AdminCollegesPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
            
            {/* COLLEGE LEVEL ADMIN CHANNELS */}
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
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      ) : (
        <PublicLayout pathname={location.pathname}>
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
            <Route path="/volunteer/profile" element={<PrivateRoute role="volunteer"><VolunteerProfilePage /></PrivateRoute>} />
            <Route path="/volunteer/request-otp" element={<VolunteerRequestOtpPage />} />
            <Route path="/volunteer/verify-otp" element={<VolunteerVerifyOtpPage />} />
            <Route path="/dashboard" element={<PrivateRoute role="volunteer"><DashboardPage volunteer={volunteer} onLogout={handleVolunteerLogout} /></PrivateRoute>} />
            <Route path="/events" element={<EventsPage volunteer={volunteer} />} />
            <Route path="/certificates" element={<PrivateRoute role="volunteer"><CertificatesPage volunteer={volunteer} /></PrivateRoute>} />
            <Route path="/admin/login" element={<AdminLoginPage onLogin={handleAdminLogin} />} />
            <Route path="/admin/request-otp" element={<AdminRequestOtpPage />} />
            <Route path="/admin/verify-otp" element={<AdminVerifyOtpPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </PublicLayout>
      )}
    </ErrorBoundary>
  );
}
