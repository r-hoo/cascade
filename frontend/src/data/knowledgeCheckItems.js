export const MC_ITEMS = [
  {
    id:       'ss_1',
    source:   'Sweeney & Sterman (2000)',
    type:     'mc',
    question: 'A reservoir currently holds 60 million gallons (MG). Water flows in from rainfall at 3 MG per day and is extracted at 5 MG per day. After 4 days, approximately how much water remains in the reservoir?',
    options: [
      { key: 'A', text: '68 MG — rainfall added more than extraction removed' },
      { key: 'B', text: '52 MG — the net loss of 2 MG/day compounded over 4 days' },
      { key: 'C', text: '60 MG — inflows and outflows balanced each other out' },
      { key: 'D', text: '56 MG — only extraction was counted, not rainfall' },
    ],
    explanation: 'Net flow = 3 − 5 = −2 MG/day. Over 4 days: 60 + (−2 × 4) = 52 MG. The stock accumulates the net flow — both inflow and outflow matter simultaneously.',
  },
  {
    id:       'ss_2',
    source:   'Sweeney & Sterman (2000)',
    type:     'mc',
    question: "A city's daily water demand is currently 3 MG/day and growing by 0.5 MG each day. The treatment plant's maximum output is fixed at 4 MG/day. In how many days will demand first exceed plant capacity?",
    options: [
      { key: 'A', text: '1 day' },
      { key: 'B', text: '2 days' },
      { key: 'C', text: '3 days' },
      { key: 'D', text: '8 days' },
    ],
    explanation: 'Day 0: 3.0, Day 1: 3.5, Day 2: 4.0 (equals capacity), Day 3: 4.5 (exceeds). Demand first exceeds 4 MG/day on Day 3. Linear accumulation must be tracked step by step.',
  },
  {
    id:       'ss_3',
    source:   'Sweeney & Sterman (2000)',
    type:     'mc',
    chart:    true,
    question: 'The chart below shows daily inflow and outflow rates for a reservoir over 8 days. On which day does the reservoir level first begin to fall?',
    options: [
      { key: 'A', text: 'Day 1 — outflow starts above zero immediately' },
      { key: 'B', text: 'Day 3 — when outflow first exceeds inflow' },
      { key: 'C', text: 'Day 5 — when outflow reaches its peak' },
      { key: 'D', text: 'Day 8 — at the end of the period shown' },
    ],
    explanation: 'The reservoir level rises whenever inflow > outflow, and falls whenever outflow > inflow. The crossover point is Day 3. Before Day 3 the reservoir is growing; after Day 3 it is shrinking.',
  },
  {
    id:       'ss_4',
    source:   'Sweeney & Sterman (2000) / Arnold & Wade (2015)',
    type:     'mc',
    question: 'A new neighborhood is connected to a water system. Every day that the neighborhood receives adequate supply, 50 new residents move in — each using 0.01 MG/day. Which statement best describes the demand pattern over time, assuming supply is always adequate?',
    options: [
      { key: 'A', text: 'Demand stays constant once the neighborhood is fully built' },
      { key: 'B', text: 'Demand grows at a fixed rate regardless of whether supply is met' },
      { key: 'C', text: 'Demand grows faster and faster as long as supply is met — a reinforcing loop' },
      { key: 'D', text: 'Demand immediately jumps to its maximum level on day one' },
    ],
    explanation: 'Each day of adequate supply adds residents, who increase demand, which requires more supply to be "adequate" the next day. This is a reinforcing (positive) feedback loop — growth begets growth.',
  },
]

export const OPEN_ITEM = {
  id:       'vt_1',
  source:   'Verhoeven et al. (2018)',
  type:     'open',
  scenario: "A city's reservoir level has been steadily declining for three months despite normal rainfall. The water authority increased extraction rates last year to meet growing demand from a new industrial zone. The authority is now considering building a second reservoir.",
  prompts: [
    'Describe two feedback relationships that help explain why the reservoir level is declining.',
    "The authority's proposed solution is to build a second reservoir. Explain whether this addresses the root cause of the problem or only its symptom, and why.",
  ],
}