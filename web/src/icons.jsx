import React from 'react';

/* One stroke weight, one grid, one API — replaces the emoji placeholders. */
const Svg = ({ children, className = 'h-5 w-5', ...rest }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const IconDashboard = p => <Svg {...p}><path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-5H3zM13 8h8V3h-8z" /></Svg>;
export const IconStudents = p => <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Svg>;
export const IconCheck = p => <Svg {...p}><path d="M9 11.5 11.5 14l5-5" /><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M8 2v4M16 2v4" /></Svg>;
export const IconRupee = p => <Svg {...p}><path d="M7 4h10M7 9h10M15.5 4c0 4-3 5-8.5 5 3 0 6 1.8 8 5l2.5 4" /></Svg>;
export const IconRun = p => <Svg {...p}><circle cx="14.5" cy="4.5" r="2" /><path d="m8 21 2.5-5.5L8 12l1-5 4 2 3 1" /><path d="m13 13 3 3 1 5M9 7 5.5 8.5 4 12" /></Svg>;
export const IconCalendar = p => <Svg {...p}><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 10h18M8 2v4M16 2v4" /></Svg>;
export const IconPhone = p => <Svg {...p}><path d="M21 16.9v2.6a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6A2 2 0 0 1 3.3 2H6a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></Svg>;
export const IconSettings = p => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></Svg>;
export const IconSearch = p => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
export const IconPlus = p => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconChevronLeft = p => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>;
export const IconChevronRight = p => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>;
export const IconClose = p => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const IconDownload = p => <Svg {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></Svg>;
export const IconWhatsapp = p => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={p.className || 'h-5 w-5'} aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.2-.5s0-.4-.1-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c2.1.8 2.1.6 2.5.5a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
  </svg>
);
export const IconAlert = p => <Svg {...p}><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></Svg>;
export const IconInbox = p => <Svg {...p}><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M6 4h12l3 9v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" /></Svg>;
export const IconTrophy = p => <Svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></Svg>;
export const IconMenu = p => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
export const IconLogout = p => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>;
export const IconClock = p => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const IconPin = p => <Svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Svg>;
export const IconMail = p => <Svg {...p}><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 7 8.2 5.5a1.5 1.5 0 0 0 1.6 0L21 7" /></Svg>;
export const IconSpark = p => <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></Svg>;

/* the mark — used in the header, the login screen and the app icon */
export function Logo({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#1d3462" />
      <circle cx="27.5" cy="13.5" r="4.2" fill="#f5a524" />
      <path d="M24.8 19.5c-5.2 0-8.4 2.6-9.6 6.6l-1.6 5.2a1.9 1.9 0 0 0 3.6 1.1l1.3-4 1.1 3.6-3 8.4a2.1 2.1 0 0 0 3.9 1.4l3.3-8.2 3 4.5 1.6 4.5a2 2 0 0 0 3.8-1.3l-1.8-5.2-4.2-6.4 1.1-4.6 3.2 3.3 4.4.6a1.8 1.8 0 0 0 .5-3.6l-3.6-.6-3.4-3.6a6.4 6.4 0 0 0-3.6-1.7Z" fill="#fff" />
    </svg>
  );
}
