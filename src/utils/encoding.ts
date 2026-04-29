/**
 * Normalize user-provided text while preserving full Unicode (including Thai).
 * Returns fallback when the value is null/undefined/empty after trim.
 */
export function latin1Safe(
  value: string | null | undefined,
  fallback = "",
): string {
  if (!value) return fallback;
  const cleaned = value.trim();
  return cleaned || fallback;
}
