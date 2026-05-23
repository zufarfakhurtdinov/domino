import type { BoardState, SnapCandidate } from "../core/types";
import { getBoardRect } from "./metrics";
import { getLinkControlView, getSnapHighlightView, getVisualTransform } from "./transforms";
import type { BoardMetrics, BoardView, BoardViewport } from "./types";

export function createBoardView(
  state: BoardState,
  viewport: BoardViewport,
  metrics: BoardMetrics,
  snapCandidate: SnapCandidate | null,
): BoardView {
  return {
    rect: getBoardRect(viewport),
    dominoes: state.dominoes.map((domino) => ({
      id: domino.id,
      x: getVisualTransform(domino, metrics).x,
      y: getVisualTransform(domino, metrics).y,
      rotation: domino.rotation,
      width: metrics.halfWidth * 2,
      height: metrics.halfHeight,
      halves: [
        {
          half: "a",
          x: 0,
          y: 0,
          width: metrics.halfWidth,
          height: metrics.halfHeight,
          fill: "#f3f4f6",
          content: domino.a.content,
        },
        {
          half: "b",
          x: metrics.halfWidth,
          y: 0,
          width: metrics.halfWidth,
          height: metrics.halfHeight,
          fill: "#e5e7eb",
          content: domino.b.content,
        },
      ],
    })),
    linkControls: state.links
      .map((link) => getLinkControlView(state, link, metrics))
      .filter((view): view is NonNullable<typeof view> => view !== null),
    snapHighlight: getSnapHighlight(state, snapCandidate, metrics),
  };
}

function getSnapHighlight(
  state: BoardState,
  candidate: SnapCandidate | null,
  metrics: BoardMetrics,
) {
  if (!candidate) {
    return null;
  }

  const dragged = state.dominoes.find((domino) => domino.id === candidate.draggedDominoId);
  if (!dragged) {
    return null;
  }

  return getSnapHighlightView(
    {
      ...dragged,
      x: candidate.snappedPosition.x,
      y: candidate.snappedPosition.y,
    },
    metrics,
  );
}
