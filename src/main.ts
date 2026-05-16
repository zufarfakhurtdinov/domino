const renderer = new URLSearchParams(window.location.search).get("renderer");

if (renderer === "dom") {
  await import("./main-dom");
} else {
  await import("./main-svg");
}

export {};
