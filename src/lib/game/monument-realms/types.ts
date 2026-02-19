export interface StructureCell {
  type: string;
  protectedBlock: boolean;
  portalTo: string | null;
}

export interface PortalArrival {
  x: number;
  y: number;
  z: number;
}

export interface MonumentDistance {
  name: string;
  biomeName: string;
  distance: number;
}
