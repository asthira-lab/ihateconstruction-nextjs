// Zod schema + inferred types for the contact form (client + server action).

import { z } from "zod";

export const contactRequestSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  subject: z
    .enum(["general", "bug", "feature", "partnership"])
    .optional()
    .default("general"),
  message: z.string().min(10).max(2000),
  // Honeypot — accept any string; the action silently drops non-empty submissions.
  // Bots fill this field; humans don't (it's hidden). We can't reject at parse
  // time or bots would see a validation error and retry — the silent-success
  // path is the whole point.
  website: z.string().max(500).optional(),
});

export type ContactRequest = z.infer<typeof contactRequestSchema>;

export type ContactActionResult =
  | { ok: true }
  | {
      ok: false;
      error: {
        code: "VALIDATION_FAILED" | "HONEYPOT" | "SEND_FAILED" | "SANITIZATION_FAILED" | "INTERNAL";
        message: string;
        details?: unknown;
      };
    };
