import type { BoardState, SnapCandidate } from "./core/types";
import type { DragVisualState } from "./view/types";

declare global {
  interface Window {
    __DOMINO_TEST__: {
      getState: () => BoardState;
      getSnapCandidate: () => SnapCandidate | null;
      getRotateControlState: (dominoId: string) => string | null;
      getScale: () => number;
      rotate: (dominoId: string) => void;
      drop: (dominoId: string, visualState: DragVisualState) => void;
      detachFirstLink: () => void;
    };
  }
}

export {};
