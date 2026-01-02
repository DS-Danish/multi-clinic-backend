import moment from 'moment-timezone';

export class TimezoneUtil {
  // Default timezone for Pakistan
  static readonly DEFAULT_TIMEZONE = 'Asia/Karachi';

  /**
   * Convert a date string from client timezone to UTC for database storage
   * @param dateString - ISO date string from client
   * @param timezone - Client timezone (defaults to Asia/Karachi)
   * @returns UTC Date object
   */
  static toUTC(dateString: string, timezone: string = this.DEFAULT_TIMEZONE): Date {
    // Parse the date in the specified timezone and convert to UTC
    const utcDate = moment.tz(dateString, timezone).utc().toDate();
    return utcDate;
  }

  /**
   * Convert a UTC date from database to client timezone
   * @param date - UTC Date object from database
   * @param timezone - Target timezone (defaults to Asia/Karachi)
   * @returns ISO string in client timezone
   */
  static fromUTC(date: Date, timezone: string = this.DEFAULT_TIMEZONE): string {
    // Convert UTC date to specified timezone and return ISO string
    return moment.utc(date).tz(timezone).format();
  }

  /**
   * Format a date to a specific timezone
   * @param date - Date object
   * @param timezone - Target timezone
   * @param format - Moment format string (optional)
   * @returns Formatted date string
   */
  static format(
    date: Date,
    timezone: string = this.DEFAULT_TIMEZONE,
    format?: string,
  ): string {
    const momentDate = moment.utc(date).tz(timezone);
    return format ? momentDate.format(format) : momentDate.format();
  }

  /**
   * Validate if a timezone is valid
   * @param timezone - Timezone string to validate
   * @returns boolean
   */
  static isValidTimezone(timezone: string): boolean {
    return moment.tz.zone(timezone) !== null;
  }

  /**
   * Get current time in a specific timezone
   * @param timezone - Target timezone
   * @returns ISO string in specified timezone
   */
  static now(timezone: string = this.DEFAULT_TIMEZONE): string {
    return moment().tz(timezone).format();
  }
}
