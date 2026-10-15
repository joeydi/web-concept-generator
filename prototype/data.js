/* Static data for the prototype: history, content packs, preset styles.
   Everything here is a stand-in for what the generation backend will return. */
(function () {
  const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  const HISTORY_SEED = [
    { domain: 'distefanolandscaping.com', name: 'DiStefano Landscaping', ago: 2 * MIN },
    { domain: 'brightsmiledental.com', name: 'Brightsmile Dental', ago: 3 * HOUR },
    { domain: 'harborlawgroup.com', name: 'Harbor Law Group', ago: 1 * DAY },
    { domain: 'northpourcoffee.com', name: 'North Pour Coffee', ago: 2 * DAY },
    { domain: 'ridgelinefitness.co', name: 'Ridgeline Fitness', ago: 6 * DAY },
  ];

  /* Content packs. {name} is replaced with the business name. */
  const PACKS = [
    {
      id: 'landscaping', match: /landscap|garden|lawn|tree|yard/,
      nav: ['Services', 'Projects', 'About', 'Contact'], cta: 'Get a quote',
      homeTitle: 'Landscape Design',
      homeBlurb: 'Thoughtful outdoor spaces, designed and built by one family-run crew. From patios and plantings to full property renovations, we shape landscapes that look right and last.',
      facts: [['25+ years', 'in business'], ['1,200', 'projects built'], ['Family', 'owned and run']],
      bannerTitle: 'Landscape Services',
      services: [
        ['Landscape design', 'Site plans and planting schemes drawn for how you actually use the yard.'],
        ['Patios and hardscape', 'Stone patios, walls and walkways built on a base that will not shift.'],
        ['Planting and lawn care', 'Beds, trees and turf installed, then kept healthy through every season.'],
      ],
      detailTitle: 'Patios and Hardscape',
      detailBlurb: 'Natural stone and pavers, installed on a compacted base with proper drainage, so the surface stays level year after year.',
      byline: ['Marco DiStefano', 'Lead designer'],
      subhead: 'How we build a patio that lasts',
      body: [
        'Every project starts with a walk of the property. We look at grade, drainage, sun and the way you move between the house and the yard before a single line is drawn.',
        'Excavation, a compacted aggregate base and edge restraints do the unglamorous work that keeps a patio flat for decades. The surface material is the last decision, not the first.',
      ],
    },
    {
      id: 'dental', match: /dental|dentist|smile|ortho/,
      nav: ['Services', 'New patients', 'Team', 'Contact'], cta: 'Book a visit',
      homeTitle: 'Gentle Family Dentistry',
      homeBlurb: 'Cleanings, fillings and cosmetic care in an unhurried office. We explain every step, quote every price up front and leave time for your questions.',
      facts: [['18', 'years in practice'], ['4.9', 'average rating'], ['Same day', 'emergency visits']],
      bannerTitle: 'Dental Services',
      services: [
        ['Preventive care', 'Exams, cleanings and x-rays on a schedule that fits your mouth.'],
        ['Restorative work', 'Fillings, crowns and implants that look and feel like your own teeth.'],
        ['Cosmetic dentistry', 'Whitening and veneers, planned with you and priced before we start.'],
      ],
      detailTitle: 'Dental Implants',
      detailBlurb: 'A permanent replacement for a missing tooth, placed in two short visits with a clear timeline and a fixed quote.',
      byline: ['Dr. Anna Reyes', 'Lead dentist'],
      subhead: 'What to expect from an implant',
      body: [
        'After a scan and a plan, the implant post is placed under local anesthetic. Most people go back to work the next day.',
        'The crown follows once the post has healed. We check in at each stage and never rush you to the next one.',
      ],
    },
    {
      id: 'law', match: /law|legal|attorney|counsel/,
      nav: ['Practice areas', 'Attorneys', 'Results', 'Contact'], cta: 'Request a consult',
      homeTitle: 'Plain-Spoken Counsel',
      homeBlurb: 'Business, real estate and estate planning advice from attorneys who return your calls. Clear fees, direct answers and no surprises at the end of the matter.',
      facts: [['30+ years', 'combined experience'], ['900', 'matters closed'], ['24 hr', 'response time']],
      bannerTitle: 'Practice Areas',
      services: [
        ['Business law', 'Formation, contracts and disputes for owner-run companies.'],
        ['Real estate', 'Purchases, leases and closings handled start to finish.'],
        ['Estate planning', 'Wills, trusts and guardianship set up so your wishes hold.'],
      ],
      detailTitle: 'Estate Planning',
      detailBlurb: 'A short list of documents that protect your family and keep your affairs out of court, explained in plain language.',
      byline: ['Elena Harbor', 'Managing partner'],
      subhead: 'Where most plans go wrong',
      body: [
        'The most common problem we see is a plan that was never updated. Marriages, births and moves all change what a document should say.',
        'We review every plan with you every few years and flag what has drifted out of date.',
      ],
    },
    {
      id: 'coffee', match: /coffee|cafe|pour|roast|espresso|bakery/,
      nav: ['Menu', 'Shop', 'Visit', 'Contact'], cta: 'Order ahead',
      homeTitle: 'Small-Batch Coffee',
      homeBlurb: 'Roasted twice a week in the back of the shop and poured by people who care how it tastes. Come in for a cup or take a bag home.',
      facts: [['2x', 'roasts every week'], ['12', 'single origins'], ['Open', 'daily from 7']],
      bannerTitle: 'Menu and Shop',
      services: [
        ['Espresso bar', 'Seasonal espresso and milk drinks pulled to order.'],
        ['Whole bean', 'Fresh-roasted bags, shipped or ready for pickup.'],
        ['Pastries', 'Baked each morning with local flour and butter.'],
      ],
      detailTitle: 'Our Roasting Process',
      detailBlurb: 'How a green coffee from one farm becomes the bag on your counter, and why we roast it the way we do.',
      byline: ['Sam Okafor', 'Head roaster'],
      subhead: 'Why we roast light',
      body: [
        'Lighter roasts keep the character of the farm and the harvest. We taste every batch before it leaves the shop.',
        'We rest each roast for four days, then bag it, so the first cup you brew is the one we meant you to have.',
      ],
    },
    {
      id: 'fitness', match: /fit|gym|train|strength|ridge/,
      nav: ['Classes', 'Coaches', 'Pricing', 'Contact'], cta: 'Try a class',
      homeTitle: 'Strength For Real Life',
      homeBlurb: 'Small-group coaching and honest programming for people who want to move well for decades. Every session is led by a coach who knows your name.',
      facts: [['8', 'members per class'], ['6 am', 'to 8 pm daily'], ['1:1', 'onboarding']],
      bannerTitle: 'Classes',
      services: [
        ['Strength', 'Barbell and kettlebell sessions scaled to every level.'],
        ['Conditioning', 'Short, hard intervals that build capacity without burnout.'],
        ['Mobility', 'Slow, focused work for joints, backs and desk-bound hips.'],
      ],
      detailTitle: 'Your First Month',
      detailBlurb: 'What happens from your intro session to your first progress check, week by week.',
      byline: ['Jordan Pace', 'Head coach'],
      subhead: 'Week one: assess and learn',
      body: [
        'We start with a movement screen and a conversation about your goals, injuries and schedule.',
        'By week four you will have a program, a coach who has seen you lift, and a baseline to measure against.',
      ],
    },
    {
      id: 'generic', match: /.*/,
      nav: ['Services', 'Work', 'About', 'Contact'], cta: 'Get in touch',
      homeTitle: 'Work That Speaks For Itself',
      homeBlurb: 'A focused team that does a few things well. We keep our process simple, our communication clear and our promises small enough to keep.',
      facts: [['10+ years', 'of experience'], ['300', 'clients served'], ['Local', 'and independent']],
      bannerTitle: 'Our Services',
      services: [
        ['Consulting', 'A clear plan, built around what you need and nothing extra.'],
        ['Delivery', 'Hands-on work from the same team that made the plan.'],
        ['Support', 'Ongoing help after launch, with real people on the line.'],
      ],
      detailTitle: 'How We Work',
      detailBlurb: 'A look at our process from first call to final delivery, and what you can expect from us along the way.',
      byline: ['Alex Morgan', 'Founder'],
      subhead: 'Start with a conversation',
      body: [
        'Every engagement begins with a call. We listen first, then propose the smallest plan that solves the problem.',
        'You get a fixed scope, a named contact and regular updates, so you always know where things stand.',
      ],
    },
  ];

  /* Fonts used by presets and by the image-extraction stand-in. */
  const FONT_PAIRS = {
    verdant: { display: '"Fraunces", Georgia, serif', body: '"Figtree", system-ui, sans-serif', dw: 600, dcase: 'none', dtrack: '-0.02em' },
    editorial: { display: '"Playfair Display", Georgia, serif', body: '"Source Serif 4", Georgia, serif', dw: 700, dcase: 'none', dtrack: '-0.01em' },
    coastal: { display: '"Plus Jakarta Sans", system-ui, sans-serif', body: '"Plus Jakarta Sans", system-ui, sans-serif', dw: 600, dcase: 'none', dtrack: '-0.03em' },
    brutalist: { display: '"Space Grotesk", system-ui, sans-serif', body: '"Space Grotesk", system-ui, sans-serif', dw: 700, dcase: 'uppercase', dtrack: '-0.04em' },
    midcentury: { display: '"DM Serif Display", Georgia, serif', body: '"DM Sans", system-ui, sans-serif', dw: 400, dcase: 'none', dtrack: '-0.01em' },
    noir: { display: '"Bebas Neue", Impact, sans-serif', body: '"Inter", system-ui, sans-serif', dw: 400, dcase: 'uppercase', dtrack: '0.02em' },
  };

  const LAYOUTS = ['symmetrical', 'asymmetrical', 'clean', 'overlapping', 'traditional', 'avant-garde'];

  const PRESETS = [
    { id: 'verdant', name: 'Verdant', vibe: ['Earthy', 'Quiet'], layout: 'asymmetrical', fontKey: 'verdant',
      palette: { bg: '#F4F1E8', surface: '#E6E0CF', ink: '#1F2A1D', muted: '#556050', accent: '#2F6B4F', accentInk: '#FFFFFF' }, space: 1, radius: 10 },
    { id: 'editorial', name: 'Editorial', vibe: ['Literary', 'Refined'], layout: 'traditional', fontKey: 'editorial',
      palette: { bg: '#FAF6EF', surface: '#EFE7D8', ink: '#1B1A17', muted: '#5A5346', accent: '#8C2F1B', accentInk: '#FFFFFF' }, space: 1.05, radius: 2 },
    { id: 'coastal', name: 'Coastal', vibe: ['Airy', 'Calm'], layout: 'clean', fontKey: 'coastal',
      palette: { bg: '#F3F8FA', surface: '#DFEDF2', ink: '#12303D', muted: '#46626E', accent: '#0E7C9B', accentInk: '#FFFFFF' }, space: 1.25, radius: 14 },
    { id: 'brutalist', name: 'Brutalist', vibe: ['Raw', 'Loud'], layout: 'avant-garde', fontKey: 'brutalist',
      palette: { bg: '#F2F2EE', surface: '#FFFFFF', ink: '#0A0A0A', muted: '#4A4A4A', accent: '#FF4B1F', accentInk: '#0A0A0A' }, space: 0.9, radius: 0 },
    { id: 'midcentury', name: 'Midcentury', vibe: ['Warm', 'Playful'], layout: 'overlapping', fontKey: 'midcentury',
      palette: { bg: '#FBF1DC', surface: '#F1DBAE', ink: '#1F3B3D', muted: '#59503F', accent: '#D98A0B', accentInk: '#1F3B3D' }, space: 1, radius: 22 },
    { id: 'noir', name: 'Noir', vibe: ['Moody', 'Premium'], layout: 'symmetrical', fontKey: 'noir',
      palette: { bg: '#101113', surface: '#1B1D21', ink: '#F2EFE8', muted: '#A9A79F', accent: '#E0B65A', accentInk: '#101113' }, space: 1.1, radius: 4 },
  ].map(function (s) {
    const f = FONT_PAIRS[s.fontKey];
    return Object.assign({}, s, { fonts: { display: f.display, body: f.body, dw: f.dw, dcase: f.dcase, dtrack: f.dtrack } });
  });

  window.WCG = { HISTORY_SEED, PACKS, FONT_PAIRS, LAYOUTS, PRESETS };
})();
