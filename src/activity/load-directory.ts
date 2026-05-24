import { DirectoryActivityFileSource } from "./file-source";
import { loadActivityFromSource } from "./load-source";
import type { LoadedActivity } from "./types";

export function loadActivityDirectory(files: ArrayLike<File>): Promise<LoadedActivity> {
  return loadActivityFromSource(new DirectoryActivityFileSource(files));
}
