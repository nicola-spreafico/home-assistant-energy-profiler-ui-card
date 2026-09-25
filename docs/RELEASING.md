# Release checklist

1. Verify the card in a real Home Assistant dashboard with the current Energy Profiler integration: renamed entities, restricted-user fallback, disabled/unavailable sensors, more-info, themes, mobile and multiple cards.
2. Confirm the GitHub repository is public and has a description, topics and GPL license. Check HACS custom-repository installation using the committed bundle.
3. Update `package.json` version, regenerate `package-lock.json` with `npm install --package-lock-only`, and date the matching CHANGELOG entry.
4. Run `npm ci`, `npx playwright install chromium` and `npm run check`.
5. Commit source, documentation, lockfile and generated `dist/`; push the reviewed branch.
6. Create and push a matching tag, e.g. `v0.1.0`. This invokes the release workflow.
7. Inspect the **draft** GitHub release, attached JS and SHA256SUMS. Replace generated notes with the relevant CHANGELOG entry and publish when ready.

The workflow rejects a tag that does not match package.json, tests the card and checks that the committed bundle is reproducible before creating a draft. It does not publish releases automatically.

Manual installations use the single JS file; no build or npm installation is needed on Home Assistant. HACS can also use the committed `dist/` bundle.

Until the repository and bundle are pushed, installation instructions describe the intended distribution path rather than an already published release.
