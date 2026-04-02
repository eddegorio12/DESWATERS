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
  "Uses real DWDS workspace samples from the implemented dashboard, billing, and follow-up surfaces.",
  "Backed by live protected modules including routes, exceptions, assistant, automation, and system readiness.",
] as const;

export const siteStats = [
  {
    value: "12+ workspaces",
    label: "Core records, routes, exceptions, assistant, automation, and readiness coverage.",
  },
  {
    value: "1 operating model",
    label: "A connected lifecycle from service account to billing, cashiering, follow-up, and supervision.",
  },
  {
    value: "Role-based access",
    label: "Protected staff access with audit-backed operational boundaries.",
  },
  {
    value: "Governed outputs",
    label: "Printable bills, receipts, notices, exports, and live record traceability.",
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
      "Register meters, track meter status, preserve holder transfers, and bind active devices to the right customer account.",
  },
  {
    title: "Capture and approve readings",
    description:
      "Record field readings, validate changes, and approve only the readings that are ready for billing.",
  },
  {
    title: "Generate bills from approved usage",
    description:
      "Apply progressive tier tariffs, minimum charges, billing governance, and print-batch controls to create official consumer bills.",
  },
  {
    title: "Post payments, notices, and collections follow-up",
    description:
      "Record cashier payments, generate notices, review overdue pressure, and keep current-day collections tied to auditable live records.",
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
      "Register active meters, assign them to customer accounts, track replacements, and preserve holder-transfer history.",
  },
  {
    title: "Reading Review",
    description:
      "Capture usage, compare previous and current values, and push only approved readings into billing.",
  },
  {
    title: "Billing Engine",
    description:
      "Generate bills against the active tariff using progressive tiers, minimum charge logic, billing cycles, and print governance.",
  },
  {
    title: "Cashiering",
    description:
      "Record completed and partial payments, issue official receipts, and keep receivables status aligned with posted settlement.",
  },
  {
    title: "Follow-Up and Notices",
    description:
      "Escalate overdue accounts, generate printable notices, and manage reminder-to-reinstatement workflow states.",
  },
  {
    title: "Route Operations",
    description:
      "Manage zones, service routes, route ownership, routed-meter coverage, complaint hotspots, and collection-risk visibility by operating area.",
  },
  {
    title: "Exceptions and Field Service",
    description:
      "Monitor anomalies, complaints, leak reports, work orders, repair history, meter replacements, and protected field-proof evidence.",
  },
  {
    title: "Assistant and Automation",
    description:
      "Use citation-backed assistant workflows, supervised worker proposals, Telegram approval paths, automation supervision logs, and readiness tooling.",
  },
] as const;

export const reportingHighlights = [
  {
    title: "Current-day totals",
    description:
      "Track completed payment volume and total collections for the active business day.",
  },
  {
    title: "Route and overdue visibility",
    description:
      "Surface unpaid, partially paid, overdue, and route-scoped accounts that still require action.",
  },
  {
    title: "Linked audit trail",
    description:
      "Trace payment, billing, notice, route, and exception state back to the underlying customer, meter, and reading records.",
  },
] as const;

export const productShowcaseCards = [
  {
    title: "Operations dashboard",
    description:
      "Real sample from the implemented DWDS dashboard showing live account volume, cashier movement, receivables pressure, and module-level utility work.",
    imageSrc: "/marketing/dashboard-preview.svg",
    imageAlt:
      "DWDS operations dashboard preview showing left navigation, summary cards, and collections performance bars.",
    href: "/platform",
    ctaLabel: "See platform structure",
  },
  {
    title: "Billing and statement review",
    description:
      "Real sample from the implemented billing workspace showing approved readings, tariff-backed billing, and printable consumer statement review.",
    imageSrc: "/marketing/billing-preview.svg",
    imageAlt:
      "DWDS billing workspace preview with bill summary cards and line-item sections for statement review.",
    href: "/workflows",
    ctaLabel: "View workflow chain",
  },
  {
    title: "Receivables follow-up",
    description:
      "Real sample from the implemented follow-up workspace showing overdue stages, notice activity, and receivables escalation handling.",
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
      "The marketing surface now shows concrete DWDS workspace samples tied to the live module set instead of abstract promises.",
  },
  {
    title: "Release scope stays explicit",
    description:
      "Consumer portal and broader public channels remain sequenced as later phases, while assistant, automation, routes, and exceptions are already part of the staff-facing product.",
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
      "DWDS keeps major concerns in separate modules so billing logic, reporting, route operations, exceptions, and automation can evolve cleanly.",
  },
  {
    title: "Protected operational access",
    description:
      "Administrative routes are shielded for staff use, with business actions tied back to authenticated sessions, role checks, and audit logs.",
  },
  {
    title: "Maintainable growth path",
    description:
      "The system is structured to support future public portals, notifications, payment channels, and supervised automation without a rewrite.",
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
      "Watch current-day collections, route-level exposure, pending work, readiness posture, and module-level operational counts.",
  },
] as const;

export const rolloutPhases = [
  {
    label: "Now",
    title: "Protected operations platform",
    description:
      "The live focus is the internal staff system covering records, readings, billing, cashiering, routes, follow-up, exceptions, notices, readiness, assistant, and automation supervision.",
  },
  {
    label: "Next",
    title: "Selective external channels",
    description:
      "The same codebase is intended to grow into carefully scoped consumer-facing access once the internal operating layer remains stable in production.",
  },
  {
    label: "Later",
    title: "Broader communication and expansion",
    description:
      "Future phases can extend public notifications, online settlement, and wider utility support workflows on top of the same governed data model.",
  },
] as const;

export const futureExpansion = [
  {
    title: "Consumer self-service",
    description:
      "Let customers view balances, payment history, and account activity from the same underlying records once the internal core is fully settled.",
  },
  {
    title: "Online settlement",
    description:
      "Add digital payment channels for Philippine consumers while preserving the cashier module for in-person transactions.",
  },
  {
    title: "Broader notifications and assistance",
    description:
      "Layer in broader external reminders, support workflows, and messaging after the operational backbone is stable.",
  },
  {
    title: "Broader utility intelligence",
    description:
      "Extend reporting with deeper route, receivables, anomaly, and automation summaries once the core transaction data is consistently flowing.",
  },
] as const;

export const conversionTrustSignals = [
  "Internal staff authentication with role-aware access boundaries.",
  "Printable bills, receipts, notices, and recovery exports linked to live operational records.",
  "PostgreSQL-first deployment path, readiness exports, and managed-hosting guidance already defined.",
] as const;

export const liveWorkspaceSamples = [
  {
    title: "Operations dashboard",
    route: "/admin/dashboard",
    summary:
      "The live operations workspace already combines queue pressure, module directory, role coverage, quick links, and current-day collections context.",
  },
  {
    title: "Billing workspace",
    route: "/admin/billing",
    summary:
      "Approved readings, billing cycles, print governance, receivable review, and print-ready bills are already handled in the protected billing module.",
  },
  {
    title: "Follow-up workspace",
    route: "/admin/follow-up",
    summary:
      "Reminder, final-notice, disconnection-review, and reinstatement workflow states already exist as explicit receivables follow-up stages.",
  },
  {
    title: "Route operations",
    route: "/admin/routes",
    summary:
      "Zones, route ownership, routed-meter coverage, overdue pressure, billed-versus-collected views, loss-risk watchlists, and complaint hotspots are already live.",
  },
  {
    title: "Exceptions workspace",
    route: "/admin/exceptions",
    summary:
      "The protected exceptions surface already covers anomaly alerts, leak reports, complaint-driven work orders, repair history, meter replacement history, and proof uploads.",
  },
  {
    title: "Staff assistant",
    route: "/admin/assistant",
    summary:
      "DWDS already includes a citation-led, read-only assistant workspace with knowledge operations, evaluation support, and saved staff conversation history.",
  },
  {
    title: "Automation supervision",
    route: "/admin/automation",
    summary:
      "Worker lanes, approval transport, retry state, stale leases, dead-letter outcomes, and execution logs are already supervised from one protected control surface.",
  },
  {
    title: "System readiness",
    route: "/admin/system-readiness",
    summary:
      "Backup snapshot logging, restore guidance, environment checks, and recent security signals are already visible in the readiness workspace.",
  },
] as const;
