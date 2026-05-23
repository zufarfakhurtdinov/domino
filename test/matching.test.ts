import { canMatch } from "../src/core/matching";
import { content } from "./core.fixtures";

const pairs = [
  { a: "cat_en", b: "cat_img" },
  { a: "cat_en", b: "cat_audio" },
];

describe("matching", () => {
  it("matches a configured pair by content key", () => {
    expect(canMatch(content("cat_en"), content("cat_img", "image"), pairs)).toBe(true);
  });

  it("matches configured pairs symmetrically", () => {
    expect(canMatch(content("cat_img", "image"), content("cat_en"), pairs)).toBe(true);
  });

  it("rejects unrelated content keys", () => {
    expect(canMatch(content("cat_en"), content("dog_img", "image"), pairs)).toBe(false);
  });

  it("rejects matching a content key to itself", () => {
    expect(canMatch(content("cat_en"), content("cat_en"), pairs)).toBe(false);
  });

  it("allows matching the same key when the pair definition explicitly allows it", () => {
    expect(canMatch(content("1"), content("1"), [{ a: "1", b: "1" }])).toBe(true);
  });

  it("ignores duplicate pair definitions", () => {
    expect(
      canMatch(content("cat_en"), content("cat_audio", "audio"), [...pairs, pairs[1]]),
    ).toBe(true);
  });
});
