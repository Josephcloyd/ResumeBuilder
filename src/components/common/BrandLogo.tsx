import React from 'react';

interface BrandMarkProps {
  className?: string;
  /** Hexagon fill colour. Defaults to the brand forest green. */
  tone?: 'brand' | 'cream';
}

/**
 * LaunchPH-style hexagon mark with a "circuit tree" glyph.
 * Brand green with cream lines by default; `tone="cream"` inverts it for dark backgrounds.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ className = 'size-9', tone = 'brand' }) => {
  const hex = tone === 'brand' ? 'var(--color-brand)' : 'var(--color-cream)';
  const line = tone === 'brand' ? 'var(--color-cream)' : 'var(--color-brand)';

  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 2.6 27.6 9.3v13.4L16 29.4 4.4 22.7V9.3L16 2.6Z"
        fill={hex}
        stroke={hex}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <g stroke={line} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="9.6" r="2" />
        <circle cx="10.6" cy="12.6" r="1.7" />
        <circle cx="21.4" cy="12.6" r="1.7" />
        <path d="M16 11.6v8.4" />
        <path d="M10.6 14.3v1.6a2 2 0 0 0 2 2H16" />
        <path d="M21.4 14.3v.4a2 2 0 0 1-2 2H16" />
      </g>
      <circle cx="16" cy="9.6" r="0.9" fill="var(--color-sage)" />
      <rect x="14" y="20" width="4" height="2.6" rx="0.7" fill={line} />
    </svg>
  );
};

interface BrandLogoProps {
  className?: string;
  /** Show the "by GetLaunchPH" byline under the wordmark. */
  showByline?: boolean;
  /** Use light text for dark backgrounds. */
  onDark?: boolean;
}

/** Full lockup: hexagon mark + two-tone "ResumeFlow" wordmark + "by GetLaunchPH" byline. */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', showByline = true, onDark = false }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <BrandMark className="size-9 shrink-0 drop-shadow-sm" tone={onDark ? 'cream' : 'brand'} />
    <span className="hidden sm:flex flex-col leading-none">
      <span className={`text-[17px] font-bold tracking-tight ${onDark ? 'text-cream' : 'text-brand-900'}`}>
        Resume<span className={onDark ? 'text-sage' : 'text-brand-400'}>Flow</span>
      </span>
      {showByline && (
        <span
          className={`mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.2em] ${
            onDark ? 'text-sage' : 'text-muted'
          }`}
        >
          by GetLaunchPH
        </span>
      )}
    </span>
  </span>
);
