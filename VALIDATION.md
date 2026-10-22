# Verification — 22 October 2026

The application was modified in place. The original browser storage key and question IDs were retained, and the richer local source bank was preserved separately from the public bank.

## Checks

- Local suite: 90 tests in six files. Public-safe suite: 36 tests in three files.
- TypeScript compilation, local production build and public subfolder build are checked separately.
- Public content contains 97 independently authored validated questions and six cases. The full 90-minute/150-mark practice preference can be assembled from that pool; rubric totals and pending subjective marks are tested.
- The output audit excludes attachments/extract directories, raw imported questions, quarantined text, source regression outputs, source workbenches and known secret/source markers. Tracked paths were checked; this repository currently has no tracked files or remote.
- The public build is tested at `/study-preview/`, using hash navigation. This path is only a local hosting test, not a claimed GitHub repository or published URL.
- A clean allowlisted source package was independently built and passed its public audit without the private bank or attachments. It is prepared under `release/github-pages-source/` for publishing without the private workspace.

## Browser journey checked

In the separate public-build storage origin, the following synthetic QA workflow was exercised:

1. Uploaded a Markdown file; edited title/chapter; corrected detected topics before learning.
2. Read a concept, submitted a typed explanation, inspected the expected explanation/checklist and refreshed to recover the response.
3. Answered an MCQ incorrectly and another correctly, opened inline reference without losing answers, reviewed the mistake and observed honest no-fresh-retry guidance for an exhausted public concept pool.
4. Revealed/rated a relevant flashcard, finished and reopened the class, including its original notes, chapter and saved explanation.
5. Answered an MSQ and obtained 4/4 with the full correct set. Wrote a linked subjective case response and opened its criterion rubric/model reasoning.
6. Created, named and class-linked a SQL cheat sheet; saved it, refreshed and reopened it.
7. Selected a chart dataset, chose fields/calculation, saw feedback for an unsuitable pie chart on a time trend, used gradual help and rendered a valid column-chart alternative with computed monthly totals 40, 48, 44 and 55.
8. Tried an insufficient topic test and saw a pool error. Created a custom timed test, selected/flagged an objective answer, wrote a case response, refreshed and recovered the answer/flag/deadline/text, then submitted. The report showed objective 4/4, subjective Pending /15 and no invented combined total.

Mobile Home, the five-stage workspace, Charts and saved cheat sheets were checked at 390×844 with no document-level horizontal overflow. The six-item menu opened accessibly and Escape closed it. Desktop workspace was inspected at 1440×1000; screenshot evidence is retained locally in artifacts/.

Migration tests cover four-stage backups, class chapters, editable profile, teach-back drafts, saved sheets, chart choices, test position and previous notes. Assessment checks recompute new join counts, interaction predictions and weighted margins. Chart checks accept multiple appropriate choices and reject incorrect axes, aggregation or grouping. Cheat-sheet checks distinguish Python in-place methods, pandas row/nonmissing counts and Power BI calculation systems, and reject unsupported requests.

## Limits

- Explain it back uses the current summary’s topic headings, sentence starters, a plain explanation, and word-cue suggestions tied to the learner’s response. It does not infer correctness from matching words. Topic-matched validated MCQs provide objective feedback separately from test marks; unsupported topics keep the recap without unrelated questions. Legacy explanations and checklist records remain in class history. No live AI meaning evaluator or AI subjective grader is configured.
- Speech input is optional and browser dependent. Mock recognition tests cover connecting/listening, replacement of interim transcripts without duplicates, stop, errors, stalled-start and stalled-stop recovery, and cleanup after topic navigation. The UI explains potential browser/vendor audio processing and editable transcripts. Live microphone capture was not exercised; no user audio was recorded or sent.
- Topic matching and cheat-sheet assembly are curated offline retrieval, not unrestricted generation. There are 36 curated practice-bank concept matches; source topic headings are extracted independently and are not limited to that registry. Unknown topics, sparse question sets and exhausted fresh-retry pools are disclosed.
- Case assessment is rubric-guided self-assessment. It is not instructor verification. Imported drafts remain excluded until reviewed.
- Browser storage does not sync across devices; backups are needed for transfer. The application is not a secure examination server.
- Existing dependency-annotation and bundle-size warnings remain. The PDF worker and full chart library contribute to the build size; no unnecessary dependencies were added.
- A GitHub account/repository was not identified, so no public deployment or public URL is claimed. See DEPLOYMENT.md for the exact remaining steps.


## Current-class scope correction (22 October 2026)

The topic picker is limited to concepts detected in the submitted summary. It no longer exposes the course catalogue or adds earlier-topic recall. Explicit background/history and future Markdown sections are excluded from detection. Existing unstarted plans are scoped again on opening and before starting; completed and active attempt histories remain unchanged. In-session references no longer expand entire course-module lessons.

Validation: 74 local tests and 25 public-safe tests passed; local and public production builds and privacy audit passed. Five regression cases cover section scoping, earlier-class isolation, off-summary selections, old proposed plans, and unsupported summaries. Browser verification used a new summary with previous primary keys/regression/governance, current LEFT JOIN and future probability: only Joins appeared; deselect/reselect worked; searching regression returned no matching topic. Screenshot: artifacts/session-topics-only.png.


## Shared class workflow, source-topic reader and chart continuation

A saved Study class / chapter selector persists across navigation and backup reload. Home paste/upload selects that class; explicit session numbers label its pages. Practice and tests list source-summary topics only. Old class plans are not merged into current topic detection. New test snapshots and resulting objective activities keep their original class identity. Old attempts remain immutable and are accessible through all-course browsing. Flashcards, lessons, reference pages, mistakes, class history, chart choices and saved sheets use the same class focus.

Summary reading is distinct from assessment coverage. Markdown headings, numbered sections and title/definition bullets supply the source topic order; container labels such as Overview and Main Topics are not reported as missing subjects. Each topic has four recap lines, Previous/Next and a jump selector, plus its original summary excerpt. Familiar Python terms receive verified explanatory support; unsupported topics retain extractive text and disclose unavailable details. Reading a topic does not require a scored question to exist.

Added 12 independently authored Python/pandas questions (8 MCQ, 4 MSQ), 8 reference entries, 4 cards and one 15-mark case with 3 subquestions and criterion-level rubrics. All 12 authored calculation fixtures were executed with Python and matched their expected results; schema, option-answer scoring and case rubric sums are checked by the test suite. Official conceptual support: Python tutorial data structures/control flow and pandas GroupBy documentation. This covers basic calculations/types, list methods, loops/conditions and grouping; arbitrary Python topics do not claim complete scored coverage.

Browser verification on isolated local preview storage: pasted a synthetic Session 13 summary with six explicit topics and earlier-course background; read Variables and Assignment then Integer with four lines each; Practice listed only the six source topics and Python question pool; a 5-question timed test and submitted 4/20 report both retained Session 13; a scoped 8-row cheat sheet was previewed and saved. A summary without chart coverage showed an honest gap. Explicit All course content restored all chart datasets. Generated a fresh category chart, observed Create Next Chart after success, and clicked it: Advertising became the next dataset at Step 1, with blank chart input and no old success message. Completed chart runs are kept in backup-compatible history; draft inputs are keyed per class.

Local proof images: artifacts/session-13-topic-recap.png and artifacts/create-next-chart.png. Existing bundle-size and dependency-annotation warnings remain nonfatal.


## Persistent Windows local hosting

Replaced the foreground-only launch command with a current-user Windows Task Scheduler installation called IIM Ranchi Study Hub. Its interactive logon trigger uses the current Windows account, limited privileges, an unlimited task execution duration, battery operation and retry settings. Windows runs a hidden launcher that waits for the Node supervisor. The supervisor serves the production build on the existing 127.0.0.1:5173 origin, restarts its own failed server child after two seconds, and checks child health. It does not depend on a Codex terminal process. Startup checks source/build metadata and builds only when needed. No administrator role, firewall rule, credential or public binding is added.

Verification: 87 local tests pass, including 5 new actual-HTTP checks for health, static/SPA serving, HEAD requests, PDF byte ranges, traversal/write protection and the unchanged optional AI endpoint. TypeScript and the local production build pass. The installed task was observed running (state 4), with execution limit PT0S, sign-in trigger type 9 and battery operation enabled. A controlled test verified the current server command line, stopped only that server PID, observed a different healthy PID within a few seconds, and fetched the homepage with HTTP 200. This test did not edit browser storage or user answers. Windows sign-in behavior is configured and inspected; the computer was not rebooted or signed out during verification.

Controls: START_STUDY_HUB.cmd / npm start, npm run status, STOP_STUDY_HUB.cmd / npm stop, npm run disable:autostart. Runtime metadata and logs are ignored under .runtime/. The computer must be awake and the user signed in; a powered-off or sleeping computer cannot serve its local website.


## Blank Home with explicit recovery

Home no longer initializes its composer from studyClassId, currentSessionId or the newest saved summary. It creates a fresh unsaved ID on each ordinary Home mount, including browser refresh and navigation back to Home. Only an explicit reopen action or an explicit edit-summary navigation focus loads an existing record. The class-focus panel remains on study-tool pages and is hidden on Home. Opening Home does not clear or overwrite the stored study focus used by other tools.

The most recently saved nonempty summary has a separate Open last class summary button and View saved progress action. Saved classes remain available in a collapsed list. Explicitly reopened notes are labelled, and Start a new blank summary changes only the current form ID. Autosave still saves newly pasted notes independently; later visits start empty and make the saved draft available through explicit recovery.

Three render regressions cover a blank form with saved Class 13/Class 30 history, blank re-entry/refresh with an unfinished autosaved draft, and explicit restoration versus invalid focus IDs. Browser verification used isolated preview storage: pasted Class 30, navigated Practice → Home, refreshed, observed empty text and metadata and a Class 30 recovery card; clicked recovery to load exactly the saved text; clicked Start a new blank summary and observed the empty form with the original recovery card still available. Browser error log was empty. Proof: artifacts/blank-home-last-class.png. The running private site was rebuilt at its unchanged 127.0.0.1:5173 origin without stopping its Windows background task.


### Guided explanation update (22 October 2026)

Browser verification reproduced the reported beginner sentence, displayed timing/leakage guidance, checked a wrong choice, retried the correct choice, and restored the saved answer after refreshing. The recap and Explain step use the same source topic names. Quick-check answers are saved with their question snapshot; original test marks remain separate. Automated suite: 100 tests across six files; public-safe suite: 46 tests across three files. Production TypeScript/build and public privacy audit pass. Live microphone input still requires testing with the learner’s actual device and browser.
