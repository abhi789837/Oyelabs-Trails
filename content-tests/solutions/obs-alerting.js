/**
 * Multiwindow, multi-burn-rate SLO alerting.
 *
 * @param {{ good: number, bad: number }[]} samples  one entry per minute, oldest first
 * @param {number} slo                               e.g. 0.999
 * @param {{ severity: string, longWindowMinutes: number, shortWindowMinutes: number, burnRate: number }[]} rules
 * @returns {{ at: number, severity: string | null }[]}
 */
function evaluateBurnRate(samples, slo, rules) {
  const errorBudget = 1 - slo;

  const ratio = (end, minutes) => {
    const start = Math.max(0, end - minutes + 1);
    let bad = 0;
    let total = 0;
    for (let i = start; i <= end; i++) {
      bad += samples[i].bad;
      total += samples[i].good + samples[i].bad;
    }
    return total === 0 ? 0 : bad / total;
  };

  const transitions = [];
  let previous = null;

  for (let t = 0; t < samples.length; t++) {
    let firing = null;
    for (const rule of rules) {
      const threshold = rule.burnRate * errorBudget;
      if (ratio(t, rule.longWindowMinutes) > threshold && ratio(t, rule.shortWindowMinutes) > threshold) {
        firing = rule.severity;
        break;
      }
    }
    if (firing !== previous) {
      transitions.push({ at: t, severity: firing });
      previous = firing;
    }
  }

  return transitions;
}

// ---- Test driver (leave as is) ----
function runBurnRateScenario(segments, slo, rules) {
  const samples = [];
  for (const segment of segments) {
    const bad = Math.round(segment.rpm * segment.errorRate);
    for (let i = 0; i < segment.minutes; i++) samples.push({ good: segment.rpm - bad, bad });
  }
  return evaluateBurnRate(samples, slo, rules);
}
