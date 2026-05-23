import { buildActivityExport } from "../activity/export";
import { createEmptyDraftContent, createInitialDraftPairs, canExportDraftPairs, discardMedia, isDraftContentValid, isDraftPairValid, setAudioFile, setImageFile, setTextValue } from "../activity/editor-state";
import type { DraftContent, DraftPair } from "../activity/editor-types";
import { createActivityZip } from "../activity/zip";
import { renderEditorHtml } from "./view";

type ItemAddress = {
  rowIndex: number;
  itemIndex: 0 | 1;
};

export const bootstrapActivityEditor = (root: HTMLElement): void => {
  const editor = new ActivityEditor(root);
  editor.mount();
};

class ActivityEditor {
  private pairs: DraftPair[] = createInitialDraftPairs();

  constructor(private readonly root: HTMLElement) {}

  mount(): void {
    this.root.addEventListener("click", (event) => {
      void this.handleClick(event);
    });
    this.root.addEventListener("input", (event) => {
      this.handleInput(event);
    });
    this.render();
  }

  private render(): void {
    this.root.innerHTML = renderEditorHtml(this.pairs);
  }

  private handleInput(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.dataset.action !== "text") {
      return;
    }

    const address = getAddress(target);

    if (!address) {
      return;
    }

    this.updateContent(address, (content) => setTextValue(content, target.value));
    this.refreshValidity();
  }

  private async handleClick(event: Event): Promise<void> {
    const button = (event.target as Element | null)?.closest("button");

    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }

    const action = button.dataset.action;

    if (action === "add-row") {
      this.pairs = [...this.pairs, { items: [createEmptyDraftContent(), createEmptyDraftContent()] }];
      this.render();
      return;
    }

    if (action === "delete-row") {
      const rowIndex = Number(button.dataset.rowIndex);
      this.pairs = this.pairs.length > 1 ? this.pairs.filter((_, index) => index !== rowIndex) : this.pairs;
      this.render();
      return;
    }

    if (action === "discard-media") {
      const address = getAddress(button);

      if (address) {
        this.updateContent(address, discardMedia);
        this.render();
      }
      return;
    }

    if (action === "upload-image" || action === "upload-audio") {
      const address = getAddress(button);

      if (address) {
        const file = await selectFile(action === "upload-image" ? "image/*" : "audio/*");

        if (file) {
          this.updateContent(address, (content) => (action === "upload-image" ? setImageFile(content, file) : setAudioFile(content, file)));
          this.render();
        }
      }
      return;
    }

    if (action === "export" && canExportDraftPairs(this.pairs)) {
      await downloadActivityZip(this.pairs);
    }
  }

  private updateContent(address: ItemAddress, update: (content: DraftContent) => DraftContent): void {
    this.pairs = this.pairs.map((pair, rowIndex) => {
      if (rowIndex !== address.rowIndex) {
        return pair;
      }

      const items: DraftPair["items"] = [...pair.items] as DraftPair["items"];
      items[address.itemIndex] = update(items[address.itemIndex]);
      return { items };
    });
  }

  private refreshValidity(): void {
    const exportButton = this.root.querySelector<HTMLButtonElement>('[data-action="export"]');

    if (exportButton) {
      exportButton.disabled = !canExportDraftPairs(this.pairs);
    }

    for (const [rowIndex, pair] of this.pairs.entries()) {
      const row = this.root.querySelector<HTMLElement>(`[data-row-index="${rowIndex}"].activity-editor-row`);
      row?.setAttribute("data-invalid", String(!isDraftPairValid(pair)));

      pair.items.forEach((content, itemIndex) => {
        const cell = this.root.querySelector<HTMLElement>(
          `.activity-editor-cell[data-row-index="${rowIndex}"][data-item-index="${itemIndex}"]`,
        );
        cell?.setAttribute("data-invalid", String(!isDraftContentValid(content)));
      });
    }
  }
}

const getAddress = (element: HTMLElement): ItemAddress | null => {
  const rowIndex = Number(element.dataset.rowIndex);
  const itemIndex = Number(element.dataset.itemIndex);

  if (!Number.isInteger(rowIndex) || (itemIndex !== 0 && itemIndex !== 1)) {
    return null;
  }

  return { rowIndex, itemIndex };
};

const selectFile = (accept: string): Promise<File | null> =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener(
      "change",
      () => {
        resolve(input.files?.[0] ?? null);
      },
      { once: true },
    );
    input.click();
  });

const downloadActivityZip = async (pairs: DraftPair[]): Promise<void> => {
  const zipBytes = await createActivityZip(buildActivityExport(pairs));
  const blob = new Blob([zipBytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "activity.zip";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
