export const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/workflows", label: "Workflows" },
  { href: "/rollout", label: "Rollout" },
] as const;

export const footerLinks = [
  ...navigationItems,
  { href: "/sign-in", label: "Admin Access" },
];

export const siteStats = [
  {
    value: "6 core modules",
    label: "Records, meters, readings, billing, payments, and collections.",
  },
  {
    value: "1 operating flow",
    label: "A connected lifecycle from service account to cashier posting.",
  },
  {
    value: "Role-based access",
    label: "Protected staff access for controlled operations work.",
  },
  {
    value: "Daily visibility",
    label: "Collections and open-account review from the same workspace.",
  },
] as const;

export const workflowSteps = [
  {
    title: "Set up customer accounts",
    description:
      "Create and maintain consumer records with service address, account number, contact details, and service status.",
  },
  {
    title: "Assign and track meters",
    description:
      "Register meters, track meter status, and bind active devices to the right customer account.",
  },
  {
    title: "Capture and approve readings",
    description:
      "Record field readings, validate changes, and approve only the readings that are ready for billing.",
  },
  {
    title: "Generate bills from approved usage",
    description:
      "Apply progressive tier tariffs, minimum charges, and billing schedule rules to create printable consumer bills.",
  },
  {
    title: "Post payments and review collections",
    description:
      "Record manual payments, update bill settlement state, and review current-day collections with audit context.",
  },
] as const;

export const moduleHighlights = [
  {
    title: "Customer Registry",
    description:
      "Maintain service accounts, addresses, statuses, and linked meter assignments in one place.",
  },
  {
    title: "Meter Operations",
    description:
      "Register active meters, assign them to customer accounts, and monitor service state over time.",
  },
  {
    title: "Reading Review",
    description:
      "Capture usage, compare previous and current values, and push only approved readings into billing.",
  },
  {
    title: "Billing Engine",
    description:
      "Generate bills against the active tariff using progressive tiers, minimum charge logic, and billing period rules.",
  },
  {
    title: "Cashiering",
    description:
      "Record completed payments against open bills and keep receivables status aligned with the posted amount.",
  },
  {
    title: "Collections Dashboard",
    description:
      "Review the current operating day, audit included payments, and monitor open-account pressure quickly.",
  },
] as const;

export const reportingHighlights = [
  {
    title: "Current-day totals",
    description:
      "Track completed payment volume and total collections for the active business day.",
  },
  {
    title: "Open-bill visibility",
    description:
      "Surface unpaid, partially paid, and overdue accounts that still require action.",
  },
  {
    title: "Linked audit trail",
    description:
      "Trace payment and billing state back to the underlying customer, meter, and reading records.",
  },
] as const;

export const platformPillars = [
  {
    title: "Modular by default",
    description:
      "DESWATERS keeps major concerns in separate modules so billing logic, reporting, and account operations can evolve cleanly.",
  },
  {
    title: "Protected operational access",
    description:
      "Administrative routes are shielded for staff use, with business actions tied back to authenticated sessions.",
  },
  {
    title: "Maintainable growth path",
    description:
      "The system is structured to support future public portals, notifications, and payment channels without a rewrite.",
  },
] as const;

export const operatorViews = [
  {
    title: "Billing staff",
    description:
      "Review approved readings, generate bills, and monitor open receivables from one queue.",
  },
  {
    title: "Cashiers",
    description:
      "Select open bills, post completed payments, and verify payment history without leaving the module.",
  },
  {
    title: "Meter readers",
    description:
      "Capture and submit field readings into a controlled review process rather than direct billing.",
  },
  {
    title: "Managers",
    description:
      "Watch current-day collections, active account volume, pending work, and module-level operational counts.",
  },
] as const;

export const rolloutPhases = [
  {
    label: "Now",
    title: "Protected admin MVP",
    description:
      "The live focus is the internal staff system for accounts, meter readings, billing, cashiering, and collections reporting.",
  },
  {
    label: "Next",
    title: "Customer-facing portal",
    description:
      "The same codebase is intended to grow into a self-service consumer portal for bill and payment visibility.",
  },
  {
    label: "Later",
    title: "Communication and automation",
    description:
      "Future phases can add notifications, online settlement, and utility support workflows on top of the same data model.",
  },
] as const;

export const futureExpansion = [
  {
    title: "Consumer self-service",
    description:
      "Let customers view balances, payment history, and account activity from the same underlying records.",
  },
  {
    title: "Online settlement",
    description:
      "Add digital payment channels for Philippine consumers while preserving the cashier module for in-person transactions.",
  },
  {
    title: "Notifications and assistance",
    description:
      "Layer in reminders, support workflows, and messaging after the operational backbone is stable.",
  },
  {
    title: "Broader utility intelligence",
    description:
      "Extend reporting with more advanced operational summaries once the core transaction data is consistently flowing.",
  },
] as const;
