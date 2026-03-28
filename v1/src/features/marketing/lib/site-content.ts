export const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/workflows", label: "Workflows" },
  { href: "/rollout", label: "Rollout" },
] as const;

export const footerLinks = [
  ...navigationItems,
  { href: "/contact", label: "Plan rollout" },
  { href: "/sign-in", label: "Admin Access" },
];

export const proofStatements = [
  "Built from the live DWDS module structure, not placeholder product copy.",
  "Ready to demo with role-based operations, printable outputs, and audit context.",
  "Structured for deployment as one codebase across public and staff-facing surfaces.",
] as const;

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

export const productShowcaseCards = [
  {
    title: "Operations dashboard",
    description:
      "A single control surface for live account volume, cashier movement, receivables pressure, and module-level utility work.",
    imageSrc: "/marketing/dashboard-preview.svg",
    imageAlt:
      "DWDS operations dashboard preview showing left navigation, summary cards, and collections performance bars.",
    href: "/platform",
    ctaLabel: "See platform structure",
  },
  {
    title: "Billing and statement review",
    description:
      "Approved readings, tariff-backed billing, and printable consumer statements stay connected so billing remains traceable.",
    imageSrc: "/marketing/billing-preview.svg",
    imageAlt:
      "DWDS billing workspace preview with bill summary cards and line-item sections for statement review.",
    href: "/workflows",
    ctaLabel: "View workflow chain",
  },
  {
    title: "Receivables follow-up",
    description:
      "Reminder, final-notice, disconnection review, and reinstatement work now sit in a dedicated operational queue.",
    imageSrc: "/marketing/follow-up-preview.svg",
    imageAlt:
      "DWDS follow-up workspace preview showing overdue stages, account detail, and notification activity.",
    href: "/rollout",
    ctaLabel: "Review rollout path",
  },
] as const;

export const launchReadiness = [
  {
    title: "Brand assets in place",
    description:
      "DWDS now has a reusable public wordmark, monogram, and consistent site identity for demos and deployment.",
  },
  {
    title: "Public proof is product-aligned",
    description:
      "The marketing surface now shows concrete product views tied to the live module set instead of abstract promises.",
  },
  {
    title: "Future expansion stays explicit",
    description:
      "Consumer portal, online payments, and broader notifications remain sequenced as later channels, not implied current features.",
  },
] as const;

export const brandPrinciples = [
  {
    title: "Utility-first clarity",
    description:
      "The visual system stays readable, operational, and confident without borrowing consumer-fintech styling that does not fit the product.",
  },
  {
    title: "One public story",
    description:
      "Screens, copy, and rollout messaging now describe the same DWDS product state the admin application already supports.",
  },
  {
    title: "Deployment-ready positioning",
    description:
      "The site is now suitable for rollout conversations, internal demos, and early customer-facing presentation without placeholder language.",
  },
] as const;

export const platformPillars = [
  {
    title: "Modular by default",
    description:
      "DWDS keeps major concerns in separate modules so billing logic, reporting, and account operations can evolve cleanly.",
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

export const conversionTrustSignals = [
  "Internal staff authentication with role-aware access boundaries.",
  "Printable bills, receipts, and notices linked to live operational records.",
  "PostgreSQL-first deployment path with managed-hosting readiness already defined.",
] as const;
