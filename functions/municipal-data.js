#!/usr/bin/env node
/**
 * Wrapper to generate municipal JSON assets from CLI or automation.
 * Delegates the heavy lifting to the Python script that performs
 * the CSV/XLSX → JSON transformation.
 */

import { fileURLToPath } from "url";
import path from "path";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

async function runPythonScript() {
  const scriptPath = path.join(PROJECT_ROOT, "load_municipal_data.py");
  console.log(`▶️  Exécution de ${scriptPath}`);

  const { stdout, stderr } = await execFileAsync("python", [scriptPath], {
    cwd: PROJECT_ROOT,
    env: process.env,
    timeout: 10 * 60 * 1000
  });

  if (stdout) {
    console.log(stdout.trim());
  }

  if (stderr) {
    console.error(stderr.trim());
  }
}

export async function importMunicipalData() {
  try {
    await runPythonScript();
    console.log("✅ Données municipales générées");
  } catch (error) {
    console.error("❌ Erreur lors de la génération des données municipales", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  importMunicipalData().catch(() => {
    process.exitCode = 1;
  });
}
