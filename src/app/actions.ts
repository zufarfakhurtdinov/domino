import { detachDomino } from "../core/board";
import { moveConnectedGroup } from "../core/connections";
import { applySnap } from "../core/snapping";
import type { BoardState, SnapCandidate } from "../core/types";
import { derivePreviewResult } from "../view/interaction";
import type { BoardMetrics, DragVisualState } from "../view/types";

export const SNAP_THRESHOLD = 0.4;

export function commitDrop(
  state: BoardState,
  dominoId: string,
  visualState: DragVisualState,
  metrics: BoardMetrics,
): BoardState {
  const result = derivePreviewResult(
    state,
    dominoId,
    visualState,
    SNAP_THRESHOLD,
    metrics,
  );

  return commitPreviewDrop(result.previewState, dominoId, result.candidate);
}

export function commitPreviewDrop(
  previewState: BoardState,
  dominoId: string,
  candidate: SnapCandidate | null,
): BoardState {
  return candidate
    ? applySnap(moveConnectedGroup(previewState, dominoId, candidate.snappedPosition), candidate)
    : previewState;
}

export function detachFirstLink(state: BoardState): BoardState {
  const firstLink = state.links[0];
  return firstLink ? detachDomino(state, firstLink.dominoId1) : state;
}
