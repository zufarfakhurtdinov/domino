import type { BoardState, SnapCandidate } from "../core/types";
import { getBoardRect } from "./metrics";
import { getRotateControlView } from "./controls";
import { getLinkControlView, getSnapHighlightView, getVisualTransform } from "./transforms";
import type { BoardMetrics, BoardView, BoardViewport, ControlState } from "./types";

export function createBoardView(
  state: BoardState,
  viewport: BoardViewport,
  metrics: BoardMetrics,
  rotateControlStates: ReadonlyMap<string, ControlState>,
  snapCandidate: SnapCandidate | null,
): BoardView {
  return {
    rect: getBoardRect(viewport),
    dominoes: state.dominoes.map((domino) => ({
      id: domino.id,
      x: getVisualTransform(domino, metrics).x,
      y: getVisualTransform(domino, metrics).y,
      rotation: domino.rotation,
      width: metrics.cellWidth * 2,
      height: metrics.cellHeight,
      halves: [
        {
          half: "a",
          x: 0,
          y: 0,
          width: metrics.cellWidth,
          height: metrics.cellHeight,
          fill: "#f8fafc",
          content: domino.a,
        },
        {
          half: "b",
          x: metrics.cellWidth,
          y: 0,
          width: metrics.cellWidth,
          height: metrics.cellHeight,
          fill: "#eef6ff",
          content: domino.b,
        },
      ],
      rotateControl: getRotateControlView(
        metrics,
        rotateControlStates.get(domino.id) ?? "default",
      ),
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
