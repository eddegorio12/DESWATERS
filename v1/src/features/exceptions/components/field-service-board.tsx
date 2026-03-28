import {
  LeakReportStatus,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@prisma/client";

import {
  AdminSurfaceHeader,
  AdminSurfacePanel,
} from "@/features/admin/components/admin-surface-panel";
import { StatusPill } from "@/features/admin/components/status-pill";
import {
  createFieldWorkOrder,
  updateFieldWorkOrder,
} from "@/features/exceptions/actions";

type OpenComplaintOption = {
  id: string;
  summary: string;
  categoryLabel: string;
  routeLabel: string;
  reportedAt: Date;
  customerName: string | null;
  meterNumber: string | null;
};

type TechnicianOption = {
  id: string;
  name: string;
};

type FieldWorkProofRow = {
  id: string;
  originalFilename: string;
  contentType: string;
  fileSizeBytes: number;
  createdAt: Date;
  uploadedByName: string;
};

type FieldWorkOrderRow = {
  id: string;
  title: string;
  detail: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  scheduledFor: Date | null;
  acknowledgedAt: Date | null;
  completedAt: Date | null;
  resolutionNotes: string | null;
  complaint: {
    id: string;
    summary: string;
    customerId: string | null;
    meterId: string | null;
    serviceZoneId: string;
    serviceRouteId: string;
    routeLabel: string;
    customerName: string | null;
    meterNumber: string | null;
  };
  createdBy: {
    name: string;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
  meterReplacementHistory: {
    replacementDate: Date;
    finalReading: number | null;
    replacementMeterNumber: string;
  } | null;
  fieldProofs: FieldWorkProofRow[];
};

type LeakReportRow = {
  id: string;
  summary: string;
  detail: string | null;
  status: LeakReportStatus;
  statusLabel: string;
  routeLabel: string;
  customerName: string | null;
  meterNumber: string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
};

type RepairHistoryRow = {
  id: string;
  repairSummary: string;
  repairDetail: string | null;
  completedAt: Date;
  routeLabel: string;
  customerName: string | null;
  meterNumber: string | null;
  recordedByName: string;
  fieldProofs: FieldWorkProofRow[];
};

type ReplacementMeterOption = {
  id: string;
  meterNumber: string;
  customerId: string | null;
  serviceZoneId: string | null;
  serviceRouteId: string | null;
};

type MeterReplacementHistoryRow = {
  id: string;
  replacementDate: Date;
  finalReading: number | null;
  reason: string | null;
  routeLabel: string;
  customerName: string | null;
  replacedMeterNumber: string;
  replacementMeterNumber: string;
  recordedByName: string;
};

const workOrderPriorityOptions = [
  WorkOrderPriority.LOW,
  WorkOrderPriority.MEDIUM,
  WorkOrderPriority.HIGH,
  WorkOrderPriority.URGENT,
] as const;

const workOrderStatusOptions = [
  WorkOrderStatus.OPEN,
  WorkOrderStatus.ASSIGNED,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.CANCELLED,
] as const;

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getPriorityPill(priority: WorkOrderPriority) {
  switch (priority) {
    case WorkOrderPriority.URGENT:
      return "overdue" as const;
    case WorkOrderPriority.HIGH:
      return "attention" as const;
    case WorkOrderPriority.MEDIUM:
      return "pending" as const;
    default:
      return "ready" as const;
  }
}

function getStatusPill(status: WorkOrderStatus) {
  switch (status) {
    case WorkOrderStatus.COMPLETED:
      return "success" as const;
    case WorkOrderStatus.CANCELLED:
      return "readonly" as const;
    case WorkOrderStatus.IN_PROGRESS:
      return "attention" as const;
    case WorkOrderStatus.ASSIGNED:
      return "pending" as const;
    default:
      return "ready" as const;
  }
}

function getLeakStatusPill(status: LeakReportStatus) {
  switch (status) {
    case LeakReportStatus.RESOLVED:
      return "success" as const;
    case LeakReportStatus.CLOSED_NO_LEAK:
      return "readonly" as const;
    case LeakReportStatus.INVESTIGATING:
      return "attention" as const;
    default:
      return "pending" as const;
  }
}

function formatStatusLabel(status: WorkOrderStatus) {
  return status.replaceAll("_", " ");
}

function formatPriorityLabel(priority: WorkOrderPriority) {
  const normalized = priority.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatFileSize(fileSizeBytes: number) {
  if (fileSizeBytes >= 1024 * 1024) {
    return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(fileSizeBytes / 1024))} KB`;
}

function FieldProofGallery({
  proofs,
  emptyState,
}: {
  proofs: FieldWorkProofRow[];
  emptyState: string;
}) {
  if (!proofs.length) {
    return <p className="text-sm text-muted-foreground">{emptyState}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {proofs.map((proof) => (
        <article
          key={proof.id}
          className="overflow-hidden rounded-[1.05rem] border border-border/70 bg-white"
        >
          <a
            href={`/admin/exceptions/proofs/${proof.id}`}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/admin/exceptions/proofs/${proof.id}`}
              alt={proof.originalFilename}
              className="h-36 w-full bg-secondary/20 object-cover"
              loading="lazy"
            />
          </a>
          <div className="space-y-1 px-3 py-3 text-xs text-muted-foreground">
            <p className="truncate font-medium text-foreground">{proof.originalFilename}</p>
            <p>
              Uploaded {formatDateTime(proof.createdAt)} by {proof.uploadedByName}
            </p>
            <div className="flex flex-wrap gap-2">
              <span>{formatFileSize(proof.fileSizeBytes)}</span>
              <a
                href={`/admin/exceptions/proofs/${proof.id}?download=1`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Download
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function FieldServiceBoard({
  openComplaints,
  technicians,
  replacementMeters,
  workOrders,
  leakReports,
  repairHistory,
  meterReplacementHistory,
  canDispatch,
  canUpdateWorkOrders,
  currentUserId,
}: {
  openComplaints: OpenComplaintOption[];
  technicians: TechnicianOption[];
  replacementMeters: ReplacementMeterOption[];
  workOrders: FieldWorkOrderRow[];
  leakReports: LeakReportRow[];
  repairHistory: RepairHistoryRow[];
  meterReplacementHistory: MeterReplacementHistoryRow[];
  canDispatch: boolean;
  canUpdateWorkOrders: boolean;
  currentUserId: string;
}) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Field Dispatch"
            title="Move open complaints into technician work"
            description="Complaint intake stays on route operations. Dispatch and completion tracking happen here so office exceptions and field response stay in one EH9 workspace."
          />

          {canDispatch ? (
            <form action={createFieldWorkOrder} className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground" htmlFor="complaintId">
                  Open complaint
                </label>
                <select
                  id="complaintId"
                  name="complaintId"
                  className="mt-2 h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select an open complaint
                  </option>
                  {openComplaints.map((complaint) => (
                    <option key={complaint.id} value={complaint.id}>
                      {complaint.summary} | {complaint.routeLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground" htmlFor="title">
                  Work-order title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                  placeholder="Inspect low-pressure complaint on Route A"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground" htmlFor="assignedToId">
                    Technician
                  </label>
                  <select
                    id="assignedToId"
                    name="assignedToId"
                    className="mt-2 h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                    defaultValue=""
                  >
                    <option value="">Leave unassigned</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground" htmlFor="priority">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue={WorkOrderPriority.MEDIUM}
                    className="mt-2 h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                  >
                    {workOrderPriorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {formatPriorityLabel(priority)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground" htmlFor="scheduledFor">
                  Scheduled visit
                </label>
                <input
                  id="scheduledFor"
                  name="scheduledFor"
                  type="datetime-local"
                  className="mt-2 h-12 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground" htmlFor="detail">
                  Dispatch notes
                </label>
                <textarea
                  id="detail"
                  name="detail"
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                  placeholder="Add field instructions, access notes, or the first troubleshooting step."
                />
              </div>

              <button
                type="submit"
                className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
                disabled={!openComplaints.length}
              >
                Create work order
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-[1.35rem] border border-border/70 bg-secondary/24 p-4 text-sm text-muted-foreground">
              Dispatch remains limited to SUPER_ADMIN and ADMIN accounts. Technicians can still update work that is already assigned to them below.
            </div>
          )}
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Field Queue"
            title="Technician work orders"
            aside={`${workOrders.length} work order${workOrders.length === 1 ? "" : "s"}`}
          />

          <div className="mt-4 space-y-4">
            {workOrders.length ? (
              workOrders.map((workOrder) => {
                const canEditThisWorkOrder =
                  canDispatch ||
                  (canUpdateWorkOrders && workOrder.assignedTo?.id === currentUserId);
                const eligibleReplacementMeters = replacementMeters.filter(
                  (meter) =>
                    meter.id !== workOrder.complaint.meterId &&
                    (!meter.customerId || meter.customerId === workOrder.complaint.customerId) &&
                    (!meter.serviceRouteId ||
                      meter.serviceRouteId === workOrder.complaint.serviceRouteId)
                );

                return (
                  <article
                    key={workOrder.id}
                    className="rounded-[1.35rem] border border-border/70 bg-white/92 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{workOrder.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {workOrder.complaint.routeLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill priority={getPriorityPill(workOrder.priority)}>
                          {formatPriorityLabel(workOrder.priority)}
                        </StatusPill>
                        <StatusPill priority={getStatusPill(workOrder.status)}>
                          {formatStatusLabel(workOrder.status)}
                        </StatusPill>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                      <p>Complaint: {workOrder.complaint.summary}</p>
                      <p>
                        Customer: {workOrder.complaint.customerName ?? "No customer linked"} | Meter:{" "}
                        {workOrder.complaint.meterNumber ?? "No meter linked"}
                      </p>
                      <p>
                        Assigned technician: {workOrder.assignedTo?.name ?? "Unassigned"} | Created by{" "}
                        {workOrder.createdBy.name}
                      </p>
                      {workOrder.scheduledFor ? (
                        <p>Scheduled visit: {formatDateTime(workOrder.scheduledFor)}</p>
                      ) : null}
                      {workOrder.acknowledgedAt ? (
                        <p>Field work started: {formatDateTime(workOrder.acknowledgedAt)}</p>
                      ) : null}
                      {workOrder.completedAt ? (
                        <p>Completed: {formatDateTime(workOrder.completedAt)}</p>
                      ) : null}
                      {workOrder.detail ? <p>Dispatch notes: {workOrder.detail}</p> : null}
                      {workOrder.resolutionNotes ? (
                        <p>Resolution notes: {workOrder.resolutionNotes}</p>
                      ) : null}
                      {workOrder.meterReplacementHistory ? (
                        <p>
                          Replacement recorded: Meter {workOrder.complaint.meterNumber ?? "Unknown"} to{" "}
                          {workOrder.meterReplacementHistory.replacementMeterNumber} on{" "}
                          {formatDateTime(workOrder.meterReplacementHistory.replacementDate)}
                          {workOrder.meterReplacementHistory.finalReading !== null
                            ? ` | Final reading ${workOrder.meterReplacementHistory.finalReading}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 rounded-[1.1rem] border border-border/70 bg-secondary/18 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Field proof
                      </p>
                      <div className="mt-3">
                        <FieldProofGallery
                          proofs={workOrder.fieldProofs}
                          emptyState="No field-proof images uploaded for this work order yet."
                        />
                      </div>
                    </div>

                    {canEditThisWorkOrder ? (
                      <form
                        action={updateFieldWorkOrder}
                        encType="multipart/form-data"
                        className="mt-5 grid gap-4 border-t border-border/70 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                      >
                        <input type="hidden" name="workOrderId" value={workOrder.id} />

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Technician
                          </label>
                          <select
                            name="assignedToId"
                            defaultValue={workOrder.assignedTo?.id ?? ""}
                            className="mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                          >
                            <option value="">Leave unassigned</option>
                            {technicians.map((technician) => (
                              <option key={technician.id} value={technician.id}>
                                {technician.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Status
                          </label>
                          <select
                            name="status"
                            defaultValue={workOrder.status}
                            className="mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                          >
                            {workOrderStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {formatStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="lg:self-end">
                          <button
                            type="submit"
                            className="h-11 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground"
                          >
                            Save update
                          </button>
                        </div>

                        <div className="lg:col-span-3">
                          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Resolution notes
                          </label>
                          <textarea
                            name="resolutionNotes"
                            rows={3}
                            defaultValue={workOrder.resolutionNotes ?? ""}
                            className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                            placeholder="What the technician found, what was fixed, or why the work was cancelled."
                          />
                        </div>

                        <div className="lg:col-span-3 rounded-[1.15rem] border border-border/70 bg-secondary/18 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Completion proof
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Upload up to 4 JPG, PNG, or WEBP images while completing the work order.
                            Images stay behind the protected exceptions route and attach to the same
                            repair audit trail.
                          </p>
                          <input
                            name="proofFiles"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="mt-4 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-2xl file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-foreground"
                          />
                        </div>

                        <div className="lg:col-span-3 rounded-[1.15rem] border border-border/70 bg-secondary/18 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Meter replacement
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Use this only when the complaint ends with a physical meter swap. The old
                            meter will be marked replaced and the selected replacement meter will inherit
                            the active service linkage when this work order is completed.
                          </p>

                          {workOrder.complaint.meterId ? (
                            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]">
                              <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Replacement action
                                </label>
                                <select
                                  name="replacementAction"
                                  defaultValue="UNCHANGED"
                                  className="mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                                >
                                  <option value="UNCHANGED">Keep current meter setup</option>
                                  <option value="REPLACED">Record installed replacement</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Replacement meter
                                </label>
                                <select
                                  name="replacementMeterId"
                                  defaultValue=""
                                  className="mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                                >
                                  <option value="">Select registered replacement meter</option>
                                  {eligibleReplacementMeters.map((meter) => (
                                    <option key={meter.id} value={meter.id}>
                                      {meter.meterNumber}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Final reading
                                </label>
                                <input
                                  name="finalReading"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="mt-2 h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                                  placeholder="Optional"
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="mt-4 rounded-[1rem] border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground">
                              This complaint is not linked to a meter, so replacement history cannot be
                              recorded from this work order.
                            </p>
                          )}
                        </div>
                      </form>
                    ) : (
                      <div className="mt-5 rounded-[1.1rem] border border-border/70 bg-secondary/24 px-4 py-3 text-sm text-muted-foreground">
                        {canDispatch
                          ? "Dispatch access is available, but this work order is currently read-only."
                          : canUpdateWorkOrders
                            ? "This work order is assigned to another technician."
                            : "Your role can view field work here but cannot update it."}
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.35rem] border border-border/70 bg-secondary/24 px-4 py-10 text-center text-sm text-muted-foreground">
                No field work orders yet. Dispatch the next open complaint from the panel on the left.
              </div>
            )}
          </div>

          {openComplaints.length ? (
            <div className="mt-6 rounded-[1.35rem] border border-border/70 bg-secondary/24 p-4">
              <p className="text-sm font-semibold text-foreground">Open complaint backlog</p>
              <div className="mt-3 space-y-3">
                {openComplaints.slice(0, 5).map((complaint) => (
                  <div
                    key={complaint.id}
                    className="border-t border-border/60 pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="text-sm font-medium text-foreground">{complaint.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {complaint.categoryLabel} | {complaint.routeLabel} | Reported{" "}
                      {formatDateTime(complaint.reportedAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Customer: {complaint.customerName ?? "No customer linked"} | Meter:{" "}
                      {complaint.meterNumber ?? "No meter linked"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </AdminSurfacePanel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Leak Register"
            title="Dedicated leak reports"
            description="Leak complaints now persist in a dedicated register so staff can separate open reports, active investigation, and resolved repairs from the broader complaint stream."
            aside={`${leakReports.length} report${leakReports.length === 1 ? "" : "s"}`}
          />

          <div className="mt-4 space-y-4">
            {leakReports.length ? (
              leakReports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-[1.35rem] border border-border/70 bg-white/92 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{report.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{report.routeLabel}</p>
                    </div>
                    <StatusPill priority={getLeakStatusPill(report.status)}>
                      {report.statusLabel}
                    </StatusPill>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <p>
                      Customer: {report.customerName ?? "No customer linked"} | Meter:{" "}
                      {report.meterNumber ?? "No meter linked"}
                    </p>
                    {report.detail ? <p>Report detail: {report.detail}</p> : null}
                    {report.resolutionNotes ? <p>Resolution notes: {report.resolutionNotes}</p> : null}
                    {report.resolvedAt ? <p>Resolved: {formatDateTime(report.resolvedAt)}</p> : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-border/70 bg-secondary/24 px-4 py-10 text-center text-sm text-muted-foreground">
                No dedicated leak reports yet. New leak complaints on route operations will start the register automatically.
              </div>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Repair History"
            title="Recent completed field repairs"
            description="Completed work orders now leave durable repair records so recurring service issues can be reviewed without depending on mutable queue state."
            aside={`${repairHistory.length} repair${repairHistory.length === 1 ? "" : "s"}`}
          />

          <div className="mt-4 space-y-4">
            {repairHistory.length ? (
              repairHistory.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.35rem] border border-border/70 bg-white/92 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{entry.repairSummary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{entry.routeLabel}</p>
                    </div>
                    <StatusPill priority="success">{formatDateTime(entry.completedAt)}</StatusPill>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <p>
                      Customer: {entry.customerName ?? "No customer linked"} | Meter:{" "}
                      {entry.meterNumber ?? "No meter linked"}
                    </p>
                    <p>Recorded by: {entry.recordedByName}</p>
                    {entry.repairDetail ? <p>Repair detail: {entry.repairDetail}</p> : null}
                  </div>

                  <div className="mt-4 rounded-[1.1rem] border border-border/70 bg-secondary/18 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Attached field proof
                    </p>
                    <div className="mt-3">
                      <FieldProofGallery
                        proofs={entry.fieldProofs}
                        emptyState="This completed repair does not have uploaded field-proof images."
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-border/70 bg-secondary/24 px-4 py-10 text-center text-sm text-muted-foreground">
                No completed repair history yet. The first completed field work order will appear here automatically.
              </div>
            )}
          </div>
        </AdminSurfacePanel>

        <AdminSurfacePanel>
          <AdminSurfaceHeader
            eyebrow="Replacement History"
            title="Recent meter swaps"
            description="Completed field work can now leave a dedicated replacement record so damaged or retired meters are traceable to the installed successor unit."
            aside={`${meterReplacementHistory.length} replacement${meterReplacementHistory.length === 1 ? "" : "s"}`}
          />

          <div className="mt-4 space-y-4">
            {meterReplacementHistory.length ? (
              meterReplacementHistory.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.35rem] border border-border/70 bg-white/92 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        Meter {entry.replacedMeterNumber} to {entry.replacementMeterNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{entry.routeLabel}</p>
                    </div>
                    <StatusPill priority="success">
                      {formatDateTime(entry.replacementDate)}
                    </StatusPill>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <p>Customer: {entry.customerName ?? "No customer linked"}</p>
                    <p>Recorded by: {entry.recordedByName}</p>
                    {entry.finalReading !== null ? (
                      <p>Final reading on replaced meter: {entry.finalReading}</p>
                    ) : null}
                    {entry.reason ? <p>Replacement note: {entry.reason}</p> : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-border/70 bg-secondary/24 px-4 py-10 text-center text-sm text-muted-foreground">
                No meter replacement history yet. Complete a meter-linked work order with a registered
                replacement meter to start the audit trail.
              </div>
            )}
          </div>
        </AdminSurfacePanel>
      </div>
    </>
  );
}
