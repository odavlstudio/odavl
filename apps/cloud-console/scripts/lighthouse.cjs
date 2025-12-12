const { execSync } = require("child_process");

const URL = process.env.AUDIT_URL || "http://localhost:3003";

console.log("Running Lighthouse Performance Audit…");
try {
  execSync(`npx lighthouse ${URL} --quiet --chrome-flags="--headless" --only-categories=performance --output=json --output-path=stdout`, { stdio: "inherit" });
} catch (err) {
  console.error("Lighthouse audit failed.");
}
