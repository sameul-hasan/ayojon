"use client";

import React, { useState } from "react";
import {
  Ticket,
  LayoutDashboard,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  TrendingUp,
  Download,
  Bell,
  Trash2,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Logo } from "@/components/layout/Logo";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Checkbox, Radio, SearchInput } from "@/components/ui/Input";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card, StatCard } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tabs } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EventCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";

export default function DesignPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [activeUnderlineTab, setActiveUnderlineTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchVal, setSearchVal] = useState("Dhaka Tech Hackathon");
  const [checked1, setChecked1] = useState(true);
  const [checked2, setChecked2] = useState(false);
  const [radioVal, setRadioVal] = useState("standard");
  const { toast } = useToast();

  const COLOR_SWATCHES = [
    { name: "Primary Purple", hex: "#6D28D9", class: "bg-brand-600", text: "text-white" },
    { name: "Secondary Violet", hex: "#A855F7", class: "bg-violet", text: "text-white" },
    { name: "Accent Pink", hex: "#EC4899", class: "bg-pink", text: "text-white" },
    { name: "Accent Coral", hex: "#FF7867", class: "bg-coral", text: "text-white" },
    { name: "Main Canvas", hex: "#FFFBFE", class: "bg-canvas border border-line", text: "text-ink" },
    { name: "Canvas Alt", hex: "#F5F0FF", class: "bg-canvas-alt border border-line", text: "text-ink" },
    { name: "Surface Card", hex: "#FFFFFF", class: "bg-surface border border-line", text: "text-ink" },
    { name: "Border Line", hex: "#E9E1F0", class: "bg-line", text: "text-ink" },
    { name: "Primary Ink", hex: "#24143B", class: "bg-ink", text: "text-white" },
    { name: "Muted Ink", hex: "#756B83", class: "bg-ink-muted", text: "text-white" },
    { name: "Success", hex: "#16A34A", class: "bg-success", text: "text-white" },
    { name: "Warning", hex: "#F59E0B", class: "bg-warning", text: "text-white" },
    { name: "Danger / Error", hex: "#DC2626", class: "bg-danger", text: "text-white" },
    { name: "Information", hex: "#2563EB", class: "bg-info", text: "text-white" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <PublicNavbar />

      <main className="flex-1">
        <PageContainer maxWidth="7xl" className="space-y-12">
          {/* Header Title */}
          <div className="border-b border-line pb-6 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="size-3.5 text-pink" />
              <span>Aayojon Core Design System & Tokens</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-ink">
              Design System & Brand Kit
            </h1>
            <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
              Standardized UI primitives, accessible tokens, typography rules, and responsive layouts powering all public marketplace views and SaaS workspaces.
            </p>
          </div>

          {/* 1. BRAND LOGO IMPLEMENTATION */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">1. Brand Logo Implementation</h2>
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-3">
                  Full Wordmark Logo (Horizontal)
                </h3>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="rounded-card border border-line bg-canvas p-4 text-center">
                    <Logo size="sm" />
                    <span className="block text-[11px] text-ink-muted mt-2">Small (h-7)</span>
                  </div>
                  <div className="rounded-card border border-line bg-canvas p-4 text-center">
                    <Logo size="md" />
                    <span className="block text-[11px] text-ink-muted mt-2">Medium / Default (h-9)</span>
                  </div>
                  <div className="rounded-card border border-line bg-canvas p-4 text-center">
                    <Logo size="lg" />
                    <span className="block text-[11px] text-ink-muted mt-2">Large (h-11)</span>
                  </div>
                  <div className="rounded-card border border-line bg-canvas p-4 text-center">
                    <Logo size="xl" />
                    <span className="block text-[11px] text-ink-muted mt-2">Extra Large (h-14)</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-3">
                  Icon-Only App Mark & Subtitle Variants
                </h3>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="rounded-card border border-line bg-canvas p-4 text-center">
                    <Logo variant="icon" size="sm" />
                    <span className="block text-[11px] text-ink-muted mt-2">Icon Small</span>
                  </div>
                  <div className="rounded-card border border-line bg-canvas p-4 text-center">
                    <Logo variant="icon" size="md" />
                    <span className="block text-[11px] text-ink-muted mt-2">Icon Medium</span>
                  </div>
                  <div className="rounded-card border border-line bg-canvas p-4 text-center">
                    <Logo variant="icon" size="lg" />
                    <span className="block text-[11px] text-ink-muted mt-2">Icon Large</span>
                  </div>
                  <div className="rounded-card border border-line bg-canvas p-4 text-left">
                    <Logo size="md" showText subtitle="Partner Spaces" />
                    <span className="block text-[11px] text-ink-muted mt-2">With Subtitle</span>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* 2. DESIGN TOKENS & COLOR PALETTE */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">2. Design Tokens & Color Palette</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {COLOR_SWATCHES.map((s) => (
                <div key={s.name} className="rounded-card border border-line bg-surface p-3 shadow-card space-y-2">
                  <div className={`h-12 w-full rounded-btn ${s.class}`} />
                  <div>
                    <span className="block text-xs font-bold text-ink truncate">{s.name}</span>
                    <span className="block font-mono text-[11px] text-ink-muted">{s.hex}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. BUTTONS & ACTIONS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">3. Buttons & Action Variants</h2>
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="promo">Promo</Button>
                <Button variant="danger">Danger</Button>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>

              <div className="border-t border-line pt-4 flex flex-wrap items-center gap-3">
                <Button size="sm">Small (h-8)</Button>
                <Button size="md">Medium (h-10)</Button>
                <Button size="lg">Large (h-12)</Button>
                <Button leftIcon={<Calendar className="size-4" />}>Left Icon</Button>
                <Button rightIcon={<ChevronRight className="size-4" />} variant="outline">
                  Right Icon
                </Button>
              </div>
            </Card>
          </section>

          {/* 4. FORM INPUTS & SELECTION CONTROLS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">4. Form Inputs & Selection Controls</h2>
            <Card className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Standard Input"
                  placeholder="e.g. BUET Auditorium"
                  hint="Type any text here"
                />
                <SearchInput
                  label="Search Input (Clearable)"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onClear={() => setSearchVal("")}
                  showHotkey
                />
                <Input
                  label="Validation Error State"
                  defaultValue="invalid-phone-num"
                  error="Please enter a valid 11-digit Bangladeshi mobile number"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Select Dropdown" defaultValue="dhaka">
                  <option value="dhaka">Dhaka (Central Division)</option>
                  <option value="ctg">Chattogram (Port City)</option>
                  <option value="syl">Sylhet (Tea Valley)</option>
                  <option value="raj">Rajshahi (Silk City)</option>
                </Select>

                <Textarea
                  label="Textarea Multiline"
                  rows={2}
                  placeholder="Describe special technical or acoustic requirements..."
                />
              </div>

              <div className="border-t border-line pt-4 grid gap-6 sm:grid-cols-2">
                {/* Checkboxes */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Checkboxes
                  </span>
                  <Checkbox
                    label="Air Conditioning (Central HVAC)"
                    description="Guarantees temperature control throughout the event"
                    checked={checked1}
                    onChange={(e) => setChecked1(e.target.checked)}
                  />
                  <Checkbox
                    label="Outside Sound Rig Allowed"
                    description="Requires venue coordinator written approval"
                    checked={checked2}
                    onChange={(e) => setChecked2(e.target.checked)}
                  />
                </div>

                {/* Radios */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Radio Group Selection
                  </span>
                  <Radio
                    name="shift-choice"
                    label="Full Day Slot (09:00 AM - 09:00 PM)"
                    description="Recommended for summits and hackathons"
                    checked={radioVal === "standard"}
                    onChange={() => setRadioVal("standard")}
                  />
                  <Radio
                    name="shift-choice"
                    label="Evening Gala (05:00 PM - 10:30 PM)"
                    description="Tailored for awards ceremonies and dinners"
                    checked={radioVal === "evening"}
                    onChange={() => setRadioVal("evening")}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* 5. BADGES & STATUS CHIPS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">5. Semantic Status Badges</h2>
            <Card className="p-6">
              <div className="flex flex-wrap gap-2.5">
                {(["brand", "pink", "coral", "success", "warning", "danger", "info"] as BadgeTone[]).map((t) => (
                  <Badge key={t} tone={t}>
                    {t.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </Card>
          </section>

          {/* 6. STAT CARDS & METRIC WIDGETS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">6. Stat Cards & Surface Containers</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Revenue" value="৳ 1,48,500" icon={<TrendingUp className="size-5" />} />
              <StatCard label="Tickets Sold" value="412 / 500" icon={<Ticket className="size-5" />} />
              <StatCard label="Gate Turnout" value="94.2%" icon={<Users className="size-5" />} />
              <StatCard label="Active Events" value="12" icon={<LayoutDashboard className="size-5" />} />
            </div>
          </section>

          {/* 7. TABS & PAGINATION */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">7. Navigation Tabs & Pagination</h2>
            <Card className="p-6 space-y-6">
              <div>
                <span className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                  Pill Tabs
                </span>
                <Tabs
                  variant="pill"
                  activeId={activeTab}
                  onChange={setActiveTab}
                  tabs={[
                    { id: "all", label: "All Items", badge: "24" },
                    { id: "pending", label: "Pending RFQs", badge: "3" },
                    { id: "accepted", label: "Accepted Quotes", badge: "8" },
                    { id: "archived", label: "Archived", disabled: true },
                  ]}
                />
              </div>

              <div className="border-t border-line pt-4">
                <span className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                  Underline Tabs
                </span>
                <Tabs
                  variant="underline"
                  activeId={activeUnderlineTab}
                  onChange={setActiveUnderlineTab}
                  tabs={[
                    { id: "overview", label: "Overview & Analytics" },
                    { id: "attendees", label: "Guest List" },
                    { id: "settings", label: "Event Settings" },
                  ]}
                />
              </div>

              <div className="border-t border-line pt-4">
                <span className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                  Interactive Pagination Component
                </span>
                <Pagination
                  page={currentPage}
                  totalPages={10}
                  onPageChange={setCurrentPage}
                  showTotal
                  totalItems={96}
                />
              </div>
            </Card>
          </section>

          {/* 8. MODALS, TOOLTIPS & TOASTS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">8. Modals, Dialogs, Tooltips & Toasts</h2>
            <Card className="p-6 flex flex-wrap items-center gap-4">
              <Button onClick={() => setModalOpen(true)}>Open Modal Dialog</Button>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                Open Confirmation Dialog
              </Button>
              <Tooltip content="Tooltip showing helpful contextual hint">
                <Button variant="outline">Hover for Tooltip</Button>
              </Tooltip>
              <Button
                variant="secondary"
                onClick={() =>
                  toast({
                    title: "Action Successful",
                    description: "Quotation has been submitted to organizer.",
                    tone: "success",
                  })
                }
              >
                Trigger Success Toast
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  toast({
                    title: "Payment Gateway Alert",
                    description: "Sandbox MFS verification response received.",
                    tone: "info",
                  })
                }
              >
                Trigger Info Toast
              </Button>
            </Card>
          </section>

          {/* 9. FEEDBACK STATES & SKELETON LOADERS */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-ink">9. Feedback States & Skeletons</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <EventCardSkeleton />
              <EmptyState
                title="No RFQs Submitted Yet"
                description="Use the requirement builder to request quotes from partner venues."
                action={<Button size="sm">Create Request</Button>}
              />
              <ErrorState
                title="Failed to Load Availability"
                description="Unable to sync with venue calendar. Please retry."
                onRetry={() =>
                  toast({
                    title: "Retrying connection...",
                    description: "Connecting to server.",
                    tone: "info",
                  })
                }
              />
            </div>
          </section>
        </PageContainer>
      </main>

      <PublicFooter />

      {/* Interactive Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Interactive Dialog Preview">
        <div className="space-y-3">
          <p className="text-sm text-ink-muted leading-relaxed">
            This dialog demonstrates standard modal behavior with focus management, backdrop blur, and Escape key dismissal.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button size="sm" onClick={() => setModalOpen(false)}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast({
            title: "Item Deleted",
            description: "Quotation draft was safely deleted.",
            tone: "danger",
          });
        }}
        title="Delete Quotation Draft?"
        description="Are you sure you want to permanently delete this quotation draft? This action cannot be reversed."
        confirmText="Yes, Delete Draft"
        variant="danger"
      />
    </div>
  );
}
