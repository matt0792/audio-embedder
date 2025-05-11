import { exec } from "child_process";
import util from "util";
const execAsync = util.promisify(exec);

export const getAudioFingerprint = async (filepath) => {
  try {
    const { stdout } = await execAsync(`fpcalc -json "${filepath}"`);
    const { fingerprint } = JSON.parse(stdout);
    return fingerprint;
  } catch (err) {
    console.error("Error generating fingerprint:", err);
    throw err;
  }
};
