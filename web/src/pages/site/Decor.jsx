import React, { useId } from 'react';

/* Faint diagonal lane markings — the one texture the dark sections share.
   Sits behind content at very low opacity so the navy never reads as a flat
   AI-gradient block. */
export function Lanes({ className = '' }) {
  const id = useId();
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)">
          <path d="M0 32h64" stroke="#fff" strokeOpacity=".045" strokeWidth="1.5" strokeDasharray="9 11" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
