import type { SiteConstruction, SiteSummary, TimelineEvent } from '$lib/data/sites';
import { siteFeatureIdeas } from '$lib/data/site-feature-ideas';

export type BlueprintStage = 'Starter' | 'Better' | 'Advanced' | 'Mastery';

export type BlueprintExample = {
  stage: BlueprintStage;
  title: string;
  activity: string;
  factsUsed: string[];
  outcome: string;
};

export type SiteBlueprintExamples = {
  ideaId: string;
  ideaSlug: string;
  ideaTitle: string;
  ideaSummary: string;
  ideaIllustration: string;
  examples: BlueprintExample[];
};

type Context = {
  site: SiteSummary;
  construction: SiteConstruction | null;
  events: TimelineEvent[];
  materials: string[];
  tools: string[];
  methods: string[];
  sources: string[];
  keyEvents: string[];
  keyMaterials: string;
  keyTools: string;
  keyMethods: string;
  sourceRef: string;
};

function yearLabel(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  if (year === 0) return '0 CE';
  return `${year} CE`;
}

function listPhrase(values: string[], fallback: string, maxItems = 3): string {
  const picked = values.filter(Boolean).slice(0, maxItems);
  if (!picked.length) return fallback;
  if (picked.length === 1) return picked[0];
  if (picked.length === 2) return `${picked[0]} and ${picked[1]}`;
  return `${picked.slice(0, -1).join(', ')}, and ${picked[picked.length - 1]}`;
}

function buildContext(site: SiteSummary, construction: SiteConstruction | null, events: TimelineEvent[]): Context {
  const materials = construction?.materials?.length ? construction.materials : ['local stone'];
  const tools = construction?.constructionTools?.length ? construction.constructionTools : ['simple hand tools'];
  const methods = construction?.constructionMethods?.length ? construction.constructionMethods : ['phased monument building'];
  const sources = construction?.sources?.map((source) => source.title).filter(Boolean) ?? [];
  const keyEvents = events.map((event) => `${yearLabel(event.year)} ${event.title}`);

  return {
    site,
    construction,
    events,
    materials,
    tools,
    methods,
    sources,
    keyEvents,
    keyMaterials: listPhrase(materials, 'local stone'),
    keyTools: listPhrase(tools, 'simple hand tools'),
    keyMethods: listPhrase(methods, 'phased monument building'),
    sourceRef: sources[0] ?? 'Construction Data Sources'
  };
}

function defaultExamples(ctx: Context): BlueprintExample[] {
  return [
    {
      stage: 'Starter',
      title: `Spotlight facts for ${ctx.site.name}`,
      activity: `Pick four key facts from ${ctx.site.name}: one origin fact, one timeline fact, one material fact, and one tool fact.`,
      factsUsed: [
        `Origin: ${ctx.site.originStory}`,
        `Materials: ${ctx.keyMaterials}`,
        `Tools: ${ctx.keyTools}`
      ],
      outcome: 'Learners organise core information into clear categories.'
    },
    {
      stage: 'Better',
      title: `Compare periods at ${ctx.site.name}`,
      activity: `Use ${ctx.keyEvents[0] ?? 'an origin event'} and ${ctx.keyEvents[1] ?? 'a turning point'} to compare what changed at the site.`,
      factsUsed: [
        `Timeline: ${ctx.keyEvents.slice(0, 2).join(' | ')}`,
        `Methods: ${ctx.keyMethods}`
      ],
      outcome: 'Learners explain continuity and change with evidence.'
    },
    {
      stage: 'Advanced',
      title: `Evidence check for ${ctx.site.name}`,
      activity: `Build a short claim about ${ctx.site.name} and verify it against ${ctx.sourceRef}.`,
      factsUsed: [
        `Source: ${ctx.sourceRef}`,
        `Methods: ${ctx.keyMethods}`
      ],
      outcome: 'Learners practice claim-and-evidence reasoning.'
    },
    {
      stage: 'Mastery',
      title: `Teach-back mini lesson: ${ctx.site.name}`,
      activity: `Create a 2-minute teach-back that links origin, timeline, materials, tools, and one source.`,
      factsUsed: [
        `Origin: ${ctx.site.originStory}`,
        `Timeline: ${ctx.keyEvents.slice(0, 3).join(' | ')}`,
        `Source: ${ctx.sourceRef}`
      ],
      outcome: 'Learners synthesise multiple fact types into one coherent explanation.'
    }
  ];
}

function buildIdeaExamples(ideaId: string, ctx: Context): BlueprintExample[] {
  switch (ideaId) {
    case 'HS01':
      return [
        {
          stage: 'Starter',
          title: `Two-point timeline map for ${ctx.site.name}`,
          activity: `Plot ${ctx.keyEvents[0] ?? 'the origin event'} and ${ctx.keyEvents[1] ?? 'a major event'} on a map card and label what changed.`,
          factsUsed: [
            `Region: ${ctx.site.region}`,
            `Timeline: ${ctx.keyEvents.slice(0, 2).join(' | ')}`
          ],
          outcome: 'Learners connect chronology with place.'
        },
        {
          stage: 'Better',
          title: `Three-layer era slider`,
          activity: `Add a third point (${ctx.keyEvents[2] ?? 'transition'}) and annotate one visual clue for each period.`,
          factsUsed: [
            `Events: ${ctx.keyEvents.slice(0, 3).join(' | ')}`,
            `Idea: ${ctx.site.idea}`
          ],
          outcome: 'Learners identify visible changes across periods.'
        },
        {
          stage: 'Advanced',
          title: `Cause-and-effect map notes`,
          activity: `Write map notes that explain how ${ctx.keyEvents[1] ?? 'the turning event'} influenced site use by ${ctx.keyEvents[2] ?? 'the transition'}.`,
          factsUsed: [
            `Timeline events: ${ctx.keyEvents.slice(1, 3).join(' | ')}`,
            `Methods: ${ctx.keyMethods}`
          ],
          outcome: 'Learners infer historical causes using evidence.'
        },
        {
          stage: 'Mastery',
          title: `Narrated atlas trail`,
          activity: `Record a narrated map trail for ${ctx.site.name} with at least one citation from ${ctx.sourceRef}.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Timeline: ${ctx.keyEvents.slice(0, 4).join(' | ')}`
          ],
          outcome: 'Learners present an evidence-backed timeline narrative.'
        }
      ];

    case 'HS02':
      return [
        {
          stage: 'Starter',
          title: `Basic footprint build`,
          activity: `Recreate a simple footprint for ${ctx.site.name} and label its main function.`,
          factsUsed: [
            `Idea: ${ctx.site.idea}`,
            `Epoch: ${ctx.site.epoch}`
          ],
          outcome: 'Learners understand purpose before detail.'
        },
        {
          stage: 'Better',
          title: `Material and tool selection`,
          activity: `Choose from ${ctx.keyMaterials} and ${ctx.keyTools} to build a stronger reconstruction model.`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Tools: ${ctx.keyTools}`
          ],
          outcome: 'Learners link construction choices to historical evidence.'
        },
        {
          stage: 'Advanced',
          title: `Constraint challenge`,
          activity: `Complete a build under constraints: keep to documented methods (${ctx.keyMethods}) and explain one trade-off.`,
          factsUsed: [
            `Methods: ${ctx.keyMethods}`,
            `Timeline: ${ctx.keyEvents[1] ?? 'peak era'}`
          ],
          outcome: 'Learners reason through engineering trade-offs.'
        },
        {
          stage: 'Mastery',
          title: `Defended build plan`,
          activity: `Present a final build plan for ${ctx.site.name} with source-based justification from ${ctx.sourceRef}.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Materials and tools: ${ctx.keyMaterials}; ${ctx.keyTools}`
          ],
          outcome: 'Learners defend design decisions with evidence.'
        }
      ];

    case 'HS03':
      return [
        {
          stage: 'Starter',
          title: `Quick artifact match`,
          activity: `Match four reconstruction visuals from ${ctx.site.name} to the correct timeline stage.`,
          factsUsed: [
            `Timeline: ${ctx.keyEvents.slice(0, 4).join(' | ')}`,
            `Gallery context: ${ctx.site.count} images`
          ],
          outcome: 'Learners connect artifacts with time periods.'
        },
        {
          stage: 'Better',
          title: `Material clue sorting`,
          activity: `Sort object cards by likely material groups such as ${ctx.keyMaterials}.`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Methods: ${ctx.keyMethods}`
          ],
          outcome: 'Learners infer object context from material evidence.'
        },
        {
          stage: 'Advanced',
          title: `Evidence card writing`,
          activity: `For each selected object, write one evidence card citing a timeline event and one source.`,
          factsUsed: [
            `Events: ${ctx.keyEvents.slice(0, 3).join(' | ')}`,
            `Source: ${ctx.sourceRef}`
          ],
          outcome: 'Learners justify placements instead of guessing.'
        },
        {
          stage: 'Mastery',
          title: `Case file closure`,
          activity: `Submit a full case file for ${ctx.site.name} with claims, evidence, and confidence level.`,
          factsUsed: [
            `Origin: ${ctx.site.originStory}`,
            `Source: ${ctx.sourceRef}`
          ],
          outcome: 'Learners produce structured, evidence-based conclusions.'
        }
      ];

    case 'HS04':
      return [
        {
          stage: 'Starter',
          title: `Vulnerability scan`,
          activity: `Mark two vulnerable points in a simplified map of ${ctx.site.name} and explain why.`,
          factsUsed: [
            `Region: ${ctx.site.region}`,
            `Idea: ${ctx.site.idea}`
          ],
          outcome: 'Learners read site design critically.'
        },
        {
          stage: 'Better',
          title: `Defense option test`,
          activity: `Test two defense setups that rely on ${ctx.keyMaterials} and compare likely outcomes.`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Methods: ${ctx.keyMethods}`
          ],
          outcome: 'Learners compare design outcomes with evidence.'
        },
        {
          stage: 'Advanced',
          title: `Time-shift scenario`,
          activity: `Run one scenario at ${ctx.keyEvents[1] ?? 'peak era'} and another at ${ctx.keyEvents[2] ?? 'transition'} to observe differences.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(1, 3).join(' | ')}`],
          outcome: 'Learners model how context changes strategy.'
        },
        {
          stage: 'Mastery',
          title: `Strategic debrief`,
          activity: `Write a strategic debrief for ${ctx.site.name} and cite ${ctx.sourceRef} for evidence.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Timeline and methods: ${ctx.keyEvents[1] ?? 'peak'}; ${ctx.keyMethods}`
          ],
          outcome: 'Learners support strategic conclusions with factual references.'
        }
      ];

    case 'HS05':
      return [
        {
          stage: 'Starter',
          title: `Internal supply route`,
          activity: `Design a short route that moves ${ctx.keyMaterials} from source area to build area at ${ctx.site.name}.`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Region: ${ctx.site.region}`
          ],
          outcome: 'Learners relate logistics to construction.'
        },
        {
          stage: 'Better',
          title: `Transport tool comparison`,
          activity: `Compare two transport options based on documented tools (${ctx.keyTools}).`,
          factsUsed: [`Tools: ${ctx.keyTools}`],
          outcome: 'Learners choose routes using evidence-based constraints.'
        },
        {
          stage: 'Advanced',
          title: `Season and risk planning`,
          activity: `Add a disruption scenario tied to ${ctx.keyEvents[2] ?? 'site transition'} and revise the route plan.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(1, 3).join(' | ')}`],
          outcome: 'Learners adapt plans under changing conditions.'
        },
        {
          stage: 'Mastery',
          title: `Optimised delivery plan`,
          activity: `Present a final logistics plan and explain why it best supports ${ctx.site.idea} at ${ctx.site.name}.`,
          factsUsed: [
            `Idea: ${ctx.site.idea}`,
            `Methods and tools: ${ctx.keyMethods}; ${ctx.keyTools}`
          ],
          outcome: 'Learners justify optimisation decisions with multiple fact types.'
        }
      ];

    case 'HS06':
      return [
        {
          stage: 'Starter',
          title: `Single role voice card`,
          activity: `Write a short monologue from one worker at ${ctx.site.name} using origin and material facts.`,
          factsUsed: [
            `Origin: ${ctx.site.originStory}`,
            `Materials: ${ctx.keyMaterials}`
          ],
          outcome: 'Learners turn facts into historically grounded voice.'
        },
        {
          stage: 'Better',
          title: `Three-role sequence`,
          activity: `Sequence three voices across ${ctx.keyEvents.slice(0, 3).join(' | ')}.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(0, 3).join(' | ')}`],
          outcome: 'Learners structure narrative across time.'
        },
        {
          stage: 'Advanced',
          title: `Evidence-anchored narration`,
          activity: `Record narration and include explicit reference to ${ctx.sourceRef} in one segment.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Tools and methods: ${ctx.keyTools}; ${ctx.keyMethods}`
          ],
          outcome: 'Learners embed citations in storytelling.'
        },
        {
          stage: 'Mastery',
          title: `Mini audio tour`,
          activity: `Publish a 4-stop audio tour for ${ctx.site.name}, one stop per timeline phase.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(0, 4).join(' | ')}`],
          outcome: 'Learners create coherent, evidence-rich historical narration.'
        }
      ];

    case 'HS07':
      return [
        {
          stage: 'Starter',
          title: `Condition spotting`,
          activity: `Use site visuals to identify three fragile elements at ${ctx.site.name}.`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Timeline transition: ${ctx.keyEvents[2] ?? 'transition'}`
          ],
          outcome: 'Learners notice preservation risks.'
        },
        {
          stage: 'Better',
          title: `Repair material choice`,
          activity: `Select repair-compatible options based on documented materials (${ctx.keyMaterials}).`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Methods: ${ctx.keyMethods}`
          ],
          outcome: 'Learners use historical constraints in conservation choices.'
        },
        {
          stage: 'Advanced',
          title: `Yearly care schedule`,
          activity: `Draft a yearly conservation schedule aligned with the site context and tools (${ctx.keyTools}).`,
          factsUsed: [`Tools: ${ctx.keyTools}`, `Source: ${ctx.sourceRef}`],
          outcome: 'Learners plan practical maintenance cycles.'
        },
        {
          stage: 'Mastery',
          title: `Conservation pitch`,
          activity: `Pitch a preservation plan for ${ctx.site.name} with a cited evidence chain.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Origin and events: ${ctx.keyEvents.slice(0, 3).join(' | ')}`
          ],
          outcome: 'Learners defend heritage-protection priorities.'
        }
      ];

    case 'HS08':
      return [
        {
          stage: 'Starter',
          title: `Fact, legend, or opinion`,
          activity: `Classify six statements about ${ctx.site.name} as fact, legend, or opinion.`,
          factsUsed: [
            `Origin: ${ctx.site.originStory}`,
            `Timeline: ${ctx.keyEvents.slice(0, 2).join(' | ')}`
          ],
          outcome: 'Learners distinguish claim types.'
        },
        {
          stage: 'Better',
          title: `Two-source verification`,
          activity: `Choose one claim and verify it using ${ctx.sourceRef} plus one timeline fact.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Event: ${ctx.keyEvents[1] ?? 'key event'}`
          ],
          outcome: 'Learners practice direct evidence checks.'
        },
        {
          stage: 'Advanced',
          title: `Reliability scoring`,
          activity: `Rate claim reliability (1-5) and justify with material and method evidence (${ctx.keyMaterials}; ${ctx.keyMethods}).`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Methods: ${ctx.keyMethods}`
          ],
          outcome: 'Learners evaluate source strength, not just content.'
        },
        {
          stage: 'Mastery',
          title: `Final verdict brief`,
          activity: `Write a final verdict paragraph for one debated claim about ${ctx.site.name} with citations.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Timeline: ${ctx.keyEvents.slice(0, 3).join(' | ')}`
          ],
          outcome: 'Learners produce concise, cited argumentation.'
        }
      ];

    case 'HS09':
      return [
        {
          stage: 'Starter',
          title: `Single-square dig`,
          activity: `Simulate one dig square for ${ctx.site.name} and record discovered layer notes.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(0, 2).join(' | ')}`],
          outcome: 'Learners adopt archaeological recording habits.'
        },
        {
          stage: 'Better',
          title: `Layer classification`,
          activity: `Assign finds to early, peak, and transition layers using ${ctx.keyMaterials}.`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Events: ${ctx.keyEvents.slice(0, 3).join(' | ')}`
          ],
          outcome: 'Learners connect materials with chronology.'
        },
        {
          stage: 'Advanced',
          title: `Tool impact trial`,
          activity: `Run two excavations using different tool sets (${ctx.keyTools}) and compare preservation outcomes.`,
          factsUsed: [`Tools: ${ctx.keyTools}`],
          outcome: 'Learners see how methods alter evidence quality.'
        },
        {
          stage: 'Mastery',
          title: `Site dig report`,
          activity: `Produce a complete dig report for ${ctx.site.name} with evidence links to ${ctx.sourceRef}.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Timeline and methods: ${ctx.keyEvents.slice(0, 4).join(' | ')}; ${ctx.keyMethods}`
          ],
          outcome: 'Learners synthesize field notes into a structured conclusion.'
        }
      ];

    case 'HS10':
      return [
        {
          stage: 'Starter',
          title: `Past-present image pairing`,
          activity: `Pair two historical visuals with two current visuals for ${ctx.site.name}.`,
          factsUsed: [
            `Gallery coverage: ${ctx.site.count} images`,
            `Timeline: ${ctx.keyEvents[0] ?? 'origin'}`
          ],
          outcome: 'Learners identify visual continuity and change.'
        },
        {
          stage: 'Better',
          title: `Annotated overlay`,
          activity: `Annotate three visible differences and link each one to a timeline event.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(1, 4).join(' | ')}`],
          outcome: 'Learners tie observations to historical phases.'
        },
        {
          stage: 'Advanced',
          title: `Cause explanation cards`,
          activity: `Explain one likely cause for each major visible change using method/material evidence.`,
          factsUsed: [
            `Methods: ${ctx.keyMethods}`,
            `Materials: ${ctx.keyMaterials}`
          ],
          outcome: 'Learners justify interpretation with construction evidence.'
        },
        {
          stage: 'Mastery',
          title: `Then-and-now exhibit panel`,
          activity: `Build a mini exhibit panel for ${ctx.site.name} with citations to ${ctx.sourceRef}.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Events: ${ctx.keyEvents.slice(0, 4).join(' | ')}`
          ],
          outcome: 'Learners communicate evidence clearly in exhibition format.'
        }
      ];

    case 'HS11':
      return [
        {
          stage: 'Starter',
          title: `Event calendar placement`,
          activity: `Place the four main events of ${ctx.site.name} on an annual classroom calendar strip.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(0, 4).join(' | ')}`],
          outcome: 'Learners practice chronological ordering.'
        },
        {
          stage: 'Better',
          title: `Ritual timing link`,
          activity: `Link one ritual or ceremonial activity at ${ctx.site.name} to a season and explain why.`,
          factsUsed: [
            `Culture: ${ctx.site.culture}`,
            `Idea: ${ctx.site.idea}`
          ],
          outcome: 'Learners connect belief practice with timing.'
        },
        {
          stage: 'Advanced',
          title: `Period comparison planner`,
          activity: `Compare how site use shifted between ${ctx.keyEvents[1] ?? 'peak'} and ${ctx.keyEvents[2] ?? 'transition'}.`,
          factsUsed: [`Events: ${ctx.keyEvents.slice(1, 3).join(' | ')}`],
          outcome: 'Learners reason about ritual continuity and change.'
        },
        {
          stage: 'Mastery',
          title: `Evidence-backed festival plan`,
          activity: `Design a festival timeline for ${ctx.site.name} and cite ${ctx.sourceRef} for at least one planning decision.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Timeline and culture: ${ctx.keyEvents[0] ?? 'origin'}; ${ctx.site.culture}`
          ],
          outcome: 'Learners integrate culture, chronology, and evidence.'
        }
      ];

    case 'HS12':
      return [
        {
          stage: 'Starter',
          title: `Settlement essentials map`,
          activity: `Identify key settlement needs for ${ctx.site.name} in ${ctx.site.region} and map them.`,
          factsUsed: [
            `Region: ${ctx.site.region}`,
            `Origin: ${ctx.site.originStory}`
          ],
          outcome: 'Learners connect geography with settlement choice.'
        },
        {
          stage: 'Better',
          title: `Resource stress scenario`,
          activity: `Run a dry-year scenario and decide which activities at ${ctx.site.name} are most affected.`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Methods: ${ctx.keyMethods}`
          ],
          outcome: 'Learners reason about environmental pressure.'
        },
        {
          stage: 'Advanced',
          title: `Cross-site comparison`,
          activity: `Compare ${ctx.site.name} with another site from the same epoch and note one geography-driven difference.`,
          factsUsed: [
            `Epoch: ${ctx.site.epoch}`,
            `Idea: ${ctx.site.idea}`
          ],
          outcome: 'Learners use comparison to deepen interpretation.'
        },
        {
          stage: 'Mastery',
          title: `Settlement recommendation brief`,
          activity: `Produce a recommendation brief for where and how to sustain ${ctx.site.name} long term.`,
          factsUsed: [
            `Timeline: ${ctx.keyEvents.slice(0, 3).join(' | ')}`,
            `Construction evidence: ${ctx.keyMethods}`
          ],
          outcome: 'Learners synthesize environmental and historical evidence.'
        }
      ];

    case 'HS13':
      return [
        {
          stage: 'Starter',
          title: `Material pick challenge`,
          activity: `Select the best material set for a simple classroom artifact inspired by ${ctx.site.name}.`,
          factsUsed: [`Materials: ${ctx.keyMaterials}`],
          outcome: 'Learners match objects to plausible raw materials.'
        },
        {
          stage: 'Better',
          title: `Tool sequence drill`,
          activity: `Arrange tool cards (${ctx.keyTools}) into a realistic making sequence.`,
          factsUsed: [
            `Tools: ${ctx.keyTools}`,
            `Methods: ${ctx.keyMethods}`
          ],
          outcome: 'Learners understand step order in historical making.'
        },
        {
          stage: 'Advanced',
          title: `Quality-speed tradeoff`,
          activity: `Complete the same craft twice: once for speed and once for precision, then compare results.`,
          factsUsed: [
            `Methods: ${ctx.keyMethods}`,
            `Timeline context: ${ctx.keyEvents[1] ?? 'peak phase'}`
          ],
          outcome: 'Learners evaluate trade-offs in production decisions.'
        },
        {
          stage: 'Mastery',
          title: `Craft process log`,
          activity: `Document the full craft workflow for ${ctx.site.name} with one evidence citation from ${ctx.sourceRef}.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Materials and tools: ${ctx.keyMaterials}; ${ctx.keyTools}`
          ],
          outcome: 'Learners defend process choices with references.'
        }
      ];

    case 'HS14':
      return [
        {
          stage: 'Starter',
          title: `Barrier spotting walk`,
          activity: `Identify accessibility barriers in a visual walkthrough of ${ctx.site.name}.`,
          factsUsed: [
            `Site context: ${ctx.site.region} / ${ctx.site.epoch}`,
            `Gallery: ${ctx.site.count} images`
          ],
          outcome: 'Learners recognize inclusion challenges.'
        },
        {
          stage: 'Better',
          title: `Accessible route draft`,
          activity: `Draft a route linking origin panel, gallery, and tools section with inclusive wayfinding.`,
          factsUsed: [
            `Core info blocks: origin, timeline, materials/tools`,
            `Idea: ${ctx.site.idea}`
          ],
          outcome: 'Learners design inclusive user journeys.'
        },
        {
          stage: 'Advanced',
          title: `Preservation-aware upgrades`,
          activity: `Revise the route to avoid fragile features tied to ${ctx.keyMaterials}.`,
          factsUsed: [
            `Materials: ${ctx.keyMaterials}`,
            `Transition event: ${ctx.keyEvents[2] ?? 'site transition'}`
          ],
          outcome: 'Learners balance access and conservation.'
        },
        {
          stage: 'Mastery',
          title: `Inclusive map proposal`,
          activity: `Submit an inclusive route proposal for ${ctx.site.name} with one cited decision from ${ctx.sourceRef}.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Timeline and context: ${ctx.keyEvents.slice(0, 3).join(' | ')}`
          ],
          outcome: 'Learners justify inclusive design with evidence.'
        }
      ];

    case 'HS15':
      return [
        {
          stage: 'Starter',
          title: `Five-item selection`,
          activity: `Pick five visuals from ${ctx.site.name} and write one-line labels.`,
          factsUsed: [
            `Gallery: ${ctx.site.count} images`,
            `Idea: ${ctx.site.idea}`
          ],
          outcome: 'Learners practice concise factual labeling.'
        },
        {
          stage: 'Better',
          title: `Chronology wall`,
          activity: `Arrange selected items into a mini timeline from ${ctx.keyEvents[0] ?? 'origin'} to ${ctx.keyEvents[3] ?? 'rediscovery'}.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(0, 4).join(' | ')}`],
          outcome: 'Learners create coherent chronological stories.'
        },
        {
          stage: 'Advanced',
          title: `Curator commentary`,
          activity: `Add two curator notes that explain methods (${ctx.keyMethods}) and material evidence (${ctx.keyMaterials}).`,
          factsUsed: [
            `Methods: ${ctx.keyMethods}`,
            `Materials: ${ctx.keyMaterials}`
          ],
          outcome: 'Learners connect objects to construction context.'
        },
        {
          stage: 'Mastery',
          title: `Published mini exhibit`,
          activity: `Publish a themed exhibit for ${ctx.site.name} and cite ${ctx.sourceRef} in your closing panel.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Origin and timeline: ${ctx.site.originStory}; ${ctx.keyEvents.slice(0, 3).join(' | ')}`
          ],
          outcome: 'Learners deliver polished, source-aware curation.'
        }
      ];

    case 'HS16':
      return [
        {
          stage: 'Starter',
          title: `Single clue unlock`,
          activity: `Solve one clue about ${ctx.site.name} by combining origin and material hints.`,
          factsUsed: [
            `Origin: ${ctx.site.originStory}`,
            `Materials: ${ctx.keyMaterials}`
          ],
          outcome: 'Learners combine multiple clues for a first solution.'
        },
        {
          stage: 'Better',
          title: `Timeline code puzzle`,
          activity: `Use years from ${ctx.keyEvents.slice(0, 3).join(' | ')} to crack a simple code.`,
          factsUsed: [`Timeline: ${ctx.keyEvents.slice(0, 3).join(' | ')}`],
          outcome: 'Learners apply chronological data in a puzzle context.'
        },
        {
          stage: 'Advanced',
          title: `Multi-room evidence chain`,
          activity: `Link four clues across map, materials, tools, and events for ${ctx.site.name}.`,
          factsUsed: [
            `Materials and tools: ${ctx.keyMaterials}; ${ctx.keyTools}`,
            `Events: ${ctx.keyEvents.slice(1, 4).join(' | ')}`
          ],
          outcome: 'Learners practice structured multi-step reasoning.'
        },
        {
          stage: 'Mastery',
          title: `Final case reveal`,
          activity: `Present the full mystery solution with citations from ${ctx.sourceRef} and timeline evidence.`,
          factsUsed: [
            `Source: ${ctx.sourceRef}`,
            `Timeline: ${ctx.keyEvents.slice(0, 4).join(' | ')}`
          ],
          outcome: 'Learners justify the final answer with a complete evidence chain.'
        }
      ];

    default:
      return defaultExamples(ctx);
  }
}

export function getBlueprintExamplesForSite(
  site: SiteSummary,
  construction: SiteConstruction | null,
  events: TimelineEvent[]
): SiteBlueprintExamples[] {
  const ctx = buildContext(site, construction, events);

  return siteFeatureIdeas.map((idea) => ({
    ideaId: idea.id,
    ideaSlug: idea.slug,
    ideaTitle: idea.title,
    ideaSummary: idea.summary,
    ideaIllustration: idea.illustration,
    examples: buildIdeaExamples(idea.id, ctx)
  }));
}
