/* English — the source dictionary. Every other locale mirrors this shape
   exactly; missing keys fall back to these strings at runtime. Manage all
   locale files with the `translator` skill (.claude/skills/translator). */
export default {
  nav: {
    programmes: 'Programmes',
    why: 'Why MSR',
    timings: 'Timings',
    contact: 'Contact'
  },

  actions: {
    joinNow: 'Join now',
    staffLogin: 'Staff login',
    call: 'Call',
    enquire: 'Enquire',
    planVisit: 'Plan a visit'
  },

  hero: {
    badge: 'Chirala · Bapatla District',
    h1a: 'Your government job starts at',
    h1b: '5:30 AM.',
    sub: 'We coach candidates for Police, Army, SSC and Railway selection — the physical events on our ground, the written exam in our classroom, and every timing measured so you know exactly where you stand.',
    ctaTrial: 'Book a free trial morning',
    scene: {
      bestLabel: '1600 m best',
      bestValue: '5 min 08 s',
      rollLabel: 'Morning roll call',
      rollValue: '94% present'
    },
    proof: [
      ['450+', 'Students trained'],
      ['120+', 'Government selections'],
      ['6', 'Recruitment programmes'],
      ['8 yrs', 'Coaching in Chirala']
    ],
    events: [
      '1600 m run',
      '100 m sprint',
      'Long jump',
      'Shot put',
      'Pull-ups',
      '800 m run',
      'Height & chest (PMT)',
      'Monthly progress record'
    ]
  },

  programmes: {
    kicker: 'What we coach',
    title: 'Choose your recruitment',
    sub: 'Every programme pairs ground training with written-exam classes. Fees are monthly, and a receipt is issued for every payment.',
    perMonth: '/month',
    /* Programme names stay in English everywhere (they are the official exam
       names). Descriptions are looked up here by name; an unknown name —
       e.g. a new course added in the portal — falls back to the API text. */
    courses: {
      'AP Police Constable — PET + Written': 'Ground training for the 100 m, 800 m and 1600 m runs, long jump and shot put, with daily written-exam classes.',
      'AP Police SI — PET + Written': 'Sub-Inspector preparation: physical measurement standards, all PET events, and coaching for Paper I and II.',
      'Indian Army GD / Agniveer': '1.6 km timed run, pull-ups, ditch jump and zig-zag balance practice, alongside CEE written coaching.',
      'SSC GD Constable': 'Running endurance built up week by week, with complete SSC GD written preparation.',
      'Railway RPF / RRB': 'PET training and computer-based-test coaching for RPF constable and RRB group posts.',
      'General Fitness & Athletics': 'Strength, endurance and athletics coaching for school and college students.'
    }
  },

  why: {
    kicker: 'The difference',
    title: 'Why students choose MSR',
    sub: 'Chirala has gyms and it has tuition centres. What it did not have is one place that treats the run and the written paper as a single preparation.',
    visit: {
      title: 'See it for yourself',
      body: 'Walk in any morning from 5:30 and watch a full session before you decide anything.'
    },
    items: [
      ['Ground and classroom, same campus', 'Physical training at dawn, written-exam class by 9 AM. One institute, one fee, no travelling in between.'],
      ['Every timing on record', 'Your 1600 m, long jump and shot put results are measured and recorded month after month, so you always know your distance from the cut-off.'],
      ['Coaches who cleared it themselves', 'Our trainers have been through police and army selection. The technique they teach is the one that worked on the ground.'],
      ['A women’s batch that runs daily', 'A dedicated 6:30 AM batch with women trainers, built around the 800 m, long jump and shot put standards.'],
      ['Monthly fees, printed receipts', 'No lump sums. Pay month by month, cash or UPI, and take a printed receipt every time.'],
      ['Parents stay informed', 'If a student stops attending, the family hears from us the same week — not at fee time.']
    ]
  },

  timings: {
    kicker: 'A training day',
    title: 'The daily schedule',
    sub: 'Six days a week, in two shifts, so school, college and working candidates can all train.',
    slots: [
      ['Morning ground', '5:30 – 8:00 AM', 'Running, jumps, shot put and circuit training. Monday to Saturday.'],
      ['Written class', '9:00 – 11:00 AM', 'Arithmetic, reasoning, general studies and current affairs. Monday to Friday.'],
      ['Evening ground', '4:30 – 7:00 PM', 'The same ground programme, timed for college and working students. Monday to Saturday.']
    ]
  },

  steps: {
    kicker: 'Getting started',
    title: 'Joining takes one morning',
    step: 'Step',
    items: [
      ['Visit the ground', 'Come any morning from 5:30. Watch a full session and talk to the coaches — bring a parent along if you like.'],
      ['Train one morning, free', 'Run with a batch for one session before you decide. No payment and no forms for the trial.'],
      ['Join in ten minutes', 'Admission is a short form at the office. You get an admission number, your batch, and a receipt for every fee you ever pay.']
    ]
  },

  join: {
    title: 'Join MSR Sports Academy',
    sub: 'Leave your number and our office will call you the same day with fees, batch timings and what to bring on your first morning.',
    contacts: {
      call: 'Call the office',
      whatsapp: 'WhatsApp',
      whatsappValue: 'Message us any time',
      email: 'Email',
      ground: 'The ground',
      directions: 'Get directions'
    },
    form: {
      title: 'Admission enquiry',
      sub: 'Takes 30 seconds — we call back the same day',
      name: 'Your name',
      namePh: 'Full name',
      phone: 'Mobile number',
      phonePh: '9XXXXXXXXX',
      village: 'Village or town',
      villagePh: 'Chirala',
      programme: 'Which programme?',
      notSure: 'Not sure yet',
      message: 'Message (optional)',
      messagePh: 'Best time to call you',
      submit: 'Request a call back',
      privacy: 'We only use your number to call you about admission.',
      doneTitle: 'Enquiry received',
      doneBody: 'Our office will call you shortly. For a faster reply, message us on WhatsApp.',
      again: 'Send another enquiry'
    }
  },

  footer: {
    place: 'Chirala · Andhra Pradesh',
    blurb: 'Ground training and written-exam coaching for police, army, SSC and railway recruitment — one campus, one preparation.',
    explore: 'Explore',
    contact: 'Contact'
  }
};
