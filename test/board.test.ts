import { detachDomino, moveDomino, rotateDomino } from "../src/core/board";
import { board, domino } from "./core.fixtures";

describe("board state", () => {
  it("moves only the selected domino", () => {
    const state = board([
      domino({ id: "d1", x: 0, y: 0 }),
      domino({ id: "d2", x: 5, y: 5 }),
    ]);

    expect(moveDomino(state, "d1", { x: 3, y: 4 }).dominoes).toEqual([
      { ...state.dominoes[0], x: 3, y: 4 },
      state.dominoes[1],
    ]);
  });

  it("returns unchanged state when moving a missing domino", () => {
    const state = board([domino({ id: "d1" })]);

    expect(moveDomino(state, "missing", { x: 3, y: 4 })).toBe(state);
  });

  it("detaches all links involving a domino", () => {
    const state = {
      dominoes: [domino({ id: "a" }), domino({ id: "b" }), domino({ id: "c" })],
      links: [
        { dominoId1: "a", half1: "a", dominoId2: "b", half2: "a" },
        { dominoId1: "b", half1: "b", dominoId2: "c", half2: "a" },
      ],
    } as const;

    expect(detachDomino(state, "b").links).toEqual([]);
  });

  it("keeps unrelated links when detaching a domino", () => {
    const unrelated = { dominoId1: "c", half1: "a", dominoId2: "d", half2: "b" } as const;
    const state = {
      dominoes: [
        domino({ id: "a" }),
        domino({ id: "b" }),
        domino({ id: "c" }),
        domino({ id: "d" }),
      ],
      links: [{ dominoId1: "a", half1: "a", dominoId2: "b", half2: "a" }, unrelated],
    } as const;

    expect(detachDomino(state, "a").links).toEqual([unrelated]);
  });

  it("detaches a linked domino when rotating it", () => {
    const state = {
      dominoes: [domino({ id: "a", rotation: 0 }), domino({ id: "b" })],
      links: [{ dominoId1: "a", half1: "b", dominoId2: "b", half2: "a" }],
    } as const;

    const next = rotateDomino(state, "a");

    expect(next.dominoes[0].rotation).toBe(90);
    expect(next.links).toEqual([]);
  });
});
