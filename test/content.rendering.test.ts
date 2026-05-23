import { createBoardView } from "../src/view/board-view";
import { DEFAULT_BOARD_METRICS } from "../src/view/metrics";
import type { BoardState } from "../src/core/types";

describe("renderable domino content", () => {
  it("keeps hidden match keys separate from text/image/audio content", () => {
    const state: BoardState = {
      dominoes: [
        {
          id: "activity-domino",
          a: { key: "1", content: { type: "image", url: "blob:cat" } },
          b: { key: "2", content: { type: "audio", url: "blob:dog" } },
          x: 0,
          y: 0,
          rotation: 0,
        },
      ],
      links: [],
    };

    const view = createBoardView(
      state,
      { width: 400, height: 300, scale: 1 },
      DEFAULT_BOARD_METRICS,
      null,
    );

    expect(view.dominoes[0].halves.map((half) => half.content)).toEqual([
      { type: "image", url: "blob:cat" },
      { type: "audio", url: "blob:dog" },
    ]);
  });
});
