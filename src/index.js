import { eq } from "drizzle-orm";
import { db, pool } from "./db/db.js";
import { demoUsers } from "./db/schema.js";

async function main() {
  try {
    console.log("Performing CRUD operations...");

    const [newUser] = await db
      .insert(demoUsers)
      .values({ name: "Admin User", email: "admin@example.com" })
      .returning();

    if (!newUser) throw new Error("Failed to create user");

    console.log("✅ CREATE:", newUser);

    const foundUser = await db
      .select()
      .from(demoUsers)
      .where(eq(demoUsers.id, newUser.id));

    console.log("✅ READ:", foundUser[0]);

    const [updatedUser] = await db
      .update(demoUsers)
      .set({ name: "Super Admin" })
      .where(eq(demoUsers.id, newUser.id))
      .returning();

    if (!updatedUser) throw new Error("Failed to update user");

    console.log("✅ UPDATE:", updatedUser);

    await db.delete(demoUsers).where(eq(demoUsers.id, newUser.id));
    console.log("✅ DELETE: User deleted");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log("Database pool closed.");
    }
  }
}

main();
