const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const cacacheIndex = path.join(process.env.HOME, ".npm/_cacache/index-v5");
const cacacheContent = path.join(process.env.HOME, ".npm/_cacache/content-v2/sha512");

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) results = results.concat(walk(filePath));
    else results.push(filePath);
  }
  return results;
}

const tarballMap = {};
for (const f of walk(cacacheIndex)) {
  try {
    const str = fs.readFileSync(f, "utf8");
    const idx = str.indexOf("{");
    if (idx !== -1) {
      const data = JSON.parse(str.slice(idx));
      if (data.key && data.key.includes(".tgz")) {
        const url = data.key.replace("make-fetch-happen:request-cache:", "");
        tarballMap[url] = data.integrity;
      }
    }
  } catch(e) {}
}

function getBlobPath(integrity) {
  if (!integrity || !integrity.startsWith("sha512-")) return null;
  const hex = Buffer.from(integrity.slice(7), "base64").toString("hex");
  const p = path.join(cacacheContent, hex.slice(0, 2), hex.slice(2, 4), hex.slice(4));
  return fs.existsSync(p) ? p : null;
}

function extractTarball(url, destDir) {
  const integrity = tarballMap[url];
  if (!integrity) {
    console.warn("No integrity for:", url);
    return false;
  }
  const blobPath = getBlobPath(integrity);
  if (!blobPath) {
    console.warn("Blob not found for:", url);
    return false;
  }
  fs.mkdirSync(destDir, { recursive: true });
  execSync(`tar -xzf "${blobPath}" --strip-components=1 -C "${destDir}"`);
  console.log(`Extracted: ${url} -> ${destDir}`);
  return true;
}

const rootNodeModules = path.join(__dirname, "..", "node_modules");

// Packages to extract
const pkgs = [
  { url: "https://registry.npmjs.org/vite/-/vite-6.4.3.tgz", dest: path.join(rootNodeModules, "vite") },
  { url: "https://registry.npmjs.org/esbuild/-/esbuild-0.25.12.tgz", dest: path.join(rootNodeModules, "esbuild") },
  { url: "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.25.12.tgz", dest: path.join(rootNodeModules, "@esbuild", "darwin-arm64") },
  { url: "https://registry.npmjs.org/rollup/-/rollup-4.60.2.tgz", dest: path.join(rootNodeModules, "rollup") },
  { url: "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.60.2.tgz", dest: path.join(rootNodeModules, "@rollup", "rollup-darwin-arm64") }
];

for (const p of pkgs) {
  extractTarball(p.url, p.dest);
}

// Ensure .bin links
const binDir = path.join(rootNodeModules, ".bin");
fs.mkdirSync(binDir, { recursive: true });

function linkBin(srcRel, binName) {
  const target = path.join(rootNodeModules, srcRel);
  const link = path.join(binDir, binName);
  try { fs.unlinkSync(link); } catch(e) {}
  try {
    fs.symlinkSync(path.relative(binDir, target), link);
    fs.chmodSync(target, 0o755);
    console.log(`Symlinked bin: ${binName} -> ${srcRel}`);
  } catch(e) {
    console.error(`Error linking ${binName}:`, e.message);
  }
}

linkBin("vite/bin/vite.js", "vite");
linkBin("esbuild/bin/esbuild", "esbuild");
linkBin("rollup/dist/bin/rollup", "rollup");

console.log("Extraction complete!");
