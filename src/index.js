import express from "express";
import { db, pool } from "./db/db.js";
import { matches, commentary } from "./db/schema.js";
import { eq, desc } from "drizzle-orm";
import { matchRouter } from "./routes/matches.js";

const app = express();

// Use JSON middleware
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Sportz API!");
});

app.use("/", matchRouter);

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  if (pool) {
    await pool.end();
    console.log("Database pool closed.");
  }
  process.exit(0);
});
