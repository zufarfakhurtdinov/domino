import type { DominoHalf, Link, Point } from "../core/types";
import type { BoardView } from "../view/types";

type SvgRendererCallbacks = {
  onDominoPointerDown: (dominoId: string, pointer: Point) => void;
  onPointerMove: (pointer: Point) => void;
  onPointerUp: () => void;
  onRotate: (dominoId: string, pivot?: Point) => void;
  onDetach: (link: Link) => void;
};

const SVG_NS = "http://www.w3.org/2000/svg";

export class SvgRenderer {
  private readonly svg: SVGSVGElement;

  private scale = 1;

  constructor(
    private readonly app: HTMLElement,
    private readonly callbacks: SvgRendererCallbacks,
  ) {
    this.svg = createSvgElement("svg");
    this.svg.classList.add("board-svg");
    this.svg.setAttribute("aria-label", "Domino board");
    this.svg.style.touchAction = "none";
    this.svg.addEventListener("pointermove", (event) => {
      this.callbacks.onPointerMove(this.getLocalPoint(event));
    });
    window.addEventListener("pointerup", () => {
      this.callbacks.onPointerUp();
    });
    this.app.prepend(this.svg);
  }

  render(view: BoardView, width: number, height: number, scale: number): void {
    this.scale = scale;
    this.svg.replaceChildren();
    this.svg.setAttribute("width", String(width));
    this.svg.setAttribute("height", String(height));
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const boardGroup = createSvgElement("g");
    boardGroup.setAttribute("transform", `scale(${scale})`);
    this.svg.append(boardGroup);

    boardGroup.append(
      createRect({
        x: 0,
        y: 0,
        width: view.rect.width,
        height: view.rect.height,
        fill: "#ffffff",
      }),
    );

    for (const domino of view.dominoes) {
      const group = createSvgElement("g");
      group.dataset.dominoId = domino.id;
      group.classList.add("domino");
      group.setAttribute("transform", `translate(${domino.x} ${domino.y}) rotate(${domino.rotation})`);
      group.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.callbacks.onDominoPointerDown(domino.id, this.getLocalPoint(event));
      });

      domino.halves.forEach((half) => {
        group.append(
          createHalfPath({
            half: half.half,
            x: half.x,
            y: half.y,
            width: half.width,
            height: half.height,
            fill: half.fill,
          }),
        );

        group.append(
          createText({
            x: half.x + 12,
            y: half.y + 25,
            width: half.width - 24,
            text: half.content.value,
            fill: "#111827",
            fontSize: 20,
          }),
        );
      });

      boardGroup.append(group);
    }

    if (view.snapHighlight) {
      const highlight = createSvgElement("g");
      highlight.classList.add("snap-highlight");
      highlight.setAttribute(
        "transform",
        `translate(${view.snapHighlight.x} ${view.snapHighlight.y}) rotate(${view.snapHighlight.rotation})`,
      );
      highlight.append(
        createRect({
          x: 4,
          y: 4,
          width: view.snapHighlight.width,
          height: view.snapHighlight.height,
          fill: "none",
          stroke: "#16a34a",
          strokeWidth: 4,
          rx: 8,
          ry: 8,
          strokeDasharray: "8 5",
        }),
      );
      boardGroup.append(highlight);
    }

    for (const linkControl of view.linkControls) {
      const group = createSvgElement("g");
      group.dataset.role = "detach-control";
      group.dataset.link = `${linkControl.link.dominoId1}:${linkControl.link.half1}:${linkControl.link.dominoId2}:${linkControl.link.half2}`;
      group.setAttribute("transform", `translate(${linkControl.center.x} ${linkControl.center.y})`);
      group.style.cursor = "pointer";
      group.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.callbacks.onDetach(linkControl.link);
      });
      group.append(
        createSvgElement("circle", {
          cx: "0",
          cy: "0",
          r: "13",
          fill: "#dc2626",
          stroke: "#ffffff",
          "stroke-width": "2",
        }),
      );
      group.append(
        createText({
          x: -7,
          y: -9,
          width: 14,
          text: "X",
          fill: "#ffffff",
          fontSize: 14,
          fontWeight: "700",
        }),
      );
      boardGroup.append(group);
    }
  }

  private getLocalPoint(event: PointerEvent): Point {
    const bounds = this.svg.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / this.scale,
      y: (event.clientY - bounds.top) / this.scale,
    };
  }
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes: Record<string, string> = {},
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function createHalfPath(config: {
  half: DominoHalf;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}) {
  const radius = 6;
  const x = config.x;
  const y = config.y;
  const right = x + config.width;
  const bottom = y + config.height;

  const d =
    config.half === "a"
      ? [
          `M ${x + radius} ${y}`,
          `H ${right}`,
          `V ${bottom}`,
          `H ${x + radius}`,
          `A ${radius} ${radius} 0 0 1 ${x} ${bottom - radius}`,
          `V ${y + radius}`,
          `A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
          "Z",
        ].join(" ")
      : [
          `M ${x} ${y}`,
          `H ${right - radius}`,
          `A ${radius} ${radius} 0 0 1 ${right} ${y + radius}`,
          `V ${bottom - radius}`,
          `A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
          `H ${x}`,
          "Z",
        ].join(" ");

  return createSvgElement("path", {
    d,
    fill: config.fill,
  });
}

function createRect(config: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  strokeDasharray?: string;
}) {
  return createSvgElement("rect", {
    x: String(config.x),
    y: String(config.y),
    width: String(config.width),
    height: String(config.height),
    fill: config.fill,
    ...(config.stroke ? { stroke: config.stroke } : {}),
    ...(config.strokeWidth ? { "stroke-width": String(config.strokeWidth) } : {}),
    ...(config.rx ? { rx: String(config.rx) } : {}),
    ...(config.ry ? { ry: String(config.ry) } : {}),
    ...(config.strokeDasharray ? { "stroke-dasharray": config.strokeDasharray } : {}),
  });
}

function createText(config: {
  x: number;
  y: number;
  width: number;
  text: string;
  fill: string;
  fontSize: number;
  fontWeight?: string;
}) {
  const text = createSvgElement("text", {
    x: String(config.x + config.width / 2),
    y: String(config.y + 20),
    fill: config.fill,
    "font-family": "Arial, sans-serif",
    "font-size": String(config.fontSize),
    "text-anchor": "middle",
    ...(config.fontWeight ? { "font-weight": config.fontWeight } : {}),
  });
  text.textContent = config.text;
  return text;
}
