# AI course builder

Turns a finished placement assessment into an ordered learning path — unlocking catalogue courses
where one fits, reusing a previously generated course where one matches, and **researching and
writing a new course** where nothing covers the gap.

The worked example this is built against: a learner whose target role is *PHP/Laravel Developer*,
whose admin marked DevOps **High**, and who failed the deployment questions, ends up with a
**cPanel Deployment** course at the top of their path, built from links that were fetched and
checked rather than recalled.

---

## 1. Two decisions taken before any code

### 1.1 Courses gain an optional graded test — they do not fork

The brief says a generated course must use *"exactly the same data schema as the hand-built
courses"* and must carry *"a hands-on practice task"* and *"a graded test of 10 or more
questions"*. Those two requirements contradict each other today: hand-built courses were
deliberately specified as **read-only topics with no quiz**, so completion is self-reported.

Rather than fork into two course systems — which the brief also rules out — the **shared** course
topic gains two optional fields:

| Field | Manual course | Generated course |
| --- | --- | --- |
| `practice` | null (authors may add one) | always written |
| `test` | null (authors may add one) | always written, 10+ questions |

A topic with no `test` is finished the way it always was: the learner says so. A topic **with** a
test is finished by passing it, at the same 80% the curriculum uses. One schema, one renderer, one
progress table — and manual authors gain the ability to add a test if they ever want one, which is
a strict improvement rather than a compromise.

### 1.2 Nothing is written from memory

An AI asked for "three good articles about cPanel" will produce three plausible URLs, and some of
them will not exist. The pipeline is built so that **the model never supplies a URL**:

1. the model proposes *search queries* and an outline;
2. the server runs those searches against a real provider and collects the results;
3. the server **fetches every candidate link** and keeps only what actually resolves;
4. the model then writes the topic **given only the surviving URLs**, and is told it may cite
   nothing else;
5. a second model pass scores the result, and anything citing an unverified URL fails.

With no research key configured, generation **refuses to start** rather than falling back to
recall. That is the whole point of the feature.

---

## 2. Data model

New tables, all additive:

| Table | Holds |
| --- | --- |
| `learner_priorities` | one row per learner: target role, must-have skills with weights, skip list, deadline weeks, course cap, auto-publish |
| `skill_gaps` | one row per detected gap: skill, severity 0–1, evidence, source, priority score |
| `learning_paths` | one per learner per generation run, with its status |
| `path_items` | the ordered path: course, order, why it was added, and whether it was `unlock`, `reuse` or `generated` |
| `generated_courses` | links a `courses` row to the skill it was built for, its review score, status and scope |
| `course_sources` | every URL a generated course cites: type, HTTP status, when it was last checked |
| `ai_audit_log` | every AI decision: prompt version, model, sources used, scores, who approved |

Existing tables gain: `course_topics.practice`, `course_topics.test` (both JSON, nullable), and
`courses.origin` (`manual` | `generated`).

`jobs` already exists and already has a worker loop, retries and backoff — the new job types plug
into it rather than adding a second queue.

---

## 3. The run, end to end

```
assessment evaluated
   │
   ├─ 1. gap map        admin notes + priorities + per-item results  ->  skill_gaps
   ├─ 2. score          severity x role relevance x admin weight     ->  ordered, capped, skips applied
   ├─ 3. for each gap, in order:
   │        match catalogue  (>= 0.75 confidence)  -> unlock
   │        match generated  (>= 0.75, still passing) -> reuse
   │        otherwise                                  -> generate
   └─ 4. assemble path  ->  learning_paths + path_items, each with its reason
```

### Priority score

```
score = severity x roleRelevance x adminWeight

adminWeight:  High 1.0 | Medium 0.6 | Low 0.3 | AI-detected only 0.5
```

A must-have skill the admin listed always sorts above a skill only the AI found, whatever the
arithmetic says — the tie is broken on `source` before the number is consulted. The skip list is
applied after scoring, so a skipped skill is still *recorded* as a gap; it simply produces no
course. That matters: "we know you are weak here and chose not to teach it" is different from
"we never looked".

### Generating one course

```
plan  ->  search  ->  verify  ->  write  ->  review
                        │                      │
                        └─ drops dead links    └─ < 4.0, or any criterion < 3  ->  regenerate topic
                                                  twice, then  needs_review
```

A link survives verification only if it returns 200, is not a login or paywall, is not a content
farm, and carries a date. A video survives only if the YouTube API says it exists, is embeddable,
is 5–60 minutes, and comes from a channel with real traction.

---

## 4. Setup — where the keys go

Two new settings under **Admin → AI connection**, both superadmin-only and both stored encrypted
with the same AES-256-GCM box as the AI credential:

1. **Research provider** — one of Tavily, Brave Search or Serper, plus its API key.
   - Tavily: <https://tavily.com> — simplest, built for this
   - Brave: <https://brave.com/search/api/>
   - Serper: <https://serper.dev>
2. **YouTube Data API v3 key** — from the Google Cloud console, with the YouTube Data API enabled.

Until both are set, the course builder reports *"not configured"* and generation does not run. Gap
analysis and catalogue matching still work without them, so a path of unlocked courses is produced
either way.

---

## 5. Status

Built in stages; this file is updated as each lands.

- [ ] Stage 1 — data model, migrations, shared schemas
- [ ] Stage 2 — research providers and link verification
- [ ] Stage 3 — gap analysis and priority scoring
- [ ] Stage 4 — catalogue and generated-course matching
- [ ] Stage 5 — the generation pipeline
- [ ] Stage 6 — jobs, progress, cost limits
- [ ] Stage 7 — admin UI: priorities, generated courses, gap map
- [ ] Stage 8 — learner UI: the path and why each course is on it
- [ ] Stage 9 — link health, audit log
- [ ] Stage 10 — tests, including the cPanel run end to end
