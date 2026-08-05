/**
 * Server-side environment configuration — validated at first import.
 *
 * Only importable from server code. The `import "server-only"` at the top
 * makes any accidental import from a `"use client"` file fail at build time,
 * so `DATABASE_URL` and any future secrets can never leak into the browser
 * bundle. None of these vars are prefixed with `NEXT_PUBLIC_` — that's the
 * whole point.
 *
 * Right now the app is fully stateless: the calculators are pure functions,
 * so nothing needs a database to render a result. `DATABASE_URL` is optional,
 * and when unset the app runs exactly as it does today. When we start saving
 * calculations, quotations, or user history (Phase 2+), setting the env var
 * flips persistence on with no code change to this file.
 *
 * Failing loudly at startup (via Zod) is deliberate: a mistyped env var in
 * Vercel's dashboard would otherwise cause silent 500s in production.
 */

import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url({ message: "DATABASE_URL must be a full postgres:// URL" })
    .optional(),

  DATABASE_SSL: z.enum(["require", "disable"]).default("require"),

  DATABASE_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(60_000)
    .default(8_000),

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL: process.env.DATABASE_SSL,
  DATABASE_TIMEOUT_MS: process.env.DATABASE_TIMEOUT_MS,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
});

if (!parsed.success) {
  // Fail loudly. Runs once at first import (module init) so a bad env var
  // takes down the boot instead of intermittently 500-ing later.
  const details = parsed.error.flatten().fieldErrors;
  const summary = Object.entries(details)
    .map(([k, v]) => `${k}: ${v?.join(", ")}`)
    .join("; ");
  throw new Error(`Invalid server environment: ${summary}`);
}

export const env = parsed.data;

/**
 * True when a database is configured. Server code that wants to gracefully
 * skip persistence (e.g. "save this calculation if we can, otherwise just
 * return the result") reads this flag instead of introspecting `env` directly.
 */
export const hasDatabase: boolean = Boolean(env.DATABASE_URL);

export const hasClerk: boolean = Boolean(
  env.CLERK_SECRET_KEY && env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
