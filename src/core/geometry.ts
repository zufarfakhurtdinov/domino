import type { Domino, DominoHalf, Point, Rect, Rotation } from "./types";

export type Orientation = "horizontal" | "vertical";

export const HALF_WIDTH = 100;
export const HALF_HEIGHT = 100;
export const DOMINO_WIDTH = HALF_WIDTH * 2;
export const DOMINO_HEIGHT = HALF_HEIGHT;
export const SNAP_GAP = 2;

export function rotateClockwise(rotation: Rotation): Rotation {
  return (((rotation + 90) % 360) as Rotation);
}

export function getRotationOrientation(rotation: Rotation): Orientation {
  return rotation === 90 || rotation === 270 ? "vertical" : "horizontal";
}

export function getDominoOrientation(domino: Domino): Orientation {
  return getRotationOrientation(domino.rotation);
}

export function getRotationSize(rotation: Rotation): { width: number; height: number } {
  if (getRotationOrientation(rotation) === "vertical") {
    return { width: HALF_HEIGHT, height: DOMINO_WIDTH };
  }

  return { width: DOMINO_WIDTH, height: DOMINO_HEIGHT };
}

export function getDominoBounds(domino: Domino): Rect {
  const size = getRotationSize(domino.rotation);
  return {
    x: domino.x,
    y: domino.y,
    width: size.width,
    height: size.height,
  };
}

export function getHalfBounds(domino: Domino, half: DominoHalf): Rect {
  const local = getHalfLocalBounds(domino.rotation, half);
  return {
    x: domino.x + local.x,
    y: domino.y + local.y,
    width: local.width,
    height: local.height,
  };
}

export function getHalfLocalBounds(rotation: Rotation, half: DominoHalf): Rect {
  if (rotation === 0) {
    return half === "a"
      ? { x: 0, y: 0, width: HALF_WIDTH, height: HALF_HEIGHT }
      : { x: HALF_WIDTH, y: 0, width: HALF_WIDTH, height: HALF_HEIGHT };
  }

  if (rotation === 90) {
    return half === "a"
      ? { x: 0, y: 0, width: HALF_HEIGHT, height: HALF_WIDTH }
      : { x: 0, y: HALF_WIDTH, width: HALF_HEIGHT, height: HALF_WIDTH };
  }

  if (rotation === 180) {
    return half === "a"
      ? { x: HALF_WIDTH, y: 0, width: HALF_WIDTH, height: HALF_HEIGHT }
      : { x: 0, y: 0, width: HALF_WIDTH, height: HALF_HEIGHT };
  }

  return half === "a"
    ? { x: 0, y: HALF_WIDTH, width: HALF_HEIGHT, height: HALF_WIDTH }
    : { x: 0, y: 0, width: HALF_HEIGHT, height: HALF_WIDTH };
}

export function getHalfCenter(domino: Domino, half: DominoHalf): Point {
  return getRectCenter(getHalfBounds(domino, half));
}

export function getRectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

export function getTransformOrigin(domino: Domino): Point {
  if (domino.rotation === 90) {
    return { x: domino.x + HALF_HEIGHT, y: domino.y };
  }

  if (domino.rotation === 180) {
    return { x: domino.x + DOMINO_WIDTH, y: domino.y + HALF_HEIGHT };
  }

  if (domino.rotation === 270) {
    return { x: domino.x, y: domino.y + DOMINO_WIDTH };
  }

  return { x: domino.x, y: domino.y };
}

export function getBoundsOriginFromTransform(rotation: Rotation, x: number, y: number): Point {
  if (rotation === 90) {
    return { x: x - HALF_HEIGHT, y };
  }

  if (rotation === 180) {
    return { x: x - DOMINO_WIDTH, y: y - HALF_HEIGHT };
  }

  if (rotation === 270) {
    return { x, y: y - DOMINO_WIDTH };
  }

  return { x, y };
}

export function rectanglesOverlap(left: Rect, right: Rect): boolean {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

export function getAxisGap(firstStart: number, firstSize: number, secondStart: number, secondSize: number): number {
  return Math.max(firstStart, secondStart) - Math.min(firstStart + firstSize, secondStart + secondSize);
}
