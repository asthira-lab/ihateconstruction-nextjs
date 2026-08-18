// Public compute entry — server-only.

import "server-only";

import { rebarResponseSchema } from "./schema";
import { computeRebarOnServer } from "./server-compute";
import type { RebarRequest, RebarResponse } from "./types";

export async function computeRebar(req: RebarRequest): Promise<RebarResponse> {
  const raw = await computeRebarOnServer(req);
  const parsed = rebarResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      "[rebar] response schema mismatch",
      JSON.stringify({ issues: parsed.error.issues, raw }, null, 2),
    );
    throw new Error("INTERNAL:response_shape");
  }
  return parsed.data;
}
