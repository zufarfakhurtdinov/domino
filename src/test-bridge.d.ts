import type { BoardState } from "./core/types";

declare global {
  interface Window {
    __DOMINO_TEST__: {
      getState: () => BoardState;
    };
  }
}

export {};
