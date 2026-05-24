import { moveConnectedGroup } from "../core/connections";
import { findSnapCandidate } from "../core/snapping";
import type { BoardState } from "../core/types";
import type { BoardMetrics, DragVisualState, PreviewResult } from "./types";
import { getBoardPositionFromVisualState } from "./transforms";

export function derivePreviewResult(
  state: BoardState,
  dominoId: string,
  visualState: DragVisualState,
  threshold: number,
  metrics: BoardMetrics,
): PreviewResult {
  const previewState = moveConnectedGroup(
    state,
    dominoId,
    getBoardPositionFromVisualState(visualState, metrics),
  );

  return {
    previewState,
    candidate: findSnapCandidate(previewState, dominoId, { threshold }),
  };
}
