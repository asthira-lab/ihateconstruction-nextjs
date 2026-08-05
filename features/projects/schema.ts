// Zod schemas for the Projects API contract. Client + server share this.

import { z } from "zod";

const iso3166Alpha2Schema = z
  .string()
  .regex(/^[A-Z]{2}$/, { message: "Must be a 2-letter ISO 3166-1 country code (uppercase)" });

const iso4217Schema = z
  .string()
  .regex(/^[A-Z]{3}$/, { message: "Must be a 3-letter ISO 4217 currency code (uppercase)" });

const pincodeINSchema = z
  .string()
  .regex(/^[1-9]\d{5}$/, { message: "Must be a 6-digit Indian pincode" });

export const locationSchema = z
  .object({
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    pincode: z.string().max(20).optional(),
    country: iso3166Alpha2Schema.optional(),
  })
  .strict();

const nameSchema = z.string().trim().min(1, { message: "Required" }).max(200);
const clientNameSchema = z.string().trim().max(200);
const notesSchema = z.string().max(2000);

export const projectCreateSchema = z
  .object({
    name: nameSchema,
    clientName: clientNameSchema.nullable().optional(),
    location: locationSchema.nullable().optional(),
    currency: iso4217Schema.default("INR"),
    taxRegion: iso3166Alpha2Schema.default("IN"),
    notes: notesSchema.nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.taxRegion === "IN" &&
      data.location?.pincode &&
      !pincodeINSchema.safeParse(data.location.pincode).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location", "pincode"],
        message: "Indian projects require a 6-digit pincode",
      });
    }
  });

export const projectPatchSchema = z
  .object({
    name: nameSchema.optional(),
    clientName: clientNameSchema.nullable().optional(),
    location: locationSchema.nullable().optional(),
    notes: notesSchema.nullable().optional(),
  })
  .strict();

export const projectStatusSchema = z.enum(["active", "archived"]);

export const listProjectsQuerySchema = z
  .object({
    status: z.enum(["active", "archived", "all"]).optional().default("active"),
    search: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    cursor: z.string().max(500).optional(),
  })
  .strict();
