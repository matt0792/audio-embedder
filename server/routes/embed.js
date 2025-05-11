import express from "express";
import path from "path";
import fs from "fs";
import { processAndSaveTrack } from "../controllers/trackController.js";

const router = express.Router();

router.post("/", async (req, res) => {
  if (!req.files || !req.files.audio) {
    return res.status(400).send("No audio file uploaded");
  }

  const audio = req.files.audio;
  const savePath = path.join("uploads", audio.name);
  await audio.mv(savePath);

  try {
    const track = await processAndSaveTrack(savePath);
    res.json({ success: true, track });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to process track");
  } finally {
    fs.unlinkSync(savePath); // cleanup
  }
});

export default router;
