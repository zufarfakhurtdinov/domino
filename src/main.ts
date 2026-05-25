import "./styles.css";

if (new URLSearchParams(window.location.search).get("mode") === "editor") {
  await import("./main-editor");
} else {
  const { bootstrapDominoApp } = await import("./app/browser");
  bootstrapDominoApp();
}

export {};
