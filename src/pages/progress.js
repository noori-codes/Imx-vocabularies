import { escapeHtml } from "../components/dom.js";
import {
  getActivityByDate,
  getProgressStats,
  getStudyGoals,
  getStudyStreakInfo,
  saveStudyGoals,
} from "../components/storage.js";

const heatClass = (count) => {
  if (count <= 0) return "heat-0";
  if (count <= 2) return "heat-1";
  if (count <= 5) return "heat-2";
  if (count <= 10) return "heat-3";
  return "heat-4";
};

export const renderProgressPage = (root) => {
  if (!root) return;

  const streak = getStudyStreakInfo();
  const stats = getProgressStats();
  const goals = getStudyGoals();
  const activity = getActivityByDate(84);
  const dailyPct = Math.min(100, Math.round((stats.reviewsToday / goals.dailyReviews) * 100));
  const weeklyPct = Math.min(100, Math.round((stats.minutesWeek / goals.weeklyMinutes) * 100));

  root.innerHTML = `
    <div class="page-header">
      <div>
        <p class="eyebrow">Analytics</p>
        <h2>Progress</h2>
      </div>
    </div>

    <div class="progress-hero">
      <div class="progress-streak">
        <p class="progress-label">Streak</p>
        <p class="progress-streak__value">${streak.streak}</p>
        <p class="progress-muted">${streak.studiedToday ? "Studied today" : "Study today to keep it"}</p>
      </div>
      <div class="progress-stat-grid">
        <div class="progress-stat">
          <span class="progress-label">Reviews today</span>
          <strong>${stats.reviewsToday}</strong>
        </div>
        <div class="progress-stat">
          <span class="progress-label">This week</span>
          <strong>${stats.reviewsWeek}</strong>
        </div>
        <div class="progress-stat">
          <span class="progress-label">Accuracy</span>
          <strong>${stats.accuracyWeek == null ? "—" : `${stats.accuracyWeek}%`}</strong>
        </div>
        <div class="progress-stat">
          <span class="progress-label">Sessions</span>
          <strong>${stats.sessionsWeek}</strong>
        </div>
      </div>
    </div>

    <section class="progress-panel">
      <div class="home-panel__header">
        <div>
          <p class="eyebrow">Activity</p>
          <h3>Last 12 weeks</h3>
        </div>
      </div>
      <div class="heat-calendar" role="img" aria-label="Study activity calendar">
        ${activity
          .map(
            ({ date, count }) =>
              `<span class="heat-cell ${heatClass(count)}" title="${escapeHtml(date)}: ${count} activity" data-count="${count}"></span>`,
          )
          .join("")}
      </div>
      <div class="heat-legend">
        <span>Less</span>
        <span class="heat-cell heat-0"></span>
        <span class="heat-cell heat-1"></span>
        <span class="heat-cell heat-2"></span>
        <span class="heat-cell heat-3"></span>
        <span class="heat-cell heat-4"></span>
        <span>More</span>
      </div>
    </section>

    <section class="progress-panel">
      <div class="home-panel__header">
        <div>
          <p class="eyebrow">Goals</p>
          <h3>Daily &amp; weekly targets</h3>
        </div>
      </div>
      <div class="goal-bars">
        <div class="goal-bar">
          <div class="goal-bar__meta">
            <span>Daily reviews</span>
            <span>${stats.reviewsToday} / ${goals.dailyReviews}</span>
          </div>
          <div class="goal-bar__track"><div class="goal-bar__fill" style="width:${dailyPct}%"></div></div>
        </div>
        <div class="goal-bar">
          <div class="goal-bar__meta">
            <span>Weekly minutes (est.)</span>
            <span>${stats.minutesWeek} / ${goals.weeklyMinutes}</span>
          </div>
          <div class="goal-bar__track"><div class="goal-bar__fill" style="width:${weeklyPct}%"></div></div>
        </div>
      </div>
      <form id="goalsForm" class="form-grid goals-form">
        <label>Daily review goal
          <input name="dailyReviews" type="number" min="1" max="200" value="${goals.dailyReviews}" />
        </label>
        <label>Weekly minutes goal
          <input name="weeklyMinutes" type="number" min="5" max="1000" value="${goals.weeklyMinutes}" />
        </label>
        <div class="form-actions full">
          <button type="submit" class="primary-btn">Save goals</button>
        </div>
      </form>
    </section>

    <section class="progress-panel">
      <div class="home-panel__header">
        <div>
          <p class="eyebrow">This week</p>
          <h3>Practice mix</h3>
        </div>
      </div>
      <ul class="progress-mix">
        <li><span>Speaking drills</span><strong>${stats.speakingWeek}</strong></li>
        <li><span>Writing prompts</span><strong>${stats.writingWeek}</strong></li>
        <li><span>Known / again</span><strong>${stats.knownWeek} / ${stats.againWeek}</strong></li>
      </ul>
    </section>
  `;

  root.querySelector("#goalsForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveStudyGoals({
      dailyReviews: Number(form.get("dailyReviews")),
      weeklyMinutes: Number(form.get("weeklyMinutes")),
    });
    renderProgressPage(root);
  });
};

export const renderHomeWeekStrip = (root, { onOpenProgress } = {}) => {
  if (!root) return;
  const stats = getProgressStats();
  const goals = getStudyGoals();
  const streak = getStudyStreakInfo();
  const dailyPct = Math.min(100, Math.round((stats.reviewsToday / goals.dailyReviews) * 100));

  root.hidden = false;
  root.innerHTML = `
    <div class="week-strip__copy">
      <p class="eyebrow">This week</p>
      <p class="week-strip__line">
        ${stats.reviewsWeek} reviews · ${stats.sessionsWeek} sessions · streak ${streak.streak}
        ${stats.accuracyWeek != null ? ` · ${stats.accuracyWeek}% accuracy` : ""}
      </p>
      <div class="goal-bar goal-bar--compact">
        <div class="goal-bar__meta">
          <span>Today’s goal</span>
          <span>${stats.reviewsToday}/${goals.dailyReviews}</span>
        </div>
        <div class="goal-bar__track"><div class="goal-bar__fill" style="width:${dailyPct}%"></div></div>
      </div>
    </div>
    <button type="button" class="ghost-btn" data-open-progress>View progress</button>
  `;

  root.querySelector("[data-open-progress]")?.addEventListener("click", () => {
    onOpenProgress?.();
  });
};
