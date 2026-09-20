// `events.event_date` is a Postgres `date` (YYYY-MM-DD) and
// `events.event_time` is a Postgres `time` (HH:MM:SS). These format
// them for display without timezone shifting (a plain `new Date(str)`
// on a bare date string is parsed as UTC and can roll back a day).

export function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "";

  const [year, month, day] = dateStr.split("-").map(Number);

  if (!year || !month || !day) return dateStr;

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventTime(timeStr: string | null): string {
  if (!timeStr) return "";

  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeStr;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");

  return `${displayHour}:${displayMinute} ${period}`;
}
