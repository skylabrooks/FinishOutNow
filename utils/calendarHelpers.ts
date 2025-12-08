/**
 * Calendar export utilities for lead follow-ups
 */

import { EnrichedPermit } from '../types';

export const exportLeadToCalendar = (permit: EnrichedPermit): void => {
  const startDate = new Date(permit.appliedDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FinishOutNow//Lead Tracking//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${permit.id}@finishoutnow.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Follow up: ${permit.aiAnalysis?.extractedEntities.tenantName || permit.applicant}`,
    `DESCRIPTION:Commercial lead opportunity\\n\\n${permit.aiAnalysis?.salesPitch || 'Lead opportunity'}\\n\\nProject: ${permit.description}\\nValue: $${permit.valuation.toLocaleString()}\\nConfidence: ${permit.aiAnalysis?.confidenceScore || 0}%`,
    `LOCATION:${permit.address}, ${permit.city}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    `CATEGORIES:${permit.aiAnalysis?.category || 'Lead'},Commercial Lead`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `lead-${permit.permitNumber}-${permit.appliedDate}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
