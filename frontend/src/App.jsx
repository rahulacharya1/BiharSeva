import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import { setupInterceptors } from "./api";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PrivateRoute } from "./components/PrivateRoute";
import { PageTransition } from "./components/PageTransition";
import { Footer } from "./app/Footer";
import { Header } from "./app/Header";
import { AdminLayout } from "./components/AdminLayout";
import { CollegeLayout } from "./components/CollegeLayout";
import { PageLoader } from "./components/PageLoader";

// ─── Lazy-loaded page components (code splitting) ──────────────────
// Public pages
const HomePage = lazy(() => import("./pages/public/HomePage").then(m => ({ default: m.HomePage })));
const AboutPage = lazy(() => import("./pages/public/AboutPage").then(m => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import("./pages/public/ServicesPage").then(m => ({ default: m.ServicesPage })));
const ContactPage = lazy(() => import("./pages/public/ContactPage").then(m => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import("./pages/public/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const VolunteersPage = lazy(() => import("./pages/public/VolunteersPage").then(m => ({ default: m.VolunteersPage })));
const LeaderboardPage = lazy(() => import("./pages/public/LeaderboardPage").then(m => ({ default: m.LeaderboardPage })));

// Report pages
const ReportIssuePage = lazy(() => import("./pages/reports/ReportIssuePage").then(m => ({ default: m.ReportIssuePage })));
const ReportGalleryPage = lazy(() => import("./pages/reports/ReportGalleryPage").then(m => ({ default: m.ReportGalleryPage })));
const TrackReportPage = lazy(() => import("./pages/reports/TrackReportPage").then(m => ({ default: m.TrackReportPage })));

// Volunteer pages
const VolunteerRegisterPage = lazy(() => import("./pages/volunteer/VolunteerRegisterPage").then(m => ({ default: m.VolunteerRegisterPage })));
const VolunteerLoginPage = lazy(() => import("./pages/volunteer/VolunteerLoginPage").then(m => ({ default: m.VolunteerLoginPage })));
const VolunteerProfilePage = lazy(() => import("./pages/volunteer/VolunteerProfilePage").then(m => ({ default: m.VolunteerProfilePage })));
const VolunteerRequestOtpPage = lazy(() => import("./pages/volunteer/VolunteerRequestOtpPage").then(m => ({ default: m.VolunteerRequestOtpPage })));
const VolunteerVerifyOtpPage = lazy(() => import("./pages/volunteer/VolunteerVerifyOtpPage").then(m => ({ default: m.VolunteerVerifyOtpPage })));
const DashboardPage = lazy(() => import("./pages/volunteer/DashboardPage").then(m => ({ default: m.DashboardPage })));

// Event & certificate pages
const EventsPage = lazy(() => import("./pages/events/EventsPage").then(m => ({ default: m.EventsPage })));
const CertificatesPage = lazy(() => import("./pages/certificates/CertificatesPage").then(m => ({ default: m.CertificatesPage })));

// Admin pages
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage").then(m => ({ default: m.AdminLoginPage })));
const AdminRequestOtpPage = lazy(() => import("./pages/admin/AdminRequestOtpPage").then(m => ({ default: m.AdminRequestOtpPage })));
const AdminVerifyOtpPage = lazy(() => import("./pages/admin/AdminVerifyOtpPage").then(m => ({ default: m.AdminVerifyOtpPage })));
const AdminPanelPage = lazy(() => import("./pages/admin/AdminPanelPage").then(m => ({ default: m.AdminPanelPage })));
const AdminAddCollegePage = lazy(() => import("./pages/admin/AdminAddCollegePage").then(m => ({ default: m.AdminAddCollegePage })));
const AdminCollegesPage = lazy(() => import("./pages/admin/AdminCollegesPage").then(m => ({ default: m.AdminCollegesPage })));

// College admin pages
const CollegeDashboardPage = lazy(() => import("./pages/college/CollegeDashboardPage").then(m => ({ default: m.CollegeDashboardPage })));
const AdminReportsPage = lazy(() => import("./pages/college/AdminReportsPage").then(m => ({ default: m.AdminReportsPage })));
const AdminEventsPage = lazy(() => import("./pages/college/AdminEventsPage").then(m => ({ default: m.AdminEventsPage })));
const AdminVolunteersPage = lazy(() => import("./pages/college/AdminVolunteersPage").then(m => ({ default: m.AdminVolunteersPage })));
const AdminCertificatesPage = lazy(() => import("./pages/college/AdminCertificatesPage").then(m => ({ default: m.AdminCertificatesPage })));
const AdminProgramOfficersPage = lazy(() => import("./pages/college/AdminProgramOfficersPage").then(m => ({ default: m.AdminProgramOfficersPage })));
const CollegeProfilePage = lazy(() => import("./pages/college/CollegeProfilePage").then(m => ({ default: m.CollegeProfilePage })));

// 404 page
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

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
        <PageTransition pageKey={pathname}>
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </PageTransition>
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
      <Suspense fallback={<PageLoader />}>
        {isAdminPanelActive ? (
          <Routes>
            <Route element={<PrivateRoute role="admin" allowedAdminRoles={["platform_admin"]}><AdminLayout /></PrivateRoute>}>
              {/* PLATFORM ADMIN CHANNELS */}
              <Route path="/admin/panel" element={<AdminPanelPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
              <Route path="/admin/colleges/add" element={<AdminAddCollegePage />} />
              <Route path="/admin/colleges" element={<AdminCollegesPage adminUser={adminUser} onLogout={handleAdminLogout} />} />

            </Route>

            <Route element={<PrivateRoute role="admin" allowedAdminRoles={["platform_admin", "college_admin"]}><CollegeLayout /></PrivateRoute>}>
              {/* COLLEGE LEVEL ADMIN CHANNELS */}
              <Route path="/college/dashboard" element={<CollegeDashboardPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
              <Route path="/college/reports" element={<AdminReportsPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
              <Route path="/college/events" element={<AdminEventsPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
              <Route path="/college/volunteers" element={<AdminVolunteersPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
              <Route path="/college/certificates" element={<AdminCertificatesPage adminUser={adminUser} onLogout={handleAdminLogout} />} />
              <Route path="/college/program-officers" element={<AdminProgramOfficersPage onLogout={handleAdminLogout} />} />
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
      </Suspense>
    </ErrorBoundary>
  );
}
