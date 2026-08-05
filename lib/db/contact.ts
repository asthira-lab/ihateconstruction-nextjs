// Typed insert for the contact_submissions table. Uses parameterized $-placeholders.

import "server-only";

import { getDb } from "@/lib/db";

// Row payload for a single contact insert.
export interface ContactRow {
  name: string;
  email: string;
  subject: string;
  message: string;
  ipHash: string | null;
  userAgent: string | null;
}

// Truncate user-agent defensively — real browsers stay under 500, but bots don't care.
const USER_AGENT_MAX = 500;

// Inserts one submission and returns the new row id.
export async function insertContactSubmission(row: ContactRow): Promise<number> {
  const userAgent = row.userAgent ? row.userAgent.slice(0, USER_AGENT_MAX) : null;
  const result = await getDb().query<{ id: string }>(
    `INSERT INTO contact_submissions (name, email, subject, message, ip_hash, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [row.name, row.email, row.subject, row.message, row.ipHash, userAgent],
  );
  const inserted = result.rows[0];
  if (!inserted) throw new Error("Insert returned no row.");
  // pg returns BIGSERIAL as string; caller wants a number for logging.
  return Number(inserted.id);
}
