import { resolveEntryMode } from "./app/entry";

const entryMode = resolveEntryMode(window.location.search);

if (entryMode === "editor") {
  await import("./main-editor");
} else if (entryMode === "dom") {
  await import("./main-dom");
} else {
  await import("./main-svg");
}

export {};
