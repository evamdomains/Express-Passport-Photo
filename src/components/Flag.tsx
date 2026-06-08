/**
 * Flag — crisp inline SVG country flags.
 * Emoji flags (🇺🇸/🇨🇦) don't render on Windows, so we draw them as SVG.
 * Pass `className` to size/position (default: a small inline badge).
 */
export default function Flag({
  country,
  className = 'h-3.5 w-5',
}: {
  country: 'US' | 'Canada';
  className?: string;
}) {
  return (
    <span className={`inline-block overflow-hidden rounded-[2px] ring-1 ring-black/10 ${className}`}>
      {country === 'US' ? (
        <svg viewBox="0 0 24 16" className="h-full w-full" preserveAspectRatio="none">
          <rect width="24" height="16" fill="#fff" />
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} y={(i * 16) / 13 * 2} width="24" height={16 / 13} fill="#b22234" />
          ))}
          <rect width="10.4" height={(16 / 13) * 7} fill="#3c3b6e" />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 5 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={1.1 + c * 2.05} cy={1 + r * 2.2} r="0.42" fill="#fff" />
            ))
          )}
        </svg>
      ) : (
        <svg viewBox="0 0 24 16" className="h-full w-full" preserveAspectRatio="none">
          <rect width="24" height="16" fill="#fff" />
          <rect width="6" height="16" fill="#d52b1e" />
          <rect x="18" width="6" height="16" fill="#d52b1e" />
          <path
            fill="#d52b1e"
            d="M12 3.2l.78 1.46 1.62-.36-.52 1.3 1.06.62-1.3.98.46 1.5-1.62-.45-.1 1.7-.85-.95-.85.95-.1-1.7-1.62.45.46-1.5-1.3-.98 1.06-.62-.52-1.3 1.62.36zM11.6 9.6h.8v2.9h-.8z"
          />
        </svg>
      )}
    </span>
  );
}
