'use client';

import Image from 'next/image';

/**
 * Measurement overlay for the review screen (passport-photo.online style).
 *
 * UI-ONLY: the rulers, purple border, green crown→chin indicator and labels are
 * CSS/DOM drawn on top of the clean processed image. Nothing here is baked into
 * processed.jpg / print_layout.jpg / download assets — those stay print-ready.
 *
 * Head-height line spans the exact crown→chin position the compliance engine
 * produced (headTopFraction / headBottomFraction), so the overlay matches the
 * validated face ratio.
 */
interface Props {
  imageUrl: string;
  aspectRatio: number;          // width / height (US 1, Canada 50/70)
  widthLabel: string;           // "2 in" / "50 mm"
  heightLabel: string;          // "2 in" / "70 mm"
  headLabel: string;            // "1.13 in" / "33 mm"
  headTopFraction: number;      // crown Y (0..1 of photo height)
  headBottomFraction: number;   // chin Y (0..1 of photo height)
}

const PURPLE = '#d6d2f7';
const GREEN = '#3fc77a';
const NAVY = '#1d2438';

export default function PassportPreview({
  imageUrl,
  aspectRatio,
  widthLabel,
  heightLabel,
  headLabel,
  headTopFraction,
  headBottomFraction,
}: Props) {
  const headTopPct = headTopFraction * 100;
  const headHeightPct = Math.max(2, (headBottomFraction - headTopFraction) * 100);

  return (
    <div className="select-none mx-auto w-full max-w-[300px] pt-7 pr-12 pb-2 pl-14">
      <div className="relative" style={{ aspectRatio }}>
        {/* Clean processed photo (print-ready; overlay is separate) */}
        <Image
          src={imageUrl}
          alt="Your passport photo"
          fill
          unoptimized
          sizes="300px"
          className="object-cover rounded-md"
        />

        {/* Light-purple dashed photo border */}
        <div
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{ border: `2px dashed ${PURPLE}` }}
        />

        {/* Crown / chin guide lines */}
        <div className="pointer-events-none absolute left-0 right-0" style={{ top: `${headTopPct}%`, borderTop: `1px dashed ${GREEN}` }} />
        <div className="pointer-events-none absolute left-0 right-0" style={{ top: `${headTopPct + headHeightPct}%`, borderTop: `1px dashed ${GREEN}` }} />

        {/* ── WIDTH ruler (top) ── */}
        <div className="absolute -top-6 left-0 right-0 flex items-center" style={{ color: NAVY }}>
          <span className="h-2 w-px" style={{ background: NAVY }} />
          <span className="relative flex-1" style={{ borderTop: `1px solid ${NAVY}` }}>
            <span
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap"
              style={{ background: NAVY }}
            >
              {widthLabel}
            </span>
          </span>
          <span className="h-2 w-px" style={{ background: NAVY }} />
        </div>

        {/* ── HEIGHT ruler (right) ── */}
        <div className="absolute top-0 bottom-0 -right-7 flex flex-col items-center" style={{ color: NAVY }}>
          <span className="w-2 h-px" style={{ background: NAVY }} />
          <span className="relative w-px flex-1" style={{ borderLeft: `1px solid ${NAVY}` }}>
            <span
              className="absolute top-1/2 left-1.5 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap"
              style={{ background: NAVY }}
            >
              {heightLabel}
            </span>
          </span>
          <span className="w-2 h-px" style={{ background: NAVY }} />
        </div>

        {/* ── HEAD-HEIGHT indicator (left, green crown→chin) ── */}
        <div
          className="absolute -left-11 flex flex-col items-center"
          style={{ top: `${headTopPct}%`, height: `${headHeightPct}%`, color: GREEN }}
        >
          <span className="w-3 h-px" style={{ background: GREEN }} />
          <span className="relative w-px flex-1" style={{ borderLeft: `1.5px solid ${GREEN}` }}>
            <span
              className="absolute top-1/2 right-1.5 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap"
              style={{ background: GREEN }}
            >
              {headLabel}
            </span>
          </span>
          <span className="w-3 h-px" style={{ background: GREEN }} />
        </div>
      </div>
    </div>
  );
}
