# v4.4 research

The full notes, with verified links, are in `research/`. This page records the decisions they led to.

## Phase 1: nothing in the description gets dropped
Source: `research/p1-p2-intents-soft-skills.md` §A.

**Extraction:**
- The AI returns a list in a fixed structure.
- Each item quotes the exact source phrase it came from. Code drops any item whose quote isn't a real substring of the description, so the grounding is ours.
- A checklist lists every category of goal, and the AI must answer each one. "None" is a valid answer.

**Coverage check:**
- Runs **in code**: every meaningful phrase must overlap a kept item.
- The optional second AI pass (Chain-of-Verification, arXiv 2309.11495) only adds suggestions. It never removes a check.

**Asking the admin:**
- We ask only when a phrase stays unmapped, or when it has two or more readings.
- Each question offers 2–3 options and quotes the phrase.
- Models rarely ask on their own (arXiv 2311.09469), so code decides when to ask.

## Phase 2: soft skills
Source: `research/p1-p2-intents-soft-skills.md` §B–E.

**Frameworks:**
- Project Aristotle, Engineering Ladders, the Dropbox career framework and the Atlassian Team Playbook.
- Levels describe behaviour ("learns, applies, coaches, shapes"), not years of experience.

**English levels:**
- The levels come from the Council of Europe CEFR descriptors: Table 3 (range, accuracy, fluency, interaction, coherence) and the Companion Volume.
- Each aspect is scored separately, giving a profile.
- Clarity is judged on how easily the listener understands, never on accent.

**Practice rubrics:**
- Feedback: SBI (situation, behaviour, impact).
- Stand-ups: done, next, blockers (Scrum Guide, Atlassian).
- Writing: digital.gov plain-language checks, with the main point first.

**Videos and readings:**
- One verified video and one alternate per skill, all confirmed by YouTube's embed check.
- Two readings per skill.
- HBR, GitLab and Atlassian pages can't be shown inside the app, so they use the link card.

## Phase 3: Speak items
Sources: `research/p3-p4-p6-speech-scoring-copy.md` §A–D and `research/whisper-benchmark.md`.

**Recording:**
- `MediaRecorder` tries webm/opus, then ogg/opus, then mp4.
- The microphone needs HTTPS.
- Each permission error gets a plain message, and "Type your answer instead" is always offered.

**Speech-to-text:**
- whisper.cpp server (`ghcr.io/ggml-org/whisper.cpp`), using the `base.en` model.
- It has an OpenAI-shaped `/v1/audio/transcriptions` endpoint, and `--convert` turns webm into WAV.
- `verbose_json` returns word timings.
- Estimated time for a 90 s clip on 2–4 vCPU: 6–15 s. The local measurement goes in the benchmark note.

**Rejected:** the browser's Web Speech API. Audio goes to a third party, Firefox doesn't support it, and it gives no timings.

**Fluency numbers are advice only:**
- Words per minute, in a band of 100–170.
- Pauses of 1 s or more.
- Filler counts, labelled "approximate" because Whisper drops um and uh.

## Phase 4: full marks when the answer is good
Source: `research/p3-p4-p6-speech-scoring-copy.md` §E.

**Grading:**
- "Meets the standard / Not yet", as in competency-based grading.
- The AI grader writes its observations first, then gives a verdict.
- It sees 2–3 example answers, one of them a borderline pass.
- It is told to give full marks when the answer does the job.

**Lenient code comparison:** whitespace is collapsed, numbers are compared with a tolerance, and key order is ignored (Kattis's default checker, Jest's `toBeCloseTo`).

## Phase 6: plain language
Source: `research/p3-p4-p6-speech-scoring-copy.md` §F.

**Writing:**
- Readable at about age 9–11 (US grade 6–8), with sentences of 20 words or fewer, in the active voice.
- No unexplained jargon (digital.gov, the GOV.UK style guide).

**Long tasks:**
- Show a step list with ticks, and say what happens next.
- After 10 s, show progress (NN/g).

**Errors:**
- Say what happened and what to do.
- Never blame the admin, and keep what they typed (NN/g).
