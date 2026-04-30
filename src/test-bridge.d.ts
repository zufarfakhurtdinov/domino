import type { BoardState, SnapCandidate } from "./core/types";

declare global {
  interface Window {
    __DOMINO_TEST__: {
      getState: () => BoardState;
      getSnapCandidate: () => SnapCandidate | null;
      getRotateControlState: (dominoId: string) => string | null;
    };
  }
}

export {};
