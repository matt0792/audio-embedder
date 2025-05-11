import path from "path";
import fs from "fs";
import { runPythonScript } from "../utils/runPython.js";
import { getAudioFingerprint } from "../utils/audioFingerprint.js";
import { connectDB } from "../utils/db.js";
import { createTrackDocument } from "../models/Track.js";
import { convertMp3ToWav } from "../utils/convertToWav.js";
import { extractMetadata } from "../utils/ai.js";

const getMetadataStub = async (filename) => {
  const nameWithExt = path.basename(filename);
  let metadata;

  try {
    metadata = await extractMetadata(nameWithExt);
  } catch (err) {
    console.error("Failed to extract metadata:", err);
    metadata = null;
  }

  return {
    name: metadata?.name ?? path.basename(filename, ".wav"),
    artist: metadata?.artist ?? "Unknown Artist",
    genre: metadata?.genre ?? "Unknown Genre",
    bpm: null,
    tags: metadata?.tags ?? ["placeholder"],
  };
};

export const processAndSaveTrack = async (filepath) => {
  const ext = path.extname(filepath).toLowerCase();
  let wavPath = filepath;

  // Convert MP3 → WAV if needed
  if (ext === ".mp3") {
    wavPath = await convertMp3ToWav(filepath, path.dirname(filepath));
  }

  const fingerprint = await getAudioFingerprint(filepath);

  const db = await connectDB();
  const tracks = db.collection("tracks");

  const existingTrack = await tracks.findOne({ fingerprint });

  if (existingTrack) {
    console.log("Track already exists in the DB. Skipping embedding.");
    // Clean up if temp wav was generated
    if (ext === ".mp3" && wavPath !== filepath) fs.unlinkSync(wavPath);
    return existingTrack;
  }

  const embedding = await runPythonScript(filepath);
  const metadata = await getMetadataStub(wavPath);

  const trackDoc = createTrackDocument({
    ...metadata,
    fingerprint,
    embedding,
  });

  await tracks.insertOne(trackDoc);

  // cleanup
  if (ext === ".mp3" && wavPath !== filepath) fs.unlinkSync(wavPath);

  return trackDoc;
};
