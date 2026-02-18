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

  const moveStick = {
    pointerId: null as number | null,
    centerX: 0,
    centerY: 0,
    x: 0,
    y: 0
  };

  const lookStick = {
    pointerId: null as number | null,
    centerX: 0,
    centerY: 0,
    x: 0,
    y: 0
  };

  let moveKnobX = 0;
  let moveKnobY = 0;
  let lookKnobX = 0;
  let lookKnobY = 0;

  let currentTarget: HitResult | null = null;
  let queuedSingleTap: ReturnType<typeof setTimeout> | null = null;

  let monumentsByDistance = world.getMonumentDistances(player.x, player.z);

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

  const spawnPlaceParticles = (x: number, y: number, z: number): void => {
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
      mesh.position.set(x + 0.5, y + 0.55, z + 0.5);
      mesh.scale.multiplyScalar(0.7 + Math.random() * 0.5);

      worldGroup.add(mesh);
      placeFx.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 1.8, 0.6 + Math.random() * 1.4, (Math.random() - 0.5) * 1.8),
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
    scene.fog = new THREE.Fog(biome.fogColor, 35, 165);

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

  const voxelRaycast = (maxDistance = INTERACT_RANGE): HitResult | null => {
    const origin = camera.position;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

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

  const mineTarget = (): void => {
    const hit = currentTarget ?? voxelRaycast();
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
      status = 'Landmark and portal blocks are protected.';
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

  const placeSelectedBlock = (): void => {
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

    const hit = currentTarget ?? voxelRaycast();
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
      status = 'Cannot overwrite protected landmark space.';
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

    spawnPlaceParticles(targetX, targetY, targetZ);
    audio?.playSfx('place');
    refreshChunksNearBlock(targetX, targetZ);
  };

  const updateMonumentDistances = (): void => {
    monumentsByDistance = world.getMonumentDistances(player.x, player.z);
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
    jumpQueued = true;
  };

  const updateJoystickFromPointer = (
    stick: { pointerId: number | null; centerX: number; centerY: number; x: number; y: number },
    event: PointerEvent,
    isLook: boolean
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

    const knobX = nx * JOYSTICK_RADIUS * 0.55;
    const knobY = ny * JOYSTICK_RADIUS * 0.55;

    if (isLook) {
      lookKnobX = knobX;
      lookKnobY = knobY;
    } else {
      moveKnobX = knobX;
      moveKnobY = knobY;
    }
  };

  const startMoveJoystick = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

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
    updateJoystickFromPointer(moveStick, event, false);
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

  const startLookJoystick = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    lookStick.pointerId = event.pointerId;
    lookStick.centerX = rect.left + rect.width / 2;
    lookStick.centerY = rect.top + rect.height / 2;
    lookStick.x = 0;
    lookStick.y = 0;
    lookKnobX = 0;
    lookKnobY = 0;

    target.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const updateLookJoystick = (event: PointerEvent): void => {
    updateJoystickFromPointer(lookStick, event, true);
    event.preventDefault();
  };

  const releaseLookJoystick = (event: PointerEvent): void => {
    if (lookStick.pointerId !== event.pointerId) return;

    const target = event.currentTarget as HTMLElement;
    lookStick.pointerId = null;
    lookStick.x = 0;
    lookStick.y = 0;
    lookKnobX = 0;
    lookKnobY = 0;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    event.preventDefault();
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
    renderer.toneMappingExposure = 1.08;
    sceneHost.appendChild(renderer.domElement);

    cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    const registry = createBlockMaterials(BLOCKS);
    Object.assign(blockMaterials, registry.blockMaterials);
    portalCoreMaterial = registry.portalCoreMaterial;
    materialsDispose = registry.dispose;

    highlightMesh = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 })
    );
    highlightMesh.visible = false;
    scene.add(highlightMesh);

    const hemiLight = new THREE.HemisphereLight(0xdcf1ff, 0x50453f, 0.56);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfff7ef, 1.08);
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

    const firstBiome = BIOMES[0];
    const spawn = world.findSpawnPosition(firstBiome.id);
    setPlayerPosition(spawn.x, spawn.y, spawn.z);
    const lookDx = firstBiome.center.x + 0.5 - spawn.x;
    const lookDz = firstBiome.center.z + 0.5 - spawn.z;
    yaw = Math.atan2(-lookDx, -lookDz);
    pitch = -0.12;
    applyBiomeLighting(firstBiome);
    ensureChunks(true);

    loadingMessage = '';
    updateMonumentDistances();

    let lastTick = performance.now();
    let fpsTime = 0;
    let fpsFrames = 0;
    let monumentTimer = 0;

    const renderLoop = (): void => {
      frameId = requestAnimationFrame(renderLoop);

      const now = performance.now();
      const delta = Math.min((now - lastTick) / 1000, 0.05);
      lastTick = now;

      if (lookStick.pointerId !== null) {
        yaw -= lookStick.x * 2.6 * delta;
        pitch -= lookStick.y * 2.2 * delta;
        clampPitch();
      }

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

      renderer.render(scene, camera);

      monumentTimer += delta;
      if (monumentTimer > 0.45) {
        updateMonumentDistances();
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

    const handleResize = (): void => {
      const width = sceneHost.clientWidth;
      const height = sceneHost.clientHeight;
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

      if (event.touches.length >= 2) {
        if (queuedSingleTap) {
          clearTimeout(queuedSingleTap);
          queuedSingleTap = null;
        }
        placeSelectedBlock();
        return;
      }

      if (event.touches.length === 1) {
        if (queuedSingleTap) {
          clearTimeout(queuedSingleTap);
          queuedSingleTap = null;
        }

        queuedSingleTap = setTimeout(() => {
          mineTarget();
          queuedSingleTap = null;
        }, TAP_DELAY_MS);
      }
    };

    const handleTouchEnd = (event: TouchEvent): void => {
      if (event.touches.length >= 2 && queuedSingleTap) {
        clearTimeout(queuedSingleTap);
        queuedSingleTap = null;
      }
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
    renderer.domElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    renderer.domElement.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      cancelAnimationFrame(frameId);

      if (queuedSingleTap) {
        clearTimeout(queuedSingleTap);
        queuedSingleTap = null;
      }

      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);

      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      renderer.domElement.removeEventListener('touchcancel', handleTouchEnd);

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

  <section class="panel top-panel">
    <h1>Monument Realms</h1>
    <p>First-person voxel sandbox with monument-themed biomes, portals, environmental detail, and debug tooling.</p>
    <p class="status-line">{status}</p>
  </section>

  <section class="panel hud">
    <p><span>Biome</span><strong>{biomeLabel}</strong></p>
    <p><span>Monument</span><strong>{monumentLabel}</strong></p>
    <p><span>Portal</span><strong>{portalHint}</strong></p>
    <p><span>Mined</span><strong>{minedCount}</strong></p>
    <p><span>Placed</span><strong>{placedCount}</strong></p>
    <p><span>FPS</span><strong>{fps || '...'}</strong></p>
  </section>

  <section class="panel audio-panel">
    <h2>Audio</h2>
    <label>
      <span>Master {Math.round(volumeState.master * 100)}%</span>
      <input type="range" min="0" max="1" step="0.01" value={volumeState.master} on:input={(event) => setVolume('master', Number((event.currentTarget as HTMLInputElement).value))} />
    </label>
    <label>
      <span>Music {Math.round(volumeState.music * 100)}%</span>
      <input type="range" min="0" max="1" step="0.01" value={volumeState.music} on:input={(event) => setVolume('music', Number((event.currentTarget as HTMLInputElement).value))} />
    </label>
    <label>
      <span>SFX {Math.round(volumeState.sfx * 100)}%</span>
      <input type="range" min="0" max="1" step="0.01" value={volumeState.sfx} on:input={(event) => setVolume('sfx', Number((event.currentTarget as HTMLInputElement).value))} />
    </label>
    <p>{audioUnlocked ? 'Audio unlocked' : 'Audio starts on first interaction'}</p>
  </section>

  {#if loadingMessage}
    <p class="panel loading">{loadingMessage}</p>
  {/if}

  {#if !loadingFailed}
    <div class="crosshair" aria-hidden="true">+</div>

    <section class="hotbar" aria-label="Block hotbar">
      {#each hotbar as blockId, index}
        <button class:selected={selectedSlot === index} on:click={() => selectSlot(index)} aria-label={`Slot ${index + 1}`}>
          <span class="slot-index">{index + 1}</span>
          <span class="slot-swatch" style={`background: ${blockId ? BLOCKS[blockId]?.color : '#444'}`}></span>
          <span class="slot-name">{blockId ? BLOCKS[blockId]?.label : 'Empty'}</span>
          <span class="slot-count">{blockId ? inventory[blockId] ?? 0 : 0}</span>
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
          <p>Tap: break block</p>
          <p>Two-finger tap: place selected block</p>
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

  <section class="panel monuments">
    <h2>Monument Biomes</h2>
    <ul>
      {#each monumentsByDistance.slice(0, 4) as item}
        <li>
          <strong>{item.name}</strong>
          <span>{item.biomeName} • {item.distance} blocks</span>
        </li>
      {/each}
    </ul>
  </section>

  <section class="panel controls">
    <h2>Controls</h2>
    <p>Desktop: WASD move, Shift sprint, Space jump, left click break, right click place.</p>
    <p>Hotbar: number keys 1-9 or mouse wheel.</p>
    <p>Portals: step into portal cores to transfer between monument biomes.</p>
    <p>Debug renderer: <a href="/debug-render">/debug-render</a></p>
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
    background: #08111c;
    color: #ebf4ff;
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

  .top-panel {
    top: 0.8rem;
    left: 0.8rem;
    max-width: min(43rem, 64vw);
    padding: 0.7rem 0.9rem;
  }

  .top-panel h1 {
    margin: 0;
    font-size: 1.2rem;
    letter-spacing: 0.02em;
  }

  .top-panel p {
    margin: 0.32rem 0 0;
    font-size: 0.86rem;
    color: #d4e6fb;
  }

  .status-line {
    color: #f4ffed;
  }

  .hud {
    top: 6.1rem;
    left: 0.8rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.34rem 0.75rem;
    padding: 0.62rem 0.72rem;
    max-width: min(34rem, 64vw);
  }

  .hud p {
    margin: 0;
    font-size: 0.8rem;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .hud span {
    color: #b4c9dd;
  }

  .hud strong {
    color: #f7fbff;
    text-align: right;
  }

  .audio-panel {
    top: 12.4rem;
    left: 0.8rem;
    width: min(22rem, 38vw);
    padding: 0.58rem 0.68rem;
    display: grid;
    gap: 0.28rem;
  }

  .audio-panel h2 {
    margin: 0 0 0.2rem;
    font-size: 0.88rem;
  }

  .audio-panel label {
    display: grid;
    gap: 0.2rem;
    font-size: 0.7rem;
    color: #d8e9fb;
  }

  .audio-panel input {
    width: 100%;
  }

  .audio-panel p {
    margin: 0.16rem 0 0;
    font-size: 0.66rem;
    color: #bad4f1;
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
    left: 50%;
    bottom: 0.85rem;
    transform: translateX(-50%);
    width: min(96vw, 72rem);
    z-index: 9;
    display: flex;
    justify-content: center;
    gap: 0.28rem;
    flex-wrap: wrap;
    padding: 0.42rem;
    border-radius: 13px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(6, 16, 28, 0.65);
    backdrop-filter: blur(2px);
  }

  .hotbar button {
    min-width: 82px;
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: 0.25rem 0.35rem;
    padding: 0.32rem 0.38rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(20, 44, 68, 0.82);
    color: #e9f6ff;
    cursor: pointer;
    font: inherit;
  }

  .hotbar button.selected {
    outline: 2px solid #ffd768;
    background: rgba(58, 89, 32, 0.92);
  }

  .slot-index {
    font-size: 0.64rem;
    color: #d6dde8;
  }

  .slot-swatch {
    width: 14px;
    height: 14px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 4px;
  }

  .slot-name {
    grid-column: 2;
    grid-row: 1 / span 2;
    font-size: 0.64rem;
    line-height: 1.1;
    text-align: left;
  }

  .slot-count {
    font-size: 0.66rem;
    color: #f9ffdf;
  }

  .monuments {
    right: 0.8rem;
    top: 0.8rem;
    width: min(24rem, 32vw);
    padding: 0.62rem;
    max-height: 44vh;
    overflow: auto;
  }

  .monuments h2,
  .controls h2 {
    margin: 0 0 0.45rem;
    font-size: 0.94rem;
  }

  .monuments ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.32rem;
  }

  .monuments li {
    display: flex;
    justify-content: space-between;
    gap: 0.34rem;
    padding: 0.32rem 0.4rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    font-size: 0.78rem;
  }

  .monuments strong {
    color: #f6fbff;
  }

  .monuments span {
    color: #cbd8e7;
    white-space: nowrap;
    font-size: 0.72rem;
  }

  .controls {
    right: 0.8rem;
    top: 47vh;
    width: min(24rem, 32vw);
    padding: 0.62rem;
    max-height: 30vh;
    overflow: auto;
  }

  .controls p {
    margin: 0.28rem 0 0;
    font-size: 0.78rem;
    line-height: 1.36;
    color: #d5e4f4;
  }

  .controls a {
    color: #bfe9ff;
  }

  .touch-ui {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 4.9rem;
    z-index: 10;
    display: grid;
    grid-template-columns: 108px auto 108px;
    align-items: end;
    padding: 0 0.72rem;
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

  .touch-actions {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.36rem;
  }

  .touch-actions button {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 9px;
    background: rgba(43, 90, 41, 0.92);
    color: #f4ffe8;
    font-weight: 700;
    padding: 0.5rem 0.72rem;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .touch-actions p {
    margin: 0;
    font-size: 0.7rem;
    color: #d8e7f5;
    text-align: center;
    background: rgba(6, 15, 26, 0.6);
    border-radius: 8px;
    padding: 0.28rem 0.4rem;
  }

  @media (max-width: 980px) {
    .monuments,
    .controls {
      width: min(20rem, 36vw);
    }

    .audio-panel {
      width: min(19rem, 42vw);
    }
  }

  @media (max-width: 820px) {
    .top-panel,
    .hud,
    .monuments,
    .controls,
    .audio-panel {
      left: 0.7rem;
      right: 0.7rem;
      width: auto;
      max-width: none;
    }

    .hud {
      top: 7.1rem;
    }

    .audio-panel {
      top: 12.6rem;
    }

    .monuments {
      top: auto;
      bottom: 18rem;
      max-height: 16vh;
    }

    .controls {
      top: auto;
      bottom: 12.2rem;
      max-height: 5.4rem;
      overflow: auto;
    }

    .hotbar button {
      min-width: 72px;
    }
  }

  @media (max-width: 560px) {
    .top-panel {
      padding: 0.56rem 0.64rem;
    }

    .top-panel h1 {
      font-size: 1.03rem;
    }

    .top-panel p {
      font-size: 0.78rem;
    }

    .hud {
      grid-template-columns: 1fr;
      gap: 0.22rem;
      padding: 0.5rem 0.56rem;
      top: 6.6rem;
    }

    .audio-panel {
      top: 11.3rem;
      padding: 0.48rem 0.52rem;
    }

    .hotbar {
      bottom: 0.45rem;
      width: calc(100vw - 0.7rem);
      gap: 0.2rem;
      padding: 0.3rem;
    }

    .hotbar button {
      min-width: 63px;
      padding: 0.28rem 0.3rem;
    }

    .slot-swatch {
      width: 12px;
      height: 12px;
    }

    .monuments {
      bottom: 17.5rem;
    }

    .controls {
      bottom: 11.7rem;
    }

    .touch-ui {
      bottom: 4.2rem;
      grid-template-columns: 88px auto 88px;
      padding: 0 0.3rem;
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
  }
</style>
