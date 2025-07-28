#!/usr/bin/env node

/**
 * Cache cleanup script
 * This script can be run periodically to clean up expired cache entries
 */

import { BookCacheService } from '@/lib/book-cache';

async function main() {
  console.log('Starting cache cleanup...');
  
  try {
    // Get cache stats before cleanup
    const statsBefore = await BookCacheService.getCacheStats();
    console.log('Cache stats before cleanup:', statsBefore);
    
    // Clean up expired cache entries
    await BookCacheService.cleanupExpiredCache();
    
    // Get cache stats after cleanup
    const statsAfter = await BookCacheService.getCacheStats();
    console.log('Cache stats after cleanup:', statsAfter);
    
    console.log('Cache cleanup completed successfully');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
    process.exit(1);
  }
}

main();