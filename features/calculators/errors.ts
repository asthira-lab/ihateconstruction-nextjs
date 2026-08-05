/**
 * Shared error-normalization helper for calculator Server Actions.
 *
 * Every calculator throws bare-string errors of the form `CODE:detail` (e.g.
 * `UNKNOWN_PRESET:M99`, `OPENINGS_EXCEED_WALL:1.9>=2.0`). This module maps
 * those to the wire error shape the client consumes — `{ ok: false, error: {
 * code, message, details? } }` — so each calculator action only declares
 * what varies: which codes it accepts, and the user-facing copy for each.
 *
 * The client never sees this module; it lives here because Server Actions
 * run on the server. Safe to import from an action module, not from a
 * `"use client"` component.
 */

/**
 * A dictionary of `CODE → human-readable message`. Every code an action can
 * emit must appear here. `INTERNAL` is the fallback and is required.
 */
export type ErrorCatalog<Code extends string> = {
  readonly [K in Code]: string;
} & { readonly INTERNAL: string };

/**
 * The failure branch of a calculator's Server Action result. Generic over
 * the union of codes the action may emit.
 */
export interface CalcActionError<Code extends string> {
  ok: false;
  error: {
    code: Code | "INTERNAL";
    message: string;
    details?: unknown;
  };
}

/**
 * Map a thrown value to the calculator's error envelope.
 *
 *   - `Error` messages of the form `CODE:detail` are pattern-matched against
 *     the catalog's keys. Known code → its message + `details: detail`.
 *   - Unknown codes fall back to `INTERNAL`.
 *   - Anything not an `Error` is stringified and treated as an unknown code.
 *
 * The `code` return type is narrowed to `Code | "INTERNAL"` so callers get
 * compile-time coverage of every code they've declared.
 */
export function normalizeCalcError<Code extends string>(
  e: unknown,
  catalog: ErrorCatalog<Code>,
): CalcActionError<Code> {
  const raw = e instanceof Error ? e.message : String(e);
  const [codeStr = "INTERNAL", detail] = raw.split(":", 2);

  const known =
    codeStr !== "INTERNAL" &&
    Object.prototype.hasOwnProperty.call(catalog, codeStr);

  const code = (known ? codeStr : "INTERNAL") as Code | "INTERNAL";

  return {
    ok: false,
    error: {
      code,
      message: catalog[code as keyof ErrorCatalog<Code>] ?? catalog.INTERNAL,
      ...(detail ? { details: detail } : {}),
    },
  };
}

/**
 * Throws `UNKNOWN_CUSTOM_KEY:<key>` if `custom` contains a key outside the
 * allowed set. Zod's default `.strip()` silently drops unknown keys — this
 * gives users an actionable error instead of wrong-math-in-silence.
 *
 * Skips keys whose value is `undefined` — those are the "not supplied" case
 * that Zod's `.optional()` produces after parse; treating them as unknown
 * would fire on empty overrides.
 */
export function assertCustomKeys<K extends string>(
  custom: Record<string, unknown> | undefined,
  allowed: readonly K[],
): void {
  if (!custom) return;
  const allowedSet = new Set<string>(allowed);
  for (const key of Object.keys(custom)) {
    if (custom[key] === undefined) continue;
    if (!allowedSet.has(key)) {
      throw new Error(`UNKNOWN_CUSTOM_KEY:${key}`);
    }
  }
}
