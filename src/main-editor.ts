import { bootstrapActivityEditor } from "./editor/app";
import "./styles.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app root.");
}

root.setAttribute("aria-label", "Activity editor");
bootstrapActivityEditor(root);
