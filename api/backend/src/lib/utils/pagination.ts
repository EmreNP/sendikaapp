/**
 * Firestore Pagination Utilities
 * 
 * Provides cursor-based pagination helpers for efficient, scalable queries
 * Best practices:
 * - Uses Firestore's .limit() to fetch only needed documents
 * - Uses .startAfter() for cursor-based pagination (no offset)
 * - Avoids fetching all documents into memory
 * - Reduces Firestore read costs significantly
 */

import type { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';

export interface PaginationParams {
  /** Current page number (1-indexed) */
  page?: number;
  /** Number of items per page (max 100) */
  limit?: number;
  /** Cursor token from previous page (base64 encoded) */
  cursor?: string;
}

export interface PaginatedResponse<T> {
  /** Array of paginated items */
  items: T[];
  /** Total count (if available, may be null for cursor-based) */
  total?: number;
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Whether there are more pages */
  hasMore: boolean;
  /** Cursor for next page (base64 encoded) */
  nextCursor?: string;
  /** Cursor for previous page (base64 encoded) */
  prevCursor?: string;
}

export interface PaginationMetadata {
  lastDoc?: QueryDocumentSnapshot;
  firstDoc?: QueryDocumentSnapshot;
  hasMore: boolean;
}

/**
 * Parse pagination parameters from URL
 * Ensures valid page/limit values with defaults
 */
export function parsePaginationParams(url: URL): Required<Omit<PaginationParams, 'cursor'>> & Pick<PaginationParams, 'cursor'> {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
  const cursor = url.searchParams.get('cursor') || undefined;
  
  return { page, limit, cursor };
}

/**
 * Encode cursor to base64 for URL safety
 */
function encodeCursor(docId: string, fieldValue: any): string {
  const cursorData = { id: docId, value: fieldValue };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64url');
}

/**
 * Decode cursor from base64
 */
function decodeCursor(cursor: string): { id: string; value: any } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Execute cursor-based pagination query
 * 
 * Best for infinite scroll or forward-only pagination
 * - Most efficient: only fetches needed documents
 * - No expensive OFFSET operations
 * - Works with any query complexity
 * 
 * @param baseQuery - Base Firestore query with filters and orderBy
 * @param params - Pagination parameters
 * @param mapper - Function to transform document to desired type
 * @returns Paginated response with cursor tokens
 */
export async function paginateWithCursor<T>(
  baseQuery: Query,
  params: Pick<PaginationParams, 'limit' | 'cursor'>,
  mapper: (doc: QueryDocumentSnapshot) => T
): Promise<Omit<PaginatedResponse<T>, 'page' | 'total'>> {
  const limit = Math.min(100, params.limit || 25);
  
  let query = baseQuery;
  
  // Apply cursor if provided
  if (params.cursor) {
    const cursorData = decodeCursor(params.cursor);
    if (cursorData) {
      // Get the document at cursor position
      // Note: This assumes the query has an orderBy clause
      // The cursor contains both doc ID and the orderBy field value
      query = query.startAfter(cursorData.value, cursorData.id);
    }
  }
  
  // Fetch limit + 1 to determine if there are more pages
  const snapshot = await query.limit(limit + 1).get();
  
  const hasMore = snapshot.docs.length > limit;
  const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;
  
  const items = docs.map(mapper);
  
  let nextCursor: string | undefined;
  let prevCursor: string | undefined;
  
  if (hasMore && docs.length > 0) {
    const lastDoc = docs[docs.length - 1];
    // Extract the orderBy field value for cursor
    // This assumes the first orderBy field is the primary sort
    const orderByFields = getOrderByFields(baseQuery);
    const fieldValue = orderByFields[0] ? lastDoc.get(orderByFields[0]) : lastDoc.id;
    nextCursor = encodeCursor(lastDoc.id, fieldValue);
  }
  
  if (docs.length > 0 && params.cursor) {
    const firstDoc = docs[0];
    const orderByFields = getOrderByFields(baseQuery);
    const fieldValue = orderByFields[0] ? firstDoc.get(orderByFields[0]) : firstDoc.id;
    prevCursor = encodeCursor(firstDoc.id, fieldValue);
  }
  
  return {
    items,
    limit,
    hasMore,
    nextCursor,
    prevCursor,
  };
}

/**
 * Execute offset-based pagination query
 * 
 * Better for admin panels with page numbers
 * - Allows jumping to specific pages
 * - More intuitive UI with page numbers
 * - Slightly less efficient than cursor-based for large offsets
 * 
 * Trade-off: Uses .offset() which skips documents, so Firestore still
 * reads skipped documents (but doesn't return them)
 * For very large datasets, prefer cursor-based pagination
 * 
 * @param baseQuery - Base Firestore query with filters and orderBy
 * @param params - Pagination parameters
 * @param mapper - Function to transform document to desired type
 * @param includeTotal - Whether to fetch total count (adds extra query)
 * @returns Paginated response with page numbers
 */
export async function paginateWithOffset<T>(
  baseQuery: Query,
  params: Pick<PaginationParams, 'page' | 'limit'>,
  mapper: (doc: QueryDocumentSnapshot) => T,
  includeTotal: boolean = false
): Promise<PaginatedResponse<T>> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, params.limit || 25);
  const offset = (page - 1) * limit;
  
  // Fetch page + 1 item to determine if there are more pages
  const snapshot = await baseQuery
    .offset(offset)
    .limit(limit + 1)
    .get();
  
  const hasMore = snapshot.docs.length > limit;
  const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;
  
  const items = docs.map(mapper);
  
  // Optionally fetch total count (requires additional query)
  let total: number | undefined;
  if (includeTotal) {
    const countSnapshot = await baseQuery.count().get();
    total = countSnapshot.data().count;
  }
  
  return {
    items,
    total,
    page,
    limit,
    hasMore,
  };
}

/**
 * Extract orderBy field names from a query
 * Helper to build cursors correctly
 */
function getOrderByFields(query: Query): string[] {
  // Firestore Query doesn't expose orderBy fields directly
  // This is a limitation - we need to track orderBy fields separately
  // For now, return empty array and let caller handle it
  // In production, consider passing orderBy fields explicitly
  return [];
}

/**
 * Hybrid pagination: Efficient for both UI patterns
 * 
 * - For first page: uses offset pagination (can get total count)
 * - For subsequent pages: uses cursor pagination (more efficient)
 * 
 * Best of both worlds:
 * - Admin can see total pages on first load
 * - Forward navigation is highly efficient
 * 
 * @param baseQuery - Base Firestore query
 * @param params - Pagination parameters
 * @param mapper - Document mapper function
 * @param orderByField - Primary orderBy field name for cursor
 * @returns Paginated response
 */
export async function paginateHybrid<T>(
  baseQuery: Query,
  params: PaginationParams,
  mapper: (doc: QueryDocumentSnapshot) => T,
  orderByField: string = 'createdAt'
): Promise<PaginatedResponse<T>> {
  const limit = Math.min(100, params.limit || 25);
  const page = params.page || 1;
  
  // If cursor is provided, use cursor-based pagination (most efficient)
  if (params.cursor) {
    const cursorData = decodeCursor(params.cursor);
    let query = baseQuery;
    
    if (cursorData) {
      query = query.startAfter(cursorData.value, cursorData.id);
    }
    
    const snapshot = await query.limit(limit + 1).get();
    const hasMore = snapshot.docs.length > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;
    
    const items = docs.map(mapper);
    
    let nextCursor: string | undefined;
    if (hasMore && docs.length > 0) {
      const lastDoc = docs[docs.length - 1];
      const fieldValue = lastDoc.get(orderByField) || lastDoc.id;
      nextCursor = encodeCursor(lastDoc.id, fieldValue);
    }
    
    return {
      items,
      page,
      limit,
      hasMore,
      nextCursor,
    };
  }
  
  // For first page or specific page request, use offset
  // This allows getting total count and showing page numbers
  const offset = (page - 1) * limit;
  const snapshot = await baseQuery
    .offset(offset)
    .limit(limit + 1)
    .get();
  
  const hasMore = snapshot.docs.length > limit;
  const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;
  
  const items = docs.map(mapper);
  
  // Generate cursor for next page (for efficient forward navigation)
  let nextCursor: string | undefined;
  if (hasMore && docs.length > 0) {
    const lastDoc = docs[docs.length - 1];
    const fieldValue = lastDoc.get(orderByField) || lastDoc.id;
    nextCursor = encodeCursor(lastDoc.id, fieldValue);
  }
  
  // Always fetch total count to support standard pagination UI on all pages
  // Firestore count() queries are cheap (1 read per 1000 index entries)
  const countSnapshot = await baseQuery.count().get();
  const total = countSnapshot.data().count;
  
  return {
    items,
    total,
    page,
    limit,
    hasMore,
    nextCursor,
  };
}

/**
 * Batch-based search with in-memory filtering
 * 
 * Instead of fetching 500 docs at once, fetches in smaller batches (e.g., 50)
 * using Firestore cursors and applies the filter function. Stops when we have
 * enough results for the requested page, or we've exhausted all documents.
 * 
 * Benefits over fetching 500 docs at once:
 * - Lower memory usage
 * - Faster response for common searches (matches found in early batches)
 * - Still handles rare searches by fetching more batches
 * - Respects Firestore read costs
 * 
 * @param baseQuery - Base Firestore query with filters and orderBy
/**
 * Server-side search with batched Firestore scanning.
 *
 * Firestore does not support native full-text search. This helper fetches
 * documents in batches and applies an in-memory filter. It works well for
 * small-to-medium collections (< 10 000 docs). For large-scale search,
 * integrate Algolia, Elasticsearch, or Typesense.
 *
 * Optimisation notes:
 *  - Consider adding a `titleLower` field at write-time so Firestore
 *    `>=` / `<` prefix queries can replace the in-memory scan.
 *  - `maxDocs` caps the total documents scanned per request to prevent
 *    runaway reads.
 *
 * @param baseQuery   – Pre-filtered & ordered Firestore query.
 * @param params      – Pagination parameters (page, limit).
 * @param mapper      – Snapshot → domain model transformer.
 * @param filterFn    – In-memory predicate (e.g. title includes search term).
 * @param batchSize   – Docs fetched per Firestore read (default 200).
 * @param maxDocs     – Hard cap on total docs scanned (default 1000).
 */
export async function searchInBatches<T>(
  baseQuery: Query,
  params: { page: number; limit: number },
  mapper: (doc: QueryDocumentSnapshot) => T,
  filterFn: (item: T) => boolean,
  batchSize: number = 200,
  maxDocs: number = 1000
): Promise<PaginatedResponse<T>> {
  const page = Math.max(1, params.page);
  const limit = Math.min(100, params.limit);
  const neededResults = page * limit; // Total results needed up to current page
  
  const matchedItems: T[] = [];
  let lastDoc: QueryDocumentSnapshot | null = null;
  let totalScanned = 0;
  let exhausted = false;
  
  // Fetch in batches until we have enough results or hit max
  while (matchedItems.length < neededResults + 1 && totalScanned < maxDocs && !exhausted) {
    let batchQuery = baseQuery;
    
    if (lastDoc) {
      batchQuery = batchQuery.startAfter(lastDoc);
    }
    
    const snapshot = await batchQuery.limit(batchSize).get();
    
    if (snapshot.empty || snapshot.docs.length === 0) {
      exhausted = true;
      break;
    }
    
    for (const doc of snapshot.docs) {
      const item = mapper(doc);
      if (filterFn(item)) {
        matchedItems.push(item);
      }
    }
    
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    totalScanned += snapshot.docs.length;
    
    // If we got fewer docs than batch size, we've exhausted the collection
    if (snapshot.docs.length < batchSize) {
      exhausted = true;
    }
  }
  
  const total = exhausted ? matchedItems.length : matchedItems.length; // approximate
  const startIndex = (page - 1) * limit;
  const items = matchedItems.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < matchedItems.length;
  
  return {
    items,
    total,
    page,
    limit,
    hasMore,
  };
}
