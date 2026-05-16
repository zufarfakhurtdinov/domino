import type { Link, Point } from "../core/types";
import type { BoardView, ControlState } from "../view/types";
import { getBoardSurfaceTransform, getDominoTransform } from "./styles";

type DomRendererCallbacks = {
  onDominoPointerDown: (dominoId: string, pointer: Point) => void;
  onPointerMove: (pointer: Point) => void;
  onPointerUp: () => void;
  onRotate: (dominoId: string) => void;
  onRotateControlStateChange: (dominoId: string, state: ControlState) => void;
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
        const target = event.target;
        if (target instanceof Element && target.closest("[data-role='rotate-control']")) {
          return;
        }

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
        halfElement.textContent = half.content.value;
        element.append(halfElement);
      });

      const rotateControl = document.createElement("button");
      rotateControl.type = "button";
      rotateControl.className = "domino-rotate-control";
      rotateControl.dataset.role = "rotate-control";
      rotateControl.dataset.controlDominoId = domino.id;
      rotateControl.setAttribute("aria-label", `Rotate ${domino.id}`);
      rotateControl.style.left = `${domino.rotateControl.center.x - domino.rotateControl.radius}px`;
      rotateControl.style.top = `${domino.rotateControl.center.y - domino.rotateControl.radius}px`;
      rotateControl.style.width = `${domino.rotateControl.radius * 2}px`;
      rotateControl.style.height = `${domino.rotateControl.radius * 2}px`;
      rotateControl.style.background = domino.rotateControl.fill;
      rotateControl.style.transform = `scale(${domino.rotateControl.scale})`;
      rotateControl.innerHTML = "↻";
      rotateControl.addEventListener("pointerenter", () => {
        this.callbacks.onRotateControlStateChange(domino.id, "hover");
      });
      rotateControl.addEventListener("pointerleave", () => {
        this.callbacks.onRotateControlStateChange(domino.id, "default");
      });
      rotateControl.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.callbacks.onRotateControlStateChange(domino.id, "pressed");
      });
      rotateControl.addEventListener("pointerup", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.callbacks.onRotateControlStateChange(domino.id, "hover");
      });
      rotateControl.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.callbacks.onRotate(domino.id);
      });
      element.append(rotateControl);

      this.surface.append(element);
    }

    if (view.snapHighlight) {
      const highlight = document.createElement("div");
      highlight.className = "snap-highlight";
      highlight.style.width = `${view.snapHighlight.width}px`;
      highlight.style.height = `${view.snapHighlight.height}px`;
      highlight.style.transform = getDominoTransform(
        view.snapHighlight.x + 4,
        view.snapHighlight.y + 4,
        view.snapHighlight.rotation,
      );
      this.surface.append(highlight);
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
