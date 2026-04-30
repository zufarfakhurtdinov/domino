import type { Domino, DominoHalf, Rotation } from "./types";

export type Point = {
  x: number;
  y: number;
};

export function rotateClockwise(rotation: Rotation): Rotation {
  return (((rotation + 90) % 360) as Rotation);
}

export function getHalfCell(domino: Domino, half: DominoHalf): Point {
  const cells = getDominoCells(domino);
  return cells[half];
}

export function getDominoCells(domino: Domino): Record<DominoHalf, Point> {
  const origin = { x: domino.x, y: domino.y };

  if (domino.rotation === 0) {
    return { a: origin, b: { x: domino.x + 1, y: domino.y } };
  }

  if (domino.rotation === 90) {
    return { a: origin, b: { x: domino.x, y: domino.y + 1 } };
  }

  if (domino.rotation === 180) {
    return { a: { x: domino.x + 1, y: domino.y }, b: origin };
  }

  return { a: { x: domino.x, y: domino.y + 1 }, b: origin };
}
