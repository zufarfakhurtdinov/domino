import { commitDrop, detachFirstLink, SNAP_THRESHOLD } from "./app/actions";
import { createFixtureBoard, pairs } from "./app/model";
import { detachDomino, rotateDomino } from "./core/board";
import { applySnap } from "./core/snapping";
import type { BoardState, Point, SnapCandidate } from "./core/types";
import { DomRenderer } from "./renderer-dom";
import { derivePreviewResult } from "./view/interaction";
import { createBoardView } from "./view/board-view";
import { clampBoardScale, DEFAULT_BOARD_METRICS } from "./view/metrics";
import { getVisualTransform } from "./view/transforms";
import type { ControlState } from "./view/types";
import "./styles.css";

const { boardScaleStep } = DEFAULT_BOARD_METRICS;

type DragSession = {
  dominoId: string;
  offset: Point;
};

let stageWidth = 0;
let stageHeight = 0;
let boardScale = 1;
let state = createFixtureBoard(new URLSearchParams(window.location.search).get("fixture"));
let previewState: BoardState | null = null;
let currentSnapCandidate: SnapCandidate | null = null;
let dragSession: DragSession | null = null;
const rotateControlStates = new Map<string, ControlState>();

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app container");
}

const appContainer = app;
const renderer = new DomRenderer(appContainer, {
  onDominoPointerDown(dominoId, pointer) {
    const domino = (previewState ?? state).dominoes.find((entry) => entry.id === dominoId);
    if (!domino) {
      return;
    }

    const transform = getVisualTransform(domino, DEFAULT_BOARD_METRICS);
    dragSession = {
      dominoId,
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

    if (currentSnapCandidate) {
      state = applySnap(state, currentSnapCandidate);
    } else if (previewState) {
      state = previewState;
    }

    dragSession = null;
    previewState = null;
    currentSnapCandidate = null;
    render();
  },
  onRotate(dominoId) {
    rotateControlStates.set(dominoId, "default");
    state = rotateDomino(state, dominoId);
    previewState = null;
    currentSnapCandidate = null;
    render();
  },
  onRotateControlStateChange(dominoId, nextState) {
    rotateControlStates.set(dominoId, nextState);
  },
  onDetach(link) {
    state = detachDomino(state, link.dominoId1);
    previewState = null;
    currentSnapCandidate = null;
    render();
  },
});

const zoomControls = createZoomControls();
resizeStage();
window.addEventListener("resize", resizeStage);

window.__DOMINO_TEST__ = {
  getState: () => structuredClone(state),
  getSnapCandidate: () => structuredClone(currentSnapCandidate),
  getRotateControlState: (dominoId: string) => rotateControlStates.get(dominoId) ?? null,
  getScale: () => boardScale,
  rotate: (dominoId: string) => {
    state = rotateDomino(state, dominoId);
    previewState = null;
    currentSnapCandidate = null;
    render();
  },
  drop: (dominoId, visualState) => {
    state = commitDrop(state, dominoId, visualState, pairs, DEFAULT_BOARD_METRICS);
    previewState = null;
    currentSnapCandidate = null;
    render();
  },
  detachFirstLink: () => {
    state = detachFirstLink(state);
    previewState = null;
    currentSnapCandidate = null;
    render();
  },
};

function resizeStage(): void {
  const nextSize = getStageSize();
  stageWidth = nextSize.width;
  stageHeight = nextSize.height;
  render();
}

function getStageSize(): { width: number; height: number } {
  return {
    width: appContainer.clientWidth || window.innerWidth,
    height: appContainer.clientHeight || window.innerHeight,
  };
}

function render(): void {
  const renderState = previewState ?? state;
  renderer.render(
    createBoardView(
      renderState,
      { width: stageWidth, height: stageHeight, scale: boardScale },
      DEFAULT_BOARD_METRICS,
      rotateControlStates,
      currentSnapCandidate,
    ),
    stageWidth,
    stageHeight,
    boardScale,
  );
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
