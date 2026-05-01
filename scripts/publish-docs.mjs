import { cpSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

execSync("npm run build", { stdio: "inherit" });

rmSync("docs", { recursive: true, force: true });
mkdirSync("docs", { recursive: true });
cpSync("dist", "docs", { recursive: true });
