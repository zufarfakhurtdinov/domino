import { resolveEntryMode } from "../src/app/entry";

describe("app entry", () => {
  it("selects editor mode from the query string", () => {
    expect(resolveEntryMode("?mode=editor")).toBe("editor");
  });

  it("keeps the existing renderer modes by default", () => {
    expect(resolveEntryMode("")).toBe("svg");
    expect(resolveEntryMode("?renderer=dom")).toBe("dom");
    expect(resolveEntryMode("?mode=game&renderer=dom")).toBe("dom");
  });
});
