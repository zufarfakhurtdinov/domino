import Konva from "konva";
import { createFixtureBoard, pairs } from "./app/model";
import { detachDomino, rotateDomino } from "./core/board";
import { getOccupiedCells } from "./core/geometry";
import { applySnap } from "./core/snapping";
import type { Content, Domino, DominoHalf, Link, SnapCandidate } from "./core/types";
import { derivePreviewResult } from "./view/interaction";
import { clampBoardScale, DEFAULT_BOARD_METRICS, getBoardRect } from "./view/metrics";
import {
  getLinkControlView,
  getSnapHighlightView,
  getVisualTransform,
  normalizeRotation,
} from "./view/transforms";
import "./styles.css";

const { cellWidth, cellHeight, boardScaleStep } = DEFAULT_BOARD_METRICS;
let stageWidth = 0;
let stageHeight = 0;
let boardScale = 1;

let state = createFixtureBoard(new URLSearchParams(window.location.search).get("fixture"));
let currentSnapCandidate: SnapCandidate | null = null;
const rotateControlStates = new Map<string, string>();

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app container");
}
const appContainer = app;

const initialSize = getStageSize();
stageWidth = initialSize.width;
stageHeight = initialSize.height;

const stage = new Konva.Stage({
  container: appContainer,
  width: stageWidth,
  height: stageHeight,
});

const layer = new Konva.Layer();
stage.add(layer);
const zoomControls = createZoomControls();

render();
window.addEventListener("resize", resizeStage);

window.__DOMINO_TEST__ = {
  getState: () => structuredClone(state),
  getSnapCandidate: () => structuredClone(currentSnapCandidate),
  getRotateControlState: (dominoId: string) => rotateControlStates.get(dominoId) ?? null,
  getScale: () => boardScale,
};

function resizeStage(): void {
  const nextSize = getStageSize();
  stageWidth = nextSize.width;
  stageHeight = nextSize.height;
  stage.size(nextSize);
  stage.scale({ x: boardScale, y: boardScale });
  render();
}

function getStageSize(): { width: number; height: number } {
  return {
    width: appContainer.clientWidth || window.innerWidth,
    height: appContainer.clientHeight || window.innerHeight,
  };
}

function render(): void {
  layer.destroyChildren();

  const boardRect = getBoardRect({ width: stageWidth, height: stageHeight, scale: boardScale });
  layer.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width: boardRect.width,
      height: boardRect.height,
      fill: "#ffffff",
    }),
  );

  for (const domino of state.dominoes) {
    renderDomino(domino);
  }

  for (const link of state.links) {
    renderDetachControl(link);
  }

  if (currentSnapCandidate) {
    renderSnapHighlight(currentSnapCandidate);
  }

  layer.draw();
  updateZoomControls();
}

function createZoomControls(): HTMLDivElement {
  const controls = document.createElement("div");
  controls.className = "zoom-controls";

  controls.append(
    createZoomButton({
      label: "Zoom in",
      icon: createZoomIcon("plus"),
      delta: boardScaleStep,
      className: "zoom-in",
    }),
    createZoomButton({
      label: "Zoom out",
      icon: createZoomIcon("minus"),
      delta: -boardScaleStep,
      className: "zoom-out",
    }),
  );

  appContainer.append(controls);

  return controls;
}

function createZoomButton(config: {
  label: string;
  icon: string;
  delta: number;
  className: string;
}): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `zoom-button ${config.className}`;
  button.setAttribute("aria-label", config.label);
  button.innerHTML = config.icon;
  button.addEventListener("click", () => {
    setBoardScale(boardScale + config.delta);
  });

  return button;
}

function createZoomIcon(kind: "plus" | "minus"): string {
  const verticalStroke = kind === "plus" ? '<path d="M12 7v10" />' : "";

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 12h10" />
      ${verticalStroke}
    </svg>
  `;
}

function setBoardScale(nextScale: number): void {
  const clampedScale = clampBoardScale(nextScale, DEFAULT_BOARD_METRICS);
  if (clampedScale === boardScale) {
    updateZoomControls();
    return;
  }

  boardScale = clampedScale;
  stage.scale({ x: boardScale, y: boardScale });
  render();
}

function updateZoomControls(): void {
  const zoomInButton = zoomControls.querySelector<HTMLButtonElement>(".zoom-in");
  const zoomOutButton = zoomControls.querySelector<HTMLButtonElement>(".zoom-out");

  if (zoomInButton) {
    zoomInButton.disabled = boardScale >= DEFAULT_BOARD_METRICS.maxBoardScale;
  }

  if (zoomOutButton) {
    zoomOutButton.disabled = boardScale <= DEFAULT_BOARD_METRICS.minBoardScale;
  }
}

function renderDomino(domino: Domino): void {
  const transform = getVisualTransform(domino, DEFAULT_BOARD_METRICS);
  const group = new Konva.Group({
    x: transform.x,
    y: transform.y,
    rotation: domino.rotation,
    name: `domino-${domino.id}`,
    draggable: true,
  });

  renderHalf(group, { x: 0, y: 0 }, domino.a, "a");
  renderHalf(group, { x: 1, y: 0 }, domino.b, "b");
  renderRotateControl(group, domino);
  group.on("dragmove", () => {
    currentSnapCandidate = derivePreviewResult(
      state,
      domino.id,
      {
        x: group.x(),
        y: group.y(),
        rotation: normalizeRotation(group.rotation()),
      },
      pairs,
      0.4,
      DEFAULT_BOARD_METRICS,
    ).candidate;
    renderSnapHighlight(currentSnapCandidate);
  });
  group.on("dragend", () => {
    if (currentSnapCandidate) {
      state = applySnap(state, currentSnapCandidate);
    } else {
      state = derivePreviewResult(
        state,
        domino.id,
        {
          x: group.x(),
          y: group.y(),
          rotation: normalizeRotation(group.rotation()),
        },
        pairs,
        0.4,
        DEFAULT_BOARD_METRICS,
      ).previewState;
    }
    currentSnapCandidate = null;
    render();
  });

  layer.add(group);
}

function renderDetachControl(link: Link): void {
  const linkView = getLinkControlView(state, link, DEFAULT_BOARD_METRICS);
  if (!linkView) {
    return;
  }

  const control = new Konva.Group({
    x: linkView.center.x,
    y: linkView.center.y,
  });

  control.add(
    new Konva.Circle({
      x: 0,
      y: 0,
      radius: 13,
      fill: "#dc2626",
      stroke: "#ffffff",
      strokeWidth: 2,
    }),
  );
  control.add(
    new Konva.Text({
      x: -7,
      y: -9,
      width: 14,
      text: "X",
      fill: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: 14,
      fontStyle: "bold",
      align: "center",
    }),
  );

  control.on("click tap", (event) => {
    event.cancelBubble = true;
    state = detachDomino(state, link.dominoId1);
    currentSnapCandidate = null;
    render();
  });

  layer.add(control);
}

function renderSnapHighlight(candidate: SnapCandidate | null): void {
  layer.find(".snap-highlight").forEach((node) => node.destroy());

  if (!candidate) {
    layer.batchDraw();
    return;
  }

  const dragged = state.dominoes.find((domino) => domino.id === candidate.draggedDominoId);
  if (!dragged) {
    layer.batchDraw();
    return;
  }

  const snappedDomino = {
    ...dragged,
    x: candidate.snappedPosition.x,
    y: candidate.snappedPosition.y,
  };
  const highlightView = getSnapHighlightView(snappedDomino, DEFAULT_BOARD_METRICS);
  const group = new Konva.Group({
    x: highlightView.x,
    y: highlightView.y,
    rotation: highlightView.rotation,
    listening: false,
    name: "snap-highlight",
  });

  group.add(
    new Konva.Rect({
      x: 4,
      y: 4,
      width: highlightView.width,
      height: highlightView.height,
      stroke: "#16a34a",
      strokeWidth: 4,
      dash: [8, 5],
      cornerRadius: 8,
      listening: false,
    }),
  );

  layer.add(group);

  layer.batchDraw();
}

function renderHalf(group: Konva.Group, cell: { x: number; y: number }, content: Content, half: DominoHalf): void {
  const x = cell.x * cellWidth;
  const y = cell.y * cellHeight;

  group.add(
    new Konva.Rect({
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      fill: half === "a" ? "#f8fafc" : "#eef6ff",
      stroke: "#111827",
      strokeWidth: 2,
      cornerRadius: 6,
    }),
  );

  group.add(
    new Konva.Text({
      x: x + 12,
      y: y + 25,
      width: cellWidth - 24,
      text: content.value,
      fill: "#111827",
      fontFamily: "Arial, sans-serif",
      fontSize: 20,
      align: "center",
    }),
  );
}

function renderRotateControl(
  group: Konva.Group,
  domino: Domino,
): void {
  const center = { x: cellWidth * 2 - 18, y: 18 };
  const control = new Konva.Group({ x: center.x, y: center.y, name: `rotate-${domino.id}` });
  rotateControlStates.set(domino.id, "default");

  const background = new Konva.Circle({
    x: 0,
    y: 0,
    radius: 17,
    fill: "#111827",
    stroke: "#ffffff",
    strokeWidth: 2,
  });
  control.add(
    background,
  );
  control.add(
    new Konva.Path({
      x: -9,
      y: -9,
      data: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8 M21 3v5h-5",
      stroke: "#ffffff",
      strokeWidth: 1.8,
      lineCap: "round",
      lineJoin: "round",
      scaleX: 0.75,
      scaleY: 0.75,
      listening: false,
    }),
  );

  control.on("mouseenter", () => {
    rotateControlStates.set(domino.id, "hover");
    background.fill("#2563eb");
    background.radius(18);
    stage.container().style.cursor = "pointer";
    layer.batchDraw();
  });
  control.on("mouseleave", () => {
    rotateControlStates.set(domino.id, "default");
    background.fill("#111827");
    background.radius(17);
    control.scale({ x: 1, y: 1 });
    stage.container().style.cursor = "default";
    layer.batchDraw();
  });
  control.on("mousedown touchstart", () => {
    rotateControlStates.set(domino.id, "pressed");
    background.fill("#1d4ed8");
    control.scale({ x: 0.92, y: 0.92 });
    layer.batchDraw();
  });
  control.on("mouseup touchend", () => {
    rotateControlStates.set(domino.id, "hover");
    background.fill("#2563eb");
    control.scale({ x: 1, y: 1 });
    layer.batchDraw();
  });
  control.on("click tap", (event) => {
    event.cancelBubble = true;
    state = rotateDomino(state, domino.id);
    render();
  });

  group.add(control);
}
