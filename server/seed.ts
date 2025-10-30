import { db } from "./db";
import { users } from "@shared/schema";
import * as bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seedITAccount() {
  try {
    console.log("Checking for existing IT account...");
    
    // Check if IT account already exists
    const existingIT = await db.select()
      .from(users)
      .where(eq(users.username, "APTITMANAGER"));
    
    if (existingIT.length > 0) {
      console.log("IT account already exists.");
      return;
    }
    
    // Create the IT account
    const hashedPassword = await bcrypt.hash("M3OM3OT", 10);
    
    const [itUser] = await db.insert(users).values({
      username: "APTITMANAGER",
      password: hashedPassword,
      role: "IT",
      email: "it@propertypro.com",
      fullName: "IT Manager",
      isActive: true,
      propertyId: null,
      ownerId: null,
      createdBy: null,
    }).returning();
    
    console.log("✅ IT account created successfully:");
    console.log("   Username: APTITMANAGER");
    console.log("   Password: M3OM3OT");
    console.log("   Role: IT");
    console.log("   ID:", itUser.id);
    
  } catch (error) {
    console.error("Error seeding IT account:", error);
    process.exit(1);
  }
}

// Run the seed
seedITAccount().then(() => {
  console.log("Seed completed");
  process.exit(0);
}).catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});