"use server";

import { WorkOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  FIELD_PROOF_ACCEPTED_TYPES,
  FIELD_PROOF_MAX_FILE_SIZE_BYTES,
  FIELD_PROOF_MAX_FILES_PER_UPLOAD,
  prepareFieldProofFiles,
  persistPreparedFieldProofs,
  removeStoredFieldProofs,
} from "@/features/exceptions/lib/field-proof-storage";
import {
  createFieldWorkOrderSchema,
  updateFieldWorkOrderSchema,
} from "@/features/exceptions/lib/work-order-schema";
import { prisma } from "@/lib/prisma";

function revalidateExceptionWorkflows() {
  revalidatePath("/admin/exceptions");
  revalidatePath("/admin/routes");
}

function parseFieldProofUploadFiles(formData: FormData) {
  const files = formData
    .getAll("proofFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!files.length) {
    return [];
  }

  if (files.length > FIELD_PROOF_MAX_FILES_PER_UPLOAD) {
    throw new Error(
      `Upload at most ${FIELD_PROOF_MAX_FILES_PER_UPLOAD} field-proof images at a time.`
    );
  }

  for (const file of files) {
    if (!FIELD_PROOF_ACCEPTED_TYPES.includes(file.type as (typeof FIELD_PROOF_ACCEPTED_TYPES)[number])) {
      throw new Error("Field-proof uploads currently support JPG, PNG, and WEBP images only.");
    }

    if (file.size > FIELD_PROOF_MAX_FILE_SIZE_BYTES) {
      throw new Error("Each field-proof image must be 5 MB or smaller.");
    }
  }

  return files;
}

export async function createFieldWorkOrder(formData: FormData) {
  const actor = await requireStaffCapability("exceptions:dispatch");

  const parsedInput = createFieldWorkOrderSchema.safeParse({
    complaintId: formData.get("complaintId"),
    assignedToId: formData.get("assignedToId"),
    title: formData.get("title"),
    detail: formData.get("detail"),
    priority: formData.get("priority"),
    scheduledFor: formData.get("scheduledFor"),
  });

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid work-order request.");
  }

  const complaint = await prisma.complaint.findUnique({
    where: {
      id: parsedInput.data.complaintId,
    },
    select: {
      id: true,
      status: true,
      category: true,
      summary: true,
      workOrders: {
        where: {
          status: {
            in: [WorkOrderStatus.OPEN, WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!complaint) {
    throw new Error("The selected complaint no longer exists.");
  }

  if (complaint.status !== "OPEN") {
    throw new Error("Only open complaints can receive a new field work order.");
  }

  if (complaint.workOrders.length > 0) {
    throw new Error("This complaint already has an active field work order.");
  }

  let assignedTechnicianId: string | null = null;

  if (parsedInput.data.assignedToId) {
    const assignedTechnician = await prisma.user.findUnique({
      where: {
        id: parsedInput.data.assignedToId,
      },
      select: {
        id: true,
        isActive: true,
        role: true,
      },
    });

    if (!assignedTechnician || !assignedTechnician.isActive || assignedTechnician.role !== "TECHNICIAN") {
      throw new Error("The selected technician is no longer available.");
    }

    assignedTechnicianId = assignedTechnician.id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.fieldWorkOrder.create({
      data: {
        complaintId: complaint.id,
        title: parsedInput.data.title,
        detail: parsedInput.data.detail ?? complaint.summary,
        priority: parsedInput.data.priority,
        status: assignedTechnicianId ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.OPEN,
        createdById: actor.id,
        assignedToId: assignedTechnicianId,
        scheduledFor: parsedInput.data.scheduledFor ? new Date(parsedInput.data.scheduledFor) : null,
      },
    });

    if (complaint.category === "LEAK") {
      await tx.leakReport.updateMany({
        where: {
          complaintId: complaint.id,
          status: "OPEN",
        },
        data: {
          status: "INVESTIGATING",
        },
      });
    }
  });

  revalidateExceptionWorkflows();
}

export async function updateFieldWorkOrder(formData: FormData) {
  const actor = await requireStaffCapability("workorders:update");
  const proofFiles = parseFieldProofUploadFiles(formData);

  const parsedInput = updateFieldWorkOrderSchema.safeParse({
    workOrderId: formData.get("workOrderId"),
    assignedToId: formData.get("assignedToId"),
    status: formData.get("status"),
    replacementAction: formData.get("replacementAction"),
    replacementMeterId: formData.get("replacementMeterId"),
    finalReading: formData.get("finalReading"),
    resolutionNotes: formData.get("resolutionNotes"),
  });

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid work-order update.");
  }

  const workOrder = await prisma.fieldWorkOrder.findUnique({
    where: {
      id: parsedInput.data.workOrderId,
    },
    select: {
      id: true,
      status: true,
      complaintId: true,
      assignedToId: true,
      title: true,
      detail: true,
      complaint: {
        select: {
          id: true,
          category: true,
          summary: true,
          detail: true,
          customerId: true,
          meterId: true,
          serviceZoneId: true,
          serviceRouteId: true,
        },
      },
      meterReplacementHistory: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!workOrder) {
    throw new Error("The selected work order no longer exists.");
  }

  if (actor.role === "TECHNICIAN" && workOrder.assignedToId !== actor.id) {
    throw new Error("You can only update work orders assigned to your technician account.");
  }

  let assignedTechnicianId: string | null = null;

  if (parsedInput.data.assignedToId) {
    const assignedTechnician = await prisma.user.findUnique({
      where: {
        id: parsedInput.data.assignedToId,
      },
      select: {
        id: true,
        isActive: true,
        role: true,
      },
    });

    if (!assignedTechnician || !assignedTechnician.isActive || assignedTechnician.role !== "TECHNICIAN") {
      throw new Error("The selected technician is no longer available.");
    }

    assignedTechnicianId = assignedTechnician.id;
  }

  const nextStatus =
    parsedInput.data.status === WorkOrderStatus.ASSIGNED && !assignedTechnicianId
      ? WorkOrderStatus.OPEN
      : parsedInput.data.status;

  if (proofFiles.length > 0 && nextStatus !== WorkOrderStatus.COMPLETED) {
    throw new Error("Field-proof uploads can only be added while completing a work order.");
  }

  const preparedProofFiles =
    nextStatus === WorkOrderStatus.COMPLETED && proofFiles.length > 0
      ? await prepareFieldProofFiles(proofFiles)
      : [];

  let replacementMeterData:
    | {
        id: string;
        status: "ACTIVE" | "DEFECTIVE" | "REPLACED";
        customerId: string | null;
        serviceZoneId: string | null;
        serviceRouteId: string | null;
      }
    | null = null;

  if (parsedInput.data.replacementAction === "REPLACED") {
    if (nextStatus !== WorkOrderStatus.COMPLETED) {
      throw new Error("Meter replacement can only be recorded when the work order is completed.");
    }

    if (!workOrder.complaint.meterId) {
      throw new Error("Only meter-linked complaints can record a replacement history entry.");
    }

    if (!parsedInput.data.replacementMeterId) {
      throw new Error("Select the installed replacement meter before completing this work order.");
    }

    if (parsedInput.data.replacementMeterId === workOrder.complaint.meterId) {
      throw new Error("The replacement meter must be different from the damaged or removed meter.");
    }

    replacementMeterData = await prisma.meter.findUnique({
      where: {
        id: parsedInput.data.replacementMeterId,
      },
      select: {
        id: true,
        status: true,
        customerId: true,
        serviceZoneId: true,
        serviceRouteId: true,
      },
    });

    if (!replacementMeterData) {
      throw new Error("The selected replacement meter no longer exists.");
    }

    if (replacementMeterData.status !== "ACTIVE") {
      throw new Error("Only active meters can be used as installed replacement units.");
    }

    if (
      replacementMeterData.customerId &&
      replacementMeterData.customerId !== workOrder.complaint.customerId
    ) {
      throw new Error("The selected replacement meter is already linked to another customer.");
    }

    if (
      replacementMeterData.serviceRouteId &&
      replacementMeterData.serviceRouteId !== workOrder.complaint.serviceRouteId
    ) {
      throw new Error("The selected replacement meter is already mapped to another route.");
    }
  }

  await prisma.$transaction(async (tx) => {
    const completedAt = nextStatus === WorkOrderStatus.COMPLETED ? new Date() : null;

    await tx.fieldWorkOrder.update({
      where: {
        id: workOrder.id,
      },
      data: {
        assignedToId: assignedTechnicianId,
        status: nextStatus,
        acknowledgedAt:
          nextStatus === WorkOrderStatus.IN_PROGRESS && workOrder.status !== WorkOrderStatus.IN_PROGRESS
            ? new Date()
            : nextStatus === WorkOrderStatus.OPEN || nextStatus === WorkOrderStatus.ASSIGNED
              ? null
              : undefined,
        completedAt,
        completedById: nextStatus === WorkOrderStatus.COMPLETED ? actor.id : null,
        resolutionNotes: parsedInput.data.resolutionNotes ?? null,
      },
    });

    if (nextStatus === WorkOrderStatus.COMPLETED) {
      if (parsedInput.data.replacementAction === "REPLACED") {
        await tx.meter.update({
          where: {
            id: workOrder.complaint.meterId!,
          },
          data: {
            status: "REPLACED",
          },
        });

        await tx.meter.update({
          where: {
            id: replacementMeterData!.id,
          },
          data: {
            customerId: workOrder.complaint.customerId,
            serviceZoneId: workOrder.complaint.serviceZoneId,
            serviceRouteId: workOrder.complaint.serviceRouteId,
            status: "ACTIVE",
          },
        });

        await tx.meterReplacementHistory.upsert({
          where: {
            workOrderId: workOrder.id,
          },
          update: {
            complaintId: workOrder.complaintId,
            replacedMeterId: workOrder.complaint.meterId!,
            replacementMeterId: replacementMeterData!.id,
            recordedById: actor.id,
            customerId: workOrder.complaint.customerId,
            serviceZoneId: workOrder.complaint.serviceZoneId,
            serviceRouteId: workOrder.complaint.serviceRouteId,
            finalReading: parsedInput.data.finalReading,
            replacementDate: completedAt ?? new Date(),
            reason:
              parsedInput.data.resolutionNotes ??
              workOrder.detail ??
              workOrder.complaint.detail ??
              workOrder.complaint.summary,
          },
          create: {
            workOrderId: workOrder.id,
            complaintId: workOrder.complaintId,
            replacedMeterId: workOrder.complaint.meterId!,
            replacementMeterId: replacementMeterData!.id,
            recordedById: actor.id,
            customerId: workOrder.complaint.customerId,
            serviceZoneId: workOrder.complaint.serviceZoneId,
            serviceRouteId: workOrder.complaint.serviceRouteId,
            finalReading: parsedInput.data.finalReading,
            replacementDate: completedAt ?? new Date(),
            reason:
              parsedInput.data.resolutionNotes ??
              workOrder.detail ??
              workOrder.complaint.detail ??
              workOrder.complaint.summary,
          },
        });
      }

      await tx.complaint.update({
        where: {
          id: workOrder.complaintId,
        },
        data: {
          status: "RESOLVED",
          resolvedById: actor.id,
          resolvedAt: completedAt,
        },
      });

      await tx.repairHistory.upsert({
        where: {
          workOrderId: workOrder.id,
        },
        update: {
          repairSummary: workOrder.title,
          repairDetail:
            parsedInput.data.resolutionNotes ??
            workOrder.detail ??
            workOrder.complaint.detail ??
            workOrder.complaint.summary,
          recordedById: actor.id,
          customerId: workOrder.complaint.customerId,
          meterId: workOrder.complaint.meterId,
          serviceZoneId: workOrder.complaint.serviceZoneId,
          serviceRouteId: workOrder.complaint.serviceRouteId,
          completedAt: completedAt ?? new Date(),
        },
        create: {
          workOrderId: workOrder.id,
          complaintId: workOrder.complaintId,
          repairSummary: workOrder.title,
          repairDetail:
            parsedInput.data.resolutionNotes ??
            workOrder.detail ??
            workOrder.complaint.detail ??
            workOrder.complaint.summary,
          recordedById: actor.id,
          customerId: workOrder.complaint.customerId,
          meterId: workOrder.complaint.meterId,
          serviceZoneId: workOrder.complaint.serviceZoneId,
          serviceRouteId: workOrder.complaint.serviceRouteId,
          completedAt: completedAt ?? new Date(),
        },
      });

      if (workOrder.complaint.category === "LEAK") {
        await tx.leakReport.upsert({
          where: {
            complaintId: workOrder.complaintId,
          },
          update: {
            status: "RESOLVED",
            resolvedById: actor.id,
            resolvedAt: completedAt,
            resolutionNotes:
              parsedInput.data.resolutionNotes ??
              workOrder.detail ??
              workOrder.complaint.detail ??
              workOrder.complaint.summary,
          },
          create: {
            complaintId: workOrder.complaintId,
            summary: workOrder.complaint.summary,
            detail: workOrder.complaint.detail,
            status: "RESOLVED",
            createdById: actor.id,
            resolvedById: actor.id,
            resolvedAt: completedAt,
            resolutionNotes:
              parsedInput.data.resolutionNotes ??
              workOrder.detail ??
              workOrder.complaint.detail ??
              workOrder.complaint.summary,
            customerId: workOrder.complaint.customerId,
            meterId: workOrder.complaint.meterId,
            serviceZoneId: workOrder.complaint.serviceZoneId,
            serviceRouteId: workOrder.complaint.serviceRouteId,
          },
        });
      }

      if (preparedProofFiles.length > 0) {
        await tx.fieldWorkProof.createMany({
          data: preparedProofFiles.map((proof) => ({
            id: proof.id,
            workOrderId: workOrder.id,
            originalFilename: proof.originalFilename,
            storagePath: proof.storagePath,
            contentType: proof.contentType,
            fileSizeBytes: proof.fileSizeBytes,
            uploadedById: actor.id,
          })),
        });
      }

      return;
    }

    if (workOrder.status === WorkOrderStatus.COMPLETED) {
      await tx.repairHistory.deleteMany({
        where: {
          workOrderId: workOrder.id,
        },
      });

      await tx.complaint.update({
        where: {
          id: workOrder.complaintId,
        },
        data: {
          status: "OPEN",
          resolvedById: null,
          resolvedAt: null,
        },
      });

      if (workOrder.complaint.category === "LEAK") {
        await tx.leakReport.updateMany({
          where: {
            complaintId: workOrder.complaintId,
          },
          data: {
            status:
              nextStatus === WorkOrderStatus.CANCELLED ? "OPEN" : "INVESTIGATING",
            resolvedById: null,
            resolvedAt: null,
            resolutionNotes: null,
          },
        });
      }
      return;
    }

    if (workOrder.complaint.category === "LEAK") {
      const leakStatus =
        nextStatus === WorkOrderStatus.IN_PROGRESS ||
        nextStatus === WorkOrderStatus.ASSIGNED
          ? "INVESTIGATING"
          : "OPEN";

      await tx.leakReport.updateMany({
        where: {
          complaintId: workOrder.complaintId,
        },
        data: {
          status: leakStatus,
          resolvedById: null,
          resolvedAt: null,
          resolutionNotes: null,
        },
      });
    }
  });

  if (preparedProofFiles.length > 0) {
    try {
      await persistPreparedFieldProofs(preparedProofFiles);
    } catch (error) {
      await prisma.fieldWorkProof.deleteMany({
        where: {
          id: {
            in: preparedProofFiles.map((proof) => proof.id),
          },
        },
      });

      await removeStoredFieldProofs(preparedProofFiles.map((proof) => proof.storagePath));

      throw error;
    }
  }

  revalidateExceptionWorkflows();
}
