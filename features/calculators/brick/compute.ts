/**
 * Public compute entry — server-only.
 *
 * Delegates to the local server-side implementation and validates the result
 * through the same Zod schema the wire contract uses. There is intentionally
 * no HTTP branch here today: calculators are pure server-side work.
 *
 * If we ever front the frontend with a separate compute service, add the
 * HTTP client behind a feature flag here — everything downstream (the Server
 * Action, the form, the response schema) already speaks the eventual wire
 * shape so the swap is one file.
 */

import "server-only";

import { brickResponseSchema } from "./schema";
import { computeBrickOnServer } from "./server-compute";
import type { BrickRequest, BrickResponse } from "./types";

export async function computeBrick(req: BrickRequest): Promise<BrickResponse> {
  const raw = await computeBrickOnServer(req);
  // Boundary check: any drift in the server implementation fails fast here
  // instead of surfacing as a weird render in the UI.
  const parsed = brickResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      "[brick] response schema mismatch",
      JSON.stringify({ issues: parsed.error.issues, raw }, null, 2),
    );
    throw new Error("INTERNAL:response_shape");
  }
  return parsed.data;
}
