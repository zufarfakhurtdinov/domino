import { commitDrop, commitPreviewDrop, detachFirstLink, SNAP_THRESHOLD } from "./actions";
import { createFixtureBoard, pairs } from "./model";
import { detachDomino, rotateDomino } from "../core/board";
import type { BoardState, Link, Point, SnapCandidate } from "../core/types";
import { createBoardView } from "../view/board-view";
import { derivePreviewResult } from "../view/interaction";
import { clampBoardScale, DEFAULT_BOARD_METRICS } from "../view/metrics";
import { getVisualTransform } from "../view/transforms";
import type { BoardView } from "../view/types";

type DragSession = {
  dominoId: string;
  offset: Point;
  pointer: Point;
};

type RendererCallbacks = {
  onDominoPointerDown: (dominoId: string, pointer: Point) => void;
  onPointerMove: (pointer: Point) => void;
  onPointerUp: () => void;
  onRotate: (dominoId: string, pivot?: Point) => void;
  onDetach: (link: Link) => void;
};

type Renderer = {
  render: (view: BoardView, width: number, height: number, scale: number) => void;
};

type RendererConstructor = new (
  app: HTMLElement,
  callbacks: RendererCallbacks,
) => Renderer;

export function bootstrapDominoApp(RendererClass: RendererConstructor): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    throw new Error("Missing #app container");
  }
  const appContainer = app;

  let stageWidth = 0;
  let stageHeight = 0;
  let boardScale = 1;
  let state = createFixtureBoard(new URLSearchParams(window.location.search).get("fixture"));
  let previewState: BoardState | null = null;
  let currentSnapCandidate: SnapCandidate | null = null;
  let dragSession: DragSession | null = null;

  const renderer = new RendererClass(appContainer, {
    onDominoPointerDown(dominoId, pointer) {
      const domino = (previewState ?? state).dominoes.find((entry) => entry.id === dominoId);
      if (!domino) {
        return;
      }

      const transform = getVisualTransform(domino, DEFAULT_BOARD_METRICS);
      dragSession = {
        dominoId,
        pointer,
        offset: {
          x: pointer.x - transform.x,
          y: pointer.y - transform.y,
        },
      };
    },
    onPointerMove(pointer) {
      if (!dragSession) {
        return;
      }

      const session = dragSession;
      const domino = state.dominoes.find((entry) => entry.id === session.dominoId);
      if (!domino) {
        return;
      }

      const result = derivePreviewResult(
        state,
        session.dominoId,
        {
          x: pointer.x - session.offset.x,
          y: pointer.y - session.offset.y,
          rotation: domino.rotation,
        },
        pairs,
        SNAP_THRESHOLD,
        DEFAULT_BOARD_METRICS,
      );

      previewState = result.previewState;
      currentSnapCandidate = result.candidate;
      render();
    },
    onPointerUp() {
      if (!dragSession) {
        return;
      }

      const session = dragSession;
      if (previewState) {
        state = commitPreviewDrop(previewState, session.dominoId, currentSnapCandidate);
      } else {
        state = rotateDomino(state, session.dominoId, session.pointer);
      }

      dragSession = null;
      resetPreview();
      render();
    },
    onRotate(dominoId, pivot) {
      state = rotateDomino(state, dominoId, pivot);
      resetPreview();
      render();
    },
    onDetach(link) {
      state = detachDomino(state, link.dominoId1);
      resetPreview();
      render();
    },
  });

  const zoomControls = createZoomControls(appContainer);
  resizeStage();
  window.addEventListener("resize", resizeStage);

  window.__DOMINO_TEST__ = {
    getState: () => structuredClone(state),
    getSnapCandidate: () => structuredClone(currentSnapCandidate),
    getScale: () => boardScale,
    rotate: (dominoId: string, pivot?: Point) => {
      state = rotateDomino(state, dominoId, pivot);
      resetPreview();
      render();
    },
    drop: (dominoId, visualState) => {
      state = commitDrop(state, dominoId, visualState, pairs, DEFAULT_BOARD_METRICS);
      resetPreview();
      render();
    },
    detachFirstLink: () => {
      state = detachFirstLink(state);
      resetPreview();
      render();
    },
  };

  function resizeStage(): void {
    const nextSize = getStageSize(appContainer);
    stageWidth = nextSize.width;
    stageHeight = nextSize.height;
    render();
  }

  function render(): void {
    const renderState = previewState ?? state;
    renderer.render(
      createBoardView(
        renderState,
        { width: stageWidth, height: stageHeight, scale: boardScale },
        DEFAULT_BOARD_METRICS,
        currentSnapCandidate,
      ),
      stageWidth,
      stageHeight,
      boardScale,
    );
    updateZoomControls(zoomControls, boardScale);
  }

  function setBoardScale(nextScale: number): void {
    const clampedScale = clampBoardScale(nextScale, DEFAULT_BOARD_METRICS);
    if (clampedScale === boardScale) {
      updateZoomControls(zoomControls, boardScale);
      return;
    }

    boardScale = clampedScale;
    render();
  }

  function createZoomControls(appContainer: HTMLElement): HTMLDivElement {
    appContainer.append(createImportButton());

    const controls = document.createElement("div");
    controls.className = "zoom-controls";

    controls.append(
      createZoomButton({
        label: "Zoom in",
        icon: createZoomIcon("plus"),
        delta: DEFAULT_BOARD_METRICS.boardScaleStep,
      }),
      createZoomButton({
        label: "Zoom out",
        icon: createZoomIcon("minus"),
        delta: -DEFAULT_BOARD_METRICS.boardScaleStep,
      }),
    );

    appContainer.append(controls);
    return controls;
  }

  function createImportButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "zoom-button import-activity";
    button.setAttribute("aria-label", "Import activity");
    button.title = "Import activity";
    button.innerHTML = createImportIcon();

    return button;
  }

  function createZoomButton(config: {
    label: string;
    icon: string;
    delta: number;
  }): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `zoom-button ${config.delta > 0 ? "zoom-in" : "zoom-out"}`;
    button.setAttribute("aria-label", config.label);
    button.innerHTML = config.icon;
    button.addEventListener("click", () => {
      setBoardScale(boardScale + config.delta);
    });

    return button;
  }

  function resetPreview(): void {
    previewState = null;
    currentSnapCandidate = null;
  }
}

function getStageSize(appContainer: HTMLElement): { width: number; height: number } {
  return {
    width: appContainer.clientWidth || window.innerWidth,
    height: appContainer.clientHeight || window.innerHeight,
  };
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

function createImportIcon(): string {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M5 13v-8a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5.5" />
      <path d="M2 19h7" />
      <path d="M5 16l-3 3l3 3" />
    </svg>
  `;
}

function updateZoomControls(zoomControls: HTMLElement, boardScale: number): void {
  const zoomInButton = zoomControls.querySelector<HTMLButtonElement>(".zoom-in");
  const zoomOutButton = zoomControls.querySelector<HTMLButtonElement>(".zoom-out");

  if (zoomInButton) {
    zoomInButton.disabled = boardScale >= DEFAULT_BOARD_METRICS.maxBoardScale;
  }

  if (zoomOutButton) {
    zoomOutButton.disabled = boardScale <= DEFAULT_BOARD_METRICS.minBoardScale;
  }
}
