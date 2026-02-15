<svelte:head>
  <title>Prehistoric Monument Craft</title>
</svelte:head>

<script>
  const rows = 8;
  const cols = 12;

  const tileCatalog = {
    grass: { name: 'Grass', icon: '🟩', destroyable: true, prehistoric: false },
    tree: { name: 'Tree', icon: '🌲', destroyable: true, prehistoric: false },
    stone: { name: 'Stone', icon: '🪨', destroyable: true, prehistoric: false },
    water: { name: 'Water', icon: '🟦', destroyable: true, prehistoric: false },
    stonehenge: { name: 'Stonehenge', icon: '🗿', destroyable: false, prehistoric: true },
    woodhenge: { name: 'Woodhenge', icon: '🪵', destroyable: false, prehistoric: true },
    avebury: { name: 'Avebury Circle', icon: '⭕', destroyable: false, prehistoric: true },
    skara_brae: { name: 'Skara Brae', icon: '🏚️', destroyable: false, prehistoric: true },
    silbury_hill: { name: 'Silbury Hill', icon: '⛰️', destroyable: false, prehistoric: true }
  };

  const prehistoricTypes = Object.keys(tileCatalog).filter((type) => tileCatalog[type].prehistoric);

  function createWorld() {
    const world = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => {
        const roll = Math.random();
        if (roll < 0.15) return 'tree';
        if (roll < 0.25) return 'stone';
        if (roll < 0.3) return 'water';
        return 'grass';
      })
    );

    const monuments = [
      { row: 1, col: 2, type: 'stonehenge' },
      { row: 2, col: 7, type: 'woodhenge' },
      { row: 5, col: 4, type: 'avebury' },
      { row: 4, col: 9, type: 'skara_brae' },
      { row: 6, col: 1, type: 'silbury_hill' }
    ];

    for (const monument of monuments) {
      world[monument.row][monument.col] = monument.type;
    }

    return world;
  }

  let world = createWorld();
  let message = 'Explore Britain\'s prehistoric monuments and clear regular terrain.';
  let score = 0;

  function handleDestroy(row, col) {
    const currentType = world[row][col];

    if (prehistoricTypes.includes(currentType)) {
      message = 'the council prevented you from destroying the monument';
      return;
    }

    if (currentType === 'grass') {
      message = 'This tile is already clear.';
      return;
    }

    world[row][col] = 'grass';
    world = world;
    score += 1;
    message = `You removed ${tileCatalog[currentType].name}. Monuments remain protected.`;
  }

  function resetWorld() {
    world = createWorld();
    score = 0;
    message = 'Fresh map generated. Monuments are still protected.';
  }
</script>

<main>
  <h1>Prehistoric Monument Craft</h1>
  <p class="subtitle">Click any tile to destroy it. Try touching Stonehenge, Woodhenge, and other monuments.</p>

  <section class="status">
    <p><strong>Score:</strong> {score}</p>
    <button on:click={resetWorld}>Regenerate map</button>
  </section>

  <p class="message">{message}</p>

  <div class="board" role="grid" aria-label="Game board">
    {#each world as row, rowIndex}
      {#each row as tile, colIndex}
        <button
          class="tile {tileCatalog[tile].prehistoric ? 'monument' : ''}"
          title={tileCatalog[tile].name}
          on:click={() => handleDestroy(rowIndex, colIndex)}
        >
          <span>{tileCatalog[tile].icon}</span>
        </button>
      {/each}
    {/each}
  </div>

  <section class="legend">
    <h2>Legend</h2>
    <ul>
      {#each Object.entries(tileCatalog) as [, tileInfo]}
        <li>
          <span>{tileInfo.icon}</span> {tileInfo.name}
          {#if tileInfo.prehistoric}
            <em>(protected monument)</em>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #f2ede1;
  }

  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  h1 {
    margin-bottom: 0.3rem;
  }

  .subtitle {
    margin-top: 0;
    color: #4f4a3d;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }

  .status button {
    border: 0;
    background: #584f3d;
    color: #fff;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    cursor: pointer;
  }

  .message {
    background: #fff;
    border-left: 4px solid #7a6742;
    padding: 0.6rem;
    min-height: 1.4rem;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 0.35rem;
    margin: 1rem 0 1.5rem;
  }

  .tile {
    border: 1px solid #c8b88a;
    border-radius: 6px;
    background: #fff8e6;
    padding: 0.45rem;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .tile.monument {
    border-color: #6a2f2f;
    background: #ffefe8;
  }

  .legend ul {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.35rem;
  }

  .legend li {
    background: #fff;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
  }

  em {
    color: #6a2f2f;
    font-style: normal;
    font-size: 0.85rem;
  }
</style>
