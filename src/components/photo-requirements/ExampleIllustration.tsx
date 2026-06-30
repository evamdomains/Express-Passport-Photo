/**
 * ExampleIllustration — lightweight SVG depictions for each requirement example.
 *
 * These are illustrative placeholders (drawn figures, not photographs) chosen so
 * the page can ship without real face photos and without any privacy/licensing
 * concerns. Each `variant` draws the specific situation it represents (head
 * tilted, eyes closed, glasses, a calm baby "O" mouth, etc.).
 *
 * Swapping in real photos later: ExampleCard accepts an optional `imageSrc`. When
 * provided it renders a Next.js <Image> instead of this component, so you can drop
 * licensed example photos in without changing any structure.
 */

export type ExampleVariant =
  // Section 1 — pose & expression
  | 'neutral'
  | 'straight-head'
  | 'eyes-open'
  | 'mouth-closed'
  | 'looking-sideways'
  | 'looking-up'
  | 'looking-down'
  | 'head-tilted'
  | 'eyes-closed'
  | 'broad-smile'
  | 'laughing'
  | 'mouth-open'
  | 'face-outside-frame'
  // Section 2 — clothing, hats & glasses
  | 'normal-clothing'
  | 'religious-clothing'
  | 'glasses'
  | 'sunglasses'
  | 'hat'
  | 'cap'
  | 'mask'
  | 'hair-over-eyes'
  // Section 3 — babies & toddlers
  | 'baby-calm'
  | 'baby-o-mouth'
  | 'baby-eyes-open'
  | 'baby-slight-tilt'
  | 'baby-broad-smile'
  | 'baby-crying'
  | 'baby-mouth-wide'
  | 'baby-finger-mouth'
  | 'baby-hand-face'
  | 'baby-parent-visible'
  | 'baby-toy-visible'
  | 'baby-pacifier'
  | 'baby-eyes-closed'
  | 'baby-extreme-tilt';

const ACCEPT = '#2563eb';
const ACCENT = '#85b7eb';
const SKIN = '#f0c8a8';
const SKIN_SHADE = '#e0b394';
const HAIR = '#5a4632';
const NEUTRAL = '#94a3b8';

/** Common framed-portrait backdrop so every card reads as a passport photo. */
function Frame({ children, tone = 'ok' }: { children: React.ReactNode; tone?: 'ok' | 'bad' | 'neutral' }) {
  const bg = tone === 'ok' ? '#f0f7ff' : tone === 'bad' ? '#fdf2f2' : '#f6f7f9';
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" role="presentation" aria-hidden="true">
      <rect x="0" y="0" width="200" height="200" fill={bg} />
      <rect x="10" y="10" width="180" height="180" rx="6" fill="#ffffff" stroke="#e6eef7" />
      {children}
    </svg>
  );
}

/** A simple front-facing head, parameterised by the bits that change per case. */
function Head({
  cx = 100,
  cy = 92,
  tilt = 0,
  yaw = 0,
  pitch = 0,
  eyes = 'open',
  mouth = 'closed',
}: {
  cx?: number;
  cy?: number;
  tilt?: number;
  yaw?: number;
  pitch?: number;
  eyes?: 'open' | 'closed' | 'sleepy';
  mouth?: 'closed' | 'o' | 'smile' | 'broad' | 'open-wide';
}) {
  const eyeY = cy - 8 + pitch * 0.3;
  const eyeDX = 16 - Math.abs(yaw) * 0.15;
  const eyeShift = yaw * 0.4;
  const mouthY = cy + 26 + pitch * 0.3;

  const eye = (x: number) => {
    if (eyes === 'closed') return <line x1={x - 5} y1={eyeY} x2={x + 5} y2={eyeY} stroke="#6b5648" strokeWidth={2.5} strokeLinecap="round" />;
    const ry = eyes === 'sleepy' ? 2 : 4;
    return (
      <g>
        <ellipse cx={x} cy={eyeY} rx={5.5} ry={ry} fill="#fff" stroke="#6b5648" strokeWidth={1} />
        <circle cx={x + eyeShift * 0.2} cy={eyeY} r={2.2} fill="#3a2f25" />
      </g>
    );
  };

  let mouthEl: React.ReactNode;
  if (mouth === 'closed') mouthEl = <line x1={cx - 9} y1={mouthY} x2={cx + 9} y2={mouthY} stroke="#b5654a" strokeWidth={2.5} strokeLinecap="round" />;
  else if (mouth === 'o') mouthEl = <ellipse cx={cx} cy={mouthY} rx={5} ry={6} fill="#a14a3a" />;
  else if (mouth === 'smile') mouthEl = <path d={`M${cx - 10} ${mouthY} Q${cx} ${mouthY + 7} ${cx + 10} ${mouthY}`} fill="none" stroke="#b5654a" strokeWidth={2.5} strokeLinecap="round" />;
  else if (mouth === 'broad') mouthEl = <path d={`M${cx - 14} ${mouthY - 2} Q${cx} ${mouthY + 12} ${cx + 14} ${mouthY - 2} Z`} fill="#fff" stroke="#b5654a" strokeWidth={2} />;
  else mouthEl = <ellipse cx={cx} cy={mouthY + 2} rx={9} ry={12} fill="#a14a3a" />;

  return (
    <g transform={`rotate(${tilt} ${cx} ${cy})`}>
      {/* shoulders */}
      <path d={`M${cx - 46} 190 Q${cx} 150 ${cx + 46} 190 Z`} fill={ACCENT} />
      {/* neck */}
      <rect x={cx - 9} y={cy + 38} width={18} height={20} fill={SKIN_SHADE} />
      {/* head */}
      <ellipse cx={cx + eyeShift * 0.3} cy={cy} rx={34} ry={40} fill={SKIN} />
      {/* hair */}
      <path d={`M${cx - 34} ${cy - 8} Q${cx} ${cy - 58} ${cx + 34} ${cy - 8} Q${cx + 20} ${cy - 28} ${cx} ${cy - 26} Q${cx - 20} ${cy - 28} ${cx - 34} ${cy - 8} Z`} fill={HAIR} />
      {/* ears */}
      <circle cx={cx - 34} cy={cy + 2} r={5} fill={SKIN_SHADE} />
      <circle cx={cx + 34} cy={cy + 2} r={5} fill={SKIN_SHADE} />
      {eye(cx - eyeDX + eyeShift)}
      {eye(cx + eyeDX + eyeShift)}
      {/* nose */}
      <path d={`M${cx + eyeShift * 0.3} ${eyeY + 6} L${cx - 3 + eyeShift * 0.3} ${mouthY - 8} L${cx + 3 + eyeShift * 0.3} ${mouthY - 8}`} fill="none" stroke={SKIN_SHADE} strokeWidth={2} strokeLinejoin="round" />
      {mouthEl}
    </g>
  );
}

/** A rounder, softer infant head for the baby section. */
function BabyHead({
  cx = 100,
  cy = 96,
  tilt = 0,
  yaw = 0,
  eyes = 'open',
  mouth = 'o',
}: {
  cx?: number;
  cy?: number;
  tilt?: number;
  yaw?: number;
  eyes?: 'open' | 'closed' | 'sleepy';
  mouth?: 'closed' | 'o' | 'broad' | 'open-wide';
}) {
  const eyeY = cy - 4;
  const eyeShift = yaw * 0.4;
  const mouthY = cy + 24;
  const eye = (x: number) => {
    if (eyes === 'closed') return <path d={`M${x - 5} ${eyeY} Q${x} ${eyeY + 3} ${x + 5} ${eyeY}`} fill="none" stroke="#6b5648" strokeWidth={2.5} strokeLinecap="round" />;
    const ry = eyes === 'sleepy' ? 2.5 : 4.5;
    return <ellipse cx={x} cy={eyeY} rx={5} ry={ry} fill="#3a2f25" />;
  };
  let mouthEl: React.ReactNode;
  if (mouth === 'closed') mouthEl = <line x1={cx - 6} y1={mouthY} x2={cx + 6} y2={mouthY} stroke="#c06a52" strokeWidth={2.5} strokeLinecap="round" />;
  else if (mouth === 'o') mouthEl = <ellipse cx={cx} cy={mouthY} rx={4} ry={5} fill="#b85544" />;
  else if (mouth === 'broad') mouthEl = <path d={`M${cx - 12} ${mouthY - 2} Q${cx} ${mouthY + 10} ${cx + 12} ${mouthY - 2} Z`} fill="#fff" stroke="#c06a52" strokeWidth={2} />;
  else mouthEl = <ellipse cx={cx} cy={mouthY + 2} rx={10} ry={13} fill="#b85544" />;

  return (
    <g transform={`rotate(${tilt} ${cx} ${cy})`}>
      <path d={`M${cx - 42} 190 Q${cx} 158 ${cx + 42} 190 Z`} fill="#ffd9a8" />
      <ellipse cx={cx + eyeShift * 0.3} cy={cy} rx={38} ry={40} fill={SKIN} />
      <path d={`M${cx - 30} ${cy - 18} Q${cx} ${cy - 44} ${cx + 30} ${cy - 18}`} fill="none" stroke={HAIR} strokeWidth={6} strokeLinecap="round" />
      <circle cx={cx - 22} cy={cy + 8} r={6} fill="#f7b7a0" opacity={0.6} />
      <circle cx={cx + 22} cy={cy + 8} r={6} fill="#f7b7a0" opacity={0.6} />
      {eye(cx - 13 + eyeShift)}
      {eye(cx + 13 + eyeShift)}
      <path d={`M${cx + eyeShift * 0.3} ${eyeY + 6} l0 6`} stroke={SKIN_SHADE} strokeWidth={2} strokeLinecap="round" />
      {mouthEl}
    </g>
  );
}

export default function ExampleIllustration({ variant }: { variant: ExampleVariant }) {
  switch (variant) {
    // ── Section 1: pose & expression ──────────────────────────────────────
    case 'neutral':
    case 'straight-head':
    case 'eyes-open':
    case 'mouth-closed':
      return <Frame tone="ok"><Head /></Frame>;
    case 'looking-sideways':
      return <Frame tone="bad"><Head yaw={32} /></Frame>;
    case 'looking-up':
      return <Frame tone="bad"><Head pitch={-26} /></Frame>;
    case 'looking-down':
      return <Frame tone="bad"><Head pitch={26} /></Frame>;
    case 'head-tilted':
      return <Frame tone="bad"><Head tilt={22} /></Frame>;
    case 'eyes-closed':
      return <Frame tone="bad"><Head eyes="closed" /></Frame>;
    case 'broad-smile':
      return <Frame tone="bad"><Head mouth="broad" /></Frame>;
    case 'laughing':
      return <Frame tone="bad"><Head mouth="broad" eyes="sleepy" /></Frame>;
    case 'mouth-open':
      return <Frame tone="bad"><Head mouth="open-wide" /></Frame>;
    case 'face-outside-frame':
      return <Frame tone="bad"><Head cx={150} cy={120} /></Frame>;

    // ── Section 2: clothing, hats & glasses ───────────────────────────────
    case 'normal-clothing':
      return <Frame tone="ok"><Head /></Frame>;
    case 'religious-clothing':
      return (
        <Frame tone="ok">
          <path d="M52 96 Q100 30 148 96 Q150 150 100 150 Q50 150 52 96 Z" fill="#cdd8e6" />
          <Head cy={96} />
          <path d="M58 100 Q100 60 142 100" fill="none" stroke="#aebfd4" strokeWidth={3} />
        </Frame>
      );
    case 'glasses':
      return (
        <Frame tone="bad">
          <Head />
          <g stroke="#33425a" strokeWidth={2.5} fill="rgba(120,160,210,0.25)">
            <rect x="70" y="80" width="22" height="16" rx="5" />
            <rect x="108" y="80" width="22" height="16" rx="5" />
            <line x1="92" y1="86" x2="108" y2="86" />
          </g>
        </Frame>
      );
    case 'sunglasses':
      return (
        <Frame tone="bad">
          <Head />
          <g stroke="#1f2733" strokeWidth={2.5} fill="#1f2733">
            <rect x="68" y="80" width="24" height="16" rx="6" />
            <rect x="108" y="80" width="24" height="16" rx="6" />
            <line x1="92" y1="86" x2="108" y2="86" />
          </g>
        </Frame>
      );
    case 'hat':
      return (
        <Frame tone="bad">
          <Head />
          <path d="M58 60 Q100 18 142 60 Z" fill="#6b4f3a" />
          <rect x="48" y="58" width="104" height="8" rx="4" fill="#4f3a2a" />
        </Frame>
      );
    case 'cap':
      return (
        <Frame tone="bad">
          <Head />
          <path d="M62 62 Q100 30 138 62 Z" fill="#2f6db5" />
          <path d="M62 62 Q40 64 40 72 L66 70 Z" fill="#27508a" />
        </Frame>
      );
    case 'mask':
      return (
        <Frame tone="bad">
          <Head />
          <path d="M70 100 Q100 132 130 100 L130 116 Q100 140 70 116 Z" fill="#cfe6f2" stroke="#9cc4d8" strokeWidth={1.5} />
          <line x1="70" y1="104" x2="58" y2="98" stroke="#9cc4d8" strokeWidth={2} />
          <line x1="130" y1="104" x2="142" y2="98" stroke="#9cc4d8" strokeWidth={2} />
        </Frame>
      );
    case 'hair-over-eyes':
      return (
        <Frame tone="bad">
          <Head />
          <path d="M66 70 Q100 96 134 70 Q132 92 100 96 Q68 92 66 70 Z" fill={HAIR} />
        </Frame>
      );

    // ── Section 3: babies & toddlers ──────────────────────────────────────
    case 'baby-calm':
    case 'baby-o-mouth':
      return <Frame tone="ok"><BabyHead mouth="o" /></Frame>;
    case 'baby-eyes-open':
      return <Frame tone="ok"><BabyHead mouth="closed" /></Frame>;
    case 'baby-slight-tilt':
      return <Frame tone="ok"><BabyHead tilt={12} mouth="o" /></Frame>;
    case 'baby-broad-smile':
      return <Frame tone="bad"><BabyHead mouth="broad" /></Frame>;
    case 'baby-crying':
      return <Frame tone="bad"><BabyHead eyes="closed" mouth="open-wide" /></Frame>;
    case 'baby-mouth-wide':
      return <Frame tone="bad"><BabyHead mouth="open-wide" /></Frame>;
    case 'baby-finger-mouth':
      return (
        <Frame tone="bad">
          <BabyHead mouth="o" />
          <rect x="96" y="118" width="8" height="22" rx="4" fill={SKIN} stroke={SKIN_SHADE} strokeWidth={1} />
        </Frame>
      );
    case 'baby-hand-face':
      return (
        <Frame tone="bad">
          <BabyHead />
          <ellipse cx="110" cy="100" rx="22" ry="26" fill={SKIN} stroke={SKIN_SHADE} strokeWidth={1.5} />
        </Frame>
      );
    case 'baby-parent-visible':
      return (
        <Frame tone="bad">
          <ellipse cx="150" cy="70" rx="28" ry="34" fill={SKIN_SHADE} opacity={0.7} />
          <BabyHead cx={86} cy={104} />
        </Frame>
      );
    case 'baby-toy-visible':
      return (
        <Frame tone="bad">
          <BabyHead />
          <circle cx="150" cy="150" r="16" fill="#f2a93b" />
          <circle cx="150" cy="150" r="6" fill="#d98a1c" />
        </Frame>
      );
    case 'baby-pacifier':
      return (
        <Frame tone="bad">
          <BabyHead mouth="closed" />
          <circle cx="100" cy="122" r="9" fill="#7fc4e6" />
          <rect x="95" y="118" width="10" height="8" rx="3" fill="#5aa6cc" />
        </Frame>
      );
    case 'baby-eyes-closed':
      return <Frame tone="bad"><BabyHead eyes="closed" mouth="closed" /></Frame>;
    case 'baby-extreme-tilt':
      return <Frame tone="bad"><BabyHead tilt={34} mouth="o" /></Frame>;

    default:
      return (
        <Frame tone="neutral">
          <circle cx="100" cy="100" r="30" fill={NEUTRAL} opacity={0.3} />
        </Frame>
      );
  }
}
