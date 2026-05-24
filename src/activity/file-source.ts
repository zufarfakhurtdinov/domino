export type ActivityFileSource = {
  listPaths(): string[];
  readText(path: string): Promise<string>;
  readBlob(path: string): Promise<Blob>;
};

export class DirectoryActivityFileSource implements ActivityFileSource {
  private readonly files = new Map<string, File>();

  constructor(files: ArrayLike<File>) {
    Array.from(files).forEach((file) => {
      this.files.set(file.webkitRelativePath || file.name, file);
    });
  }

  listPaths(): string[] {
    return [...this.files.keys()];
  }

  async readText(path: string): Promise<string> {
    return this.getFile(path).text();
  }

  async readBlob(path: string): Promise<Blob> {
    return this.getFile(path);
  }

  private getFile(path: string): File {
    const file = this.files.get(path);

    if (!file) {
      throw new Error(`Missing ${path}.`);
    }

    return file;
  }
}
