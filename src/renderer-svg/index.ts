import type { Content, DominoHalf, Link, Point } from "../core/types";
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

        group.append(createContentElement(half.content, half.x, half.y, half.width, half.height));
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
          fill: "#dbeafe",
          stroke: "#ffffff",
          "stroke-width": "2",
        }),
      );
      group.append(
        createText({
          x: -7,
          y: -9,
          width: 14,
          height: 18,
          text: "X",
          fill: "#1e3a8a",
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

function createContentElement(content: Content, x: number, y: number, width: number, height: number): SVGElement {
  if (content.type === "text") {
    return createText({
      x: x + 12,
      y,
      width: width - 24,
      height,
      text: content.value,
      fill: "#111827",
      fontSize: 20,
    });
  }

  if (content.type === "image") {
    return createSvgElement("image", {
      x: String(x + 10),
      y: String(y + 10),
      width: String(width - 20),
      height: String(height - 20),
      href: content.url,
      preserveAspectRatio: "xMidYMid meet",
    });
  }

  const button = createSvgElement("g", {
    transform: `translate(${x + width / 2} ${y + height / 2})`,
    role: "button",
    "aria-label": "Play audio",
  });
  button.classList.add("domino-audio-button-svg");
  button.style.cursor = "pointer";
  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    void new Audio(content.url).play();
  });
  button.append(createSvgElement("circle", { cx: "0", cy: "0", r: "18", fill: "#111827" }));
  button.append(
    createSvgElement("path", {
      d: "M-5 -9v18a1 1 0 0 0 1.524 .852l14.5 -9a1 1 0 0 0 0 -1.704l-14.5 -9a1 1 0 0 0 -1.524 .852z",
      fill: "#ffffff",
    }),
  );
  return button;
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
  height: number;
  text: string;
  fill: string;
  fontSize: number;
  fontWeight?: string;
}) {
  const text = createSvgElement("text", {
    x: String(config.x + config.width / 2),
    y: String(config.y + config.height / 2),
    fill: config.fill,
    "font-family": "Arial, sans-serif",
    "font-size": String(config.fontSize),
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    dy: "0.1em",
    ...(config.fontWeight ? { "font-weight": config.fontWeight } : {}),
  });
  text.textContent = config.text;
  return text;
}
