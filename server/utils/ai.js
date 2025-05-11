import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const extractMetadata = async (filename) => {
  const prompt = `
You are an intelligent audio metadata assistant.
Given only the filename of an audio track, extract any information you can about the track’s metadata: name, artist, genre, and tags.

Rules:
- Use only information explicitly or obviously implied in the filename or if it is of wide common knowledge.
- If a field cannot be determined with high confidence, return null for that field.
- Do not hallucinate or guess based on common artist names, popular genres, or trends.
- The filename may include underscores, dashes, camelCase, or numbers.
- Tags should be an array of strings, extracted from any keywords in the filename.

Output format:
Return a JSON object like this:
{
  "name": "...",
  "artist": "...",
  "genre": "...",
  "tags": ["..."]
}

Example filenames and outputs:

1. Filename: lofi_vibes_vol3_chillhop-beats.mp3
Output:
{
  "name": "lofi vibes vol3 chillhop beats",
  "artist": null,
  "genre": "lofi",
  "tags": ["chillhop", "beats", "vol3"]
}

2. Filename: KendrickLamar_HUMBLE_explicit.mp3
Output:
{
  "name": "HUMBLE",
  "artist": "Kendrick Lamar",
  "genre": null,
  "tags": ["explicit"]
}

The track filename for you to process is:
${filename}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
  });

  const raw = response.choices[0].message.content;

  // Optional: Try to parse JSON from model output
  try {
    const jsonStart = raw.indexOf("{");
    const jsonString = raw.slice(jsonStart);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Failed to parse model output:", raw);
    return null;
  }
};
