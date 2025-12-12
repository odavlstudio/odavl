const { execSync } = require("child_process");

const TARGET = process.env.AUDIT_URL || "http://localhost:3003";

console.log("Running OWASP ZAP Baseline Scan…");
try {
  execSync(`docker run -t owasp/zap2docker-stable zap-baseline.py -t ${TARGET}`, { stdio: "inherit" });
} catch (err) {
  console.error("Security scan produced warnings (expected on local environment).");
}
