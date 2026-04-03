import AgentAPI from "apminsight";
AgentAPI.config();

import express from "express";
import { matchRouter } from "./routes/matches.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";

const app = express();

// Use JSON middleware
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Sportz API!");
});

app.use(securityMiddleware());

app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);

export default app;
