import { getConnectedDominoIds, moveConnectedGroup } from "../src/core/connections";
import { domino } from "./core.fixtures";

describe("connected groups", () => {
  it("returns every domino in a linked chain", () => {
    const state = {
      dominoes: [domino({ id: "a" }), domino({ id: "b" }), domino({ id: "c" })],
      links: [
        { dominoId1: "a", half1: "a", dominoId2: "b", half2: "a" },
        { dominoId1: "b", half1: "b", dominoId2: "c", half2: "a" },
      ],
    } as const;

    expect(getConnectedDominoIds(state, "b")).toEqual(["a", "b", "c"]);
  });

  it("keeps separate linked groups separate", () => {
    const state = {
      dominoes: [
        domino({ id: "a" }),
        domino({ id: "b" }),
        domino({ id: "c" }),
        domino({ id: "d" }),
      ],
      links: [
        { dominoId1: "a", half1: "a", dominoId2: "b", half2: "a" },
        { dominoId1: "c", half1: "a", dominoId2: "d", half2: "a" },
      ],
    } as const;

    expect(getConnectedDominoIds(state, "a")).toEqual(["a", "b"]);
  });

  it("moves a connected group by the same delta", () => {
    const state = {
      dominoes: [
        domino({ id: "a", x: 0, y: 0 }),
        domino({ id: "b", x: 2, y: 0 }),
        domino({ id: "c", x: 5, y: 5 }),
      ],
      links: [{ dominoId1: "a", half1: "a", dominoId2: "b", half2: "a" }],
    } as const;

    expect(moveConnectedGroup(state, "a", { x: 3, y: 4 }).dominoes).toEqual([
      { ...state.dominoes[0], x: 3, y: 4 },
      { ...state.dominoes[1], x: 5, y: 4 },
      state.dominoes[2],
    ]);
  });

  it("returns unchanged state when moving a missing group root", () => {
    const state = { dominoes: [domino({ id: "a" })], links: [] };

    expect(moveConnectedGroup(state, "missing", { x: 3, y: 4 })).toBe(state);
  });
});
