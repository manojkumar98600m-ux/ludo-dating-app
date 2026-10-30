import AdmZip from "adm-zip";
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const zipPath = path.join(root, "ludo-dating-app-source.zip");
const appDir = path.join(root, "app");
if (!existsSync(zipPath)) throw new Error("Source ZIP not found.");
const zip = new AdmZip(zipPath);
const entries = zip.getEntries().filter((e) => !e.isDirectory);
const parts = new Set(entries.map((e) => e.entryName.split("/")[0]));
const hasRootFiles = entries.some((e) => !e.entryName.includes("/"));
const prefix = !hasRootFiles && parts.size === 1 && entries.some((e) => e.entryName === [...parts][0] + "/package.json") ? [...parts][0] + "/" : "";
for (const e of entries) {
  let name = prefix ? e.entryName.slice(prefix.length) : e.entryName;
  if (!name || name.startsWith("__MACOSX/")) continue;
  const dest = path.resolve(appDir, name);
  if (!dest.startsWith(appDir + path.sep)) throw new Error("Unsafe ZIP path");
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, e.getData());
}
for (const f of ["package.json", "index.html", "vite.config.ts"]) {
  if (!existsSync(path.join(appDir, f))) throw new Error("Missing " + f + " in source archive");
}

// Vite 8 requires a newer esbuild than the source archive currently declares.
const appPackagePath = path.join(appDir, "package.json");
const appPackage = JSON.parse(readFileSync(appPackagePath, "utf8"));
appPackage.devDependencies ??= {};
appPackage.devDependencies.esbuild = "^0.28.2";
writeFileSync(appPackagePath, JSON.stringify(appPackage, null, 2) + "\n");

function run(args) {
  const r = spawnSync("npm", args, { cwd: appDir, stdio: "inherit" });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error("npm command failed");
}
run(["install", "--no-audit", "--no-fund", "--legacy-peer-deps"]);
run(["run", "build"]);
const distDir = path.join(appDir, "dist");
if (!existsSync(path.join(distDir, "index.html"))) throw new Error("Built index.html missing");

// Publish the standalone playable Ludo MVP beside the app's web build.
const gamePath = path.join(root, "website", "ludo.html");
if (!existsSync(gamePath)) throw new Error("Playable Ludo page missing: " + gamePath);
copyFileSync(gamePath, path.join(distDir, "ludo.html"));

// Include all standalone site pages in both the hosted site and Android WebView.
// Keep website/index.html separate because the source ZIP provides the main React app.
for (const name of ["connect.html", "privacy.html", "terms.html", "refund.html", "supabase-config.js"]) {
  const source = path.join(root, "website", name);
  if (existsSync(source)) copyFileSync(source, path.join(distDir, name));
}
const indexPath = path.join(distDir, "index.html");
let html = readFileSync(indexPath, "utf8");

// Copy the real branding assets into the web bundle so Android WebView can display them.
const logoPath = path.join(root, "branding", "ludo-dating-logo.svg");
const iconPath = path.join(root, "branding", "ludo-dating-icon.svg");
if (existsSync(logoPath)) copyFileSync(logoPath, path.join(distDir, "ludo-dating-logo.svg"));
if (existsSync(iconPath)) copyFileSync(iconPath, path.join(distDir, "ludo-dating-icon.svg"));

// Set the tab/WebView icon and show the brand in the app itself.
const favicon = '<link rel="icon" type="image/svg+xml" href="/ludo-dating-icon.svg"><meta name="theme-color" content="#24104b">';
if (!html.includes('ludo-dating-icon.svg')) html = html.replace("</head>", favicon + "</head>");
const brandMark = '<a id="ludo-dating-brand" href="/" aria-label="Ludo Dating home" style="position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);left:10px;z-index:99998;display:flex;align-items:center;gap:7px;padding:5px 10px 5px 5px;border:1px solid #ffffff30;border-radius:999px;background:#24104bef;color:#fff;text-decoration:none;font:700 12px system-ui;box-shadow:0 3px 12px #0003"><img src="/ludo-dating-icon.svg" alt="" style="width:30px;height:30px;border-radius:50%;object-fit:cover"><span>LUDO DATING</span></a>';
if (!html.includes('id="ludo-dating-brand"')) html = html.replace("</body>", brandMark + "</body>");

if (!html.includes('href="/ludo.html"') && !html.includes('href="./ludo.html"')) {
  const launch = '<a href="/ludo.html" style="position:fixed;right:16px;bottom:16px;z-index:99999;background:#8b5cf6;color:#fff;padding:13px 18px;border-radius:999px;text-decoration:none;font:700 15px system-ui;box-shadow:0 6px 22px #0006">🎲 Play Ludo</a>';
  html = html.replace("</body>", launch + "</body>");
}
writeFileSync(indexPath, html);
