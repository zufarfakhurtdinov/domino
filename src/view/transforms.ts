import { getDominoCells } from "../core/geometry";
import type { BoardState, Domino, Link, Point, Rotation } from "../core/types";
import type { BoardMetrics, DragVisualState, LinkControlView, SnapHighlightView } from "./types";

export function normalizeRotation(rotation: number): Rotation {
  const normalized = ((rotation % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }

  return 0;
}

export function getVisualTransform(domino: Domino, metrics: BoardMetrics): Point {
  const origin = getBoardPixelOrigin(domino, metrics);

  if (domino.rotation === 90) {
    return { x: origin.x + metrics.cellHeight, y: origin.y };
  }

  if (domino.rotation === 180) {
    return {
      x: origin.x + metrics.cellWidth * 2,
      y: origin.y + metrics.cellHeight,
    };
  }

  if (domino.rotation === 270) {
    return { x: origin.x, y: origin.y + metrics.cellWidth * 2 };
  }

  return origin;
}

export function getVisualOriginForRotation(
  rotation: Rotation,
  x: number,
  y: number,
  metrics: BoardMetrics,
): Point {
  if (rotation === 90) {
    return { x: x - metrics.cellHeight, y };
  }

  if (rotation === 180) {
    return {
      x: x - metrics.cellWidth * 2,
      y: y - metrics.cellHeight,
    };
  }

  if (rotation === 270) {
    return { x, y: y - metrics.cellWidth * 2 };
  }

  return { x, y };
}

export function getBoardPositionFromVisualState(
  visualState: DragVisualState,
  metrics: BoardMetrics,
): Point {
  const origin = getVisualOriginForRotation(
    visualState.rotation,
    visualState.x,
    visualState.y,
    metrics,
  );

  return {
    x: (origin.x - metrics.boardPadding) / metrics.cellWidth,
    y: (origin.y - metrics.boardPadding) / metrics.cellHeight,
  };
}

export function getLinkControlView(
  state: BoardState,
  link: Link,
  metrics: BoardMetrics,
): LinkControlView | null {
  const first = state.dominoes.find((domino) => domino.id === link.dominoId1);
  const second = state.dominoes.find((domino) => domino.id === link.dominoId2);
  if (!first || !second) {
    return null;
  }

  const firstCell = getDominoCells(first)[link.half1];
  const secondCell = getDominoCells(second)[link.half2];

  return {
    link,
    center: {
      x:
        metrics.boardPadding +
        ((firstCell.x + secondCell.x + 1) / 2) * metrics.cellWidth,
      y:
        metrics.boardPadding +
        ((firstCell.y + secondCell.y + 1) / 2) * metrics.cellHeight,
    },
  };
}

export function getSnapHighlightView(
  domino: Domino,
  metrics: BoardMetrics,
): SnapHighlightView {
  const transform = getVisualTransform(domino, metrics);

  return {
    x: transform.x,
    y: transform.y,
    rotation: domino.rotation,
    width: metrics.cellWidth * 2 - 8,
    height: metrics.cellHeight - 8,
  };
}

function getBoardPixelOrigin(domino: Domino, metrics: BoardMetrics): Point {
  return {
    x: metrics.boardPadding + domino.x * metrics.cellWidth,
    y: metrics.boardPadding + domino.y * metrics.cellHeight,
  };
}
