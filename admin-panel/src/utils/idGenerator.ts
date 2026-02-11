/**
 * Generate unique ID with collision avoidance
 * Uses timestamp + random string + counter for uniqueness
 */

let counter = 0;

export function generateUniqueId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const count = (counter++).toString(36);
  return `${prefix}_${timestamp}_${random}_${count}`;
}

/**
 * Generate multiple unique IDs
 */
export function generateUniqueIds(count: number, prefix: string = 'id'): string[] {
  return Array.from({ length: count }, () => generateUniqueId(prefix));
}
