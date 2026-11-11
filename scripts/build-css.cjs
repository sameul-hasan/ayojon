const fs = require("fs");
const path = require("path");
const { compile } = require("@tailwindcss/node");
const { Scanner } = require("@tailwindcss/oxide");

async function buildTailwindCss() {
  // Design tokens live in src/styles/theme.css (@theme block) and are compiled with Tailwind.
  const theme = fs.readFileSync(path.join(process.cwd(), "src", "styles", "theme.css"), "utf8");
  const input = `@import "tailwindcss";\n${theme}`;
  const compiler = await compile(input, {
    base: process.cwd(),
    onDependency: () => {},
  });
  const scanner = new Scanner({
    sources: [
      {
        base: path.join(process.cwd(), "src"),
        pattern: "**/*.{ts,tsx}",
        negated: false,
      },
    ],
  });
  const candidates = scanner.scan();
  const twCss = compiler.build(candidates);

  // Generated output only. Hand-written global styles live in src/app/brand.css.
  const outPath = path.join(process.cwd(), "src", "app", "globals.css");
  fs.writeFileSync(outPath, twCss + "\n", "utf8");
  console.log(`✅ Compiled Tailwind CSS (${twCss.length} bytes, ${candidates.length} candidates) -> src/app/globals.css`);
}

buildTailwindCss().catch((err) => {
  console.error(err);
  process.exit(1);
});
