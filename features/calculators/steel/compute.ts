// Public compute entry — server-only.

import "server-only";

import { steelResponseSchema } from "./schema";
import { computeSteelOnServer } from "./server-compute";
import type { SteelRequest, SteelResponse } from "./types";

export async function computeSteel(req: SteelRequest): Promise<SteelResponse> {
  const raw = await computeSteelOnServer(req);
  const parsed = steelResponseSchema.safeParse(raw);
  if (!parsed.success) {
    // Log the real Zod issues server-side; return a stable INTERNAL to the client.
    console.error(
      "[steel] response schema mismatch",
      JSON.stringify({ issues: parsed.error.issues, raw }, null, 2),
    );
    throw new Error("INTERNAL:response_shape");
  }
  return parsed.data;
}
