import JSZip from "jszip";
import type { ActivityData, ContentData, LoadedActivity } from "./types";
import type { Content } from "../core/types";

const ACTIVITY_JSON_FILE = "activity.json";

export async function loadActivityZip(file: Blob): Promise<LoadedActivity> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const activityBasePath = getActivityBasePath(zip);
  const activityJsonPath = `${activityBasePath}${ACTIVITY_JSON_FILE}`;
  const activityFile = zip.file(activityJsonPath);

  if (!activityFile) {
    throw new Error(`Missing ${activityJsonPath}.`);
  }

  const activity = JSON.parse(await activityFile.async("string")) as ActivityData;

  return {
    title: activity.title,
    pairs: await Promise.all(
      activity.pairs.map(async (pair) => ({
        id: pair.id,
        items: [
          await resolveContent(zip, activityBasePath, pair.items[0]),
          await resolveContent(zip, activityBasePath, pair.items[1]),
        ] as [Content, Content],
      })),
    ),
  };
}

function getActivityBasePath(zip: JSZip): string {
  if (zip.file(ACTIVITY_JSON_FILE)) {
    return "";
  }

  const topLevelDirectories = new Set(
    Object.keys(zip.files)
      .filter((path) => !isIgnoredZipPath(path))
      .filter((path) => path.includes("/"))
      .map((path) => path.split("/")[0])
      .filter((directory): directory is string => Boolean(directory)),
  );

  if (topLevelDirectories.size === 1) {
    const [directory] = Array.from(topLevelDirectories);
    return `${directory}/`;
  }

  if (topLevelDirectories.size > 1) {
    throw new Error("Missing activity.json: zip must contain activity.json at root or inside a single top-level directory.");
  }

  return "";
}

function isIgnoredZipPath(path: string): boolean {
  return path.startsWith("__MACOSX/") || path.split("/").some((part) => part.startsWith("._"));
}

async function resolveContent(zip: JSZip, activityBasePath: string, content: ContentData): Promise<Content> {
  if (content.type === "text") {
    return { type: "text", value: content.value };
  }

  const path = `${activityBasePath}${content.src}`;
  const file = zip.file(path);

  if (!file) {
    throw new Error(`Missing ${path}.`);
  }

  return {
    type: content.type,
    url: URL.createObjectURL(new Blob([await file.async("arraybuffer")], { type: getMimeType(path) })),
  };
}

function getMimeType(path: string): string {
  const extension = path.toLocaleLowerCase().split(".").at(-1);

  switch (extension) {
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "m4a":
      return "audio/mp4";
    default:
      return "";
  }
}
