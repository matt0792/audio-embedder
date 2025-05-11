export function createTrackDocument({
  name,
  artist,
  genre,
  bpm,
  tags = [],
  fingerprint,
  embedding,
}) {
  return {
    name,
    artist,
    genre,
    bpm,
    tags,
    fingerprint,
    embedding,
    createdAt: new Date(),
  };
}
