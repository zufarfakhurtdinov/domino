import type { BoardState, Point, SnapCandidate } from "./core/types";
import type { DragVisualState } from "./view/types";

declare global {
  interface Window {
    __DOMINO_TEST__: {
      getState: () => BoardState;
      getSnapCandidate: () => SnapCandidate | null;
      getScale: () => number;
      rotate: (dominoId: string, pivot?: Point) => void;
      drop: (dominoId: string, visualState: DragVisualState) => void;
      detachFirstLink: () => void;
    };
  }
}

export {};
