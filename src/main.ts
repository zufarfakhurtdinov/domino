import Konva from "konva";
import { rotateDomino } from "./core/board";
import { getDominoCells } from "./core/geometry";
import type { BoardState, Content, Domino, DominoHalf, Point } from "./core/types";
import "./styles.css";

const cellWidth = 132;
const cellHeight = 76;
const boardPadding = 32;
const stageWidth = 720;
const stageHeight = 420;

let state = createFixtureBoard();

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app container");
}

const stage = new Konva.Stage({
  container: app,
  width: stageWidth,
  height: stageHeight,
});

const layer = new Konva.Layer();
stage.add(layer);

render();

window.__DOMINO_TEST__ = {
  getState: () => structuredClone(state),
};

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

  layer.draw();
}

function renderDomino(domino: Domino): void {
  const cells = getDominoCells(domino);
  const group = new Konva.Group({ name: `domino-${domino.id}` });

  renderHalf(group, cells.a, domino.a, "a");
  renderHalf(group, cells.b, domino.b, "b");
  renderRotateControl(group, domino, cells);

  layer.add(group);
}

function renderHalf(group: Konva.Group, cell: { x: number; y: number }, content: Content, half: DominoHalf): void {
  const x = boardPadding + cell.x * cellWidth;
  const y = boardPadding + cell.y * cellHeight;

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
  cells: Record<DominoHalf, Point>,
): void {
  const bounds = getCellBounds(Object.values(cells));
  const center = {
    x: boardPadding + (bounds.maxX + 1) * cellWidth - 18,
    y: boardPadding + bounds.minY * cellHeight + 18,
  };
  const control = new Konva.Group({ x: center.x, y: center.y, name: `rotate-${domino.id}` });

  control.add(
    new Konva.Circle({
      x: 0,
      y: 0,
      radius: 13,
      fill: "#111827",
      stroke: "#ffffff",
      strokeWidth: 2,
    }),
  );
  control.add(
    new Konva.Text({
      x: -7,
      y: -9,
      width: 14,
      text: "R",
      fill: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: 14,
      fontStyle: "bold",
      align: "center",
    }),
  );

  control.on("click tap", (event) => {
    event.cancelBubble = true;
    state = rotateDomino(state, domino.id);
    render();
  });

  group.add(control);
}

function getCellBounds(cells: Point[]): { minY: number; maxX: number } {
  return {
    minY: Math.min(...cells.map((cell) => cell.y)),
    maxX: Math.max(...cells.map((cell) => cell.x)),
  };
}

function createFixtureBoard(): BoardState {
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
