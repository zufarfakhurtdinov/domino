import { getDetachControlRadius } from "../src/view/controls";

describe("view controls", () => {
  it("returns the detach control radius", () => {
    expect(getDetachControlRadius()).toBe(13);
  });
});
