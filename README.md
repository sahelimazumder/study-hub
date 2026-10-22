# Business Analytics Study Hub

A beginner-friendly React/TypeScript application for class notes, guided learning, practice and revision. Profile branding is editable; assessment design follows the reasoning patterns in the supplied IIM Ranchi examples, without claiming official institute questions or examination predictions.

## Run locally

Requires Node.js 22.12 or later (Node 24 is used in deployment).

On Windows, double-click `START_STUDY_HUB.cmd` or run:

```powershell
npm start
```

This checks/builds the local application and installs a **current-user Windows sign-in task** called **IIM Ranchi Study Hub**. The task runs a hidden background supervisor independently of Codex, starts automatically when you sign in, has no execution timeout, and is allowed on battery power. The supervisor restarts a crashed server after about two seconds. Windows also retries a failed supervisor. No administrator account, password, firewall exception or public hosting is configured.

Open **http://127.0.0.1:5173/** on this computer. Keep using the same hostname, port and browser profile to retain access to existing notes and tests. You can close the launcher, browser or Codex window; none of them owns the background task. The computer must be awake and you must be signed in. After a shutdown/restart the task starts again at your next Windows sign-in. First launch after source changes can take longer while the local build is refreshed.

Useful controls:

```powershell
npm run status              # Check the Windows task and local health endpoint
npm stop                    # Stop this website; next sign-in/manual start can run it again
npm run disable:autostart    # Remove its Windows task and stop its processes
npm run test:server         # HTTP, range-download and private-file-boundary checks
```

`STOP_STUDY_HUB.cmd` also stops the website. Diagnostics are in `.runtime/server.log`; this ignored folder contains only runtime/build metadata and logs, not your browser study database. If this project folder is moved, disable the old task before installing startup from the new location. If the server cannot bind port 5173, it reports the conflict rather than silently changing your browser-storage origin.

For code development, `npm run dev` remains a temporary foreground Vite server: stop the background website first to free port 5173. Production serving uses `dist/`, so use `npm start` after editing source to rebuild it. Browser-local study does not require an API key. The optional local AI endpoint retains its existing configuration and explicit-consent behavior.

## Learning journey

- **Home:** opens a new, blank summary form on every visit and refresh. Use **Open last class summary** to explicitly restore the most recently saved nonempty summary, or expand saved summaries to choose another. Reopened notes are clearly labelled and offer **Start a new blank summary**. Returning to a blank form does not delete saved notes or progress. Paste plain text or Markdown, or upload `.md`/`.txt`; add an optional title, date and chapter. Notes autosave and select that class across study tools. Session/chapter numbers in pasted headings are recognized. Choose **Start learning from this class**, correct the topics and review content gaps before starting. The topic picker, recap, practice and cards use only this summary; previous classes and explicitly marked background/future sections are excluded. Earlier learning remains separately accessible in My Classes.
- **Understand → Explain it back → Practise → Review → Remember:** one activity at a time, with inline examples/reference, saved typed explanations, optional speech transcription, small relevant question sets, topic headings read directly from the summary, four-line recaps with source excerpts, distinct fresh retries when available and reveal-before-rating flashcards. Position, answer drafts and snapshots persist.
- **My Classes:** search title, topic, chapter or summary words; reopen original notes, lesson notes, teach-back, questions, mistakes, cheat sheets, cards and session history. Edited summaries create a new plan without changing past attempts.
- **Practice:** explicit MCQ, MSQ, subjective case and numerical choices; class/chapter/topic/difficulty filters. Scoring is disclosed. Subjective practice keeps written responses and shows model reasoning and criterion rubrics; no automatic subjective mark is invented.
- **Create a Test:** quick chapter preset, custom configuration or preferred full mock. The full preference is 90 minutes, 20 MCQs and 10 MSQs at 4 marks each, plus two 15-mark cases (150 total). Timer, flags, responses and current item persist. Feedback appears after submission. Pending subjective marks remain pending until rubric self-assessment.
- **Cheat Sheets:** prompt, supported topic, preview, editable seven-column table, title, optional class link, save/search/reopen and print. Fixed verified collections support SQL/PostgreSQL, Python lists, pandas grouping, Power BI, Tableau and course reference topics. Unsupported requests do not produce fabricated content.
- **Charts:** five small synthetic datasets; choose a chart, fields, aggregation and optional colour group step by step. Incorrect choices receive reasons and hints. Appropriate alternatives are accepted. Charts use computed values. After success, **Create Next Chart** saves the completed run, advances within the selected class’s available datasets, clears inputs and returns to Step 1. Chart inputs are separate for each class. Optional tool-specific instructions and an advanced lab remain available.

Settings contains editable display name/institution, appearance, timezone, local material imports and full JSON backup/restore. Browser storage belongs to this hostname, port and browser profile; it does **not** automatically sync across devices. Export a backup before clearing storage or moving browsers. No study answers or summaries are committed to this repository.

The **Study class / chapter** selector appears on the study-tool pages. Home keeps its new-summary form first, without displaying the previous class-focus panel. A chosen class limits practice topics, tests, report follow-ups, reference entries, flashcards, mistake history and chart exercises to its current summary. Choose **All course content** explicitly to browse the full course. Earlier saved sessions are never unioned into a new class’s topics. Topic headings and definition bullets are read from Markdown/text even when no question-bank match exists; the reader shows one topic and four short recap lines at a time. Familiar terms use verified plain-language explanations alongside original summary details; unfamiliar topics retain the supplied wording and disclose missing examples.

## Validation and content

Private local mode: 169 questions (96 MCQs, 54 MSQs, 15 numerical and 4 short responses), 9 cases, 16 lessons, 84 cards, 82 course references and 12 interpretation exercises. Public mode: 97 authored questions, 6 cases, 15 lessons, 84 cards and 82 references. Both include the new five-dataset guided chart workflow and 15 supplementary cheat-sheet rows. The six earlier scenarios and twelve Python/pandas questions have answer/rationale checks and deterministic checks for SQL row counts, weighted margins and model predictions. No question is claimed examiner-reviewed.

```powershell
npm test
npm run test:public
npm run build
$env:PAGES_BASE='/study-preview/'
npm run build:public
npm run preview:public
```

`npm test` runs all local evidence tests when the private bank is present; a clean public checkout runs the public-safe suite. The public preview uses port 5174. See [VALIDATION.md](VALIDATION.md) for actual results and limits.

## Public deployment

Read [DEPLOYMENT.md](DEPLOYMENT.md). Deploy only `dist-public`, never the ordinary local `dist` or the entire working folder. The public build disables copying `public/` and uses an authored-only content bank. Original attachments, extracts, source model output, private workbenches, credentials, downloads and study progress are excluded. There is no configured remote or identified GitHub repository in this working copy, and no public deployment is claimed.

The GitHub workflow is manual so publication is deliberate. It derives the repository base path, runs public checks, builds/audits the static artifact and deploys with GitHub Pages. API secrets stay on a separate server; GitHub Pages does not execute the optional local AI route. Speech may use a browser/vendor service and starts only after the learner presses Speak my answer; typing is always available. Audio is not stored by this app. Explain it back follows the topic headings in the current class summary. It provides a sentence starter, a simple model, word-cue writing suggestions, and a topic-matched validated quick check when available. Paragraphs receive no semantic AI grade; quick checks give answer-specific feedback separately from test marks. Speech shows connecting/listening states, live editable transcription after stopping, and actionable permission/device/network errors; a stalled start times out after 12 seconds.

## Supplementary references

The new supplementary reference tables and tool guidance were checked against [Python data structures](https://docs.python.org/3/tutorial/datastructures.html), [pandas grouping](https://pandas.pydata.org/docs/user_guide/groupby.html), [Power BI calculation choices](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-calculations-options) and [Tableau shelves](https://help.tableau.com/current/pro/desktop/en-us/buildmanual_shelves.htm). They are supplementary beginner guidance, separate from the supplied course coverage.
