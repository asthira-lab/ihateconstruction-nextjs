// Opaque keyset cursor for (created_at, id) pagination. base64url of `${iso}|${uuid}`.

export interface CursorPayload {
  createdAt: string;
  id: string;
}

const SEP = "|";

export function encodeCursor(row: CursorPayload): string {
  const raw = `${row.createdAt}${SEP}${row.id}`;
  return Buffer.from(raw, "utf8").toString("base64url");
}

export function decodeCursor(str: string): CursorPayload | null {
  try {
    const raw = Buffer.from(str, "base64url").toString("utf8");
    const idx = raw.indexOf(SEP);
    if (idx <= 0 || idx === raw.length - 1) return null;
    const createdAt = raw.slice(0, idx);
    const id = raw.slice(idx + 1);
    if (Number.isNaN(Date.parse(createdAt))) return null;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}
