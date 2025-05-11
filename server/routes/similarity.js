import express from "express";
import { findSimilarTracks } from "../controllers/similarityController.js";

const router = express.Router();

router.get("/:trackId", async (req, res) => {
  const { trackId } = req.params;
  const limit = parseInt(req.query.limit) || 5;

  try {
    const similarTracks = await findSimilarTracks(trackId, limit);
    res.json(similarTracks);
  } catch (err) {
    console.error("Error finding similar tracks", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
