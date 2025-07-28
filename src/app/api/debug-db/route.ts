import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Test database connectivity
    const testResult = await sql`SELECT 1 as test`;
    
    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'journey_%'
    `;
    
    // Check column names first
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'journey_bookList'
    `;
    
    // Get a few example slugs with basic columns
    const exampleSlugs = await sql`
      SELECT * 
      FROM "journey_bookList"
      LIMIT 2
    `;
    
    return Response.json({
      dbConnected: true,
      testResult: testResult.rows,
      availableTables: tables.rows,
      columns: columns.rows,
      exampleSlugs: exampleSlugs.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      dbConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}