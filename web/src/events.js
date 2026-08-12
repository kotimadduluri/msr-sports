/* The physical events the recruitments test — one list for every screen
   that records or ranks results. Names must match test_records.event. */
export const EVENTS = [
  '1600m Run', '800m Run', '100m Sprint', 'Long Jump',
  'Shot Put (7.26kg)', 'Shot Put (4kg)', 'High Jump', 'Pull-ups'
];

export const unitFor = event =>
  /Run|Sprint/.test(event) ? 'sec' : /Pull/.test(event) ? 'count' : 'm';

export const unitLabel = unit =>
  unit === 'sec' ? 'seconds' : unit === 'm' ? 'metres' : 'count';

/* readiness colours used everywhere a cut-off verdict appears */
export const READINESS = {
  ready: { label: 'Ready', cls: 'bg-good-50 text-good-700' },
  borderline: { label: 'Close', cls: 'bg-warn-50 text-warn-700' },
  'at-risk': { label: 'Needs work', cls: 'bg-critical-50 text-critical-700' }
};
