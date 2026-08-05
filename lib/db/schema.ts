// Idempotent schema bootstrap. First caller creates the table; concurrent callers dedupe.

import "server-only";

import { getDb } from "@/lib/db";

// Cached promise so concurrent first requests share one CREATE TABLE round-trip.
let ensured: Promise<void> | undefined;

const DDL = `
  CREATE TABLE IF NOT EXISTS contact_submissions (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    subject     TEXT NOT NULL,
    message     TEXT NOT NULL,
    ip_hash     TEXT,
    user_agent  TEXT
  );
  CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx
    ON contact_submissions (created_at DESC);
  CREATE INDEX IF NOT EXISTS contact_submissions_email_idx
    ON contact_submissions (email);
`;

// Runs the DDL once per process. Safe to await from every write path.
export function ensureContactSchema(): Promise<void> {
  if (!ensured) {
    ensured = getDb()
      .query(DDL)
      .then(() => undefined)
      .catch((err) => {
        // Reset on failure so a retry can attempt again after a transient error.
        ensured = undefined;
        throw err;
      });
  }
  return ensured;
}
