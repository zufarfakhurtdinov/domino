import JSZip from "jszip";
import type { ActivityFileSource } from "./file-source";
import { loadActivityFromSource } from "./load-source";
import type { LoadedActivity } from "./types";

export async function loadActivityZip(file: Blob): Promise<LoadedActivity> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  return loadActivityFromSource(new ZipActivityFileSource(zip));
}

class ZipActivityFileSource implements ActivityFileSource {
  constructor(private readonly zip: JSZip) {}

  listPaths(): string[] {
    return Object.keys(this.zip.files).filter((path) => !this.zip.files[path].dir);
  }

  async readText(path: string): Promise<string> {
    return this.getFile(path).async("string");
  }

  async readBlob(path: string): Promise<Blob> {
    return new Blob([await this.getFile(path).async("arraybuffer")]);
  }

  private getFile(path: string): JSZip.JSZipObject {
    const file = this.zip.file(path);

    if (!file) {
      throw new Error(`Missing ${path}.`);
    }

    return file;
  }
}
