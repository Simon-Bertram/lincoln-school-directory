import { neon, neonConfig } from "@neondatabase/serverless";

// Enable connection pooling
neonConfig.fetchConnectionCache = true;

// Create a singleton instance of the database connection
let sql: ReturnType<typeof neon> | null = null;

interface ColumnInfo {
  column_name: string;
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!sql) {
    try {
      sql = neon(process.env.DATABASE_URL);
      console.log("Database connection initialized");
    } catch (error) {
      console.error("Failed to initialize database connection:", error);
      throw error;
    }
  }

  return sql;
}

// Helper function to safely execute SQL queries with error handling
export async function executeQuery<T>(
  queryFn: (sql: ReturnType<typeof neon>) => Promise<T>
): Promise<T> {
  const db = getDb();
  try {
    return await queryFn(db);
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Helper function to check if a table exists
export async function tableExists(tableName: string): Promise<boolean> {
  return executeQuery(async (sql) => {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    return Boolean((result as { exists: boolean }[])[0]?.exists);
  });
}

// Helper function to get table columns
export async function getTableColumns(tableName: string): Promise<string[]> {
  return executeQuery(async (sql) => {
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    return (result as ColumnInfo[]).map((col) => col.column_name);
  });
}
