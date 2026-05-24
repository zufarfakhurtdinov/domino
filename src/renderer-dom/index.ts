import type { Link, Point } from "../core/types";
import type { Content } from "../core/types";
import type { BoardView } from "../view/types";
import { getBoardSurfaceTransform, getDominoTransform } from "./styles";

type DomRendererCallbacks = {
  onDominoPointerDown: (dominoId: string, pointer: Point) => void;
  onPointerMove: (pointer: Point) => void;
  onPointerUp: () => void;
  onRotate: (dominoId: string, pivot?: Point) => void;
  onDetach: (link: Link) => void;
};

export class DomRenderer {
  private readonly board: HTMLDivElement;

  private readonly surface: HTMLDivElement;

  private scale = 1;

  constructor(
    private readonly app: HTMLElement,
    private readonly callbacks: DomRendererCallbacks,
  ) {
    this.board = document.createElement("div");
    this.board.className = "board-dom";
    this.board.setAttribute("aria-label", "Domino board");
    this.board.addEventListener("pointermove", (event) => {
      this.callbacks.onPointerMove(this.getLocalPoint(event));
    });

    this.surface = document.createElement("div");
    this.surface.className = "board-surface";
    this.board.append(this.surface);
    this.app.prepend(this.board);

    window.addEventListener("pointerup", () => {
      this.callbacks.onPointerUp();
    });
  }

  render(view: BoardView, width: number, height: number, scale: number): void {
    this.scale = scale;
    this.board.style.width = `${width}px`;
    this.board.style.height = `${height}px`;
    this.surface.replaceChildren();
    this.surface.style.width = `${view.rect.width}px`;
    this.surface.style.height = `${view.rect.height}px`;
    this.surface.style.transform = getBoardSurfaceTransform(scale);

    for (const domino of view.dominoes) {
      const element = document.createElement("article");
      element.className = "domino-card domino";
      element.dataset.dominoId = domino.id;
      element.style.width = `${domino.width}px`;
      element.style.height = `${domino.height}px`;
      element.style.transform = getDominoTransform(domino.x, domino.y, domino.rotation);
      element.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.callbacks.onDominoPointerDown(domino.id, this.getLocalPoint(event));
      });

      domino.halves.forEach((half) => {
        const halfElement = document.createElement("div");
        halfElement.className = "domino-half";
        halfElement.dataset.half = half.half;
        halfElement.style.left = `${half.x}px`;
        halfElement.style.top = `${half.y}px`;
        halfElement.style.width = `${half.width}px`;
        halfElement.style.height = `${half.height}px`;
        halfElement.style.background = half.fill;
        halfElement.append(renderContent(half.content));
        element.append(halfElement);
      });

      this.surface.append(element);
    }

    if (view.snapHighlight) {
      const frame = document.createElement("div");
      frame.className = "snap-highlight-frame";
      frame.style.width = `${view.snapHighlight.width + 8}px`;
      frame.style.height = `${view.snapHighlight.height + 8}px`;
      frame.style.transform = getDominoTransform(
        view.snapHighlight.x,
        view.snapHighlight.y,
        view.snapHighlight.rotation,
      );

      const highlight = document.createElement("div");
      highlight.className = "snap-highlight";
      highlight.style.width = `${view.snapHighlight.width}px`;
      highlight.style.height = `${view.snapHighlight.height}px`;
      frame.append(highlight);
      this.surface.append(frame);
    }

    for (const linkControl of view.linkControls) {
      const control = document.createElement("button");
      control.type = "button";
      control.className = "domino-detach-control";
      control.dataset.role = "detach-control";
      control.dataset.link = `${linkControl.link.dominoId1}:${linkControl.link.half1}:${linkControl.link.dominoId2}:${linkControl.link.half2}`;
      control.textContent = "X";
      control.style.left = `${linkControl.center.x - 13}px`;
      control.style.top = `${linkControl.center.y - 13}px`;
      control.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.callbacks.onDetach(linkControl.link);
      });
      this.surface.append(control);
    }
  }

  private getLocalPoint(event: PointerEvent): Point {
    const bounds = this.board.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / this.scale,
      y: (event.clientY - bounds.top) / this.scale,
    };
  }
}

function renderContent(content: Content): Node {
  if (content.type === "text") {
    return document.createTextNode(content.value);
  }

  if (content.type === "image") {
    const image = document.createElement("img");
    image.className = "domino-content-image";
    image.src = content.url;
    image.alt = "";
    return image;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "domino-audio-button";
  button.setAttribute("aria-label", "Play audio");
  button.innerHTML = createPlayIcon();
  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    void new Audio(content.url).play();
  });
  return button;
}

function createPlayIcon(): string {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
    </svg>
  `;
}
