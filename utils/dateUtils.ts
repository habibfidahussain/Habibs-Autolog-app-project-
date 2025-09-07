

/**
 * Formats an ISO 8601 date string (YYYY-MM-DD) into a more readable format (e.g., "15 Oct 2023").
 * @param isoString The date string in YYYY-MM-DD format.
 * @returns A formatted date string.
 */
export function formatIsoDate(isoString: string): string {
  try {
    // Adding T00:00:00 ensures the date is parsed in the local timezone, not UTC
    const date = new Date(`${isoString}T00:00:00`);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    console.error('Invalid date format:', isoString);
    return isoString; // Fallback to original string
  }
}

/**
 * Formats an ISO 8601 date string into a compact format for charts (e.g., "Oct '23").
 * @param isoString The date string in YYYY-MM-DD format.
 * @returns A compact, formatted date string.
 */
export function formatDateForChart(isoString: string): string {
  try {
    const date = new Date(`${isoString}T00:00:00`);
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
}


/**
 * Gets today's date as an ISO 8601 string (YYYY-MM-DD).
 * @returns Today's date string.
 */
export function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}