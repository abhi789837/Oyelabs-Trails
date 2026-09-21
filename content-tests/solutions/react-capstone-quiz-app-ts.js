/** Fisher–Yates (Durstenfeld): unbiased, unlike sort(() => Math.random() - 0.5). */
function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i >= 1; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const NAMED_ENTITIES = { quot: '"', apos: "'", amp: "&", lt: "<", gt: ">" };

/** One left-to-right pass, so "&amp;lt;" becomes "&lt;", not "<". */
function decodeEntities(text) {
  return text.replace(/&(quot|apos|amp|lt|gt|#\d+);/g, (match, name) => {
    if (name[0] !== "#") return NAMED_ENTITIES[name];
    const codePoint = Number(name.slice(1));
    return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
  });
}

function startQuiz(rawQuestions, random) {
  const valid = [];
  for (const raw of rawQuestions) {
    if (typeof raw.correct_answer !== "string") continue;
    if (!Array.isArray(raw.incorrect_answers) || raw.incorrect_answers.length === 0) continue;
    if (!raw.incorrect_answers.every((answer) => typeof answer === "string")) continue;
    const correct = decodeEntities(raw.correct_answer);
    const answers = [correct, ...raw.incorrect_answers.map(decodeEntities)];
    if (new Set(answers).size !== answers.length) continue; // ambiguous: answers must be distinct
    valid.push({ id: raw.id, category: decodeEntities(raw.category), prompt: decodeEntities(raw.question), correct, answers });
  }
  // Shuffle the question order first, then each question's answers in the new order.
  const questions = shuffle(valid, random).map((question) => ({ ...question, answers: shuffle(question.answers, random) }));
  return { questions, index: 0, responses: {}, status: questions.length === 0 ? "finished" : "answering" };
}

function quizReducer(state, action) {
  const current = state.questions[state.index];
  switch (action.type) {
    case "answer":
      if (state.status !== "answering" || !current.answers.includes(action.answer)) return state;
      return { ...state, responses: { ...state.responses, [current.id]: action.answer }, status: "reviewing" };
    case "skip":
      if (state.status !== "answering") return state;
      return { ...state, responses: { ...state.responses, [current.id]: null }, status: "reviewing" };
    case "next":
      if (state.status !== "reviewing") return state;
      if (state.index === state.questions.length - 1) return { ...state, status: "finished" };
      return { ...state, index: state.index + 1, status: "answering" };
    default:
      return state;
  }
}

function selectResults(state) {
  const total = state.questions.length;
  let score = 0;
  let answered = 0;
  let skipped = 0;
  const byCategory = {};
  for (const question of state.questions) {
    const entry = (byCategory[question.category] ??= { correct: 0, total: 0 });
    entry.total++;
    if (!Object.hasOwn(state.responses, question.id)) continue;
    const response = state.responses[question.id];
    if (response === null) {
      skipped++;
      continue;
    }
    answered++;
    if (response === question.correct) {
      score++;
      entry.correct++;
    }
  }
  return { score, answered, skipped, total, percent: total === 0 ? 0 : Math.round((score * 100) / total), byCategory };
}

// ---- Test driver (leave as is) ----
function runQuiz(rawQuestions, seed, actions) {
  const random = createRandom(seed);
  let state = deepFreeze(startQuiz(deepFreeze(rawQuestions), random));
  for (const action of actions) state = deepFreeze(quizReducer(state, action));
  return {
    order: state.questions.map((question) => question.id),
    prompts: state.questions.map((question) => question.prompt),
    answers: state.questions.map((question) => question.answers),
    index: state.index,
    status: state.status,
    results: selectResults(state),
  };
}

// mulberry32: a tiny seeded PRNG, so every run is deterministic.
function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
