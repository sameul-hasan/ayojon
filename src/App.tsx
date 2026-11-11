import React from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { EventsPage } from "@/pages/EventsPage";
import { EventDetailPage } from "@/pages/EventDetailPage";
import { VenuesPage } from "@/pages/VenuesPage";
import { VenueDetailPage } from "@/pages/VenueDetailPage";
import { TicketDetailPage } from "@/pages/TicketDetailPage";
import { AttendeeWalletPage } from "@/pages/AttendeeWalletPage";
import { OrganizerWorkspacePage } from "@/pages/OrganizerWorkspacePage";
import { CheckInScannerPage } from "@/pages/CheckInScannerPage";
import { ProviderWorkspacePage } from "@/pages/ProviderWorkspacePage";
import { SponsorMarketplacePage } from "@/pages/SponsorMarketplacePage";
import { SuperAdminConsolePage } from "@/pages/SuperAdminConsolePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AboutPage } from "@/pages/AboutPage";
import { AiAssistantPage } from "@/pages/AiAssistantPage";
import { LoginPage } from "@/pages/LoginPage";
import { DesignTokensPage } from "@/pages/DesignTokensPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useAuth } from "@/lib/firebase/auth-context";

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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:slug" element={<EventDetailPage />} />
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
  );
}

export default App;
