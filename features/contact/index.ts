// Public barrel for the contact feature.

export { contactRequestSchema } from "./schema";
export type { ContactRequest, ContactActionResult } from "./schema";
export { sanitizeContact, SanitizationError } from "./sanitize";
export type { SanitizedContact } from "./sanitize";
