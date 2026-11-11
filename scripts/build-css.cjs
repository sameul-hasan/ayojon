const fs = require("fs");
const path = require("path");
const { compile } = require("@tailwindcss/node");
const { Scanner } = require("@tailwindcss/oxide");

async function buildTailwindCss() {
  const input = `@import "tailwindcss";`;
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

  const customStyles = `
:root {
  --bg-canvas: #f8fafc;
  --bg-card: #ffffff;
  --accent-emerald: #059669;
  --accent-amber: #d97706;
}

body {
  background-color: #f8fafc;
  color: #0f172a;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
`;

  const outPath = path.join(process.cwd(), "src", "app", "globals.css");
  fs.writeFileSync(outPath, twCss + "\n" + customStyles, "utf8");
  console.log(`✅ Compiled Tailwind CSS (${twCss.length} bytes, ${candidates.length} candidates) -> src/app/globals.css`);
}

buildTailwindCss().catch((err) => {
  console.error(err);
  process.exit(1);
});

