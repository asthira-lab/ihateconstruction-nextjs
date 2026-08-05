/**
 * Server-side Postgres connection.
 *
 * Wraps `pg`'s `Pool` in a lazy singleton: the pool is only constructed on
 * the first call to `getDb()`, so nothing connects during dev or preview
 * when `DATABASE_URL` is unset. When `DATABASE_URL` is missing and a caller
 * asks for the pool anyway, we throw — never silently reconnect, never open
 * a bogus pool, never let a "save" no-op look like a success.
 *
 * Design notes:
 *   - Aiven-friendly SSL: `sslmode=require` on the URL is respected by `pg`
 *     automatically, but we also pass `ssl: { rejectUnauthorized: false }`
 *     when DATABASE_SSL=require so it works out of the box with Aiven's
 *     managed CA. Tightening to `{ ca: <PEM> }` is a separate change once
 *     we're ready to pin the CA — TODO documented at the ssl line.
 *   - Hot-reload safe: in Next.js dev, module state resets on file changes,
 *     which would leak pools if we constructed unconditionally. The lazy
 *     singleton avoids that — no pool exists until something needs it.
 *
 * No schema / query helpers live here yet. When the first persistence
 * feature lands, create `lib/db/` with `schema.sql` and typed query wrappers;
 * this file stays the connection factory.
 */

import "server-only";

import { Pool } from "pg";

import { env, hasDatabase } from "./env";

let _pool: Pool | undefined;

// Strips `sslmode=...` from the URL so pg-connection-string doesn't override our explicit ssl config.
function stripSslmode(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Get the shared Postgres pool. Opens it on first call.
 *
 * Throws when `DATABASE_URL` isn't configured — call sites should either
 * gate on `hasDatabase` first, or accept that persistence being off is a
 * hard error for their feature.
 */
export function getDb(): Pool {
  if (!hasDatabase) {
    throw new Error(
      "Database not configured. Set DATABASE_URL to enable persistence.",
    );
  }

  if (!_pool) {
    _pool = new Pool({
      // Strip sslmode= from the URL — pg-connection-string ≥2.14 upgrades
      // "require" to "verify-full", which would override our rejectUnauthorized:false
      // below and fail on Aiven's self-signed intermediary.
      connectionString: stripSslmode(env.DATABASE_URL!),
      // Aiven issues its own CA. `rejectUnauthorized: false` accepts it
      // without pinning; the traffic is still TLS-encrypted, just not
      // CA-verified. TODO(later): download Aiven's CA cert, ship it, and
      // switch to `{ ca: fs.readFileSync(...) }` so an active MITM couldn't
      // present a self-signed cert.
      ssl:
        env.DATABASE_SSL === "require"
          ? { rejectUnauthorized: false }
          : false,
      connectionTimeoutMillis: env.DATABASE_TIMEOUT_MS,
    });

    // Surface pool-level errors instead of swallowing them. A dropped
    // Postgres connection during idle would otherwise crash the Node
    // process on the next `client.on('error')` event.
    _pool.on("error", (err) => {
      console.error("[db] unexpected pool error:", err);
    });
  }

  return _pool;
}
