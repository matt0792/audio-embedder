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
    console.log(`Extracting metadata for ${nameWithExt}`);
    metadata = await extractMetadata(nameWithExt);
    console.log("Metadata extraction successful:", metadata);
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

  console.log(`Starting processing for ${filepath}`);

  // Convert MP3 → WAV if needed
  if (ext === ".mp3") {
    console.log(`Detected MP3 file. Converting to WAV...`);
    wavPath = await convertMp3ToWav(filepath, path.dirname(filepath));
    console.log(`Conversion complete. WAV path: ${wavPath}`);
  }

  console.log(`Generating audio fingerprint for ${wavPath}`);
  const fingerprint = await getAudioFingerprint(wavPath);
  console.log(`Fingerprint generated: ${fingerprint}`);

  console.log("Connecting to database...");
  const db = await connectDB();
  const tracks = db.collection("tracks");

  console.log("Checking if track already exists in the database...");
  const existingTrack = await tracks.findOne({ fingerprint });

  if (existingTrack) {
    console.log(
      "Track already exists in the DB. Skipping embedding and insertion."
    );
    if (ext === ".mp3" && wavPath !== filepath) {
      console.log(`Cleaning up temporary WAV file: ${wavPath}`);
      fs.unlinkSync(wavPath);
    }
    return existingTrack;
  }

  console.log("Track is new. Generating embedding...");
  const embedding = await runPythonScript(wavPath);
  console.log("Embedding generated.");

  console.log("Retrieving metadata...");
  const metadata = await getMetadataStub(wavPath);

  console.log("Creating track document...");
  const trackDoc = createTrackDocument({
    ...metadata,
    fingerprint,
    embedding,
  });

  console.log("Inserting track into database...");
  await tracks.insertOne(trackDoc);
  console.log("Track successfully inserted.");

  if (ext === ".mp3" && wavPath !== filepath) {
    console.log(`Cleaning up temporary WAV file: ${wavPath}`);
    fs.unlinkSync(wavPath);
  }

  console.log("Processing complete.");
  return trackDoc;
};
