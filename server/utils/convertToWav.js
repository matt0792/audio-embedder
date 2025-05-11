import ffmpeg from "fluent-ffmpeg";
import path from "path";

export const convertMp3ToWav = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(
      outputDir,
      path.basename(inputPath, ".mp3") + ".wav"
    );

    ffmpeg(inputPath)
      .toFormat("wav")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
};
