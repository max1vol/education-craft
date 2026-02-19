export type ImprovementStage = {
  name: 'Starter' | 'Better' | 'Advanced' | 'Mastery';
  detail: string;
};

export type SiteFeatureIdea = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  dataUsed: string[];
  progression: ImprovementStage[];
  impact: string;
  illustration: string;
};

export const siteFeatureIdeas: SiteFeatureIdea[] = [
  {
    id: 'HS01',
    slug: 'hs01-site-time-lapse-atlas',
    title: 'Site Time-Lapse Atlas',
    summary: 'Interactive map layers let pupils compare each site across centuries and explain what changed.',
    dataUsed: ['origin story', 'timeline events', 'map location', 'gallery images', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Tap one site and reveal five key facts on map hotspots.' },
      { name: 'Better', detail: 'Use a year slider to compare two moments side by side.' },
      { name: 'Advanced', detail: 'Complete route missions that require evidence from multiple time layers.' },
      { name: 'Mastery', detail: 'Publish a narrated map tour with claims linked to sources.' }
    ],
    impact: 'Builds chronology and map-reading confidence in a clear visual flow.',
    illustration: '/created-illustrations/ideas/hs01-site-time-lapse-atlas.svg'
  },
  {
    id: 'HS02',
    slug: 'hs02-monument-builder-studio',
    title: 'Monument Builder Studio',
    summary: 'Drag-and-drop reconstruction challenges teach why materials and tools matter.',
    dataUsed: ['construction methods', 'materials', 'tools', 'gallery images', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Assemble a simple monument outline using guided pieces.' },
      { name: 'Better', detail: 'Pick period-correct materials and receive immediate feedback.' },
      { name: 'Advanced', detail: 'Balance labour, weather, and time constraints during a build.' },
      { name: 'Mastery', detail: 'Submit a full build plan and justify choices with evidence.' }
    ],
    impact: 'Connects engineering decisions to historical context through active practice.',
    illustration: '/created-illustrations/ideas/hs02-monument-builder-studio.svg'
  },
  {
    id: 'HS03',
    slug: 'hs03-artifact-detective-desk',
    title: 'Artifact Detective Desk',
    summary: 'Case-based artifact sorting links objects to place, period, and purpose.',
    dataUsed: ['artifact images', 'timeline events', 'site zones', 'materials', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Match basic artifacts to the correct site area.' },
      { name: 'Better', detail: 'Sort finds by period using material and shape clues.' },
      { name: 'Advanced', detail: 'Write short evidence notes for each placement decision.' },
      { name: 'Mastery', detail: 'Close a case report with confidence scores and citations.' }
    ],
    impact: 'Strengthens evidence-based reasoning and clear explanation skills.',
    illustration: '/created-illustrations/ideas/hs03-artifact-detective-desk.svg'
  },
  {
    id: 'HS04',
    slug: 'hs04-fortress-defense-replay',
    title: 'Fortress Defense Replay',
    summary: 'Replay historical attack and defense scenarios to test design choices.',
    dataUsed: ['site layout', 'topography', 'timeline events', 'construction methods', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Place defenders on a simplified site map.' },
      { name: 'Better', detail: 'Run one attack and one defense strategy replay.' },
      { name: 'Advanced', detail: 'Adjust terrain and period technology to compare outcomes.' },
      { name: 'Mastery', detail: 'Publish a strategy report explaining cause and effect.' }
    ],
    impact: 'Shows how geography and design influence outcomes in understandable ways.',
    illustration: '/created-illustrations/ideas/hs04-fortress-defense-replay.svg'
  },
  {
    id: 'HS05',
    slug: 'hs05-route-to-market',
    title: 'Route to Market',
    summary: 'Trade-route planning combines geography, time, and resource decisions.',
    dataUsed: ['regions', 'distance', 'timeline', 'materials', 'site links', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Trace a single route between two historical sites.' },
      { name: 'Better', detail: 'Add goods and compare travel time by transport mode.' },
      { name: 'Advanced', detail: 'Handle seasonal risk and route disruption constraints.' },
      { name: 'Mastery', detail: 'Optimise a network and explain trade-offs with evidence.' }
    ],
    impact: 'Combines numeracy and historical understanding in one practical challenge.',
    illustration: '/created-illustrations/ideas/hs05-route-to-market.svg'
  },
  {
    id: 'HS06',
    slug: 'hs06-voices-at-the-site',
    title: 'Voices at the Site',
    summary: 'Role-based storytelling turns facts into learner-led historical narratives.',
    dataUsed: ['origin story', 'timeline events', 'daily-life facts', 'official images', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Listen to short role cards at key site points.' },
      { name: 'Better', detail: 'Sequence role clips into one day-in-the-life timeline.' },
      { name: 'Advanced', detail: 'Record learner narration with evidence prompts.' },
      { name: 'Mastery', detail: 'Publish a multi-voice tour with cited captions.' }
    ],
    impact: 'Improves empathy, speaking confidence, and historical retelling.',
    illustration: '/created-illustrations/ideas/hs06-voices-at-the-site.svg'
  },
  {
    id: 'HS07',
    slug: 'hs07-conservation-command',
    title: 'Conservation Command',
    summary: 'Preservation planning teaches stewardship of heritage sites.',
    dataUsed: ['materials', 'condition notes', 'timeline', 'official images', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Find damaged zones in current images.' },
      { name: 'Better', detail: 'Choose suitable repair materials from guided options.' },
      { name: 'Advanced', detail: 'Build a yearly preservation plan under budget limits.' },
      { name: 'Mastery', detail: 'Defend the plan with data-backed priorities.' }
    ],
    impact: 'Builds responsibility and practical decision-making around shared heritage.',
    illustration: '/created-illustrations/ideas/hs07-conservation-command.svg'
  },
  {
    id: 'HS08',
    slug: 'hs08-fact-or-legend-lab',
    title: 'Fact or Legend Lab',
    summary: 'Claim-checking cards teach pupils to separate myths from supported facts.',
    dataUsed: ['claims', 'timeline events', 'sources', 'official illustrations', 'gallery images'],
    progression: [
      { name: 'Starter', detail: 'Classify statements as fact, opinion, or legend.' },
      { name: 'Better', detail: 'Open two sources and highlight supporting evidence.' },
      { name: 'Advanced', detail: 'Rate reliability and resolve conflicting sources.' },
      { name: 'Mastery', detail: 'Write a verdict paragraph with citations.' }
    ],
    impact: 'Strengthens critical thinking and source evaluation early.',
    illustration: '/created-illustrations/ideas/hs08-fact-or-legend-lab.svg'
  },
  {
    id: 'HS09',
    slug: 'hs09-excavation-grid-quest',
    title: 'Excavation Grid Quest',
    summary: 'Layer-by-layer digs teach archaeological recording and interpretation.',
    dataUsed: ['site grid', 'timeline', 'materials', 'tools', 'artifact images', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Excavate one grid square and log findings.' },
      { name: 'Better', detail: 'Track depth layers and assign finds to periods.' },
      { name: 'Advanced', detail: 'Choose tools that affect speed and preservation.' },
      { name: 'Mastery', detail: 'Produce a dig report with reconstructed chronology.' }
    ],
    impact: 'Develops observation and scientific record-keeping habits.',
    illustration: '/created-illustrations/ideas/hs09-excavation-grid-quest.svg'
  },
  {
    id: 'HS10',
    slug: 'hs10-then-and-now-lens',
    title: 'Then-and-Now Lens',
    summary: 'Aligned historical and modern views make continuity and change obvious.',
    dataUsed: ['historic images', 'current images', 'timeline events', 'maps', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Match old photos to modern viewpoints.' },
      { name: 'Better', detail: 'Use overlays to identify structural differences.' },
      { name: 'Advanced', detail: 'Annotate likely causes such as weather or restoration.' },
      { name: 'Mastery', detail: 'Curate a before-and-after exhibit with sources.' }
    ],
    impact: 'Improves visual literacy and reasoning about change over time.',
    illustration: '/created-illustrations/ideas/hs10-then-and-now-lens.svg'
  },
  {
    id: 'HS11',
    slug: 'hs11-rituals-and-seasons-planner',
    title: 'Rituals and Seasons Planner',
    summary: 'Calendar and sky alignment views connect culture, season, and site design.',
    dataUsed: ['timeline events', 'site layout', 'origin story', 'source links', 'official illustrations'],
    progression: [
      { name: 'Starter', detail: 'Place key events on a yearly calendar.' },
      { name: 'Better', detail: 'Link rituals to season and daylight patterns.' },
      { name: 'Advanced', detail: 'Compare how shifts in timing affect community plans.' },
      { name: 'Mastery', detail: 'Design a festival timeline backed by evidence.' }
    ],
    impact: 'Helps learners connect belief systems with environmental cycles.',
    illustration: '/created-illustrations/ideas/hs11-rituals-and-seasons-planner.svg'
  },
  {
    id: 'HS12',
    slug: 'hs12-water-and-settlement-lab',
    title: 'Water and Settlement Lab',
    summary: 'Geography models show how water and terrain shape settlement choices.',
    dataUsed: ['region', 'map location', 'timeline', 'materials', 'origin story', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Locate water sources around each settlement.' },
      { name: 'Better', detail: 'Test rainfall effects on farming and population.' },
      { name: 'Advanced', detail: 'Compare two sites with different terrain limits.' },
      { name: 'Mastery', detail: 'Recommend a settlement plan with justification.' }
    ],
    impact: 'Links geography and history in a way that is concrete and memorable.',
    illustration: '/created-illustrations/ideas/hs12-water-and-settlement-lab.svg'
  },
  {
    id: 'HS13',
    slug: 'hs13-craft-bench-challenge',
    title: 'Craft Bench Challenge',
    summary: 'Process games show how artifacts were made with real materials and tools.',
    dataUsed: ['materials', 'tools', 'methods', 'gallery images', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Choose the right raw materials for a simple object.' },
      { name: 'Better', detail: 'Follow tool steps in the correct order.' },
      { name: 'Advanced', detail: 'Adjust process for quality, speed, and waste.' },
      { name: 'Mastery', detail: 'Compare your method against historical evidence.' }
    ],
    impact: 'Builds sequencing and process-thinking through historical making.',
    illustration: '/created-illustrations/ideas/hs13-craft-bench-challenge.svg'
  },
  {
    id: 'HS14',
    slug: 'hs14-accessible-heritage-mapper',
    title: 'Accessible Heritage Mapper',
    summary: 'Inclusive path design teaches access planning while protecting heritage fabric.',
    dataUsed: ['site paths', 'maps', 'official images', 'construction limits', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Spot barriers on a guided visitor route.' },
      { name: 'Better', detail: 'Add ramps, signs, and rest points to improve access.' },
      { name: 'Advanced', detail: 'Balance inclusion upgrades with preservation constraints.' },
      { name: 'Mastery', detail: 'Deliver an inclusive route plan with priorities.' }
    ],
    impact: 'Develops empathy and practical design thinking in a heritage context.',
    illustration: '/created-illustrations/ideas/hs14-accessible-heritage-mapper.svg'
  },
  {
    id: 'HS15',
    slug: 'hs15-junior-curator-exhibit-maker',
    title: 'Junior Curator Exhibit Maker',
    summary: 'Students curate evidence into digital mini-museums for each site.',
    dataUsed: ['origin story', 'timeline events', 'gallery images', 'official visuals', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Pick five items and write one label each.' },
      { name: 'Better', detail: 'Arrange items into a clear chronology.' },
      { name: 'Advanced', detail: 'Add multimedia notes and brief quotations.' },
      { name: 'Mastery', detail: 'Publish a themed exhibit and review peers.' }
    ],
    impact: 'Builds storytelling clarity and evidence communication skills.',
    illustration: '/created-illustrations/ideas/hs15-junior-curator-exhibit-maker.svg'
  },
  {
    id: 'HS16',
    slug: 'hs16-history-mystery-escape',
    title: 'History Mystery Escape',
    summary: 'Evidence-chain puzzles turn site facts into collaborative mystery solving.',
    dataUsed: ['origin story', 'timeline events', 'map clues', 'materials', 'tools', 'source links'],
    progression: [
      { name: 'Starter', detail: 'Solve clue cards at one site location.' },
      { name: 'Better', detail: 'Decode inscriptions with timeline hints.' },
      { name: 'Advanced', detail: 'Connect clues across multiple site zones.' },
      { name: 'Mastery', detail: 'Present the final solution with full evidence chain.' }
    ],
    impact: 'Boosts collaboration, logic, and historical reasoning through play.',
    illustration: '/created-illustrations/ideas/hs16-history-mystery-escape.svg'
  }
];
