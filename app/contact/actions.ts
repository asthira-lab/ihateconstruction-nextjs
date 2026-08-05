"use server";

// Server Action for the contact form — sanitize, validate, drop bots, persist, respond.

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import {
  contactRequestSchema,
  sanitizeContact,
  SanitizationError,
  type ContactActionResult,
} from "@/features/contact";
import {
  normalizeCalcError,
  type ErrorCatalog,
} from "@/features/calculators/errors";
import { hasDatabase } from "@/lib/env";
import { ensureContactSchema } from "@/lib/db/schema";
import { insertContactSubmission } from "@/lib/db/contact";

type ContactErrorCode = "HONEYPOT" | "SEND_FAILED" | "SANITIZATION_FAILED";

const CATALOG: ErrorCatalog<ContactErrorCode> = {
  HONEYPOT: "Message rejected.",
  SEND_FAILED:
    "We couldn't deliver your message just now. Please try again in a minute.",
  SANITIZATION_FAILED:
    "Some of your input couldn't be accepted. Please check for unusual characters and try again.",
  INTERNAL: "Something went wrong on our side. Please try again.",
};

// SHA-256 the caller's IP so we never persist the raw address.
function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

// Best-effort client IP from Vercel-style headers; Vercel sets both.
function extractIp(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    return first ? first.trim() : null;
  }
  return h.get("x-real-ip");
}

export async function submitContact(
  raw: unknown,
): Promise<ContactActionResult> {
  // 1. Sanitize first — control chars, invisibles, script mixing.
  let cleaned;
  try {
    cleaned = sanitizeContact(raw);
  } catch (e) {
    if (e instanceof SanitizationError) {
      return {
        ok: false,
        error: { code: "SANITIZATION_FAILED", message: e.message },
      };
    }
    return normalizeCalcError(e, CATALOG) as ContactActionResult;
  }

  // 2. Server-side zod validation on the sanitized payload.
  const parsed = contactRequestSchema.safeParse(cleaned);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Some of the inputs look wrong. Check the highlighted fields.",
        details: parsed.error.flatten(),
      },
    };
  }

  // 3. Honeypot — silently pretend success so bots don't retry.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return { ok: true };
  }

  // 4. Persist when a DB is configured; otherwise log locally.
  try {
    if (hasDatabase) {
      const h = await headers();
      const ipHash = hashIp(extractIp(h));
      const userAgent = h.get("user-agent");
      try {
        await ensureContactSchema();
        const id = await insertContactSubmission({
          name: parsed.data.name,
          email: parsed.data.email,
          subject: parsed.data.subject,
          message: parsed.data.message,
          ipHash,
          userAgent,
        });
        console.log("[contact] persisted submission", { id });
      } catch (dbErr) {
        // Soft-fail — user shouldn't know if our DB is down.
        console.error("[contact] db write failed:", dbErr);
      }
    } else {
      console.log("[contact] submission (no DB configured)", {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
    }
    return { ok: true };
  } catch (e) {
    return normalizeCalcError(e, CATALOG) as ContactActionResult;
  }
}
