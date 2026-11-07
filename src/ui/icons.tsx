import type { SVGProps } from 'react';

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const CloudIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 32" {...p}>
    <path fill="currentColor" d="M12 30h25a9 9 0 0 0 1.4-17.9A12 12 0 0 0 15.7 9.3 10.5 10.5 0 0 0 12 30Z" />
  </svg>
);

export const SpeakerIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
    <path d="M15.5 9a4.5 4.5 0 0 1 0 6" />
    <path d="M18 6.5a8 8 0 0 1 0 11" />
  </svg>
);

export const SpeakerOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
    <path d="m16 9.5 5 5m0-5-5 5" />
  </svg>
);

export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...p}>
    <path
      fill="currentColor"
      d="M12 2.8c.5 0 .9.3 1.1.7l2.2 4.6 5 .7c1 .1 1.4 1.4.7 2.1l-3.7 3.5.9 5c.2 1-.9 1.8-1.8 1.3L12 18.3l-4.5 2.4c-.9.5-2-.3-1.8-1.3l.9-5-3.7-3.5c-.7-.7-.3-2 .7-2.1l5-.7 2.2-4.6c.3-.4.7-.7 1.2-.7Z"
    />
  </svg>
);

export const ArrowIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5Z" />
  </svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="m7 7 10 10M17 7 7 17" />
  </svg>
);
