// Utility functions for generating calendar links

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  url?: string;
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description || '',
    location: event.location || '',
    dates: `${formatDateForGoogle(event.startTime)}/${formatDateForGoogle(event.endTime)}`,
  });

  if (event.url) {
    params.append('sprop', `website:${event.url}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description || '',
    location: event.location || '',
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate iCal file content
 */
export function generateICalContent(event: CalendarEvent): string {
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zervos Bookings//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@zervos.com`,
    `DTSTAMP:${formatDateForICal(new Date())}`,
    `DTSTART:${formatDateForICal(event.startTime)}`,
    `DTEND:${formatDateForICal(event.endTime)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    event.url ? `URL:${event.url}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return ical.filter(Boolean).join('\r\n');
}

/**
 * Download iCal file
 */
export function downloadICalFile(event: CalendarEvent, filename = 'event.ics'): void {
  const content = generateICalContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format date for Google Calendar (YYYYMMDDTHHmmssZ)
 */
function formatDateForGoogle(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format date for iCal (YYYYMMDDTHHmmssZ)
 */
function formatDateForICal(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Helper to parse date and time strings into Date object
 */
export function createEventDate(dateStr: string, timeStr: string, durationMinutes = 30): { start: Date; end: Date } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  const startDate = new Date(year, month - 1, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  
  return { start: startDate, end: endDate };
}
