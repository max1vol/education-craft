import * as THREE from 'three';
import type { BlockDefinition } from '$lib/data/monument-realms/blocks';

const textureLoader = new THREE.TextureLoader();

function normalizeTexture(texture: THREE.Texture): THREE.Texture {
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createFallbackTexture(baseHex: string, accentHex: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return normalizeTexture(new THREE.Texture(canvas));
  }

  const toRgb = (hex: string): { r: number; g: number; b: number } => {
    const clean = hex.replace('#', '');
    const normalized =
      clean.length === 3
        ? clean
            .split('')
            .map((chunk) => chunk + chunk)
            .join('')
        : clean;
    const num = Number.parseInt(normalized, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  };

  const base = toRgb(baseHex);
  const accent = toRgb(accentHex);

  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const t =
        0.5 +
        Math.sin((x + 1.3) * 0.18 + (y + 2.1) * 0.14) * 0.23 +
        Math.sin((x + 0.7) * (y + 1.9) * 0.015) * 0.24;
      const clamped = Math.max(0, Math.min(1, t));

      const r = Math.round(base.r + (accent.r - base.r) * clamped);
      const g = Math.round(base.g + (accent.g - base.g) * clamped);
      const b = Math.round(base.b + (accent.b - base.b) * clamped);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return normalizeTexture(new THREE.CanvasTexture(canvas));
}

function loadBlockTexture(path: string, baseHex: string, accentHex: string): THREE.Texture {
  if (!path) {
    return createFallbackTexture(baseHex, accentHex);
  }

  const texture = textureLoader.load(
    path,
    (loadedTexture) => {
      normalizeTexture(loadedTexture);
    },
    undefined,
    () => {
      const fallback = createFallbackTexture(baseHex, accentHex);
      texture.image = fallback.image;
      texture.needsUpdate = true;
    }
  );

  return normalizeTexture(texture);
}

export interface BlockMaterialRegistry {
  blockMaterials: Record<string, THREE.MeshStandardMaterial>;
  portalCoreMaterial: THREE.MeshStandardMaterial | null;
  dispose: () => void;
}

export function createBlockMaterials(blocks: Record<string, BlockDefinition>): BlockMaterialRegistry {
  const blockMaterials: Record<string, THREE.MeshStandardMaterial> = {};
  let portalCoreMaterial: THREE.MeshStandardMaterial | null = null;

  for (const [blockId, def] of Object.entries(blocks)) {
    const texture = loadBlockTexture(def.texture, def.color, def.accent ?? def.color);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: new THREE.Color(def.color),
      roughness: def.roughness ?? 0.9,
      metalness: def.metalness ?? 0,
      transparent: Boolean(def.transparent),
      opacity: def.opacity ?? 1,
      emissive: def.emissive ? new THREE.Color(def.emissive) : new THREE.Color('#000000'),
      emissiveIntensity: def.emissive ? 0.55 : 0
    });

    if (blockId === 'water' || blockId === 'aqueduct_water' || blockId === 'portal_core') {
      material.depthWrite = false;
    }

    blockMaterials[blockId] = material;
    if (blockId === 'portal_core') {
      portalCoreMaterial = material;
    }
  }

  const dispose = (): void => {
    for (const material of Object.values(blockMaterials)) {
      material.map?.dispose();
      material.dispose();
    }
  };

  return { blockMaterials, portalCoreMaterial, dispose };
}
