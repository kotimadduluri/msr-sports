import {
  IconShield, IconShieldCheck, IconMedal, IconTarget, IconTrain, IconDumbbell,
  IconTrophy, IconTimer, IconRun, IconRuler, IconClipboardCheck, IconTrendingUp,
  IconSunrise, IconBook, IconSunset, IconCircleCheck
} from '../../icons.jsx';

/* Replace with the academy's real details before going live (CLAUDE.md §9).
   `phone` is for display; `phoneHref` is what tel: actually dials. */
export const ACADEMY = {
  phone: '+91 90000 00000',
  phoneHref: '+919000000000',
  whatsapp: '919000000000',
  email: 'info@msrsports.in',
  address: 'MSR Ground, Chirala, Bapatla District, Andhra Pradesh 523155',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=MSR+Ground+Chirala+Bapatla+District+Andhra+Pradesh'
};

export const PROOF = [
  ['450+', 'Students trained'],
  ['120+', 'Government selections'],
  ['6', 'Recruitment programmes'],
  ['8 yrs', 'Coaching in Chirala']
];

/* Every event the recruitments test — shown in the hero ticker. */
export const EVENTS = [
  [IconTimer, '1600 m run'],
  [IconRun, '100 m sprint'],
  [IconRuler, 'Long jump'],
  [IconDumbbell, 'Shot put'],
  [IconTarget, 'Pull-ups'],
  [IconMedal, '800 m run'],
  [IconClipboardCheck, 'Height & chest (PMT)'],
  [IconTrendingUp, 'Monthly progress record']
];

export const WHY = [
  ['Ground and classroom, same campus', 'Physical training at dawn, written-exam class by 9 AM. One institute, one fee, no travelling in between.'],
  ['Every timing on record', 'Your 1600 m, long jump and shot put results are measured and recorded month after month, so you always know your distance from the cut-off.'],
  ['Coaches who cleared it themselves', 'Our trainers have been through police and army selection. The technique they teach is the one that worked on the ground.'],
  ['A women’s batch that runs daily', 'A dedicated 6:30 AM batch with women trainers, built around the 800 m, long jump and shot put standards.'],
  ['Monthly fees, printed receipts', 'No lump sums. Pay month by month, cash or UPI, and take a printed receipt every time.'],
  ['Parents stay informed', 'If a student stops attending, the family hears from us the same week — not at fee time.']
];

export const TIMINGS = [
  [IconSunrise, 'Morning ground', '5:30 – 8:00 AM', 'Running, jumps, shot put and circuit training. Monday to Saturday.'],
  [IconBook, 'Written class', '9:00 – 11:00 AM', 'Arithmetic, reasoning, general studies and current affairs. Monday to Friday.'],
  [IconSunset, 'Evening ground', '4:30 – 7:00 PM', 'The same ground programme, timed for college and working students. Monday to Saturday.']
];

export const STEPS = [
  [IconClipboardCheck, 'Visit the ground', 'Come any morning from 5:30. Watch a full session and talk to the coaches — bring a parent along if you like.'],
  [IconTimer, 'Train one morning, free', 'Run with a batch for one session before you decide. No payment and no forms for the trial.'],
  [IconCircleCheck, 'Join in ten minutes', 'Admission is a short form at the office. You get an admission number, your batch, and a receipt for every fee you ever pay.']
];

/* Shown until the courses API answers (and as demo data offline). */
export const FALLBACK = [
  { name: 'AP Police Constable — PET + Written', description: 'Ground training for the 100 m, 800 m and 1600 m runs, long jump and shot put, with daily written-exam classes.', fee_amount: 1500 },
  { name: 'AP Police SI — PET + Written', description: 'Sub-Inspector preparation: physical measurement standards, all PET events, and coaching for Paper I and II.', fee_amount: 2000 },
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
