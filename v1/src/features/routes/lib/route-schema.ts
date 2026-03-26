import { RouteResponsibility } from "@prisma/client";
import { z } from "zod";

export const serviceZoneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Zone name must be at least 2 characters.")
    .max(80, "Zone name must be 80 characters or fewer."),
  code: z
    .string()
    .trim()
    .max(20, "Zone code must be 20 characters or fewer.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  description: z
    .string()
    .trim()
    .max(200, "Zone description must be 200 characters or fewer.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export const serviceRouteSchema = z.object({
  zoneId: z.uuid("Select a valid zone."),
  name: z
    .string()
    .trim()
    .min(2, "Route name must be at least 2 characters.")
    .max(80, "Route name must be 80 characters or fewer."),
  code: z
    .string()
    .trim()
    .min(2, "Route code must be at least 2 characters.")
    .max(30, "Route code must be 30 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(200, "Route description must be 200 characters or fewer.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export const staffRouteAssignmentSchema = z.object({
  userId: z.uuid("Select a valid staff account."),
  serviceRouteId: z.uuid("Select a valid route."),
  responsibility: z.nativeEnum(RouteResponsibility),
});

export const meterRouteAssignmentSchema = z.object({
  meterId: z.uuid("Select a valid meter."),
  serviceRouteId: z.uuid("Select a valid route."),
});

export type ServiceZoneInput = z.input<typeof serviceZoneSchema>;
export type ServiceRouteInput = z.input<typeof serviceRouteSchema>;
export type StaffRouteAssignmentInput = z.input<typeof staffRouteAssignmentSchema>;
export type MeterRouteAssignmentInput = z.input<typeof meterRouteAssignmentSchema>;
