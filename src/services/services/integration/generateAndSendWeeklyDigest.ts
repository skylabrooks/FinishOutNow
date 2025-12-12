import { EnrichedPermit, UserPreferences, GCSubRelationship } from '../types';
import { generateProspectList, generateWeeklyDigest, formatProspectListEmail } from '../notifications/prospectList';
import { Logger } from '../logger';

// Dummy implementations for DB and email (to be replaced with real services)
async function getUserPreferences(userId: string): Promise<UserPreferences> {
  throw new Error('getUserPreferences not implemented');
}
async function getLeadsFromLastNDays(days: number): Promise<EnrichedPermit[]> {
  throw new Error('getLeadsFromLastNDays not implemented');
}
async function getRelationships(): Promise<GCSubRelationship[]> {
  throw new Error('getRelationships not implemented');
}
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  Logger.info(`📧 Email to ${to}: ${subject}`);
}

/**
 * Create and send weekly prospect list.
 */
export async function generateAndSendWeeklyDigest(
  userId: string,
  userName: string,
  userEmail: string
) {
  Logger.info(`Generating weekly digest for ${userName}...`);

  // Get user preferences
  const preferences = await getUserPreferences(userId);
  if (!preferences?.enabled) {
    Logger.warn('  ⚠ Alerts disabled for user');
    return null;
  }

  // Get leads from last 7 days
  const recentLeads = await getLeadsFromLastNDays(7);
  Logger.info(`  ✓ ${recentLeads.length} recent leads`);

  // Get relationships
  const relationships = await getRelationships();

  // Generate prospect list
  const prospectList = generateProspectList(recentLeads, preferences, relationships, 60);
  Logger.info(`  ✓ ${prospectList.length} qualified prospects`);

  if (prospectList.length === 0) {
    Logger.warn('  ⚠ No prospects this week');
    return null;
  }

  // Generate digest
  const digest = generateWeeklyDigest(prospectList, 10);
  const html = formatProspectListEmail(digest, userName);

  // Send email
  await sendEmail(userEmail, 'Your Weekly Prospect Report', html);
  Logger.info(`  ✓ Email sent`);

  return digest;
}