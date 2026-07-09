/**
 * Feature flags.
 *
 * TEMPORARY BUSINESS CHANGE (until December): Canadian documents are free. This is
 * driven ENTIRELY by the `FREE_CANADIAN` flag below — no premium code was modified
 * or deleted. To roll back after December, flip `FREE_CANADIAN` to `false` and
 * Canadian documents immediately route back through the untouched premium flow.
 */
export const FEATURES = {
  /** When true, canadian_passport / canadian_pr_card use the isolated FREE flow. */
  FREE_CANADIAN: true,
  /** Premium flow (all other documents) — always on. */
  ENABLE_PREMIUM: true,
} as const;

/** Documents eligible for the free flow while `FREE_CANADIAN` is enabled. */
export const FREE_CANADIAN_DOCUMENT_TYPES = ['canadian_passport', 'canadian_pr_card'] as const;

/**
 * Pure routing predicate (flag passed in) — testable with the flag both on and off.
 * A document uses the free flow only when the flag is on AND it is a Canadian doc.
 */
export function shouldUseFreeCanadian(documentTypeId: string, freeCanadianEnabled: boolean): boolean {
  return freeCanadianEnabled && (FREE_CANADIAN_DOCUMENT_TYPES as readonly string[]).includes(documentTypeId);
}

/** Convenience wrapper bound to the live flag. */
export function isFreeCanadianDocument(documentTypeId: string): boolean {
  return shouldUseFreeCanadian(documentTypeId, FEATURES.FREE_CANADIAN);
}

/** Debug logging for the free Canadian flow. */
export const DEBUG_FREE_CANADIAN = true;
