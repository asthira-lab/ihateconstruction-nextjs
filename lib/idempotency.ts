// Transactional Idempotency-Key wrapper for POST creates. Returns cached resource on hit, else runs factory.

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "./db";

const IDEM_TTL_HOURS = 24;

export interface IdemFactoryResult<T> {
  resource: T;
}

export async function withIdempotency<T extends { id: string }>(
  userId: string,
  key: string,
  resourceKind: string,
  factory: (client: PoolClient) => Promise<T>,
  refetchById: (id: string, client: PoolClient) => Promise<T | undefined>,
): Promise<T> {
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM idempotency_keys
       WHERE user_id = $1 AND created_at < NOW() - INTERVAL '${IDEM_TTL_HOURS} hours'`,
      [userId],
    );

    const existing = await client.query<{ resource_id: string }>(
      `SELECT resource_id FROM idempotency_keys
       WHERE user_id = $1 AND key = $2 AND resource_kind = $3`,
      [userId, key, resourceKind],
    );

    const found = existing.rows[0];
    if (found) {
      const row = await refetchById(found.resource_id, client);
      await client.query("COMMIT");
      if (!row) throw new Error("NOT_FOUND");
      return row;
    }

    const created = await factory(client);
    await client.query(
      `INSERT INTO idempotency_keys (user_id, key, resource_kind, resource_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, key, resourceKind, created.id],
    );
    await client.query("COMMIT");
    return created;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}
