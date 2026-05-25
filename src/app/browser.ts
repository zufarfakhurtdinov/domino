import { commitDrop, commitPreviewDrop, detachFirstLink, SNAP_THRESHOLD } from "./actions";
import { createDefaultBoard } from "./model";
import { generateBoardFromActivity } from "../activity/generate-board";
import { loadActivityDirectory } from "../activity/load-directory";
import { loadActivityZip } from "../activity/load-zip";
import type { LoadedActivity } from "../activity/types";
import { detachDomino, rotateDomino } from "../core/board";
import type { BoardState, Point, SnapCandidate } from "../core/types";
import { DomRenderer } from "../renderer-dom";
import { createBoardView } from "../view/board-view";
import { derivePreviewResult } from "../view/interaction";
import { clampBoardScale, DEFAULT_BOARD_METRICS } from "../view/metrics";
import { getVisualTransform } from "../view/transforms";

type DragSession = {
  dominoId: string;
  offset: Point;
  pointer: Point;
};

type BootstrapDominoAppOptions = {
  initialState?: BoardState;
};

export function bootstrapDominoApp(options: BootstrapDominoAppOptions = {}): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    throw new Error("Missing #app container");
  }
  const appContainer = app;

  let stageWidth = 0;
  let stageHeight = 0;
  let boardScale = 1;
  let state = structuredClone(options.initialState ?? createDefaultBoard());
  let previewState: BoardState | null = null;
  let currentSnapCandidate: SnapCandidate | null = null;
  let dragSession: DragSession | null = null;

  const renderer = new DomRenderer(appContainer, {
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
      state = commitDrop(state, dominoId, visualState, DEFAULT_BOARD_METRICS);
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
    appContainer.append(createTopActions());

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

  function createTopActions(): HTMLDivElement {
    const actions = document.createElement("div");
    actions.className = "top-actions";
    actions.append(createImportZipButton(), createImportDirectoryButton(), createEditorButton());
    return actions;
  }

  function createImportZipButton(): HTMLButtonElement {
    return createTopActionButton({
      className: "import-activity",
      label: "Import activity",
      icon: createImportIcon(),
      onClick: () => {
        void importActivityZip();
      },
    });
  }

  function createImportDirectoryButton(): HTMLButtonElement {
    return createTopActionButton({
      className: "import-activity-directory",
      label: "Import activity folder",
      icon: createImportFolderIcon(),
      onClick: () => {
        void importActivityDirectory();
      },
    });
  }

  function createEditorButton(): HTMLButtonElement {
    return createTopActionButton({
      className: "open-editor",
      label: "Open editor",
      icon: createEditIcon(),
      onClick: () => {
        window.location.href = `${window.location.pathname}?mode=editor`;
      },
    });
  }

  function createTopActionButton(config: {
    className: string;
    label: string;
    icon: string;
    onClick: () => void;
  }): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `zoom-button top-action-button ${config.className}`;
    button.setAttribute("aria-label", config.label);
    button.title = config.label;
    button.innerHTML = config.icon;
    button.addEventListener("click", config.onClick);

    return button;
  }

  async function importActivityZip(): Promise<void> {
    const file = await selectActivityZip();

    if (!file) {
      return;
    }

    loadActivity(await loadActivityZip(file));
  }

  async function importActivityDirectory(): Promise<void> {
    const files = await selectActivityDirectory();

    if (!files || files.length === 0) {
      return;
    }

    loadActivity(await loadActivityDirectory(files));
  }

  function loadActivity(activity: LoadedActivity): void {
    const generated = generateBoardFromActivity(activity, {
      domino: "1",
      layout: "1",
      rotation: "1",
    });
    state = generated.state;
    resetPreview();
    render();
  }

  function selectActivityZip(): Promise<File | null> {
    return selectFiles({ accept: ".zip,application/zip" }).then((files) => files?.[0] ?? null);
  }

  function selectActivityDirectory(): Promise<FileList | null> {
    return selectFiles({ directory: true, multiple: true });
  }

  function selectFiles(config: {
    accept?: string;
    directory?: boolean;
    multiple?: boolean;
  }): Promise<FileList | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";

      if (config.accept) {
        input.accept = config.accept;
      }

      if (config.multiple) {
        input.multiple = true;
      }

      if (config.directory) {
        input.webkitdirectory = true;
      }

      input.addEventListener(
        "change",
        () => {
          resolve(input.files);
        },
        { once: true },
      );
      input.click();
    });
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
      <path d="M6 20.735a2 2 0 0 1 -1 -1.735v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-1" />
      <path d="M11 17a2 2 0 0 1 2 2v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a2 2 0 0 1 2 -2" />
      <path d="M11 5l-1 0" />
      <path d="M13 7l-1 0" />
      <path d="M11 9l-1 0" />
      <path d="M13 11l-1 0" />
      <path d="M11 13l-1 0" />
      <path d="M13 15l-1 0" />
    </svg>
  `;
}

function createImportFolderIcon(): string {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
    </svg>
  `;
}

function createEditIcon(): string {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
      <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
      <path d="M16 5l3 3" />
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
