# GitHub Pages deployment

## Status

Publishing requested for the GitHub account `sahelimazumder`. The sanitized source package is prepared; account sign-in and the first successful Pages deployment are still pending. No public website link is verified yet.

## Publishable artifact and source boundary

- `src/data/public-bank.json` and `src/data/additions.json` contain independently authored practice, not imported source objectives.
- `private-data/`, `kit/`, retained `public/course/`, extracted `public/data/`, private workbenches, `.env*`, personal backups and local evidence tests are ignored. `src/data/bank.json` is a safe public copy; the richer local bank is selected from ignored private-data only in local mode.
- `npm run build:public` always selects the public bank and does not copy the public directory. A build-time audit scans output files and existing tracked paths for private attachment/extract locations and known source/secret markers.
- At preparation time `git ls-files` and `git remote -v` were empty: there is no tracked private history in this repository. Ignore rules do not remove files already committed elsewhere; run the audit again after staging/committing and before publishing.
- Personal class notes, answers, scores, imports and saved sheets exist in the visitor’s browser, not static assets. Export/import transfers them; there is no automatic cross-device sync.
- The clean source package under `release/github-pages-source/` contains an allowlisted source tree. Use it instead of uploading the entire private working folder. The release ZIP is a source package, not a deployed site.

## Steps in the chosen repository

1. Commit the sanitized source package to the intended repository. Keep the included ignore rules. Do not upload the private workspace or its normal local build.
2. In repository **Settings → Pages**, choose **GitHub Actions** as the build source.
3. Run the **Deploy public study app** workflow from Actions. It obtains the actual Pages base path, runs public tests, builds and audits `dist-public`, then uploads and deploys that artifact.
4. Open the URL returned by the successful deployment. Publication has not occurred until that workflow succeeds; there is no public URL to report yet.

The workflow runs on pushes to main and also supports a manual trigger, with minimal Pages deployment permissions. Configuration follows [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [Vite’s base-path guidance](https://vite.dev/guide/static-deploy.html#github-pages).

## Local verification of a repository subfolder

```powershell
$env:PAGES_BASE='/study-preview/'
npm run test:public
npm run build:public
npm run preview:public
```

Open http://127.0.0.1:5174/study-preview/. The example path is only a local test path; the deployment workflow derives the real repository path. Hash navigation keeps sessions and destinations within the static base path. This is a static application; its answer bank is downloadable and is unsuitable for secure invigilated exams.

## Optional services

The public app uses local self-checks for explanation meaning and rubric self-assessment for subjective work. Live AI grading is not configured. A separately secured server would be required for optional AI evaluation or generation; never use a `VITE_` variable for an API key. The static UI does not call a missing local AI route. The microphone uses browser speech recognition where available, may send audio to the browser/vendor service, starts only on an explicit click and saves only an editable transcript. Live microphone capture was not exercised during verification.
