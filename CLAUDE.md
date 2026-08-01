# ScoreKeeper

## Changelog

`/changelog` is a public page backed by `src/data/changelog.ts`. It cannot read git history at runtime, so entries are hand-curated — nothing shows up there automatically just because code was committed.

**When you ship a user-facing feature or improvement, add an entry to `src/data/changelog.ts` as part of that same change** (same commit/PR, not a follow-up pass). Skip entries for internal refactors, dependency bumps, config changes, or bugfixes invisible to users.

- Write the `title`/`description` in plain, user-facing language — not the commit message or implementation detail.
- `category` is `'feature'` for something new, `'improvement'` for a change to something existing, `'fix'` for a user-visible bug fix worth calling out.
- New entries go at the top of the array (list is newest first) with today's date.
- Screenshots are optional: drop the image in `src/assets/changelog/` and set `screenshot` to its filename (e.g. `'target-scores.png'`). Keep it a real screenshot of the shipped feature, not a mockup.
