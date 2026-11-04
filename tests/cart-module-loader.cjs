// Load only the real catalog and its API-base dependency. Keep host-realm
// objects so strict deep equality still detects changes to product contracts.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const files = new Set(["src/lib/shop-catalog.ts", "src/lib/api-base.ts"]);
function resolveCatalogDependency(file, id, options) {
  if (file === "src/lib/shop-catalog.ts" && id === "@/lib/api-base")
    return loadCatalogModule("src/lib/api-base.ts", options);
  throw new Error(`Unexpected dependency: ${id}`);
}
function loadCatalogModule(file, { browser = false } = {}) {
  if (!files.has(file)) throw new Error(`Unexpected dependency: ${file}`);
  const text = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const requireDependency = id => resolveCatalogDependency(file, id, { browser });
  const execute = vm.runInThisContext(`(function(exports, require, process, fetch, window) { ${text}\n})`, { filename: file });
  execute(exports, requireDependency, { env: {} }, () => { throw new Error("Unstubbed fetch is forbidden"); }, browser ? {} : undefined);
  return exports;
}
module.exports = { loadCatalogModule, resolveCatalogDependency };
