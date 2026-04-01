import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const loaderDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(loaderDir, "..");
const srcRoot = path.join(repoRoot, "src");

function resolveAlias(specifier) {
  const relativePath = specifier.slice(2);
  const candidates = [
    path.join(srcRoot, `${relativePath}.ts`),
    path.join(srcRoot, `${relativePath}.tsx`),
    path.join(srcRoot, relativePath, "index.ts"),
    path.join(srcRoot, relativePath, "index.tsx"),
  ];

  const match = candidates.find((candidate) => existsSync(candidate));

  return match ? pathToFileURL(match).href : null;
}

function resolveExtensionlessRelative(specifier, parentURL) {
  if (!parentURL || !specifier.startsWith("./") && !specifier.startsWith("../")) {
    return null;
  }

  const parentPath = fileURLToPath(parentURL);
  const basePath = path.resolve(path.dirname(parentPath), specifier);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];

  const match = candidates.find((candidate) => existsSync(candidate));

  return match ? pathToFileURL(match).href : null;
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const resolved = resolveAlias(specifier);

    if (!resolved) {
      throw new Error(`Unable to resolve alias import: ${specifier}`);
    }

    return {
      url: resolved,
      shortCircuit: true,
    };
  }

  const relativeResolved = resolveExtensionlessRelative(specifier, context.parentURL);

  if (relativeResolved) {
    return {
      url: relativeResolved,
      shortCircuit: true,
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}
