import express from "express";
import fileUpload from "express-fileupload";
import embedRoute from "./routes/embed.js";
import similarityRoute from "./routes/similarity.js";

import { connectDB } from "./utils/db.js";

const app = express();

app.use(express.json());
app.use(fileUpload());

app.use("/api/embed", embedRoute);
app.use("/api/similarity", similarityRoute);

// connect to db on startup
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB", err);
  process.exit(1);
});

export default app;
