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

import { paintResponseSchema } from "./schema";
import { computePaintOnServer } from "./server-compute";
import type { PaintRequest, PaintResponse } from "./types";

export async function computePaint(req: PaintRequest): Promise<PaintResponse> {
  const raw = await computePaintOnServer(req);
  // Boundary check: any drift in the server implementation fails fast here
  // instead of surfacing as a weird render in the UI.
  const parsed = paintResponseSchema.safeParse(raw);
  if (!parsed.success) {
    // Log real Zod issues server-side; return a stable INTERNAL to the client.
    console.error(
      "[paint] response schema mismatch",
      JSON.stringify({ issues: parsed.error.issues, raw }, null, 2),
    );
    throw new Error("INTERNAL:response_shape");
  }
  return parsed.data;
}
