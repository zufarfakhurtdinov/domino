import JSZip from "jszip";
import type { ActivityExport } from "./export";

export const createActivityZip = async (activityExport: ActivityExport): Promise<ArrayBuffer> => {
  const zip = new JSZip();
  const activityDirectory = zip.folder("activity");

  if (!activityDirectory) {
    throw new Error("Could not create activity zip directory.");
  }

  activityDirectory.file("activity.json", JSON.stringify(activityExport.activity, null, 2));

  for (const { name, file } of activityExport.files) {
    activityDirectory.file(name, await file.arrayBuffer());
  }

  return zip.generateAsync({ type: "arraybuffer" });
};
