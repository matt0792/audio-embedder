import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the correct path to .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import fs from "fs";
import pLimit from "p-limit";
import { connectDB } from "../utils/db.js";
import { processAndSaveTrack } from "../controllers/trackController.js";

connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

const folderPath = path.resolve("../uploads/batch");
const summaryOutputPath = path.resolve("../uploads/batch_summary");
const CONCURRENCY = 4;

async function runBatchImport() {
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".wav") || file.endsWith(".mp3"));

  const summary = {
    imported: [],
    skipped: [],
    failed: [],
    timestamp: new Date().toISOString(),
  };

  const limit = pLimit(CONCURRENCY);

  const tasks = files.map((file) =>
    limit(async () => {
      const fullPath = path.join(folderPath, file);
      try {
        console.log(`Processing ${file}...`);
        const start = Date.now();
        const result = await processAndSaveTrack(fullPath);

        if (result?._id) {
          summary.imported.push({
            file,
            name: result.name,
            artist: result.artist,
            _id: result._id,
          });
          console.log(`✓ Saved: ${result.name} (took ${Date.now() - start}ms)`);
        } else {
          summary.skipped.push({ file, reason: "Duplicate or unknown error" });
          console.log(`→ Skipped: ${file}`);
        }
      } catch (err) {
        summary.failed.push({ file, error: err.message });
        console.error(`✗ Failed to process ${file}:`, err.message);
      }
    })
  );

  await Promise.all(tasks);

  // Ensure summary folder exists
  if (!fs.existsSync(summaryOutputPath)) {
    fs.mkdirSync(summaryOutputPath, { recursive: true });
  }

  const summaryFileName = `batch_summary_${Date.now()}.json`;
  fs.writeFileSync(
    path.join(summaryOutputPath, summaryFileName),
    JSON.stringify(summary, null, 2),
    "utf-8"
  );

  console.log("Batch import complete. Summary written to:", summaryFileName);
}

runBatchImport();
