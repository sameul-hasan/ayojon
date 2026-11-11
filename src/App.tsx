import React from "react";
import { Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { EventsPage } from "@/pages/EventsPage";
import { EventDetailPage } from "@/pages/EventDetailPage";
import { VenuesPage } from "@/pages/VenuesPage";
import { VenueDetailPage } from "@/pages/VenueDetailPage";
import { TicketDetailPage } from "@/pages/TicketDetailPage";
import { PortalPage } from "@/pages/PortalPage";
import { SuperAdminConsolePage } from "@/pages/SuperAdminConsolePage";
import { AboutPage } from "@/pages/AboutPage";
import { AiAssistantPage } from "@/pages/AiAssistantPage";
import { LoginPage } from "@/pages/LoginPage";
import { DesignTokensPage } from "@/pages/DesignTokensPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:slug" element={<EventDetailPage />} />
      <Route path="/venues" element={<VenuesPage />} />
      <Route path="/venues/:slug" element={<VenueDetailPage />} />
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
      <Route path="/portal" element={<PortalPage />} />
      <Route path="/portal/:tab" element={<PortalPage />} />
      <Route path="/admin" element={<SuperAdminConsolePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/ai-event-assistant" element={<AiAssistantPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/design" element={<DesignTokensPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

