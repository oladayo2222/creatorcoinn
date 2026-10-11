import type { SVGProps } from "react";

const base = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} aria-hidden><path d="M3 8h10M9 4l4 4-4 4" /></svg>
);
export const ArrowUpRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} aria-hidden><path d="M5 11l6-6M6 5h5v5" /></svg>
);
export const Lock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} aria-hidden><rect x="3" y="7" width="10" height="7" rx="2" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
);
export const Unlock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} aria-hidden><rect x="3" y="7" width="10" height="7" rx="2" /><path d="M5.5 7V5a2.5 2.5 0 0 1 4.8-1" /></svg>
);
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} aria-hidden><path d="M3.5 8.5l3 3 6-7" /></svg>
);
export const Minus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} aria-hidden><path d="M3.5 8h9" /></svg>
);
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} aria-hidden><path d="M3.5 8h9M8 3.5v9" /></svg>
);
export const Copy = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p} aria-hidden><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" /></svg>
);
