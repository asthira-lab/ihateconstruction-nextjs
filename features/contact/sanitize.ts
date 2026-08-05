// Three-pass sanitizer for contact-form input. Runs before zod parsing.

// Control chars we always strip (null byte, DEL, misc C0). Tabs stay.
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Invisible / directional formatting characters used to hide payloads.
const INVISIBLE_CHARS_RE =
  /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

// Runs of 3+ blank lines collapse to 2 (preserves paragraphs, kills spam).
const EXCESS_BLANK_LINES_RE = /\n{3,}/g;

// Whitespace runs (excluding newlines) — used for name/subject flattening.
const WS_RUN_RE = /[ \t]+/g;

// Code-point ranges for scripts we recognize in names. Others are unlabeled.
const SCRIPT_RANGES: readonly {
  script: string;
  ranges: readonly [number, number][];
}[] = [
  { script: "Latin", ranges: [[0x0041, 0x005a], [0x0061, 0x007a], [0x00c0, 0x024f], [0x1e00, 0x1eff]] },
  { script: "Greek", ranges: [[0x0370, 0x03ff], [0x1f00, 0x1fff]] },
  { script: "Cyrillic", ranges: [[0x0400, 0x04ff], [0x0500, 0x052f]] },
  { script: "Arabic", ranges: [[0x0600, 0x06ff], [0x0750, 0x077f], [0x08a0, 0x08ff]] },
  { script: "Devanagari", ranges: [[0x0900, 0x097f]] },
  { script: "Bengali", ranges: [[0x0980, 0x09ff]] },
  { script: "Gurmukhi", ranges: [[0x0a00, 0x0a7f]] },
  { script: "Gujarati", ranges: [[0x0a80, 0x0aff]] },
  { script: "Oriya", ranges: [[0x0b00, 0x0b7f]] },
  { script: "Tamil", ranges: [[0x0b80, 0x0bff]] },
  { script: "Telugu", ranges: [[0x0c00, 0x0c7f]] },
  { script: "Kannada", ranges: [[0x0c80, 0x0cff]] },
  { script: "Malayalam", ranges: [[0x0d00, 0x0d7f]] },
  { script: "Han", ranges: [[0x4e00, 0x9fff], [0x3400, 0x4dbf]] },
  { script: "Hiragana", ranges: [[0x3040, 0x309f]] },
  { script: "Katakana", ranges: [[0x30a0, 0x30ff]] },
  { script: "Hangul", ranges: [[0xac00, 0xd7af], [0x1100, 0x11ff]] },
];

// Returns the script name for a code point, or null if it's script-neutral.
function scriptOf(codePoint: number): string | null {
  for (const { script, ranges } of SCRIPT_RANGES) {
    for (const [lo, hi] of ranges) {
      if (codePoint >= lo && codePoint <= hi) return script;
    }
  }
  return null;
}

// Strips control + invisible chars from any string. Universal base clean.
function stripDangerous(s: string): string {
  return s.replace(CONTROL_CHARS_RE, "").replace(INVISIBLE_CHARS_RE, "");
}

// Full clean for single-line fields: normalize → strip → collapse ws → trim.
function cleanSingleLine(s: string): string {
  return stripDangerous(s.normalize("NFC")).replace(WS_RUN_RE, " ").replace(/\n+/g, " ").trim();
}

// Full clean for message body: normalize → strip → normalize newlines → cap blank lines → trim.
function cleanMultiLine(s: string): string {
  return stripDangerous(s.normalize("NFC"))
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(EXCESS_BLANK_LINES_RE, "\n\n")
    .trim();
}

// Detects unicode script mixing (homoglyph attacks) in a name. Returns null when safe.
function detectScriptMixing(name: string): string | null {
  const scripts = new Set<string>();
  for (const ch of name) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    const script = scriptOf(cp);
    if (script) scripts.add(script);
  }
  // Latin + Cyrillic/Greek is the classic homoglyph attack — always reject.
  if (scripts.has("Latin") && (scripts.has("Cyrillic") || scripts.has("Greek"))) {
    return "Name mixes Latin with Cyrillic or Greek characters.";
  }
  // More than one non-Latin script also rejected — real names don't mix scripts.
  const nonLatin = [...scripts].filter((s) => s !== "Latin");
  if (nonLatin.length > 1) {
    return `Name mixes multiple scripts (${nonLatin.join(", ")}).`;
  }
  return null;
}

// Shape of the sanitized-and-safe payload returned to the caller.
export interface SanitizedContact {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

// Thrown by sanitize() when input can't be made safe (script mixing, etc).
export class SanitizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SanitizationError";
  }
}

// Coerces unknown input to a string safely (null/undefined become empty).
function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// Main entry: sanitize a raw contact payload. Throws SanitizationError on hard rejects.
export function sanitizeContact(raw: unknown): SanitizedContact {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const name = cleanSingleLine(asString(obj.name));
  const email = cleanSingleLine(asString(obj.email)).toLowerCase();
  const subject = cleanSingleLine(asString(obj.subject));
  const message = cleanMultiLine(asString(obj.message));
  const website = cleanSingleLine(asString(obj.website));

  const scriptIssue = detectScriptMixing(name);
  if (scriptIssue) throw new SanitizationError(scriptIssue);

  return { name, email, subject, message, website };
}
