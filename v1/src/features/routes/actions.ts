"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  meterRouteAssignmentSchema,
  routeComplaintSchema,
  serviceRouteSchema,
  serviceZoneSchema,
  staffRouteAssignmentSchema,
  type MeterRouteAssignmentInput,
  type RouteComplaintInput,
  type ServiceRouteInput,
  type ServiceZoneInput,
  type StaffRouteAssignmentInput,
} from "@/features/routes/lib/route-schema";
import { prisma } from "@/lib/prisma";

function revalidateRoutePaths() {
  revalidatePath("/admin/routes");
  revalidatePath("/admin/meters");
  revalidatePath("/admin/readings");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/collections");
  revalidatePath("/admin/dashboard");
}

export async function createServiceZone(values: ServiceZoneInput) {
  await requireStaffCapability("routes:manage");

  const parsedValues = serviceZoneSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid zone data.");
  }

  try {
    const zone = await prisma.serviceZone.create({
      data: {
        name: parsedValues.data.name,
        code: parsedValues.data.code,
        description: parsedValues.data.description,
      },
      select: {
        id: true,
        name: true,
      },
    });

    revalidateRoutePaths();
    return zone;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("That zone name or code is already in use.");
    }

    throw error;
  }
}

export async function createServiceRoute(values: ServiceRouteInput) {
  await requireStaffCapability("routes:manage");

  const parsedValues = serviceRouteSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid route data.");
  }

  const zone = await prisma.serviceZone.findUnique({
    where: {
      id: parsedValues.data.zoneId,
    },
    select: {
      id: true,
    },
  });

  if (!zone) {
    throw new Error("The selected zone no longer exists.");
  }

  try {
    const route = await prisma.serviceRoute.create({
      data: {
        zoneId: zone.id,
        name: parsedValues.data.name,
        code: parsedValues.data.code,
        description: parsedValues.data.description,
      },
      select: {
        id: true,
        name: true,
      },
    });

    revalidateRoutePaths();
    return route;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("That route code or route name is already in use for the selected zone.");
    }

    throw error;
  }
}

export async function assignStaffRoute(values: StaffRouteAssignmentInput) {
  await requireStaffCapability("routes:manage");

  const parsedValues = staffRouteAssignmentSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid route assignment.");
  }

  const [user, route] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: parsedValues.data.userId,
      },
      select: {
        id: true,
        isActive: true,
      },
    }),
    prisma.serviceRoute.findUnique({
      where: {
        id: parsedValues.data.serviceRouteId,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!user || !user.isActive) {
    throw new Error("The selected staff account is no longer active.");
  }

  if (!route) {
    throw new Error("The selected route no longer exists.");
  }

  await prisma.staffRouteAssignment.upsert({
    where: {
      userId_serviceRouteId_responsibility: {
        userId: parsedValues.data.userId,
        serviceRouteId: parsedValues.data.serviceRouteId,
        responsibility: parsedValues.data.responsibility,
      },
    },
    update: {
      isPrimary: true,
      releasedAt: null,
    },
    create: {
      userId: parsedValues.data.userId,
      serviceRouteId: parsedValues.data.serviceRouteId,
      responsibility: parsedValues.data.responsibility,
      isPrimary: true,
    },
  });

  revalidateRoutePaths();
}

export async function assignMeterRoute(values: MeterRouteAssignmentInput) {
  await requireStaffCapability("routes:manage");

  const parsedValues = meterRouteAssignmentSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid meter route assignment.");
  }

  const [meter, route] = await Promise.all([
    prisma.meter.findUnique({
      where: {
        id: parsedValues.data.meterId,
      },
      select: {
        id: true,
      },
    }),
    prisma.serviceRoute.findUnique({
      where: {
        id: parsedValues.data.serviceRouteId,
      },
      select: {
        id: true,
        zoneId: true,
      },
    }),
  ]);

  if (!meter) {
    throw new Error("The selected meter no longer exists.");
  }

  if (!route) {
    throw new Error("The selected route no longer exists.");
  }

  await prisma.meter.update({
    where: {
      id: meter.id,
    },
    data: {
      serviceRouteId: route.id,
      serviceZoneId: route.zoneId,
    },
  });

  revalidateRoutePaths();
}

export async function createRouteComplaint(values: RouteComplaintInput) {
  const actor = await requireStaffCapability("routes:manage");

  const parsedValues = routeComplaintSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid complaint data.");
  }

  const route = await prisma.serviceRoute.findUnique({
    where: {
      id: parsedValues.data.serviceRouteId,
    },
    select: {
      id: true,
      zoneId: true,
    },
  });

  if (!route) {
    throw new Error("The selected route no longer exists.");
  }

  let meterData:
    | {
        id: string;
        customerId: string | null;
        serviceRouteId: string | null;
      }
    | null = null;

  if (parsedValues.data.meterId) {
    meterData = await prisma.meter.findUnique({
      where: {
        id: parsedValues.data.meterId,
      },
      select: {
        id: true,
        customerId: true,
        serviceRouteId: true,
      },
    });

    if (!meterData) {
      throw new Error("The selected meter no longer exists.");
    }

    if (meterData.serviceRouteId !== route.id) {
      throw new Error("The selected meter is not mapped to the chosen route.");
    }
  }

  await prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.create({
      data: {
        summary: parsedValues.data.summary,
        detail: parsedValues.data.detail,
        category: parsedValues.data.category,
        createdById: actor.id,
        customerId: meterData?.customerId ?? null,
        meterId: meterData?.id ?? null,
        serviceZoneId: route.zoneId,
        serviceRouteId: route.id,
      },
      select: {
        id: true,
      },
    });

    if (parsedValues.data.category === "LEAK") {
      await tx.leakReport.create({
        data: {
          complaintId: complaint.id,
          summary: parsedValues.data.summary,
          detail: parsedValues.data.detail,
          createdById: actor.id,
          customerId: meterData?.customerId ?? null,
          meterId: meterData?.id ?? null,
          serviceZoneId: route.zoneId,
          serviceRouteId: route.id,
        },
      });
    }
  });

  revalidateRoutePaths();
}
