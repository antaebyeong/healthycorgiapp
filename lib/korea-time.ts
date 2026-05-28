export function getKoreaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second
  };
}

export function getKoreaDateString(date = new Date()) {
  const parts = getKoreaDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getKoreaTimestampString(date = new Date()) {
  const parts = getKoreaDateParts(date);
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

export function parseDateStringAsUtc(dateString: string) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

export function formatUtcDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getWeekRangeMondayToSunday(dateString: string) {
  const date = parseDateStringAsUtc(dateString);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    start: formatUtcDateString(monday),
    end: formatUtcDateString(sunday)
  };
}

export function getMonthRange(dateString: string) {
  const date = parseDateStringAsUtc(dateString);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

  return {
    start: formatUtcDateString(start),
    end: formatUtcDateString(end),
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1
  };
}
