import { detachDomino } from "../core/board";
import { applySnap } from "../core/snapping";
import type { BoardState, Pair } from "../core/types";
import { derivePreviewResult } from "../view/interaction";
import type { BoardMetrics, DragVisualState } from "../view/types";

export const SNAP_THRESHOLD = 0.4;

export function commitDrop(
  state: BoardState,
  dominoId: string,
  visualState: DragVisualState,
  pairs: Pair[],
  metrics: BoardMetrics,
): BoardState {
  const result = derivePreviewResult(
    state,
    dominoId,
    visualState,
    pairs,
    SNAP_THRESHOLD,
    metrics,
  );

  return result.candidate ? applySnap(state, result.candidate) : result.previewState;
}

export function detachFirstLink(state: BoardState): BoardState {
  const firstLink = state.links[0];
  return firstLink ? detachDomino(state, firstLink.dominoId1) : state;
}
