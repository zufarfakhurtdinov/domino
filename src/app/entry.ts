export type EntryMode = "editor" | "dom" | "svg";

export const resolveEntryMode = (search: string): EntryMode => {
  const params = new URLSearchParams(search);

  if (params.get("mode") === "editor") {
    return "editor";
  }

  return params.get("renderer") === "dom" ? "dom" : "svg";
};
