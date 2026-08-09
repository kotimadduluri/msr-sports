import {
  IconShield, IconShieldCheck, IconMedal, IconTarget, IconTrain, IconDumbbell,
  IconTrophy, IconTimer, IconRun, IconRuler, IconClipboardCheck, IconTrendingUp,
  IconSunrise, IconBook, IconSunset, IconCircleCheck, IconPin, IconStudents,
  IconRupee, IconPhone
} from '../../icons.jsx';

/* Testing numbers supplied by the owner (Aug 2026) — every call/WhatsApp
   button reaches them while the site is under review. Swap in the office
   contact details before public launch (CLAUDE.md §9).
   `phone` is for display; `phoneHref` is what tel: actually dials. */
export const ACADEMY = {
  phone: '+91 81790 28750',
  phoneHref: '+918179028750',
  whatsapp: '918179028750',
  email: 'info@msrsports.in',
  address: 'MSR Ground, Chirala, Bapatla District, Andhra Pradesh 523155',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=MSR+Ground+Chirala+Bapatla+District+Andhra+Pradesh'
};

/* All site copy lives in web/src/i18n/ (one dictionary per language). These
   icon lists pair positionally with the text arrays in those dictionaries —
   keep the order in sync when adding an entry. */
export const EVENT_ICONS = [
  IconTimer, IconRun, IconRuler, IconDumbbell,
  IconTarget, IconMedal, IconClipboardCheck, IconTrendingUp
];
export const TIMING_ICONS = [IconSunrise, IconBook, IconSunset];
export const STEP_ICONS = [IconClipboardCheck, IconTimer, IconCircleCheck];
export const WHY_ICONS = [IconPin, IconTimer, IconShieldCheck, IconStudents, IconRupee, IconPhone];

/* Shown until the courses API answers (and as demo data offline). Names are
   the official exam names and stay English in every language; translated
   descriptions live in the i18n dictionaries under programmes.courses. */
export const FALLBACK = [
  { name: 'AP Police Constable (PET + Written)', description: 'Ground training for the 100 m, 800 m and 1600 m runs, long jump and shot put, with daily written-exam classes.', fee_amount: 1500 },
  { name: 'AP Police SI (PET + Written)', description: 'Sub-Inspector preparation: physical measurement standards, all PET events, and coaching for Paper I and II.', fee_amount: 2000 },
  { name: 'Indian Army GD / Agniveer', description: '1.6 km timed run, pull-ups, ditch jump and zig-zag balance practice, alongside CEE written coaching.', fee_amount: 1200 },
  { name: 'SSC GD Constable', description: 'Running endurance built up week by week, with complete SSC GD written preparation.', fee_amount: 1200 },
  { name: 'Railway RPF / RRB', description: 'PET training and computer-based-test coaching for RPF constable and RRB group posts.', fee_amount: 1200 },
  { name: 'General Fitness & Athletics', description: 'Strength, endurance and athletics coaching for school and college students.', fee_amount: 800 }
];

/* Pick a Lucide icon for a programme card from its name. */
export function programmeIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('si')) return IconShieldCheck;
  if (n.includes('police')) return IconShield;
  if (n.includes('army') || n.includes('agniveer')) return IconMedal;
  if (n.includes('ssc')) return IconTarget;
  if (n.includes('railway') || n.includes('rpf') || n.includes('rrb')) return IconTrain;
  if (n.includes('fitness') || n.includes('athletic')) return IconDumbbell;
  return IconTrophy;
}
