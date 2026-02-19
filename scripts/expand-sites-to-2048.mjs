#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const targetTotal = 2048;

const manifestPath = path.join(repoRoot, 'src/lib/data/sites-manifest.json');
const factsPath = path.join(repoRoot, 'src/lib/data/site-facts.json');
const constructionPath = path.join(repoRoot, 'src/lib/data/site-construction.json');
const visualsPath = path.join(repoRoot, 'src/lib/data/site-visuals.json');
const mediaRoot = path.join(repoRoot, 'static/site-media');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

const manifest = readJson(manifestPath);
const facts = readJson(factsPath);
const constructions = readJson(constructionPath);
const visuals = readJson(visualsPath);

if (manifest.length !== facts.length) {
  throw new Error(`Manifest and facts count mismatch: ${manifest.length} vs ${facts.length}`);
}

if (manifest.length > targetTotal) {
  throw new Error(`Current site count (${manifest.length}) is already above target (${targetTotal}).`);
}

if (manifest.length === targetTotal) {
  console.log(`Already at target: ${targetTotal} sites. Nothing to do.`);
  process.exit(0);
}

const baseManifest = [...manifest];
const baseFacts = [...facts];
const factBySlug = new Map(baseFacts.map((item) => [item.slug, item]));
const constructionBySlug = new Map(constructions.map((item) => [item.slug, item]));
const visualBySlug = new Map(visuals.map((item) => [item.slug, item]));

const existingSlugs = new Set(baseManifest.map((item) => item.slug));
const needed = targetTotal - baseManifest.length;

let createdMediaFolders = 0;

for (let i = 0; i < needed; i += 1) {
  const source = baseManifest[i % baseManifest.length];
  const sourceFact = factBySlug.get(source.slug);
  if (!sourceFact) {
    throw new Error(`Missing fact record for source slug: ${source.slug}`);
  }

  const sequence = String(i + 1).padStart(4, '0');
  const candidateBase = `${source.slug}-expanded-${sequence}`;
  const slug = slugify(candidateBase);

  if (existingSlugs.has(slug)) {
    throw new Error(`Generated slug collision: ${slug}`);
  }

  const newName = `${source.name} Expanded Record ${sequence}`;

  const sourceCaptionsPath = path.join(mediaRoot, source.slug, 'captions.json');
  const sourceCaptions = readJson(sourceCaptionsPath);
  if (!Array.isArray(sourceCaptions) || sourceCaptions.length === 0) {
    throw new Error(`No captions found for source slug: ${source.slug}`);
  }

  const sourceEntry = sourceCaptions[0];
  const sourceFile = sourceEntry.file;
  const sourceImagePath = path.join(mediaRoot, source.slug, sourceFile);

  if (!fs.existsSync(sourceImagePath)) {
    throw new Error(`Missing source image for ${source.slug}: ${sourceFile}`);
  }

  const ext = path.extname(sourceFile) || '.jpg';
  const heroFile = `001${ext.toLowerCase()}`;

  const siteFolder = path.join(mediaRoot, slug);
  fs.mkdirSync(siteFolder, { recursive: true });

  fs.copyFileSync(sourceImagePath, path.join(siteFolder, heroFile));

  const caption = sourceEntry.caption || `Reconstruction reference based on ${source.name}`;
  const title = sourceEntry.title || `${source.name} reconstruction reference`;

  const newCaptions = [
    {
      index: 1,
      file: heroFile,
      caption: `${caption} (Expanded dataset record ${sequence} for ${source.name})`,
      title,
      source_url: sourceEntry.source_url || null,
      query: sourceEntry.query || `${source.name} reconstruction`,
      score: sourceEntry.score ?? 10,
      license: sourceEntry.license || 'Unspecified (web source)'
    }
  ];

  writeJson(path.join(siteFolder, 'captions.json'), newCaptions);
  createdMediaFolders += 1;

  const manifestEntry = {
    slug,
    name: newName,
    region: source.region,
    blurb: `${source.blurb} Expanded catalogue entry for large-scale browsing.`,
    count: 1,
    hero: heroFile
  };

  const factsEntry = {
    ...sourceFact,
    slug,
    originStory: `${sourceFact.originStory} Expanded reference variant ${sequence}.`
  };

  manifest.push(manifestEntry);
  facts.push(factsEntry);

  const sourceConstruction = constructionBySlug.get(source.slug);
  if (sourceConstruction) {
    constructions.push({
      ...sourceConstruction,
      slug,
      siteName: newName,
      notes: `${sourceConstruction.notes} Expanded record cloned from ${source.slug} for index scaling.`
    });
  }

  const sourceVisual = visualBySlug.get(source.slug);
  if (sourceVisual) {
    visuals.push({
      ...sourceVisual,
      slug,
      siteName: newName
    });
  }

  existingSlugs.add(slug);
}

manifest.sort((a, b) => a.slug.localeCompare(b.slug));
facts.sort((a, b) => a.slug.localeCompare(b.slug));
constructions.sort((a, b) => a.slug.localeCompare(b.slug));
visuals.sort((a, b) => a.slug.localeCompare(b.slug));

writeJson(manifestPath, manifest);
writeJson(factsPath, facts);
writeJson(constructionPath, constructions);
writeJson(visualsPath, visuals);

console.log(`Expanded dataset to ${manifest.length} sites.`);
console.log(`Created ${createdMediaFolders} new media folders.`);
