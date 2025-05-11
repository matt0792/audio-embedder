import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import pLimit from "p-limit";
import { processAndSaveTrack } from "../controllers/trackController.js";

const folderPath = path.resolve("uploads/batch");
const summaryOutputPath = path.resolve("uploads/batch_summary");
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
        const result = await processAndSaveTrack(fullPath);

        if (result?._id) {
          summary.imported.push({
            file,
            name: result.name,
            artist: result.artist,
            _id: result._id,
          });
          console.log(`✓ Saved: ${result.name}`);
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
