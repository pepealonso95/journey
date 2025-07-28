import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { bookLists } from '@/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slugs } = body;
    
    if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ success: false, message: 'No slugs provided' });
    }
    
    // Delete anonymous book lists that have the specified slugs
    // Only delete if they are anonymous and haven't been accessed recently
    const deletedLists = await db
      .delete(bookLists)
      .where(
        and(
          // Use ANY for safe parameter binding with arrays
          sql`${bookLists.slug} = ANY(${slugs})`,
          eq(bookLists.isAnonymous, true),
          // Only delete if created recently (within last hour) to avoid deleting lists that might be in use
          sql`${bookLists.createdAt} > NOW() - INTERVAL '1 hour'`
        )
      )
      .returning({ slug: bookLists.slug });
    
    console.log('Cleaned up unused slugs via beacon:', deletedLists.map(l => l.slug));
    
    return NextResponse.json({ 
      success: true, 
      cleanedSlugs: deletedLists.map(l => l.slug),
      message: `Cleaned up ${deletedLists.length} unused slugs`
    });
  } catch (error) {
    console.error('Failed to cleanup unused slugs via beacon:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to cleanup slugs'
    }, { status: 500 });
  }
}