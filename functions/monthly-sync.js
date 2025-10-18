#!/usr/bin/env node
/**
 * Helper script used for scheduled synchronisation.
 * It simply delegates to the Python pipeline that generates the JSON assets
 * consumed by the web application.
 */

import { fileURLToPath } from "url";
import path from "path";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

async function runPythonScript(scriptName) {
  const scriptPath = path.join(PROJECT_ROOT, scriptName);
  console.log(`▶️  Exécution de ${scriptPath}`);

  const { stdout, stderr } = await execFileAsync("python", [scriptPath], {
    cwd: PROJECT_ROOT,
    env: process.env,
    timeout: 30 * 60 * 1000
  });

  if (stdout) {
    console.log(stdout.trim());
  }

  if (stderr) {
    console.error(stderr.trim());
  }
}

export async function monthlySync() {
  console.log("==============================================");
  console.log("🔄 Synchronisation mensuelle - données Val-d'Or");
  console.log("==============================================");

  await runPythonScript("download_gov_data.py");

  console.log("✅ Synchronisation terminée");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  monthlySync().catch((error) => {
    console.error("❌ Échec de la synchronisation:", error);
    process.exitCode = 1;
  });
}
