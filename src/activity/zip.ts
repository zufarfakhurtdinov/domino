import JSZip from "jszip";
import type { ActivityExport } from "./export";

export const createActivityZip = async (activityExport: ActivityExport): Promise<ArrayBuffer> => {
  const zip = new JSZip();

  zip.file("activity.json", JSON.stringify(activityExport.activity, null, 2));

  for (const { name, file } of activityExport.files) {
    zip.file(name, await file.arrayBuffer());
  }

  return zip.generateAsync({ type: "arraybuffer" });
};
