const renderer = new URLSearchParams(window.location.search).get("renderer");

if (renderer === "svg") {
  await import("./main-svg");
} else if (renderer === "dom") {
  await import("./main-dom");
} else {
  await import("./main-konva");
}

export {};
