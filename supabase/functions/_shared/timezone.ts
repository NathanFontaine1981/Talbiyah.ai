// Shared timezone utilities for consistent time display across emails

export function formatSessionDateTime(dateString: string, timeString: string) {
  // The date and time from the database are stored as the user selected them
  // We need to be careful about timezone handling
  
  // Create date assuming the input is in the booking timezone (usually UK time)
  const sessionDateTime = new Date(`${dateString}T${timeString}:00`);
  
  // Format for UK timezone (where most users are)
  const ukFormatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/London',
    hour12: true
  });
  
  const ukTime = ukFormatter.format(sessionDateTime);
  
  // Also provide UTC time for clarity
  const utcFormatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'UTC',
    hour12: true
  });
  
  const utcTime = utcFormatter.format(sessionDateTime);
  
  return {
    displayTime: ukTime,
    timezone: 'UK Time',
    utcTime: utcTime,
    isoString: sessionDateTime.toISOString()
  };
}

export function getHoursUntilSession(dateString: string, timeString: string): number {
  const sessionDateTime = new Date(`${dateString}T${timeString}:00`);
  const now = new Date();
  return (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
}