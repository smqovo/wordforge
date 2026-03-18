/**
 * Ebbinghaus forgetting curve review schedule.
 * After a day is marked as "learned", reviews are scheduled at:
 * 1, 2, 4, 7, 15, 30 days after the learned date.
 */

export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]; // days

export interface ReviewItem {
  dayId: string;
  dayNumber: number;
  theme: string;
  round: number; // 1-6
  scheduledDate: Date;
  isOverdue: boolean;
  overdueDays: number;
}

/**
 * Calculate all review dates based on the learned date.
 */
export function getReviewSchedule(learnedAt: Date): Date[] {
  return REVIEW_INTERVALS.map((days) => {
    const date = new Date(learnedAt);
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
  });
}

/**
 * Given a list of days with their learned dates and completed review rounds,
 * return the list of reviews due today (including overdue).
 */
export function getTodayReviews(
  days: Array<{
    id: string;
    dayNumber: number;
    theme: string;
    learnedAt: Date | null;
    completedRounds: number;
  }>
): ReviewItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return days
    .filter((day) => day.learnedAt !== null)
    .map((day) => {
      const schedule = getReviewSchedule(day.learnedAt!);
      const completedRounds = day.completedRounds;

      if (completedRounds >= 6) return null; // All rounds completed

      const nextReviewDate = schedule[completedRounds];

      if (nextReviewDate <= today) {
        const overdueDays = Math.floor(
          (today.getTime() - nextReviewDate.getTime()) / 86400000
        );
        return {
          dayId: day.id,
          dayNumber: day.dayNumber,
          theme: day.theme,
          round: completedRounds + 1,
          scheduledDate: nextReviewDate,
          isOverdue: overdueDays > 0,
          overdueDays,
        };
      }
      return null;
    })
    .filter((item): item is ReviewItem => item !== null);
}
