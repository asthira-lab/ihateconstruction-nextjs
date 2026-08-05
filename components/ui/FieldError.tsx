/**
 * Inline field error line — one visual home for Zod / RHF error messages.
 * Renders nothing if no message so it's cheap to sprinkle under every input.
 */

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
      {message}
    </p>
  );
}
