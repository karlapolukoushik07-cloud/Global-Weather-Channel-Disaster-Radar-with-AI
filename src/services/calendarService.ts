export const getCalendarEvents = async (accessToken: string, maxDaysOut: number = 16) => {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + maxDaysOut * 86400000).toISOString();
  
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&orderBy=startTime&singleEvents=true`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }

  return response.json();
};
