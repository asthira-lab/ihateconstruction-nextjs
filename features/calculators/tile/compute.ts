// Public compute entry — validates the response through the same wire schema.

import "server-only";

import { tileResponseSchema } from "./schema";
import { computeTileOnServer } from "./server-compute";
import type { TileRequest, TileResponse } from "./types";

export async function computeTile(req: TileRequest): Promise<TileResponse> {
  const raw = await computeTileOnServer(req);
  const parsed = tileResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      "[tile] response schema mismatch",
      JSON.stringify({ issues: parsed.error.issues, raw }, null, 2),
    );
    throw new Error("INTERNAL:response_shape");
  }
  return parsed.data;
}
