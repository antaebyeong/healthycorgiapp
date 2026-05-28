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

function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return { year, month, day };
}

function formatDateString(year: number, month: number, day: number) {
  return [year, month, day].map((value) => String(value).padStart(2, "0")).join("-");
}

function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function getDaysInMonth(year: number, month: number) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function getDayOfWeek(year: number, month: number, day: number) {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const adjustedYear = month < 3 ? year - 1 : year;
  return (adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400) + offsets[month - 1] + day) % 7;
}

function addDays(dateString: string, amount: number) {
  let { year, month, day } = parseDateString(dateString);
  let remaining = amount;

  while (remaining > 0) {
    const daysInMonth = getDaysInMonth(year, month);
    if (day + remaining <= daysInMonth) {
      day += remaining;
      remaining = 0;
    } else {
      remaining -= daysInMonth - day + 1;
      day = 1;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  }

  while (remaining < 0) {
    if (day + remaining >= 1) {
      day += remaining;
      remaining = 0;
    } else {
      remaining += day;
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      day = getDaysInMonth(year, month);
    }
  }

  return formatDateString(year, month, day);
}

export function getWeekRangeMondayToSunday(dateString: string) {
  const date = parseDateString(dateString);
  const day = getDayOfWeek(date.year, date.month, date.day);
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(dateString, mondayOffset);

  return {
    start: monday,
    end: addDays(monday, 6)
  };
}

export function getMonthRange(dateString: string) {
  const date = parseDateString(dateString);

  return {
    start: formatDateString(date.year, date.month, 1),
    end: formatDateString(date.year, date.month, getDaysInMonth(date.year, date.month)),
    year: date.year,
    month: date.month
  };
}
