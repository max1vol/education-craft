import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('static/created-illustrations/ideas');

const IDEAS = [
  { id: 'HS01', slug: 'hs01-site-time-lapse-atlas', title: 'Site Time-Lapse Atlas', subtitle: 'Chronology + map layers', palette: ['#1f3b5f', '#2a6f97', '#61a5c2', '#89c2d9'], icon: 'atlas' },
  { id: 'HS02', slug: 'hs02-monument-builder-studio', title: 'Monument Builder Studio', subtitle: 'Materials + tools simulator', palette: ['#3c1642', '#6a0572', '#ab83a1', '#f8b195'], icon: 'builder' },
  { id: 'HS03', slug: 'hs03-artifact-detective-desk', title: 'Artifact Detective Desk', subtitle: 'Evidence puzzle desk', palette: ['#223127', '#3f784c', '#7fb069', '#d0f4de'], icon: 'detective' },
  { id: 'HS04', slug: 'hs04-fortress-defense-replay', title: 'Fortress Defense Replay', subtitle: 'Design vs attack simulation', palette: ['#2f1b25', '#5f0f40', '#9a031e', '#fb8b24'], icon: 'defense' },
  { id: 'HS05', slug: 'hs05-route-to-market', title: 'Route to Market', subtitle: 'Trade routes and decisions', palette: ['#1f2f16', '#365314', '#65a30d', '#bef264'], icon: 'route' },
  { id: 'HS06', slug: 'hs06-voices-at-the-site', title: 'Voices at the Site', subtitle: 'Storytelling with roles', palette: ['#0f172a', '#1e293b', '#334155', '#60a5fa'], icon: 'voices' },
  { id: 'HS07', slug: 'hs07-conservation-command', title: 'Conservation Command', subtitle: 'Protect and preserve', palette: ['#1b4332', '#2d6a4f', '#40916c', '#95d5b2'], icon: 'conservation' },
  { id: 'HS08', slug: 'hs08-fact-or-legend-lab', title: 'Fact or Legend Lab', subtitle: 'Claim checking workflow', palette: ['#3b0a45', '#6a0dad', '#9b5de5', '#f15bb5'], icon: 'factcheck' },
  { id: 'HS09', slug: 'hs09-excavation-grid-quest', title: 'Excavation Grid Quest', subtitle: 'Layer-by-layer digs', palette: ['#4b2e1e', '#7f4f24', '#b08968', '#ddb892'], icon: 'excavation' },
  { id: 'HS10', slug: 'hs10-then-and-now-lens', title: 'Then-and-Now Lens', subtitle: 'Past versus present views', palette: ['#14213d', '#1d3557', '#457b9d', '#a8dadc'], icon: 'compare' },
  { id: 'HS11', slug: 'hs11-rituals-and-seasons-planner', title: 'Rituals and Seasons Planner', subtitle: 'Calendar + sky events', palette: ['#3f1d38', '#7b2cbf', '#c77dff', '#f3c4fb'], icon: 'seasons' },
  { id: 'HS12', slug: 'hs12-water-and-settlement-lab', title: 'Water and Settlement Lab', subtitle: 'Geography and survival', palette: ['#0b3c49', '#145374', '#5588a3', '#9bd1e5'], icon: 'water' },
  { id: 'HS13', slug: 'hs13-craft-bench-challenge', title: 'Craft Bench Challenge', subtitle: 'Step-by-step making', palette: ['#3d2c2e', '#886f6f', '#b58b67', '#ffd8a8'], icon: 'craft' },
  { id: 'HS14', slug: 'hs14-accessible-heritage-mapper', title: 'Accessible Heritage Mapper', subtitle: 'Inclusive route planning', palette: ['#1d3557', '#2a9d8f', '#8ecae6', '#f1faee'], icon: 'access' },
  { id: 'HS15', slug: 'hs15-junior-curator-exhibit-maker', title: 'Junior Curator Exhibit Maker', subtitle: 'Create mini-museums', palette: ['#2f1c1e', '#7f5539', '#b08968', '#e6ccb2'], icon: 'curator' },
  { id: 'HS16', slug: 'hs16-history-mystery-escape', title: 'History Mystery Escape', subtitle: 'Evidence chain mystery', palette: ['#1f2041', '#4b3f72', '#7f7caf', '#d8d4f2'], icon: 'mystery' }
];

function esc(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function iconMarkup(type) {
  if (type === 'atlas') {
    return `
      <g transform="translate(980 235)">
        <circle cx="130" cy="170" r="98" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" stroke-width="6" />
        <path d="M48 170 H212" stroke="rgba(255,255,255,0.65)" stroke-width="6" stroke-linecap="round" />
        <path d="M130 72 V268" stroke="rgba(255,255,255,0.65)" stroke-width="6" stroke-linecap="round" />
        <path d="M130 90 C88 124 82 172 130 234 C178 172 172 124 130 90 Z" fill="rgba(255,255,255,0.82)" />
        <circle cx="130" cy="154" r="18" fill="${IDEAS[0].palette[0]}" />
      </g>`;
  }
  if (type === 'builder') {
    return `
      <g transform="translate(960 240)">
        <rect x="40" y="170" width="220" height="110" rx="10" fill="rgba(255,255,255,0.16)" />
        <rect x="70" y="135" width="70" height="35" rx="6" fill="rgba(255,255,255,0.72)" />
        <rect x="150" y="115" width="70" height="55" rx="6" fill="rgba(255,255,255,0.62)" />
        <rect x="100" y="80" width="70" height="35" rx="6" fill="rgba(255,255,255,0.52)" />
        <path d="M258 70 V210" stroke="rgba(255,255,255,0.72)" stroke-width="7" />
        <path d="M206 90 H300" stroke="rgba(255,255,255,0.72)" stroke-width="7" />
        <rect x="292" y="90" width="16" height="62" rx="4" fill="rgba(255,255,255,0.72)" />
      </g>`;
  }
  if (type === 'detective') {
    return `
      <g transform="translate(960 230)">
        <circle cx="110" cy="140" r="76" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="12" />
        <rect x="160" y="188" width="70" height="22" rx="11" transform="rotate(36 160 188)" fill="rgba(255,255,255,0.76)" />
        <path d="M240 80 L300 110 L280 190 L210 176 Z" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.72)" stroke-width="5" />
        <circle cx="110" cy="140" r="16" fill="rgba(255,255,255,0.76)" />
      </g>`;
  }
  if (type === 'defense') {
    return `
      <g transform="translate(955 228)">
        <path d="M30 215 H290 V265 H30 Z" fill="rgba(255,255,255,0.2)" />
        <rect x="60" y="115" width="52" height="100" rx="8" fill="rgba(255,255,255,0.74)" />
        <rect x="136" y="95" width="52" height="120" rx="8" fill="rgba(255,255,255,0.62)" />
        <rect x="212" y="115" width="52" height="100" rx="8" fill="rgba(255,255,255,0.5)" />
        <path d="M130 250 C130 215 170 205 170 175 C170 205 210 215 210 250 C210 275 188 292 170 300 C152 292 130 275 130 250 Z" fill="rgba(255,255,255,0.82)" />
      </g>`;
  }
  if (type === 'route') {
    return `
      <g transform="translate(955 236)">
        <path d="M24 230 C100 180 132 250 198 208 C236 186 254 116 312 114" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="8" stroke-dasharray="14 16" />
        <circle cx="30" cy="232" r="18" fill="rgba(255,255,255,0.68)" />
        <circle cx="310" cy="112" r="22" fill="rgba(255,255,255,0.78)" />
        <path d="M58 186 H130 V238 H58 Z" fill="rgba(255,255,255,0.16)" />
        <circle cx="74" cy="242" r="12" fill="rgba(255,255,255,0.52)" />
        <circle cx="116" cy="242" r="12" fill="rgba(255,255,255,0.52)" />
      </g>`;
  }
  if (type === 'voices') {
    return `
      <g transform="translate(950 224)">
        <rect x="36" y="82" width="126" height="90" rx="18" fill="rgba(255,255,255,0.68)" />
        <path d="M82 172 L96 204 L126 172 Z" fill="rgba(255,255,255,0.68)" />
        <rect x="168" y="122" width="148" height="110" rx="18" fill="rgba(255,255,255,0.42)" />
        <path d="M260 232 L280 264 L300 232 Z" fill="rgba(255,255,255,0.42)" />
        <path d="M70 112 Q88 84 106 112 T142 112" stroke="${IDEAS[5].palette[0]}" stroke-width="6" fill="none" />
        <path d="M202 160 Q228 120 254 160 T306 160" stroke="rgba(255,255,255,0.84)" stroke-width="6" fill="none" />
      </g>`;
  }
  if (type === 'conservation') {
    return `
      <g transform="translate(954 228)">
        <path d="M168 72 C220 72 260 104 260 164 C260 248 198 296 168 310 C138 296 76 248 76 164 C76 104 116 72 168 72 Z" fill="rgba(255,255,255,0.72)" />
        <path d="M168 110 C132 132 122 178 168 248 C214 178 204 132 168 110 Z" fill="${IDEAS[6].palette[1]}" />
        <path d="M58 248 L120 190 L168 222 L222 168 L278 222" fill="none" stroke="rgba(255,255,255,0.76)" stroke-width="8" stroke-linecap="round" />
      </g>`;
  }
  if (type === 'factcheck') {
    return `
      <g transform="translate(956 228)">
        <circle cx="118" cy="148" r="72" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="10" />
        <rect x="164" y="198" width="74" height="22" rx="11" transform="rotate(38 164 198)" fill="rgba(255,255,255,0.76)" />
        <path d="M270 96 L314 142 L270 188 L228 142 Z" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.72)" stroke-width="5" />
        <path d="M86 150 L110 172 L152 126" stroke="rgba(255,255,255,0.86)" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </g>`;
  }
  if (type === 'excavation') {
    return `
      <g transform="translate(952 228)">
        <rect x="34" y="88" width="280" height="196" rx="18" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.64)" stroke-width="6" />
        <path d="M34 144 H314 M34 200 H314 M104 88 V284 M174 88 V284 M244 88 V284" stroke="rgba(255,255,255,0.52)" stroke-width="4" />
        <path d="M86 70 L130 114 L114 130 L70 86 Z" fill="rgba(255,255,255,0.78)" />
        <rect x="56" y="100" width="18" height="108" rx="9" transform="rotate(-45 56 100)" fill="rgba(255,255,255,0.68)" />
      </g>`;
  }
  if (type === 'compare') {
    return `
      <g transform="translate(946 232)">
        <rect x="30" y="82" width="140" height="204" rx="14" fill="rgba(255,255,255,0.24)" />
        <rect x="178" y="82" width="140" height="204" rx="14" fill="rgba(255,255,255,0.58)" />
        <path d="M80 250 L98 210 L124 238 L154 186" stroke="rgba(255,255,255,0.8)" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M224 250 L242 198 L266 224 L298 158" stroke="${IDEAS[9].palette[0]}" stroke-width="8" fill="none" stroke-linecap="round" />
        <path d="M173 86 V286" stroke="rgba(255,255,255,0.84)" stroke-width="6" />
      </g>`;
  }
  if (type === 'seasons') {
    return `
      <g transform="translate(950 226)">
        <circle cx="108" cy="126" r="44" fill="rgba(255,227,118,0.88)" />
        <g fill="rgba(255,227,118,0.82)">
          <circle cx="108" cy="58" r="7" /><circle cx="108" cy="194" r="7" />
          <circle cx="40" cy="126" r="7" /><circle cx="176" cy="126" r="7" />
        </g>
        <path d="M214 98 C254 98 284 132 284 172 C284 212 254 246 214 246 C236 218 236 126 214 98 Z" fill="rgba(255,255,255,0.78)" />
        <rect x="58" y="214" width="236" height="76" rx="12" fill="rgba(255,255,255,0.32)" />
        <path d="M80 246 H272" stroke="rgba(255,255,255,0.84)" stroke-width="6" stroke-dasharray="10 10" />
      </g>`;
  }
  if (type === 'water') {
    return `
      <g transform="translate(948 228)">
        <path d="M160 84 C210 136 240 168 240 212 C240 260 204 294 160 294 C116 294 80 260 80 212 C80 168 110 136 160 84 Z" fill="rgba(255,255,255,0.76)" />
        <path d="M44 246 C88 210 124 262 160 228 C200 192 242 250 296 220" fill="none" stroke="${IDEAS[11].palette[0]}" stroke-width="8" stroke-linecap="round" />
        <path d="M58 272 C110 246 150 294 206 266 C236 252 260 262 294 248" fill="none" stroke="rgba(255,255,255,0.78)" stroke-width="6" stroke-linecap="round" />
      </g>`;
  }
  if (type === 'craft') {
    return `
      <g transform="translate(950 232)">
        <rect x="34" y="228" width="284" height="48" rx="8" fill="rgba(255,255,255,0.26)" />
        <path d="M72 114 L122 164 L100 186 L50 136 Z" fill="rgba(255,255,255,0.72)" />
        <rect x="102" y="126" width="144" height="18" rx="8" transform="rotate(45 102 126)" fill="rgba(255,255,255,0.62)" />
        <path d="M230 126 C268 126 292 150 292 186 C292 224 268 250 230 250 C190 250 168 224 168 186 C168 150 192 126 230 126 Z" fill="rgba(255,255,255,0.52)" />
      </g>`;
  }
  if (type === 'access') {
    return `
      <g transform="translate(952 226)">
        <path d="M34 276 C102 250 118 182 178 154 C220 134 244 100 314 86" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="10" stroke-linecap="round" />
        <circle cx="214" cy="174" r="20" fill="rgba(255,255,255,0.74)" />
        <circle cx="216" cy="124" r="16" fill="rgba(255,255,255,0.74)" />
        <path d="M216 140 L216 208 L258 208" stroke="rgba(255,255,255,0.78)" stroke-width="9" stroke-linecap="round" />
        <path d="M214 170 L182 186" stroke="rgba(255,255,255,0.78)" stroke-width="8" stroke-linecap="round" />
      </g>`;
  }
  if (type === 'curator') {
    return `
      <g transform="translate(950 228)">
        <rect x="30" y="78" width="286" height="218" rx="16" fill="rgba(255,255,255,0.18)" />
        <rect x="66" y="112" width="214" height="110" rx="10" fill="rgba(255,255,255,0.68)" />
        <rect x="86" y="236" width="82" height="32" rx="8" fill="rgba(255,255,255,0.5)" />
        <rect x="182" y="236" width="82" height="32" rx="8" fill="rgba(255,255,255,0.5)" />
        <path d="M92 198 L130 158 L154 178 L188 140 L250 198 Z" fill="none" stroke="${IDEAS[14].palette[0]}" stroke-width="8" stroke-linecap="round" />
      </g>`;
  }
  if (type === 'mystery') {
    return `
      <g transform="translate(948 228)">
        <rect x="68" y="148" width="188" height="136" rx="16" fill="rgba(255,255,255,0.62)" />
        <path d="M106 148 V118 C106 84 132 60 164 60 C196 60 222 84 222 118 V148" fill="none" stroke="rgba(255,255,255,0.84)" stroke-width="10" />
        <circle cx="164" cy="206" r="18" fill="${IDEAS[15].palette[0]}" />
        <rect x="156" y="222" width="16" height="38" rx="8" fill="${IDEAS[15].palette[0]}" />
        <path d="M278 120 C306 120 326 142 326 170 C326 198 306 220 278 220 C250 220 230 198 230 170 C230 142 250 120 278 120 Z" fill="none" stroke="rgba(255,255,255,0.72)" stroke-width="8" />
        <rect x="262" y="164" width="32" height="12" rx="6" fill="rgba(255,255,255,0.72)" />
      </g>`;
  }
  return '';
}

function cardSvg(idea) {
  const [c1, c2, c3, c4] = idea.palette;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-labelledby="${idea.id}-title ${idea.id}-desc">
  <title id="${idea.id}-title">${esc(idea.title)}</title>
  <desc id="${idea.id}-desc">Color concept card for ${esc(idea.title)}.</desc>
  <defs>
    <linearGradient id="${idea.id}-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="36%" stop-color="${c2}" />
      <stop offset="72%" stop-color="${c3}" />
      <stop offset="100%" stop-color="${c4}" />
    </linearGradient>
    <pattern id="${idea.id}-dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="2.3" fill="rgba(255,255,255,0.15)" />
      <circle cx="20" cy="18" r="1.8" fill="rgba(255,255,255,0.13)" />
      <circle cx="12" cy="12" r="1.2" fill="rgba(255,255,255,0.11)" />
    </pattern>
  </defs>

  <rect width="1600" height="900" fill="url(#${idea.id}-bg)" />
  <rect width="1600" height="900" fill="url(#${idea.id}-dots)" />
  <rect x="848" y="74" width="706" height="752" rx="42" fill="rgba(255,255,255,0.08)" />
  <circle cx="1240" cy="230" r="242" fill="rgba(255,255,255,0.08)" />
  <circle cx="1240" cy="230" r="176" fill="rgba(255,255,255,0.06)" />
  <ellipse cx="1180" cy="770" rx="360" ry="180" fill="rgba(255,255,255,0.09)" />
  <ellipse cx="320" cy="790" rx="420" ry="180" fill="rgba(0,0,0,0.14)" />

  <rect x="80" y="82" width="740" height="736" rx="28" fill="rgba(0,0,0,0.26)" />
  <rect x="94" y="96" width="712" height="708" rx="22" fill="rgba(255,255,255,0.09)" />

  <text x="132" y="176" fill="rgba(255,255,255,0.92)" font-family="Trebuchet MS, Segoe UI, Arial, sans-serif" font-size="52" font-weight="700">${esc(idea.id)}</text>
  <text x="132" y="262" fill="rgba(255,255,255,0.98)" font-family="Trebuchet MS, Segoe UI, Arial, sans-serif" font-size="66" font-weight="800">${esc(idea.title)}</text>
  <text x="132" y="330" fill="rgba(255,255,255,0.86)" font-family="Trebuchet MS, Segoe UI, Arial, sans-serif" font-size="38" font-weight="600">${esc(idea.subtitle)}</text>

  <g transform="translate(126 408)">
    <rect x="0" y="0" width="520" height="54" rx="12" fill="rgba(255,255,255,0.14)" />
    <text x="22" y="37" fill="rgba(255,255,255,0.92)" font-family="Trebuchet MS, Segoe UI, Arial, sans-serif" font-size="28" font-weight="700">Gradual Improvement Path</text>
    <g fill="rgba(255,255,255,0.86)" font-family="Trebuchet MS, Segoe UI, Arial, sans-serif" font-size="26" font-weight="700">
      <text x="0" y="118">01 Starter</text>
      <text x="0" y="168">02 Better</text>
      <text x="0" y="218">03 Advanced</text>
      <text x="0" y="268">04 Mastery</text>
    </g>
    <path d="M194 112 H468 M194 162 H468 M194 212 H468 M194 262 H468" stroke="rgba(255,255,255,0.58)" stroke-width="5" stroke-linecap="round" />
    <circle cx="194" cy="112" r="8" fill="rgba(255,255,255,0.94)" />
    <circle cx="194" cy="162" r="8" fill="rgba(255,255,255,0.94)" />
    <circle cx="194" cy="212" r="8" fill="rgba(255,255,255,0.94)" />
    <circle cx="194" cy="262" r="8" fill="rgba(255,255,255,0.94)" />
  </g>

  ${iconMarkup(idea.icon)}
</svg>
`;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const idea of IDEAS) {
  const svg = cardSvg(idea);
  fs.writeFileSync(path.join(OUTPUT_DIR, `${idea.slug}.svg`), svg, 'utf8');
}

console.log(`Generated ${IDEAS.length} idea illustrations in ${OUTPUT_DIR}`);
