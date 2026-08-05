/**
 * Public compute entry — server-only.
 *
 * Delegates to the local server-side implementation and validates the result
 * through the same Zod schema the wire contract uses. No HTTP branch today
 * — calculators are pure server-side work.
 *
 * If we later front the frontend with a separate compute service, add the
 * HTTP client behind a feature flag here — the form, Server Action, and
 * response schema already speak the eventual wire shape.
 */

import "server-only";

import { concreteResponseSchema } from "./schema";
import { computeConcreteOnServer } from "./server-compute";
import type { ConcreteRequest, ConcreteResponse } from "./types";

export async function computeConcrete(
  req: ConcreteRequest,
): Promise<ConcreteResponse> {
  const raw = await computeConcreteOnServer(req);
  // Boundary check: any drift in the server implementation fails fast here
  // instead of surfacing as a weird render in the UI.
  const parsed = concreteResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      "[concrete] response schema mismatch",
      JSON.stringify({ issues: parsed.error.issues, raw }, null, 2),
    );
    throw new Error("INTERNAL:response_shape");
  }
  return parsed.data;
}
