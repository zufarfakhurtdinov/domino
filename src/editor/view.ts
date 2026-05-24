import type { DraftContent, DraftPair } from "../activity/editor-types";
import { canExportDraftPairs, isDraftContentValid, isDraftPairValid } from "../activity/editor-state";

export const renderEditorHtml = (pairs: DraftPair[]): string => `
  <section class="activity-editor" aria-labelledby="activity-editor-title">
    <header class="activity-editor-header">
      <h1 id="activity-editor-title">Activity editor</h1>
    </header>
    <div class="activity-editor-table" role="table" aria-label="Activity pairs">
      <div class="activity-editor-row activity-editor-row-head" role="row">
        <div role="columnheader">#</div>
        <div role="columnheader">Item 1</div>
        <div role="columnheader">Item 2</div>
        <div role="columnheader">Actions</div>
      </div>
      ${pairs.map(renderRow).join("")}
    </div>
    <div class="activity-editor-bottom-actions">
      <div></div>
      <button type="button" class="editor-button" data-action="add-row">Add row</button>
      <button type="button" class="editor-button editor-button-primary" data-action="export"${
        canExportDraftPairs(pairs) ? "" : " disabled"
      }>Export</button>
      <div></div>
    </div>
  </section>
`;

const renderRow = (pair: DraftPair, rowIndex: number): string => `
  <div class="activity-editor-row" role="row" data-row-index="${rowIndex}" data-invalid="${!isDraftPairValid(pair)}">
    <div class="activity-editor-row-number" role="cell">${rowIndex + 1}</div>
    ${renderCell(pair.items[0], rowIndex, 0)}
    ${renderCell(pair.items[1], rowIndex, 1)}
    <div class="activity-editor-row-actions" role="cell">
      <button type="button" class="editor-icon-button" data-action="delete-row" data-row-index="${rowIndex}" title="Delete row">x</button>
    </div>
  </div>
`;

const renderCell = (content: DraftContent, rowIndex: number, itemIndex: number): string => {
  const invalid = !isDraftContentValid(content);
  const mediaKind = content.kind === "image" || content.kind === "audio" ? content.kind : null;
  const textValue = content.kind === "text" ? content.text : content.kind === "image" || content.kind === "audio" ? content.file.name : "";
  const disabled = mediaKind ? " disabled" : "";

  return `
    <div class="activity-editor-cell" role="cell" data-row-index="${rowIndex}" data-item-index="${itemIndex}" data-invalid="${invalid}"${
      mediaKind ? ` data-active="${mediaKind}"` : ""
    }>
      <div class="activity-editor-cell-main">
        <input class="activity-editor-input" data-action="text" data-row-index="${rowIndex}" data-item-index="${itemIndex}" value="${escapeHtml(
          textValue,
        )}"${disabled} placeholder="Text" />
        ${mediaKind ? `<button type="button" class="editor-icon-button" data-action="discard-media" data-row-index="${rowIndex}" data-item-index="${itemIndex}" title="Discard media">x</button>` : ""}
        ${renderUploadButton("image", mediaKind, rowIndex, itemIndex)}
        ${renderUploadButton("audio", mediaKind, rowIndex, itemIndex)}
      </div>
      ${renderPreview(content)}
    </div>
  `;
};

const renderUploadButton = (
  kind: "image" | "audio",
  activeKind: "image" | "audio" | null,
  rowIndex: number,
  itemIndex: number,
): string => {
  const active = activeKind === kind;
  const disabled = activeKind && !active ? " disabled" : "";

  return `<button type="button" class="editor-icon-button" data-action="upload-${kind}" data-row-index="${rowIndex}" data-item-index="${itemIndex}"${
    active ? ` data-active="${kind}"` : ""
  }${disabled} title="Upload ${kind}">${kind === "image" ? "image" : "audio"}</button>`;
};

const renderPreview = (content: DraftContent): string => {
  if (content.kind === "image") {
    return `<img class="activity-editor-preview" alt="" src="${escapeHtml(URL.createObjectURL(content.file))}" />`;
  }

  if (content.kind === "audio") {
    return `<audio class="activity-editor-preview" controls src="${escapeHtml(URL.createObjectURL(content.file))}"></audio>`;
  }

  return "";
};

const escapeHtml = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
