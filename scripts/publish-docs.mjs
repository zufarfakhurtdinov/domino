import { cpSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

execSync("npm run build", { stdio: "inherit" });

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("dist", "site", { recursive: true });
