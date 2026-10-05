import { FormEvent, useMemo } from "react";
import {
  getActivityByDate,
  getProgressStats,
  getStudyGoals,
  getStudyStreakInfo,
  saveStudyGoals,
} from "../lib/storage";
import { useAppShell } from "../state/appShell";

const heatClass = (count: number) => {
  if (count <= 0) return "heat-0";
  if (count <= 2) return "heat-1";
  if (count <= 5) return "heat-2";
  if (count <= 10) return "heat-3";
  return "heat-4";
};

export function ProgressPage() {
  const { progressTick } = useAppShell();
  const streak = useMemo(() => getStudyStreakInfo(), [progressTick]);
  const stats = useMemo(() => getProgressStats(), [progressTick]);
  const goals = useMemo(() => getStudyGoals(), [progressTick]);
  const activity = useMemo(() => getActivityByDate(84), [progressTick]);

  const dailyPct = Math.min(100, Math.round((stats.reviewsToday / goals.dailyReviews) * 100));
  const weeklyPct = Math.min(100, Math.round((stats.minutesWeek / goals.weeklyMinutes) * 100));

  const onGoals = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveStudyGoals({
      dailyReviews: Number(form.get("dailyReviews")),
      weeklyMinutes: Number(form.get("weeklyMinutes")),
    });
  };

  return (
    <section id="progress" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Progress</h2>
        </div>
      </div>

      <div className="progress-hero">
        <div className="progress-streak">
          <p className="progress-label">Streak</p>
          <p className="progress-streak__value">{streak.streak}</p>
          <p className="progress-muted">
            {streak.studiedToday ? "Studied today" : "Study today to keep it"}
          </p>
        </div>
        <div className="progress-stat-grid">
          <div className="progress-stat">
            <span className="progress-label">Reviews today</span>
            <strong>{stats.reviewsToday}</strong>
          </div>
          <div className="progress-stat">
            <span className="progress-label">This week</span>
            <strong>{stats.reviewsWeek}</strong>
          </div>
          <div className="progress-stat">
            <span className="progress-label">Accuracy</span>
            <strong>{stats.accuracyWeek == null ? "—" : `${stats.accuracyWeek}%`}</strong>
          </div>
          <div className="progress-stat">
            <span className="progress-label">Sessions</span>
            <strong>{stats.sessionsWeek}</strong>
          </div>
        </div>
      </div>

      <section className="progress-panel">
        <div className="home-panel__header">
          <div>
            <p className="eyebrow">Activity</p>
            <h3>Last 12 weeks</h3>
          </div>
        </div>
        <div className="heat-calendar" role="img" aria-label="Study activity calendar">
          {activity.map(({ date, count }) => (
            <span
              key={date}
              className={`heat-cell ${heatClass(count)}`}
              title={`${date}: ${count} activity`}
              data-count={count}
            />
          ))}
        </div>
        <div className="heat-legend">
          <span>Less</span>
          <span className="heat-cell heat-0" />
          <span className="heat-cell heat-1" />
          <span className="heat-cell heat-2" />
          <span className="heat-cell heat-3" />
          <span className="heat-cell heat-4" />
          <span>More</span>
        </div>
      </section>

      <section className="progress-panel">
        <div className="home-panel__header">
          <div>
            <p className="eyebrow">Goals</p>
            <h3>Daily &amp; weekly targets</h3>
          </div>
        </div>
        <div className="goal-bars">
          <div className="goal-bar">
            <div className="goal-bar__meta">
              <span>Daily reviews</span>
              <span>
                {stats.reviewsToday} / {goals.dailyReviews}
              </span>
            </div>
            <div className="goal-bar__track">
              <div className="goal-bar__fill" style={{ width: `${dailyPct}%` }} />
            </div>
          </div>
          <div className="goal-bar">
            <div className="goal-bar__meta">
              <span>Weekly minutes (est.)</span>
              <span>
                {stats.minutesWeek} / {goals.weeklyMinutes}
              </span>
            </div>
            <div className="goal-bar__track">
              <div className="goal-bar__fill" style={{ width: `${weeklyPct}%` }} />
            </div>
          </div>
        </div>
        <form id="goalsForm" className="form-grid goals-form" onSubmit={onGoals}>
          <label>
            Daily review goal
            <input
              name="dailyReviews"
              type="number"
              min={1}
              max={200}
              defaultValue={goals.dailyReviews}
            />
          </label>
          <label>
            Weekly minutes goal
            <input
              name="weeklyMinutes"
              type="number"
              min={5}
              max={1000}
              defaultValue={goals.weeklyMinutes}
            />
          </label>
          <div className="form-actions full">
            <button type="submit" className="primary-btn">
              Save goals
            </button>
          </div>
        </form>
      </section>

      <section className="progress-panel">
        <div className="home-panel__header">
          <div>
            <p className="eyebrow">This week</p>
            <h3>Practice mix</h3>
          </div>
        </div>
        <ul className="progress-mix">
          <li>
            <span>Speaking drills</span>
            <strong>{stats.speakingWeek}</strong>
          </li>
          <li>
            <span>Writing prompts</span>
            <strong>{stats.writingWeek}</strong>
          </li>
          <li>
            <span>Known / again</span>
            <strong>
              {stats.knownWeek} / {stats.againWeek}
            </strong>
          </li>
        </ul>
      </section>
    </section>
  );
}
