import { spawn } from "node:child_process";
import path from "path";
import { fileURLToPath } from "url";

// Convert ESM module URL to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to Python script
const pythonScriptPath = path.join(
  __dirname,
  "..",
  "..",
  "python",
  "embed_audio.py"
);

export function runPythonScript(filePath) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", [pythonScriptPath, filePath]);

    let data = "";
    let error = "";

    py.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    py.stderr.on("data", (chunk) => {
      error += chunk.toString();
    });

    py.on("close", (code) => {
      if (code !== 0) {
        reject(error || `Process exited with code ${code}`);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(`Failed to parse JSON: ${e.message}`);
        }
      }
    });
  });
}
