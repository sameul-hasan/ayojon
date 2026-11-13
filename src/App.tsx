import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { useAuth } from "@/lib/firebase/auth-context";

const EventsPage = lazy(() => import("@/pages/EventsPage").then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import("@/pages/EventDetailPage").then((m) => ({ default: m.EventDetailPage })));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const VenuesPage = lazy(() => import("@/pages/VenuesPage").then((m) => ({ default: m.VenuesPage })));
const VenueDetailPage = lazy(() => import("@/pages/VenueDetailPage").then((m) => ({ default: m.VenueDetailPage })));
const TicketDetailPage = lazy(() => import("@/pages/TicketDetailPage").then((m) => ({ default: m.TicketDetailPage })));
const AttendeeWalletPage = lazy(() => import("@/pages/AttendeeWalletPage").then((m) => ({ default: m.AttendeeWalletPage })));
const OrganizerWorkspacePage = lazy(() => import("@/pages/OrganizerWorkspacePage").then((m) => ({ default: m.OrganizerWorkspacePage })));
const CheckInScannerPage = lazy(() => import("@/pages/CheckInScannerPage").then((m) => ({ default: m.CheckInScannerPage })));
const ProviderWorkspacePage = lazy(() => import("@/pages/ProviderWorkspacePage").then((m) => ({ default: m.ProviderWorkspacePage })));
const SponsorMarketplacePage = lazy(() => import("@/pages/SponsorMarketplacePage").then((m) => ({ default: m.SponsorMarketplacePage })));
const SuperAdminConsolePage = lazy(() => import("@/pages/SuperAdminConsolePage").then((m) => ({ default: m.SuperAdminConsolePage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const AboutPage = lazy(() => import("@/pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const AiAssistantPage = lazy(() => import("@/pages/AiAssistantPage").then((m) => ({ default: m.AiAssistantPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const DesignTokensPage = lazy(() => import("@/pages/DesignTokensPage").then((m) => ({ default: m.DesignTokensPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Unexpected rendering error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center text-ink">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-ink-muted">{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-3 border-brand-600 border-t-transparent" />
        <p className="text-sm font-medium text-ink-muted">Loading...</p>
      </div>
    </div>
  );
}

function PortalRedirect() {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const tab = searchParams.get("tab")?.toLowerCase();

  if (tab === "organizer") return <Navigate to="/organizer" replace />;
  if (tab === "scanner") return <Navigate to="/scanner" replace />;
  if (tab === "provider") return <Navigate to="/provider" replace />;
  if (tab === "sponsor") return <Navigate to="/sponsor" replace />;
  if (tab === "admin") return <Navigate to="/admin" replace />;
  if (tab === "wallet") return <Navigate to="/wallet" replace />;

  const role = currentUser?.role || currentUser?.platform_role;
  switch (role?.toLowerCase()) {
    case "organizer":
    case "organizer_owner":
      return <Navigate to="/organizer" replace />;
    case "staff":
    case "checkin_staff":
      return <Navigate to="/scanner" replace />;
    case "venue_owner":
    case "vendor":
      return <Navigate to="/provider" replace />;
    case "sponsor":
      return <Navigate to="/sponsor" replace />;
    case "admin":
    case "super_admin":
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/wallet" replace />;
  }
}

export function App() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:slug" element={<EventDetailPage />} />
          <Route path="/events/:slug/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/:slug" element={<CheckoutPage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:slug" element={<VenueDetailPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />

          {/* DEDICATED ROLE-BASED ACCESS PAGES */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wallet" element={<AttendeeWalletPage />} />
          <Route path="/organizer" element={<OrganizerWorkspacePage />} />
          <Route path="/scanner" element={<CheckInScannerPage />} />
          <Route path="/provider" element={<ProviderWorkspacePage />} />
          <Route path="/sponsor" element={<SponsorMarketplacePage />} />
          <Route path="/admin" element={<SuperAdminConsolePage />} />

          {/* LEGACY PORTAL REDIRECT */}
          <Route path="/portal" element={<PortalRedirect />} />
          <Route path="/portal/:tab" element={<PortalRedirect />} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/ai-event-assistant" element={<AiAssistantPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/design" element={<DesignTokensPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

export default App;
