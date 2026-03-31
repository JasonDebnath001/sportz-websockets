import express from "express";
import { db, pool } from "./db/db.js";
import { matches, commentary } from "./db/schema.js";
import { eq, desc } from "drizzle-orm";
import { matchRouter } from "./routes/matches.js";
import http from "http"
import { attachWebsocketServer } from "./ws/server.js";

const app = express();
const server = http.createServer(app)

// Use JSON middleware
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Sportz API!");
});

app.use("/matches", matchRouter);

const {broadcastMatchCreated} = attachWebsocketServer(server)
app.locals.broadcastMatchCreated = broadcastMatchCreated


server.listen(process.env.PORT, process.env.HOST, () => {
  const baseUrl = process.env.HOST === '0.0.0.0' ? 'http://localhost:8000' : `http://${process.env.HOST}:${process.env.PORT}`;
  console.log(`Server running at http://localhost:${process.env.PORT}`);
  console.log(`Websocket server is running on ${baseUrl.replace('http', 'ws')}/ws`)
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
