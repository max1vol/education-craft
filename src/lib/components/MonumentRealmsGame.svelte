<svelte:head>
  <title>Monument Realms</title>
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { BIOMES, BIOME_BY_ID, type BiomeDefinition } from '$lib/data/monument-realms/biomes';
  import { BLOCKS, HOTBAR_DEFAULT, INVENTORY_DEFAULT, type BlockId } from '$lib/data/monument-realms/blocks';
  import {
    CHUNK_SIZE,
    GRAVITY,
    HOTBAR_SLOTS,
    INTERACT_RANGE,
    JOYSTICK_RADIUS,
    JUMP_SPEED,
    PLAYER_EYE_HEIGHT,
    PLAYER_HEIGHT,
    PLAYER_RADIUS,
    POINTER_SENSITIVITY_X,
    POINTER_SENSITIVITY_Y,
    PORTAL_COOLDOWN_SECONDS,
    RENDER_RADIUS,
    STEP_SIZE,
    TAP_DELAY_MS,
    WALK_SPEED,
    WORLD_MAX_Y,
    WORLD_MIN_Y,
    SPRINT_SPEED
  } from '$lib/data/monument-realms/world';
  import { chunkKeyFor } from '$lib/game/monument-realms/keys';
  import { createBlockMaterials } from '$lib/game/monument-realms/materials';
  import { MonumentAudioManager, type VolumeState } from '$lib/game/monument-realms/audio-manager';
  import { createWorldState } from '$lib/game/monument-realms/world-state';

  interface ChunkInstance {
    cx: number;
    cz: number;
    group: THREE.Group;
  }

  interface HitResult {
    x: number;
    y: number;
    z: number;
    prevX: number;
    prevY: number;
    prevZ: number;
    normal: { x: number; y: number; z: number };
    type: BlockId;
  }

  interface ParticleFx {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    gravity: number;
  }

  interface RuntimeDebugState {
    minedCount: number;
    placedCount: number;
    status: string;
    biome: string;
    monument: string;
    player: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number } | null;
    targetType: string | null;
  }

  interface RuntimeDebugApi {
    getState: () => RuntimeDebugState;
    tapMineAt: (clientX: number, clientY: number) => boolean;
    twoFingerPlace: () => boolean;
    tapPlaceAt: (clientX: number, clientY: number) => boolean;
    setPlayerView: (
      x: number,
      y: number,
      z: number,
      lookAtX: number,
      lookAtY: number,
      lookAtZ: number
    ) => void;
  }

  declare global {
    interface Window {
      __monumentRealmsDebug?: RuntimeDebugApi;
    }
  }

  const world = createWorldState();
  let audio: MonumentAudioManager | null = null;

  let sceneHost: HTMLDivElement;
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let worldGroup: THREE.Group;
  let cubeGeometry: THREE.BoxGeometry;
  let frameId = 0;

  const blockMaterials: Record<string, THREE.MeshStandardMaterial> = {};
  let materialsDispose: (() => void) | null = null;
  let portalCoreMaterial: THREE.MeshStandardMaterial | null = null;
  let aqueductWaterMaterial: THREE.MeshStandardMaterial | null = null;
  let highlightMesh: THREE.LineSegments;
  let ambientMotes: THREE.Points | null = null;
  const tempMatrix = new THREE.Matrix4();

  const chunks = new Map<string, ChunkInstance>();
  let loadedChunkCenterX = Number.NaN;
  let loadedChunkCenterZ = Number.NaN;

  const breakFx: ParticleFx[] = [];
  const placeFx: ParticleFx[] = [];
  const fxCubeGeometry = new THREE.BoxGeometry(0.11, 0.11, 0.11);

  let isTouchDevice = false;
  let pointerLocked = false;
  let loadingFailed = false;
  let loadingMessage = 'Preparing world...';

  let status = 'Click to capture the pointer. Break blocks with left click and place with right click.';
  let minedCount = 0;
  let placedCount = 0;
  let fps = 0;
  let biomeLabel = BIOMES[0].name;
  let monumentLabel = BIOMES[0].monumentName;
  let portalHint = `Portal leads to ${BIOME_BY_ID.get(BIOMES[0].portalTo)?.name ?? ''}`;

  let selectedSlot = 0;
  let hotbar: Array<BlockId | null> = [...HOTBAR_DEFAULT];
  let inventory: Record<string, number> = { ...INVENTORY_DEFAULT };

  let volumeState: VolumeState = { master: 0.8, music: 0.5, sfx: 0.7 };
  let audioUnlocked = false;

  $: selectedBlock = hotbar[selectedSlot] ?? null;

  const player = {
    x: BIOMES[0].center.x + 0.5,
    y: 0,
    z: BIOMES[0].center.z + 0.5,
    vy: 0,
    grounded: false
  };

  let yaw = Math.PI;
  let pitch = -0.1;

  const keys: Record<string, boolean> = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    ShiftLeft: false,
    ShiftRight: false
  };

  let jumpQueued = false;
  let portalCooldown = 0;
  const TOUCH_LOOK_SENSITIVITY_X = POINTER_SENSITIVITY_X * 1.6;
  const TOUCH_LOOK_SENSITIVITY_Y = POINTER_SENSITIVITY_Y * 1.6;
  const TOUCH_TAP_MOVE_THRESHOLD_PX = 12;
  const TOUCH_TAP_MAX_DURATION_MS = TAP_DELAY_MS * 3;
  const TOUCH_TAP_SAMPLE_OFFSETS = [
    [0, 0],
    [8, 0],
    [-8, 0],
    [0, 8],
    [0, -8],
    [12, 12],
    [-12, 12],
    [12, -12],
    [-12, -12]
  ] as const;
  let touchTapMoveThreshold = TOUCH_TAP_MOVE_THRESHOLD_PX;

  const moveStick = {
    pointerId: null as number | null,
    centerX: 0,
    centerY: 0,
    x: 0,
    y: 0
  };

  const touchLook = {
    identifier: null as number | null,
    lastX: 0,
    lastY: 0
  };

  const touchTap = {
    identifier: null as number | null,
    startX: 0,
    startY: 0,
    startTime: 0,
    moved: false
  };

  let moveKnobX = 0;
  let moveKnobY = 0;

  let currentTarget: HitResult | null = null;

  let showAudioPanel = false;

  const clampPitch = (): void => {
    const limit = Math.PI / 2 - 0.03;
    pitch = Math.max(-limit, Math.min(limit, pitch));
  };

  const ensureAudioUnlocked = (): void => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    audio?.unlock();
  };

  const setVolume = (key: keyof VolumeState, value: number): void => {
    if (!audio) return;
    volumeState = audio.setVolumes({ [key]: value });
  };

  const spawnBreakParticles = (x: number, y: number, z: number, type: BlockId): void => {
    const color = new THREE.Color(BLOCKS[type]?.color ?? '#dbe9ff');
    const particles = 10;

    for (let i = 0; i < particles; i += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: color.clone().offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.15),
        transparent: true,
        opacity: 0.85,
        roughness: 0.6,
        metalness: 0.05
      });

      const mesh = new THREE.Mesh(fxCubeGeometry, material);
      mesh.position.set(x + 0.5 + (Math.random() - 0.5) * 0.25, y + 0.52, z + 0.5 + (Math.random() - 0.5) * 0.25);
      mesh.scale.multiplyScalar(0.85 + Math.random() * 0.7);

      worldGroup.add(mesh);
      breakFx.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 4.1, 1.5 + Math.random() * 3.6, (Math.random() - 0.5) * 4.1),
        life: 0.6 + Math.random() * 0.35,
        maxLife: 0.6,
        gravity: 9.5
      });
    }

    while (breakFx.length > 220) {
      const stale = breakFx.shift();
      if (!stale) break;
      worldGroup.remove(stale.mesh);
      (stale.mesh.material as THREE.Material).dispose();
    }
  };

  const spawnPlaceParticles = (
    x: number,
    y: number,
    z: number,
    normal?: { x: number; y: number; z: number }
  ): void => {
    const outward = normal ?? { x: 0, y: 1, z: 0 };
    const length = Math.hypot(outward.x, outward.y, outward.z) || 1;
    const nx = outward.x / length;
    const ny = outward.y / length;
    const nz = outward.z / length;
    const faceOffset = 0.62;

    for (let i = 0; i < 6; i += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: '#b9f4ff',
        emissive: '#8edfff',
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.75,
        roughness: 0.4,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(fxCubeGeometry, material);
      const spawnDirection = new THREE.Vector3(nx, ny, nz);
      spawnDirection.x += (Math.random() - 0.5) * 0.36;
      spawnDirection.y += (Math.random() - 0.5) * 0.36;
      spawnDirection.z += (Math.random() - 0.5) * 0.36;
      if (spawnDirection.lengthSq() < 0.01) {
        spawnDirection.set(nx, ny, nz);
      }
      spawnDirection.normalize();
      const offsetDistance = faceOffset + 0.1 + Math.random() * 0.24;
      mesh.position.set(
        x + 0.5 + spawnDirection.x * offsetDistance,
        y + 0.5 + spawnDirection.y * offsetDistance,
        z + 0.5 + spawnDirection.z * offsetDistance
      );
      mesh.scale.multiplyScalar(0.7 + Math.random() * 0.5);

      worldGroup.add(mesh);
      placeFx.push({
        mesh,
        velocity: new THREE.Vector3(
          nx * 1.8 + (Math.random() - 0.5) * 1.2,
          ny * 1.8 + 0.45 + Math.random() * 1.05,
          nz * 1.8 + (Math.random() - 0.5) * 1.2
        ),
        life: 0.32 + Math.random() * 0.2,
        maxLife: 0.32,
        gravity: 4.5
      });
    }
  };

  const updateFx = (delta: number): void => {
    const updateBucket = (bucket: ParticleFx[]): void => {
      for (let i = bucket.length - 1; i >= 0; i -= 1) {
        const item = bucket[i];
        item.life -= delta;
        item.velocity.y -= item.gravity * delta;
        item.mesh.position.addScaledVector(item.velocity, delta);
        item.mesh.rotation.x += delta * 4.5;
        item.mesh.rotation.y += delta * 3.2;

        const material = item.mesh.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, item.life / item.maxLife);

        if (item.life <= 0) {
          worldGroup.remove(item.mesh);
          material.dispose();
          bucket.splice(i, 1);
        }
      }
    };

    updateBucket(breakFx);
    updateBucket(placeFx);
  };

  const createChunkMesh = (cx: number, cz: number): THREE.Group => {
    const group = new THREE.Group();
    group.userData = { cx, cz };

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;
    const positionsByType = new Map<BlockId, number[]>();

    for (let x = startX; x < startX + CHUNK_SIZE; x += 1) {
      for (let z = startZ; z < startZ + CHUNK_SIZE; z += 1) {
        const maxY = Math.min(WORLD_MAX_Y, world.getColumnRenderMaxY(x, z));

        for (let y = WORLD_MIN_Y; y <= maxY; y += 1) {
          const type = world.getBlockAt(x, y, z);
          if (!type) continue;
          if (!world.shouldRenderBlock(x, y, z, type)) continue;

          if (!positionsByType.has(type)) {
            positionsByType.set(type, []);
          }

          positionsByType.get(type)?.push(x + 0.5, y + 0.5, z + 0.5);
        }
      }
    }

    for (const [type, positions] of positionsByType.entries()) {
      if (!positions.length) continue;
      const count = positions.length / 3;
      const material = blockMaterials[type];
      if (!material) continue;

      const mesh = new THREE.InstancedMesh(cubeGeometry, material, count);
      mesh.castShadow = type !== 'water' && type !== 'portal_core';
      mesh.receiveShadow = true;

      if (BLOCKS[type]?.transparent) {
        mesh.renderOrder = type === 'portal_core' ? 4 : 2;
      }

      for (let i = 0; i < count; i += 1) {
        const offset = i * 3;
        tempMatrix.makeTranslation(positions[offset], positions[offset + 1], positions[offset + 2]);
        mesh.setMatrixAt(i, tempMatrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }

    return group;
  };

  const removeChunk = (cx: number, cz: number): void => {
    const key = chunkKeyFor(cx, cz);
    const chunk = chunks.get(key);
    if (!chunk) return;

    worldGroup.remove(chunk.group);
    chunks.delete(key);
  };

  const createChunk = (cx: number, cz: number): void => {
    const key = chunkKeyFor(cx, cz);
    if (chunks.has(key)) return;

    const group = createChunkMesh(cx, cz);
    worldGroup.add(group);
    chunks.set(key, { cx, cz, group });
  };

  const rebuildChunk = (cx: number, cz: number): void => {
    const key = chunkKeyFor(cx, cz);
    const existing = chunks.get(key);

    if (!existing) {
      createChunk(cx, cz);
      return;
    }

    worldGroup.remove(existing.group);
    const group = createChunkMesh(cx, cz);
    worldGroup.add(group);
    chunks.set(key, { cx, cz, group });
  };

  const refreshChunksNearBlock = (x: number, z: number): void => {
    const baseCx = Math.floor(x / CHUNK_SIZE);
    const baseCz = Math.floor(z / CHUNK_SIZE);

    rebuildChunk(baseCx, baseCz);

    if (x % CHUNK_SIZE === 0) rebuildChunk(baseCx - 1, baseCz);
    if ((x + 1) % CHUNK_SIZE === 0) rebuildChunk(baseCx + 1, baseCz);
    if (z % CHUNK_SIZE === 0) rebuildChunk(baseCx, baseCz - 1);
    if ((z + 1) % CHUNK_SIZE === 0) rebuildChunk(baseCx, baseCz + 1);
  };

  const ensureChunks = (force = false): void => {
    const cx = Math.floor(player.x / CHUNK_SIZE);
    const cz = Math.floor(player.z / CHUNK_SIZE);

    if (!force && cx === loadedChunkCenterX && cz === loadedChunkCenterZ) {
      return;
    }

    loadedChunkCenterX = cx;
    loadedChunkCenterZ = cz;

    const needed = new Set<string>();

    for (let x = cx - RENDER_RADIUS; x <= cx + RENDER_RADIUS; x += 1) {
      for (let z = cz - RENDER_RADIUS; z <= cz + RENDER_RADIUS; z += 1) {
        const key = chunkKeyFor(x, z);
        needed.add(key);
        createChunk(x, z);
      }
    }

    for (const [key, chunk] of chunks.entries()) {
      if (!needed.has(key)) {
        removeChunk(chunk.cx, chunk.cz);
      }
    }
  };

  const setPlayerPosition = (x: number, y: number, z: number): void => {
    player.x = x;
    player.y = y;
    player.z = z;
    player.vy = 0;
    player.grounded = false;

    while (collidesAt(player.x, player.y, player.z)) {
      player.y += 0.06;
      if (player.y > WORLD_MAX_Y + 8) break;
    }
  };

  const applyBiomeLighting = (biome: BiomeDefinition): void => {
    scene.background = new THREE.Color(biome.skyColor);
    scene.fog = new THREE.Fog(biome.fogColor, 42, 210);

    biomeLabel = biome.name;
    monumentLabel = biome.monumentName;
    const targetName = BIOME_BY_ID.get(biome.portalTo)?.name;
    portalHint = targetName ? `Portal leads to ${targetName}` : 'No portal target';

    audio?.playTrack(biome.musicTrackId);
  };

  const addToInventory = (type: BlockId, amount = 1): void => {
    const next = { ...inventory };
    next[type] = (next[type] ?? 0) + amount;
    inventory = next;

    if (!hotbar.includes(type) && BLOCKS[type]?.placeable) {
      const emptySlot = hotbar.findIndex((slot) => !slot);
      if (emptySlot >= 0) {
        hotbar = hotbar.map((slot, index) => (index === emptySlot ? type : slot));
      }
    }
  };

  const consumeInventory = (type: BlockId, amount = 1): boolean => {
    const current = inventory[type] ?? 0;
    if (current < amount) return false;

    const next = { ...inventory };
    const remaining = current - amount;
    if (remaining > 0) {
      next[type] = remaining;
    } else {
      delete next[type];
    }

    inventory = next;
    return true;
  };

  const collidesAt = (px: number, py: number, pz: number): boolean => {
    const minX = Math.floor(px - PLAYER_RADIUS);
    const maxX = Math.floor(px + PLAYER_RADIUS);
    const minY = Math.floor(py + 0.01);
    const maxY = Math.floor(py + PLAYER_HEIGHT - 0.02);
    const minZ = Math.floor(pz - PLAYER_RADIUS);
    const maxZ = Math.floor(pz + PLAYER_RADIUS);

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          if (world.isSolidForCollision(world.getBlockAt(x, y, z))) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const moveHorizontal = (dx: number, dz: number): void => {
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
  };

  const moveVertical = (dy: number): boolean => {
    const direction = Math.sign(dy);
    if (direction === 0) return true;

    let remaining = Math.abs(dy);
    while (remaining > 0) {
      const step = Math.min(0.06, remaining) * direction;
      if (collidesAt(player.x, player.y + step, player.z)) {
        return false;
      }

      player.y += step;
      remaining -= Math.abs(step);
    }

    return true;
  };

  const updateMovement = (delta: number): void => {
    let forward = 0;
    let strafe = 0;

    if (keys.KeyW || keys.ArrowUp) forward += 1;
    if (keys.KeyS || keys.ArrowDown) forward -= 1;
    if (keys.KeyD || keys.ArrowRight) strafe += 1;
    if (keys.KeyA || keys.ArrowLeft) strafe -= 1;

    forward += -moveStick.y;
    strafe += moveStick.x;

    const magnitude = Math.hypot(forward, strafe);
    if (magnitude > 1) {
      forward /= magnitude;
      strafe /= magnitude;
    }

    const isSprinting = keys.ShiftLeft || keys.ShiftRight;
    const speed = isSprinting ? SPRINT_SPEED : WALK_SPEED;

    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    const dx = (forwardX * forward + rightX * strafe) * speed * delta;
    const dz = (forwardZ * forward + rightZ * strafe) * speed * delta;

    moveHorizontal(dx, dz);

    if ((keys.Space || jumpQueued) && player.grounded) {
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

    if (player.y < -8) {
      const spawn = world.findSpawnPosition(world.getBiomeAt(player.x, player.z).id);
      setPlayerPosition(spawn.x, spawn.y, spawn.z);
      status = 'You fell. Respawned near the nearest monument biome.';
    }
  };

  const updateCamera = (): void => {
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch, yaw, 0);
    camera.position.set(player.x, player.y + PLAYER_EYE_HEIGHT, player.z);
  };

  const rayDirection = new THREE.Vector3();

  const voxelRaycastFromRay = (
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    maxDistance = INTERACT_RANGE
  ): HitResult | null => {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dir.x > 0 ? 1 : -1;
    const stepY = dir.y > 0 ? 1 : -1;
    const stepZ = dir.z > 0 ? 1 : -1;

    const tDeltaX = dir.x === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dir.x);
    const tDeltaY = dir.y === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dir.y);
    const tDeltaZ = dir.z === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / dir.z);

    let tMaxX =
      dir.x === 0 ? Number.POSITIVE_INFINITY : (dir.x > 0 ? x + 1 - origin.x : origin.x - x) * tDeltaX;
    let tMaxY =
      dir.y === 0 ? Number.POSITIVE_INFINITY : (dir.y > 0 ? y + 1 - origin.y : origin.y - y) * tDeltaY;
    let tMaxZ =
      dir.z === 0 ? Number.POSITIVE_INFINITY : (dir.z > 0 ? z + 1 - origin.z : origin.z - z) * tDeltaZ;

    let traveled = 0;
    let prevX = x;
    let prevY = y;
    let prevZ = z;
    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;

    for (let i = 0; i < 260; i += 1) {
      const block = world.getBlockAt(x, y, z);
      if (block) {
        return {
          x,
          y,
          z,
          prevX,
          prevY,
          prevZ,
          normal: { x: normalX, y: normalY, z: normalZ },
          type: block
        };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          prevX = x;
          prevY = y;
          prevZ = z;

          x += stepX;
          traveled = tMaxX;
          tMaxX += tDeltaX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          prevX = x;
          prevY = y;
          prevZ = z;

          z += stepZ;
          traveled = tMaxZ;
          tMaxZ += tDeltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else if (tMaxY < tMaxZ) {
        prevX = x;
        prevY = y;
        prevZ = z;

        y += stepY;
        traveled = tMaxY;
        tMaxY += tDeltaY;
        normalX = 0;
        normalY = -stepY;
        normalZ = 0;
      } else {
        prevX = x;
        prevY = y;
        prevZ = z;

        z += stepZ;
        traveled = tMaxZ;
        tMaxZ += tDeltaZ;
        normalX = 0;
        normalY = 0;
        normalZ = -stepZ;
      }

      if (traveled > maxDistance) {
        return null;
      }
    }

    return null;
  };

  const voxelRaycast = (maxDistance = INTERACT_RANGE): HitResult | null => {
    camera.getWorldDirection(rayDirection);
    return voxelRaycastFromRay(camera.position, rayDirection, maxDistance);
  };

  const voxelRaycastFromScreen = (
    clientX: number,
    clientY: number,
    maxDistance = INTERACT_RANGE
  ): HitResult | null => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return voxelRaycast(maxDistance);
    }

    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    rayDirection
      .set(ndcX, ndcY, 0.5)
      .unproject(camera)
      .sub(camera.position)
      .normalize();

    return voxelRaycastFromRay(camera.position, rayDirection, maxDistance);
  };

  const voxelRaycastFromTouchTap = (clientX: number, clientY: number): HitResult | null => {
    let best: { hit: HitResult; distance: number } | null = null;

    for (const [offsetX, offsetY] of TOUCH_TAP_SAMPLE_OFFSETS) {
      const hit = voxelRaycastFromScreen(clientX + offsetX, clientY + offsetY, INTERACT_RANGE + 0.85);
      if (!hit) continue;

      const dx = hit.x + 0.5 - camera.position.x;
      const dy = hit.y + 0.5 - camera.position.y;
      const dz = hit.z + 0.5 - camera.position.z;
      const distance = dx * dx + dy * dy + dz * dz;

      if (!best || distance < best.distance) {
        best = { hit, distance };
      }
    }

    return best?.hit ?? voxelRaycastFromScreen(clientX, clientY, INTERACT_RANGE + 1.4);
  };

  const blockIntersectsPlayer = (x: number, y: number, z: number): boolean => {
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
  };

  const mineTarget = (targetOverride: HitResult | null = null): void => {
    const hit = targetOverride ?? currentTarget ?? voxelRaycast();
    if (!hit) {
      status = 'No block in range.';
      return;
    }

    const type = world.getBlockAt(hit.x, hit.y, hit.z);
    if (!type) {
      status = 'No block selected.';
      return;
    }

    const blockDef = BLOCKS[type];
    if (!blockDef?.breakable) {
      status = `${blockDef?.label ?? 'This block'} cannot be broken.`;
      return;
    }

    if (world.isProtectedBlock(hit.x, hit.y, hit.z)) {
      status = 'Technical core blocks cannot be broken.';
      return;
    }

    world.removeBlock(hit.x, hit.y, hit.z);

    minedCount += 1;
    status = `Collected ${blockDef.label}.`;

    if (blockDef.placeable) {
      addToInventory(type, 1);
    }

    spawnBreakParticles(hit.x, hit.y, hit.z, type);
    audio?.playSfx('break');
    refreshChunksNearBlock(hit.x, hit.z);
  };

  const placeSelectedBlock = (targetOverride: HitResult | null = null): void => {
    if (!selectedBlock) {
      status = 'No block selected in hotbar.';
      return;
    }

    const def = BLOCKS[selectedBlock];
    if (!def?.placeable) {
      status = 'Selected block cannot be placed.';
      return;
    }

    if ((inventory[selectedBlock] ?? 0) <= 0) {
      status = `No ${def.label} left.`;
      return;
    }

    const hit = targetOverride ?? currentTarget ?? voxelRaycast();
    if (!hit) {
      status = 'Aim at a block face to place blocks.';
      return;
    }

    const targetX = hit.prevX;
    const targetY = hit.prevY;
    const targetZ = hit.prevZ;

    if (targetY <= WORLD_MIN_Y || targetY > WORLD_MAX_Y) {
      status = 'Placement is outside world height limits.';
      return;
    }

    if (world.getBlockAt(targetX, targetY, targetZ)) {
      status = 'Placement spot is occupied.';
      return;
    }

    if (world.isProtectedBlock(targetX, targetY, targetZ)) {
      status = 'Cannot overwrite protected technical core space.';
      return;
    }

    if (blockIntersectsPlayer(targetX, targetY, targetZ)) {
      status = 'Move away before placing there.';
      return;
    }

    if (!consumeInventory(selectedBlock, 1)) {
      status = `No ${def.label} left.`;
      return;
    }

    world.setBlock(targetX, targetY, targetZ, selectedBlock);

    placedCount += 1;
    status = `Placed ${def.label}.`;

    spawnPlaceParticles(targetX, targetY, targetZ, hit.normal);
    audio?.playSfx('place');
    refreshChunksNearBlock(targetX, targetZ);
  };

  const getDebugState = (): RuntimeDebugState => ({
    minedCount,
    placedCount,
    status,
    biome: biomeLabel,
    monument: monumentLabel,
    player: { x: player.x, y: player.y, z: player.z },
    target: currentTarget ? { x: currentTarget.x, y: currentTarget.y, z: currentTarget.z } : null,
    targetType: currentTarget ? world.getBlockAt(currentTarget.x, currentTarget.y, currentTarget.z) : null
  });

  const exposeDebugApi = (): void => {
    if (typeof window === 'undefined') return;

    window.__monumentRealmsDebug = {
      getState: () => getDebugState(),
      tapMineAt: (clientX: number, clientY: number) => {
        const before = minedCount;
        mineTarget(voxelRaycastFromTouchTap(clientX, clientY));
        return minedCount > before;
      },
      twoFingerPlace: () => {
        const before = placedCount;
        placeSelectedBlock();
        return placedCount > before;
      },
      tapPlaceAt: (clientX: number, clientY: number) => {
        const before = placedCount;
        placeSelectedBlock(voxelRaycastFromTouchTap(clientX, clientY));
        return placedCount > before;
      },
      setPlayerView: (x: number, y: number, z: number, lookAtX: number, lookAtY: number, lookAtZ: number) => {
        setPlayerPosition(x, y, z);
        const dx = lookAtX - x;
        const dz = lookAtZ - z;
        const eyeY = y + PLAYER_EYE_HEIGHT;
        const dy = lookAtY - eyeY;
        yaw = Math.atan2(-dx, -dz);
        const horizontalDistance = Math.max(0.001, Math.hypot(dx, dz));
        pitch = Math.atan2(dy, horizontalDistance);
        clampPitch();
        ensureChunks(true);
        updateCamera();
        updateTargetHighlight();
      }
    };
  };

  const updateTargetHighlight = (): void => {
    currentTarget = voxelRaycast();

    if (!currentTarget) {
      highlightMesh.visible = false;
      return;
    }

    highlightMesh.visible = true;
    highlightMesh.position.set(currentTarget.x + 0.5, currentTarget.y + 0.5, currentTarget.z + 0.5);
  };

  const updatePortalState = (delta: number): void => {
    if (portalCooldown > 0) {
      portalCooldown = Math.max(0, portalCooldown - delta);
      return;
    }

    const minX = Math.floor(player.x - PLAYER_RADIUS);
    const maxX = Math.floor(player.x + PLAYER_RADIUS);
    const minY = Math.floor(player.y + 0.2);
    const maxY = Math.floor(player.y + PLAYER_HEIGHT - 0.2);
    const minZ = Math.floor(player.z - PLAYER_RADIUS);
    const maxZ = Math.floor(player.z + PLAYER_RADIUS);

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          const portalTo = world.getPortalTargetAt(x, y, z);
          if (!portalTo) continue;

          const targetBiome = BIOME_BY_ID.get(portalTo);
          if (!targetBiome) continue;

          const arrival = world.getPortalArrival(targetBiome.id);
          setPlayerPosition(arrival.x, arrival.y, arrival.z);
          ensureChunks(true);

          applyBiomeLighting(targetBiome);
          portalCooldown = PORTAL_COOLDOWN_SECONDS;
          status = `Portal shift: ${targetBiome.name}.`;
          return;
        }
      }
    }
  };

  const selectSlot = (index: number): void => {
    if (index < 0 || index >= HOTBAR_SLOTS) return;
    selectedSlot = index;
  };

  const queueJump = (): void => {
    ensureAudioUnlocked();
    jumpQueued = true;
  };

  const updateJoystickFromPointer = (
    stick: { pointerId: number | null; centerX: number; centerY: number; x: number; y: number },
    event: PointerEvent
  ): void => {
    if (stick.pointerId !== event.pointerId) return;

    const dx = event.clientX - stick.centerX;
    const dy = event.clientY - stick.centerY;
    const distance = Math.min(JOYSTICK_RADIUS, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * distance) / JOYSTICK_RADIUS;
    const ny = (Math.sin(angle) * distance) / JOYSTICK_RADIUS;

    stick.x = nx;
    stick.y = ny;

    moveKnobX = nx * JOYSTICK_RADIUS * 0.55;
    moveKnobY = ny * JOYSTICK_RADIUS * 0.55;
  };

  const startMoveJoystick = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    ensureAudioUnlocked();

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    moveStick.pointerId = event.pointerId;
    moveStick.centerX = rect.left + rect.width / 2;
    moveStick.centerY = rect.top + rect.height / 2;
    moveStick.x = 0;
    moveStick.y = 0;
    moveKnobX = 0;
    moveKnobY = 0;

    target.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const updateMoveJoystick = (event: PointerEvent): void => {
    updateJoystickFromPointer(moveStick, event);
    event.preventDefault();
  };

  const releaseMoveJoystick = (event: PointerEvent): void => {
    if (moveStick.pointerId !== event.pointerId) return;

    const target = event.currentTarget as HTMLElement;
    moveStick.pointerId = null;
    moveStick.x = 0;
    moveStick.y = 0;
    moveKnobX = 0;
    moveKnobY = 0;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    event.preventDefault();
  };

  const clearTouchTapState = (): void => {
    touchTap.identifier = null;
    touchTap.startX = 0;
    touchTap.startY = 0;
    touchTap.startTime = 0;
    touchTap.moved = false;
  };

  const setTouchLookState = (touch: Touch | null): void => {
    if (!touch) {
      touchLook.identifier = null;
      touchLook.lastX = 0;
      touchLook.lastY = 0;
      return;
    }

    touchLook.identifier = touch.identifier;
    touchLook.lastX = touch.clientX;
    touchLook.lastY = touch.clientY;
  };

  const calibrateTouchTapThreshold = (): void => {
    const deviceRatio = Math.max(1, Number(window.devicePixelRatio ?? 1));
    const viewportScale = Math.max(1, Number(window.visualViewport?.scale ?? 1));
    touchTapMoveThreshold = Math.round((TOUCH_TAP_MOVE_THRESHOLD_PX * deviceRatio) / viewportScale);
  };

  const resolveStartBiome = (): BiomeDefinition => {
    const requested = new URLSearchParams(window.location.search).get('biome');
    if (!requested) return BIOMES[0];
    return BIOME_BY_ID.get(requested) ?? BIOMES[0];
  };

  const findTouchByIdentifier = (touches: TouchList, identifier: number): Touch | null => {
    for (let i = 0; i < touches.length; i += 1) {
      const item = touches.item(i);
      if (item && item.identifier === identifier) {
        return item;
      }
    }

    return null;
  };

  const webglAvailable = (): boolean => {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  };

  onMount(() => {
    if (!sceneHost) {
      return () => {};
    }

    isTouchDevice = window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints ?? 0) > 0;
    calibrateTouchTapThreshold();

    if (!webglAvailable()) {
      loadingFailed = true;
      loadingMessage = 'WebGL is unavailable in this browser.';
      return () => {};
    }

    audio = new MonumentAudioManager();
    volumeState = audio.getVolumes();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(72, sceneHost.clientWidth / sceneHost.clientHeight, 0.1, 240);
    worldGroup = new THREE.Group();
    scene.add(worldGroup);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    sceneHost.appendChild(renderer.domElement);

    cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    const registry = createBlockMaterials(BLOCKS);
    Object.assign(blockMaterials, registry.blockMaterials);
    portalCoreMaterial = registry.portalCoreMaterial;
    aqueductWaterMaterial = blockMaterials.aqueduct_water ?? null;
    materialsDispose = registry.dispose;
    const maxAnisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    for (const material of Object.values(blockMaterials)) {
      if (!material.map) continue;
      material.map.anisotropy = maxAnisotropy;
      material.map.needsUpdate = true;
    }
    if (aqueductWaterMaterial?.map) {
      aqueductWaterMaterial.map.repeat.set(1.18, 1.18);
      aqueductWaterMaterial.map.needsUpdate = true;
    }

    highlightMesh = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 })
    );
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    const hemiLight = new THREE.HemisphereLight(0xdcf1ff, 0x50453f, 0.78);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfff7ef, 1.32);
    sun.position.set(28, 38, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 175;
    sun.shadow.camera.left = -72;
    sun.shadow.camera.right = 72;
    sun.shadow.camera.top = 72;
    sun.shadow.camera.bottom = -72;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xe8f3ff, 0.22));

    const moteCount = 320;
    const motePositions = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i += 1) {
      const i3 = i * 3;
      motePositions[i3] = (Math.random() - 0.5) * 70;
      motePositions[i3 + 1] = 4 + Math.random() * 28;
      motePositions[i3 + 2] = (Math.random() - 0.5) * 70;
    }

    const moteGeometry = new THREE.BufferGeometry();
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const moteMaterial = new THREE.PointsMaterial({
      color: '#d6f3ff',
      size: 0.13,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    ambientMotes = new THREE.Points(moteGeometry, moteMaterial);
    scene.add(ambientMotes);

    const firstBiome = resolveStartBiome();
    const spawn = world.findSpawnPosition(firstBiome.id);
    setPlayerPosition(spawn.x, spawn.y, spawn.z);
    const lookTargetX = firstBiome.center.x + firstBiome.spawnLookAtOffset.x + 0.5;
    const lookTargetZ = firstBiome.center.z + firstBiome.spawnLookAtOffset.z + 0.5;
    const lookDx = lookTargetX - spawn.x;
    const lookDz = lookTargetZ - spawn.z;
    yaw = Math.atan2(-lookDx, -lookDz);
    pitch = -0.12;
    applyBiomeLighting(firstBiome);
    ensureChunks(true);
    exposeDebugApi();

    loadingMessage = '';
    let lastTick = performance.now();
    let fpsTime = 0;
    let fpsFrames = 0;

    const renderLoop = (): void => {
      frameId = requestAnimationFrame(renderLoop);

      const now = performance.now();
      const delta = Math.min((now - lastTick) / 1000, 0.05);
      lastTick = now;

      updateMovement(delta);
      ensureChunks(false);

      const biome = world.getBiomeAt(player.x, player.z);
      if (biome.name !== biomeLabel) {
        applyBiomeLighting(biome);
      }

      updateCamera();
      updateTargetHighlight();
      updatePortalState(delta);
      updateFx(delta);

      if (ambientMotes) {
        ambientMotes.position.set(player.x, 0, player.z);
        ambientMotes.rotation.y += delta * 0.03;
      }

      if (portalCoreMaterial) {
        portalCoreMaterial.opacity = 0.56 + Math.sin(now * 0.007) * 0.12;
        portalCoreMaterial.emissiveIntensity = 0.5 + Math.sin(now * 0.005) * 0.14;
      }

      if (aqueductWaterMaterial?.map) {
        aqueductWaterMaterial.map.offset.x = (now * 0.00018) % 1;
        aqueductWaterMaterial.map.offset.y = (Math.sin(now * 0.0014) * 0.06 + 1) % 1;
        aqueductWaterMaterial.opacity = 0.74 + Math.sin(now * 0.0024) * 0.05;
        aqueductWaterMaterial.emissiveIntensity = 0.12 + Math.sin(now * 0.0032) * 0.04;
      }

      renderer.render(scene, camera);

      fpsTime += delta;
      fpsFrames += 1;
      if (fpsTime >= 0.5) {
        fps = Math.round(fpsFrames / fpsTime);
        fpsTime = 0;
        fpsFrames = 0;
      }
    };

    renderLoop();

    const handleResize = (): void => {
      const width = sceneHost.clientWidth;
      const height = sceneHost.clientHeight;
      calibrateTouchTapThreshold();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const handlePointerLockChange = (): void => {
      pointerLocked = document.pointerLockElement === renderer.domElement;
      if (pointerLocked) {
        status = 'Pointer captured. Left click breaks blocks, right click places blocks.';
      }
    };

    const handleMouseMove = (event: MouseEvent): void => {
      if (!pointerLocked) return;
      yaw -= event.movementX * POINTER_SENSITIVITY_X;
      pitch -= event.movementY * POINTER_SENSITIVITY_Y;
      clampPitch();
    };

    const handlePointerDown = (event: PointerEvent): void => {
      ensureAudioUnlocked();
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

    const handleContextMenu = (event: MouseEvent): void => {
      event.preventDefault();
    };

    const handleWheel = (event: WheelEvent): void => {
      if (Math.abs(event.deltaY) < 0.1) return;
      const direction = event.deltaY > 0 ? 1 : -1;
      selectedSlot = (selectedSlot + direction + HOTBAR_SLOTS) % HOTBAR_SLOTS;
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      ensureAudioUnlocked();
      if (event.code in keys) {
        keys[event.code] = true;
      }

      if (event.code === 'KeyE') {
        mineTarget();
        event.preventDefault();
      }

      if (event.code === 'KeyQ') {
        placeSelectedBlock();
        event.preventDefault();
      }

      if (event.code.startsWith('Digit')) {
        const slot = Number(event.code.replace('Digit', '')) - 1;
        if (slot >= 0 && slot < HOTBAR_SLOTS) {
          selectedSlot = slot;
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.code in keys) {
        keys[event.code] = false;
      }
    };

    const handleTouchStart = (event: TouchEvent): void => {
      if (!isTouchDevice) return;
      ensureAudioUnlocked();
      event.preventDefault();

      const activeTouches = event.targetTouches;

      if (activeTouches.length >= 2) {
        clearTouchTapState();
        setTouchLookState(null);
        placeSelectedBlock();
        return;
      }

      if (activeTouches.length === 1) {
        const touch = activeTouches.item(0);
        if (!touch) return;
        touchTap.identifier = touch.identifier;
        touchTap.startX = touch.clientX;
        touchTap.startY = touch.clientY;
        touchTap.startTime = performance.now();
        touchTap.moved = false;
        setTouchLookState(touch);
      }
    };

    const handleTouchMove = (event: TouchEvent): void => {
      if (!isTouchDevice) return;
      event.preventDefault();
      if (touchLook.identifier === null) return;

      const touch = findTouchByIdentifier(event.targetTouches, touchLook.identifier);
      if (!touch) return;

      const dx = touch.clientX - touchLook.lastX;
      const dy = touch.clientY - touchLook.lastY;
      if (dx !== 0 || dy !== 0) {
        yaw -= dx * TOUCH_LOOK_SENSITIVITY_X;
        pitch -= dy * TOUCH_LOOK_SENSITIVITY_Y;
        clampPitch();
      }

      touchLook.lastX = touch.clientX;
      touchLook.lastY = touch.clientY;

      if (touchTap.identifier === touch.identifier && !touchTap.moved) {
        const movedDistance = Math.hypot(touch.clientX - touchTap.startX, touch.clientY - touchTap.startY);
        if (movedDistance > touchTapMoveThreshold) {
          touchTap.moved = true;
        }
      }

    };

    const handleTouchEnd = (event: TouchEvent): void => {
      if (!isTouchDevice) return;

      let endedTap = false;
      let shouldMine = false;
      let endedLook = false;
      let tapStartX = touchTap.startX;
      let tapStartY = touchTap.startY;
      let tapEndX = 0;
      let tapEndY = 0;

      for (let i = 0; i < event.changedTouches.length; i += 1) {
        const changedTouch = event.changedTouches.item(i);
        if (!changedTouch) continue;

        if (touchTap.identifier === changedTouch.identifier) {
          endedTap = true;
          const duration = performance.now() - touchTap.startTime;
          shouldMine = !touchTap.moved && duration <= TOUCH_TAP_MAX_DURATION_MS;
          tapStartX = touchTap.startX;
          tapStartY = touchTap.startY;
          tapEndX = changedTouch.clientX;
          tapEndY = changedTouch.clientY;
        }

        if (touchLook.identifier === changedTouch.identifier) {
          endedLook = true;
        }
      }

      if (endedTap) {
        clearTouchTapState();
        if (shouldMine) {
          const tapHit =
            voxelRaycastFromTouchTap(tapStartX, tapStartY) ?? voxelRaycastFromTouchTap(tapEndX, tapEndY);
          mineTarget(tapHit);
        }
      }

      if (endedLook) {
        const nextLookTouch = event.targetTouches.item(0);
        setTouchLookState(nextLookTouch);
      }

      if (event.targetTouches.length === 0) {
        clearTouchTapState();
        setTouchLookState(null);
      }

      event.preventDefault();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      renderer.domElement.addEventListener('touchend', handleTouchEnd, { passive: false });
      renderer.domElement.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      cancelAnimationFrame(frameId);
      clearTouchTapState();
      setTouchLookState(null);

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);

      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      renderer.domElement.removeEventListener('touchcancel', handleTouchEnd);
      delete window.__monumentRealmsDebug;

      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
      }

      for (const chunk of chunks.values()) {
        worldGroup.remove(chunk.group);
      }
      chunks.clear();

      for (const item of breakFx) {
        worldGroup.remove(item.mesh);
        (item.mesh.material as THREE.Material).dispose();
      }
      for (const item of placeFx) {
        worldGroup.remove(item.mesh);
        (item.mesh.material as THREE.Material).dispose();
      }

      highlightMesh.geometry.dispose();
      (highlightMesh.material as THREE.Material).dispose();

      ambientMotes?.geometry.dispose();
      (ambientMotes?.material as THREE.Material | undefined)?.dispose();

      fxCubeGeometry.dispose();
      cubeGeometry.dispose();
      materialsDispose?.();
      audio?.dispose();

      renderer.dispose();
      if (sceneHost && renderer.domElement.parentElement === sceneHost) {
        sceneHost.removeChild(renderer.domElement);
      }
    };
  });
</script>

<main class="game-page">
  <div class="scene" bind:this={sceneHost} aria-label="Monument Realms voxel world"></div>

  <p class="fps-chip" aria-label="Frame rate">FPS {fps || '...'}</p>
  <p class="location-chip" aria-label="Current location">{monumentLabel} · {biomeLabel}</p>

  <button
    class="panel audio-toggle"
    aria-label="Toggle audio controls"
    on:click={() => (showAudioPanel = !showAudioPanel)}
  >
    Audio
  </button>

  {#if showAudioPanel}
    <section class="panel audio-panel">
      <label>
        <span>M {Math.round(volumeState.master * 100)}%</span>
        <input type="range" min="0" max="1" step="0.01" value={volumeState.master} on:input={(event) => setVolume('master', Number((event.currentTarget as HTMLInputElement).value))} />
      </label>
      <label>
        <span>B {Math.round(volumeState.music * 100)}%</span>
        <input type="range" min="0" max="1" step="0.01" value={volumeState.music} on:input={(event) => setVolume('music', Number((event.currentTarget as HTMLInputElement).value))} />
      </label>
      <label>
        <span>S {Math.round(volumeState.sfx * 100)}%</span>
        <input type="range" min="0" max="1" step="0.01" value={volumeState.sfx} on:input={(event) => setVolume('sfx', Number((event.currentTarget as HTMLInputElement).value))} />
      </label>
    </section>
  {/if}

  {#if loadingMessage}
    <p class="panel loading">{loadingMessage}</p>
  {/if}

  {#if !loadingFailed}
    <div class="crosshair" aria-hidden="true">+</div>

    <section class="hotbar" aria-label="Block hotbar">
      {#each hotbar as blockId, index}
        <button class:selected={selectedSlot === index} on:click={() => selectSlot(index)} aria-label={`Slot ${index + 1}`}>
          <span class="slot-swatch" style={`background: ${blockId ? BLOCKS[blockId]?.color : '#444'}`}></span>
          <span class="slot-count">{blockId ? inventory[blockId] ?? 0 : 0}</span>
        </button>
      {/each}
    </section>

    {#if isTouchDevice}
      <section class="touch-ui" aria-label="Touch controls">
        <div
          class="joystick move-joystick"
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
          <button class="jump-button" on:pointerdown|preventDefault={queueJump}>Jump</button>
        </div>
      </section>
    {/if}
  {/if}
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    overflow: hidden;
    font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
    background: #08111c;
    color: #ebf4ff;
  }

  .game-page {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-right: env(safe-area-inset-right, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --safe-left: env(safe-area-inset-left, 0px);
  }

  .scene {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 34%, #b8d9ff 0%, #789ab8 45%, #3b4f66 100%);
  }

  .panel {
    position: absolute;
    z-index: 6;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(8, 20, 33, 0.68);
    backdrop-filter: blur(2px);
  }

  .fps-chip {
    position: absolute;
    top: calc(var(--safe-top) + 0.62rem);
    left: calc(var(--safe-left) + 0.62rem);
    z-index: 7;
    margin: 0;
    padding: 0.28rem 0.5rem;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(8, 20, 33, 0.56);
    color: #d8e9fb;
    font-size: 0.66rem;
    line-height: 1;
    letter-spacing: 0.02em;
    pointer-events: none;
    backdrop-filter: blur(2px);
  }

  .location-chip {
    position: absolute;
    top: calc(var(--safe-top) + 0.62rem);
    right: calc(var(--safe-right) + 3.7rem);
    z-index: 7;
    margin: 0;
    padding: 0.3rem 0.52rem;
    border-radius: 9px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(8, 20, 33, 0.46);
    color: #dcecff;
    font-size: 0.63rem;
    line-height: 1;
    letter-spacing: 0.02em;
    pointer-events: none;
    backdrop-filter: blur(2px);
    max-width: min(48vw, 17rem);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .audio-toggle {
    top: calc(var(--safe-top) + 0.8rem);
    right: calc(var(--safe-right) + 0.8rem);
    z-index: 7;
    font: inherit;
    color: #e6f3ff;
    padding: 0.38rem 0.65rem;
    border-radius: 10px;
    cursor: pointer;
  }

  .audio-panel {
    top: calc(var(--safe-top) + 3.2rem);
    right: calc(var(--safe-right) + 0.8rem);
    width: min(13rem, 34vw);
    padding: 0.45rem 0.5rem;
    display: grid;
    gap: 0.2rem;
    z-index: 7;
  }

  .audio-panel label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.66rem;
    color: #d8e9fb;
  }

  .audio-panel span {
    min-width: 2.2rem;
  }

  .audio-panel input {
    flex: 1;
  }

  .loading {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    padding: 0.75rem 0.9rem;
  }

  .crosshair {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 8;
    font-size: 1.5rem;
    color: #fff;
    text-shadow: 0 0 6px #000;
    user-select: none;
    pointer-events: none;
  }

  .hotbar {
    position: absolute;
    left: calc(var(--safe-left) + 0.3rem);
    right: calc(var(--safe-right) + 0.3rem);
    bottom: calc(var(--safe-bottom) + 0.85rem);
    margin: 0 auto;
    width: min(calc(100vw - var(--safe-left) - var(--safe-right) - 0.6rem), 34rem);
    z-index: 9;
    display: flex;
    justify-content: center;
    gap: 0.22rem;
    flex-wrap: nowrap;
    padding: 0.3rem;
    border-radius: 11px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(6, 16, 28, 0.65);
    backdrop-filter: blur(2px);
  }

  .hotbar button {
    width: 36px;
    min-width: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.18rem;
    padding: 0.2rem 0.12rem;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(20, 44, 68, 0.82);
    color: #e9f6ff;
    cursor: pointer;
    font: inherit;
  }

  .hotbar button.selected {
    outline: 1px solid #ffd768;
    background: rgba(58, 89, 32, 0.92);
  }

  .slot-swatch {
    width: 11px;
    height: 11px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 3px;
  }

  .slot-count {
    font-size: 0.58rem;
    color: #f9ffdf;
    line-height: 1;
  }

  .touch-ui {
    position: absolute;
    left: calc(var(--safe-left) + 0.72rem);
    right: calc(var(--safe-right) + 0.72rem);
    bottom: calc(var(--safe-bottom) + 4.6rem);
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: end;
    pointer-events: none;
  }

  .joystick {
    width: 96px;
    height: 96px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: rgba(4, 12, 20, 0.56);
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
    background: rgba(166, 198, 232, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.78);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.35);
  }

  .move-joystick {
    flex: 0 0 auto;
  }

  .touch-actions {
    pointer-events: auto;
    display: flex;
    align-items: center;
  }

  .jump-button {
    width: 94px;
    height: 94px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 999px;
    background: rgba(39, 82, 36, 0.92);
    color: #f4ffe8;
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    touch-action: manipulation;
  }

  @media (max-width: 980px) {
    .audio-panel {
      width: min(11rem, 46vw);
    }
  }

  @media (max-width: 820px) {
    .audio-panel {
      left: calc(var(--safe-left) + 0.7rem);
      right: calc(var(--safe-right) + 0.7rem);
      width: auto;
      max-width: none;
    }

    .audio-panel {
      top: calc(var(--safe-top) + 3.2rem);
    }

    .hotbar button {
      width: 34px;
      min-width: 34px;
    }
  }

  @media (max-width: 560px) {
    .fps-chip {
      top: calc(var(--safe-top) + 0.48rem);
      left: calc(var(--safe-left) + 0.48rem);
      padding: 0.24rem 0.42rem;
      font-size: 0.62rem;
    }

    .audio-panel {
      top: 3rem;
      padding: 0.4rem 0.46rem;
    }

    .audio-toggle {
      padding: 0.32rem 0.52rem;
      font-size: 0.76rem;
    }

    .location-chip {
      top: calc(var(--safe-top) + 0.46rem);
      right: calc(var(--safe-right) + 3.2rem);
      max-width: min(54vw, 14rem);
      font-size: 0.59rem;
      padding: 0.22rem 0.4rem;
    }

    .hotbar {
      bottom: calc(var(--safe-bottom) + 0.45rem);
      width: min(calc(100vw - var(--safe-left) - var(--safe-right) - 0.6rem), 34rem);
      gap: 0.2rem;
      padding: 0.24rem;
    }

    .hotbar button {
      width: 30px;
      min-width: 30px;
      padding: 0.18rem 0.08rem;
    }

    .touch-ui {
      left: calc(var(--safe-left) + 0.3rem);
      right: calc(var(--safe-right) + 0.3rem);
      bottom: calc(var(--safe-bottom) + 3.5rem);
    }

    .joystick {
      width: 82px;
      height: 82px;
    }

    .joystick-knob {
      width: 36px;
      height: 36px;
      margin-left: -18px;
      margin-top: -18px;
    }

    .jump-button {
      width: 80px;
      height: 80px;
      font-size: 0.72rem;
    }
  }
</style>
