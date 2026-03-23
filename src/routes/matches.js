import { Router } from "express";
import { createMatchSchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match.status.js";
import { desc } from "drizzle-orm";

export const matchRouter = Router();

matchRouter.get("/matches", async (req, res) => {
  try {
    const allMatches = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt));
    res.json(allMatches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

matchRouter.post("/matches", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid payload",
      details: JSON.stringify(parsed.error),
    });
  }

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
        homeScore: parsed.data.homeScore || 0,
        awayScore: parsed.data.awayScore || 0,
        status: getMatchStatus(parsed.data.startTime, parsed.data.endTime),
      })
      .returning();

    return res.status(201).json({ data: event });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create match",
      details: JSON.stringify(error),
    });
  }
});
