/**
 * Aayojon Unified Test Runner
 * Sequentially executes:
 * 1. Domain QA Invariants (tests/qa-suite.test.ts)
 * 2. Firebase Authentication & Middleware (tests/firebase-auth.test.ts)
 * 3. Venue & Services Marketplace with AI Assistant (tests/marketplace-rfq.test.ts)
 * 4. Centralized Role-Based Access Control (RBAC) (tests/rbac.test.ts)
 */

import { runFirebaseAuthSuite } from "./firebase-auth.test";
import { runMarketplaceRfqTests } from "./marketplace-rfq.test";
import { runRbacTestSuite } from "./rbac.test";
import { runPersonaBehavioralTestSuite } from "./persona-behavioral-matrix.test";

async function main() {
  console.log("==================================================");
  console.log("Aayojon Automated Test Runner");
  console.log("==================================================");

  let allPassed = true;

  // 1. Run Domain QA Invariant Suite (14 Invariant Tests)
  console.log("\n--- [Suite 1/5] Domain QA Invariants ---");
  try {
    require("./qa-suite.test");
  } catch (err) {
    console.error("Domain QA suite encountered an unhandled error:", err);
    allPassed = false;
  }

  // 2. Run Firebase Authentication Suite (8 Security/Auth Suites)
  console.log("\n--- [Suite 2/5] Firebase Authentication & Middleware ---");
  try {
    const authPassed = await runFirebaseAuthSuite();
    if (!authPassed) allPassed = false;
  } catch (err) {
    console.error("Firebase Auth suite encountered an unhandled error:", err);
    allPassed = false;
  }

  // 3. Run Venue & Services Marketplace Suite (8 Tests)
  console.log("\n--- [Suite 3/5] Venue & Services Marketplace ---");
  try {
    await runMarketplaceRfqTests();
  } catch (err) {
    console.error("Marketplace RFQ suite encountered an unhandled error:", err);
    allPassed = false;
  }

  // 4. Run Centralized RBAC Suite (15 Security Tests)
  console.log("\n--- [Suite 4/5] Centralized RBAC Security Suite ---");
  try {
    const rbacPassed = await runRbacTestSuite();
    if (!rbacPassed) allPassed = false;
  } catch (err) {
    console.error("RBAC suite encountered an unhandled error:", err);
    allPassed = false;
  }

  // 5. Run Persona Matrix & Behavioral End-to-End Suite (38 Tests)
  try {
    const personaPassed = await runPersonaBehavioralTestSuite();
    if (!personaPassed) allPassed = false;
  } catch (err) {
    console.error("Persona Behavioral suite encountered an unhandled error:", err);
    allPassed = false;
  }

  if (process.exitCode && process.exitCode !== 0) {
    allPassed = false;
  }

  console.log("\n==================================================");
  if (allPassed) {
    console.log("🎉 ALL TEST SUITES PASSED CLEANLY!");
    console.log("==================================================");
    process.exit(0);
  } else {
    console.error("💥 ONE OR MORE TEST SUITES FAILED.");
    console.log("==================================================");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test runner crash:", err);
  process.exit(1);
});
