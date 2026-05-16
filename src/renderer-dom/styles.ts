import type { Rotation } from "../core/types";

export function getBoardSurfaceTransform(scale: number): string {
  return `scale(${scale})`;
}

export function getDominoTransform(x: number, y: number, rotation: Rotation): string {
  return `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
}
