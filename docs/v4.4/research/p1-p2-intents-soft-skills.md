# v4.4 research: P1 goal/intent extraction, P2 soft skills and spoken English

Researched 2026-10-05. Every link below was fetched and loaded during this research unless marked
"(not verified)". YouTube IDs were checked against `youtube.com/oembed` (title and channel returned,
so the video exists and can be embedded). Durations come from the watch page's `lengthSeconds`.

Fetch notes:
- coe.int returns 403 to WebFetch but 200 to a normal browser request. The Table 3 page and the
  Companion Volume PDF were fetched with curl and a browser user agent, then read in full.
- bbc.co.uk is blocked for WebFetch, so the BBC "English at Work" web page is not cited. BBC's
  YouTube videos were verified through oEmbed.
- hbr.org articles load but the body is partly paywalled. Title, author and opening were confirmed.
- GitLab handbook and the Atlassian sprint-review page load (title confirmed), but the fetcher only
  sees navigation, so their contents are not quoted.

---

## A. Extracting goals and intents from free text with an LLM

### Findings
1. **Schema-constrained output removes parse failures, not wrong content.** Claude structured outputs
   (`output_config.format`, JSON Schema) use constrained decoding, so the output is always valid JSON
   with the required fields. Limits: no recursive schemas, no `minLength`/`minimum`, at most 24
   optional params and 16 union-typed params per request. Enum casing can drift, so compare enums
   case-insensitively. Handle `stop_reason: "refusal"` and `"max_tokens"`: in both cases the output
   is not valid against the schema. Asking for step-by-step reasoning inside the JSON can trigger
   refusals, so ask for brief explanations.
   https://platform.claude.com/docs/en/build-with-claude/structured-outputs
2. **Ground each claim in a direct quote and retract it if no quote supports it.** Anthropic's
   guidance on reducing hallucinations: let the model say "I don't know", extract word-for-word
   quotes before analysing, and "If you can't find a supporting quote for a claim, remove that
   claim". It also suggests best-of-N consistency checks and restricting the model to the given
   text. https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
3. **The native citations feature cannot be combined with structured outputs.** The API returns a
   400 error if citations are enabled on a document and `output_config.format` is also set.
   Citations would otherwise guarantee `char_location` pointers into the source. In practice,
   with structured outputs we put a `source_quote` string field in the schema and check it
   ourselves with an exact substring match.
   https://platform.claude.com/docs/en/build-with-claude/citations
4. **Prompt structure.** Wrap the input in XML tags (`<goal_text>`, `<instructions>`,
   `<examples>`), give 3 to 5 varied examples, put long input above the instructions, and add a
   self-check ("before finishing, verify against [criteria]"). The docs warn that Opus 5 already
   checks its own work, so extra verification instructions can make it over-verify. Use a separate
   verification call instead of piling on instructions.
   https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
5. **Span grounding plus multiple passes is an established pattern.** Google's LangExtract maps
   every extraction to a `char_interval` in the source "for easy traceability". It runs
   `extraction_passes=3` to improve recall and requires few-shot example extractions to be quoted
   verbatim from the example text, in order of appearance. https://github.com/google/langextract
6. **A second, independent verification pass reduces hallucination.** Chain-of-Verification
   (Dhuliawala et al., Meta) has four steps: draft, plan verification questions, answer them
   *independently* of the draft, then revise. It reduced hallucinations on list-style and long-form
   tasks. The key point is that the verifier must not see the draft's reasoning.
   https://arxiv.org/abs/2309.11495
7. **Models rarely ask for clarification unless the pipeline makes them.**
   - "Knowing but Not Showing" (Su and Cardie): LLMs can recognise ambiguity when asked, but they
     "overwhelmingly default to direct answers". Adding retrieved context makes this worse.
     https://arxiv.org/abs/2605.25284
   - "Clarify When Necessary" (Zhang and Choi): splits the problem into *when* to ask, *what* to
     ask, and how to use the answer. Their intent-sim method estimates entropy over the possible
     user intents. Asking on only 10% of examples doubled the gains compared with asking at random.
     So ask selectively, based on how much the plausible interpretations disagree.
     https://arxiv.org/abs/2311.09469

### Recommended pipeline (goal text to intents)
1. **Extract.** One structured-output call. Each item has `{id, intent, category (enum from our
   checklist), source_quote, confidence: low|med|high, ambiguity_note?}`. The prompt includes the
   checklist of categories to look for, such as skills, roles, deadlines, tech stack, soft skills
   and English level. Each category gets "none found" as an allowed answer.
2. **Ground (code, no LLM).** Reject any item whose `source_quote` is not an exact substring of the
   input, after normalising whitespace and case. Store the char offsets so the UI can highlight
   them.
3. **Cover (second LLM call).** Give the model the input and the accepted items only, without the
   extractor's reasoning. Ask: "List any goal sentences or phrases not covered by an item, and any
   item not supported by its quote." This is the CoVe and multiple-pass idea in one cheap call.
   Merge the results and run the grounding check again.
4. **Clarify.** If an item has `confidence: low`, or the coverage pass finds an uncovered phrase
   with two or more plausible readings, generate one or two multiple-choice clarification questions
   that each cite the phrase. Never more than two per run. Otherwise proceed without asking.

---

## B. Soft-skill frameworks for engineers in agencies

- **Google Project Aristotle (re:Work).** It identified five team dynamics, in order:
  psychological safety, dependability, structure and clarity, meaning, and impact. "Team
  composition matters less than team dynamics."
  https://rework.withgoogle.com/intl/en/guides/understand-team-effectiveness
- **Engineering Ladders** (developer radar). Five axes: Technology, System, People, Process and
  Influence.
  - People goes Learns, Supports, Mentors, Coordinates, Manages.
  - Process goes Follows, Enforces, Challenges, Adjusts, Defines.
  - Influence goes from subsystem, to team, to multiple teams, to company, to community.
  Good for levelling soft skills by observable behaviour. https://www.engineeringladders.com/
- **Dropbox Engineering Career Framework.** Four pillars: Results, Direction, Talent and Culture.
  Levels differ by scope, collaborative reach and levers for impact. It is explicitly not a
  checklist. https://dropbox.github.io/dbx-career-framework/
- **Atlassian Team Playbook.** 95 free plays. The ones relevant to agency work are Working
  Agreements, Roles and Responsibilities, Retrospective, DACI and Stakeholder Communication Plan.
  https://www.atlassian.com/team-playbook/plays

Suggested Oyelearn soft-skill taxonomy for an agency: Communication (written, spoken, client),
Ownership (dependability and time), Feedback, Teamwork (psychological safety and agreements),
Listening and inquiry. Level each one with Engineering-Ladders-style verbs: learns, applies,
coaches, shapes.

---

## C. CEFR speaking descriptors (scoring rubric)

Sources:
- Council of Europe, CEFR Table 3 (CEFR 3.3), "Qualitative aspects of spoken language use":
  https://www.coe.int/en/web/common-european-framework-reference-languages/table-3-cefr-3.3-common-reference-levels-qualitative-aspects-of-spoken-language-use
- CEFR Companion Volume (2020), Appendix 3 "Qualitative features of spoken language (expanded
  with phonology)" and the Phonological control scales (pp. 133-135):
  https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4

The table below shortens the official wording. Keep the full CoE text in the rubric tooltip.

| Level | Range | Accuracy | Fluency | Interaction | Coherence | Phonology (CV) |
|---|---|---|---|---|---|---|
| **A2** | Basic sentence patterns and memorised phrases. Limited information in simple everyday situations. | Some simple structures correct, but still systematic basic mistakes. | Understood in very short utterances. Pauses, false starts and reformulation are very evident. | Answers questions and responds to simple statements. Rarely keeps a conversation going alone. | Links word groups with "and", "but" and "because". | Clear enough to be understood, but partners sometimes ask for repetition. Familiar words are clear. |
| **B1** | Enough language to get by on work, travel and current events, with some hesitation and circumlocution. | Reasonably accurate with frequent "routines" in predictable situations. | Keeps going comprehensibly. Pausing to plan and repair is very evident in longer stretches. | Starts, maintains and closes simple face-to-face conversations. Repeats back to confirm understanding. | Links short simple elements into a connected, linear sequence. | Generally intelligible. Accent is usually influenced by other languages but does not block understanding. |
| **B2** | Clear descriptions and viewpoints on most general topics without much searching for words. Some complex sentences. | Relatively high control. No errors that cause misunderstanding. Corrects most mistakes. | Fairly even tempo. Some hesitation but few long pauses. | Starts, takes turns and ends a conversation when needed, not always elegantly. Confirms understanding and invites others in. | A limited set of cohesive devices. Some "jumpiness" in long turns. | Appropriate intonation and stress. Accent has little or no effect on intelligibility. |
| **C1** | Broad range. Chooses a suitable formulation and style on professional topics without restricting what they want to say. | Consistently high accuracy. Errors are rare, hard to spot and usually self-corrected. | Fluent, spontaneous, almost effortless. Only conceptually hard topics slow them down. | Uses ready discourse phrases to get or keep the floor. Links own points skilfully to others'. | Clear, smoothly flowing, well-structured. Controlled use of connectors. | Full range of phonological features. Intelligible throughout. Some accent features remain but do not affect intelligibility. |

**On accent:** the Companion Volume replaced the 2001 phonology scale. It says the "focus on accent
and on accuracy instead of on intelligibility has been detrimental". Its key concept is
"intelligibility: how much effort is required from the interlocutor to decode the speaker's
message". Accent is mentioned at every level as something that may remain without lowering the
level (Companion Volume, p. 133). **Oyelearn must score intelligibility and listener effort,
never "native-likeness" or accent.**

---

## D. Workplace English and communication for developers

- **Plain language** (Digital.gov, the successor to plainlanguage.gov; plainlanguage.gov now
  301-redirects here). Use active voice, present tense, no hidden verbs ("we analyse", not "we
  conduct an analysis"), short words and short sections, written for a specific audience.
  https://digital.gov/guides/plain-language/writing (series index: https://digital.gov/guides/plain-language)
- **Email.** HBR, "How to Write Email with Military Precision" (Sehgal, 2016). Subject lines state
  the purpose and the action needed. Put the bottom line up front (BLUF).
  https://hbr.org/2016/11/how-to-write-email-with-military-precision
- **Status updates and stand-ups.**
  - Scrum Guide: the Daily Scrum is a 15-minute event for Developers to "inspect progress toward
    the Sprint Goal". It is not a status report to a manager. https://scrumguides.org/scrum-guide.html
  - Atlassian: done, next and blockers. Timebox it, park side topics, come prepared.
    https://www.atlassian.com/agile/scrum/standups
- **Explaining technical topics.**
  - Google Tech Writing defines good documentation as "knowledge and skills your audience needs
    minus their current knowledge". It warns about the curse of knowledge and about idioms when
    writing for global readers. https://developers.google.com/tech-writing/one/audience
  - Lucid's advice: know the audience, lead with impact, use visuals and stories, drop jargon,
    invite questions. https://www.lucid.co/blog/how-to-explain-technical-ideas-to-a-non-technical-audience
- **Listening and questions.**
  - Mind Tools active listening: pay attention, show it, reflect back ("What I'm hearing is..."),
    hold judgment, respond respectfully. https://www.mindtools.com/az4wxv7/active-listening
  - HBR (Zenger and Folkman): good listening is more than not interrupting.
    https://hbr.org/2016/07/what-great-listeners-actually-do
  - HBR (Brooks and John): questioning is a learnable skill, and follow-up questions in
    particular build rapport and get better information.
    https://hbr.org/2018/05/the-surprising-power-of-questions
- **Feedback.** SBI, from the Center for Creative Leadership: Situation, then observable
  Behaviour, then Impact, plus an optional Intent question ("What were you hoping to accomplish?").
  - https://www.ccl.org/articles/leading-effectively-articles/closing-the-gap-between-intent-vs-impact-sbii/
  - https://www.mindtools.com/ay86376/situation-behavior-impact-feedback-tool
  - LeeAnn Renninger's TED formula is compatible: micro-yes, then data point, then impact, then
    question.
- **Client communication.** Atlassian Stakeholder Communication Plan: map contributors and
  beneficiaries, then agree channel, cadence and content up front.
  https://www.atlassian.com/team-playbook/plays/stakeholder-communications-plan

---

## E. Videos and readings per soft skill

All primary and alternate IDs were verified through oEmbed on 2026-10-05.

| Skill | Video id | Title | Channel | Dur. | Readings |
|---|---|---|---|---|---|
| Spoken English for work | `i5KWMkGsPOk` | Working with someone new? - 36 - English at Work | BBC Learning English | 6:58 | [CEFR Companion Volume (PDF)](https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4); [British Council LearnEnglish: Business English](https://learnenglish.britishcouncil.org/business-english) |
| Workplace writing (email, Slack, docs) | `1XctnF7C74s` | 8 Email Etiquette Tips - How to Write Better Emails at Work | Harvard Business Review | 7:00 | [Digital.gov: Writing for understanding](https://digital.gov/guides/plain-language/writing); [HBR: How to Write Email with Military Precision](https://hbr.org/2016/11/how-to-write-email-with-military-precision) |
| Explaining technical work simply | `5q87K1WaoFI` | Computer Scientist Explains Machine Learning in 5 Levels of Difficulty | WIRED | 26:08 | [Google Tech Writing: Audience](https://developers.google.com/tech-writing/one/audience); [Lucid: Explain technical ideas to a non-technical audience](https://www.lucid.co/blog/how-to-explain-technical-ideas-to-a-non-technical-audience) |
| Stand-up and status updates | `er9gntPjTJU` | Daily Standups: How to Run Them - Agile Coach (2019) | Atlassian | 4:13 | [Atlassian: Standups](https://www.atlassian.com/agile/scrum/standups); [The Scrum Guide (Daily Scrum)](https://scrumguides.org/scrum-guide.html) |
| Client and team communication | `R1vskiVDwl4` | Celeste Headlee: 10 ways to have a better conversation | TED | 11:44 | [Atlassian: Stakeholder Communication Plan](https://www.atlassian.com/team-playbook/plays/stakeholder-communications-plan); [GitLab Handbook: Communication](https://handbook.gitlab.com/handbook/communication/) (title confirmed only) |
| Listening and asking good questions | `cSohjlYQI2A` | 5 ways to listen better, Julian Treasure | TED | 7:50 | [HBR: What Great Listeners Actually Do](https://hbr.org/2016/07/what-great-listeners-actually-do); [HBR: The Surprising Power of Questions](https://hbr.org/2018/05/the-surprising-power-of-questions) (also [Mind Tools: Active Listening](https://www.mindtools.com/az4wxv7/active-listening)) |
| Presenting and demoing | `-FOCpMAww28` | TED's secret to great public speaking, Chris Anderson | TED | 7:57 | [HBR: How to Give a Killer Presentation](https://hbr.org/2013/06/how-to-give-a-killer-presentation); [Atlassian: Sprint reviews](https://www.atlassian.com/agile/scrum/sprint-reviews) (title confirmed only) |
| Ownership and time management | `ljqra3BcqWM` | Extreme Ownership, Jocko Willink | TEDx Talks (TEDxUniversityofNevada) | 13:49 | [Mind Tools: Eisenhower's Urgent/Important Principle](https://www.mindtools.com/al1e0k5/eisenhowers-urgentimportant-principle/); [GitLab: Directly Responsible Individuals](https://handbook.gitlab.com/handbook/people-group/directly-responsible-individuals/) (title confirmed only) |
| Giving and receiving feedback | `wtl5UrrgU8c` | The secret to giving great feedback (LeeAnn Renninger), The Way We Work | TED | 5:02 | [CCL: SBI and intent](https://www.ccl.org/articles/leading-effectively-articles/closing-the-gap-between-intent-vs-impact-sbii/); [Mind Tools: SBI Feedback Tool](https://www.mindtools.com/ay86376/situation-behavior-impact-feedback-tool) |
| Teamwork and collaboration | `3boKz0Exros` | How to turn a group of strangers into a team, Amy Edmondson | TED | 13:07 | [Google re:Work: Understand team effectiveness](https://rework.withgoogle.com/intl/en/guides/understand-team-effectiveness); [Atlassian: Working Agreements play](https://www.atlassian.com/team-playbook/plays/working-agreements) |

### Alternate videos (one per skill, all verified)
| Skill | Video id | Title | Channel | Dur. |
|---|---|---|---|---|
| Spoken English | `eIho2S0ZahI` | How to Speak So That People Want to Listen, Julian Treasure | TED | 9:58 |
| Workplace writing | `SBTojgEHl90` | How to Write an Email (No, Really), Victoria Turk | TEDx Talks | 15:44 |
| Explaining simply | `vtIzMaLkCaM` | LEADERSHIP LAB: The Craft of Writing Effectively (Larry McEnerney) | UChicago Social Sciences | 1:21:51 |
| Stand-up | `MZdK4SX0mfI` | Daily Scrum Explained: A Better Way to Run It | Mountain Goat Software | 5:06 |
| Client and team communication | `OntE3tCaUR0` | How to Control Your Emotions During a Difficult Conversation | Harvard Business Review | 6:39 |
| Listening and questions | `fJrF1peewt4` | How to talk to customers properly, with Rob Fitzpatrick (The Mom Test) | Playbook | 1:05 (short clip) |
| Presenting and demoing | `Unzc731iCUY` | How to Speak (Patrick Winston) | MIT OpenCourseWare | 1:03:42 |
| Ownership and time | `n3kNlFMXslo` | How to gain control of your free time, Laura Vanderkam | TED | 11:54 |
| Feedback | `vmxHUiiHgNk` | How to Lead With Radical Candor, Kim Scott | TED | 15:24 |
| Teamwork | `LhoLuui9gX8` | Building a psychologically safe workplace, Amy Edmondson | TEDx Talks (TEDxHGSE) | 11:27 |

Also verified and available as spares:
- `arj7oStGLkU`: Tim Urban, "Inside the Mind of a Master Procrastinator", TED, 14:04
- `YLBDkz0TwLM`: "Radical Candor In 6 Minutes With Kim Scott", Radical Candor channel, 6:33
- `KN2jyw6D1ak` and `Aj-EnsvU5Q0`: BBC English at Work, episode 1 and the series intro

Rejected:
- `4yODalLQ2lM` (a Radical Candor talk re-uploaded by "FreshBooks University", not the original publisher)
- `p7QyuMTeDcM` (a small personal channel)
- Long podcast or workshop uploads (`WZGRXUXugeA`, `F1MOXg9M2sc`)

---

## Design implications for Oyelearn

1. **Use a two-call extraction followed by a deterministic grounding check.**
   - Call 1 extracts intents with structured outputs. Each item carries `source_quote`, a
     `category` enum and `confidence`.
   - Code then drops any item whose quote is not an exact substring of the input. This replaces
     the native citations feature, which cannot be combined with structured outputs.
   - Call 2 is the coverage verifier. It sees only the input and the accepted items, never the
     extractor's reasoning, and returns uncovered phrases and unsupported items.
2. **Use a checklist with "none found" allowed.** The extractor prompt lists every category the
   admin cares about (tech skills, soft skills, English target, deadline, role and seniority,
   project or client context). Each category must be answered, even if the answer is "none found".
   This puts recall into the schema itself, without relying on numeric constraints, which the
   schema does not support.
3. **Highlight in the UI.** Store char offsets and show each intent with its source phrase
   highlighted in the original goal text. Phrases that no intent covers are shown greyed out with
   an "add intent" action. This makes extraction auditable for admins.
4. **Ask for clarification selectively and keep it capped.** Ask only when confidence is low or
   the verifier flags two or more readings of one phrase. Ask at most two multiple-choice questions,
   each quoting the phrase. Models will not ask on their own (Su and Cardie), so the pipeline must
   force the decision.
5. **Run extraction tests.** Include a small golden set of admin goal texts with expected intents,
   and assert three things: every expected intent is found, every quote is grounded, and ambiguous
   cases trigger a clarification. Compare enums case-insensitively, and treat `refusal` and
   `max_tokens` as explicit error states.
6. **Soft-skill track structure.** Use the ten skills in section E as modules. Level them with
   behaviour verbs in the Engineering Ladders style (learns, applies, coaches, shapes), not with
   years of experience. Tag teamwork content with the Aristotle dynamics, especially psychological
   safety and dependability.
7. **Spoken-English scoring.** Use the six CEFR columns (Range, Accuracy, Fluency, Interaction,
   Coherence, Phonology) at A2, B1, B2 and C1 as the rubric. Score each column separately and report
   a profile, not a single number. Phonology is scored only as intelligibility and listener effort.
   Accent must never lower a score, and the copy should say so explicitly. Use "they" wording to
   match the Companion Volume.
8. **Rubrics for the practice tasks.**
   - Feedback exercises are graded on SBI(I): situation stated, behaviour observable, impact
     stated, intent asked.
   - Stand-up exercises are graded on done, next and blockers, kept within the time limit and tied
     to the sprint goal.
   - Writing exercises are graded on the plain-language checks: active voice, BLUF in the first
     line, a subject line with the action needed, no hidden verbs.
9. **Embedding.** All 20 primary and alternate IDs returned oEmbed data, so they can be embedded.
   Store the channel name and duration. Re-check with oEmbed at build time, because TED and BBC
   sometimes re-upload videos.
10. **Readings fallback.** HBR is partly paywalled, and GitLab and Atlassian pages render with
    JavaScript, so iframe previews will fail. Use the existing link-card fallback, and add a
    "may require sign-in" tag for hbr.org links.
