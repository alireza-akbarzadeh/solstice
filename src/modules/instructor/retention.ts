/**
 * Pure calculation utilities for member retention analytics and practice stickiness.
 * Kept free of database and Node-specific imports so unit test suites can run in isolation.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;

export type CohortCurvePoint = {
  week: number;
  label: string;
  rate: number;
  activeCount: number;
  totalMembers: number;
};

export type HabitRhythmBreakdown = {
  frequent: number; // >= 3 sessions/wk
  regular: number; // 1 to <3 sessions/wk
  occasional: number; // >0 to <1 sessions/wk
  dormant: number; // 0 sessions in period
  total: number;
};

export type RetentionSummary = {
  thirtyDayRate: number | null;
  eligibleMembers: number;
  retainedMembers: number;
  repeatRate: number;
  avgSessionsPerMember: number;
  cohortCurve: CohortCurvePoint[];
  cohortCount: number;
  habitRhythm: HabitRhythmBreakdown;
};

/**
 * Calculates the repeat factor (average completions per practicing student).
 * e.g., 12 sessions across 5 members = 2.4x repeat factor.
 */
export function calculateRepeatFactor(sessions: number, members: number): number {
  if (members <= 0 || sessions <= 0) return 1;
  return Math.round((sessions / members) * 10) / 10;
}

/**
 * Calculates the conversion rate of members who saved a practice to those who completed it.
 * Returns null if the practice has no saves yet.
 */
export function calculateSaveConversion(practicingMembers: number, saves: number): number | null {
  if (saves <= 0) return null;
  return Math.min(100, Math.round((practicingMembers / saves) * 100));
}

/**
 * Computes a 4-week cohort retention curve for members joined at least 28 days before `now`.
 * Tracks whether members remained active in Week 1, Week 2, Week 3, and Week 4 (30 days).
 */
export function calculateCohortCurve(
  cohortMembers: { id: string; createdAt: Date }[],
  completions: { userId: string; completedAt: Date }[],
  now: Date = new Date(),
): { points: CohortCurvePoint[]; totalCohortMembers: number } {
  const eligible = cohortMembers.filter(
    (m) => now.getTime() - new Date(m.createdAt).getTime() >= 28 * DAY_MS,
  );

  const totalCohortMembers = eligible.length;
  if (totalCohortMembers === 0) {
    const emptyPoints: CohortCurvePoint[] = [
      { week: 1, label: "Week 1", rate: 0, activeCount: 0, totalMembers: 0 },
      { week: 2, label: "Week 2", rate: 0, activeCount: 0, totalMembers: 0 },
      { week: 3, label: "Week 3", rate: 0, activeCount: 0, totalMembers: 0 },
      { week: 4, label: "Week 4", rate: 0, activeCount: 0, totalMembers: 0 },
    ];
    return { points: emptyPoints, totalCohortMembers: 0 };
  }

  // Pre-index completions by userId for O(N) lookup
  const completionsByUser = new Map<string, number[]>();
  for (const c of completions) {
    const time = new Date(c.completedAt).getTime();
    const list = completionsByUser.get(c.userId);
    if (list) {
      list.push(time);
    } else {
      completionsByUser.set(c.userId, [time]);
    }
  }

  const activeInWeek = [0, 0, 0, 0];

  for (const member of eligible) {
    const joinedTime = new Date(member.createdAt).getTime();
    const userTimes = completionsByUser.get(member.id) ?? [];

    for (let w = 0; w < 4; w++) {
      const start = joinedTime + w * 7 * DAY_MS;
      const end = joinedTime + (w + 1) * 7 * DAY_MS;
      const hasCompleted = userTimes.some((t) => t >= start && t < end);
      if (hasCompleted) {
        activeInWeek[w] = (activeInWeek[w] ?? 0) + 1;
      }
    }
  }

  const points: CohortCurvePoint[] = activeInWeek.map((activeCount, idx) => ({
    week: idx + 1,
    label: `Week ${idx + 1}`,
    rate: Math.round((activeCount / totalCohortMembers) * 100),
    activeCount,
    totalMembers: totalCohortMembers,
  }));

  return { points, totalCohortMembers };
}

/**
 * Computes habit rhythm distribution among active members across a given observation period (in weeks).
 */
export function calculateHabitRhythm(
  totalActiveMembers: number,
  memberCompletions: { userId: string; count: number }[],
  weeks: number,
): HabitRhythmBreakdown {
  const weeksNorm = Math.max(1, weeks);
  let frequent = 0;
  let regular = 0;
  let occasional = 0;

  const practicedUserIds = new Set<string>();
  for (const row of memberCompletions) {
    if (row.count <= 0) continue;
    practicedUserIds.add(row.userId);
    const perWeek = row.count / weeksNorm;
    if (perWeek >= 3) {
      frequent++;
    } else if (perWeek >= 1) {
      regular++;
    } else {
      occasional++;
    }
  }

  const total = Math.max(totalActiveMembers, practicedUserIds.size);
  const activeTally = frequent + regular + occasional;
  const dormant = Math.max(0, total - activeTally);

  return {
    frequent,
    regular,
    occasional,
    dormant,
    total,
  };
}
