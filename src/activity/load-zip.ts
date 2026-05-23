import JSZip from "jszip";
import type { ActivityData, ContentData, LoadedActivity } from "./types";
import type { Content } from "../core/types";

const ACTIVITY_DIRECTORY = "activity";
const ACTIVITY_JSON_PATH = `${ACTIVITY_DIRECTORY}/activity.json`;

export async function loadActivityZip(file: Blob): Promise<LoadedActivity> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const activityFile = zip.file(ACTIVITY_JSON_PATH);

  if (!activityFile) {
    throw new Error(`Missing ${ACTIVITY_JSON_PATH}.`);
  }

  const activity = JSON.parse(await activityFile.async("string")) as ActivityData;

  return {
    title: activity.title,
    pairs: await Promise.all(
      activity.pairs.map(async (pair) => ({
        id: pair.id,
        items: [
          await resolveContent(zip, pair.items[0]),
          await resolveContent(zip, pair.items[1]),
        ] as [Content, Content],
      })),
    ),
  };
}

async function resolveContent(zip: JSZip, content: ContentData): Promise<Content> {
  if (content.type === "text") {
    return { type: "text", value: content.value };
  }

  const path = `${ACTIVITY_DIRECTORY}/${content.src}`;
  const file = zip.file(path);

  if (!file) {
    throw new Error(`Missing ${path}.`);
  }

  return {
    type: content.type,
    url: URL.createObjectURL(await file.async("blob")),
  };
}
