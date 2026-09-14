const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.lstatSync(s).isDirectory()) copyDir(s, d);
    else copyFileWithRetries(s, d);
  }
  return true;
}

function sleep(ms) {
  const t = Date.now() + ms;
  while (Date.now() < t) { /* busy wait */ }
}

function copyFileWithRetries(src, dest) {
  const maxAttempts = 5;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.copyFileSync(src, dest);
      return;
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) throw err;
      sleep(300);
    }
  }
}

const root = path.resolve(__dirname, "..");
const distResources = path.join(root, "dist", "win-unpacked", "resources");
const unpackedDir = path.join(distResources, "app.asar.unpacked");

console.log("[COPY-PRISMA] Starting copy processes...");

const sources = [
  path.join(root, "node_modules", ".prisma"),
  path.join(root, "node_modules", "@prisma", "engines"),
  path.join(root, "node_modules", "@prisma", "client", ".prisma"),
];

const targets = [
  path.join(unpackedDir, "node_modules", ".prisma"),
  path.join(unpackedDir, "node_modules", "@prisma", "client", ".prisma"),
  path.join(unpackedDir, "node_modules", "@prisma", "engines"),
  path.join(distResources, "src", "api", ".next", "standalone", "node_modules", ".prisma"),
  path.join(distResources, "src", "api", ".next", "standalone", "node_modules", "@prisma", "engines"),
];

sources.forEach(src => {
  if (fs.existsSync(src)) {
    targets.forEach(dest => {
      console.log(`[COPY-PRISMA] Copying from ${src} to ${dest}`);
      copyDir(src, dest);
    });
  }
});

const prismaDir = path.join(distResources, "prisma");
if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir, { recursive: true });

const binEngine = "query-engine-windows.exe";
const flatBinSrc = path.join(root, "node_modules", ".prisma", "client", binEngine);
const flatBinDest = path.join(prismaDir, binEngine);
if (fs.existsSync(flatBinSrc)) {
  console.log(`[COPY-PRISMA] Copying flat engine to: ${flatBinDest}`);
  copyFileWithRetries(flatBinSrc, flatBinDest);
}

const msvcDlls = ["msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll"];
const sys32 = "C:\\Windows\\System32";

msvcDlls.forEach(dll => {
  const dllSrc = path.join(sys32, dll);
  const dllDest = path.join(prismaDir, dll);
  if (fs.existsSync(dllSrc)) {
    console.log(`[COPY-PRISMA] Bundling MSVC DLL: ${dll}`);
    copyFileWithRetries(dllSrc, dllDest);
  } else {
    console.warn(`[COPY-PRISMA] WARNING: ${dll} not found in System32!`);
  }
});

console.log("[COPY-PRISMA] Done.");
