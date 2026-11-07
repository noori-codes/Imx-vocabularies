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

const heatClass = (count: number) => {
  if (count <= 0) return "heat-0";
  if (count <= 2) return "heat-1";
  if (count <= 5) return "heat-2";
  if (count <= 10) return "heat-3";
  return "heat-4";
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ProgressPage() {
  const { progressTick, navigate } = useAppShell();
  const streak = useMemo(() => getStudyStreakInfo(), [progressTick]);
  const stats = useMemo(() => getProgressStats(), [progressTick]);
  const goals = useMemo(() => getStudyGoals(), [progressTick]);
  const activity = useMemo(() => getActivityByDate(84), [progressTick]);

  const dailyPct = Math.min(100, Math.round((stats.reviewsToday / goals.dailyReviews) * 100));
  const weeklyPct = Math.min(100, Math.round((stats.minutesWeek / goals.weeklyMinutes) * 100));

  /** Align 84 days into Mon-first weeks for a structured heatmap */
  const heatWeeks = useMemo(() => {
    if (!activity.length) return [] as { date: string; count: number }[][];
    const first = new Date(`${activity[0].date}T12:00:00`);
    const jsDay = first.getDay(); // 0 Sun
    const mondayOffset = (jsDay + 6) % 7;
    const padded: ({ date: string; count: number } | null)[] = [
      ...Array.from({ length: mondayOffset }, () => null),
      ...activity,
    ];
    while (padded.length % 7 !== 0) padded.push(null);
    const weeks: ({ date: string; count: number } | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }
    return weeks;
  }, [activity]);

  const mixTotal = Math.max(1, stats.speakingWeek + stats.writingWeek + stats.knownWeek + stats.againWeek);
  const mixParts = [
    { key: "speaking", label: "Speaking", value: stats.speakingWeek, color: "var(--signal)" },
    { key: "writing", label: "Writing", value: stats.writingWeek, color: "var(--cat-speaking)" },
    { key: "known", label: "Known", value: stats.knownWeek, color: "var(--accent)" },
    { key: "again", label: "Again", value: stats.againWeek, color: "var(--warn)" },
  ];

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
              <h3>Last 12 weeks</h3>
            </div>
          </div>
          <div className="heat-wrap">
            <div className="heat-weekdays" aria-hidden="true">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d[0]}</span>
              ))}
            </div>
            <div className="heat-calendar heat-calendar--weeks" role="img" aria-label="Study activity calendar">
              {heatWeeks.map((week, wi) => (
                <div key={wi} className="heat-week">
                  {week.map((cell, di) =>
                    cell ? (
                      <span
                        key={cell.date}
                        className={`heat-cell ${heatClass(cell.count)}`}
                        title={`${cell.date}: ${cell.count} activity`}
                        data-count={cell.count}
                      />
                    ) : (
                      <span key={`pad-${wi}-${di}`} className="heat-cell heat-pad" />
                    ),
                  )}
                </div>
              ))}
            </div>
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
          <form id="goalsForm" className="goals-inline" onSubmit={onGoals}>
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
