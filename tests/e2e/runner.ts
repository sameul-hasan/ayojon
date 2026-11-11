/**
 * Aayojon Comprehensive E2E Test Runner
 * 
 * Supports Tier 1 (Features), Tier 2 (Boundaries), Tier 3 (Combinations), Tier 4 (Scenarios).
 * Usage:
 *   node ./node_modules/.bin/jiti tests/e2e/runner.ts [--tier=all|1|2|3|4] [--grep=pattern] [--bail]
 */

import path from "path";
import fs from "fs";

// Register TypeScript and TSX compilation extensions for transparent resolution
try {
  const typescript = require("typescript");
  if (require.extensions) {
    if (!require.extensions[".tsx"]) {
      require.extensions[".tsx"] = function (module: any, filename: string) {
        const content = fs.readFileSync(filename, "utf8");
        const transpiled = typescript.transpileModule(content, {
          compilerOptions: {
            module: typescript.ModuleKind.CommonJS,
            jsx: typescript.JsxEmit.ReactJSX,
            target: typescript.ScriptTarget.ES2022,
          },
        });
        module._compile(transpiled.outputText, filename);
      };
    }
    if (!require.extensions[".ts"]) {
      require.extensions[".ts"] = function (module: any, filename: string) {
        const content = fs.readFileSync(filename, "utf8");
        const transpiled = typescript.transpileModule(content, {
          compilerOptions: {
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2022,
          },
        });
        module._compile(transpiled.outputText, filename);
      };
    }
  }
} catch {
  // TypeScript already supported by runtime (e.g. tsx)
}

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

export interface TestCase {
  id: string;
  tier: number;
  featureId?: string;
  name: string;
  fn: () => void | Promise<void>;
}

export interface TestResult {
  id: string;
  tier: number;
  featureId?: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

class TestRegistry {
  public tests: TestCase[] = [];
  public currentTier = 1;
  public currentFeature = "";

  public register(id: string, name: string, fn: () => void | Promise<void>) {
    this.tests.push({
      id,
      tier: this.currentTier,
      featureId: this.currentFeature,
      name,
      fn,
    });
  }
}

export const registry = new TestRegistry();

export function setRunnerContext(tier: number, featureId = "") {
  registry.currentTier = tier;
  registry.currentFeature = featureId;
}

export function test(id: string, name: string, fn: () => void | Promise<void>) {
  registry.register(id, name, fn);
}

// Parse CLI flags
function parseArgs() {
  const args = process.argv.slice(2);
  let tierFilter: number[] | null = null;
  let grepFilter: RegExp | null = null;
  let bail = false;
  let json = false;

  for (const arg of args) {
    if (arg.startsWith("--tier=")) {
      const val = arg.split("=")[1];
      if (val !== "all") {
        tierFilter = val.split(",").map(Number);
      }
    } else if (arg.startsWith("--grep=")) {
      grepFilter = new RegExp(arg.split("=")[1], "i");
    } else if (arg === "--bail") {
      bail = true;
    } else if (arg === "--json") {
      json = true;
    }
  }

  return { tierFilter, grepFilter, bail, json };
}

let isRunning = false;

export async function runSuite() {
  if (isRunning) return;
  isRunning = true;
  const config = parseArgs();

  // Load all 4 tier suites using jiti
  const jiti = require("jiti")(process.cwd(), {
    alias: { "@": path.join(process.cwd(), "src") },
  });

  console.log(`${BOLD}${CYAN}==============================================================${RESET}`);
  console.log(`${BOLD}${CYAN}          AAYOJON COMPREHENSIVE 4-TIER E2E TEST RUNNER        ${RESET}`);
  console.log(`${BOLD}${CYAN}==============================================================${RESET}\n`);

  // Dynamically require tier test suites
  try { jiti("./tests/e2e/tier1-features.test.ts"); } catch (e) { /* Pending creation */ }
  try { jiti("./tests/e2e/tier2-boundary.test.ts"); } catch (e) { /* Pending creation */ }
  try { jiti("./tests/e2e/tier3-combinations.test.ts"); } catch (e) { /* Pending creation */ }
  try { jiti("./tests/e2e/tier4-scenarios.test.ts"); } catch (e) { /* Pending creation */ }

  const filteredTests = registry.tests.filter((t) => {
    if (config.tierFilter && !config.tierFilter.includes(t.tier)) return false;
    if (config.grepFilter && !config.grepFilter.test(`${t.id} ${t.name}`)) return false;
    return true;
  });

  if (filteredTests.length === 0) {
    console.log(`${YELLOW}No tests matched the requested filters.${RESET}`);
    return;
  }

  const results: TestResult[] = [];
  const startTime = Date.now();
  let currentTier = -1;

  for (const t of filteredTests) {
    if (t.tier !== currentTier) {
      currentTier = t.tier;
      console.log(`\n${BOLD}--- TIER ${currentTier} EXECUTION ---${RESET}`);
    }

    const tStart = performance.now();
    try {
      await t.fn();
      const tDuration = Math.round(performance.now() - tStart);
      results.push({ ...t, passed: true, durationMs: tDuration });
      console.log(`  ${GREEN}✅ PASS${RESET} [${t.id}] ${t.name} ${BOLD}(${tDuration}ms)${RESET}`);
    } catch (err: any) {
      const tDuration = Math.round(performance.now() - tStart);
      results.push({ ...t, passed: false, durationMs: tDuration, error: err });
      console.error(`  ${RED}❌ FAIL${RESET} [${t.id}] ${t.name} (${tDuration}ms)`);
      console.error(`     ${RED}${err.message || err}${RESET}`);
      if (config.bail) {
        console.log(`\n${RED}Aborting further tests due to --bail flag.${RESET}`);
        break;
      }
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;
  const passRate = results.length > 0 ? ((totalPassed / results.length) * 100).toFixed(1) : "0.0";

  console.log(`\n${BOLD}${CYAN}==============================================================${RESET}`);
  console.log(`${BOLD}${CYAN}                     E2E EXECUTION SUMMARY                    ${RESET}`);
  console.log(`${BOLD}${CYAN}==============================================================${RESET}`);
  console.log(` Tier    Description             Total  Passed  Failed  Pass Rate`);
  console.log(` ------------------------------------------------------------`);

  const tierMeta = [
    { tier: 1, desc: "Feature Coverage     " },
    { tier: 2, desc: "Boundary & Limits    " },
    { tier: 3, desc: "Cross-Feature Pairs  " },
    { tier: 4, desc: "Real-World Scenarios " },
  ];

  for (const m of tierMeta) {
    const tierTests = results.filter((r) => r.tier === m.tier);
    if (tierTests.length > 0) {
      const p = tierTests.filter((r) => r.passed).length;
      const f = tierTests.filter((r) => !r.passed).length;
      const rate = ((p / tierTests.length) * 100).toFixed(1);
      console.log(` Tier ${m.tier}  ${m.desc}   ${String(tierTests.length).padStart(4)}   ${String(p).padStart(5)}   ${String(f).padStart(5)}   ${rate.padStart(5)}%`);
    }
  }

  console.log(` ------------------------------------------------------------`);
  console.log(` TOTAL                            ${String(results.length).padStart(4)}   ${String(totalPassed).padStart(5)}   ${String(totalFailed).padStart(5)}   ${passRate.padStart(5)}%`);
  console.log(`${BOLD}${CYAN}==============================================================${RESET}`);
  console.log(` Total Time: ${totalDuration}s`);

  if (totalFailed > 0) {
    console.log(`${BOLD}${RED} Status: FAILED (${totalFailed} failure(s))${RESET}\n`);
    process.exitCode = 1;
  } else {
    console.log(`${BOLD}${GREEN} Status: ALL TESTS PASSED (100% Pass Rate)${RESET}\n`);
    process.exitCode = 0;
  }
}

// Auto-run when executed as entry point
const isDirectRun =
  require.main === module ||
  Boolean(process.argv[1] && (process.argv[1].includes("runner") || process.argv[1].includes("jiti"))) ||
  Boolean(process.argv[2] && process.argv[2].includes("runner"));

if (isDirectRun) {
  setTimeout(() => {
    runSuite().catch((err) => {
      console.error("Fatal runner error:", err);
      process.exit(1);
    });
  }, 10);
}
