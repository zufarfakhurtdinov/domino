import { getBoardSurfaceTransform, getDominoTransform } from "../src/renderer-dom/styles";

describe("dom renderer styles", () => {
  it("returns the board scale transform", () => {
    expect(getBoardSurfaceTransform(1.4)).toBe("scale(1.4)");
  });

  it("returns the rigid domino transform", () => {
    expect(getDominoTransform(164, 32, 90)).toBe("translate(164px, 32px) rotate(90deg)");
  });
});
