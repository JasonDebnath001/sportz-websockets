import { Router } from "express";
import { db } from "../db/db.js";
import { commentary, matches } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { eq, desc } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "Invalid match ID",
      issues: paramsParsed.error.issues,
    });
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      issues: queryParsed.error.issues,
    });
  }

  const { id: matchId } = paramsParsed.data;
  const limit = queryParsed.data.limit ?? 100;

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.json({ data });
  } catch (error) {
    console.error("Failed to fetch commentary:", error);
    res.status(500).json({ error: "Failed to fetch commentary" });
  }
});

commentaryRouter.post("/", async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);

  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "Invalid match ID",
      issues: paramsParsed.error.issues,
    });
  }

  const bodyParsed = createCommentarySchema.safeParse(req.body);

  if (!bodyParsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      issues: bodyParsed.error.issues,
    });
  }

  try {
    // Verify that the referenced match exists
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, paramsParsed.data.id))
      .limit(1);

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const [result] = await db
      .insert(commentary)
      .values({
        matchId: paramsParsed.data.id,
        ...bodyParsed.data,
      })
      .returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error("Failed to create commentary:", error);
    res.status(500).json({
      error: "Failed to create commentary",
    });
  }
});
