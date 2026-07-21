import {copyFile, mkdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(packageRoot, "dist");

await mkdir(distDir, {recursive: true});
await copyFile(
    path.join(packageRoot, "src", "theme-controller.js"),
    path.join(distDir, "theme-controller.js")
);

console.log("Built dist/theme-controller.js");
