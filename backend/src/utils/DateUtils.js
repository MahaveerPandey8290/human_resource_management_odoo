/**
 * Date utility functions for HRMS calculation.
 */
export class DateUtils {
  /**
   * Formats a Date or string to YYYY-MM-DD.
   * @param {Date|string} date
   * @returns {string}
   */
  static toDateString(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Checks if a date falls on a weekend based on working days per week.
   * Standard 5 days per week: Sunday(0) and Saturday(6) are weekends.
   * Standard 6 days per week: Sunday(0) is weekend.
   * @param {Date|string} date
   * @param {number} [workingDaysPerWeek=5]
   * @returns {boolean}
   */
  static isWeekend(date, workingDaysPerWeek = 5) {
    const d = new Date(date);
    const day = d.getDay();
    if (workingDaysPerWeek >= 6) {
      return day === 0; // Only Sunday is weekend
    }
    return day === 0 || day === 6; // Sunday & Saturday are weekends
  }

  /**
   * Calculates total working days in a date range excluding weekends and holidays.
   * @param {string|Date} startDate
   * @param {string|Date} endDate
   * @param {string[]} [holidayDates=[]] Array of 'YYYY-MM-DD' strings
   * @param {number} [workingDaysPerWeek=5]
   * @returns {number}
   */
  static calculateWorkingDaysInRange(startDate, endDate, holidayDates = [], workingDaysPerWeek = 5) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {return 0;}

    let workingDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dateStr = DateUtils.toDateString(current);
      const isWknd = DateUtils.isWeekend(current, workingDaysPerWeek);
      const isHoliday = holidayDates.includes(dateStr);

      if (!isWknd && !isHoliday) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Returns all dates in a month as 'YYYY-MM-DD' strings.
   * @param {string} yearMonth 'YYYY-MM'
   * @returns {string[]}
   */
  static getMonthDates(yearMonth) {
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;

    const dates = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      dates.push(DateUtils.toDateString(date));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  }
}
