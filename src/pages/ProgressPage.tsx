import { FormEvent, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import {
  getActivityByDate,
  getProgressStats,
  getStudyGoals,
  getStudyStreakInfo,
  saveStudyGoals,
} from "../lib/storage";
import { useAppShell } from "../state/appShell";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const dayTone = (count: number) => {
  if (count <= 0) return "day-0";
  if (count <= 2) return "day-1";
  if (count <= 5) return "day-2";
  if (count <= 10) return "day-3";
  return "day-4";
};

const shortMonth = (iso: string) => {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short" });
};

export function ProgressPage() {
  const { progressTick, navigate, bumpProgress, showToast } = useAppShell();
  const streak = useMemo(() => getStudyStreakInfo(), [progressTick]);
  const stats = useMemo(() => getProgressStats(), [progressTick]);
  const goals = useMemo(() => getStudyGoals(), [progressTick]);
  const activity = useMemo(() => getActivityByDate(84), [progressTick]);

  const dailyPct = Math.min(100, Math.round((stats.reviewsToday / goals.dailyReviews) * 100));
  const weeklyPct = Math.min(100, Math.round((stats.minutesWeek / goals.weeklyMinutes) * 100));

  const recentDays = useMemo(() => activity.slice(-7), [activity]);

  const weekBars = useMemo(() => {
    if (!activity.length) return [] as { key: string; label: string; total: number }[];
    const first = new Date(`${activity[0].date}T12:00:00`);
    const jsDay = first.getDay();
    const mondayOffset = (jsDay + 6) % 7;
    const padded: ({ date: string; count: number } | null)[] = [
      ...Array.from({ length: mondayOffset }, () => null),
      ...activity,
    ];
    while (padded.length % 7 !== 0) padded.push(null);

    const bars: { key: string; label: string; total: number }[] = [];
    for (let i = 0; i < padded.length; i += 7) {
      const week = padded.slice(i, i + 7);
      const days = week.filter(Boolean) as { date: string; count: number }[];
      if (!days.length) continue;
      const total = days.reduce((sum, day) => sum + day.count, 0);
      const mid = days[Math.floor(days.length / 2)] || days[0];
      bars.push({
        key: days[0].date,
        label: shortMonth(mid.date),
        total,
      });
    }
    return bars.slice(-12);
  }, [activity]);

  const maxWeekTotal = Math.max(1, ...weekBars.map((bar) => bar.total));

  const mixTotal = Math.max(
    1,
    stats.speakingWeek + stats.writingWeek + stats.topicsWeek + stats.knownWeek + stats.againWeek,
  );
  const mixParts = [
    { key: "topics", label: "Topics", value: stats.topicsWeek, color: "var(--accent)" },
    { key: "speaking", label: "Speaking", value: stats.speakingWeek, color: "var(--signal)" },
    { key: "writing", label: "Writing", value: stats.writingWeek, color: "var(--cat-speaking)" },
    { key: "known", label: "Known", value: stats.knownWeek, color: "var(--cat-learning)" },
    { key: "again", label: "Again", value: stats.againWeek, color: "var(--warn)" },
  ];

  const onGoals = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveStudyGoals({
      dailyReviews: Number(form.get("dailyReviews")),
      weeklyMinutes: Number(form.get("weeklyMinutes")),
    });
    bumpProgress();
    showToast("Goals saved");
  };

  return (
    <section id="progress" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Analytics</p>
          <h2>Progress</h2>
        </div>
      </div>

      <div className="progress-bento">
        <article className="progress-bento__streak">
          <p className="progress-label">Streak</p>
          <p className="progress-streak__value">{streak.streak}</p>
          <p className="progress-muted">
            {streak.studiedToday ? "Studied today — keep the chain." : "Study today to keep it."}
          </p>
        </article>

        <div className="progress-bento__stats">
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

        <section className="progress-bento__activity">
          <div className="progress-panel__head">
            <div>
              <p className="eyebrow">Activity</p>
              <h3>Study rhythm</h3>
            </div>
          </div>

          <div className="activity-days" role="list" aria-label="Last 7 days">
            {recentDays.map((day, index) => {
              const date = new Date(`${day.date}T12:00:00`);
              const weekday = WEEKDAYS[(date.getDay() + 6) % 7];
              const isToday = index === recentDays.length - 1;
              return (
                <div
                  key={day.date}
                  className={`activity-day ${dayTone(day.count)}${isToday ? " is-today" : ""}`}
                  role="listitem"
                  title={`${day.date}: ${day.count} activity`}
                >
                  <span className="activity-day__label">{weekday}</span>
                  <span className="activity-day__value">{day.count}</span>
                </div>
              );
            })}
          </div>

          <div className="activity-weeks">
            <div className="activity-weeks__head">
              <span>Last 12 weeks</span>
              <span>{weekBars.reduce((sum, bar) => sum + bar.total, 0)} total</span>
            </div>
            <div className="activity-bars" role="img" aria-label="Weekly study activity">
              {weekBars.map((bar) => (
                <div key={bar.key} className="activity-bar" title={`${bar.key}: ${bar.total}`}>
                  <div className="activity-bar__track">
                    <div
                      className={`activity-bar__fill${bar.total > 0 ? "" : " is-empty"}`}
                      style={{ height: `${Math.max(bar.total > 0 ? 12 : 0, (bar.total / maxWeekTotal) * 100)}%` }}
                    />
                  </div>
                  <span className="activity-bar__label">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="progress-bento__goals">
          <div className="progress-panel__head">
            <div>
              <p className="eyebrow">Goals</p>
              <h3>Daily &amp; weekly</h3>
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
                <span>Weekly minutes</span>
                <span>
                  {stats.minutesWeek} / {goals.weeklyMinutes}
                </span>
              </div>
              <div className="goal-bar__track">
                <div className="goal-bar__fill" style={{ width: `${weeklyPct}%` }} />
              </div>
            </div>
          </div>
          <form
            id="goalsForm"
            className="goals-inline"
            key={`goals-${progressTick}-${goals.dailyReviews}-${goals.weeklyMinutes}`}
            onSubmit={onGoals}
          >
            <label>
              Daily
              <input
                name="dailyReviews"
                type="number"
                min={1}
                max={200}
                defaultValue={goals.dailyReviews}
              />
            </label>
            <label>
              Weekly min
              <input
                name="weeklyMinutes"
                type="number"
                min={5}
                max={1000}
                defaultValue={goals.weeklyMinutes}
              />
            </label>
            <button type="submit" className="primary-btn">
              Save
            </button>
          </form>
        </section>

        <section className="progress-bento__mix">
          <div className="progress-panel__head">
            <div>
              <p className="eyebrow">This week</p>
              <h3>Practice mix</h3>
            </div>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate("quiz", { replace: false })}
            >
              Open exam
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div
            className={`mix-bar${mixParts.every((p) => p.value === 0) ? " mix-bar--empty" : ""}`}
            aria-hidden="true"
          >
            {mixParts.every((p) => p.value === 0) ? (
              <span className="mix-bar__seg" style={{ width: "100%", background: "transparent" }} />
            ) : (
              mixParts.map((part) =>
                part.value > 0 ? (
                  <span
                    key={part.key}
                    className="mix-bar__seg"
                    style={{
                      width: `${(part.value / mixTotal) * 100}%`,
                      background: part.color,
                    }}
                    title={`${part.label}: ${part.value}`}
                  />
                ) : null,
              )
            )}
          </div>
          <ul className="progress-mix progress-mix--legend">
            {mixParts.map((part) => (
              <li key={part.key}>
                <span className="mix-dot" style={{ background: part.color }} />
                <span>{part.label}</span>
                <strong>{part.value}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
