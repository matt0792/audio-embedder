// using raw driver for now, maybe move to mongoose later (?)

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the correct path to .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = "audio-db";

let db; // cache the db connection

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  }
  return db;
}
