import type { ActivityFileSource } from "./file-source";
import type { ActivityData, ContentData, LoadedActivity } from "./types";
import type { Content } from "../core/types";

const ACTIVITY_JSON_FILE = "activity.json";

export async function loadActivityFromSource(source: ActivityFileSource): Promise<LoadedActivity> {
  const activityBasePath = getActivityBasePath(source);
  const activityJsonPath = `${activityBasePath}${ACTIVITY_JSON_FILE}`;
  const activity = JSON.parse(await source.readText(activityJsonPath)) as ActivityData;
  const pairs = [];

  for (const pair of activity.pairs) {
    pairs.push({
      id: pair.id,
      items: [
        await resolveContent(source, activityBasePath, pair.items[0]),
        await resolveContent(source, activityBasePath, pair.items[1]),
      ] as [Content, Content],
    });
  }

  return {
    title: activity.title,
    pairs,
  };
}

function getActivityBasePath(source: ActivityFileSource): string {
  const paths = source.listPaths();

  if (paths.includes(ACTIVITY_JSON_FILE)) {
    return "";
  }

  const topLevelDirectories = new Set(
    paths
      .filter((path) => !isIgnoredPath(path))
      .filter((path) => path.includes("/"))
      .map((path) => path.split("/")[0])
      .filter((directory): directory is string => Boolean(directory)),
  );

  if (topLevelDirectories.size === 1) {
    const [directory] = Array.from(topLevelDirectories);
    return `${directory}/`;
  }

  if (topLevelDirectories.size > 1) {
    throw new Error("Missing activity.json: source must contain activity.json at root or inside a single top-level directory.");
  }

  return "";
}

function isIgnoredPath(path: string): boolean {
  return path.startsWith("__MACOSX/") || path.split("/").some((part) => part.startsWith("._"));
}

async function resolveContent(source: ActivityFileSource, activityBasePath: string, content: ContentData): Promise<Content> {
  if (content.type === "text") {
    return { type: "text", value: content.value };
  }

  const path = `${activityBasePath}${content.src}`;

  return {
    type: content.type,
    url: URL.createObjectURL(new Blob([await source.readBlob(path)], { type: getMimeType(path) })),
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
