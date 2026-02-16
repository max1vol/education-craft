<svelte:head>
  <title>Prehistoric Monument Craft 3D</title>
</svelte:head>

<script>
  import { onMount } from 'svelte';

  const rows = 44;
  const cols = 44;
  const blockSize = 1;

  const tileCatalog = {
    grass: { name: 'Grass', color: 0x6aa84f, destroyable: false, prehistoric: false, height: 1 },
    tree: { name: 'Tree', color: 0x38761d, destroyable: true, prehistoric: false, height: 2 },
    stone: { name: 'Stone', color: 0x7f8c8d, destroyable: true, prehistoric: false, height: 1.1 },
    water: { name: 'Water', color: 0x3d85c6, destroyable: true, prehistoric: false, height: 0.7 },
    river_avon: {
      name: 'River Avon',
      color: 0x2f6db2,
      destroyable: false,
      prehistoric: true,
      height: 0.55
    },
    avenue: {
      name: 'The Avenue',
      color: 0xdcb36a,
      destroyable: false,
      prehistoric: true,
      height: 0.35
    },
    stonehenge: { name: 'Stonehenge Ring Stone', color: 0xb7b7b7, destroyable: false, prehistoric: true, height: 2.7 },
    stonehenge_center: {
      name: 'Stonehenge Altar',
      color: 0xc9c9c9,
      destroyable: false,
      prehistoric: true,
      height: 1.4
    },
    woodhenge: { name: 'Woodhenge Post', color: 0x8b5a2b, destroyable: false, prehistoric: true, height: 2.4 },
    woodhenge_center: {
      name: 'Woodhenge Hearth',
      color: 0x6f4a24,
      destroyable: false,
      prehistoric: true,
      height: 1.3
    },
    greater_cursus: {
      name: 'Greater Cursus',
      color: 0xb38b5b,
      destroyable: false,
      prehistoric: true,
      height: 1.2
    },
    lesser_cursus: {
      name: 'Lesser Cursus',
      color: 0xc8a376,
      destroyable: false,
      prehistoric: true,
      height: 1
    },
    avebury: { name: 'Avebury Standing Stone', color: 0xd9d2c3, destroyable: false, prehistoric: true, height: 2.2 },
    durrington_walls: {
      name: 'Durrington Walls',
      color: 0xc1ba8c,
      destroyable: false,
      prehistoric: true,
      height: 1.6
    },
    marden_henge: {
      name: 'Marden Henge',
      color: 0xd2c78f,
      destroyable: false,
      prehistoric: true,
      height: 1.5
    },
    west_kennet: {
      name: 'West Kennet Long Barrow',
      color: 0x9ea06f,
      destroyable: false,
      prehistoric: true,
      height: 1.6
    },
    old_sarum: {
      name: 'Old Sarum',
      color: 0x8d8e80,
      destroyable: false,
      prehistoric: true,
      height: 1.9
    },
    figsbury_ring: {
      name: 'Figsbury Ring',
      color: 0xa8ac7f,
      destroyable: false,
      prehistoric: true,
      height: 1.35
    },
    danebury: {
      name: 'Danebury Hillfort',
      color: 0x9ba370,
      destroyable: false,
      prehistoric: true,
      height: 1.7
    },
    skara_brae: { name: 'Skara Brae House', color: 0xc69c6d, destroyable: false, prehistoric: true, height: 1.7 },
    skara_wall: { name: 'Skara Brae Wall', color: 0xae8c63, destroyable: false, prehistoric: true, height: 1.3 },
    silbury_hill: { name: 'Silbury Hill Slope', color: 0x93c47d, destroyable: false, prehistoric: true, height: 2.5 },
    silbury_peak: { name: 'Silbury Hill Peak', color: 0xa7d38e, destroyable: false, prehistoric: true, height: 3.6 }
  };

  const prehistoricTypes = Object.keys(tileCatalog).filter((type) => tileCatalog[type].prehistoric);

  const monumentBlueprints = [
    {
      label: 'Stonehenge',
      tiles: [
        [-1, -1, 'stonehenge'],
        [-1, 0, 'stonehenge'],
        [-1, 1, 'stonehenge'],
        [0, -1, 'stonehenge'],
        [0, 1, 'stonehenge'],
        [1, -1, 'stonehenge'],
        [1, 0, 'stonehenge'],
        [1, 1, 'stonehenge'],
        [0, 0, 'stonehenge_center']
      ]
    },
    {
      label: 'Woodhenge',
      tiles: [
        [-1, -1, 'woodhenge'],
        [-1, 0, 'woodhenge'],
        [-1, 1, 'woodhenge'],
        [0, -1, 'woodhenge'],
        [0, 1, 'woodhenge'],
        [1, -1, 'woodhenge'],
        [1, 0, 'woodhenge'],
        [1, 1, 'woodhenge'],
        [0, 0, 'woodhenge_center']
      ]
    },
    {
      label: 'Avebury Circle',
      tiles: [
        [-2, 0, 'avebury'],
        [2, 0, 'avebury'],
        [0, -2, 'avebury'],
        [0, 2, 'avebury'],
        [-1, -1, 'avebury'],
        [-1, 1, 'avebury'],
        [1, -1, 'avebury'],
        [1, 1, 'avebury']
      ]
    },
    {
      label: 'Silbury Hill',
      tiles: [
        [-1, -1, 'silbury_hill'],
        [-1, 0, 'silbury_hill'],
        [-1, 1, 'silbury_hill'],
        [0, -1, 'silbury_hill'],
        [0, 0, 'silbury_peak'],
        [0, 1, 'silbury_hill'],
        [1, -1, 'silbury_hill'],
        [1, 0, 'silbury_hill'],
        [1, 1, 'silbury_hill']
      ]
    },
    {
      label: 'Durrington Walls',
      tiles: [
        [-1, -1, 'durrington_walls'],
        [-1, 0, 'durrington_walls'],
        [-1, 1, 'durrington_walls'],
        [0, -1, 'durrington_walls'],
        [0, 1, 'durrington_walls'],
        [1, -1, 'durrington_walls'],
        [1, 0, 'durrington_walls'],
        [1, 1, 'durrington_walls'],
        [0, 0, 'grass']
      ]
    },
    {
      label: 'Marden Henge',
      tiles: [
        [-1, -1, 'marden_henge'],
        [-1, 0, 'marden_henge'],
        [-1, 1, 'marden_henge'],
        [0, -1, 'marden_henge'],
        [0, 0, 'grass'],
        [0, 1, 'marden_henge'],
        [1, -1, 'marden_henge'],
        [1, 0, 'marden_henge'],
        [1, 1, 'marden_henge']
      ]
    },
    {
      label: 'West Kennet Long Barrow',
      tiles: [
        [-2, 0, 'west_kennet'],
        [-1, 0, 'west_kennet'],
        [0, 0, 'west_kennet'],
        [1, 0, 'west_kennet'],
        [2, 0, 'west_kennet']
      ]
    },
    {
      label: 'Old Sarum',
      tiles: [
        [-1, -1, 'old_sarum'],
        [-1, 0, 'old_sarum'],
        [-1, 1, 'old_sarum'],
        [0, -1, 'old_sarum'],
        [0, 1, 'old_sarum'],
        [1, -1, 'old_sarum'],
        [1, 0, 'old_sarum'],
        [1, 1, 'old_sarum'],
        [0, 0, 'grass']
      ]
    },
    {
      label: 'Figsbury Ring',
      tiles: [
        [-1, -1, 'figsbury_ring'],
        [-1, 0, 'figsbury_ring'],
        [-1, 1, 'figsbury_ring'],
        [0, -1, 'figsbury_ring'],
        [0, 1, 'figsbury_ring'],
        [1, -1, 'figsbury_ring'],
        [1, 0, 'figsbury_ring'],
        [1, 1, 'figsbury_ring'],
        [0, 0, 'grass']
      ]
    },
    {
      label: 'Danebury Hillfort',
      tiles: [
        [-1, -1, 'danebury'],
        [-1, 0, 'danebury'],
        [-1, 1, 'danebury'],
        [0, -1, 'danebury'],
        [0, 1, 'danebury'],
        [1, -1, 'danebury'],
        [1, 0, 'danebury'],
        [1, 1, 'danebury'],
        [0, 0, 'grass']
      ]
    }
  ];

  function carveRiverAvon(world) {
    for (let row = 0; row < rows; row += 1) {
      const centerCol = Math.floor(cols * 0.25 + Math.sin(row / 4) * 4 + row * 0.2);
      for (let width = -1; width <= 1; width += 1) {
        const col = centerCol + width;
        if (col >= 0 && col < cols) {
          world[row][col] = 'river_avon';
        }
      }
    }
  }

  function layAvenue(world) {
    for (let row = Math.floor(rows * 0.35); row < rows - 2; row += 1) {
      const col = Math.floor(cols * 0.45 + Math.sin(row / 6) * 2);
      if (col >= 1 && col < cols - 1) {
        world[row][col] = 'avenue';
        world[row][col - 1] = 'avenue';
      }
    }
  }

  function placeCursus(world) {
    const greaterRow = Math.floor(rows * 0.22);
    for (let col = 5; col < cols - 5; col += 1) {
      world[greaterRow][col] = 'greater_cursus';
    }

    const lesserCol = Math.floor(cols * 0.62);
    for (let row = 5; row < Math.floor(rows * 0.45); row += 1) {
      world[row][lesserCol] = 'lesser_cursus';
    }
  }

  function canPlaceMonument(world, centerRow, centerCol, blueprint) {
    return blueprint.tiles.every(([rowOffset, colOffset]) => {
      const row = centerRow + rowOffset;
      const col = centerCol + colOffset;
      if (row < 0 || row >= rows || col < 0 || col >= cols) {
        return false;
      }
      return !prehistoricTypes.includes(world[row][col]);
    });
  }

  function placeMonument(world, centerRow, centerCol, blueprint) {
    blueprint.tiles.forEach(([rowOffset, colOffset, type]) => {
      world[centerRow + rowOffset][centerCol + colOffset] = type;
    });
  }

  function createWorld() {
    const world = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => {
        const roll = Math.random();
        if (roll < 0.14) return 'tree';
        if (roll < 0.23) return 'stone';
        if (roll < 0.28) return 'water';
        return 'grass';
      })
    );

    carveRiverAvon(world);
    layAvenue(world);
    placeCursus(world);

    const anchors = [
      [Math.floor(rows * 0.42), Math.floor(cols * 0.48)], // Stonehenge
      [Math.floor(rows * 0.55), Math.floor(cols * 0.5)], // Woodhenge
      [Math.floor(rows * 0.12), Math.floor(cols * 0.8)], // Avebury
      [Math.floor(rows * 0.1), Math.floor(cols * 0.7)], // Silbury
      [Math.floor(rows * 0.5), Math.floor(cols * 0.56)], // Durrington
      [Math.floor(rows * 0.15), Math.floor(cols * 0.9)], // Marden
      [Math.floor(rows * 0.1), Math.floor(cols * 0.76)], // West Kennet
      [Math.floor(rows * 0.65), Math.floor(cols * 0.85)], // Old Sarum
      [Math.floor(rows * 0.68), Math.floor(cols * 0.9)], // Figsbury Ring
      [Math.floor(rows * 0.8), Math.floor(cols * 0.72)] // Danebury
    ];

    monumentBlueprints.forEach((blueprint, index) => {
      const [baseRow, baseCol] = anchors[index];
      if (canPlaceMonument(world, baseRow, baseCol, blueprint)) {
        placeMonument(world, baseRow, baseCol, blueprint);
      }
    });

    return world;
  }

  let world = createWorld();
  let score = 0;
  let message =
    'Classic Roblox controls active: WASD/Arrows move, SPACE jumps, Shift sprints, and click mines.';

  let sceneHost;
  let renderer;
  let scene;
  let camera;
  let controls;
  let animationFrame;
  let THREE;
  let PointerLockControls;
  let raycaster;
  let tileMeshes = [];

  const playerHeight = 1.6;
  const gravity = 22;
  const jumpSpeed = 8.5;
  const walkSpeed = 4.6;
  const sprintSpeed = 7.4;
  const mineRange = 5;

  let velocityY = 0;
  let isGrounded = false;

  const keyState = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    ShiftLeft: false,
    ShiftRight: false,
    Space: false
  };

  const monumentsWithin100Miles = [
    'Stonehenge',
    'Woodhenge',
    'Greater Cursus',
    'Lesser Cursus',
    'The Avenue',
    'River Avon',
    'Durrington Walls',
    'Bluestonehenge',
    'Avebury Henge and Stone Circles',
    'Silbury Hill',
    'West Kennet Long Barrow',
    'Marden Henge',
    'Old Sarum',
    'Figsbury Ring',
    'Danebury Hillfort',
    'Uffington White Horse',
    'Wayland\'s Smithy',
    'Maiden Castle',
    'Hambledon Hill',
    'Flagstones Enclosure',
    'Cerne Abbas Giant',
    'Priddy Circles'
  ];

  function tileToPosition(row, col, height) {
    return {
      x: (col - cols / 2) * blockSize + blockSize / 2,
      y: height / 2,
      z: (row - rows / 2) * blockSize + blockSize / 2
    };
  }

  function worldCenterSpawn() {
    const spawnRow = Math.floor(rows / 2);
    const spawnCol = Math.floor(cols / 2);
    const spawnX = (spawnCol - cols / 2) * blockSize + blockSize / 2;
    const spawnZ = (spawnRow - rows / 2) * blockSize + blockSize / 2;
    return { spawnX, spawnZ };
  }

  function clampToWorldBounds(position) {
    const minX = -cols / 2 + blockSize / 2;
    const maxX = cols / 2 - blockSize / 2;
    const minZ = -rows / 2 + blockSize / 2;
    const maxZ = rows / 2 - blockSize / 2;
    position.x = Math.max(minX, Math.min(maxX, position.x));
    position.z = Math.max(minZ, Math.min(maxZ, position.z));
  }

  function groundHeightAt(x, z) {
    const col = Math.floor(x / blockSize + cols / 2);
    const row = Math.floor(z / blockSize + rows / 2);

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return 0;
    }

    const type = world[row][col];
    return tileCatalog[type]?.height ?? 0;
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
          metalness: config.prehistoric ? 0.13 : 0.02,
          emissive: config.prehistoric ? 0x24100d : 0x000000
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

  function mineInCrosshair() {
    if (!controls?.isLocked) {
      message = 'Click Play or press Enter to lock pointer first.';
      return;
    }

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    raycaster.far = mineRange;
    const intersections = raycaster.intersectObjects(
      tileMeshes.map((item) => item.mesh),
      false
    );

    if (!intersections.length) {
      message = 'Move closer and keep the target in your crosshair.';
      return;
    }

    const hit = intersections[0].object.userData;
    destroyTile(hit.row, hit.col);
  }

  function resetWorld() {
    world = createWorld();
    score = 0;
    message = 'Fresh mega-map generated with protected monuments, cursus earthworks, and the Avon route.';
    if (scene && controls) {
      rebuildTiles();
      const { spawnX, spawnZ } = worldCenterSpawn();
      const spawnY = groundHeightAt(spawnX, spawnZ) + playerHeight + 0.01;
      controls.getObject().position.set(spawnX, spawnY, spawnZ);
      velocityY = 0;
    }
  }

  let fallbackMode = false;

  onMount(async () => {
    const [threeLoad, pointerLoad] = await Promise.allSettled([
      import('https://unpkg.com/three@0.179.1/build/three.module.js'),
      import('https://unpkg.com/three@0.179.1/examples/jsm/controls/PointerLockControls.js')
    ]);

    if (threeLoad.status !== 'fulfilled' || pointerLoad.status !== 'fulfilled') {
      fallbackMode = true;
      message =
        '3D renderer could not load in this network. You can still see the world map below instead of a black screen.';
      return () => {};
    }

    THREE = threeLoad.value;
    PointerLockControls = pointerLoad.value.PointerLockControls;

    raycaster = new THREE.Raycaster();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 12, 38);

    camera = new THREE.PerspectiveCamera(70, sceneHost.clientWidth / sceneHost.clientHeight, 0.1, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    sceneHost.appendChild(renderer.domElement);

    controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    const { spawnX, spawnZ } = worldCenterSpawn();
    const spawnY = groundHeightAt(spawnX, spawnZ) + playerHeight + 0.01;
    controls.getObject().position.set(spawnX, spawnY, spawnZ);

    const sun = new THREE.DirectionalLight(0xffffff, 1.25);
    sun.position.set(8, 14, 6);
    scene.add(sun);

    const fill = new THREE.HemisphereLight(0xffffff, 0x355723, 0.45);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(cols + 18, rows + 18),
      new THREE.MeshStandardMaterial({ color: 0x5c913b, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    rebuildTiles();

    let lastFrame = performance.now();
    const direction = new THREE.Vector3();
    const sideways = new THREE.Vector3();

    const renderLoop = () => {
      animationFrame = requestAnimationFrame(renderLoop);

      const now = performance.now();
      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      if (controls.isLocked) {
        direction.set(0, 0, 0);
        if (keyState.KeyW || keyState.ArrowUp) direction.z -= 1;
        if (keyState.KeyS || keyState.ArrowDown) direction.z += 1;
        if (keyState.KeyA || keyState.ArrowLeft) direction.x -= 1;
        if (keyState.KeyD || keyState.ArrowRight) direction.x += 1;

        const isSprinting = keyState.ShiftLeft || keyState.ShiftRight;
        const moveSpeed = isSprinting ? sprintSpeed : walkSpeed;

        if (direction.lengthSq() > 0) {
          direction.normalize();
          controls.moveForward(direction.z * -moveSpeed * delta);
          controls.moveRight(direction.x * moveSpeed * delta);
        }

        if (isGrounded && keyState.Space) {
          velocityY = jumpSpeed;
          isGrounded = false;
        }
      }

      clampToWorldBounds(controls.getObject().position);

      velocityY -= gravity * delta;
      controls.getObject().position.y += velocityY * delta;

      sideways.set(controls.getObject().position.x, 0, controls.getObject().position.z);
      const floor = groundHeightAt(sideways.x, sideways.z) + playerHeight;
      if (controls.getObject().position.y <= floor) {
        controls.getObject().position.y = floor;
        velocityY = 0;
        isGrounded = true;
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    const handleResize = () => {
      camera.aspect = sceneHost.clientWidth / sceneHost.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
    };

    const handlePointerDown = () => {
      if (!controls.isLocked) {
        controls.lock();
        return;
      }
      mineInCrosshair();
    };

    const handleKeyDown = (event) => {
      if (event.code in keyState) {
        keyState[event.code] = true;
      }
      if (event.code === 'Enter' && !controls.isLocked) {
        controls.lock();
      }
    };

    const handleKeyUp = (event) => {
      if (event.code in keyState) {
        keyState[event.code] = false;
      }
    };

    controls.addEventListener('lock', () => {
      message =
        'Pointer locked. Classic Roblox controls enabled: WASD/Arrows move, SPACE jump, Shift sprint, click mine.';
    });

    controls.addEventListener('unlock', () => {
      message = 'Pointer unlocked. Click Play or press Enter to keep exploring.';
      Object.keys(keyState).forEach((k) => {
        keyState[k] = false;
      });
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.disconnect();
      removeTiles();
      renderer.dispose();
      sceneHost.removeChild(renderer.domElement);
    };
  });
</script>

<main>
  <div class="overlay top">
    <h1>Prehistoric Monument Craft 3D</h1>
    <p class="subtitle">Classic Roblox-like mode: WASD/Arrows move, SPACE jump, Shift sprint, mouse look, click mine.</p>
  </div>

  <div class="overlay hud">
    <p><strong>Score:</strong> {score}</p>
    <button on:click={resetWorld}>Generate new world</button>
    <button on:click={() => controls?.lock()} disabled={fallbackMode}>Play (lock mouse)</button>
  </div>

  <p class="overlay message">{message}</p>

  {#if !fallbackMode}
    <div class="crosshair" aria-hidden="true">+</div>
    <div class="scene" bind:this={sceneHost} aria-label="3D game world"></div>
  {:else}
    <section class="fallback-map" aria-label="2D world map fallback">
      {#each world as worldRow}
        <div class="fallback-row">
          {#each worldRow as cellType}
            <span
              class="fallback-cell"
              style={`background: #${tileCatalog[cellType].color.toString(16).padStart(6, '0')}`}
              title={tileCatalog[cellType].name}
            ></span>
          {/each}
        </div>
      {/each}
    </section>
  {/if}



  <section class="overlay research">
    <h2>Monuments within ~100 miles of Stonehenge</h2>
    <ul>
      {#each monumentsWithin100Miles as monument}
        <li>{monument}</li>
      {/each}
    </ul>
  </section>
  <section class="overlay legend">
    <h2>Protected Site Guide</h2>
    <ul>
      {#each Object.entries(tileCatalog) as [, tileInfo]}
        <li>
          <span class="swatch" style={`background: #${tileInfo.color.toString(16).padStart(6, '0')}`}></span>
          {tileInfo.name}
          {#if tileInfo.prehistoric}
            <em>(protected)</em>
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
    background: #000;
    color: #f4ffef;
    overflow: hidden;
  }

  main {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  .scene {
    width: 100%;
    height: 100%;
    cursor: none;
  }

  .overlay {
    position: absolute;
    z-index: 2;
    background: rgba(18, 33, 15, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 10px;
    backdrop-filter: blur(2px);
  }

  .top {
    top: 1rem;
    left: 1rem;
    max-width: 38rem;
    padding: 0.75rem 1rem;
  }

  h1 {
    margin: 0;
    font-size: 1.35rem;
  }

  .subtitle {
    margin: 0.3rem 0 0;
    color: #cfe8bf;
    font-size: 0.95rem;
  }

  .hud {
    top: 6.7rem;
    left: 1rem;
    padding: 0.65rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  button {
    border: 0;
    background: #3f6f2f;
    color: #fff;
    border-radius: 8px;
    padding: 0.55rem 0.8rem;
    cursor: pointer;
    font-weight: 600;
  }

  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .message {
    top: 11.2rem;
    left: 1rem;
    max-width: 30rem;
    padding: 0.65rem 0.75rem;
    margin: 0;
    color: #f3ffec;
  }

  .crosshair {
    position: absolute;
    z-index: 3;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.55rem;
    text-shadow: 0 0 5px #000;
    color: #fff;
    user-select: none;
    pointer-events: none;
  }

  .legend {
    right: 1rem;
    top: 1rem;
    width: min(28rem, 40vw);
    max-height: calc(54vh - 2rem);
    overflow: auto;
    padding: 0.75rem;
  }

  .research {
    right: 1rem;
    top: 56vh;
    width: min(28rem, 40vw);
    max-height: 40vh;
    overflow: auto;
    padding: 0.75rem;
  }

  .research h2 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }

  .research ul {
    margin: 0;
    padding-left: 1.2rem;
    display: grid;
    gap: 0.25rem;
  }

  .legend h2 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }

  .legend ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
  }

  .legend li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 0.35rem 0.45rem;
    font-size: 0.9rem;
  }

  .swatch {
    width: 13px;
    height: 13px;
    border: 1px solid #fff;
    flex-shrink: 0;
  }

  em {
    color: #ffd1d1;
    font-style: normal;
    font-size: 0.8rem;
  }

  .fallback-map {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
    place-content: center;
    gap: 0.2rem;
    background: linear-gradient(180deg, #88b9ff 0%, #9ed27f 58%, #6fa04b 100%);
  }

  .fallback-row {
    display: flex;
    gap: 0.2rem;
  }

  .fallback-cell {
    width: min(1.45vw, 0.7rem);
    height: min(1.45vw, 0.7rem);
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: 3px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
  }

  @media (max-width: 900px) {
    .legend,
    .research {
      width: min(21rem, 55vw);
    }

    .research {
      top: 58vh;
    }

    .message {
      top: 13.8rem;
      max-width: 20rem;
    }
  }
</style>
