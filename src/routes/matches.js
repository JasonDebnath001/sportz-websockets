import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match.status.js";
import { desc } from "drizzle-orm";

export const matchRouter = Router();

matchRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      issues: parsed.error.issues,
    });
  }

  const limit = parsed.data.limit ?? 50;

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);
    res.json({ data });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch matches",
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid payload",
      issues: parsed.error.issues,
    });
  }

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
        homeScore: parsed.data.homeScore ?? 0,
        awayScore: parsed.data.awayScore ?? 0,
        status: getMatchStatus(parsed.data.startTime, parsed.data.endTime),
      })
      .returning();

    if (res.app.locals.broadcastMatchCreated) {
      res.app.locals.broadcastMatchCreated(event);
    }

    return res.status(201).json({ data: event });
  } catch (error) {
    console.error("Failed to create match:", error);
    return res.status(500).json({
      error: "Failed to create match",
    });
  }
});
