# Proctoring: manual test checklist

Every signal in brief §10.2, how to trigger it, and what should happen. Automated tests cover the
server's counting rules (`server/src/routes/assessment.test.ts`); this covers the half that needs a
real browser, a real camera and a real person.

Run it whenever the proctor engine changes, and once on any new deployment — camera behaviour
varies by browser and by machine far more than the rest of the app does.

## Setup

1. `npm run dev:seed -- --issue` — creates the three sample learners with a ready assessment each,
   and prints their temporary passwords.
2. Sign in as `priya.sharma`, change the password, and go to the assessment.
3. Open a second browser (or a private window) signed in as `admin`, on **Admin → Live**. Keep it
   visible: every row below says what should appear there.
4. Work through the pre-flight. Stop at the first step that does not behave as described.

Record the browser, OS and camera for each run. "Works on Chrome/Windows" is not the same claim as
"works".

---

## A. Pre-flight (§10.1)

| # | Step | Expected |
| --- | --- | --- |
| A1 | Open the assessment | Consent screen first. It says what is monitored, that video is processed **on the device**, that only still snapshots are uploaded and only when a warning fires, that the super admin sees them, and how long they are kept. |
| A2 | Click Cancel | Returns without starting. No camera permission was requested. |
| A3 | Agree, then deny camera permission | A clear explanation and a retry. The assessment does not start. |
| A4 | Allow camera | Live preview appears, mirrored. |
| A5 | Cover the camera | "No face" state; the 3-second countdown does not complete. |
| A6 | Have a second person enter frame | "More than one face" state; the countdown does not complete. |
| A7 | Sit centred, alone, still | Countdown completes in about 3 s and the calibration pose is recorded. |
| A8 | Sound check | The two-tone warning plays. It cannot be skipped without confirming. |
| A9 | Shrink the window below 1024 px | Blocked with an explanation. Restoring the width unblocks it. |
| A10 | On a tablet or phone | Blocked: desktop only. |
| A11 | With a second monitor attached | Soft warning about extended displays (where the browser supports `screen.isExtended`). |
| A12 | Start | Enters fullscreen, then the first item appears. |

---

## B. Browser signals (§10.2)

Each of these should: show the warning UI, appear in the admin Live feed within a second, and
increment the hard counter — **except** where the cooldown applies.

| # | Trigger | Severity | Expected |
| --- | --- | --- | --- |
| B1 | Switch to another tab | **hard** | Immediate. Full-screen modal: "Warning 1 of 3: you switched tabs." Tone plays. Item timer pauses while the modal is up. |
| B2 | Switch tabs again within 10 s | — | Recorded in the admin feed but **not counted**: the cooldown means one alt-tab is one strike. |
| B3 | Switch tabs after 10 s | **hard** | Counts. Counter goes to 2. |
| B4 | Alt-tab to another window for >2 s | **hard** | Counts (window blur). |
| B5 | Alt-tab for <1 s | — | No warning: below the 2-second threshold. |
| B6 | Press Esc to leave fullscreen | **hard** | Immediate. Questions are blocked behind a "return to fullscreen" button until fullscreen is restored. |
| B7 | Ctrl/Cmd+C on the question text | **hard** | Copy is prevented; nothing lands on the clipboard. |
| B8 | Ctrl/Cmd+X | **hard** | Same as B7. |
| B9 | Ctrl/Cmd+V into any answer field, **including a code item** | **hard** | Paste is prevented. Paste is never allowed — brief §18 answer 3. |
| B10 | PrintScreen | **hard** | Counts. The clipboard is cleared on a best-effort basis. **A browser cannot stop the screenshot itself** — see §10.7. |
| B11 | Right-click | soft | Context menu suppressed. Toast, no count. |
| B12 | Drag-select the question text | soft | Selection suppressed. Toast, no count. |
| B13 | Move the pointer off the window for >3 s | soft | Toast, no count. |
| B14 | Open DevTools | soft | Best-effort only. It may not fire in every browser; note which. |
| B15 | Repeat any **soft** signal three times within five minutes | **hard** | The third one escalates: modal, tone, counter increments. |

---

## C. Camera signals (§10.2)

These are debounced, so hold each condition for at least the stated duration. Each marked signal
uploads a snapshot; check it appears in the admin feed and opens.

| # | Trigger | Rule | Severity | Expected |
| --- | --- | --- | --- | --- |
| C1 | Hold a phone in frame | score ≥0.6 in 3 of 5 frames | **hard** | Counts, snapshot uploaded. Try face-on and edge-on; note which are detected. |
| C2 | Second person in frame for ≥3 s | sustained | **hard** | Counts, snapshot. |
| C3 | Second person for ~1 s | below threshold | — | No warning. |
| C4 | Leave frame for ≥8 s | sustained | **hard** | Counts, snapshot. |
| C5 | Leave frame for ~3 s | below threshold | — | No warning. |
| C6 | Cover the lens for ≥5 s | black frame, mean luma <12 | **hard** | Counts. |
| C7 | Unplug or disable the camera | track ended | **hard** | Counts immediately. |
| C8 | Look away ≥30° left or right for ≥4 s | sustained | soft | Toast, snapshot, no count. |
| C9 | Look down ≥25° for ≥4 s | sustained | soft | Toast, snapshot. Glance down briefly: should **not** fire. |
| C10 | Hold a book in frame | 3 of 5 frames | soft | Toast, snapshot. |
| C11 | A second laptop in frame | 3 of 5 frames | soft | Toast, snapshot. |

**False positives to note rather than fix blindly.** Lighting, glasses, a hat and camera angle all
affect C8/C9. Record the conditions under which the looking-away rule fires when it should not. An
integrity flag is evidence for a human, not a verdict (§10.7).

---

## D. Escalation and termination (§10.2, §10.3)

| # | Step | Expected |
| --- | --- | --- |
| D1 | Trigger one counted hard warning | Modal reads "Warning 1 of 3". |
| D2 | Trigger a second, of a different type | "Warning 2 of 3: … One more warning ends the assessment." |
| D3 | Trigger a third | The assessment **terminates**. The learner sees a clear end screen, not an error. |
| D4 | Check the admin Live feed | The row shows terminated, with all three events and their snapshots. |
| D5 | Check the learner's answers | Everything answered before termination is kept. |
| D6 | Wait for evaluation | It still runs, and the resulting report is flagged (brief §18 answer 2). |
| D7 | Check the item timer across D1–D3 | Paused while each modal was up, and the deadline extended by up to 60 s per warning — a warning must not cost them time. |

---

## E. Server authority (§9.4, §10.4)

These prove the parts a tampered browser cannot affect. Use DevTools deliberately.

| # | Step | Expected |
| --- | --- | --- |
| E1 | Edit the on-screen warning counter in the DOM | Nothing changes. The next event response carries the server's count, and the UI corrects itself. |
| E2 | Change the client timer | Nothing changes. `/next` and every answer re-check the server's deadline. |
| E3 | POST an answer for an item that was not the one served | 409. |
| E4 | POST an answer after the item's limit plus 5 s | 409, and the item is recorded as skipped with a score of zero. |
| E5 | Inspect the `/next` response | No `correctIndices`, `expectedOutput`, `hiddenTests`, `referenceSolution`, `rubric` or `rationale`. |
| E6 | Kill the browser mid-test and reopen | The same item is re-served. Progress is not lost, and no item is skipped. |
| E7 | Kill the browser and do not return | Within a minute the admin feed shows a missing heartbeat; within the time limit the assessment is auto-submitted and evaluated. |
| E8 | As a different learner, request this assessment's URL | 404, not 403. |
| E9 | As a learner, open `/api/admin/live` | 403. |
| E10 | As a learner, open a snapshot URL | 403. |

---

## F. What this cannot catch (§10.7 — state this honestly to learners)

A browser **cannot** block or detect:

- an OS-level screenshot or screen recording (PrintScreen is detected; the screenshot still happens),
- screen sharing to another person,
- a second device — a phone or laptop — outside the camera's field of view,
- someone else in the room who stays out of frame and off camera.

What is detected is the traces: focus loss, the PrintScreen key, a phone that comes into frame, and
looking away. Camera signals are probabilistic, which is why they are debounced and why snapshots
exist. **An integrity flag is evidence for a human to weigh, not a verdict.** The AI evaluation
reports integrity separately and never lowers a skill score because of it; the super admin decides
whether a re-test is warranted.

---

## Run log

Copy this block per run.

```
Date:
Browser / OS / camera:
Tester:
Pre-flight (A1-A12):
Browser signals (B1-B15):
Camera signals (C1-C11):
Escalation (D1-D7):
Server authority (E1-E10):
False positives observed:
Not working / needs follow-up:
```
