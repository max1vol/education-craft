<svelte:head>
  <title>Debug Render | Monument Realms</title>
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import { BIOMES, BIOME_BY_ID } from '$lib/data/monument-realms/biomes';
  import { BLOCKS, type BlockId } from '$lib/data/monument-realms/blocks';
  import { TEXTURE_FAMILIES } from '$lib/data/monument-realms/texture-pipeline';
  import { WORLD_MAX_Y, WORLD_MIN_Y } from '$lib/data/monument-realms/world';
  import { createWorldState, type DebugLayer } from '$lib/game/monument-realms/world-state';

  export let data: {
    biome: string;
    radius: number;
    sliceZOffset: number;
    layers: DebugLayer[];
  };

  const world = createWorldState();
  const ALL_LAYERS: DebugLayer[] = ['terrain', 'flora', 'monument', 'portal', 'special'];

  let selectedBiomeId = BIOME_BY_ID.has(data.biome) ? data.biome : BIOMES[0].id;
  let radius = data.radius;
  let sliceZOffset = data.sliceZOffset;
  let activeLayers = new Set<DebugLayer>(data.layers.length ? data.layers : ALL_LAYERS);
  let selectedTextureFamilyId = TEXTURE_FAMILIES[0].id;

  let topCanvas: HTMLCanvasElement;
  let sideCanvas: HTMLCanvasElement;
  let renderStats = {
    topCount: 0,
    sideCount: 0,
    portals: 0,
    special: 0
  };

  const sourceToLayer = (source: string): DebugLayer => (source === 'edit' ? 'terrain' : (source as DebugLayer));
  const layerEnabled = (source: string): boolean => activeLayers.has(sourceToLayer(source));
  $: selectedTextureFamily = TEXTURE_FAMILIES.find((family) => family.id === selectedTextureFamilyId) ?? TEXTURE_FAMILIES[0];

  const colorForBlock = (blockId: BlockId, y: number): string => {
    const base = BLOCKS[blockId]?.color ?? '#666';
    const hex = base.replace('#', '');
    const raw = Number.parseInt(hex.length === 3 ? hex.split('').map((s) => s + s).join('') : hex, 16);
    const r = (raw >> 16) & 255;
    const g = (raw >> 8) & 255;
    const b = raw & 255;
    const shade = Math.max(0.62, Math.min(1.18, 0.76 + y / WORLD_MAX_Y * 0.34));
    return `rgb(${Math.round(r * shade)}, ${Math.round(g * shade)}, ${Math.round(b * shade)})`;
  };

  const renderTopDown = (): void => {
    if (!topCanvas) return;
    const ctx = topCanvas.getContext('2d');
    if (!ctx) return;

    const biome = BIOME_BY_ID.get(selectedBiomeId) ?? BIOMES[0];
    const diameter = radius * 2 + 1;

    topCanvas.width = diameter;
    topCanvas.height = diameter;
    topCanvas.style.width = `${Math.min(720, diameter * 4)}px`;
    topCanvas.style.height = `${Math.min(720, diameter * 4)}px`;

    ctx.clearRect(0, 0, diameter, diameter);
    renderStats.topCount = 0;
    renderStats.portals = 0;
    renderStats.special = 0;

    for (let px = 0; px < diameter; px += 1) {
      const worldX = biome.center.x - radius + px;
      for (let pz = 0; pz < diameter; pz += 1) {
        const worldZ = biome.center.z - radius + pz;
        const top = world.getTopBlockForLayers(worldX, worldZ, activeLayers);
        if (!top) continue;

        ctx.fillStyle = colorForBlock(top.sample.type, top.y);
        ctx.fillRect(px, pz, 1, 1);

        renderStats.topCount += 1;
        if (top.sample.source === 'portal') renderStats.portals += 1;
        if (top.sample.source === 'special') renderStats.special += 1;
      }
    }
  };

  const renderSide = (): void => {
    if (!sideCanvas) return;
    const ctx = sideCanvas.getContext('2d');
    if (!ctx) return;

    const biome = BIOME_BY_ID.get(selectedBiomeId) ?? BIOMES[0];
    const width = radius * 2 + 1;
    const height = WORLD_MAX_Y - WORLD_MIN_Y + 1;
    const sliceZ = biome.center.z + sliceZOffset;

    sideCanvas.width = width;
    sideCanvas.height = height;
    sideCanvas.style.width = `${Math.min(720, width * 4)}px`;
    sideCanvas.style.height = `${Math.min(460, height * 4)}px`;

    ctx.clearRect(0, 0, width, height);
    renderStats.sideCount = 0;

    for (let px = 0; px < width; px += 1) {
      const worldX = biome.center.x - radius + px;
      for (let y = WORLD_MIN_Y; y <= WORLD_MAX_Y; y += 1) {
        const sample = world.getBlockSampleAt(worldX, y, sliceZ);
        if (!sample || !layerEnabled(sample.source)) continue;

        const py = height - 1 - y;
        ctx.fillStyle = colorForBlock(sample.type, y);
        ctx.fillRect(px, py, 1, 1);
        renderStats.sideCount += 1;
      }
    }
  };

  const rerender = (): void => {
    renderTopDown();
    renderSide();
  };

  const toggleLayer = (layer: DebugLayer): void => {
    const next = new Set(activeLayers);
    if (next.has(layer)) {
      next.delete(layer);
    } else {
      next.add(layer);
    }
    if (next.size === 0) {
      next.add('terrain');
    }
    activeLayers = next;
    rerender();
  };

  const useAllLayers = (): void => {
    activeLayers = new Set(ALL_LAYERS);
    rerender();
  };

  $: queryHref = `/debug-render?biome=${encodeURIComponent(selectedBiomeId)}&radius=${radius}&slice=${sliceZOffset}&layers=${[...activeLayers].join(',')}`;

  $: if (topCanvas && sideCanvas) {
    rerender();
  }

  onMount(() => {
    rerender();
  });
</script>

<main class="debug-page">
  <section class="panel controls">
    <h1>Debug Render</h1>
    <p>Orthographic top-down + side inspections for terrain, flora, monuments, portals, and special blocks.</p>

    <div class="row">
      <label>
        Biome
        <select bind:value={selectedBiomeId} on:change={rerender}>
          {#each BIOMES as biome}
            <option value={biome.id}>{biome.name}</option>
          {/each}
        </select>
      </label>

      <label>
        Radius
        <input type="range" min="20" max="128" step="2" bind:value={radius} on:input={rerender} />
        <span>{radius}</span>
      </label>

      <label>
        Side Slice Z Offset
        <input type="range" min="-128" max="128" step="1" bind:value={sliceZOffset} on:input={rerender} />
        <span>{sliceZOffset}</span>
      </label>
    </div>

    <div class="layer-row">
      {#each ALL_LAYERS as layer}
        <button class:active={activeLayers.has(layer)} on:click={() => toggleLayer(layer)}>{layer}</button>
      {/each}
      <button on:click={useAllLayers}>all</button>
    </div>

    <div class="meta">
      <p>Top voxels: {renderStats.topCount}</p>
      <p>Side voxels: {renderStats.sideCount}</p>
      <p>Portal cells: {renderStats.portals}</p>
      <p>Special cells: {renderStats.special}</p>
    </div>

    <p class="share">Permalink: <a href={queryHref}>{queryHref}</a></p>
  </section>

  <section class="panel texture-panel">
    <h2>Texture Candidate Comparison</h2>
    <p>Nano Banana conditioned candidates (3 per key family) with selected winner integration.</p>

    <label>
      Family
      <select bind:value={selectedTextureFamilyId}>
        {#each TEXTURE_FAMILIES as family}
          <option value={family.id}>{family.label}</option>
        {/each}
      </select>
    </label>

    <p class="family-meta">
      Blocks: {selectedTextureFamily.blockIds.join(', ')}<br />
      Reference inputs: {selectedTextureFamily.referenceInputs.join(', ')}
    </p>

    <div class="candidate-grid">
      {#each selectedTextureFamily.candidates as candidate, index}
        <figure class:winner={candidate === selectedTextureFamily.winner}>
          <img src={candidate} alt={`${selectedTextureFamily.label} candidate ${index + 1}`} loading="lazy" />
          <figcaption>Candidate {index + 1}</figcaption>
        </figure>
      {/each}
    </div>
  </section>

  <section class="panel render-grid">
    <article>
      <h2>Top-Down Orthographic</h2>
      <p>Center is selected monument biome; one pixel = one block column.</p>
      <canvas bind:this={topCanvas} aria-label="Top down debug render"></canvas>
    </article>

    <article>
      <h2>Side View</h2>
      <p>Slice plane cuts through selected biome at Z offset {sliceZOffset}.</p>
      <canvas bind:this={sideCanvas} aria-label="Side debug render"></canvas>
    </article>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: radial-gradient(circle at top, #1f2f40 0%, #0c1117 55%, #06080c 100%);
    color: #ecf3ff;
    font-family: 'Segoe UI', 'Trebuchet MS', sans-serif;
  }

  .debug-page {
    min-height: 100vh;
    padding: 1rem;
    display: grid;
    gap: 1rem;
  }

  .panel {
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(12, 21, 31, 0.78);
    backdrop-filter: blur(2px);
  }

  .controls {
    padding: 0.9rem;
    display: grid;
    gap: 0.7rem;
  }

  h1 {
    margin: 0;
    font-size: 1.2rem;
  }

  .controls p {
    margin: 0;
    color: #c9d8ed;
    font-size: 0.87rem;
  }

  .row {
    display: grid;
    gap: 0.7rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  label {
    display: grid;
    gap: 0.28rem;
    font-size: 0.76rem;
    color: #d7e7fa;
  }

  select,
  input[type='range'] {
    width: 100%;
  }

  .layer-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.36rem;
  }

  .layer-row button {
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 999px;
    background: rgba(50, 78, 112, 0.56);
    color: #d8e9fd;
    font: inherit;
    cursor: pointer;
    text-transform: capitalize;
    padding: 0.25rem 0.7rem;
  }

  .layer-row button.active {
    background: rgba(112, 165, 94, 0.72);
    color: #f4ffe8;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .meta p {
    margin: 0;
    padding: 0.22rem 0.5rem;
    border-radius: 999px;
    font-size: 0.72rem;
    background: rgba(255, 255, 255, 0.08);
  }

  .share {
    margin: 0;
    font-size: 0.74rem;
    color: #b8d2ed;
    word-break: break-all;
  }

  .share a {
    color: #dff4ff;
  }

  .texture-panel {
    padding: 0.9rem;
    display: grid;
    gap: 0.6rem;
  }

  .texture-panel h2 {
    margin: 0;
    font-size: 1rem;
  }

  .texture-panel p {
    margin: 0;
    font-size: 0.75rem;
    color: #c6daef;
  }

  .family-meta {
    line-height: 1.4;
  }

  .candidate-grid {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  figure {
    margin: 0;
    padding: 0.38rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(5, 9, 13, 0.55);
    display: grid;
    gap: 0.24rem;
  }

  figure.winner {
    border-color: rgba(182, 255, 112, 0.75);
    box-shadow: 0 0 0 1px rgba(182, 255, 112, 0.25) inset;
  }

  figure img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 6px;
  }

  figcaption {
    font-size: 0.69rem;
    color: #d9ebff;
    text-align: center;
  }

  .render-grid {
    padding: 0.9rem;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  article {
    display: grid;
    gap: 0.35rem;
  }

  article h2 {
    margin: 0;
    font-size: 0.95rem;
  }

  article p {
    margin: 0;
    font-size: 0.72rem;
    color: #bed1e8;
  }

  canvas {
    image-rendering: pixelated;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: #03070d;
  }

  @media (max-width: 960px) {
    .row,
    .render-grid,
    .candidate-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
