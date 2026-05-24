import { resolveEntryMode } from "../src/app/entry";

describe("app entry", () => {
  it("selects editor mode from the query string", () => {
    expect(resolveEntryMode("?mode=editor")).toBe("editor");
  });

  it("uses the DOM renderer by default and keeps explicit renderer modes", () => {
    expect(resolveEntryMode("")).toBe("dom");
    expect(resolveEntryMode("?renderer=dom")).toBe("dom");
    expect(resolveEntryMode("?mode=game&renderer=dom")).toBe("dom");
    expect(resolveEntryMode("?renderer=svg")).toBe("svg");
  });
});
