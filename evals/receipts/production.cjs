const fs = require("node:fs")
const path = require("node:path")
const { createRequire } = require("node:module")

// Reuse the production contract and editor math without building either app.
// TypeScript is already a UI dev dependency. This loader never calls auth APIs.
const root = path.resolve(__dirname, "../..")
const uiRequire = createRequire(path.join(root, "ui/package.json"))
let typescript
try {
  typescript = uiRequire("typescript")
} catch {
  throw new Error("Install UI dependencies first: pnpm -C ui install --frozen-lockfile")
}
const previousLoader = require.extensions[".ts"]
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = typescript.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  })
  module._compile(outputText, filename)
}

try {
  module.exports = {
    ...require(path.join(root, "infra/modules/receipt-ingestion-api/lambda/src/prompts.ts")),
    ...require(path.join(root, "infra/modules/receipt-ingestion-api/lambda/src/schema.ts")),
    ...require(path.join(root, "infra/modules/receipt-ingestion-api/lambda/src/validation.ts")),
    ...require(path.join(root, "ui/lib/receipt-ingestion.ts")),
    ...require(path.join(root, "ui/lib/receipt-editor.ts")),
  }
} finally {
  if (previousLoader) require.extensions[".ts"] = previousLoader
  else delete require.extensions[".ts"]
}
