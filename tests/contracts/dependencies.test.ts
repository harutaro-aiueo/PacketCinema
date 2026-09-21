import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";
const root = path.resolve("src");
function files(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(folder, entry.name))
      : /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")
        ? [path.join(folder, entry.name)]
        : [],
  );
}
it("keeps dependencies within their declared boundaries and acyclic", () => {
  const errors: string[] = [];
  const graph = new Map<string, string[]>();
  for (const file of files(root)) {
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const layer = relative.split("/")[0];
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const imports: string[] = [];
    function visit(node: ts.Node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        imports.push(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        ts.isStringLiteral(node.arguments[0])
      )
        imports.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    }
    visit(source);
    const edges: string[] = [];
    for (const specifier of imports) {
      if (!specifier.startsWith(".")) {
        if (["domain", "protocols"].includes(layer))
          errors.push(relative + " imports " + specifier);
        continue;
      }
      const target = path
        .relative(root, path.resolve(path.dirname(file), specifier))
        .replaceAll("\\", "/");
      const targetLayer = target.split("/")[0];
      const allowed: Record<string, string[]> = {
        domain: ["domain"],
        protocols: ["domain", "protocols"],
        player: ["domain", "player"],
        visualization: ["domain", "visualization"],
      };
      if (allowed[layer] && !allowed[layer].includes(targetLayer))
        errors.push(relative + " imports " + target);
      if (layer === "protocols" && targetLayer === "protocols") {
        const own = relative.split("/")[1],
          other = target.split("/")[1];
        if (
          own !== other &&
          target !== "protocols/" + other &&
          target !== "protocols/" + other + "/index"
        )
          errors.push(relative + " deep imports " + target);
      }
      const resolved = [
        target + ".ts",
        target + ".tsx",
        target + "/index.ts",
      ].find((candidate) => filesCache.has(candidate));
      if (resolved) edges.push(resolved);
    }
    graph.set(relative, edges);
  }
  const visiting = new Set<string>(),
    visited = new Set<string>();
  function visit(file: string) {
    if (visiting.has(file)) {
      errors.push("cycle: " + file);
      return;
    }
    if (visited.has(file)) return;
    visiting.add(file);
    for (const dependency of graph.get(file) ?? []) visit(dependency);
    visiting.delete(file);
    visited.add(file);
  }
  for (const file of graph.keys()) visit(file);
  expect(errors).toEqual([]);
});
const filesCache = new Set(
  files(root).map((file) => path.relative(root, file).replaceAll("\\", "/")),
);
