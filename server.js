import http from "http";
import app from "./index.js";
import { attachWebsocketServer } from "./ws/server.js";
import { pool } from "./db/db.js";

const server = http.createServer(app);

const { broadcastMatchCreated, broadcastCommentary, wss } =
  attachWebsocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(process.env.PORT, process.env.HOST, () => {
  const baseUrl =
    process.env.HOST === "0.0.0.0"
      ? `http://localhost:${process.env.PORT}`
      : `http://${process.env.HOST}:${process.env.PORT}`;
  console.log(`Server running at ${baseUrl}`);
  console.log(
    `Websocket server is running on ${baseUrl.replace("http", "ws")}/ws`,
  );
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  if (wss) {
    await new Promise((resolve) => wss.close(resolve));
    console.log("WebSocket server closed.");
  }
  if (pool) {
    await pool.end();
    console.log("Database pool closed.");
  }
  process.exit(0);
});
