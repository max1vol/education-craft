<svelte:head>
  <title>MonumentCraft Voxel</title>
</svelte:head>

<script>
  import { onMount } from 'svelte';

  const WORLD_RADIUS = 24;
  const MAX_Y = 28;
  const SEA_LEVEL = 4;

  const PLAYER_HEIGHT = 1.75;
  const EYE_HEIGHT = 1.62;
  const PLAYER_RADIUS = 0.28;

  const WALK_SPEED = 4.6;
  const SPRINT_SPEED = 7.2;
  const JUMP_SPEED = 8.3;
  const GRAVITY = 24;
  const BREAK_RANGE = 6;
  const STEP_SIZE = 0.09;
  const JOYSTICK_RADIUS = 44;

  const BLOCK_DEFS = {
    bedrock: {
      label: 'Bedrock',
      color: '#2f2f33',
      accent: '#1f1f22',
      solid: true,
      breakable: false,
      roughness: 1,
      metalness: 0
    },
    grass: {
      label: 'Grass Block',
      color: '#6aa848',
      accent: '#7ebf58',
      solid: true,
      breakable: true,
      roughness: 0.95,
      metalness: 0
    },
    dirt: {
      label: 'Dirt Block',
      color: '#7d5a3a',
      accent: '#936745',
      solid: true,
      breakable: true,
      roughness: 1,
      metalness: 0
    },
    stone: {
      label: 'Stone Block',
      color: '#83868f',
      accent: '#9ba1ad',
      solid: true,
      breakable: true,
      roughness: 0.9,
      metalness: 0.04
    },
    sand: {
      label: 'Sand Block',
      color: '#d8c47b',
      accent: '#e5d28f',
      solid: true,
      breakable: true,
      roughness: 1,
      metalness: 0
    },
    sandstone: {
      label: 'Sandstone',
      color: '#cbb276',
      accent: '#d9c08b',
      solid: true,
      breakable: true,
      roughness: 0.9,
      metalness: 0
    },
    oak_log: {
      label: 'Oak Log',
      color: '#7b5534',
      accent: '#98673e',
      solid: true,
      breakable: true,
      roughness: 0.95,
      metalness: 0
    },
    oak_leaves: {
      label: 'Oak Leaves',
      color: '#3f7f3a',
      accent: '#4f9947',
      solid: true,
      breakable: true,
      transparent: true,
      opacity: 0.86,
      roughness: 1,
      metalness: 0
    },
    oak_planks: {
      label: 'Oak Planks',
      color: '#b68755',
      accent: '#d09b63',
      solid: true,
      breakable: true,
      roughness: 0.82,
      metalness: 0
    },
    water: {
      label: 'Water',
      color: '#3d82c6',
      accent: '#53a2ec',
      solid: false,
      breakable: false,
      transparent: true,
      opacity: 0.72,
      roughness: 0.25,
      metalness: 0
    },
    henge_stone: {
      label: 'Sarsen Stone',
      color: '#c5c0b2',
      accent: '#ddd7c8',
      solid: true,
      breakable: true,
      roughness: 0.93,
      metalness: 0.04
    },
    altar: {
      label: 'Altar Stone',
      color: '#b8b2a1',
      accent: '#ccc5b3',
      solid: true,
      breakable: true,
      roughness: 0.96,
      metalness: 0
    },
    marble: {
      label: 'Marble',
      color: '#f0eee8',
      accent: '#ffffff',
      solid: true,
      breakable: true,
      roughness: 0.82,
      metalness: 0.06
    },
    ziggurat_brick: {
      label: 'Ziggurat Brick',
      color: '#b07f4b',
      accent: '#cb9460',
      solid: true,
      breakable: true,
      roughness: 0.88,
      metalness: 0
    },
    gold_block: {
      label: 'Gold Block',
      color: '#f5d04d',
      accent: '#ffe07c',
      solid: true,
      breakable: true,
      roughness: 0.35,
      metalness: 0.48
    }
  };

  const HOTBAR = ['grass', 'dirt', 'stone', 'oak_planks', 'sandstone', 'henge_stone'];
  const fallbackAxis = Array.from({ length: WORLD_RADIUS * 2 + 1 }, (_, idx) => idx - WORLD_RADIUS);

  let sceneHost;
  let renderer;
  let scene;
  let camera;
  let raycaster;
  let worldGroup;
  let cubeGeometry;
  let THREE;

  let animationFrame = 0;
  let isLoading3D = true;
  let fallbackMode = false;
  let pointerLocked = false;
  let isTouchDevice = false;

  let message =
    'Minecraft-style controls: WASD move, Space jump, Shift sprint, Left click mine, Right click place.';
  let minedCount = 0;
  let placedCount = 0;
  let fps = 0;
  let selectedIndex = 0;
  let nearbyMonuments = [];

  $: selectedBlock = HOTBAR[selectedIndex];

  const player = {
    x: 0.5,
    y: 10,
    z: 0.5,
    vy: 0,
    grounded: false
  };

  let yaw = Math.PI * 0.85;
  let pitch = -0.15;

  const keyState = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    Space: false,
    ShiftLeft: false,
    ShiftRight: false
  };

  const blocks = new Map();
  const protectedBlocks = new Set();
  const materials = {};
  const blockMeshes = [];

  let monuments = [];
  let jumpQueued = false;

  const moveStick = {
    pointerId: null,
    centerX: 0,
    centerY: 0,
    x: 0,
    y: 0
  };

  const lookStick = {
    pointerId: null,
    centerX: 0,
    centerY: 0,
    x: 0,
    y: 0
  };

  let moveKnobX = 0;
  let moveKnobY = 0;
  let lookKnobX = 0;
  let lookKnobY = 0;

  function keyFor(x, y, z) {
    return `${x},${y},${z}`;
  }

  function unpackKey(key) {
    const [x, y, z] = key.split(',').map((value) => Number(value));
    return { x, y, z };
  }

  function inWorldXZ(x, z) {
    return x >= -WORLD_RADIUS && x <= WORLD_RADIUS && z >= -WORLD_RADIUS && z <= WORLD_RADIUS;
  }

  function inWorldXYZ(x, y, z) {
    return y >= 0 && y <= MAX_Y && inWorldXZ(x, z);
  }

  function getBlock(x, y, z) {
    return blocks.get(keyFor(x, y, z)) ?? null;
  }

  function isSolidType(type) {
    return Boolean(type && BLOCK_DEFS[type]?.solid);
  }

  function isOccludingType(type) {
    if (!type) return false;
    const config = BLOCK_DEFS[type];
    return Boolean(config?.solid && !config.transparent);
  }

  function setBlock(x, y, z, type, options = {}) {
    if (!inWorldXYZ(x, y, z)) return;

    const key = keyFor(x, y, z);
    if (!type) {
      blocks.delete(key);
      protectedBlocks.delete(key);
      return;
    }

    blocks.set(key, type);
    if (options.protectedBlock) {
      protectedBlocks.add(key);
    }
  }

  function removeBlock(x, y, z) {
    const key = keyFor(x, y, z);
    blocks.delete(key);
    protectedBlocks.delete(key);
  }

  function noise2(x, z) {
    const raw = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    return raw - Math.floor(raw);
  }

  function terrainHeight(x, z) {
    const radial = Math.max(0, 1 - Math.hypot(x, z) / (WORLD_RADIUS + 2));
    const wave = Math.sin(x * 0.22) * 1.4 + Math.cos(z * 0.19) * 1.2 + Math.sin((x + z) * 0.08) * 1.5;
    const jitter = (noise2(x, z) - 0.5) * 1.7;
    const raw = 5 + radial * 3.2 + wave + jitter;
    return Math.max(3, Math.min(11, Math.floor(raw)));
  }

  function setGroundColumn(x, z, height, topType = 'grass') {
    for (let y = 0; y <= MAX_Y; y += 1) {
      removeBlock(x, y, z);
    }

    for (let y = 0; y <= height; y += 1) {
      let type = 'dirt';
      if (y === 0) type = 'bedrock';
      else if (y < height - 2) type = 'stone';
      else if (y === height) type = topType;
      setBlock(x, y, z, type);
    }

    if (height < SEA_LEVEL) {
      for (let y = height + 1; y <= SEA_LEVEL; y += 1) {
        setBlock(x, y, z, 'water');
      }
    }
  }

  function topSolidY(x, z) {
    for (let y = MAX_Y; y >= 0; y -= 1) {
      if (isSolidType(getBlock(x, y, z))) return y;
    }
    return 0;
  }

  function topVisibleType(x, z) {
    for (let y = MAX_Y; y >= 0; y -= 1) {
      const type = getBlock(x, y, z);
      if (type && type !== 'bedrock') return type;
    }
    return 'bedrock';
  }

  function placeTree(x, z) {
    const base = topSolidY(x, z);
    if (base < SEA_LEVEL + 1) return;
    if (getBlock(x, base, z) !== 'grass') return;

    const trunkHeight = 3 + Math.floor(noise2(x * 1.3, z * 1.7) * 2);
    for (let y = 1; y <= trunkHeight; y += 1) {
      setBlock(x, base + y, z, 'oak_log');
    }

    const canopyBase = base + trunkHeight;
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dz = -2; dz <= 2; dz += 1) {
        for (let dy = 0; dy <= 2; dy += 1) {
          const density = Math.abs(dx) + Math.abs(dz) + dy;
          if (density > 4) continue;
          if (noise2(x + dx * 7 + dy * 2, z + dz * 9 - dy) < 0.12) continue;
          setBlock(x + dx, canopyBase + dy, z + dz, 'oak_leaves');
        }
      }
    }
  }

  function flattenDisk(cx, cz, radius, topY, topType = 'grass') {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      for (let z = cz - radius; z <= cz + radius; z += 1) {
        if (!inWorldXZ(x, z)) continue;
        if (Math.hypot(x - cx, z - cz) > radius + 0.25) continue;
        setGroundColumn(x, z, topY, topType);
      }
    }
  }

  function markMonument(name, x, z) {
    monuments.push({
      name,
      x: x + 0.5,
      z: z + 0.5
    });
  }

  function buildStonehenge(cx, cz) {
    const base = Math.max(6, topSolidY(cx, cz));
    flattenDisk(cx, cz, 7, base, 'grass');

    const ring = [
      [0, -5],
      [2, -4],
      [4, -2],
      [5, 0],
      [4, 2],
      [2, 4],
      [0, 5],
      [-2, 4],
      [-4, 2],
      [-5, 0],
      [-4, -2],
      [-2, -4]
    ];

    ring.forEach(([dx, dz], index) => {
      for (let y = 1; y <= 3; y += 1) {
        setBlock(cx + dx, base + y, cz + dz, 'henge_stone', { protectedBlock: true });
      }
      if (index % 2 === 0) {
        setBlock(cx + dx, base + 4, cz + dz, 'henge_stone', { protectedBlock: true });
      }
    });

    const inner = [
      [0, -2],
      [2, -1],
      [2, 1],
      [0, 2],
      [-2, 1],
      [-2, -1]
    ];

    inner.forEach(([dx, dz], index) => {
      for (let y = 1; y <= 4; y += 1) {
        setBlock(cx + dx, base + y, cz + dz, 'henge_stone', { protectedBlock: true });
      }
      if (index % 2 === 0) {
        setBlock(cx + dx, base + 5, cz + dz, 'henge_stone', { protectedBlock: true });
      }
    });

    setBlock(cx, base + 1, cz, 'altar', { protectedBlock: true });
    setBlock(cx, base + 2, cz, 'altar', { protectedBlock: true });

    markMonument('Stonehenge', cx, cz);
  }

  function buildStepPyramid(cx, cz) {
    const base = Math.max(6, topSolidY(cx, cz));
    flattenDisk(cx, cz, 9, base, 'sand');

    let size = 13;
    let y = base + 1;
    while (size >= 3) {
      const half = Math.floor(size / 2);
      for (let x = cx - half; x <= cx + half; x += 1) {
        for (let z = cz - half; z <= cz + half; z += 1) {
          setBlock(x, y, z, 'sandstone', { protectedBlock: true });
        }
      }
      size -= 2;
      y += 1;
    }

    setBlock(cx, y, cz, 'gold_block', { protectedBlock: true });
    markMonument('Step Pyramid', cx, cz);
  }

  function buildZiggurat(cx, cz) {
    const base = Math.max(6, topSolidY(cx, cz));
    flattenDisk(cx, cz, 10, base, 'sand');

    const terraces = [
      { size: 15, height: 2 },
      { size: 11, height: 2 },
      { size: 7, height: 2 },
      { size: 3, height: 2 }
    ];

    let y = base + 1;
    terraces.forEach((terrace, idx) => {
      const half = Math.floor(terrace.size / 2);
      for (let layer = 0; layer < terrace.height; layer += 1) {
        for (let x = cx - half; x <= cx + half; x += 1) {
          for (let z = cz - half; z <= cz + half; z += 1) {
            setBlock(x, y + layer, z, idx % 2 === 0 ? 'ziggurat_brick' : 'sandstone', {
              protectedBlock: true
            });
          }
        }
      }
      y += terrace.height;
    });

    for (let step = 0; step <= 7; step += 1) {
      setBlock(cx, base + 1 + step, cz + 8 - step, 'sandstone', { protectedBlock: true });
      setBlock(cx, base + 1 + step, cz + 7 - step, 'sandstone', { protectedBlock: true });
    }

    markMonument('Ziggurat', cx, cz);
  }

  function buildColosseum(cx, cz) {
    const base = Math.max(6, topSolidY(cx, cz));
    flattenDisk(cx, cz, 11, base, 'stone');

    for (let x = cx - 10; x <= cx + 10; x += 1) {
      for (let z = cz - 8; z <= cz + 8; z += 1) {
        const dx = x - cx;
        const dz = z - cz;
        const ellipse = (dx * dx) / (8 * 8) + (dz * dz) / (6 * 6);

        if (ellipse > 0.84 && ellipse < 1.12) {
          const archGap = Math.abs(dx) % 3 === 0 || Math.abs(dz) % 3 === 0;
          for (let y = 1; y <= 4; y += 1) {
            if (archGap && y <= 2) continue;
            setBlock(x, base + y, z, 'marble', { protectedBlock: true });
          }
        }

        if (ellipse < 0.82) {
          setBlock(x, base + 1, z, 'sandstone', { protectedBlock: true });
        }
      }
    }

    markMonument('Colosseum', cx, cz);
  }

  function generateWorld() {
    blocks.clear();
    protectedBlocks.clear();
    monuments = [];

    for (let x = -WORLD_RADIUS; x <= WORLD_RADIUS; x += 1) {
      for (let z = -WORLD_RADIUS; z <= WORLD_RADIUS; z += 1) {
        setGroundColumn(x, z, terrainHeight(x, z), 'grass');
      }
    }

    for (let x = -WORLD_RADIUS + 2; x <= WORLD_RADIUS - 2; x += 1) {
      for (let z = -WORLD_RADIUS + 2; z <= WORLD_RADIUS - 2; z += 1) {
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
        if (noise2(x * 5 + 13, z * 3 - 9) > 0.9) {
          placeTree(x, z);
        }
      }
    }

    buildStonehenge(-6, -4);
    buildStepPyramid(14, -8);
    buildZiggurat(-15, 11);
    buildColosseum(12, 12);

    nearbyMonuments = monuments.map((monument) => ({ ...monument, distance: 0 }));
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const normalized = clean.length === 3
      ? clean
          .split('')
          .map((chunk) => chunk + chunk)
          .join('')
      : clean;

    const int = Number.parseInt(normalized, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255
    };
  }

  function mixChannel(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function createBlockTexture(baseHex, accentHex) {
    const canvas = document.createElement('canvas');
    const size = 16;
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) return null;

    const base = hexToRgb(baseHex);
    const accent = hexToRgb(accentHex);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const pattern = Math.sin((x + 2) * 0.9 + (y + 1) * 1.25);
        const wobble = Math.sin((x + 1) * (y + 2) * 0.18);
        const t = Math.max(0, Math.min(1, 0.5 + pattern * 0.28 + wobble * 0.22));

        const r = mixChannel(base.r, accent.r, t);
        const g = mixChannel(base.g, accent.g, t);
        const b = mixChannel(base.b, accent.b, t);

        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapNearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  function initMaterials() {
    for (const [type, config] of Object.entries(BLOCK_DEFS)) {
      const texture = createBlockTexture(config.color, config.accent ?? config.color);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xffffff,
        roughness: config.roughness ?? 0.9,
        metalness: config.metalness ?? 0,
        transparent: Boolean(config.transparent),
        opacity: config.opacity ?? 1
      });

      if (type === 'water') material.depthWrite = false;
      materials[type] = material;
    }
  }

  function shouldRenderBlock(x, y, z, type) {
    const checks = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1]
    ];

    for (const [dx, dy, dz] of checks) {
      const neighborType = getBlock(x + dx, y + dy, z + dz);
      if (!neighborType) return true;
      if (!isOccludingType(neighborType)) return true;
      if (BLOCK_DEFS[type].transparent && neighborType !== type) return true;
    }

    return false;
  }

  function clearMeshes() {
    while (blockMeshes.length) {
      const mesh = blockMeshes.pop();
      worldGroup.remove(mesh);
    }
  }

  function rebuildWorldMeshes() {
    if (!worldGroup) return;

    clearMeshes();

    for (const [cellKey, type] of blocks.entries()) {
      if (!materials[type]) continue;
      const { x, y, z } = unpackKey(cellKey);
      if (!shouldRenderBlock(x, y, z, type)) continue;

      const mesh = new THREE.Mesh(cubeGeometry, materials[type]);
      mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      mesh.castShadow = type !== 'water';
      mesh.receiveShadow = true;

      if (type === 'water') {
        mesh.position.y -= 0.04;
        mesh.scale.y = 0.9;
      }

      mesh.userData = { x, y, z, type };
      worldGroup.add(mesh);
      blockMeshes.push(mesh);
    }
  }

  function webglSupported() {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  }

  function clampPitch() {
    const max = Math.PI / 2 - 0.06;
    pitch = Math.max(-max, Math.min(max, pitch));
  }

  function updateNearbyMonumentDistances() {
    nearbyMonuments = monuments
      .map((monument) => ({
        ...monument,
        distance: Math.round(Math.hypot(monument.x - player.x, monument.z - player.z))
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }

  function spawnPlayer() {
    const spawnX = -0.5;
    const spawnZ = 1.5;
    const ground = topSolidY(Math.floor(spawnX), Math.floor(spawnZ));

    player.x = spawnX;
    player.z = spawnZ;
    player.y = ground + 1.02;
    player.vy = 0;
    player.grounded = false;

    yaw = Math.PI * 0.85;
    pitch = -0.16;
    clampPitch();
  }

  function collidesAt(px, py, pz) {
    const offsets = [
      [0, 0],
      [PLAYER_RADIUS, PLAYER_RADIUS],
      [PLAYER_RADIUS, -PLAYER_RADIUS],
      [-PLAYER_RADIUS, PLAYER_RADIUS],
      [-PLAYER_RADIUS, -PLAYER_RADIUS]
    ];

    const sampleHeights = [0.04, PLAYER_HEIGHT * 0.5, PLAYER_HEIGHT - 0.06];

    for (const [ox, oz] of offsets) {
      const testX = px + ox;
      const testZ = pz + oz;
      const bx = Math.floor(testX);
      const bz = Math.floor(testZ);

      if (!inWorldXZ(bx, bz)) return true;

      for (const sampleHeight of sampleHeights) {
        const by = Math.floor(py + sampleHeight);
        if (isSolidType(getBlock(bx, by, bz))) return true;
      }
    }

    return false;
  }

  function moveHorizontal(dx, dz) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / STEP_SIZE));
    const stepX = dx / steps;
    const stepZ = dz / steps;

    for (let i = 0; i < steps; i += 1) {
      if (!collidesAt(player.x + stepX, player.y, player.z)) {
        player.x += stepX;
      }

      if (!collidesAt(player.x, player.y, player.z + stepZ)) {
        player.z += stepZ;
      }
    }
  }

  function moveVertical(dy) {
    const sign = Math.sign(dy);
    if (sign === 0) return true;

    let remaining = Math.abs(dy);
    while (remaining > 0) {
      const step = Math.min(0.05, remaining) * sign;
      if (collidesAt(player.x, player.y + step, player.z)) {
        return false;
      }
      player.y += step;
      remaining -= Math.abs(step);
    }

    return true;
  }

  function updateMovement(delta) {
    let forwardInput = 0;
    let strafeInput = 0;

    if (keyState.KeyW || keyState.ArrowUp) forwardInput += 1;
    if (keyState.KeyS || keyState.ArrowDown) forwardInput -= 1;
    if (keyState.KeyD || keyState.ArrowRight) strafeInput += 1;
    if (keyState.KeyA || keyState.ArrowLeft) strafeInput -= 1;

    forwardInput += -moveStick.y;
    strafeInput += moveStick.x;

    const vectorLength = Math.hypot(forwardInput, strafeInput);
    if (vectorLength > 1) {
      forwardInput /= vectorLength;
      strafeInput /= vectorLength;
    }

    const speed = keyState.ShiftLeft || keyState.ShiftRight ? SPRINT_SPEED : WALK_SPEED;

    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    const deltaX = (forwardX * forwardInput + rightX * strafeInput) * speed * delta;
    const deltaZ = (forwardZ * forwardInput + rightZ * strafeInput) * speed * delta;

    moveHorizontal(deltaX, deltaZ);

    if ((keyState.Space || jumpQueued) && player.grounded) {
      player.vy = JUMP_SPEED;
      player.grounded = false;
      jumpQueued = false;
    }

    player.vy -= GRAVITY * delta;
    const moved = moveVertical(player.vy * delta);

    if (!moved) {
      if (player.vy < 0) {
        player.grounded = true;
      }
      player.vy = 0;
    } else {
      player.grounded = false;
    }

    if (!collidesAt(player.x, player.y - 0.05, player.z)) {
      player.grounded = false;
    }

    while (collidesAt(player.x, player.y, player.z)) {
      player.y += 0.01;
    }
  }

  function updateCameraTransform() {
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    camera.position.set(player.x, player.y + EYE_HEIGHT, player.z);
  }

  function pickTarget() {
    if (!raycaster || !camera || !blockMeshes.length) return null;

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    raycaster.far = BREAK_RANGE;

    const hits = raycaster.intersectObjects(blockMeshes, false);
    if (!hits.length) return null;

    const hit = hits[0];
    const data = hit.object.userData;
    return {
      ...data,
      normal: hit.face ? hit.face.normal.clone() : null
    };
  }

  function blockIntersectsPlayer(x, y, z) {
    const blockMinX = x;
    const blockMaxX = x + 1;
    const blockMinY = y;
    const blockMaxY = y + 1;
    const blockMinZ = z;
    const blockMaxZ = z + 1;

    const playerMinX = player.x - PLAYER_RADIUS;
    const playerMaxX = player.x + PLAYER_RADIUS;
    const playerMinY = player.y;
    const playerMaxY = player.y + PLAYER_HEIGHT;
    const playerMinZ = player.z - PLAYER_RADIUS;
    const playerMaxZ = player.z + PLAYER_RADIUS;

    return (
      playerMaxX > blockMinX &&
      playerMinX < blockMaxX &&
      playerMaxY > blockMinY &&
      playerMinY < blockMaxY &&
      playerMaxZ > blockMinZ &&
      playerMinZ < blockMaxZ
    );
  }

  function mineTarget() {
    const hit = pickTarget();
    if (!hit) {
      message = 'No block in range.';
      return;
    }

    const type = getBlock(hit.x, hit.y, hit.z);
    if (!type) {
      message = 'No block selected.';
      return;
    }

    const config = BLOCK_DEFS[type];
    const cellKey = keyFor(hit.x, hit.y, hit.z);

    if (!config.breakable) {
      message = `${config.label} cannot be mined.`;
      return;
    }

    if (protectedBlocks.has(cellKey)) {
      message = 'Monument blocks are protected so landmarks remain recognizable.';
      return;
    }

    removeBlock(hit.x, hit.y, hit.z);
    minedCount += 1;
    message = `Mined ${config.label}.`;
    rebuildWorldMeshes();
  }

  function placeSelectedBlock() {
    const hit = pickTarget();
    if (!hit || !hit.normal) {
      message = 'Aim at a block face to place blocks.';
      return;
    }

    const targetX = hit.x + Math.round(hit.normal.x);
    const targetY = hit.y + Math.round(hit.normal.y);
    const targetZ = hit.z + Math.round(hit.normal.z);

    if (!inWorldXYZ(targetX, targetY, targetZ)) {
      message = 'Cannot place outside world bounds.';
      return;
    }

    if (getBlock(targetX, targetY, targetZ)) {
      message = 'Placement spot is occupied.';
      return;
    }

    if (blockIntersectsPlayer(targetX, targetY, targetZ)) {
      message = 'You are standing too close to place that block.';
      return;
    }

    setBlock(targetX, targetY, targetZ, selectedBlock);
    placedCount += 1;
    message = `Placed ${BLOCK_DEFS[selectedBlock].label}.`;
    rebuildWorldMeshes();
  }

  function regenerateWorld() {
    minedCount = 0;
    placedCount = 0;
    message = 'World regenerated with Stonehenge, pyramid, ziggurat, and colosseum.';

    generateWorld();
    rebuildWorldMeshes();
    spawnPlayer();
    updateNearbyMonumentDistances();
  }

  function selectHotbar(index) {
    selectedIndex = index;
  }

  function queueJump() {
    jumpQueued = true;
  }

  function updateJoystickFromPointer(stick, event, isLookStick) {
    if (stick.pointerId !== event.pointerId) return;

    const dx = event.clientX - stick.centerX;
    const dy = event.clientY - stick.centerY;
    const distance = Math.min(JOYSTICK_RADIUS, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * distance) / JOYSTICK_RADIUS;
    const ny = (Math.sin(angle) * distance) / JOYSTICK_RADIUS;

    stick.x = nx;
    stick.y = ny;

    const knobX = nx * JOYSTICK_RADIUS * 0.55;
    const knobY = ny * JOYSTICK_RADIUS * 0.55;

    if (isLookStick) {
      lookKnobX = knobX;
      lookKnobY = knobY;
    } else {
      moveKnobX = knobX;
      moveKnobY = knobY;
    }
  }

  function startMoveJoystick(event) {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

    const rect = event.currentTarget.getBoundingClientRect();
    moveStick.pointerId = event.pointerId;
    moveStick.centerX = rect.left + rect.width / 2;
    moveStick.centerY = rect.top + rect.height / 2;
    moveStick.x = 0;
    moveStick.y = 0;
    moveKnobX = 0;
    moveKnobY = 0;

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function updateMoveJoystick(event) {
    updateJoystickFromPointer(moveStick, event, false);
    event.preventDefault();
  }

  function releaseMoveJoystick(event) {
    if (moveStick.pointerId !== event.pointerId) return;

    moveStick.pointerId = null;
    moveStick.x = 0;
    moveStick.y = 0;
    moveKnobX = 0;
    moveKnobY = 0;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    event.preventDefault();
  }

  function startLookJoystick(event) {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

    const rect = event.currentTarget.getBoundingClientRect();
    lookStick.pointerId = event.pointerId;
    lookStick.centerX = rect.left + rect.width / 2;
    lookStick.centerY = rect.top + rect.height / 2;
    lookStick.x = 0;
    lookStick.y = 0;
    lookKnobX = 0;
    lookKnobY = 0;

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function updateLookJoystick(event) {
    updateJoystickFromPointer(lookStick, event, true);
    event.preventDefault();
  }

  function releaseLookJoystick(event) {
    if (lookStick.pointerId !== event.pointerId) return;

    lookStick.pointerId = null;
    lookStick.x = 0;
    lookStick.y = 0;
    lookKnobX = 0;
    lookKnobY = 0;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    event.preventDefault();
  }

  function fallbackColorAt(x, z) {
    const type = topVisibleType(x, z);
    return BLOCK_DEFS[type]?.color ?? '#000000';
  }

  onMount(async () => {
    isTouchDevice = window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints ?? 0) > 0;

    const loaderTimeout = new Promise((resolve) => {
      setTimeout(() => {
        resolve([{ status: 'rejected' }]);
      }, 7000);
    });

    const [threeLoad] = await Promise.race([
      Promise.allSettled([import('https://unpkg.com/three@0.179.1/build/three.module.js')]),
      loaderTimeout
    ]);

    if (threeLoad.status !== 'fulfilled') {
      fallbackMode = true;
      isLoading3D = false;
      message = '3D renderer could not be loaded. Showing fallback map.';
      generateWorld();
      return () => {};
    }

    THREE = threeLoad.value[0].value;

    if (!webglSupported()) {
      fallbackMode = true;
      isLoading3D = false;
      message = 'WebGL is unavailable. Showing fallback map.';
      generateWorld();
      return () => {};
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x89c7ff);
    scene.fog = new THREE.Fog(0x89c7ff, 28, 96);

    camera = new THREE.PerspectiveCamera(72, sceneHost.clientWidth / sceneHost.clientHeight, 0.1, 180);
    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
    renderer.shadowMap.enabled = true;
    sceneHost.appendChild(renderer.domElement);

    worldGroup = new THREE.Group();
    scene.add(worldGroup);

    cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    initMaterials();

    const sun = new THREE.DirectionalLight(0xffffff, 1.14);
    sun.position.set(20, 28, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    scene.add(new THREE.HemisphereLight(0xd9edff, 0x4f6d3a, 0.48));

    const underlay = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      new THREE.MeshStandardMaterial({ color: 0x5e7f49, roughness: 1 })
    );
    underlay.rotation.x = -Math.PI / 2;
    underlay.position.y = -0.01;
    underlay.receiveShadow = true;
    scene.add(underlay);

    generateWorld();
    rebuildWorldMeshes();
    spawnPlayer();
    updateNearbyMonumentDistances();
    updateCameraTransform();

    isLoading3D = false;

    let lastTime = performance.now();
    let fpsTime = 0;
    let fpsFrames = 0;
    let monumentTimer = 0;

    const renderLoop = () => {
      animationFrame = requestAnimationFrame(renderLoop);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (lookStick.pointerId !== null) {
        yaw -= lookStick.x * 2.8 * delta;
        pitch -= lookStick.y * 2.15 * delta;
        clampPitch();
      }

      updateMovement(delta);
      updateCameraTransform();
      renderer.render(scene, camera);

      monumentTimer += delta;
      if (monumentTimer >= 0.35) {
        updateNearbyMonumentDistances();
        monumentTimer = 0;
      }

      fpsTime += delta;
      fpsFrames += 1;
      if (fpsTime >= 0.5) {
        fps = Math.round(fpsFrames / fpsTime);
        fpsTime = 0;
        fpsFrames = 0;
      }
    };

    renderLoop();

    const handleResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = sceneHost.clientWidth / sceneHost.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
    };

    const handlePointerLockChange = () => {
      pointerLocked = document.pointerLockElement === renderer.domElement;
      if (pointerLocked) {
        message = 'Mouse locked. Mine with left click and place with right click.';
      }
    };

    const handleMouseMove = (event) => {
      if (!pointerLocked) return;
      yaw -= event.movementX * 0.0022;
      pitch -= event.movementY * 0.002;
      clampPitch();
    };

    const handleCanvasPointerDown = (event) => {
      if (isTouchDevice) return;

      if (!pointerLocked) {
        renderer.domElement.requestPointerLock();
        return;
      }

      if (event.button === 0) {
        mineTarget();
      } else if (event.button === 2) {
        placeSelectedBlock();
      }
    };

    const handleCanvasContextMenu = (event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event) => {
      if (event.code in keyState) {
        keyState[event.code] = true;
      }

      if (event.code === 'KeyE') {
        mineTarget();
        event.preventDefault();
      }

      if (event.code === 'KeyQ') {
        placeSelectedBlock();
        event.preventDefault();
      }

      if (event.code === 'KeyR') {
        regenerateWorld();
      }

      if (event.code.startsWith('Digit')) {
        const slot = Number(event.code.replace('Digit', '')) - 1;
        if (slot >= 0 && slot < HOTBAR.length) {
          selectedIndex = slot;
        }
      }
    };

    const handleKeyUp = (event) => {
      if (event.code in keyState) {
        keyState[event.code] = false;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    renderer.domElement.addEventListener('pointerdown', handleCanvasPointerDown);
    renderer.domElement.addEventListener('contextmenu', handleCanvasContextMenu);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);

      renderer.domElement.removeEventListener('pointerdown', handleCanvasPointerDown);
      renderer.domElement.removeEventListener('contextmenu', handleCanvasContextMenu);

      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
      }

      clearMeshes();

      for (const material of Object.values(materials)) {
        if (material.map) material.map.dispose();
        material.dispose();
      }

      cubeGeometry?.dispose();
      underlay.geometry.dispose();
      underlay.material.dispose();
      renderer.dispose();

      if (sceneHost.contains(renderer.domElement)) {
        sceneHost.removeChild(renderer.domElement);
      }
    };
  });
</script>

<main class="game-page">
  <div class="scene" bind:this={sceneHost} aria-label="MonumentCraft voxel world"></div>

  <section class="panel top-panel">
    <h1>MonumentCraft Voxel</h1>
    <p>Minecraft-style first-person sandbox with mine/place mechanics and recognizable monuments.</p>
    <p class="links">
      <a href="/sites">Open historical timeline</a>
      <a href="/sutes">Open /sutes alias</a>
    </p>
  </section>

  <section class="panel hud">
    <p><span>Mined</span><strong>{minedCount}</strong></p>
    <p><span>Placed</span><strong>{placedCount}</strong></p>
    <p><span>Selected</span><strong>{BLOCK_DEFS[selectedBlock].label}</strong></p>
    <p><span>FPS</span><strong>{fps || '...'}</strong></p>
    <div class="hud-actions">
      <button on:click={regenerateWorld}>Regenerate world</button>
      <button on:click={() => renderer?.domElement?.requestPointerLock()} disabled={isTouchDevice || fallbackMode || isLoading3D}>
        Lock mouse
      </button>
    </div>
  </section>

  <p class="panel message">{message}</p>

  {#if !fallbackMode}
    {#if isLoading3D}
      <p class="panel loading">Loading 3D renderer...</p>
    {:else}
      <div class="crosshair" aria-hidden="true">+</div>

      <section class="hotbar" aria-label="Block hotbar">
        {#each HOTBAR as blockId, index}
          <button class:selected={selectedIndex === index} on:click={() => selectHotbar(index)}>
            <span class="slot-index">{index + 1}</span>
            <span class="slot-swatch" style={`background: ${BLOCK_DEFS[blockId].color}`}></span>
            <span class="slot-label">{BLOCK_DEFS[blockId].label}</span>
          </button>
        {/each}
      </section>

      {#if isTouchDevice}
        <section class="touch-ui" aria-label="Touch controls">
          <div
            class="joystick"
            role="group"
            aria-label="Movement joystick"
            on:pointerdown={startMoveJoystick}
            on:pointermove={updateMoveJoystick}
            on:pointerup={releaseMoveJoystick}
            on:pointercancel={releaseMoveJoystick}
          >
            <div class="joystick-knob" style={`transform: translate(${moveKnobX}px, ${moveKnobY}px);`}></div>
          </div>

          <div class="touch-actions">
            <button on:pointerdown|preventDefault={queueJump}>Jump</button>
            <button on:pointerdown|preventDefault={mineTarget}>Mine</button>
            <button on:pointerdown|preventDefault={placeSelectedBlock}>Place</button>
          </div>

          <div
            class="joystick"
            role="group"
            aria-label="Look joystick"
            on:pointerdown={startLookJoystick}
            on:pointermove={updateLookJoystick}
            on:pointerup={releaseLookJoystick}
            on:pointercancel={releaseLookJoystick}
          >
            <div class="joystick-knob" style={`transform: translate(${lookKnobX}px, ${lookKnobY}px);`}></div>
          </div>
        </section>
      {/if}
    {/if}
  {:else}
    <section class="fallback-map" aria-label="Fallback map">
      {#each fallbackAxis as z}
        <div class="fallback-row">
          {#each fallbackAxis as x}
            <span class="fallback-cell" style={`background: ${fallbackColorAt(x, z)}`}></span>
          {/each}
        </div>
      {/each}
    </section>
  {/if}

  <section class="panel monuments">
    <h2>Monuments Nearby</h2>
    <ul>
      {#each nearbyMonuments as monument}
        <li>
          <strong>{monument.name}</strong>
          <span>{monument.distance} blocks away</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="panel controls">
    <h2>Controls</h2>
    <p>Desktop: WASD move, Space jump, Shift sprint, left click mine, right click place.</p>
    <p>Touch: left joystick move, right joystick look, tap Jump/Mine/Place buttons.</p>
  </section>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    overflow: hidden;
    font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
    background: #081224;
    color: #eaf4ff;
  }

  .game-page {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .scene {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 35%, #8fd2ff 0%, #78aee0 44%, #4f6e8f 100%);
  }

  .panel {
    position: absolute;
    z-index: 4;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 12px;
    background: rgba(8, 20, 33, 0.68);
    backdrop-filter: blur(2px);
  }

  .top-panel {
    top: 0.85rem;
    left: 0.85rem;
    max-width: min(40rem, 62vw);
    padding: 0.72rem 0.9rem;
  }

  .top-panel h1 {
    margin: 0;
    font-size: 1.2rem;
    letter-spacing: 0.02em;
  }

  .top-panel p {
    margin: 0.3rem 0 0;
    font-size: 0.9rem;
    color: #d6e8fb;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
  }

  .links a {
    color: #7cd9ff;
    text-decoration: none;
    font-weight: 700;
  }

  .links a:hover {
    text-decoration: underline;
  }

  .hud {
    top: 6.5rem;
    left: 0.85rem;
    padding: 0.62rem 0.7rem;
    max-width: min(29rem, 62vw);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.38rem 0.82rem;
  }

  .hud p {
    margin: 0;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.84rem;
  }

  .hud span {
    color: #b8cee4;
  }

  .hud strong {
    color: #f5fbff;
  }

  .hud-actions {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 0.48rem;
  }

  button {
    border: 1px solid rgba(255, 255, 255, 0.17);
    border-radius: 9px;
    background: rgba(36, 79, 36, 0.88);
    color: #f7ffed;
    font-weight: 700;
    cursor: pointer;
    padding: 0.52rem 0.72rem;
    font-size: 0.8rem;
  }

  button:hover {
    background: rgba(48, 103, 48, 0.9);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .message {
    top: 12.4rem;
    left: 0.85rem;
    margin: 0;
    max-width: min(32rem, 62vw);
    padding: 0.58rem 0.72rem;
    font-size: 0.84rem;
    color: #f6fffd;
  }

  .loading {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    max-width: min(24rem, 86vw);
    padding: 0.74rem 0.9rem;
    text-align: center;
  }

  .crosshair {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 5;
    transform: translate(-50%, -50%);
    font-size: 1.55rem;
    color: #ffffff;
    text-shadow: 0 0 6px #000;
    user-select: none;
    pointer-events: none;
  }

  .hotbar {
    position: absolute;
    left: 50%;
    bottom: 0.85rem;
    transform: translateX(-50%);
    z-index: 6;
    display: flex;
    gap: 0.34rem;
    flex-wrap: wrap;
    justify-content: center;
    width: min(96vw, 64rem);
    padding: 0.48rem;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 13px;
    background: rgba(6, 15, 25, 0.62);
    backdrop-filter: blur(2px);
  }

  .hotbar button {
    min-width: 86px;
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: 0.34rem 0.42rem;
    text-align: left;
    padding: 0.38rem 0.44rem;
    background: rgba(17, 40, 64, 0.82);
  }

  .hotbar button.selected {
    outline: 2px solid #ffd35d;
    background: rgba(58, 89, 32, 0.9);
  }

  .slot-index {
    font-size: 0.65rem;
    color: #d2d9e2;
    grid-column: 1;
  }

  .slot-swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    grid-column: 1;
  }

  .slot-label {
    font-size: 0.68rem;
    line-height: 1.05;
    color: #edf5ff;
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  .touch-ui {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 4.9rem;
    z-index: 7;
    display: grid;
    grid-template-columns: 108px auto 108px;
    align-items: end;
    padding: 0 0.75rem;
    pointer-events: none;
  }

  .joystick {
    width: 96px;
    height: 96px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: rgba(3, 10, 18, 0.56);
    position: relative;
    pointer-events: auto;
    touch-action: none;
  }

  .joystick-knob {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    margin-left: -22px;
    margin-top: -22px;
    border-radius: 999px;
    background: rgba(164, 196, 230, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.35);
  }

  .touch-actions {
    display: flex;
    justify-content: center;
    gap: 0.45rem;
    pointer-events: auto;
  }

  .touch-actions button {
    min-width: 74px;
    background: rgba(50, 96, 39, 0.92);
  }

  .monuments {
    right: 0.85rem;
    top: 0.85rem;
    width: min(23rem, 31vw);
    max-height: 42vh;
    overflow: auto;
    padding: 0.66rem;
  }

  .monuments h2,
  .controls h2 {
    margin: 0 0 0.48rem;
    font-size: 0.95rem;
  }

  .monuments ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.35rem;
  }

  .monuments li {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.34rem 0.4rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    font-size: 0.8rem;
  }

  .monuments strong {
    color: #f6f8ff;
  }

  .monuments span {
    color: #d1dfef;
    white-space: nowrap;
    font-size: 0.76rem;
  }

  .controls {
    right: 0.85rem;
    top: 44vh;
    width: min(23rem, 31vw);
    max-height: 31vh;
    overflow: auto;
    padding: 0.66rem;
  }

  .controls p {
    margin: 0.28rem 0 0;
    font-size: 0.79rem;
    line-height: 1.35;
    color: #d3e3f4;
  }

  .fallback-map {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
    place-content: center;
    gap: 0.05rem;
    background: linear-gradient(180deg, #89c7ff 0%, #7ebb62 64%, #4c7040 100%);
  }

  .fallback-row {
    display: flex;
    gap: 0.05rem;
  }

  .fallback-cell {
    width: min(1.1vw, 0.46rem);
    height: min(1.1vw, 0.46rem);
    border-radius: 1px;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  @media (max-width: 1080px) {
    .top-panel,
    .hud,
    .message {
      max-width: min(30rem, 72vw);
    }

    .monuments,
    .controls {
      width: min(20rem, 37vw);
    }
  }

  @media (max-width: 820px) {
    .top-panel {
      max-width: calc(100vw - 1.4rem);
      right: 0.7rem;
      left: 0.7rem;
    }

    .hud {
      top: 7.3rem;
      left: 0.7rem;
      right: 0.7rem;
      max-width: none;
    }

    .message {
      top: 13.8rem;
      left: 0.7rem;
      right: 0.7rem;
      max-width: none;
    }

    .monuments,
    .controls {
      right: 0.7rem;
      left: 0.7rem;
      width: auto;
      max-height: none;
    }

    .monuments {
      top: auto;
      bottom: 13.5rem;
      max-height: 17vh;
    }

    .controls {
      top: auto;
      bottom: 8.7rem;
      max-height: 4.4rem;
      overflow: hidden;
    }

    .hotbar button {
      min-width: 74px;
    }

    .slot-label {
      font-size: 0.62rem;
    }
  }

  @media (max-width: 560px) {
    .top-panel {
      padding: 0.58rem 0.66rem;
    }

    .top-panel h1 {
      font-size: 1.04rem;
    }

    .top-panel p {
      font-size: 0.8rem;
    }

    .hud {
      top: 6.5rem;
      grid-template-columns: 1fr;
      gap: 0.24rem;
      padding: 0.5rem 0.58rem;
    }

    .message {
      top: 14.4rem;
      font-size: 0.76rem;
      padding: 0.45rem 0.54rem;
    }

    .hotbar {
      bottom: 0.45rem;
      width: calc(100vw - 0.7rem);
      padding: 0.33rem;
      gap: 0.24rem;
    }

    .hotbar button {
      min-width: 66px;
      padding: 0.3rem 0.32rem;
    }

    .slot-swatch {
      width: 13px;
      height: 13px;
    }

    .touch-ui {
      bottom: 4.35rem;
      grid-template-columns: 88px auto 88px;
      padding: 0 0.32rem;
    }

    .joystick {
      width: 82px;
      height: 82px;
    }

    .joystick-knob {
      width: 38px;
      height: 38px;
      margin-left: -19px;
      margin-top: -19px;
    }

    .touch-actions {
      gap: 0.3rem;
    }

    .touch-actions button {
      min-width: 62px;
      padding: 0.44rem 0.45rem;
      font-size: 0.74rem;
    }

    .monuments {
      bottom: 12.2rem;
      max-height: 16vh;
      padding: 0.5rem;
    }

    .controls {
      bottom: 8rem;
      padding: 0.5rem;
    }

    .controls p {
      font-size: 0.72rem;
    }
  }
</style>
