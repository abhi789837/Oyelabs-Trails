# Oyelearn v4.3 — Research note

Verification date for every link below: **2026-10-03**. Each linked URL was fetched (curl with a browser
User-Agent, or WebFetch) and kept only if it returned HTTP 200 and was the real page, not a redirect to a
home page or a soft 404. Some papers sit behind publisher bot-walls (Taylor & Francis, SAGE, ACM, Elsevier
all returned 403). Those are cited **as plain DOIs, not links**. Their titles, authors and years were
checked against the Crossref API on the same date.

Scope: Oyelearn is an internal training platform (engineering, PM, BD). It has an admin Setup screen,
AI-personalised assessments, a prerequisite-aware learning path, a weekly plan drawn as a trail,
YouTube-embedded topic videos and topic quizzes.

---

## 1. Outcome-based goals

**Can-do statements are the reference design.** The CEFR global scale describes each of its six levels
(A1–C2) only through observable "Can …" statements. For example, B2 reads "Can understand the main ideas
of complex text on both concrete and abstract topics, including technical discussions in his/her field
of specialisation." Each statement has a subject (implied learner), an action verb, an object and a
condition or quality. A statement in that shape can be assessed directly, which an aspiration like
"get better at Node" cannot.
- CEFR global scale (Table 1, CEFR 3.3): https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale
- CEFR home: https://www.coe.int/en/web/common-european-framework-reference-languages

**Bloom's revised taxonomy** (Anderson & Krathwohl) has two dimensions. The cognitive-process dimension
runs Remember, Understand, Apply, Analyze, Evaluate, Create. The knowledge dimension runs factual,
conceptual, procedural, metacognitive. Outcome verbs come from the process dimension. This lets a goal
like "Can *debug* a failing Express middleware chain" (Analyze/Apply on procedural knowledge) be told
apart from "Can *name* HTTP status classes" (Remember/factual). The two goals need different item types.
- Krathwohl, D. R. (2002). *A Revision of Bloom's Taxonomy: An Overview.* Theory Into Practice 41(4).
  DOI 10.1207/s15430421tip4104_2 (publisher page 403 to automated fetch; Crossref-verified).

**Professional competency frameworks** pair a skill with a level of responsibility. SFIA 9 defines
"seven levels of responsibility", with generic attributes (behavioural factors) plus professional skills
defined at one or more levels. APM's Competence Framework does the same for project professionals.
O*NET does it for occupations, including sales roles that map to BD.
- SFIA 9: https://sfia-online.org/en/sfia-9
- APM Competence Framework: https://www.apm.org.uk/resources/find-a-resource/competence-framework/
- O*NET Resource Center: https://www.onetcenter.org/
- O*NET example for BD-like roles (41-4012.00, Sales Representatives, Wholesale and Manufacturing): https://www.onetonline.org/link/summary/41-4012.00

**Free text to structured skills.** ESCO publishes its multilingual skills/occupations classification
through a web-service API and a downloadable local API (v1.2.1 at time of checking, EUPL 1.2). Lightcast
publishes an open skills taxonomy. Either can be the target vocabulary for mapping. The practical
pipeline is (a) an LLM extracts candidate skills into a fixed JSON schema using structured outputs, so
the result always parses, then (b) each candidate is mapped onto the internal topic catalogue by ID.
Mapping to IDs, not free strings, is what makes goals comparable across people.
- ESCO API: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
- ESCO skills pillar: https://esco.ec.europa.eu/en/classification/skill_main
- Lightcast Skills Taxonomy: https://lightcast.io/taxonomies/skills-taxonomy
- Claude structured outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs

### Design implications for Oyelearn
- Store every goal as `{verb, object, context, level}`. Render it as a single "Can …" sentence. Reject
  or rewrite goals with no observable verb ("understand", "know") when they are entered at Setup.
- Use a small controlled verb list keyed to Bloom levels. The verb's level picks the assessment item type:
  recall goes to a single-select MCQ, apply/analyze to a scenario MCQ or hands-on task.
- Run AI extraction from a free-text goal or job description into a strict JSON schema with
  `topicId` drawn from Oyelearn's own catalogue (enum). Unmatched phrases go to an "unmapped" list for the
  admin, never into silently invented topics.
- Give each department a level ladder (engineering ≈ SFIA-style responsibility levels, PM ≈ APM
  competences, BD ≈ O*NET task statements). Don't use one global "beginner/expert" scale.
- External taxonomies (ESCO/Lightcast) are optional enrichment, not a runtime dependency. The internal
  topic ID stays the source of truth.

---

## 2. Prerequisite graphs & sequencing

**Knowledge Space Theory (KST).** Doignon & Falmagne model a domain as a set of items. A learner's
*knowledge state* is the subset of items they have mastered, and the feasible states form a *knowledge
structure* constrained by prerequisites. ALEKS operationalises this. It describes Algebra 1 as about 350
concepts producing "millions of empirically feasible knowledge states". Its adaptive assessment places
a student in about 25–30 questions. In KST the items a learner is ready to learn next (the "outer fringe")
are those whose prerequisites are all inside the current state.
- Doignon, J.-P. & Falmagne, J.-C. (1985). *Spaces for the assessment of knowledge.* International
  Journal of Man-Machine Studies 23(2). DOI 10.1016/S0020-7373(85)80031-6 (publisher 403; Crossref-verified).
- *Knowledge Spaces* (book, Springer): https://link.springer.com/book/10.1007/978-3-642-58625-5
- Knowledge space overview: https://en.wikipedia.org/wiki/Knowledge_space
- ALEKS, KST: https://www.aleks.com/about_aleks/knowledge_space_theory
- ALEKS, research behind: https://www.aleks.com/about_aleks/research_behind

**Mastery learning.** Bloom's "Learning for Mastery" (1968) sets a fixed mastery criterion and lets time
vary, with corrective loops. "The 2 Sigma Problem" (1984) reports that one-to-one tutoring combined with
mastery learning outperforms conventional instruction by about two standard deviations. Khan Academy's
public mastery model is a concrete, transparent ladder: Attempted (<70%), Familiar (70–99%), Proficient
(100% on an exercise), Mastered (Proficient plus correct again on a mixed-skill assessment). Levels can
also go *down* when a later mixed assessment misses the skill.
- Bloom, B. S. (1984). *The 2 Sigma Problem.* Educational Researcher 13(6). DOI 10.3102/0013189X013006004
  (publisher 403; Crossref-verified).
- Mastery learning overview: https://en.wikipedia.org/wiki/Mastery_learning
- Khan Academy mastery levels: https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work

**Learning the graph and tracing knowledge.** Prerequisite edges can be hand-authored or mined.
Gordon et al. (ACL 2016) model concept dependencies in a scientific corpus. Pan et al. (ACL 2017) learn
prerequisite relations among MOOC concepts. Knowledge tracing estimates per-skill mastery from answer
sequences: Bayesian Knowledge Tracing (Corbett & Anderson 1994) and the neural Deep Knowledge Tracing
(Piech et al. 2015).
- https://aclanthology.org/P16-1082/
- https://aclanthology.org/P17-1133/
- Corbett & Anderson (1994), Knowledge tracing: https://link.springer.com/article/10.1007/BF01099821
- Deep Knowledge Tracing: https://arxiv.org/abs/1506.05908

**Sequencing algorithm.** Kahn's algorithm (1962) gives a topological order by repeatedly emitting nodes
whose in-degree is zero. Replacing the plain queue with a **priority queue** gives a deterministic
"best next topic among those currently unblocked". This is exactly the KST outer fringe, ordered by a
score.
- Kahn, A. B. (1962). *Topological sorting of large networks.* CACM 5(11). DOI 10.1145/368996.369025
  (publisher 403; Crossref-verified).
- Topological sorting overview: https://en.wikipedia.org/wiki/Topological_sorting

**Typical progressions (used to seed and sanity-check edges).**
- Developer: roadmap.sh orders frontend as internet/HTTP basics → HTML/CSS → JS → version control → package
  managers → framework → testing/perf. Backend runs internet/HTTP → a language/runtime → VCS → relational
  DB → APIs (REST) → auth → caching → testing → CI/CD and deployment. The Git/GitHub roadmap runs basics
  (init/commit/staging) → branching/merging → remotes → PRs/collaboration → advanced (rebase, hooks, Actions).
  - https://roadmap.sh/frontend · https://roadmap.sh/backend · https://roadmap.sh/git-github
- PM: PMI's ladder runs CAPM (entry, foundational knowledge) → PMP (experienced practitioners). Agile
  fundamentals come from the Scrum Guide (roles/events/artifacts), and APM supplies competences. roadmap.sh
  has a product-manager roadmap for the product side.
  - https://www.pmi.org/certifications/certified-associate-capm · https://www.pmi.org/certifications/project-management-pmp
  - https://scrumguides.org/scrum-guide.html · https://roadmap.sh/product-manager
- BD/sales: no single canonical open roadmap was found. O*NET task/skill lists (above) are the defensible
  primary source for seeding prospecting → qualification → proposal → negotiation → account management.

### Design implications for Oyelearn
- Model the path as a DAG of topic IDs with explicit `requires[]` edges. Validate acyclicity on save, and
  in Setup show the offending cycle by name instead of a generic error.
- Next-topic selection = Kahn's algorithm with a priority queue. Priority = (goal relevance) ×
  (diagnosed gap) with stable tie-breakers (department order, then topic ID) so the plan is reproducible.
- Topics the diagnostic shows as mastered are removed from the frontier, but their *dependents* are
  unblocked. Never skip a prerequisite the learner hasn't shown. Pull an un-diagnosed prerequisite of a goal topic
  into the plan automatically (goal closure over `requires`).
- Use a small, transparent mastery ladder (Khan-style) with explicit thresholds. Allow demotion from a
  later mixed review, so mastery isn't a one-way latch.
- Mined/AI-suggested prerequisite edges are proposals for the admin, never auto-applied.
- Seed default edges per department from roadmap.sh (eng), PMI/Scrum/APM (PM) and O*NET tasks (BD).

---

## 3. Continuous responsive SVG trail

**One path through computed waypoints.** The trail should be a single `<path>` whose `d` passes through
every waypoint. A uniform Catmull-Rom spline interpolates the points. Each segment Pi→Pi+1 converts to a
cubic Bézier `C` command with control points `Pi + (Pi+1 − Pi−1)/6` and `Pi+1 − (Pi+2 − Pi)/6`
(Hermite tangents scaled by 1/3; duplicate the endpoints for the first and last segments). Yuksel,
Schaefer & Keyser show that the *centripetal* parameterisation (α = 0.5) avoids cusps and
self-intersections that uniform Catmull-Rom can produce when waypoints are unevenly spaced. That matters
for a zig-zag trail whose row lengths vary.
- MDN `d` attribute (M/L/C/S/Q commands): https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d
- MDN Paths tutorial: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths
- Cubic Hermite spline (Catmull-Rom tangents): https://en.wikipedia.org/wiki/Cubic_Hermite_spline
- Centripetal Catmull-Rom: https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
- Yuksel et al., *Parameterization of Catmull-Rom Curves* (project page): https://www.cemyuksel.com/research/catmullrom_param/
  (paper DOI 10.1145/1629255.1629262, Crossref-verified).

**Responsiveness.** `ResizeObserver` reports content-box size changes of an element (not just the
window). It is the right trigger for recomputing waypoint coordinates when the trail container changes
width, for example when a sidebar collapses.
- https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver

**Partial progress.** Set `stroke-dasharray` to the path's total length (`getTotalLength()`) and offset
by `(1 − progress) × length` with `stroke-dashoffset`. A second overlaid copy of the same `d` then draws
exactly the completed fraction. Progress should be the arc length up to the last completed waypoint, not
a linear percentage, because segments differ in length.
- https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dasharray
- https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dashoffset
- https://developer.mozilla.org/en-US/docs/Web/API/SVGGeometryElement/getTotalLength

**Motion and accessibility.** `prefers-reduced-motion: reduce` should disable the draw-on animation
and show the final state. WAI's images tutorial says decorative images should be ignored by assistive
technology. Complex images (charts, maps) need a short label plus a long description, using adjacent
text, `figure`/`figcaption` or `aria-describedby`. A trail is a map of information, so the accessible
form is an ordered list of the same weeks/topics with their status. The SVG line itself gets
`aria-hidden="true"`.
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden
- https://www.w3.org/WAI/tutorials/images/decorative/
- https://www.w3.org/WAI/tutorials/images/complex/

### Design implications for Oyelearn
- Compute waypoints in a pure function `(items, width) → points`. Build `d` with a centripetal
  Catmull-Rom→Bézier converter and render one `<path>` (plus a progress overlay with the same `d`). Unit-test
  the function, not the DOM.
- Recompute on `ResizeObserver` callbacks (throttled with rAF), not on `window.resize`.
- Progress overlay length = `getPointAtLength`-consistent arc length to the last completed waypoint.
  Under reduced motion, set the final dashoffset with no transition.
- Waypoint markers are real `<a>`/`<button>` elements positioned over the SVG. The line is
  `aria-hidden="true"`, and a visually equivalent `<ol>` (week → topics → status) is the accessible
  source of truth. Keyboard focus follows list order, not visual zig-zag order.

---

## 4. Video playlist

**Player API facts (IFrame Player API reference).** `onStateChange` emits −1 unstarted, **0 ended**,
1 playing, 2 paused, 3 buffering, 5 cued. `getCurrentTime()` returns elapsed seconds. `getDuration()`
"will return 0 until the video's metadata is loaded". `loadVideoById({videoId, startSeconds,
endSeconds})` swaps videos in the same player, and `cueVideoById` loads without playing. `onError` codes
**101/150 mean the owner disallows embedding**, 100 means not found, 153 means a missing Referer header.
Players need a viewport of at least 200×200 px. Scripted `playVideo()` can be blocked by browser autoplay
policy, which fires `onAutoplayBlocked`. The documented URL parameter for a start offset is `start`
(with `end`).
- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/player_parameters

**Data API.** `videos.list` with `part=contentDetails` returns `duration` as an ISO 8601 duration
(e.g. `PT15M33S`), and `contentDetails.caption` (true/false). `status.embeddable` says whether embedding
is allowed. Quota: projects get 10,000 units/day for most endpoints, plus separate allocations stated on
the overview page. A list read "usually costs 1 unit".
- https://developers.google.com/youtube/v3/docs/videos/list
- https://developers.google.com/youtube/v3/docs/videos
- https://developers.google.com/youtube/v3/getting-started
- https://developers.google.com/youtube/v3/determine_quota_cost
- ISO 8601 durations: https://en.wikipedia.org/wiki/ISO_8601

**Autoplay policy.** Chrome: muted autoplay is always allowed. Autoplay with sound requires prior user
interaction with the domain (or Media Engagement Index on desktop). A cross-origin iframe can autoplay
only if the parent delegates with `allow="autoplay"`. MDN's guide covers the same rules across browsers.
- https://developer.chrome.com/blog/autoplay
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay

**Up-next patterns.** Udemy's official help says the course player's autoplay "will play the next
lecture automatically" and is on by default, with a toggle under the gear icon. (Coursera's help article
on the same feature could not be verified — its help centre renders client-side only, so it was dropped.)
- https://support.udemy.com/hc/en-us/articles/229603648-How-to-Use-The-Course-Player-and-Start-Your-Course
- https://business-support.udemy.com/hc/en-us/articles/360024140354-How-to-Use-the-Course-Player-and-Start-Your-Course

**Actually-watched seconds.** `getCurrentTime()` alone overstates viewing, because seeking to the end
looks like completion. The robust method is to poll (about 1 s) while state = 1 (playing). For each tick,
add the covered interval `[prev, now]` to a set of watched intervals only if `0 < now − prev ≤ 2 ×
tick × playbackRate`. Larger jumps are seeks and are discarded. Then merge intervals and divide their
union by `getDuration()`. Count ENDED as complete only if coverage ≥ threshold (for example 80–90%).

**Thumbnails.** `https://i.ytimg.com/vi/<id>/mqdefault.jpg` (320×180, 16:9) returned 200 for a test ID.
It needs no API key and can be used for playlist rows. (This URL pattern is a long-standing de-facto
convention, not a documented API contract. Handle 404 with a placeholder.)

**Captions/transcripts.** `captions.download` "requires the user to have permission to edit the video"
(OAuth scope `youtube.force-ssl`, 200 quota units). So transcripts of other creators' videos are not
available through the official API. The YouTube Terms of Service forbid accessing the service "using any
automated means (such as robots, botnets or scrapers)" and downloading content except as expressly
authorised. The API Developer Policies add further constraints.
- https://developers.google.com/youtube/v3/docs/captions/download
- https://www.youtube.com/t/terms
- https://developers.google.com/youtube/terms/developer-policies

### Design implications for Oyelearn
- One persistent `YT.Player` per topic page. Switch playlist items with `loadVideoById({videoId,
  startSeconds})` instead of remounting iframes. Embed with `allow="autoplay; encrypted-media"`.
- On ENDED, show a 5-second "Up next" countdown with Cancel. Auto-advance only after a user gesture in
  the session, and keep a persisted Autoplay toggle (default on, as on Udemy). If `onAutoplayBlocked`
  fires, fall back to a Play button.
- Track watched intervals (seek-aware) and persist `watchedSeconds`/`coverage` per video. "Watched" =
  coverage ≥ 0.8, not ENDED alone.
- Admin Setup validates a pasted YouTube URL with one `videos.list?part=contentDetails,status,snippet`
  call (1 unit). It stores parsed `durationSeconds`, title and `embeddable`, and rejects non-embeddable
  videos up front. Errors 101/150 at runtime mark the video "broken" for admin review.
- Thumbnails from `i.ytimg.com/vi/<id>/mqdefault.jpg` with an `onerror` placeholder.
- No transcript fetching or scraping. AI "notes" for a video are generated only from its title and
  description, labelled as such. Each video carries `usedForQuestions: false`, so the quiz generator never
  claims to test video content it never saw.

---

## 5. Grounded question generation & item quality

**Grounding.** Retrieval-augmented generation (Lewis et al. 2020) conditions generation on retrieved
passages. For question generation that means every item cites the topic passage it was built from. Kurdi
et al.'s systematic review of automatic question generation for education finds that generated items are
under-evaluated for quality and difficulty. This is an argument for built-in validation, not just
generation.
- RAG: https://arxiv.org/abs/2005.11401
- Kurdi, Leo, Parsia, Sattler & Al-Emari (2020), IJAIED: https://link.springer.com/article/10.1007/s40593-019-00186-y

**Answerability / round-trip filtering.** Alberti et al. (ACL 2019) keep a generated QA pair only if an
independent QA model, given the context, recovers the same answer ("roundtrip consistency"). The same
pattern carries over to MCQs: a second, independent model call answers the item from the source passage
alone. It must pick the keyed option. It must also *not* be able to answer without the passage, when the
item claims to test that passage. Using LLMs as judges is workable but has known biases, notably
position bias, verbosity bias and self-enhancement (Zheng et al. 2023). Shuffle options and use a
different prompt or model for judging.
- https://aclanthology.org/P19-1620/
- https://arxiv.org/abs/2306.05685

**Distractors.** Gierl et al.'s review (Review of Educational Research, 2017) and Alhazmi et al.'s
survey (2024) treat plausible, homogeneous distractors that reflect real misconceptions as the main
quality lever. Distractors that are obviously wrong collapse an item to a guess between fewer options.
- Gierl, Bulut, Guo & Zhang (2017). DOI 10.3102/0034654317726529 (publisher 403; Crossref-verified).
- Distractor generation survey: https://arxiv.org/abs/2402.01512

**Item-writing rules.** Haladyna, Downing & Rodriguez (2002) reviewed textbook guidance and research to
produce 31 guidelines. The ones relevant here: keep options homogeneous and of similar length (avoid
the longest-option cue), avoid "all of the above", use "none of the above" sparingly, phrase stems
positively and avoid negatives (or emphasise them, e.g. **NOT**), vary the key position, keep each
item to one idea, and make every distractor plausible. Three well-built options are usually enough.
- Haladyna, Downing & Rodriguez (2002). *A Review of Multiple-Choice Item-Writing Guidelines for Classroom
  Assessment.* Applied Measurement in Education 15(3). DOI 10.1207/S15324818AME1503_5 (publisher 403;
  Crossref-verified).

**Classical test theory statistics.** Item difficulty *p* is the proportion answering correctly (UW's
ScorePak labels ≥85% easy, 51–84% moderate, ≤50% hard). Ideal difficulty for discrimination sits a
little above the midpoint between chance and 100%, about 74% for four options. Discrimination is the
point-biserial correlation between item score and total (rest) score, or the upper–lower index
(p_upper − p_lower using top/bottom groups, classically 27%). Low or negative discrimination flags a
miskey, ambiguity or a cue.
- https://www.washington.edu/assessment/scanning-scoring/scoring/reports/item-analysis/
- https://en.wikipedia.org/wiki/Item_analysis
- https://en.wikipedia.org/wiki/Point-biserial_correlation_coefficient

### Design implications for Oyelearn
- Generation contract: each item stores `sourceTopicId`, `sourceExcerpt`, `bloomLevel`, `key`,
  `distractorRationale[]`. The generator is given only grounded text (topic notes and admin SOP blocks),
  never video transcripts (see §4).
- Automated gate before an item is usable: (1) a schema/lint pass that rejects "all/none of the above",
  unemphasised negatives, duplicate options, and a key that is the uniquely longest option by more than
  about 30%. (2) An independent answerability check with shuffled options, which must select the key
  from the excerpt. (3) An ambiguity check: a judge must not find a second defensible option.
- Randomise option order at delivery and store the key by option ID, not index.
- Compute *p* and corrected point-biserial per item once n ≥ about 20 responses. Auto-flag items with
  p > 0.95, p < 0.25, or r_pb < 0.15 (negative means probable miskey). Flagged items leave
  personalised assessments until an admin reviews them. Retire them after edit (new version ID) to keep
  stats clean.
- Show the admin the flag *reason* and the item's stats inline, with one-click "edit", "retire" or "keep".

---

## 6. Admin simplicity

**Progressive disclosure.** NN/g: show the few options most users need first and move advanced
ones to a secondary layer. This improves learnability and reduces errors, as long as the split between
primary and secondary is right.
- https://www.nngroup.com/articles/progressive-disclosure/

**Smart defaults.** Users rarely change defaults ("users rarely utilize fancy customization features"),
so the default *is* the experience for most admins. Good defaults also act as just-in-time instructions.
- https://www.nngroup.com/articles/the-power-of-defaults/

**Undo over confirm.** Confirmation dialogs lose force through overuse ("If you cry wolf too many times,
people will stop paying attention"). Reserve them for serious, irreversible actions, make them
specific (name the thing), and prefer undo. This is heuristic #3, user control and freedom.
- https://www.nngroup.com/articles/confirmation-dialog/
- https://www.nngroup.com/articles/user-control-and-freedom/
- https://www.nngroup.com/articles/ten-usability-heuristics/

**Bulk entry via paste.** The `paste` event exposes `clipboardData`. Rows copied from a spreadsheet arrive
as tab-separated `text/plain` lines. The async Clipboard API is available too, but reading requires
permission, so handling the paste event inside a focused textarea or grid is the frictionless route.
- https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event
- https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API

### Design implications for Oyelearn
- Setup is one screen with three primary fields per person (name, department, goal text). Everything
  else (level overrides, custom prerequisites, weekly hours, video overrides) sits behind "More options"
  per row.
- Defaults come from the department: weekly hours, path template, assessment length. An admin who
  changes nothing still produces a sensible plan.
- Bulk add: a "Paste from sheet" textarea that parses TSV/CSV/newline lists (`name<TAB>email<TAB>dept<TAB>goal`).
  It previews parsed rows with per-row validation (unknown department, duplicate email, unmapped goal) before
  a single Commit.
- Destructive operations (remove learner, retire item, reset progress) act immediately with an
  8–10 s Undo toast. A confirmation dialog is used only for the truly unrecoverable bulk delete, and
  names the count and the people affected.
- Each AI step in Setup (goal→skills mapping, generated items) shows its result inline as editable
  chips. "Accept all" is the default and per-chip edit is optional, so the admin reviews rather than
  re-enters.

---

## Link verification log (2026-10-03)

**Kept: 71 verified URLs** (all HTTP 200 and the correct page). That is 70 linked pages above plus the
`i.ytimg.com/vi/<id>/mqdefault.jpg` pattern, tested with a real ID.

**Dropped or not linked:**
- `coe.int/.../the-cefr-descriptors`: 403 (Cloudflare challenge). Replaced by the CEFR global-scale page.
- `cft.vanderbilt.edu/.../blooms-taxonomy/`: redirects to the Vanderbilt home page (soft 404).
- `celt.iastate.edu/.../revised-blooms-taxonomy/`: 404.
- `link.springer.com/book/10.1007/978-3-540-25155-4` (*Learning Spaces*): 404.
- Coursera help articles on autoplay: one ID 404s, and the other renders client-side with no verifiable
  content.
- `eric.ed.gov/?id=ED053419` (Bloom 1968): blocked by a bot challenge. Not cited as a link.
- `nngroup.com/articles/bulk-actions-design-guidelines/`: 404.
- Semantic Scholar paper pages: returned 202 (not 200), so not used.
- `platform.openai.com/docs/guides/structured-outputs`: redirects to a page with no title in static HTML.
  Not used; the Claude structured-outputs page is cited instead.
- Publisher DOI landing pages for Krathwohl 2002, Doignon & Falmagne 1985, Bloom 1984, Kahn 1962,
  Haladyna et al. 2002, Gierl et al. 2017 and Yuksel et al. 2009 (Taylor & Francis / Elsevier / SAGE /
  ACM): 403 to automated fetch. They are cited as plain DOIs with metadata verified via the Crossref API.
