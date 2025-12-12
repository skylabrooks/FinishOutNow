// Deduplication manager: deduplicates permits and provides stats
import { Permit } from '../types';
import { deduplicatePermits, getDeduplicationStats } from './deduplication';

export function deduplicateAllPermits(permits: Permit[]): Permit[] {
  return deduplicatePermits(permits);
}

export function getDedupStats(permits: Permit[]): ReturnType<typeof getDeduplicationStats> {
  return getDeduplicationStats(permits);
}
