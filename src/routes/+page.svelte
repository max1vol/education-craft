<svelte:head>
  <title>Prehistoric Monument Craft 3D</title>
</svelte:head>

<script>
  import { onMount } from 'svelte';

  const rows = 8;
  const cols = 12;
  const blockSize = 1;

  const tileCatalog = {
    grass: { name: 'Grass', color: 0x6aa84f, destroyable: false, prehistoric: false, height: 1 },
    tree: { name: 'Tree', color: 0x38761d, destroyable: true, prehistoric: false, height: 2 },
    stone: { name: 'Stone', color: 0x7f8c8d, destroyable: true, prehistoric: false, height: 1.1 },
    water: { name: 'Water', color: 0x3d85c6, destroyable: true, prehistoric: false, height: 0.7 },
    stonehenge: { name: 'Stonehenge', color: 0xb7b7b7, destroyable: false, prehistoric: true, height: 2.6 },
    woodhenge: { name: 'Woodhenge', color: 0x8b5a2b, destroyable: false, prehistoric: true, height: 2.3 },
    avebury: { name: 'Avebury Circle', color: 0xd9d2c3, destroyable: false, prehistoric: true, height: 2.1 },
    skara_brae: { name: 'Skara Brae', color: 0xc69c6d, destroyable: false, prehistoric: true, height: 1.6 },
    silbury_hill: { name: 'Silbury Hill', color: 0x93c47d, destroyable: false, prehistoric: true, height: 2.8 }
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
  let score = 0;
  let message = 'Click blocks in the 3D world to mine terrain. Prehistoric monuments are protected.';

  let sceneHost;
  let renderer;
  let scene;
  let camera;
  let animationFrame;
  let THREE;
  let raycaster;
  let mouse;
  let tileMeshes = [];

  function tileToPosition(row, col, height) {
    return {
      x: (col - cols / 2) * blockSize + blockSize / 2,
      y: height / 2,
      z: (row - rows / 2) * blockSize + blockSize / 2
    };
  }

  function removeTiles() {
    for (const tile of tileMeshes) {
      scene.remove(tile.mesh);
      tile.mesh.geometry.dispose();
      tile.mesh.material.dispose();
    }
    tileMeshes = [];
  }

  function rebuildTiles() {
    removeTiles();

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const type = world[row][col];
        const config = tileCatalog[type];

        const geometry = new THREE.BoxGeometry(blockSize, config.height, blockSize);
        const material = new THREE.MeshStandardMaterial({
          color: config.color,
          roughness: 0.9,
          metalness: config.prehistoric ? 0.1 : 0.02,
          emissive: config.prehistoric ? 0x220c0c : 0x000000
        });

        const mesh = new THREE.Mesh(geometry, material);
        const position = tileToPosition(row, col, config.height);
        mesh.position.set(position.x, position.y, position.z);

        if (config.prehistoric) {
          mesh.scale.set(0.9, 1, 0.9);
        }

        mesh.userData = { row, col, type };
        scene.add(mesh);
        tileMeshes.push({ row, col, mesh });
      }
    }
  }

  function destroyTile(row, col) {
    const currentType = world[row][col];

    if (prehistoricTypes.includes(currentType)) {
      message = 'The council prevented you from destroying this protected monument.';
      return;
    }

    if (!tileCatalog[currentType].destroyable) {
      message = `${tileCatalog[currentType].name} cannot be destroyed.`;
      return;
    }

    world[row][col] = 'grass';
    score += 1;
    message = `You mined ${tileCatalog[currentType].name}. Monuments remain protected.`;
    rebuildTiles();
  }

  function handlePointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersections = raycaster.intersectObjects(tileMeshes.map((item) => item.mesh));

    if (!intersections.length) {
      message = 'Aim at a block and click to mine it.';
      return;
    }

    const hit = intersections[0].object.userData;
    destroyTile(hit.row, hit.col);
  }

  function resetWorld() {
    world = createWorld();
    score = 0;
    message = 'Fresh 3D map generated. Monuments are still protected.';
    if (scene) rebuildTiles();
  }

  onMount(async () => {
    THREE = await import('https://unpkg.com/three@0.179.1/build/three.module.js');
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 12, 34);

    camera = new THREE.PerspectiveCamera(65, sceneHost.clientWidth / sceneHost.clientHeight, 0.1, 100);
    camera.position.set(0, 12, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    sceneHost.appendChild(renderer.domElement);

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(8, 14, 6);
    scene.add(sun);

    const fill = new THREE.HemisphereLight(0xffffff, 0x355723, 0.45);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(cols + 8, rows + 8),
      new THREE.MeshStandardMaterial({ color: 0x5c913b, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    rebuildTiles();

    const renderLoop = () => {
      animationFrame = requestAnimationFrame(renderLoop);
      const t = performance.now() * 0.00015;
      camera.position.x = Math.sin(t) * 14;
      camera.position.z = Math.cos(t) * 14;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    renderLoop();

    const handleResize = () => {
      camera.aspect = sceneHost.clientWidth / sceneHost.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      removeTiles();
      renderer.dispose();
      sceneHost.removeChild(renderer.domElement);
    };
  });
</script>

<main>
  <h1>Prehistoric Monument Craft 3D</h1>
  <p class="subtitle">Voxel-inspired terrain, Minecraft-style blocks, and protected prehistoric monuments.</p>

  <section class="hud">
    <p><strong>Score:</strong> {score}</p>
    <button on:click={resetWorld}>Generate new world</button>
  </section>

  <p class="message">{message}</p>

  <div class="scene-wrap">
    <div class="scene" bind:this={sceneHost} aria-label="3D game world"></div>
  </div>

  <section class="legend">
    <h2>Blocks</h2>
    <ul>
      {#each Object.entries(tileCatalog) as [, tileInfo]}
        <li>
          <span class="swatch" style={`background: #${tileInfo.color.toString(16).padStart(6, '0')}`}></span>
          {tileInfo.name}
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
    font-family: 'Segoe UI', sans-serif;
    background: linear-gradient(#a8d6ff, #dff0ff 40%, #f2eee2);
    color: #1f2d1c;
  }

  main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1.25rem;
  }

  h1 {
    margin-bottom: 0.3rem;
  }

  .subtitle {
    margin-top: 0;
    color: #3a4f2f;
  }

  .hud {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }

  button {
    border: 0;
    background: #3f6f2f;
    color: #fff;
    border-radius: 10px;
    padding: 0.65rem 1rem;
    cursor: pointer;
    font-weight: 600;
  }

  .message {
    background: #f7fff4;
    border-left: 4px solid #3f6f2f;
    padding: 0.65rem;
    min-height: 1.4rem;
  }

  .scene-wrap {
    border: 4px solid #7f5f3e;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    margin: 1rem 0 1.5rem;
  }

  .scene {
    width: 100%;
    height: 580px;
    cursor: crosshair;
  }

  .legend ul {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 0.45rem;
  }

  .legend li {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    background: #fff;
    border-radius: 8px;
    padding: 0.45rem 0.6rem;
  }

  .swatch {
    width: 14px;
    height: 14px;
    border: 1px solid #222;
  }

  em {
    color: #6a2f2f;
    font-style: normal;
    font-size: 0.85rem;
  }
</style>
