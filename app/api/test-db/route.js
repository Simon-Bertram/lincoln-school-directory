import { neon, neonConfig } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    console.log("Testing database connection...");

    // Test the connection by running a simple query
    const result =
      await sql`SELECT current_database(), current_user, version()`;
    console.log("Database connection successful:", result);

    // Check if the students table exists
    const tables =
      await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log("Tables in database:", tables);

    const studentsTable = tables.find(
      (table) => table.table_name === "students"
    );
    if (studentsTable) {
      console.log("Students table exists in the database");

      // Get column information
      const columns =
        await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'students'`;
      console.log("Columns in students table:", columns);
    } else {
      console.log("Students table does NOT exist in the database!");
    }

    return NextResponse.json({
      message: "Database connection successful",
      database: result[0].current_database,
      user: result[0].current_user,
      version: result[0].version,
      tables: tables,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      { error: "Database connection failed: " + error.message },
      { status: 500 }
    );
  }
}
