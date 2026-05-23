import { bootstrapActivityEditor } from "./editor/app";
import "./styles.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app root.");
}

bootstrapActivityEditor(root);
