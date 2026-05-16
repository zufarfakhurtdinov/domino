import {
  getBoundsOriginFromTransform,
  getDominoBounds,
  getHalfBounds,
  getTransformOrigin,
} from "../core/geometry";
import type { BoardState, Domino, Link, Point, Rect, Rotation } from "../core/types";
import type { BoardMetrics, DragVisualState, LinkControlView, SnapHighlightView } from "./types";

export function normalizeRotation(rotation: number): Rotation {
  const normalized = ((rotation % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }

  return 0;
}

export function getVisualTransform(domino: Domino, _metrics: BoardMetrics): Point {
  return getTransformOrigin(domino);
}

export function getVisualOriginForRotation(
  rotation: Rotation,
  x: number,
  y: number,
  _metrics: BoardMetrics,
): Point {
  return getBoundsOriginFromTransform(rotation, x, y);
}

export function getBoardPositionFromVisualState(
  visualState: DragVisualState,
  metrics: BoardMetrics,
): Point {
  return getVisualOriginForRotation(
    visualState.rotation,
    visualState.x,
    visualState.y,
    metrics,
  );
}

export function getLinkControlView(
  state: BoardState,
  link: Link,
  _metrics: BoardMetrics,
): LinkControlView | null {
  const first = state.dominoes.find((domino) => domino.id === link.dominoId1);
  const second = state.dominoes.find((domino) => domino.id === link.dominoId2);
  if (!first || !second) {
    return null;
  }

  const firstBounds = arePerpendicular(first, second)
    ? getDominoBounds(first)
    : getHalfBounds(first, link.half1);
  const secondBounds = arePerpendicular(first, second)
    ? getDominoBounds(second)
    : getHalfBounds(second, link.half2);

  const horizontal = getLinkOrientation(firstBounds, secondBounds) === "horizontal";
  const left = firstBounds.x <= secondBounds.x ? firstBounds : secondBounds;
  const right = left === firstBounds ? secondBounds : firstBounds;
  const top = firstBounds.y <= secondBounds.y ? firstBounds : secondBounds;
  const bottom = top === firstBounds ? secondBounds : firstBounds;

  return {
    link,
    center: horizontal
      ? {
          x: (left.x + left.width + right.x) / 2,
          y: midpoint(
            Math.max(firstBounds.y, secondBounds.y),
            Math.min(firstBounds.y + firstBounds.height, secondBounds.y + secondBounds.height),
          ),
        }
      : {
          x: midpoint(
            Math.max(firstBounds.x, secondBounds.x),
            Math.min(firstBounds.x + firstBounds.width, secondBounds.x + secondBounds.width),
          ),
          y: (top.y + top.height + bottom.y) / 2,
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
    width: metrics.halfWidth * 2 - 8,
    height: metrics.halfHeight - 8,
  };
}

function midpoint(start: number, end: number): number {
  return (start + end) / 2;
}

function getLinkOrientation(first: Rect, second: Rect): "horizontal" | "vertical" {
  const horizontalGap = getAxisGap(first.x, first.width, second.x, second.width);
  const verticalGap = getAxisGap(first.y, first.height, second.y, second.height);

  if (horizontalGap > 0 && verticalGap <= 0) {
    return "horizontal";
  }

  if (verticalGap > 0 && horizontalGap <= 0) {
    return "vertical";
  }

  if (horizontalGap > 0 || verticalGap > 0) {
    return horizontalGap <= verticalGap ? "horizontal" : "vertical";
  }

  return Math.abs(first.x - second.x) >= Math.abs(first.y - second.y)
    ? "horizontal"
    : "vertical";
}

function arePerpendicular(left: Domino, right: Domino): boolean {
  return isVertical(left) !== isVertical(right);
}

function isVertical(domino: Domino): boolean {
  return domino.rotation === 90 || domino.rotation === 270;
}

function getAxisGap(firstStart: number, firstSize: number, secondStart: number, secondSize: number): number {
  return Math.max(firstStart, secondStart) - Math.min(firstStart + firstSize, secondStart + secondSize);
}
