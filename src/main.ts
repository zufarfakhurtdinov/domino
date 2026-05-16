const renderer = new URLSearchParams(window.location.search).get("renderer");

if (renderer === "svg") {
  await import("./main-svg");
} else {
  await import("./main-konva");
}

export {};
