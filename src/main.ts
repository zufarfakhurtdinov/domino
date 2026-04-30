import Konva from "konva";
import { detachDomino, rotateDomino } from "./core/board";
import { moveConnectedGroup } from "./core/connections";
import { getDominoCells, getOccupiedCells } from "./core/geometry";
import { applySnap, findSnapCandidate } from "./core/snapping";
import type { BoardState, Content, Domino, DominoHalf, Pair, Point, SnapCandidate } from "./core/types";
import "./styles.css";

const cellWidth = 132;
const cellHeight = 76;
const boardPadding = 32;
let stageWidth = 0;
let stageHeight = 0;

const pairs: Pair[] = [{ a: "cat_en", b: "cat_img" }];
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

render();
window.addEventListener("resize", resizeStage);

window.__DOMINO_TEST__ = {
  getState: () => structuredClone(state),
  getSnapCandidate: () => structuredClone(currentSnapCandidate),
  getRotateControlState: (dominoId: string) => rotateControlStates.get(dominoId) ?? null,
};

function resizeStage(): void {
  const nextSize = getStageSize();
  stageWidth = nextSize.width;
  stageHeight = nextSize.height;
  stage.size(nextSize);
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

  layer.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width: stageWidth,
      height: stageHeight,
      fill: "#ffffff",
    }),
  );

  for (const domino of state.dominoes) {
    renderDomino(domino);
  }

  if (currentSnapCandidate) {
    renderSnapHighlight(currentSnapCandidate);
  }

  layer.draw();
}

function renderDomino(domino: Domino): void {
  const cells = getDominoCells(domino);
  const transform = getVisualTransform(domino);
  const group = new Konva.Group({
    x: transform.x,
    y: transform.y,
    rotation: domino.rotation,
    name: `domino-${domino.id}`,
    draggable: true,
  });

  renderHalf(group, { x: 0, y: 0 }, domino.a, "a");
  renderHalf(group, { x: 1, y: 0 }, domino.b, "b");
  if (isLinked(domino.id)) {
    renderDetachControl(group, domino.id);
  }
  renderRotateControl(group, domino);
  group.on("dragmove", () => {
    currentSnapCandidate = findSnapCandidate(getPreviewState(domino.id, group), domino.id, pairs, {
      threshold: 0.4,
    });
    renderSnapHighlight(currentSnapCandidate);
  });
  group.on("dragend", () => {
    if (currentSnapCandidate) {
      state = applySnap(state, currentSnapCandidate);
    } else {
      state = moveConnectedGroup(state, domino.id, getGroupBoardPosition(group));
    }
    currentSnapCandidate = null;
    render();
  });

  layer.add(group);
}

function renderDetachControl(
  group: Konva.Group,
  dominoId: string,
): void {
  const control = new Konva.Group({
    x: 18,
    y: 18,
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
    state = detachDomino(state, dominoId);
    currentSnapCandidate = null;
    render();
  });

  group.add(control);
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

  for (const cell of getOccupiedCells(snappedDomino)) {
    layer.add(
      new Konva.Rect({
        x: boardPadding + cell.x * cellWidth + 4,
        y: boardPadding + cell.y * cellHeight + 4,
        width: cellWidth - 8,
        height: cellHeight - 8,
        stroke: "#16a34a",
        strokeWidth: 4,
        dash: [8, 5],
        listening: false,
        name: "snap-highlight",
      }),
    );
  }

  layer.batchDraw();
}

function getPreviewState(dominoId: string, group: Konva.Group): BoardState {
  return moveConnectedGroup(state, dominoId, getGroupBoardPosition(group));
}

function getGroupBoardPosition(group: Konva.Group): Point {
  const rotation = normalizeRotation(group.rotation());
  const origin = getVisualOriginForRotation(rotation, group.x(), group.y());

  return {
    x: (origin.x - boardPadding) / cellWidth,
    y: (origin.y - boardPadding) / cellHeight,
  };
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

function toLocalCell(cell: Point, domino: Domino): Point {
  return {
    x: cell.x - domino.x,
    y: cell.y - domino.y,
  };
}

function getVisualTransform(domino: Domino): Point {
  const origin = {
    x: boardPadding + domino.x * cellWidth,
    y: boardPadding + domino.y * cellHeight,
  };

  if (domino.rotation === 90) {
    return { x: origin.x + cellHeight, y: origin.y };
  }

  if (domino.rotation === 180) {
    return { x: origin.x + cellWidth * 2, y: origin.y + cellHeight };
  }

  if (domino.rotation === 270) {
    return { x: origin.x, y: origin.y + cellWidth * 2 };
  }

  return origin;
}

function getVisualOriginForRotation(rotation: Domino["rotation"], x: number, y: number): Point {
  if (rotation === 90) {
    return { x: x - cellHeight, y };
  }

  if (rotation === 180) {
    return { x: x - cellWidth * 2, y: y - cellHeight };
  }

  if (rotation === 270) {
    return { x, y: y - cellWidth * 2 };
  }

  return { x, y };
}

function normalizeRotation(rotation: number): Domino["rotation"] {
  const normalized = ((rotation % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }

  return 0;
}

function getCellBounds(cells: Point[]): { minX: number; minY: number; maxX: number } {
  return {
    minX: Math.min(...cells.map((cell) => cell.x)),
    minY: Math.min(...cells.map((cell) => cell.y)),
    maxX: Math.max(...cells.map((cell) => cell.x)),
  };
}

function isLinked(dominoId: string): boolean {
  return state.links.some((link) => link.dominoId1 === dominoId || link.dominoId2 === dominoId);
}

function createFixtureBoard(fixture: string | null): BoardState {
  if (fixture === "snap") {
    return {
      dominoes: [
        createDomino("dragged", text("cat_en", "cat"), text("free", "free"), 3, 0, 0),
        createDomino("target", image("cat_img", "cat image"), text("anchor", "anchor"), 0, 0, 90),
      ],
      links: [],
    };
  }

  if (fixture === "linked") {
    return {
      dominoes: [
        createDomino("dragged", text("cat_en", "cat"), text("free", "free"), 1, 0, 0),
        createDomino("target", image("cat_img", "cat image"), text("anchor", "anchor"), 0, 0, 90),
      ],
      links: [{ dominoId1: "dragged", half1: "a", dominoId2: "target", half2: "a" }],
    };
  }

  return {
    dominoes: [
      createDomino("cat", text("cat_en", "cat"), image("cat_img", "cat image"), 0, 0, 0),
      createDomino("dog", text("dog_en", "dog"), image("dog_img", "dog image"), 3, 2, 90),
    ],
    links: [],
  };
}

function createDomino(
  id: string,
  a: Content,
  b: Content,
  x: number,
  y: number,
  rotation: Domino["rotation"],
): Domino {
  return { id, a, b, x, y, rotation };
}

function text(key: string, value: string): Content {
  return { kind: "text", key, value };
}

function image(key: string, value: string): Content {
  return { kind: "image", key, value };
}
