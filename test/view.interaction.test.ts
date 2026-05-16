import type { BoardState, Pair } from "../src/core/types";
import { DEFAULT_BOARD_METRICS } from "../src/view/metrics";
import { derivePreviewResult } from "../src/view/interaction";
import { board, content, domino } from "./core.fixtures";

const pairs: Pair[] = [{ a: "cat_en", b: "cat_img" }];

describe("view interaction", () => {
  it("derives a preview state and snap candidate from the visual drag state", () => {
    const state = board([
      domino({ id: "dragged", a: content("cat_en"), x: 101.2, y: 17 }),
      domino({ id: "target", a: content("cat_img", "image"), x: 0, y: 0, rotation: 90 }),
    ]);

    const result = derivePreviewResult(
      state,
      "dragged",
      { x: 101.2, y: 17, rotation: 0 },
      pairs,
      0.5,
      DEFAULT_BOARD_METRICS,
    );

    expect(result.previewState.dominoes.find((entry) => entry.id === "dragged")?.x).toBe(101.2);
    expect(result.previewState.dominoes.find((entry) => entry.id === "dragged")?.y).toBe(17);
    expect(result.candidate).toMatchObject({
      draggedDominoId: "dragged",
      draggedHalf: "a",
      targetDominoId: "target",
      targetHalf: "a",
      snappedPosition: { x: 102, y: 50 },
    });
    expect(result.candidate?.distance).toBeCloseTo(33.01, 3);
  });

  it("moves the whole connected group in preview state", () => {
    const state: BoardState = {
      dominoes: [
        domino({ id: "dragged", x: 100, y: 17 }),
        domino({ id: "linked", x: 0, y: 0, rotation: 90 }),
      ],
      links: [{ dominoId1: "dragged", half1: "a", dominoId2: "linked", half2: "a" }],
    };

    const result = derivePreviewResult(
      state,
      "dragged",
      { x: 200, y: 100, rotation: 0 },
      [],
      0.5,
      DEFAULT_BOARD_METRICS,
    );

    expect(result.previewState.dominoes).toEqual([
      domino({ id: "dragged", x: 200, y: 100 }),
      domino({ id: "linked", x: 100, y: 83, rotation: 90 }),
    ]);
    expect(result.candidate).toBeNull();
  });
});
