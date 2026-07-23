import { SohbetSession } from '../types';

/**
 * Format date string (YYYY-MM-DD) or current date to ICAL format (YYYYMMDDTHHMMSSZ)
 */
function formatDateToIcal(dateStr: string, hour = 19, minute = 0): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) {
      const now = new Date();
      now.setHours(hour, minute, 0, 0);
      return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
    d.setHours(hour, minute, 0, 0);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

/**
 * Generates a direct Google Calendar web link for adding the event with prefilled details and reminders
 */
export function getGoogleCalendarUrl(session: SohbetSession): string {
  const startDate = formatDateToIcal(session.date, 19, 0);
  const endDate = formatDateToIcal(session.date, 20, 30);

  const title = encodeURIComponent(`Sohbet: ${session.title}`);
  const details = encodeURIComponent(
    `Mekan: ${session.venue}\nKategori: ${session.category}\n\nNotlar:\n${session.teacherNotes || ''}`
  );
  const location = encodeURIComponent(session.venue || 'Cami / Dernek');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}&add=30`;
}

/**
 * Downloads an .ics (iCalendar) file that natively opens in Apple Calendar (iOS/macOS),
 * Google Calendar, Outlook, and Android Calendar apps with a 30-minute reminder alarm.
 */
export function downloadIcsFile(session: SohbetSession): void {
  const dtStart = formatDateToIcal(session.date, 19, 0);
  const dtEnd = formatDateToIcal(session.date, 20, 30);
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const cleanTitle = (session.title || 'Sohbet & Tefsir Dersi').replace(/\n/g, ' ');
  const cleanVenue = (session.venue || 'Sohbet Meclisi').replace(/\n/g, ' ');
  const cleanNotes = (session.teacherNotes || 'Kur\'an Tefsiri ve Sohbet Dersi').replace(/\n/g, '\\n');

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KuranTefsirApp//SohbetDersi//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:sohbet-${session.id}@kurantefsir.app`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Sohbet: ${cleanTitle}`,
    `DESCRIPTION:${cleanNotes}`,
    `LOCATION:${cleanVenue}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Sohbet & Tefsir Dersi Hatırlatması (30 dk kaldı)',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `sohbet_${session.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
