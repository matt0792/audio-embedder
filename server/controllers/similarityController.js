import { connectDB } from "../utils/db.js";
import cosineSimilarity from "compute-cosine-similarity";
import { isValidObjectId } from "../utils/validator.js";
import { ObjectId } from "mongodb";

// find the top N most similar tracks to the given track ID
export const findSimilarTracks = async (trackId, limit = 5) => {
  if (!isValidObjectId(trackId)) {
    throw new Error("Invalid track ID");
  }

  const db = await connectDB();
  const tracksCollection = db.collection("tracks");

  // fetch the target track
  const targetTrack = await tracksCollection.findOne({
    _id: new ObjectId(trackId),
  });
  if (!targetTrack) {
    throw new Error("Target track not found");
  }

  const targetEmbedding = targetTrack.embedding;
  if (!targetEmbedding) {
    throw new Error("Target track does not have an embedding");
  }

  //  fetch other tracks with embeddings
  const otherTracksCursor = tracksCollection.find({
    _id: { $ne: trackId },
    embedding: { $exists: true },
  });

  const similarTracks = [];

  // TODO: Find a better way to do this
  // Currently O(n) runtime
  // Look into vector index
  await otherTracksCursor.forEach((track) => {
    const similarity = cosineSimilarity(targetEmbedding, track.embedding);
    const { embedding, fingerprint, ...sanitizedTrack } = track;
    similarTracks.push({ track: sanitizedTrack, similarity });
  });

  // Sort by similarity in descending order
  similarTracks.sort((a, b) => b.similarity - a.similarity);

  // return the tracks
  return similarTracks.slice(0, limit);
};
