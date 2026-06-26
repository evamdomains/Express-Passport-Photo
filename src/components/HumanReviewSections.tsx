import HumanReviewTrust from './HumanReviewTrustBanner';
import HumanReviewHowItWorks from './HumanReviewHowItWorks';

export { default as HumanReviewHowItWorks } from './HumanReviewHowItWorks';
export { default as HumanReviewTrust } from './HumanReviewTrustBanner';

/**
 * Human Expert Review marketing UI — purely presentational, additive sections
 * that sit alongside the existing Instant AI flow. No processing/payment/review
 * logic here.
 *
 * SECTION 1 — Homepage trust banner — lives in ./HumanReviewTrustBanner.
 * SECTION 2 — How Human Review works — lives in ./HumanReviewHowItWorks.
 * Both are animated client components reusing the "Three steps" visual system.
 */

/** Convenience: all homepage Human-Review marketing sections in order. */
export default function HumanReviewMarketing() {
  return (
    <>
      <HumanReviewTrust />
      <HumanReviewHowItWorks />
    </>
  );
}
