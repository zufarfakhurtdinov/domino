import { getBoardSurfaceTransform, getDominoTransform } from "../src/renderer-dom/styles";

describe("dom renderer styles", () => {
  it("returns the board scale transform", () => {
    expect(getBoardSurfaceTransform(1.4)).toBe("scale(1.4)");
  });

  it("returns the rigid domino transform", () => {
    const position = { x: 164, y: 32 };
    const rotation = 90;

    expect(getDominoTransform(position.x, position.y, rotation)).toBe(
      `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
    );
  });
});
